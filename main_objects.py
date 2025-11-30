import argparse
import json
import sys
import os
import cv2
from datetime import datetime
from ultralytics import YOLO

MODEL_NAME = "yolov8x-worldv2.pt" 

# Custom Vocabulary for YOLO-World
CUSTOM_VOCABULARY = [
    # Standard Objects
    "person", "man", "woman", "child",
    "bicycle", "car", "motorcycle", "bus", "truck", 
    "backpack", "handbag", "suitcase", "luggage",
    
    # Weapons - High Threat
    "knife", "kitchen knife", "dagger", "blade", "sharp object",
    "scissors", "shears",
    "gun", "pistol", "handgun", "revolver", "rifle", "shotgun", "firearm", "weapon", "assault rifle", "machine gun"
]

# Threat definitions
HIGH_THREAT_LABELS = {
    "knife", "kitchen knife", "dagger", "blade", "sharp object",
    "scissors", "shears",
    "gun", "pistol", "handgun", "revolver", "rifle", "shotgun", "firearm", "weapon", "assault rifle", "machine gun"
}

def calculate_threat(detections):
    detected_labels = [d['label'] for d in detections]
    threat_indices = set()
    
    has_high_threat = False
    for i, label in enumerate(detected_labels):
        if label in HIGH_THREAT_LABELS:
            has_high_threat = True
            threat_indices.add(i)
    
    if has_high_threat:
        return "HIGH", threat_indices

    return "LOW", set()

def main():
    parser = argparse.ArgumentParser(description="Security Object Detection Pipeline")
    parser.add_argument("image_path", type=str, help="Path to the input image")
    parser.add_argument("--output", type=str, default=None, help="Path to save the annotated output image")
    parser.add_argument("--conf", type=float, default=0.05, help="Confidence threshold")
    parser.add_argument("--imgsz", type=int, default=1280, help="Inference image size")
    args = parser.parse_args()

    try:
        model = YOLO(MODEL_NAME)
    except Exception as e:
        sys.stderr.write(f"Warning: Failed to load {MODEL_NAME}. Falling back to yolov8l-world.pt.\nError: {e}\n")
        try:
            model = YOLO("yolov8l-world.pt")
        except:
             model = YOLO("yolov8n.pt")

    if "world" in MODEL_NAME:
        try:
            model.set_classes(CUSTOM_VOCABULARY)
        except Exception as e:
            sys.stderr.write(f"Warning: Could not set custom classes: {e}\n")

    results = model.predict(
        args.image_path, 
        conf=args.conf, 
        augment=True, 
        verbose=False, 
        imgsz=args.imgsz,
        agnostic_nms=True,
        iou=0.5
    )
    
    result = results[0]
    
    annotated_img = result.plot()
    
    if args.output:
        output_path = args.output
    else:
        base_name = os.path.basename(args.image_path)
        output_path = f"detected_{base_name}"
        
    cv2.imwrite(output_path, annotated_img)
    
    parsed_detections = []
    
    for box in result.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        conf = float(box.conf[0])
        cls_id = int(box.cls[0])
        
        if hasattr(model, 'names'):
             label = result.names[cls_id]
        else:
             label = str(cls_id)

        parsed_detections.append({
            "label": label,
            "class_id": cls_id,
            "confidence": round(conf, 2),
            "box": {
                "x1": int(x1),
                "y1": int(y1),
                "x2": int(x2),
                "y2": int(y2)
            }
        })

    threat_level, threat_indices = calculate_threat(parsed_detections)

    final_detections = []
    for i, det in enumerate(parsed_detections):
        final_detections.append({
            "label": det["label"],
            "confidence": det["confidence"],
            "box": det["box"],
            "threat_tag": i in threat_indices
        })

    output = {
        "meta": {
            "timestamp": datetime.now().isoformat(),
            "model": MODEL_NAME,
            "output_image": output_path,
            "imgsz": args.imgsz
        },
        "summary": {
            "total_objects": len(final_detections),
            "threat_level": threat_level
        },
        "detections": final_detections
    }

    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
