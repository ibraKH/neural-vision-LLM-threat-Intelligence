import json
import os
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
# Ensure GOOGLE_API_KEY is set in your environment variables
if "GOOGLE_API_KEY" not in os.environ:
    print("WARNING: GOOGLE_API_KEY not found in environment variables.")

genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

def clean_json_response(text):
    try:
        start_index = text.find('{')
        end_index = text.rfind('}')
        if start_index != -1 and end_index != -1:
            return text[start_index : end_index + 1]
        return text
    except Exception:
        return text

def analyze_incident(context_data):
    # Initialize Gemini Model
    model = genai.GenerativeModel('gemini-flash-latest')
    
    system_prompt = """IDENTITY: You are Roya (Saudi Automated Quick Response), a strictly objective forensic AI. You analyze crime scene data.

LANGUAGE: Default to Modern Standard Arabic for every human-readable field. Keep classification codes in English for downstream sorting, but provide Arabic labels. Also include full English mirrors in *_en objects.

INPUT CONTEXT: You will receive JSON data containing:
biometrics, objects, ocr, location, cctv.

STRICT OUTPUT JSON FORMAT:
You must output a valid JSON object with EXACTLY this structure:
{
  "language": "ar",
  "incident_id": "UUID",
  "timestamp": "ISO_STRING",
  "classification": {
    "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    "domain": "SECURITY" | "MUNICIPAL" | "CIVIL_DEFENSE",
    "type": "STRING",
    "labels": {
      "priority_ar": "Arabic Priority",
      "domain_ar": "Arabic Domain",
      "type_ar": "Arabic Type"
    }
  },
  "report": {
    "summary": "Arabic tactical summary",
    "detailed_narrative": "Arabic formal paragraph",
    "visual_evidence": ["Arabic list"]
  },
  "report_en": {
    "summary": "English summary",
    "detailed_narrative": "English narrative",
    "visual_evidence": ["English list"]
  },
  "action_plan": {
    "recommended_unit": "Arabic Unit Name",
    "nearest_cctv": "ID",
    "notes": "Arabic notes"
  },
  "action_plan_en": {
    "recommended_unit": "English Unit Name",
    "nearest_cctv": "ID",
    "notes": "English notes"
  }
}
"""
    try:
        # Set safety settings to block few things as this is a security tool
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }

        generation_config = genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.0
        )

        chat = model.start_chat(history=[
            {"role": "user", "parts": [system_prompt]}
        ])
        
        response = chat.send_message(
            json.dumps(context_data),
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        raw_content = response.text
        cleaned_content = clean_json_response(raw_content)
        data = json.loads(cleaned_content)
        if isinstance(data, dict):
            data.setdefault("language", "ar")
        return data
        
    except Exception as e:
        print(f"Error in Gemini analysis: {e}")
        return {
            "error": "Failed to analyze incident",
            "details": str(e)
        }

if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Forensic Reasoning Engine")
    parser.add_argument("--input", help="Path to pipeline JSON output file")
    args = parser.parse_args()

    context_data = {}

    if args.input:
        try:
            # Try UTF-8 first
            try:
                with open(args.input, 'r', encoding='utf-8') as f:
                    pipeline_data = json.load(f)
            except UnicodeDecodeError:
                # Fallback to UTF-16 (PowerShell default)
                with open(args.input, 'r', encoding='utf-16') as f:
                    pipeline_data = json.load(f)
            
            modules = pipeline_data.get("modules", {})
            gps = modules.get("GPS", {})
            
            context_data = {
                "biometrics": modules.get("biometrics", {}).get("matches", []),
                "objects": [obj.get("class_name") for obj in modules.get("object_detection", {}).get("detections", [])],
                "ocr": modules.get("ocr_environment", {}).get("text", []),
                "location": {"lat": gps.get("lat"), "lng": gps.get("lng")} if gps.get("lat") else None,
                "cctv": modules.get("cctv_retrieval", {}).get("cameras", [])
            }
        except Exception as e:
            print(json.dumps({"error": f"Failed to read input file: {str(e)}"}))
            sys.exit(1)
    else:
        # Default Test Payload
        context_data = {
            "biometrics": [{"name": "Unknown", "match_confidence": 0.0}],
            "objects": ["Gun", "Mask", "Black Bag"],
            "location": {"lat": 24.7136, "lng": 46.6753},
            "cctv": ["Cam-01", "Cam-02"]
        }

    result = analyze_incident(context_data)
    print(json.dumps(result, indent=2, ensure_ascii=False))
