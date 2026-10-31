from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database import get_db
from backend.app.models.anomaly import AnomalyResult
from backend.app.models.sample import WaterQualitySample
from backend.app.schemas.anomaly import AnomalyDetectRequest, AnomalyResultResponse, AnomalyInferenceDetail
from backend.app.services.anomaly_service import AnomalyService

router = APIRouter(prefix="/anomaly", tags=["AI Anomaly Detection"])

@router.post("/detect", response_model=AnomalyInferenceDetail)
def detect_anomaly(req: AnomalyDetectRequest, db: Session = Depends(get_db)):
    """
    On-demand AI Anomaly Detection via Isolation Forest model and limnological validation rules.
    Accepts either an existing sample_id or raw ad-hoc sensor parameters.
    """
    if req.sample_id:
        sample = db.query(WaterQualitySample).filter(WaterQualitySample.id == req.sample_id).first()
        if not sample:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sample not found.")
        sample_dict = {
            "ph": sample.ph,
            "turbidity": sample.turbidity,
            "dissolved_oxygen": sample.dissolved_oxygen,
            "temperature": sample.temperature,
            "tds": sample.tds,
            "electrical_conductivity": sample.electrical_conductivity
        }
    else:
        sample_dict = {
            "ph": req.ph if req.ph is not None else 7.3,
            "turbidity": req.turbidity if req.turbidity is not None else 2.1,
            "dissolved_oxygen": req.dissolved_oxygen if req.dissolved_oxygen is not None else 8.5,
            "temperature": req.temperature if req.temperature is not None else 18.0,
            "tds": req.tds if req.tds is not None else 230.0,
            "electrical_conductivity": req.electrical_conductivity if req.electrical_conductivity is not None else 360.0
        }

    eval_result = AnomalyService.evaluate_sample_data(sample_dict)
    return eval_result

@router.get("/results", response_model=List[AnomalyResultResponse])
def get_anomaly_results(
    anomalies_only: bool = False,
    station_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve historical machine learning anomaly detection results."""
    query = db.query(AnomalyResult).order_by(desc(AnomalyResult.detected_at))
    if anomalies_only:
        query = query.filter(AnomalyResult.is_anomaly == True)
    if station_id:
        query = query.filter(AnomalyResult.station_id == station_id)
    return query.limit(limit).all()
