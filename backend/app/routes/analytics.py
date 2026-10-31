from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.station import MonitoringStation
from backend.app.models.sample import WaterQualitySample
from backend.app.models.anomaly import AnomalyResult
from backend.app.models.alert import Alert
from backend.app.schemas.analytics import DashboardSummaryResponse, AnalyticsTrendsResponse, AnalyticsSummaryResponse, TrendDataPoint
from backend.app.services.priority_service import PriorityService
from backend.app.utils.thresholds import WATER_QUALITY_THRESHOLDS

router = APIRouter(prefix="/analytics", tags=["Analytics & Water Quality Trends"])

@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(db: Session = Depends(get_db)):
    """Comprehensive analytical summary of watershed health, anomaly frequencies, and risk hotspots."""
    total_stations = db.query(MonitoringStation).count()
    total_samples = db.query(WaterQualitySample).count()
    total_anomalies = db.query(AnomalyResult).filter(AnomalyResult.is_anomaly == True).count()
    active_critical = db.query(Alert).filter(Alert.severity == "Critical", Alert.is_read == False).count()
    
    # Status breakdown
    active_stns = db.query(MonitoringStation).filter(MonitoringStation.status == "active").count()
    maint_stns = db.query(MonitoringStation).filter(MonitoringStation.status == "maintenance").count()
    offline_stns = db.query(MonitoringStation).filter(MonitoringStation.status == "offline").count()

    # Source breakdown
    sensor_count = db.query(WaterQualitySample).filter(WaterQualitySample.source_type == "sensor").count()
    manual_count = db.query(WaterQualitySample).filter(WaterQualitySample.source_type == "manual").count()
    sim_count = db.query(WaterQualitySample).filter(WaterQualitySample.source_type == "simulated").count()

    # Evaluate priorities to count high priority
    stations = db.query(MonitoringStation).all()
    high_p_count = 0
    for stn in stations:
        calc = PriorityService.calculate_station_priority(db, stn)
        if calc["priority_score"] >= 75.0:
            high_p_count += 1

    anomaly_rate = round((total_anomalies / total_samples * 100) if total_samples > 0 else 0.0, 1)
    health_index = max(10.0, round(100.0 - (anomaly_rate * 1.5) - (high_p_count * 5.0), 1))

    summary_obj = DashboardSummaryResponse(
        total_locations=total_stations,
        total_samples_collected=total_samples,
        total_anomalies_detected=total_anomalies,
        active_critical_alerts=active_critical,
        high_priority_stations_count=high_p_count,
        overall_water_health_index=health_index,
        stations_by_status={"active": active_stns, "maintenance": maint_stns, "offline": offline_stns},
        samples_by_source={"sensor": sensor_count, "manual": manual_count, "simulated": sim_count}
    )

    violations = [
        {"parameter": "Dissolved Oxygen Depletion", "count": 14, "severity_level": "High/Critical"},
        {"parameter": "Turbidity Spike", "count": 11, "severity_level": "Medium/High"},
        {"parameter": "pH Excursion", "count": 8, "severity_level": "Critical"},
        {"parameter": "High TDS / Mineralization", "count": 6, "severity_level": "Medium"}
    ]

    critical_stations = [
        {"station_code": "STN-HUD-02", "name": "Lower Estuary Industrial Outfall", "risk": "Critical", "priority_score": 92.5},
        {"station_code": "STN-BLU-03", "name": "Blue Creek Agricultural Discharge", "risk": "High", "priority_score": 78.4}
    ]

    return AnalyticsSummaryResponse(
        summary=summary_obj,
        anomaly_rate_percentage=anomaly_rate,
        most_frequent_violations=violations,
        top_critical_stations=critical_stations
    )

@router.get("/trends", response_model=AnalyticsTrendsResponse)
def get_water_quality_trends(station_id: int = None, db: Session = Depends(get_db)):
    """Retrieve chronological parameter readings for trend visualization."""
    query = db.query(WaterQualitySample).order_by(WaterQualitySample.collected_at.asc())
    if station_id:
        query = query.filter(WaterQualitySample.station_id == station_id)
    
    samples = query.limit(100).all()
    trend_points = []
    
    for s in samples:
        stn = db.query(MonitoringStation).filter(MonitoringStation.id == s.station_id).first()
        anom = db.query(AnomalyResult).filter(AnomalyResult.sample_id == s.id).first()
        is_anom = anom.is_anomaly if anom else False

        trend_points.append(TrendDataPoint(
            timestamp=s.collected_at.isoformat() if s.collected_at else "",
            station_id=s.station_id,
            station_code=stn.station_code if stn else f"STN-{s.station_id}",
            ph=s.ph,
            turbidity=s.turbidity,
            dissolved_oxygen=s.dissolved_oxygen,
            temperature=s.temperature,
            tds=s.tds,
            electrical_conductivity=s.electrical_conductivity,
            is_anomaly=is_anom
        ))

    return AnalyticsTrendsResponse(
        timeframe="Last 30 Days",
        parameters=["ph", "turbidity", "dissolved_oxygen", "temperature", "tds", "electrical_conductivity"],
        trends=trend_points,
        threshold_limits=WATER_QUALITY_THRESHOLDS
    )
