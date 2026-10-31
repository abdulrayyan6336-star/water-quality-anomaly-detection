from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class StationBase(BaseModel):
    station_code: str = Field(..., max_length=30)
    name: str = Field(..., max_length=120)
    basin: str = Field(..., max_length=100)
    location_description: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    status: Optional[str] = "active"
    risk_level: Optional[str] = "medium"
    sensor_health_score: Optional[float] = Field(95.0, ge=0.0, le=100.0)
    installation_date: date
    last_calibrated_at: Optional[datetime] = None

class StationCreate(StationBase):
    pass

class StationUpdate(BaseModel):
    name: Optional[str] = None
    basin: Optional[str] = None
    location_description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None
    risk_level: Optional[str] = None
    sensor_health_score: Optional[float] = None
    last_calibrated_at: Optional[datetime] = None

class StationResponse(StationBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
