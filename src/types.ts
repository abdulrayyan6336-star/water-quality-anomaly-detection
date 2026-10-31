export interface Station {
  id: number;
  station_code: string;
  name: string;
  basin: string;
  location_description: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'maintenance' | 'offline';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  sensor_health_score: number;
  installation_date: string;
  last_calibrated_at?: string;
}

export interface Sample {
  id: number;
  sample_id: string;
  station_id: number;
  location_name: string;
  ph: number;
  turbidity: number;
  dissolved_oxygen: number;
  temperature: number;
  tds: number;
  electrical_conductivity: number;
  source_type: 'sensor' | 'manual' | 'simulated';
  collected_at: string;
  created_at?: string;
}

export interface AnomalyResult {
  id: number;
  sample_id: number;
  station_id: number;
  is_anomaly: boolean;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  anomaly_score: number;
  violated_parameters: string[];
  explanation: string;
  detected_at: string;
  parameter_contributions?: Record<string, number>;
}

export interface SamplingPriority {
  id: number;
  station_id: number;
  station_code: string;
  station_name: string;
  basin: string;
  priority_score: number;
  category: 'High Priority' | 'Medium Priority' | 'Low Priority';
  days_since_last_sample: number;
  historical_violation_rate: number;
  location_risk_weight: number;
  sensor_unreliability_score: number;
  recommended_date: string;
  recommendation_reason: string;
  calculated_at?: string;
}

export interface Alert {
  id: number;
  alert_id: string;
  station_id: number;
  station_name?: string;
  station_code?: string;
  sample_id?: number | null;
  parameter: string;
  message: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  is_read: boolean;
  triggered_at: string;
}

export interface DashboardSummary {
  total_locations: number;
  total_samples_collected: number;
  total_anomalies_detected: number;
  active_critical_alerts: number;
  high_priority_stations_count: number;
  overall_water_health_index: number;
  stations_by_status: {
    active: number;
    maintenance: number;
    offline: number;
  };
  samples_by_source: {
    sensor: number;
    manual: number;
    simulated: number;
  };
}
