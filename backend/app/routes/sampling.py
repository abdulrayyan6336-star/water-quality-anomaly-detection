from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.station import MonitoringStation
from backend.app.schemas.priority import PriorityResponse, RecommendRequest, RecommendScheduleResponse
from backend.app.services.priority_service import PriorityService

router = APIRouter(prefix="/sampling", tags=["Smart Sampling Prioritizer"])

@router.get("/priorities", response_model=List[PriorityResponse])
def get_sampling_priorities(db: Session = Depends(get_db)):
    """
    Retrieve ranked monitoring stations ordered by sampling priority score (0 - 100).
    Categorized into High Priority (75-100), Medium Priority (40-74), and Low Priority (0-39).
    """
    stations = db.query(MonitoringStation).all()
    results = []
    for stn in stations:
        calc = PriorityService.calculate_station_priority(db, stn)
        results.append(PriorityResponse(
            id=stn.id,
            station_id=stn.id,
            station_code=stn.station_code,
            station_name=stn.name,
            basin=stn.basin,
            priority_score=calc["priority_score"],
            category=calc["category"],
            days_since_last_sample=calc["days_since_last_sample"],
            historical_violation_rate=calc["historical_violation_rate"],
            location_risk_weight=calc["location_risk_weight"],
            sensor_unreliability_score=calc["sensor_unreliability_score"],
            recommended_date=calc["recommended_date"],
            recommendation_reason=calc["recommendation_reason"]
        ))
    
    # Sort descending by priority score
    results.sort(key=lambda x: x.priority_score, reverse=True)
    return results

@router.post("/recommend", response_model=RecommendScheduleResponse)
def generate_recommendation_schedule(req: RecommendRequest = None, db: Session = Depends(get_db)):
    """
    Recalculates sampling priority across the watershed and generates an actionable schedule.
    """
    persisted = PriorityService.recalculate_all_priorities(db)
    
    ranked_responses = []
    high_count = 0
    med_count = 0
    low_count = 0

    for p in persisted:
        stn = db.query(MonitoringStation).filter(MonitoringStation.id == p.station_id).first()
        res = PriorityResponse(
            id=p.id,
            station_id=p.station_id,
            station_code=stn.station_code if stn else f"STN-{p.station_id}",
            station_name=stn.name if stn else "Unknown Station",
            basin=stn.basin if stn else "General Basin",
            priority_score=p.priority_score,
            category=p.category.value if hasattr(p.category, "value") else str(p.category),
            days_since_last_sample=p.days_since_last_sample,
            historical_violation_rate=p.historical_violation_rate,
            location_risk_weight=p.location_risk_weight,
            sensor_unreliability_score=p.sensor_unreliability_score,
            recommended_date=p.recommended_date,
            recommendation_reason=p.recommendation_reason,
            calculated_at=p.calculated_at
        )
        ranked_responses.append(res)
        if "High" in str(res.category):
            high_count += 1
        elif "Medium" in str(res.category):
            med_count += 1
        else:
            low_count += 1

    summary_text = (
        f"Schedule generated for {len(ranked_responses)} stations. "
        f"{high_count} stations require immediate field dispatch (< 24h) due to active anomaly or risk; "
        f"{med_count} stations scheduled within 4 days; "
        f"{low_count} stations on routine cycle."
    )

    return RecommendScheduleResponse(
        total_stations_evaluated=len(ranked_responses),
        high_priority_count=high_count,
        medium_priority_count=med_count,
        low_priority_count=low_count,
        ranked_stations=ranked_responses,
        schedule_summary=summary_text
    )
