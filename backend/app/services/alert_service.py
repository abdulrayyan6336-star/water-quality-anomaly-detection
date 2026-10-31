"""
Alerts management service for threshold violations and notifications.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models.alert import Alert
from backend.app.models.station import MonitoringStation
import uuid

class AlertService:
    @staticmethod
    def get_all_alerts(db: Session, unread_only: bool = False, limit: int = 50) -> List[Alert]:
        query = db.query(Alert).order_by(desc(Alert.triggered_at))
        if unread_only:
            query = query.filter(Alert.is_read == False)
        return query.limit(limit).all()

    @staticmethod
    def mark_as_read(db: Session, alert_id: str) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
        if alert:
            alert.is_read = True
            db.commit()
            db.refresh(alert)
        return alert

    @staticmethod
    def create_direct_alert(
        db: Session,
        station_id: int,
        parameter: str,
        message: str,
        severity: str,
        sample_id: Optional[int] = None
    ) -> Alert:
        alert = Alert(
            alert_id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
            station_id=station_id,
            sample_id=sample_id,
            parameter=parameter,
            message=message,
            severity=severity,
            is_read=False
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert
