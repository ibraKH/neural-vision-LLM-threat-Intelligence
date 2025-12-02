import json
import os
import sys
import warnings
import base64
import argparse
from io import BytesIO
from datetime import datetime
import face_recognition
import numpy as np
from PIL import Image
from backend.app.core import config

class BiometricAnalyzer:
    def __init__(self, db_path="biometric_dataset"):
        self.db_path = db_path
        self.known_face_encodings = []
        self.known_face_names = []
        self.metadata = {}
        
        if not os.path.exists(self.db_path):
            os.makedirs(self.db_path)
            
        self._load_metadata()
        self._load_database()

    def _localize_identity(self, info, matched):
        name_en = info.get("name_en") or info.get("name") or "Unknown"
        name_ar = info.get("name_ar") or name_en
        description_en = info.get("description_en") or info.get("description")
        if not description_en:
            description_en = "Match found but no metadata available." if matched else "No match found in database."
        description_ar = info.get("description_ar") or (
            "تم العثور على تطابق بدون بيانات إضافية." if matched else "لم يتم العثور على تطابق في قاعدة البيانات."
        )
        location_en = info.get("location_en") or info.get("location") or "Unknown"
        location_ar = info.get("location_ar") or (location_en if location_en != "Unknown" else "غير معروف")
        id_number_en = info.get("id_number") or "Unknown"
        id_number_ar = info.get("id_number_ar") or (id_number_en if id_number_en != "Unknown" else "غير معروف")
        phone_en = info.get("phone_number") or "Unknown"
        phone_ar = info.get("phone_number_ar") or (phone_en if phone_en != "Unknown" else "غير معروف")

        return {
            "name": name_ar,
            "name_en": name_en,
            "description": description_ar,
            "description_en": description_en,
            "location": location_ar,
            "location_en": location_en,
            "id_number": id_number_ar,
            "id_number_en": id_number_en,
            "phone_number": phone_ar,
            "phone_number_en": phone_en,
            "is_wanted": bool(info.get("is_wanted", matched))
        }

    def _load_metadata(self):
        metadata_path = os.path.join(self.db_path, "metadata.json")
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    self.metadata = json.load(f)
            except Exception:
                pass

    def _load_image(self, path):
        try:
            img = Image.open(path)
            img = img.convert("RGB")
            return np.array(img)
        except Exception:
            return None

    def _load_database(self):
        if not os.path.exists(self.db_path):
            return

        valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp')
        
        for root, dirs, files in os.walk(self.db_path):
            for filename in files:
                if filename.lower().endswith(valid_extensions):
                    filepath = os.path.join(root, filename)
                    try:
                        img = self._load_image(filepath)
                        if img is None:
                            continue
                            
                        encodings = face_recognition.face_encodings(img)
                        
                        if encodings:
                            self.known_face_encodings.append(encodings[0])
                            self.known_face_names.append(filename)
                    except Exception:
                        pass

    def _save_face_crop(self, image_arr, box, face_id):
        try:
            crops_dir = config.CROPS_DIR
            crops_dir.mkdir(parents=True, exist_ok=True)

            top, right, bottom, left = box
            face_img = image_arr[top:bottom, left:right]
            pil_img = Image.fromarray(face_img)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"face_{timestamp}_{face_id}.jpg"
            filepath = os.path.join(crops_dir, filename)
            
            pil_img.save(filepath, quality=90)
            return os.path.abspath(filepath)
        except Exception:
            return None

    def detect_and_identify(self, img_path):
        result_json = {
            "meta": {
                "timestamp": datetime.now().isoformat(),
                "faces_detected": 0
            },
            "matches": []
        }

        if not os.path.exists(img_path):
            return result_json

        try:
            unknown_image = self._load_image(img_path)
            if unknown_image is None:
                return result_json
            
            face_locations = face_recognition.face_locations(unknown_image, model="hog")
            face_encodings = face_recognition.face_encodings(unknown_image, face_locations)
            
            result_json["meta"]["faces_detected"] = len(face_locations)
            
            for i, ((top, right, bottom, left), face_encoding) in enumerate(zip(face_locations, face_encodings)):
                filename = "Unknown"
                identity_info = {
                    "name": "غير معروف",
                    "name_en": "Unknown",
                    "description": "لم يتم العثور على تطابق في قاعدة البيانات.",
                    "description_en": "No match found in database.",
                    "location": "غير معروف",
                    "location_en": "Unknown",
                    "id_number": "غير معروف",
                    "id_number_en": "Unknown",
                    "phone_number": "غير معروف",
                    "phone_number_en": "Unknown",
                    "is_wanted": False
                }
                confidence = 0.0
                matched_flag = False
                
                if self.known_face_encodings:
                    matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding, tolerance=0.6)
                    face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
                    
                    best_match_index = np.argmin(face_distances)
                    
                    if matches[best_match_index]:
                        filename = self.known_face_names[best_match_index]
                        confidence = max(0.0, 1.0 - face_distances[best_match_index])
                        matched_flag = True
                        
                        if filename in self.metadata:
                            identity_info = self.metadata[filename]
                        else:
                            identity_info["name_en"] = filename
                            identity_info["name"] = filename
                            identity_info["description_en"] = "Match found but no metadata available."
                            identity_info["description"] = "تم العثور على تطابق بدون بيانات إضافية."
                            identity_info["id_number_en"] = "Unknown"
                            identity_info["phone_number_en"] = "Unknown"
                            identity_info["is_wanted"] = True

                identity_info = self._localize_identity(identity_info, matched_flag)

                box = {
                    "x": left,
                    "y": top,
                    "w": right - left,
                    "h": bottom - top
                }
                
                face_path = self._save_face_crop(unknown_image, (top, right, bottom, left), i)
                
                match_data = {
                    "face_id": i,
                    "identity": filename,
                    "info": identity_info,
                    "confidence": float(confidence),
                    "box": box,
                    "face_crop_path": face_path
                }
                
                result_json["matches"].append(match_data)

        except Exception:
            pass

        return result_json

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Biometric Identity Agent")
    parser.add_argument("--input", "-i", default=str(config.INPUTS_DIR / "target.jpg"), help="Path to input image")
    parser.add_argument("--db", "-d", default=str(config.BIOMETRIC_DATASET_DIR), help="Path to dataset directory")
    
    args = parser.parse_args()
    
    analyzer = BiometricAnalyzer(db_path=args.db)
    result = analyzer.detect_and_identify(args.input)
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    print(json.dumps(result, indent=2, ensure_ascii=False))
