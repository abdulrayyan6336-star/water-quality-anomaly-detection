"""
Data Preprocessing for Water Quality Readings before ML Inference.
Handles normalization, missing values, and feature alignment.
"""

from typing import List, Dict, Any
import numpy as np

FEATURE_NAMES = [
    "ph",
    "turbidity",
    "dissolved_oxygen",
    "temperature",
    "tds",
    "electrical_conductivity"
]

# Baseline statistical means and std devs for scaling when standard scaler is not serialized
FEATURE_DEFAULTS = {
    "ph": {"mean": 7.35, "std": 0.45},
    "turbidity": {"mean": 2.2, "std": 1.4},
    "dissolved_oxygen": {"mean": 8.4, "std": 1.2},
    "temperature": {"mean": 18.5, "std": 4.2},
    "tds": {"mean": 240.0, "std": 75.0},
    "electrical_conductivity": {"mean": 380.0, "std": 120.0}
}

def extract_features(sample: Dict[str, Any]) -> np.ndarray:
    """
    Extracts ordered feature vector [ph, turbidity, DO, temp, tds, ec].
    """
    row = []
    for f in FEATURE_NAMES:
        val = sample.get(f)
        if val is None or np.isnan(val):
            # Impute with domain default baseline mean
            val = FEATURE_DEFAULTS[f]["mean"]
        row.append(float(val))
    return np.array(row, dtype=float)

def normalize_features(features: np.ndarray) -> np.ndarray:
    """
    Z-score standardization based on baseline limnological distribution.
    """
    normalized = np.zeros_like(features)
    for i, f in enumerate(FEATURE_NAMES):
        mean = FEATURE_DEFAULTS[f]["mean"]
        std = FEATURE_DEFAULTS[f]["std"]
        normalized[i] = (features[i] - mean) / std
    return normalized
