import shutil
import uuid
import os
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

import main_pipeline
import main_prediction

class PredictionRequest(BaseModel):
    start_coords: tuple
    suspect_id: Optional[str] = "suspect_123"

app = FastAPI(title="Roya", version="1.0 MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = "static"
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

REPORT_DATABASE = []

PRIORITY_MAP = {
    "CRITICAL": 0,
    "HIGH": 1,
    "MEDIUM": 2,
    "LOW": 3,
    "UNKNOWN": 4
}

@app.get("/")
async def health_check():
    return {"status": "online", "system": "Roya"}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOADS_DIR, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = await run_in_threadpool(main_pipeline.run_pipeline, file_path)

        image_url = f"http://localhost:8000/static/uploads/{unique_filename}"
        result["image_url"] = image_url
        result["report_id"] = str(uuid.uuid4())
        result["processed_at"] = result.get("timestamp")

        REPORT_DATABASE.append(result)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/reports")
async def get_reports(sort_by: Optional[str] = Query(None)):
    if sort_by == "priority":
        def get_priority(report):
            modules = report.get("modules", {})
            reasoning = modules.get("reasoning", {})
            classification_data = reasoning.get("classification", {})

            priority = "UNKNOWN"
            if isinstance(classification_data, dict):
                priority = classification_data.get("priority", "UNKNOWN")
            elif isinstance(classification_data, str):
                priority = classification_data

            return PRIORITY_MAP.get(priority.upper(), 99)

        return sorted(REPORT_DATABASE, key=get_priority)

    return REPORT_DATABASE

@app.delete("/reports")
async def clear_reports():
    REPORT_DATABASE.clear()
    return {"status": "cleared", "message": "Report database has been reset"}

@app.post("/predict")
async def predict_location_endpoint(request: PredictionRequest):
    try:
        result = main_prediction.predict_movement(
            request.start_coords,
            request.suspect_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
