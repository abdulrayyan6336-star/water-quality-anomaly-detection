import React, { useState } from 'react';
import { 
  Folder, 
  FileCode, 
  Copy, 
  Check, 
  Database, 
  Terminal, 
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  type: 'python' | 'sql' | 'text' | 'env';
  description: string;
  content: string;
}

export const CodeInspectorView: React.FC = () => {
  const files: FileItem[] = [
    {
      name: 'main.py',
      path: 'backend/app/main.py',
      type: 'python',
      description: 'FastAPI app, OpenAPI/Swagger docs, CORS, and route registration',
      content: `"""
AquaShield AI - Water Quality Anomaly Detection & Smart Sampling Prioritizer
FastAPI Application Entry Point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from backend.app.database import engine, Base
from backend.app.routes import (
    auth_router,
    stations_router,
    samples_router,
    anomaly_router,
    sampling_router,
    analytics_router,
    alerts_router,
    dashboard_router
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aquashield.main")

# Auto-create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AquaShield AI - Water Quality Monitoring & Smart Sampling Prioritizer",
    description="REST API backend for AI limnological anomaly detection & 0-100 prioritizer",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all endpoint routers
api_prefix = "/api"
app.include_router(auth_router, prefix=api_prefix)
app.include_router(stations_router, prefix=api_prefix)
app.include_router(samples_router, prefix=api_prefix)
app.include_router(anomaly_router, prefix=api_prefix)
app.include_router(sampling_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)
app.include_router(alerts_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)`
    },
    {
      name: 'priority_service.py',
      path: 'backend/app/services/priority_service.py',
      type: 'python',
      description: '0 to 100 Smart Sampling Prioritizer algorithm & dispatch scheduler',
      content: `"""
Smart Sampling Prioritizer Service:
Implements a 5-factor multi-criteria optimization algorithm (0 - 100 score).
"""

from datetime import datetime, date, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.models.station import MonitoringStation, RiskLevel
from backend.app.models.sample import WaterQualitySample
from backend.app.models.anomaly import AnomalyResult, AnomalySeverity
from backend.app.models.priority import SamplingPriority, PriorityCategory

class PriorityService:
    @staticmethod
    def calculate_station_priority(db: Session, station: MonitoringStation):
        """
        Calculates priority score (0-100) using 5 weighted dimensions:
        1. Anomaly Severity (Weight: 35% max)
        2. Historical Water Quality Violation Rate (Weight: 20% max)
        3. Time Elapsed Since Last Sample (Weight: 20% max)
        4. Location Risk & Basin Sensitivity (Weight: 15% max)
        5. Sensor Unreliability / Drift / Missing Telemetry (Weight: 10% max)
        """
        # 1. Anomaly Points (0 to 35 pts)
        latest_sample = db.query(WaterQualitySample).filter(
            WaterQualitySample.station_id == station.id
        ).order_by(WaterQualitySample.collected_at.desc()).first()

        anomaly_points = 5.0
        if latest_sample and latest_sample.anomaly and latest_sample.anomaly.is_anomaly:
            sev = latest_sample.anomaly.severity
            anomaly_points = 35.0 if sev == AnomalySeverity.Critical else 26.0 if sev == AnomalySeverity.High else 18.0

        # 2. Historical Violation Rate (0 to 20 pts)
        total = db.query(WaterQualitySample).filter(WaterQualitySample.station_id == station.id).count()
        anom_count = db.query(AnomalyResult).filter(AnomalyResult.station_id == station.id, AnomalyResult.is_anomaly == True).count()
        hist_rate = (anom_count / total * 100.0) if total > 0 else 0.0
        history_points = min(20.0, (hist_rate / 100.0) * 35.0)

        # 3. Time elapsed (0 to 20 pts)
        days_since = (datetime.now() - latest_sample.collected_at).days if latest_sample else 30
        time_points = 20.0 if days_since >= 21 else 14.0 if days_since >= 14 else 9.0 if days_since >= 7 else 3.0

        # 4. Location risk factor (0 to 15 pts)
        risk_map = {RiskLevel.critical: 15.0, RiskLevel.high: 11.0, RiskLevel.medium: 6.0, RiskLevel.low: 2.0}
        location_points = risk_map.get(station.risk_level, 6.0)

        # 5. Missing / Unreliable Sensor Readings (0 to 10 pts)
        health = station.sensor_health_score or 95.0
        unreliability_points = min(10.0, max(0.0, (100.0 - health) * 0.12))

        # Composite Score (Sum: 0 - 100)
        total_score = round(anomaly_points + history_points + time_points + location_points + unreliability_points, 1)

        # Categories: 75-100 High, 40-74 Medium, 0-39 Low
        category = PriorityCategory.High if total_score >= 75.0 else PriorityCategory.Medium if total_score >= 40.0 else PriorityCategory.Low
        recommended_date = date.today() + (timedelta(days=1) if total_score >= 75 else timedelta(days=4) if total_score >= 40 else timedelta(days=14))

        return {
            "priority_score": total_score,
            "category": category.value,
            "recommended_date": recommended_date,
            "days_since_last_sample": days_since
        }`
    },
    {
      name: 'isolation_forest_model.py',
      path: 'backend/ml/isolation_forest_model.py',
      type: 'python',
      description: 'Scikit-learn Isolation Forest ML inference & feature attribution engine',
      content: `"""
Isolation Forest Machine Learning Inference Engine.
Computes anomaly scores (0.0 to 1.0) and decomposes parameter contributions.
"""

import math
import numpy as np
from sklearn.ensemble import IsolationForest

class WaterAnomalyDetector:
    def __init__(self, model_path: str = None):
        self.model = None
        self._load_model()

    def score_sample(self, sample_dict: dict) -> dict:
        """
        Runs Isolation Forest anomaly inference on 6 parameters:
        [pH, Turbidity, DO, Temperature, TDS, Electrical Conductivity]
        """
        raw_features = self.extract_features(sample_dict)
        scaled_features = self.normalize(raw_features)

        # Isolation Forest decision_function
        raw_score = float(self.model.decision_function([scaled_features])[0]) if self.model else -0.1
        anomaly_score = 1.0 / (1.0 + math.exp(raw_score * 6.0))

        # Classify Severity
        if anomaly_score >= 0.78:
            severity = "Critical"
        elif anomaly_score >= 0.62:
            severity = "High"
        elif anomaly_score >= 0.45:
            severity = "Medium"
        else:
            severity = "Low"

        return {
            "is_anomaly": anomaly_score >= 0.50,
            "anomaly_score": round(anomaly_score, 4),
            "severity": severity,
            "parameter_contributions": self.calculate_contributions(scaled_features)
        }`
    },
    {
      name: 'train.py',
      path: 'backend/ml/train.py',
      type: 'python',
      description: 'Machine learning training pipeline with synthetic watershed baselines',
      content: `"""
Machine Learning Training Pipeline for Water Quality Anomaly Detection.
Trains an Isolation Forest model on historical limnological and sensor data.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

def train_and_save_model():
    print("Generating baseline water quality synthetic dataset (5,000 samples)...")
    df = generate_synthetic_water_dataset()
    features = ["ph", "turbidity", "dissolved_oxygen", "temperature", "tds", "electrical_conductivity"]
    
    X = df[features].values
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    iso_forest = IsolationForest(
        n_estimators=150,
        contamination=0.08,
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_scaled)
    
    joblib.dump(iso_forest, "backend/ml/isolation_forest_model.joblib")
    joblib.dump(scaler, "backend/ml/scaler.joblib")
    print("Training Complete. Model and Scaler serialized to disk.")`
    },
    {
      name: 'init_db.sql',
      path: 'backend/init_db.sql',
      type: 'sql',
      description: 'MySQL database schemas, foreign keys, indexes, and initial seed data',
      content: `-- 7 Core MySQL Tables:
-- 1. users
-- 2. monitoring_stations
-- 3. water_quality_samples
-- 4. anomaly_results
-- 5. sampling_priorities
-- 6. alerts
-- 7. sampling_history

CREATE TABLE IF NOT EXISTS monitoring_stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    station_code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    basin VARCHAR(100) NOT NULL,
    location_description TEXT,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    status ENUM('active', 'maintenance', 'offline') NOT NULL DEFAULT 'active',
    risk_level ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    sensor_health_score DECIMAL(5, 2) NOT NULL DEFAULT 95.00,
    installation_date DATE NOT NULL,
    INDEX idx_station_code (station_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS water_quality_samples (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sample_id VARCHAR(50) NOT NULL UNIQUE,
    station_id INT NOT NULL,
    location_name VARCHAR(150) NOT NULL,
    ph DECIMAL(4, 2) NOT NULL,
    turbidity DECIMAL(6, 2) NOT NULL,
    dissolved_oxygen DECIMAL(5, 2) NOT NULL,
    temperature DECIMAL(5, 2) NOT NULL,
    tds DECIMAL(7, 2) NOT NULL,
    electrical_conductivity DECIMAL(7, 2) NOT NULL,
    source_type ENUM('sensor', 'manual', 'simulated') NOT NULL DEFAULT 'sensor',
    collected_at DATETIME NOT NULL,
    FOREIGN KEY (station_id) REFERENCES monitoring_stations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    },
    {
      name: 'database.py',
      path: 'backend/app/database.py',
      type: 'python',
      description: 'SQLAlchemy connection pooling with graceful SQLite local fallback',
      content: `from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os, logging

MYSQL_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/water_quality_db")
SQLITE_URL = os.getenv("SQLITE_FALLBACK_URL", "sqlite:///./water_quality.db")

try:
    engine = create_engine(MYSQL_URL, pool_pre_ping=True, pool_size=10, max_overflow=20)
    with engine.connect() as conn:
        print("Connected to MySQL")
except Exception:
    print("Falling back to SQLite")
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()`
    },
    {
      name: 'requirements.txt',
      path: 'backend/requirements.txt',
      type: 'text',
      description: 'Python 3.11+ dependency manifest',
      content: `fastapi>=0.111.0
uvicorn[standard]>=0.30.0
sqlalchemy>=2.0.30
pymysql>=1.1.0
cryptography>=42.0.5
scikit-learn>=1.5.0
pandas>=2.2.2
numpy>=1.26.4
pydantic>=2.7.4
pydantic-settings>=2.3.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.9
joblib>=1.4.2
pytest>=8.2.2
httpx>=0.27.0`
    }
  ];

  const [selectedFile, setSelectedFile] = useState<FileItem>(files[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const copyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            Backend Python 3.11+ & FastAPI Codebase Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Explore the generated modular Python backend files, SQLAlchemy ORM models, and ML training pipelines
          </p>
        </div>

        <button
          onClick={copyCode}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          {copied ? 'Code Copied' : 'Copy File Content'}
        </button>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Tree (Left 4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold mb-2">
            Project Directory Structure (backend/)
          </div>

          <div className="space-y-1">
            {files.map(f => {
              const isSelected = selectedFile.path === f.path;
              return (
                <div
                  key={f.path}
                  onClick={() => setSelectedFile(f)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'border-teal-500 bg-slate-800 ring-1 ring-teal-500/30 text-teal-300'
                      : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <FileCode className="w-4 h-4 mt-0.5 shrink-0 text-teal-400" />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-semibold truncate">
                      {f.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate font-mono">
                      {f.path}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Code Content Viewer (Right 8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-semibold">
                  Source File
                </span>
                <h4 className="font-mono font-bold text-slate-100 text-sm mt-0.5">
                  {selectedFile.path}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  {selectedFile.description}
                </p>
              </div>

              <span className="text-xs font-mono uppercase bg-slate-800 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
                {selectedFile.type}
              </span>
            </div>

            <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-[540px] leading-relaxed select-text">
              <code>{selectedFile.content}</code>
            </pre>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500 font-mono">
            <span>Encoding: UTF-8 · Python 3.11 / FastAPI / SQLAlchemy / MySQL</span>
            <span>AquaShield AI Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};
