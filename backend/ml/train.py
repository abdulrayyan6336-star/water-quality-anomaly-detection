"""
Machine Learning Training Pipeline for Water Quality Anomaly Detection.
Trains an Isolation Forest model on historical limnological and sensor data.

Execution:
    python backend/ml/train.py
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

MODEL_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "isolation_forest_model.joblib")
SCALER_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "scaler.joblib")

def generate_synthetic_water_dataset(n_samples: int = 5000, contamination: float = 0.08) -> pd.DataFrame:
    """
    Generates realistic water quality dataset based on watershed baselines + simulated contamination events:
    1. Normal drinking & river water distribution (92%)
    2. Industrial effluent spill (alkaline pH > 9, high TDS, low DO)
    3. Agricultural storm runoff (high turbidity, low DO, elevated EC)
    4. Acid mine/rain drainage (acidic pH < 5.5, high heavy metals / TDS)
    5. Thermal pollution from cooling towers (high temp > 30°C, low DO)
    """
    np.random.seed(42)
    n_anomalies = int(n_samples * contamination)
    n_normal = n_samples - n_anomalies

    # 1. Normal baseline samples
    normal_ph = np.random.normal(7.35, 0.35, n_normal)
    normal_turbidity = np.random.exponential(1.8, n_normal) + 0.3
    normal_do = np.random.normal(8.6, 1.0, n_normal)
    normal_temp = np.random.normal(18.0, 3.5, n_normal)
    normal_tds = np.random.normal(220.0, 50.0, n_normal)
    normal_ec = normal_tds * 1.55 + np.random.normal(0, 15, n_normal)

    df_normal = pd.DataFrame({
        "ph": np.clip(normal_ph, 6.6, 8.4),
        "turbidity": np.clip(normal_turbidity, 0.2, 4.5),
        "dissolved_oxygen": np.clip(normal_do, 6.5, 12.0),
        "temperature": np.clip(normal_temp, 5.0, 24.0),
        "tds": np.clip(normal_tds, 80.0, 420.0),
        "electrical_conductivity": np.clip(normal_ec, 120.0, 680.0),
        "label": 0
    })

    # 2. Anomalous events
    anomalies = []
    for _ in range(n_anomalies):
        event_type = np.random.choice(["industrial", "agricultural", "acidic", "thermal"])
        if event_type == "industrial":
            anomalies.append({
                "ph": np.random.uniform(9.0, 11.5),
                "turbidity": np.random.uniform(8.0, 25.0),
                "dissolved_oxygen": np.random.uniform(1.5, 4.0),
                "temperature": np.random.uniform(22.0, 31.0),
                "tds": np.random.uniform(650.0, 1400.0),
                "electrical_conductivity": np.random.uniform(950.0, 2200.0),
                "label": 1
            })
        elif event_type == "agricultural":
            anomalies.append({
                "ph": np.random.uniform(6.0, 7.0),
                "turbidity": np.random.uniform(12.0, 45.0),
                "dissolved_oxygen": np.random.uniform(2.5, 4.8),
                "temperature": np.random.uniform(19.0, 26.0),
                "tds": np.random.uniform(450.0, 850.0),
                "electrical_conductivity": np.random.uniform(700.0, 1300.0),
                "label": 1
            })
        elif event_type == "acidic":
            anomalies.append({
                "ph": np.random.uniform(3.8, 5.8),
                "turbidity": np.random.uniform(4.0, 18.0),
                "dissolved_oxygen": np.random.uniform(5.0, 8.0),
                "temperature": np.random.uniform(14.0, 22.0),
                "tds": np.random.uniform(550.0, 1100.0),
                "electrical_conductivity": np.random.uniform(800.0, 1700.0),
                "label": 1
            })
        else: # thermal
            anomalies.append({
                "ph": np.random.uniform(7.0, 8.2),
                "turbidity": np.random.uniform(1.0, 6.0),
                "dissolved_oxygen": np.random.uniform(2.0, 4.2),
                "temperature": np.random.uniform(29.5, 38.0),
                "tds": np.random.uniform(200.0, 400.0),
                "electrical_conductivity": np.random.uniform(300.0, 600.0),
                "label": 1
            })

    df_anom = pd.DataFrame(anomalies)
    df = pd.concat([df_normal, df_anom], ignore_index=True).sample(frac=1.0, random_state=42).reset_index(drop=True)
    return df

def train_and_save_model():
    print("Generating baseline water quality synthetic dataset (5,000 samples)...")
    df = generate_synthetic_water_dataset()
    features = ["ph", "turbidity", "dissolved_oxygen", "temperature", "tds", "electrical_conductivity"]
    
    X = df[features].values
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print("Fitting Isolation Forest model (n_estimators=150, contamination=0.08)...")
    iso_forest = IsolationForest(
        n_estimators=150,
        contamination=0.08,
        max_samples="auto",
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_scaled)
    
    # Save artifacts
    joblib.dump(iso_forest, MODEL_OUTPUT_PATH)
    joblib.dump(scaler, SCALER_OUTPUT_PATH)
    print(f"Model successfully saved to: {MODEL_OUTPUT_PATH}")
    print(f"Scaler successfully saved to: {SCALER_OUTPUT_PATH}")
    
    # Validation preview
    predictions = iso_forest.predict(X_scaled)
    detected_anomalies = np.sum(predictions == -1)
    print(f"Training Complete. Detected {detected_anomalies} anomalies out of {len(X)} training samples ({detected_anomalies/len(X)*100:.2f}%).")

if __name__ == "__main__":
    train_and_save_model()
