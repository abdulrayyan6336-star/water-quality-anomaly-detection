from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class PriorityResponse(BaseModel):
    id: int
    station_id: int
    station_code: Optional[str] = None
    station_name: Optional[str] = None
    basin: Optional[str] = None
    priority_score: float = Field(..., ge=0.0, le=100.0)
    category: str  # "High Priority", "Medium Priority", "Low Priority"
    days_since_last_sample: int
    historical_violation_rate: float
    location_risk_weight: float
    sensor_unreliability_score: float
    recommended_date: date
    recommendation_reason: str
    calculated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RecommendRequest(BaseModel):
    station_ids: Optional[List[int]] = None
    force_recalculate: bool = False

class RecommendScheduleResponse(BaseModel):
    total_stations_evaluated: int
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int
    ranked_stations: List[PriorityResponse]
    schedule_summary: str
