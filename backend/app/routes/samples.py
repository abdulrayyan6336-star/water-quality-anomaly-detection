from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database import get_db
from backend.app.models.sample import WaterQualitySample, SourceType
from backend.app.models.station import MonitoringStation
from backend.app.schemas.sample import SampleCreate, SampleResponse
from backend.app.services.anomaly_service import AnomalyService
import uuid

router = APIRouter(prefix="/samples", tags=["Water Quality Samples"])

@router.post("", response_model=SampleResponse, status_code=status.HTTP_201_CREATED)
def ingest_sample(sample_in: SampleCreate, db: Session = Depends(get_db)):
    """
    Ingest a new water quality reading from an IoT sensor stream or field manual test.
    Automatically triggers hybrid Isolation Forest & threshold anomaly evaluation.
    """
    station = db.query(MonitoringStation).filter(MonitoringStation.id == sample_in.station_id).first()
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station with ID {sample_in.station_id} does not exist."
        )

    # Generate sample ID if not provided
    sample_id = f"SMP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    location = sample_in.location_name or station.name

    sample = WaterQualitySample(
        sample_id=sample_id,
        station_id=station.id,
        location_name=location,
        ph=sample_in.ph,
        turbidity=sample_in.turbidity,
        dissolved_oxygen=sample_in.dissolved_oxygen,
        temperature=sample_in.temperature,
        tds=sample_in.tds,
        electrical_conductivity=sample_in.electrical_conductivity,
        source_type=sample_in.source_type or SourceType.sensor,
        collected_at=sample_in.collected_at or datetime.now()
    )
    db.add(sample)
    db.commit()
    db.refresh(sample)

    # Trigger automatic Anomaly Detection and alert processing
    AnomalyService.process_and_persist_sample_anomaly(db, sample)

    return sample

@router.get("", response_model=List[SampleResponse])
def get_samples(
    station_id: Optional[int] = None,
    source_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve list of water quality samples with optional filtering by station and source type."""
    query = db.query(WaterQualitySample).order_by(desc(WaterQualitySample.collected_at))
    if station_id:
        query = query.filter(WaterQualitySample.station_id == station_id)
    if source_type:
        query = query.filter(WaterQualitySample.source_type == source_type)
    return query.limit(limit).all()

@router.get("/{sample_id}", response_model=SampleResponse)
def get_sample(sample_id: str, db: Session = Depends(get_db)):
    """Retrieve an individual water quality sample record by its sample ID or integer primary key."""
    # Check if integer ID or string sample_id
    if sample_id.isdigit():
        sample = db.query(WaterQualitySample).filter(WaterQualitySample.id == int(sample_id)).first()
    else:
        sample = db.query(WaterQualitySample).filter(WaterQualitySample.sample_id == sample_id).first()

    if not sample:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Water quality sample record not found.")
    return sample
