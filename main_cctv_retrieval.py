import json
import math
import argparse
import sys
import os
import io

# Force UTF-8 for stdout
sys.stdout.reconfigure(encoding='utf-8')
from location_recognizer import LocationRecognizer

CCTV_NAME_MAP = {
    "Al-Dawaa Pharmacy #291": "صيدلية الدواء رقم 291",
    "Tamimi Markets Express": "أسواق التميمي إكسبريس",
    "Al-Rajhi Bank ATM": "صراف الراجحي",
    "Al-Amal Baquala (Grocery)": "بقالة الأمل",
    "Golden Juice & Snacks": "عصائر جولدن سناك",
    "Riyadh Modern Laundry": "مغسلة الرياض الحديثة"
}

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371000 # Radius of earth in meters
    return c * r

def load_registry(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(json.dumps({"error": f"Registry file not found: {file_path}"}))
        sys.exit(1)
    except json.JSONDecodeError:
        print(json.dumps({"error": f"Invalid JSON in registry file: {file_path}"}))
        sys.exit(1)

def get_coordinates_from_image(image_path):
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}))
        sys.exit(1)
        
    try:
        recognizer = LocationRecognizer(
            csv_file='data/dataset.csv',
            image_folder='data/images/',
            cache_file='database_cache.pkl'
        )
        
        result = recognizer.find_location(image_path)
        
        if result:
            return float(result['lat']), float(result['lng'])
        else:
            print(json.dumps({"error": "Could not determine location from image"}))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({"error": f"Error in location recognition: {str(e)}"}))
        sys.exit(1)

def main():
    # Default coordinates (Riyadh) 
    DEFAULT_LAT = 24.585417
    DEFAULT_LON = 46.585833
    
    parser = argparse.ArgumentParser(description='CCTV Retrieval Tool')
    parser.add_argument('--lat', type=float, help='Latitude of the target location')
    parser.add_argument('--lng', type=float, help='Longitude of the target location')
    parser.add_argument('--image', type=str, help='Path to image for location inference')
    
    args = parser.parse_args()
    
    target_lat = DEFAULT_LAT
    target_lng = DEFAULT_LON
    
    if args.image:
        target_lat, target_lng = get_coordinates_from_image(args.image)
    elif args.lat is not None and args.lng is not None:
        target_lat = args.lat
        target_lng = args.lng

    # Load Mock Database
    registry_path = os.path.join('cctv', 'cctv_registry.json')
    cctv_registry = load_registry(registry_path)

    results = []
    
    for cam in cctv_registry:
        dist = haversine_distance(target_lat, target_lng, cam["lat"], cam["lng"])
        # Filter logic (e.g., only within 500m)
        if dist <= 500:
            business_name_en = cam["business_name"]
            business_name_ar = CCTV_NAME_MAP.get(business_name_en, business_name_en)
            results.append({
                "business_name": business_name_ar,
                "business_name_en": business_name_en,
                "lat": cam["lat"],
                "lng": cam["lng"],
                "distance_val": dist, # Keep numeric for sorting
                "distance": f"{int(dist)} متر",
                "distance_en": f"{int(dist)}m"
            })

    # Sort by distance
    results.sort(key=lambda x: x["distance_val"])

    # Add rank and remove raw distance_val
    final_nodes = []
    for idx, item in enumerate(results):
        final_nodes.append({
            "rank": idx + 1,
            "business_name": item["business_name"],
            "business_name_en": item["business_name_en"],
            "gps": {
                "lat": item["lat"],
                "lng": item["lng"]
            },
            "distance": item["distance"],
            "distance_en": item["distance_en"]
        })

    output = {
        "meta": {
            "search_radius": "500m",
            "target_coords": {
                "lat": target_lat,
                "lng": target_lng
            },
            "language": "ar"
        },
        "cctv_nodes": final_nodes
    }

    # Print JSON to stdout
    print(json.dumps(output, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
