from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.station import StationCreate, StationUpdate, StationResponse
from backend.app.services.station_service import StationService

router = APIRouter(prefix="/stations", tags=["Monitoring Stations"])

@router.get("", response_model=List[StationResponse])
def get_stations(db: Session = Depends(get_db)):
    """Retrieve all water quality monitoring stations with telemetry and health score."""
    return StationService.get_all(db)

@router.post("", response_model=StationResponse, status_code=status.HTTP_201_CREATED)
def create_station(station_in: StationCreate, db: Session = Depends(get_db)):
    """Register a new monitoring station (GIS coordinates, basin, risk tier)."""
    existing = StationService.get_by_code(db, station_in.station_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Station code '{station_in.station_code}' already exists."
        )
    return StationService.create(db, station_in)

@router.get("/{station_id}", response_model=StationResponse)
def get_station(station_id: int, db: Session = Depends(get_db)):
    """Get detailed telemetry and parameters for a specific monitoring station."""
    stn = StationService.get_by_id(db, station_id)
    if not stn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found.")
    return stn

@router.put("/{station_id}", response_model=StationResponse)
def update_station(station_id: int, update_data: StationUpdate, db: Session = Depends(get_db)):
    """Update monitoring station status, coordinates, or health score."""
    stn = StationService.update(db, station_id, update_data)
    if not stn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found.")
    return stn

@router.delete("/{station_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_station(station_id: int, db: Session = Depends(get_db)):
    """Remove a monitoring station and its associated records."""
    success = StationService.delete(db, station_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found.")
    return None
