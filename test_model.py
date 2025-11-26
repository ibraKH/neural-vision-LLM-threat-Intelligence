from model import LocationRecognizer
from PIL import Image
import matplotlib.pyplot as plt
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def test_location_recognizer():
    recognizer = LocationRecognizer(
        csv_file='data/dataset.csv',
        image_folder='data/images/',
        cache_file='database_cache.pkl'
    )

    test_image_1 = 'data/test/images/image_001.png'

    result_1 = recognizer.find_location(test_image_1)

    if result_1:
        print("\n=== TEST 1 RESULTS ===")
        print(f"Confidence Score: {result_1['confidence']:.4f}")
        print(f"GPS Coordinates: ({result_1['lat']}, {result_1['lng']})")
        print(f"Google Maps Link: https://www.google.com/maps?q={result_1['lat']},{result_1['lng']}")
    else:
        print("Failed to find location for Test Image 1")

    test_image_2 = 'data/test/images/image_002.png'

    result_2 = recognizer.find_location(test_image_2)

    if result_2:
        print("\n=== TEST 2 RESULTS ===")
        print(f"Confidence Score: {result_2['confidence']:.4f}")
        print(f"GPS Coordinates: ({result_2['lat']}, {result_2['lng']})")
        print(f"Google Maps Link: https://www.google.com/maps?q={result_2['lat']},{result_2['lng']}")
    else:
        print("Failed to find location for Test Image 2")


if __name__ == "__main__":
    test_location_recognizer()
