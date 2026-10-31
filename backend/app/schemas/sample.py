from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SampleCreate(BaseModel):
    station_id: int
    location_name: Optional[str] = None
    ph: float = Field(..., ge=0.0, le=14.0, description="pH between 0.0 and 14.0")
    turbidity: float = Field(..., ge=0.0, description="Turbidity in NTU")
    dissolved_oxygen: float = Field(..., ge=0.0, description="Dissolved Oxygen in mg/L")
    temperature: float = Field(..., ge=-5.0, le=50.0, description="Water temperature in Celsius")
    tds: float = Field(..., ge=0.0, description="Total Dissolved Solids in mg/L")
    electrical_conductivity: float = Field(..., ge=0.0, description="Electrical Conductivity in µS/cm")
    source_type: Optional[str] = "sensor"  # "sensor", "manual", "simulated"
    collected_at: Optional[datetime] = None

class SampleResponse(BaseModel):
    id: int
    sample_id: str
    station_id: int
    location_name: str
    ph: float
    turbidity: float
    dissolved_oxygen: float
    temperature: float
    tds: float
    electrical_conductivity: float
    source_type: str
    collected_at: datetime
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
