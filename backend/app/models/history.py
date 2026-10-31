from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from backend.app.database import Base

class SamplingHistory(Base):
    __tablename__ = "sampling_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="CASCADE"), nullable=False, index=True)
    sample_id = Column(Integer, ForeignKey("water_quality_samples.id", ondelete="SET NULL"), nullable=True)
    technician_name = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    action_taken = Column(String(255), nullable=True)
    sampled_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
