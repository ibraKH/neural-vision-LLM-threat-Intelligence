# ResNet Geolocation

You see a photo from Saudi Arabia. A street in Riyadh, a mountain road in Taif, a coastal view. But where exactly?

Thousands of images circulate daily across the Kingdom, yet pinpointing their exact location remains a challenge. I built this to solve that. Give it an image from Saudi Arabia, and it returns precise GPS coordinates.

## How I Built It

I trained a ResNet50 model to recognize Saudi locations the way we recognize faces. Each street view, building, and landscape becomes a unique fingerprint 2048 numbers that capture its visual essence. When you query an image, the system finds the closest match in my Saudi reference database and returns the exact GPS coordinates.

**Built for Saudi Arabia. Simple. Fast. Accurate.**

## Quick Start

```bash
pip install -r requirements.txt
```

```python
from model import LocationRecognizer

recognizer = LocationRecognizer(
    csv_file='data/dataset.csv',
    image_folder='data/images/',
    cache_file='database_cache.pkl'
)

result = recognizer.find_location('mystery_photo.jpg')
print(f"Found at: {result['lat']}, {result['lng']}")
```

## Data Format

```
data/
├── dataset.csv          # filename, pano_id, lat, lng
└── images/             # reference images
```

## Under the Hood

ResNet50 → Feature Extraction → Cosine Similarity → GPS Prediction

The model caches everything for speed. First run builds the database, then queries are instant.

## Stack

Python • PyTorch • ResNet50 • NumPy • scikit-learn

---
