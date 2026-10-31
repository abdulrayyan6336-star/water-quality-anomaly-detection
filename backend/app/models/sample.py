from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database import Base
import enum

class SourceType(str, enum.Enum):
    sensor = "sensor"
    manual = "manual"
    simulated = "simulated"

class WaterQualitySample(Base):
    __tablename__ = "water_quality_samples"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sample_id = Column(String(50), unique=True, index=True, nullable=False)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="CASCADE"), nullable=False, index=True)
    location_name = Column(String(150), nullable=False)
    
    # 6 Core Water Quality Parameters
    ph = Column(Float, nullable=False)
    turbidity = Column(Float, nullable=False)
    dissolved_oxygen = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    tds = Column(Float, nullable=False)
    electrical_conductivity = Column(Float, nullable=False)

    source_type = Column(Enum(SourceType), default=SourceType.sensor, nullable=False, index=True)
    collected_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    station = relationship("MonitoringStation", back_populates="samples")
    anomaly = relationship("AnomalyResult", back_populates="sample", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="sample")
