from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.station import MonitoringStation
from backend.app.schemas.alert import AlertResponse, AlertUpdate
from backend.app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alert Management"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(unread_only: bool = False, limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    """Retrieve water quality alerts (unsafe pH, high turbidity, low DO, abnormal TDS, critical anomalies)."""
    alerts = AlertService.get_all_alerts(db, unread_only=unread_only, limit=limit)
    response_list = []
    for a in alerts:
        stn = db.query(MonitoringStation).filter(MonitoringStation.id == a.station_id).first()
        response_list.append(AlertResponse(
            id=a.id,
            alert_id=a.alert_id,
            station_id=a.station_id,
            station_name=stn.name if stn else None,
            station_code=stn.station_code if stn else None,
            sample_id=a.sample_id,
            parameter=a.parameter,
            message=a.message,
            severity=a.severity.value if hasattr(a.severity, "value") else str(a.severity),
            is_read=a.is_read,
            triggered_at=a.triggered_at
        ))
    return response_list

@router.patch("/{alert_id}/read", response_model=AlertResponse)
def mark_alert_read(alert_id: str, db: Session = Depends(get_db)):
    """Acknowledge or mark an alert as read by its unique alert_id."""
    alert = AlertService.mark_as_read(db, alert_id)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found.")
    
    stn = db.query(MonitoringStation).filter(MonitoringStation.id == alert.station_id).first()
    return AlertResponse(
        id=alert.id,
        alert_id=alert.alert_id,
        station_id=alert.station_id,
        station_name=stn.name if stn else None,
        station_code=stn.station_code if stn else None,
        sample_id=alert.sample_id,
        parameter=alert.parameter,
        message=alert.message,
        severity=alert.severity.value if hasattr(alert.severity, "value") else str(alert.severity),
        is_read=alert.is_read,
        triggered_at=alert.triggered_at
    )
