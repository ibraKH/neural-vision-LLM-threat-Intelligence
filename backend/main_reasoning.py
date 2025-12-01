import json
import os
import openai

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
    client = openai.OpenAI(
        base_url="http://localhost:11500/v1",
        api_key="ollama"
    )
    
    system_prompt = """IDENTITY: You are 'SAQR-1' (Saudi Automated Quick Response), a strictly objective forensic AI. You analyze crime scene data.

INPUT CONTEXT: You will receive JSON data containing:

biometrics: (Who is there? Wanted/Unknown)

objects: (What is there? Weapons, Cars, Smoke)

ocr: (Where is it? Shop names, Street signs)

location: (GPS)

cctv: (Available Cameras)

PRIORITY MATRIX (For Backend Sorting):

CRITICAL: Weapon detected, Active Fight, Fire, Explosion, Terrorist Match (>90%).

HIGH: Wanted Person (Non-violent), Stolen Vehicle, Suspicious Package, Night-time Loitering.

MEDIUM: Infrastructure Hazard (Deep Pothole, Broken Streetlight), Vandalism.

LOW: Littering, Parking Violation, Noise Complaint.

ROUTING LOGIC:

SECURITY: Crimes, Weapons, Violence -> Send to 911.

MUNICIPAL: Potholes, Lights, Trash -> Send to 940 (Balady).

CIVIL_DEFENSE: Fire, Smoke -> Send to 998.

OUTPUT FORMAT (JSON ONLY - NO MARKDOWN): { "incident_id": "UUID", "timestamp": "ISO_STRING", "classification": { "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW", "domain": "SECURITY" | "MUNICIPAL" | "CIVIL_DEFENSE", "type": "STRING (e.g., ARMED_ROBBERY, POTHOLE_HAZARD)" }, "report": { "summary": "1-sentence tactical summary.", "detailed_narrative": "A formal paragraph describing the scene objectively. Mention specific evidence (e.g., 'Subject A holding object resembling a Glock 19').", "visual_evidence": ["List of items/text that justify the priority"] }, "action_plan": { "recommended_unit": "STRING (e.g., SWAT Team, Road Maintenance Crew)", "nearest_cctv": "ID of the closest camera from input" } }"""

    try:
        response = client.chat.completions.create(
            model="llama3.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(context_data)}
            ],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        raw_content = response.choices[0].message.content
        cleaned_content = clean_json_response(raw_content)
        
        return json.loads(cleaned_content)
        
    except Exception:
        return {
            "error": "Failed to analyze incident",
            "details": "Analysis failed"
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
            "ocr": ["Bank AlJazira", "ATM"],
            "location": {"lat": 24.7136, "lng": 46.6753},
            "cctv": ["Cam-01", "Cam-02"]
        }

    result = analyze_incident(context_data)
    print(json.dumps(result, indent=2))
