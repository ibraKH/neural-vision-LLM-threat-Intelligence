import sys
import json
import argparse
import datetime
import logging
import os
import re
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(stream=sys.stderr, level=logging.ERROR)
logger = logging.getLogger(__name__)

def analyze_text_context(text_list: List[str]) -> Dict[str, List[str]]:
    location_keywords = ["Street", "St", "Rd", "شارع", "طريق", "حي", "District", "Road"]
    sensitive_keywords = ["Bank", "Embassy", "بنك", "وزارة", "Ministry", "Police", "شرطة"]
    
    location_markers = []
    sensitive_areas = []
    
    for text in text_list:
        if any(keyword in text for keyword in location_keywords):
            if text not in location_markers:
                location_markers.append(text)
        
        if any(keyword in text for keyword in sensitive_keywords):
            if text not in sensitive_areas:
                sensitive_areas.append(text)
                
    return {
        "location_markers": location_markers,
        "sensitive_areas": sensitive_areas
    }

def group_detections(detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not detections:
        return []

    def get_cy(box):
        return sum([p[1] for p in box]) / len(box)

    def get_ylims(box):
        ys = [p[1] for p in box]
        return min(ys), max(ys)

    sorted_dets = sorted(detections, key=lambda x: get_cy(x['box']))
    
    lines = []
    current_line = []
    
    for det in sorted_dets:
        if not current_line:
            current_line.append(det)
            continue
            
        last_det = current_line[-1]
        y1_min, y1_max = get_ylims(last_det['box'])
        y2_min, y2_max = get_ylims(det['box'])
        
        h1 = y1_max - y1_min
        h2 = y2_max - y2_min
        min_h = min(h1, h2)
        
        inter_min = max(y1_min, y2_min)
        inter_max = min(y1_max, y2_max)
        inter_h = max(0, inter_max - inter_min)
        
        cy1 = get_cy(last_det['box'])
        cy2 = get_cy(det['box'])
        
        if inter_h > 0.5 * min_h or abs(cy1 - cy2) < 0.5 * min_h:
            current_line.append(det)
        else:
            lines.append(current_line)
            current_line = [det]
            
    if current_line:
        lines.append(current_line)
        
    final_detections = []
    
    for line in lines:
        # Determine dominant language for sorting
        total_chars = sum(len(d['text']) for d in line)
        arabic_chars = sum(len(re.findall(r'[\u0600-\u06FF]', d['text'])) for d in line)
        is_arabic = (arabic_chars / total_chars > 0.5) if total_chars > 0 else False
        
        def get_cx(d):
            return sum([p[0] for p in d['box']]) / len(d['box'])
            
        line.sort(key=lambda x: get_cx(x), reverse=is_arabic)
            
        merged_text = " ".join([d['text'] for d in line])
        
        # Merge tags (Priority: SENSITIVE > LOCATION > COMMERCIAL)
        tags = [d['tag'] for d in line]
        if "SENSITIVE" in tags:
            final_tag = "SENSITIVE"
        elif "LOCATION" in tags:
            final_tag = "LOCATION"
        else:
            final_tag = "COMMERCIAL"
            
        avg_conf = sum([d['confidence'] for d in line]) / len(line)
        
        final_detections.append({
            "text": merged_text,
            "confidence": round(avg_conf, 2),
            "tag": final_tag
        })
        
    return final_detections

def main():
    parser = argparse.ArgumentParser(description="OCR Extraction for Scene Text")
    parser.add_argument("image_path", help="Path to the input image")
    args = parser.parse_args()
    
    image_path = args.image_path
    
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}, indent=2))
        sys.exit(1)

    try:
        # Initialize PaddleOCR (Arabic/English support, text orientation detection)
        ocr = PaddleOCR(use_textline_orientation=True, lang='ar', show_log=False)
        result = ocr.ocr(image_path)
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        sys.exit(1)

    raw_detections = []
    
    # Parse PaddleOCR result (handles both list of lists and list of dicts structures)
    if result:
        # New structure (dict)
        if isinstance(result, list) and len(result) > 0 and isinstance(result[0], dict) and 'rec_texts' in result[0]:
            data = result[0]
            for text, confidence, box in zip(data.get('rec_texts', []), data.get('rec_scores', []), data.get('dt_polys', [])):
                if confidence < 0.70 or len(text.strip()) < 2:
                    continue
                
                if hasattr(box, 'tolist'):
                    box = box.tolist()
                    
                raw_detections.append({
                    "text": text,
                    "confidence": float(confidence),
                    "box": box,
                    "tag": _determine_tag(text)
                })
        
        elif isinstance(result, list) and len(result) > 0 and isinstance(result[0], list):
            for line in result[0]:
                box = line[0]
                content = line[1]
                
                if isinstance(content, (list, tuple)):
                    text = content[0]
                    confidence = content[1] if len(content) > 1 else 1.0
                else:
                    text = str(content)
                    confidence = 1.0
                
                if confidence < 0.70 or len(text.strip()) < 2:
                    continue

                raw_detections.append({
                    "text": text,
                    "confidence": float(confidence),
                    "box": box,
                    "tag": _determine_tag(text)
                })

    final_detections = group_detections(raw_detections)

    environment_data = analyze_text_context([d['text'] for d in final_detections])

    output = {
        "meta": {
            "timestamp": datetime.datetime.now().isoformat(),
            "language_mode": "ar/en"
        },
        "environment_data": environment_data,
        "raw_detections": final_detections
    }

    print(json.dumps(output, indent=2, ensure_ascii=False))

def _determine_tag(text: str) -> str:
    loc_keys = ["Street", "St", "Rd", "شارع", "طريق", "حي", "District", "Road"]
    sens_keys = ["Bank", "Embassy", "بنك", "وزارة", "Ministry", "Police", "شرطة"]
    
    if any(k in text for k in loc_keys):
        return "LOCATION"
    elif any(k in text for k in sens_keys):
        return "SENSITIVE"
    return "COMMERCIAL"

if __name__ == "__main__":
    main()
