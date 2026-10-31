from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, Date, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database import Base
import enum

class StationStatus(str, enum.Enum):
    active = "active"
    maintenance = "maintenance"
    offline = "offline"

class RiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class MonitoringStation(Base):
    __tablename__ = "monitoring_stations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_code = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    basin = Column(String(100), nullable=False)
    location_description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(Enum(StationStatus), default=StationStatus.active, nullable=False, index=True)
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.medium, nullable=False, index=True)
    sensor_health_score = Column(Float, default=95.0, nullable=False)
    installation_date = Column(Date, nullable=False)
    last_calibrated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    samples = relationship("WaterQualitySample", back_populates="station", cascade="all, delete-orphan")
    priorities = relationship("SamplingPriority", back_populates="station", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="station", cascade="all, delete-orphan")
