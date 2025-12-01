import random
from typing import List, Dict, Any
MOCK_DB = {
    "suspect_123": {
        "name": "خالد العتيبي",
        "name_en": "Khalid Al-Otaibi",
        "home_address": {
            "lat": 24.7333,
            "lng": 46.8000,
            "name": "حي النسيم (المنزل)",
            "name_en": "Al-Naseem District (Home)"
        },
        "registered_asset": {
            "lat": 24.8105,
            "lng": 46.5208,
            "name": "استراحة العمارية",
            "name_en": "Al-Ammariyah (Istira'ah)"
        },
        "associates": [{
            "lat": 24.5700,
            "lng": 46.6900,
            "name": "السويدي (منزل ابن العم)",
            "name_en": "Al-Suwaidi (Cousin's House)"
        }]
    }
}

def get_suspect_profile(suspect_id: str) -> Dict[str, Any]:
    """Simulates retrieving suspect data from a secure government database."""
    return MOCK_DB.get(suspect_id, MOCK_DB["suspect_123"])

def interpolate_points(start: tuple, end: tuple, num_points: int = 20) -> List[List[float]]:
    """Generates a list of coordinates between start and end to simulate a path."""
    lat1, lng1 = start
    lat2, lng2 = end
    points = []
    
    for i in range(num_points + 1):
        t = i / num_points
        lat = lat1 + t * (lat2 - lat1)
        lng = lng1 + t * (lng2 - lng1)

        if 0 < i < num_points:
            noise_factor = 0.002
            lat += random.uniform(-noise_factor, noise_factor)
            lng += random.uniform(-noise_factor, noise_factor)

        points.append([lat, lng])
    
    return points

def predict_movement(start_coords: tuple, suspect_id: str = "suspect_123") -> Dict[str, Any]:
    """
    Predicts suspect movement based on profile and crime scene location.
    
    Args:
        start_coords: (Lat, Lng) of the crime scene.
        suspect_id: ID of the suspect.
        
    Returns:
        JSON with tracks, intercept points, and probabilities.
    """
    profile = get_suspect_profile(suspect_id)
    predictions = []
    highway_ramp = {
        "lat": start_coords[0] + 0.02,
        "lng": start_coords[1] + 0.01,
        "name": "مدخل الطريق الدائري الشمالي",
        "name_en": "Northern Ring Rd On-Ramp"
    }
    route_a_path = interpolate_points(start_coords, (highway_ramp["lat"], highway_ramp["lng"]), num_points=10)
    
    predictions.append({
        "route_id": "ROUTE-A",
        "type": "هروب",
        "type_en": "ESCAPE",
        "destination": highway_ramp["name"],
        "destination_en": highway_ramp.get("name_en", highway_ramp["name"]),
        "probability": 0.45,
        "color": "orange",
        "speed": "سريع",
        "speed_en": "FAST",
        "path": route_a_path,
        "intercept_points": [
            {"lat": route_a_path[5][0], "lng": route_a_path[5][1], "type": "نقطة تفتيش", "type_en": "CHECKPOINT"}
        ],
        "reasoning": "استجابة هروب فورية نحو طريق سريع يسمح بالانسحاب بسرعة.",
        "reasoning_en": "Immediate flight response towards high-speed infrastructure."
    })

    hideout = profile["registered_asset"]
    route_b_path = interpolate_points(start_coords, (hideout["lat"], hideout["lng"]), num_points=30)
    intercept_idx = 15
    intercept_pt = route_b_path[intercept_idx]
    
    predictions.append({
        "route_id": "ROUTE-B",
        "type": "مخبأ",
        "type_en": "HIDEOUT",
        "destination": hideout["name"],
        "destination_en": hideout.get("name_en", hideout["name"]),
        "probability": 0.89,
        "color": "red",
        "speed": "سريع",
        "speed_en": "FAST",
        "path": route_b_path,
        "intercept_points": [
            {"lat": intercept_pt[0], "lng": intercept_pt[1], "type": "نقطة إيقاف", "type_en": "INTERCEPT"}
        ],
        "reasoning": "البيانات التاريخية تشير إلى تردد المشتبه به على هذا الموقع. منطقة معزولة مناسبة للاختباء.",
        "reasoning_en": "Historical data indicates suspect frequents this location. Remote area suitable for hiding."
    })
    home = profile["home_address"]
    route_c_path = interpolate_points(start_coords, (home["lat"], home["lng"]), num_points=25)
    
    predictions.append({
        "route_id": "ROUTE-C",
        "type": "العودة للمنزل",
        "type_en": "HOME",
        "destination": home["name"],
        "destination_en": home.get("name_en", home["name"]),
        "probability": 0.15,
        "color": "yellow",
        "speed": "بطيء",
        "speed_en": "SLOW",
        "path": route_c_path,
        "intercept_points": [],
        "reasoning": "خيار واضح للغاية، ومن غير المرجح أن يعود المشتبه به إلى العنوان الأساسي المعروف.",
        "reasoning_en": "Too obvious. Suspect likely to avoid known primary residence."
    })
    predictions.sort(key=lambda x: x["probability"], reverse=True)
    
    return {
        "prediction_id": f"PRED-{random.randint(1000, 9999)}",
        "suspect_id": suspect_id,
        "language": "ar",
        "timestamp": "2025-12-01T13:15:00Z",
        "routes": predictions
    }

if __name__ == "__main__":
    scene = (24.6953, 46.6822)
    result = predict_movement(scene)
    import json
    print(json.dumps(result, indent=2, ensure_ascii=False))
