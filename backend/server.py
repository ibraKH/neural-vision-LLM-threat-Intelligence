from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import sys

sys.path.append('..')
from model import LocationRecognizer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

recognizer = LocationRecognizer(
    csv_file='../data/dataset.csv',
    image_folder='../data/images/',
    cache_file='../database_cache.pkl'
)

@app.post("/recognize")
async def recognize_location(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    temp_path = f"temp_{file.filename}"

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = recognizer.find_location(temp_path, confidence_threshold=0.3, verbose=True)

        if result is None:
            raise HTTPException(status_code=500, detail="Failed to process image")

        return {
            "location": {
                "lat": result['lat'],
                "lng": result['lng']
            },
            "confidence": float(result['confidence']),
            "matched_image": result['filename']
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/")
async def root():
    return {"message": "Location Recognition API"}
