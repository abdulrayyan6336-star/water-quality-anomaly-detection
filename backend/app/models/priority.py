from sqlalchemy import Column, Integer, Float, Enum, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database import Base
import enum

class PriorityCategory(str, enum.Enum):
    Low = "Low Priority"
    Medium = "Medium Priority"
    High = "High Priority"

class SamplingPriority(Base):
    __tablename__ = "sampling_priorities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="CASCADE"), nullable=False, index=True)
    priority_score = Column(Float, nullable=False, index=True)  # 0 to 100
    category = Column(Enum(PriorityCategory), nullable=False, index=True)
    
    # 5 Algorithmic Sub-components
    days_since_last_sample = Column(Integer, default=0, nullable=False)
    historical_violation_rate = Column(Float, default=0.0, nullable=False)
    location_risk_weight = Column(Float, default=1.0, nullable=False)
    sensor_unreliability_score = Column(Float, default=0.0, nullable=False)
    
    recommended_date = Column(Date, nullable=False)
    recommendation_reason = Column(Text, nullable=False)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    station = relationship("MonitoringStation", back_populates="priorities")
