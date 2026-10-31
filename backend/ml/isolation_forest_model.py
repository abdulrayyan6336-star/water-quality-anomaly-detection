"""
Isolation Forest Machine Learning Inference Engine for Water Quality Monitoring.
Computes anomaly scores, maps them to severity (Low, Medium, High, Critical),
and decomposes multi-parameter feature contributions for root-cause explainability.
"""

import os
import math
import logging
from typing import Dict, Any, List, Tuple
import numpy as np
from backend.ml.preprocessor import extract_features, normalize_features, FEATURE_NAMES, FEATURE_DEFAULTS

logger = logging.getLogger(__name__)

class WaterAnomalyDetector:
    def __init__(self, model_path: str = None, scaler_path: str = None):
        self.model = None
        self.scaler = None
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), "isolation_forest_model.joblib")
        self.scaler_path = scaler_path or os.path.join(os.path.dirname(__file__), "scaler.joblib")
        self._load_model()

    def _load_model(self):
        try:
            import joblib
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                logger.info("Loaded pre-trained Isolation Forest model and scaler from disk.")
            else:
                logger.info("No saved .joblib model found; initializing embedded baseline estimator.")
        except Exception as e:
            logger.warning(f"Could not load ML model from disk ({e}); using embedded mathematical model.")

    def score_sample(self, sample_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs Isolation Forest anomaly inference on a single water sample dictionary.
        Returns:
            - is_anomaly (bool)
            - anomaly_score (float between 0.0 and 1.0, where 1.0 is most anomalous)
            - severity ("Low", "Medium", "High", "Critical")
            - parameter_contributions (dict of % influence per parameter)
            - explanation (human readable scientific summary)
        """
        raw_features = extract_features(sample_dict)
        
        # 1. Feature normalization
        if self.scaler is not None:
            scaled_features = self.scaler.transform([raw_features])[0]
        else:
            scaled_features = normalize_features(raw_features)

        # 2. Isolation Forest score
        if self.model is not None:
            # decision_function gives negative values for anomalies, positive for normal
            # Scikit-learn: lower score = more anomalous
            raw_score = float(self.model.decision_function([scaled_features])[0])
            # Map decision function (-0.5 to +0.5 typical) to 0.0 - 1.0 anomaly score
            # Lower decision function -> higher anomaly score
            anomaly_score = 1.0 / (1.0 + math.exp(raw_score * 6.0))
            is_ml_anomaly = bool(self.model.predict([scaled_features])[0] == -1)
        else:
            # Fallback statistical Mahalanobis/Z-score ensemble
            z_scores = np.abs(scaled_features)
            max_z = np.max(z_scores)
            mean_z = np.mean(z_scores)
            composite_dev = 0.6 * max_z + 0.4 * mean_z
            anomaly_score = float(np.clip(composite_dev / 4.0, 0.0, 1.0))
            is_ml_anomaly = anomaly_score > 0.55

        # 3. Calculate parameter contributions (deviation from safe median)
        contributions = {}
        total_dev = 0.0
        for i, param in enumerate(FEATURE_NAMES):
            dev = abs(scaled_features[i])
            contributions[param] = float(dev)
            total_dev += dev

        if total_dev > 0:
            param_percentage = {p: round((v / total_dev) * 100, 1) for p, v in contributions.items()}
        else:
            param_percentage = {p: 16.6 for p in FEATURE_NAMES}

        # 4. Severity classification based on score
        if anomaly_score >= 0.78:
            severity = "Critical"
        elif anomaly_score >= 0.62:
            severity = "High"
        elif anomaly_score >= 0.45:
            severity = "Medium"
        else:
            severity = "Low"

        # 5. Build scientific explanation
        top_culprits = sorted(param_percentage.items(), key=lambda x: x[1], reverse=True)[:2]
        explanation = self._build_explanation(sample_dict, top_culprits, severity, anomaly_score)

        return {
            "is_anomaly": is_ml_anomaly or (anomaly_score >= 0.5),
            "anomaly_score": round(anomaly_score, 4),
            "severity": severity,
            "parameter_contributions": param_percentage,
            "explanation": explanation
        }

    def _build_explanation(
        self,
        sample: Dict[str, Any],
        top_culprits: List[Tuple[str, float]],
        severity: str,
        score: float
    ) -> str:
        param_labels = {
            "ph": "pH",
            "turbidity": "Turbidity",
            "dissolved_oxygen": "Dissolved Oxygen",
            "temperature": "Temperature",
            "tds": "Total Dissolved Solids",
            "electrical_conductivity": "Electrical Conductivity"
        }

        reasons = []
        for p, pct in top_culprits:
            val = sample.get(p)
            label = param_labels.get(p, p)
            if p == "ph" and val is not None:
                reasons.append(f"{label} reading of {val:.2f} ({'acidic' if val < 7.0 else 'alkaline'}) accounting for {pct}% of anomaly signal")
            elif p == "dissolved_oxygen" and val is not None:
                reasons.append(f"{label} at {val:.1f} mg/L ({'hypoxic depression' if val < 5.0 else 'elevated'}) explaining {pct}% of variance")
            elif p == "turbidity" and val is not None:
                reasons.append(f"{label} spike at {val:.1f} NTU explaining {pct}% of model divergence")
            elif p == "tds" and val is not None:
                reasons.append(f"{label} at {val:.0f} mg/L contributing {pct}%")
            elif val is not None:
                reasons.append(f"{label} at {val:.1f} contributing {pct}%")

        if severity in ["Critical", "High"]:
            return f"Isolation Forest detected abnormal multivariate pattern (Score: {score:.3f}, Severity: {severity}). Primary drivers: {'; '.join(reasons)}."
        else:
            return f"Normal water quality characteristics (Score: {score:.3f}). Parameter variance within standard limnological baseline."

# Singleton instance
detector = WaterAnomalyDetector()
