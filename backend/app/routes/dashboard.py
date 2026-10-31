from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.station import MonitoringStation
from backend.app.models.sample import WaterQualitySample
from backend.app.models.anomaly import AnomalyResult
from backend.app.models.alert import Alert
from backend.app.schemas.analytics import DashboardSummaryResponse
from backend.app.services.priority_service import PriorityService

router = APIRouter(tags=["Executive Dashboard"])

@router.get("/dashboard", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Consolidated executive summary of monitoring stations, samples, anomalies,
    active critical alerts, and priority distribution.
    """
    total_locations = db.query(MonitoringStation).count()
    total_samples = db.query(WaterQualitySample).count()
    total_anomalies = db.query(AnomalyResult).filter(AnomalyResult.is_anomaly == True).count()
    active_critical = db.query(Alert).filter(Alert.severity == "Critical", Alert.is_read == False).count()
    
    active_stns = db.query(MonitoringStation).filter(MonitoringStation.status == "active").count()
    maint_stns = db.query(MonitoringStation).filter(MonitoringStation.status == "maintenance").count()
    offline_stns = db.query(MonitoringStation).filter(MonitoringStation.status == "offline").count()

    sensor_samples = db.query(WaterQualitySample).filter(WaterQualitySample.source_type == "sensor").count()
    manual_samples = db.query(WaterQualitySample).filter(WaterQualitySample.source_type == "manual").count()
    sim_samples = db.query(WaterQualitySample).filter(WaterQualitySample.source_type == "simulated").count()

    stations = db.query(MonitoringStation).all()
    high_priority_count = 0
    for stn in stations:
        calc = PriorityService.calculate_station_priority(db, stn)
        if calc["priority_score"] >= 75.0:
            high_priority_count += 1

    anomaly_pct = (total_anomalies / total_samples * 100) if total_samples > 0 else 0.0
    water_health_index = max(15.0, round(100.0 - (anomaly_pct * 1.4) - (high_priority_count * 4.5), 1))

    return DashboardSummaryResponse(
        total_locations=total_locations,
        total_samples_collected=total_samples,
        total_anomalies_detected=total_anomalies,
        active_critical_alerts=active_critical,
        high_priority_stations_count=high_priority_count,
        overall_water_health_index=water_health_index,
        stations_by_status={"active": active_stns, "maintenance": maint_stns, "offline": offline_stns},
        samples_by_source={"sensor": sensor_samples, "manual": manual_samples, "simulated": sim_samples}
    )
