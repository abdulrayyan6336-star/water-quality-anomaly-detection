from sqlalchemy import Column, Integer, Boolean, Float, Enum, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database import Base
import enum

class AnomalySeverity(str, enum.Enum):
    Low = "Low"
    Medium = "Medium"
    High = "High"
    Critical = "Critical"

class AnomalyResult(Base):
    __tablename__ = "anomaly_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sample_id = Column(Integer, ForeignKey("water_quality_samples.id", ondelete="CASCADE"), unique=True, nullable=False)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="CASCADE"), nullable=False, index=True)
    is_anomaly = Column(Boolean, default=False, nullable=False, index=True)
    severity = Column(Enum(AnomalySeverity), default=AnomalySeverity.Low, nullable=False, index=True)
    anomaly_score = Column(Float, nullable=False)  # Scaled 0.0 to 1.0 (Isolation Forest score transformed)
    violated_parameters = Column(JSON, nullable=True)  # List of parameter names e.g. ["pH", "DO"]
    explanation = Column(Text, nullable=False)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sample = relationship("WaterQualitySample", back_populates="anomaly")
