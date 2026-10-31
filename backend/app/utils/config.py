"""
Application configuration and environment variables.
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AquaShield AI - Water Quality Monitoring"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "aquashield-dev-jwt-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # ML settings
    MODEL_PATH: str = os.getenv("MODEL_PATH", "backend/ml/isolation_forest_model.joblib")
    SCALER_PATH: str = os.getenv("SCALER_PATH", "backend/ml/scaler.joblib")
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
