import subprocess
import json
import concurrent.futures
import uuid
import datetime
import os
import sys
import argparse
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

def run_module(script_name, args):
    command = [sys.executable, script_name] + args
    logger.info(f"Running module: {script_name} with args: {args}")
    
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            encoding='utf-8',
            check=False
        )
        
        if result.returncode != 0:
            logger.error(f"Module {script_name} failed with exit code {result.returncode}")
            logger.error(f"Stderr: {result.stderr}")
            return {"status": "error", "message": f"Module failed with exit code {result.returncode}", "data": None}

        output = result.stdout.strip()
        if not output:
             logger.warning(f"Module {script_name} returned empty output")
             return {"status": "error", "message": "Empty output", "data": None}

        try:
            start_idx = output.find('{')
            end_idx = output.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = output[start_idx : end_idx + 1]
                data = json.loads(json_str)
                return data
            else:
                logger.warning(f"No JSON found in output of {script_name}")
                return {"status": "error", "message": "No JSON found", "data": None}
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode JSON from {script_name}: {e}")
            logger.debug(f"Raw output: {output}")
            return {"status": "error", "message": "JSON decode error", "data": None}

    except Exception as e:
        logger.error(f"Exception running {script_name}: {e}")
        return {"status": "error", "message": str(e), "data": None}

def main():
    parser = argparse.ArgumentParser(description="Central Security Pipeline Orchestrator")
    parser.add_argument("--image", required=True, help="Path to the target image")
    args = parser.parse_args()
    
    image_path = os.path.abspath(args.image)
    if not os.path.exists(image_path):
        logger.error(f"Image not found: {image_path}")
        print(json.dumps({"error": "Image not found"}))
        sys.exit(1)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    modules = {
        "GPS": {
            "script": os.path.join(base_dir, "model.py"),
            "args": [image_path]
        },
        "biometrics": {
            "script": os.path.join(base_dir, "main_biometrics.py"),
            "args": ["--input", image_path]
        },
        "object_detection": {
            "script": os.path.join(base_dir, "main_objects.py"),
            "args": [image_path]
        },
        "ocr_environment": {
            "script": os.path.join(base_dir, "main_ocr.py"),
            "args": [image_path]
        }
    }

    pipeline_id = str(uuid.uuid4())
    timestamp = datetime.datetime.now().isoformat()
    
    results = {}
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        future_to_module = {
            executor.submit(run_module, config["script"], config["args"]): name 
            for name, config in modules.items()
        }
        
        for future in concurrent.futures.as_completed(future_to_module):
            module_name = future_to_module[future]
            try:
                data = future.result()
                results[module_name] = data
            except Exception as e:
                logger.error(f"Module {module_name} generated an exception: {e}")
                results[module_name] = {"status": "error", "message": str(e)}

    master_json = {
        "pipeline_id": pipeline_id,
        "timestamp": timestamp,
        "target_image": image_path,
        "modules": results,
        "system_status": "READY_FOR_REASONING"
    }

    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(master_json, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
