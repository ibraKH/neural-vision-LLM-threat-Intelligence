import os
from pathlib import Path

# Base directory of the project (roya/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

# Backend directory (roya/backend)
BACKEND_DIR = BASE_DIR / "backend"

# Data directory
DATA_DIR = BACKEND_DIR / "data"

# Models directory
MODELS_DIR = BACKEND_DIR / "models"

# Specific data paths
BIOMETRIC_DATASET_DIR = DATA_DIR / "biometric_dataset"
CCTV_DIR = DATA_DIR / "cctv"
CROPS_DIR = DATA_DIR / "crops"
INPUTS_DIR = DATA_DIR / "inputs"
STATIC_DIR = DATA_DIR / "static"
OUTPUT_JSON_PATH = DATA_DIR / "output.json"
DATABASE_CACHE_PATH = DATA_DIR / "database_cache.pkl"
DATA_TYPES_PATH = DATA_DIR / "data_types.json"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
CROPS_DIR.mkdir(parents=True, exist_ok=True)
INPUTS_DIR.mkdir(parents=True, exist_ok=True)
