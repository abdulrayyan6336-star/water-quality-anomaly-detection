from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardSummaryResponse(BaseModel):
    total_locations: int
    total_samples_collected: int
    total_anomalies_detected: int
    active_critical_alerts: int
    high_priority_stations_count: int
    overall_water_health_index: float  # 0 to 100
    stations_by_status: Dict[str, int]
    samples_by_source: Dict[str, int]

class TrendDataPoint(BaseModel):
    timestamp: str
    station_id: int
    station_code: str
    ph: float
    turbidity: float
    dissolved_oxygen: float
    temperature: float
    tds: float
    electrical_conductivity: float
    is_anomaly: bool

class AnalyticsTrendsResponse(BaseModel):
    timeframe: str
    parameters: List[str]
    trends: List[TrendDataPoint]
    threshold_limits: Dict[str, Any]

class AnalyticsSummaryResponse(BaseModel):
    summary: DashboardSummaryResponse
    anomaly_rate_percentage: float
    most_frequent_violations: List[Dict[str, Any]]
    top_critical_stations: List[Dict[str, Any]]
