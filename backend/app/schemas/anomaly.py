from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AnomalyDetectRequest(BaseModel):
    sample_id: Optional[int] = None
    # Or raw reading evaluation
    ph: Optional[float] = None
    turbidity: Optional[float] = None
    dissolved_oxygen: Optional[float] = None
    temperature: Optional[float] = None
    tds: Optional[float] = None
    electrical_conductivity: Optional[float] = None
    station_id: Optional[int] = None

class AnomalyResultResponse(BaseModel):
    id: int
    sample_id: int
    station_id: int
    is_anomaly: bool
    severity: str  # "Low", "Medium", "High", "Critical"
    anomaly_score: float  # 0.0 - 1.0
    violated_parameters: Optional[List[str]] = None
    explanation: str
    detected_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AnomalyInferenceDetail(BaseModel):
    is_anomaly: bool
    severity: str
    anomaly_score: float
    violated_parameters: List[str]
    explanation: str
    parameter_contributions: Dict[str, float]
    threshold_assessment: Dict[str, Any]
