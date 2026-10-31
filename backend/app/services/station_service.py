"""
Monitoring Station lifecycle and status management service.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.station import MonitoringStation
from backend.app.schemas.station import StationCreate, StationUpdate

class StationService:
    @staticmethod
    def get_all(db: Session) -> List[MonitoringStation]:
        return db.query(MonitoringStation).all()

    @staticmethod
    def get_by_id(db: Session, station_id: int) -> Optional[MonitoringStation]:
        return db.query(MonitoringStation).filter(MonitoringStation.id == station_id).first()

    @staticmethod
    def get_by_code(db: Session, station_code: str) -> Optional[MonitoringStation]:
        return db.query(MonitoringStation).filter(MonitoringStation.station_code == station_code).first()

    @staticmethod
    def create(db: Session, data: StationCreate) -> MonitoringStation:
        stn = MonitoringStation(
            station_code=data.station_code,
            name=data.name,
            basin=data.basin,
            location_description=data.location_description,
            latitude=data.latitude,
            longitude=data.longitude,
            status=data.status or "active",
            risk_level=data.risk_level or "medium",
            sensor_health_score=data.sensor_health_score if data.sensor_health_score is not None else 95.0,
            installation_date=data.installation_date,
            last_calibrated_at=data.last_calibrated_at
        )
        db.add(stn)
        db.commit()
        db.refresh(stn)
        return stn

    @staticmethod
    def update(db: Session, station_id: int, data: StationUpdate) -> Optional[MonitoringStation]:
        stn = db.query(MonitoringStation).filter(MonitoringStation.id == station_id).first()
        if not stn:
            return None
        
        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(stn, key, val)

        db.commit()
        db.refresh(stn)
        return stn

    @staticmethod
    def delete(db: Session, station_id: int) -> bool:
        stn = db.query(MonitoringStation).filter(MonitoringStation.id == station_id).first()
        if not stn:
            return False
        db.delete(stn)
        db.commit()
        return True
