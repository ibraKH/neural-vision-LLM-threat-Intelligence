import os
import pickle
import logging
from typing import Optional, Dict

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class LocationRecognizer:
    def __init__(self, csv_file: str, image_folder: str, cache_file: str = None):
        self.csv_file = csv_file
        self.image_folder = image_folder
        self.cache_file = cache_file # Defaults handled by caller or config
        self.database_matrix = None
        self.database_metadata = None

        self.model = self._setup_model()
        self.preprocess = self._setup_preprocessing()
        self._load_or_build_database()

    def _setup_model(self) -> nn.Sequential:
        weights = models.ResNet50_Weights.DEFAULT
        model = models.resnet50(weights=weights)
        modules = list(model.children())[:-1]
        model = nn.Sequential(*modules)
        model.eval()
        return model

    def _setup_preprocessing(self) -> transforms.Compose:
        return transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def _extract_features(self, image_path: str) -> Optional[np.ndarray]:
        try:
            img = Image.open(image_path).convert("RGB")
            img_tensor = self.preprocess(img).unsqueeze(0)

            with torch.no_grad():
                vector = self.model(img_tensor)

            return vector.squeeze().numpy().reshape(1, -1)
        except Exception as e:
            logger.error(f"Failed to extract features from {image_path}: {e}")
            return None

    def _load_or_build_database(self):
        if os.path.exists(self.cache_file):
            self._load_cached_database()
        else:
            self._build_database()

    def _load_cached_database(self):
        with open(self.cache_file, 'rb') as f:
            cache = pickle.load(f)
            self.database_matrix = cache['vectors']
            self.database_metadata = cache['metadata']
        logger.info(f"Loaded {len(self.database_matrix)} images from cache")

    def _build_database(self):
        logger.info("Building database...")
        df = pd.read_csv(self.csv_file)
        database_vectors = []
        database_metadata = []

        total_images = len(df)
        for idx, row in df.iterrows():
            fname = row['filename']
            full_path = os.path.join(self.image_folder, fname)

            if os.path.exists(full_path):
                vec = self._extract_features(full_path)
                if vec is not None:
                    database_vectors.append(vec)
                    database_metadata.append({
                        'filename': fname,
                        'lat': row['lat'],
                        'lng': row['lng']
                    })
                    if (idx + 1) % 100 == 0:
                        logger.info(f"Processed {idx + 1}/{total_images}")

        self.database_matrix = np.vstack(database_vectors)
        self.database_metadata = database_metadata

        with open(self.cache_file, 'wb') as f:
            pickle.dump({
                'vectors': self.database_matrix,
                'metadata': self.database_metadata
            }, f)
        logger.info(f"Database built: {len(self.database_matrix)} images indexed")

    def find_location(self, query_image_path: str, confidence_threshold: float = 0.3, verbose: bool = False) -> Optional[Dict]:
        query_vec = self._extract_features(query_image_path)
        if query_vec is None:
            logger.error(f"Failed to process image: {query_image_path}")
            return None

        scores = cosine_similarity(query_vec, self.database_matrix)
        best_match_index = np.argmax(scores)
        best_score = scores[0][best_match_index]

        result = self.database_metadata[best_match_index]

        if best_score < confidence_threshold:
            logger.warning(f"Low confidence: {best_score:.4f}")

        if verbose:
            logger.info(f"Match: {result['filename']} | Confidence: {best_score:.4f} | GPS: ({result['lat']}, {result['lng']})")

        return {**result, 'confidence': best_score}
