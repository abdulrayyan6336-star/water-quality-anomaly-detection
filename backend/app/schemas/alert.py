from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertResponse(BaseModel):
    id: int
    alert_id: str
    station_id: int
    station_name: Optional[str] = None
    station_code: Optional[str] = None
    sample_id: Optional[int] = None
    parameter: str
    message: str
    severity: str
    is_read: bool
    triggered_at: datetime

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    is_read: bool = True
