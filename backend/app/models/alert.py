from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database import Base
from backend.app.models.anomaly import AnomalySeverity

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    alert_id = Column(String(50), unique=True, index=True, nullable=False)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="CASCADE"), nullable=False, index=True)
    sample_id = Column(Integer, ForeignKey("water_quality_samples.id", ondelete="SET NULL"), nullable=True)
    parameter = Column(String(50), nullable=False)
    message = Column(String(255), nullable=False)
    severity = Column(Enum(AnomalySeverity), nullable=False, index=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    station = relationship("MonitoringStation", back_populates="alerts")
    sample = relationship("WaterQualitySample", back_populates="alerts")
