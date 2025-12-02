import argparse
import json
import sys
import logging
import os
import numpy as np
from backend.app.modules.gps.location_recognizer import LocationRecognizer
from backend.app.core import config

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Location Recognition Module")
    parser.add_argument("image_path", nargs="?", help="Path to the input image")
    parser.add_argument("--image", dest="image_arg", help="Path to the input image (alternative)")
    
    args = parser.parse_args()
    
    image_path = args.image_path or args.image_arg
    
    if not image_path:
        logger.info("No image path provided. Running default initialization test.")
        recognizer = LocationRecognizer(
            csv_file=str(config.DATA_DIR / 'dataset.csv'),
            image_folder=str(config.DATA_DIR / 'images'),
            cache_file=str(config.DATABASE_CACHE_PATH)
        )
        logger.info("LocationRecognizer initialized successfully")
        sys.exit(0)

    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}))
        sys.exit(1)

    try:
        recognizer = LocationRecognizer(
            csv_file=str(config.DATA_DIR / 'dataset.csv'),
            image_folder=str(config.DATA_DIR / 'images'),
            cache_file=str(config.DATABASE_CACHE_PATH)
        )
        
        result = recognizer.find_location(image_path)
        
        if result:
            def convert_numpy(obj):
                if isinstance(obj, np.integer):
                    return int(obj)
                elif isinstance(obj, np.floating):
                    return float(obj)
                elif isinstance(obj, np.ndarray):
                    return obj.tolist()
                return obj
                
            clean_result = {k: convert_numpy(v) for k, v in result.items()}
            print(json.dumps(clean_result))
        else:
            print(json.dumps({"error": "No location found"}))
            
    except Exception as e:
        logger.error(f"Error in main execution: {e}")
        print(json.dumps({"error": str(e)}))
        sys.exit(1)