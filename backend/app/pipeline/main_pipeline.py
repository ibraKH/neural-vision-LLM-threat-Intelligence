import subprocess
import json
import concurrent.futures
import uuid
import datetime
import os
import sys
import argparse
import logging

from backend.app.core import config

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

def run_module(script_name, args):
    command = [sys.executable, str(script_name)] + args
    logger.info(f"Running module: {script_name} with args: {args}")
    
    # Ensure PYTHONPATH includes the project root
    env = os.environ.copy()
    env["PYTHONPATH"] = str(config.BASE_DIR) + os.pathsep + env.get("PYTHONPATH", "")

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            encoding='utf-8',
            check=False,
            env=env
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

def run_pipeline(image_path):
    image_path = os.path.abspath(image_path)
    if not os.path.exists(image_path):
        logger.error(f"Image not found: {image_path}")
        return {"error": "Image not found"}

    # Define module paths using config
    modules_dir = config.BACKEND_DIR / "app" / "modules"
    
    modules = {
        "GPS": {
            "script": modules_dir / "gps" / "model.py",
            "args": [image_path]
        },
        "biometrics": {
            "script": modules_dir / "biometrics" / "main_biometrics.py",
            "args": ["--input", image_path]
        },
        "object_detection": {
            "script": modules_dir / "objects" / "main_objects.py",
            "args": [image_path, "--output", os.path.splitext(image_path)[0] + "_annotated.jpg"]
        },
        "ocr_environment": {
            "script": modules_dir / "ocr" / "main_ocr.py",
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

    # CCTV Retrieval (Dependent on GPS)
    gps_data = results.get("GPS", {})
    lat = gps_data.get("lat")
    lng = gps_data.get("lng")

    if lat is not None and lng is not None:
        cctv_script = modules_dir / "cctv" / "main_cctv_retrieval.py"
        # Ensure lat/lng are strings for command line arguments
        cctv_args = ["--lat", str(lat), "--lng", str(lng)]
        cctv_result = run_module(cctv_script, cctv_args)
        results["cctv_retrieval"] = cctv_result
    else:
        logger.warning("Skipping CCTV retrieval due to missing GPS data")
        results["cctv_retrieval"] = {"status": "skipped", "message": "Missing GPS data"}

    try:
        from backend.app.modules.reasoning import main_reasoning
        
        biometrics_data = results.get("biometrics", {}).get("matches", [])
        
        obj_det_data = results.get("object_detection", {})
        objects_list = []
        if "detections" in obj_det_data:
            objects_list = [
                obj.get("label") or obj.get("class_name") or obj.get("label_en")
                for obj in obj_det_data["detections"]
            ]
        
        ocr_data = results.get("ocr_environment", {}).get("text", [])
        
        cctv_data = results.get("cctv_retrieval", {}).get("cameras", [])
        
        context_data = {
            "biometrics": biometrics_data,
            "objects": objects_list,
            "ocr": ocr_data,
            "location": {"lat": lat, "lng": lng} if lat else None,
            "cctv": cctv_data
        }
        
        logger.info("Running reasoning engine...")
        reasoning_result = main_reasoning.analyze_incident(context_data)
        results["reasoning"] = reasoning_result
        
    except Exception as e:
        logger.error(f"Reasoning module failed: {e}")
        results["reasoning"] = {"status": "error", "message": str(e)}

    master_json = {
        "pipeline_id": pipeline_id,
        "timestamp": timestamp,
        "target_image": image_path,
        "modules": results,
        "system_status": "READY_FOR_REASONING",
        "language": "ar"
    }
    
    return master_json

def main():
    parser = argparse.ArgumentParser(description="Central Security Pipeline Orchestrator")
    parser.add_argument("--image", required=True, help="Path to the target image")
    args = parser.parse_args()
    
    result = run_pipeline(args.image)

    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
