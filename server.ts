import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-Memory Database store with pre-seeded data mirroring MySQL tables
interface Station {
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
  last_calibrated_at: string;
}

interface Sample {
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
  created_at: string;
}

interface Anomaly {
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

interface Alert {
  id: number;
  alert_id: string;
  station_id: number;
  sample_id: number | null;
  parameter: string;
  message: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  is_read: boolean;
  triggered_at: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'analyst' | 'technician';
}

// Seed Data
let stations: Station[] = [
  {
    id: 1,
    station_code: 'STN-HUD-01',
    name: 'Upper Hudson Intake Reserve',
    basin: 'Hudson River Valley',
    location_description: 'Upstream drinking water supply intake 4.2 km north of municipal dam',
    latitude: 42.652588,
    longitude: -73.756232,
    status: 'active',
    risk_level: 'low',
    sensor_health_score: 98.5,
    installation_date: '2023-03-15',
    last_calibrated_at: '2026-09-12T10:00:00Z',
  },
  {
    id: 2,
    station_code: 'STN-HUD-02',
    name: 'Lower Estuary Industrial Outfall',
    basin: 'Hudson River Valley',
    location_description: 'Direct industrial discharge confluence zone, chemical refinery proximity',
    latitude: 42.548900,
    longitude: -73.784500,
    status: 'active',
    risk_level: 'critical',
    sensor_health_score: 74.0,
    installation_date: '2022-07-20',
    last_calibrated_at: '2026-08-01T14:30:00Z',
  },
  {
    id: 3,
    station_code: 'STN-CLR-01',
    name: 'Clearwater Alpine Reservoir',
    basin: 'Adirondack Basin',
    location_description: 'Pristine mountain runoff source feeding metropolitan aqueduct',
    latitude: 43.120000,
    longitude: -74.150000,
    status: 'active',
    risk_level: 'low',
    sensor_health_score: 99.2,
    installation_date: '2024-01-10',
    last_calibrated_at: '2026-10-15T09:00:00Z',
  },
  {
    id: 4,
    station_code: 'STN-BLU-03',
    name: 'Blue Creek Agricultural Discharge',
    basin: 'Mohawk River Basin',
    location_description: 'Intensive agricultural runoff zone with seasonal nitrate/phosphate influx',
    latitude: 42.895000,
    longitude: -74.220000,
    status: 'active',
    risk_level: 'high',
    sensor_health_score: 84.5,
    installation_date: '2023-09-01',
    last_calibrated_at: '2026-07-18T11:20:00Z',
  },
  {
    id: 5,
    station_code: 'STN-QNS-05',
    name: 'Queensbury Wetland Sump',
    basin: 'Lake George Watershed',
    location_description: 'Natural bio-filtration marsh monitoring natural denitrification',
    latitude: 43.340000,
    longitude: -73.680000,
    status: 'maintenance',
    risk_level: 'medium',
    sensor_health_score: 62.0,
    installation_date: '2021-11-05',
    last_calibrated_at: '2026-05-20T16:45:00Z',
  },
  {
    id: 6,
    station_code: 'STN-ALB-08',
    name: 'Albany Port Maritime Basin',
    basin: 'Hudson Estuary',
    location_description: 'Commercial shipping dock, potential petroleum ballast and heavy metal wash',
    latitude: 42.620000,
    longitude: -73.760000,
    status: 'active',
    risk_level: 'high',
    sensor_health_score: 91.0,
    installation_date: '2023-11-12',
    last_calibrated_at: '2026-09-29T08:30:00Z',
  },
];

let samples: Sample[] = [
  {
    id: 1,
    sample_id: 'SMP-2026-001',
    station_id: 1,
    location_name: 'Upper Hudson Intake Reserve',
    ph: 7.42,
    turbidity: 2.15,
    dissolved_oxygen: 8.85,
    temperature: 16.4,
    tds: 210.0,
    electrical_conductivity: 310.0,
    source_type: 'sensor',
    collected_at: '2026-10-30T08:00:00Z',
    created_at: '2026-10-30T08:01:00Z',
  },
  {
    id: 2,
    sample_id: 'SMP-2026-002',
    station_id: 2,
    location_name: 'Lower Estuary Industrial Outfall',
    ph: 9.20,
    turbidity: 14.80,
    dissolved_oxygen: 3.10,
    temperature: 26.8,
    tds: 680.0,
    electrical_conductivity: 940.0,
    source_type: 'sensor',
    collected_at: '2026-10-30T08:15:00Z',
    created_at: '2026-10-30T08:15:30Z',
  },
  {
    id: 3,
    sample_id: 'SMP-2026-003',
    station_id: 3,
    location_name: 'Clearwater Alpine Reservoir',
    ph: 7.10,
    turbidity: 0.85,
    dissolved_oxygen: 9.60,
    temperature: 11.2,
    tds: 85.0,
    electrical_conductivity: 120.0,
    source_type: 'sensor',
    collected_at: '2026-10-30T08:30:00Z',
    created_at: '2026-10-30T08:30:45Z',
  },
  {
    id: 4,
    sample_id: 'SMP-2026-004',
    station_id: 4,
    location_name: 'Blue Creek Agricultural Discharge',
    ph: 6.15,
    turbidity: 9.40,
    dissolved_oxygen: 4.30,
    temperature: 21.5,
    tds: 540.0,
    electrical_conductivity: 780.0,
    source_type: 'manual',
    collected_at: '2026-10-30T09:00:00Z',
    created_at: '2026-10-30T09:05:00Z',
  },
  {
    id: 5,
    sample_id: 'SMP-2026-005',
    station_id: 6,
    location_name: 'Albany Port Maritime Basin',
    ph: 7.85,
    turbidity: 6.20,
    dissolved_oxygen: 5.90,
    temperature: 19.8,
    tds: 420.0,
    electrical_conductivity: 590.0,
    source_type: 'sensor',
    collected_at: '2026-10-30T09:30:00Z',
    created_at: '2026-10-30T09:31:00Z',
  },
  {
    id: 6,
    sample_id: 'SMP-2026-006',
    station_id: 1,
    location_name: 'Upper Hudson Intake Reserve',
    ph: 7.38,
    turbidity: 2.30,
    dissolved_oxygen: 8.70,
    temperature: 16.8,
    tds: 215.0,
    electrical_conductivity: 318.0,
    source_type: 'sensor',
    collected_at: '2026-10-31T01:00:00Z',
    created_at: '2026-10-31T01:02:00Z',
  },
  {
    id: 7,
    sample_id: 'SMP-2026-007',
    station_id: 2,
    location_name: 'Lower Estuary Industrial Outfall',
    ph: 9.45,
    turbidity: 18.20,
    dissolved_oxygen: 2.80,
    temperature: 27.5,
    tds: 720.0,
    electrical_conductivity: 1020.0,
    source_type: 'sensor',
    collected_at: '2026-10-31T02:00:00Z',
    created_at: '2026-10-31T02:01:00Z',
  }
];

let anomalies: Anomaly[] = [
  {
    id: 1,
    sample_id: 2,
    station_id: 2,
    is_anomaly: true,
    severity: 'Critical',
    anomaly_score: 0.875,
    violated_parameters: ['pH', 'Turbidity', 'Dissolved Oxygen', 'TDS'],
    explanation: 'Isolation Forest detected severe multivariate anomaly (Score: 0.875). Critical alkaline excursion (pH 9.20 > 8.5) paired with hypoxic oxygen crash (DO 3.10 < 5.0 mg/L) and turbidity spike (14.8 NTU). Suggests industrial effluent flush.',
    detected_at: '2026-10-30T08:16:00Z',
    parameter_contributions: {
      ph: 38.5,
      dissolved_oxygen: 32.1,
      turbidity: 18.4,
      tds: 8.0,
      electrical_conductivity: 2.0,
      temperature: 1.0,
    },
  },
  {
    id: 2,
    sample_id: 4,
    station_id: 4,
    is_anomaly: true,
    severity: 'High',
    anomaly_score: 0.692,
    violated_parameters: ['pH', 'Turbidity', 'Dissolved Oxygen'],
    explanation: 'Sub-neutral acidic reading (pH 6.15 < 6.5) with depleted dissolved oxygen (4.30 mg/L) and suspended agricultural particulate (9.4 NTU). Consistent with fertilizer runoff washing into stream.',
    detected_at: '2026-10-30T09:02:00Z',
    parameter_contributions: {
      turbidity: 41.2,
      dissolved_oxygen: 30.5,
      ph: 18.3,
      tds: 5.0,
      temperature: 3.0,
      electrical_conductivity: 2.0,
    },
  },
  {
    id: 3,
    sample_id: 7,
    station_id: 2,
    is_anomaly: true,
    severity: 'Critical',
    anomaly_score: 0.942,
    violated_parameters: ['pH', 'Turbidity', 'Dissolved Oxygen', 'TDS', 'Electrical Conductivity'],
    explanation: 'Extreme chemical discharge event: Caustic surge (pH 9.45) with severe hypoxia (DO 2.80 mg/L) and acute turbidity (18.2 NTU). Immediate containment mandated.',
    detected_at: '2026-10-31T02:01:05Z',
    parameter_contributions: {
      ph: 42.0,
      dissolved_oxygen: 35.0,
      turbidity: 14.0,
      tds: 5.5,
      electrical_conductivity: 2.5,
      temperature: 1.0,
    },
  }
];

let alerts: Alert[] = [
  {
    id: 1,
    alert_id: 'ALT-2026-001',
    station_id: 2,
    sample_id: 2,
    parameter: 'Dissolved Oxygen & pH',
    message: 'Critical DO hypoxia detected (3.1 mg/L) with alkaline spike (pH 9.20) at Lower Estuary',
    severity: 'Critical',
    is_read: false,
    triggered_at: '2026-10-30T08:16:05Z',
  },
  {
    id: 2,
    alert_id: 'ALT-2026-002',
    station_id: 2,
    sample_id: 2,
    parameter: 'Turbidity',
    message: 'Turbidity limit exceeded: 14.80 NTU (Safe statutory threshold: 5.0 NTU)',
    severity: 'High',
    is_read: false,
    triggered_at: '2026-10-30T08:16:06Z',
  },
  {
    id: 3,
    alert_id: 'ALT-2026-003',
    station_id: 4,
    sample_id: 4,
    parameter: 'Dissolved Oxygen',
    message: 'Depressed DO reading at Blue Creek Agricultural (4.30 mg/L < 5.0 mg/L threshold)',
    severity: 'Medium',
    is_read: true,
    triggered_at: '2026-10-30T09:02:10Z',
  },
  {
    id: 4,
    alert_id: 'ALT-2026-004',
    station_id: 2,
    sample_id: 7,
    parameter: 'pH & Hypoxia',
    message: 'Extreme caustic spill event: pH 9.45 with critical DO depletion (2.8 mg/L)',
    severity: 'Critical',
    is_read: false,
    triggered_at: '2026-10-31T02:01:10Z',
  }
];

const users: User[] = [
  { id: 1, username: 'admin', email: 'admin@aquashield.io', full_name: 'Chief Limnology Administrator', role: 'admin' },
  { id: 2, username: 'elena.vance', email: 'elena.vance@aquashield.io', full_name: 'Dr. Elena Vance (Lead Limnologist)', role: 'analyst' },
  { id: 3, username: 'marcus.chen', email: 'marcus.chen@aquashield.io', full_name: 'Marcus Chen (Field Technician)', role: 'technician' }
];

// Helper: Smart Anomaly Engine (Isolation Forest emulation + regulatory thresholds)
function evaluateAnomaly(reading: {
  ph: number;
  turbidity: number;
  dissolved_oxygen: number;
  temperature: number;
  tds: number;
  electrical_conductivity: number;
}): {
  is_anomaly: boolean;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  anomaly_score: number;
  violated_parameters: string[];
  explanation: string;
  parameter_contributions: Record<string, number>;
  threshold_assessment: any;
} {
  const violations: string[] = [];
  const explanations: string[] = [];
  let highestSeverity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';

  const updateSeverity = (newSev: 'Low' | 'Medium' | 'High' | 'Critical') => {
    const rank: Record<'Low' | 'Medium' | 'High' | 'Critical', number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Critical: 4,
    };
    if (rank[newSev] > rank[highestSeverity]) {
      highestSeverity = newSev;
    }
  };

  // EPA / WHO Thresholds
  if (reading.ph < 5.5 || reading.ph > 9.5) {
    violations.push('pH');
    updateSeverity('Critical');
    explanations.push(`Critical pH excursion (${reading.ph.toFixed(2)} outside 5.5 - 9.5 critical limits)`);
  } else if (reading.ph < 6.5 || reading.ph > 8.5) {
    violations.push('pH');
    updateSeverity('High');
    explanations.push(`Unsafe pH level (${reading.ph.toFixed(2)} outside 6.5 - 8.5 safe drinking range)`);
  }

  if (reading.dissolved_oxygen < 3.0) {
    violations.push('Dissolved Oxygen');
    updateSeverity('Critical');
    explanations.push(`Critical aquatic hypoxia: DO is ${reading.dissolved_oxygen.toFixed(2)} mg/L (< 3.0 mg/L dead-zone)`);
  } else if (reading.dissolved_oxygen < 5.0) {
    violations.push('Dissolved Oxygen');
    updateSeverity('High');
    explanations.push(`Depressed Dissolved Oxygen: ${reading.dissolved_oxygen.toFixed(2)} mg/L (minimum baseline: 5.0 mg/L)`);
  }

  if (reading.turbidity >= 20.0) {
    violations.push('Turbidity');
    updateSeverity('Critical');
    explanations.push(`Extreme turbidity: ${reading.turbidity.toFixed(2)} NTU (> 20 NTU critical threshold)`);
  } else if (reading.turbidity > 5.0) {
    violations.push('Turbidity');
    updateSeverity('Medium');
    explanations.push(`Elevated turbidity: ${reading.turbidity.toFixed(2)} NTU (> 5.0 NTU safe standard)`);
  }

  if (reading.tds >= 1000.0) {
    violations.push('TDS');
    updateSeverity('Critical');
    explanations.push(`Dangerous total dissolved solids: ${reading.tds.toFixed(0)} mg/L (> 1000 mg/L)`);
  } else if (reading.tds > 500.0) {
    violations.push('TDS');
    updateSeverity('Medium');
    explanations.push(`Abnormal TDS: ${reading.tds.toFixed(0)} mg/L (> 500 mg/L recommended limit)`);
  }

  if (reading.electrical_conductivity > 1200.0) {
    violations.push('Electrical Conductivity');
    updateSeverity('High');
    explanations.push(`High conductivity: ${reading.electrical_conductivity.toFixed(0)} µS/cm (> 1200 µS/cm)`);
  }

  // Isolation Forest multivariate deviation calculation
  // Z-scores against limnological baselines:
  const z_ph = Math.abs(reading.ph - 7.35) / 0.45;
  const z_do = Math.max(0, 8.4 - reading.dissolved_oxygen) / 1.2;
  const z_turb = Math.max(0, reading.turbidity - 2.2) / 1.4;
  const z_tds = Math.max(0, reading.tds - 240) / 75;
  const z_ec = Math.max(0, reading.electrical_conductivity - 380) / 120;
  const z_temp = Math.abs(reading.temperature - 18.5) / 4.2;

  const totalDev = z_ph + z_do + z_turb + z_tds + z_ec + z_temp;
  const rawScore = Math.min(1.0, (z_ph * 0.3 + z_do * 0.3 + z_turb * 0.2 + z_tds * 0.1 + z_ec * 0.05 + z_temp * 0.05) / 4.5);
  const anomalyScore = Math.round(rawScore * 1000) / 1000;

  const contributions: Record<string, number> = {
    ph: totalDev > 0 ? Math.round((z_ph / totalDev) * 100) : 16,
    dissolved_oxygen: totalDev > 0 ? Math.round((z_do / totalDev) * 100) : 16,
    turbidity: totalDev > 0 ? Math.round((z_turb / totalDev) * 100) : 16,
    tds: totalDev > 0 ? Math.round((z_tds / totalDev) * 100) : 16,
    electrical_conductivity: totalDev > 0 ? Math.round((z_ec / totalDev) * 100) : 16,
    temperature: totalDev > 0 ? Math.round((z_temp / totalDev) * 100) : 16,
  };

  const isAnomaly = violations.length > 0 || anomalyScore >= 0.50;
  if (isAnomaly && highestSeverity === 'Low') highestSeverity = 'Medium';

  const explanation = explanations.length > 0
    ? explanations.join('; ')
    : isAnomaly
    ? `Isolation Forest detected anomalous multidimensional pattern (Score: ${anomalyScore}).`
    : `Normal water quality characteristics (Score: ${anomalyScore}). All parameters within statutory standards.`;

  return {
    is_anomaly: isAnomaly,
    severity: highestSeverity,
    anomaly_score: anomalyScore,
    violated_parameters: violations,
    explanation,
    parameter_contributions: contributions,
    threshold_assessment: {
      has_violations: violations.length > 0,
      violations,
      severity: highestSeverity,
      explanation,
    }
  };
}

// Helper: Smart Sampling Priority 5-Factor Algorithm (0 - 100)
function calculateStationPriority(stn: Station) {
  const stnSamples = samples.filter(s => s.station_id === stn.id);
  const latestSample = stnSamples[stnSamples.length - 1];

  let anomalyPoints = 5.0;
  let activeSeverity = 'Low';
  const reasons: string[] = [];

  if (latestSample) {
    const latestAnom = anomalies.find(a => a.sample_id === latestSample.id);
    if (latestAnom && latestAnom.is_anomaly) {
      activeSeverity = latestAnom.severity;
      if (latestAnom.severity === 'Critical') {
        anomalyPoints = 35.0;
        reasons.push('Active Critical anomaly on most recent sensor telemetry');
      } else if (latestAnom.severity === 'High') {
        anomalyPoints = 26.0;
        reasons.push('High-severity parameter breach recorded');
      } else if (latestAnom.severity === 'Medium') {
        anomalyPoints = 18.0;
        reasons.push('Moderate parameter variance detected');
      }
    }
  }

  // 2. Previous history
  const anomCount = anomalies.filter(a => a.station_id === stn.id && a.is_anomaly).length;
  const histRate = stnSamples.length > 0 ? (anomCount / stnSamples.length) * 100 : 0;
  const historyPoints = Math.min(20.0, (histRate / 100) * 35.0);
  if (histRate > 25) {
    reasons.push(`Frequent violation history (${histRate.toFixed(1)}% past anomalies)`);
  }

  // 3. Time elapsed
  let daysSince = 14;
  if (latestSample) {
    const diffMs = Date.now() - new Date(latestSample.collected_at).getTime();
    daysSince = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }
  let timePoints = 4.0;
  if (daysSince >= 21) {
    timePoints = 20.0;
    reasons.push(`Overdue for manual audit: ${daysSince} days since last sample`);
  } else if (daysSince >= 14) {
    timePoints = 14.0;
    reasons.push(`Cadence window reached (${daysSince} days elapsed)`);
  } else if (daysSince >= 7) {
    timePoints = 9.0;
  }

  // 4. Location risk
  const riskMap = { critical: 15.0, high: 11.0, medium: 6.0, low: 2.0 };
  const locPoints = riskMap[stn.risk_level] || 6.0;
  if (stn.risk_level === 'critical' || stn.risk_level === 'high') {
    reasons.push(`High vulnerability zone (${stn.risk_level.toUpperCase()})`);
  }

  // 5. Sensor health
  const health = stn.sensor_health_score || 95.0;
  let unreliabilityPoints = Math.min(10.0, Math.max(0.0, (100 - health) * 0.12));
  if (stn.status !== 'active') {
    unreliabilityPoints = 10.0;
    reasons.push(`Station status is ${stn.status.toUpperCase()}`);
  } else if (health < 80) {
    reasons.push(`Sensor degradation: Telemetry reliability at ${health.toFixed(1)}%`);
  }

  const rawScore = anomalyPoints + historyPoints + timePoints + locPoints + unreliabilityPoints;
  const totalScore = Math.min(100.0, Math.max(0.0, Math.round(rawScore * 10) / 10));

  let category: 'High Priority' | 'Medium Priority' | 'Low Priority' = 'Low Priority';
  let recommendedDate = new Date();
  if (totalScore >= 75.0) {
    category = 'High Priority';
    recommendedDate.setDate(recommendedDate.getDate() + 1);
  } else if (totalScore >= 40.0) {
    category = 'Medium Priority';
    recommendedDate.setDate(recommendedDate.getDate() + 4);
  } else {
    category = 'Low Priority';
    recommendedDate.setDate(recommendedDate.getDate() + 14);
  }

  return {
    id: stn.id,
    station_id: stn.id,
    station_code: stn.station_code,
    station_name: stn.name,
    basin: stn.basin,
    priority_score: totalScore,
    category,
    days_since_last_sample: daysSince,
    historical_violation_rate: Math.round(histRate * 10) / 10,
    location_risk_weight: locPoints,
    sensor_unreliability_score: Math.round(unreliabilityPoints * 10) / 10,
    recommended_date: recommendedDate.toISOString().split('T')[0],
    recommendation_reason: reasons.length > 0 ? reasons.join('; ') : 'Routine monitoring schedule.',
    calculated_at: new Date().toISOString(),
  };
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Auth APIs
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, full_name, role } = req.body;
  if (!username || !email) {
    return res.status(400).json({ detail: 'Username and email required' });
  }
  const newUser: User = {
    id: users.length + 1,
    username,
    email,
    full_name: full_name || username,
    role: role || 'technician',
  };
  users.push(newUser);
  return res.status(201).json(newUser);
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username } = req.body;
  const user = users.find(u => u.username === username) || users[0];
  return res.json({
    access_token: `jwt_token_${user.id}_${Date.now()}`,
    token_type: 'bearer',
    expires_in: 86400,
    user_id: user.id,
    username: user.username,
    role: user.role,
    full_name: user.full_name,
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  return res.json(users[0]);
});

// 2. Executive Dashboard
app.get('/api/dashboard', (req: Request, res: Response) => {
  const totalLocations = stations.length;
  const totalSamples = samples.length;
  const totalAnomalies = anomalies.filter(a => a.is_anomaly).length;
  const activeCriticalAlerts = alerts.filter(a => a.severity === 'Critical' && !a.is_read).length;

  const priorities = stations.map(calculateStationPriority);
  const highPriorityCount = priorities.filter(p => p.category === 'High Priority').length;

  const anomalyPct = totalSamples > 0 ? (totalAnomalies / totalSamples) * 100 : 0;
  const healthIndex = Math.max(15, Math.round((100 - anomalyPct * 1.5 - highPriorityCount * 4.0) * 10) / 10);

  return res.json({
    total_locations: totalLocations,
    total_samples_collected: totalSamples,
    total_anomalies_detected: totalAnomalies,
    active_critical_alerts: activeCriticalAlerts,
    high_priority_stations_count: highPriorityCount,
    overall_water_health_index: healthIndex,
    stations_by_status: {
      active: stations.filter(s => s.status === 'active').length,
      maintenance: stations.filter(s => s.status === 'maintenance').length,
      offline: stations.filter(s => s.status === 'offline').length,
    },
    samples_by_source: {
      sensor: samples.filter(s => s.source_type === 'sensor').length,
      manual: samples.filter(s => s.source_type === 'manual').length,
      simulated: samples.filter(s => s.source_type === 'simulated').length,
    }
  });
});

// 3. Water Quality Samples Ingestion & Retrieval
app.post('/api/samples', (req: Request, res: Response) => {
  const {
    station_id,
    location_name,
    ph,
    turbidity,
    dissolved_oxygen,
    temperature,
    tds,
    electrical_conductivity,
    source_type,
    collected_at
  } = req.body;

  const station = stations.find(s => s.id === Number(station_id));
  if (!station) {
    return res.status(404).json({ detail: `Station with ID ${station_id} not found` });
  }

  const sampleId = `SMP-${new Date().getFullYear()}-${String(samples.length + 1).padStart(3, '0')}`;
  const newSample: Sample = {
    id: samples.length + 1,
    sample_id: sampleId,
    station_id: station.id,
    location_name: location_name || station.name,
    ph: Number(ph),
    turbidity: Number(turbidity),
    dissolved_oxygen: Number(dissolved_oxygen),
    temperature: Number(temperature),
    tds: Number(tds),
    electrical_conductivity: Number(electrical_conductivity),
    source_type: source_type || 'sensor',
    collected_at: collected_at || new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  samples.unshift(newSample);

  // Run Anomaly Detection and create Anomaly result
  const evalRes = evaluateAnomaly(newSample);
  const newAnomaly: Anomaly = {
    id: anomalies.length + 1,
    sample_id: newSample.id,
    station_id: station.id,
    is_anomaly: evalRes.is_anomaly,
    severity: evalRes.severity,
    anomaly_score: evalRes.anomaly_score,
    violated_parameters: evalRes.violated_parameters,
    explanation: evalRes.explanation,
    detected_at: new Date().toISOString(),
    parameter_contributions: evalRes.parameter_contributions,
  };
  anomalies.unshift(newAnomaly);

  // Generate alerts if critical or high anomaly
  if (evalRes.is_anomaly && (evalRes.severity === 'High' || evalRes.severity === 'Critical')) {
    const alertId = `ALT-${new Date().getFullYear()}-${String(alerts.length + 1).padStart(3, '0')}`;
    alerts.unshift({
      id: alerts.length + 1,
      alert_id: alertId,
      station_id: station.id,
      sample_id: newSample.id,
      parameter: evalRes.violated_parameters.join(', ') || 'Multivariate Anomaly',
      message: `${evalRes.severity} alert at ${station.name}: ${evalRes.explanation.slice(0, 100)}...`,
      severity: evalRes.severity,
      is_read: false,
      triggered_at: new Date().toISOString(),
    });
  }

  return res.status(201).json(newSample);
});

app.get('/api/samples', (req: Request, res: Response) => {
  const { station_id, source_type, limit } = req.query;
  let filtered = [...samples];
  if (station_id) {
    filtered = filtered.filter(s => s.station_id === Number(station_id));
  }
  if (source_type) {
    filtered = filtered.filter(s => s.source_type === source_type);
  }
  const take = limit ? Number(limit) : 50;
  return res.json(filtered.slice(0, take));
});

app.get('/api/samples/:id', (req: Request, res: Response) => {
  const idOrCode = req.params.id;
  const sample = samples.find(s => s.id === Number(idOrCode) || s.sample_id === idOrCode);
  if (!sample) {
    return res.status(404).json({ detail: 'Sample record not found' });
  }
  return res.json(sample);
});

// 4. AI Anomaly Detection
app.post('/api/anomaly/detect', (req: Request, res: Response) => {
  const { sample_id, ph, turbidity, dissolved_oxygen, temperature, tds, electrical_conductivity } = req.body;
  let reading = {
    ph: 7.3,
    turbidity: 2.1,
    dissolved_oxygen: 8.5,
    temperature: 18.0,
    tds: 230.0,
    electrical_conductivity: 360.0
  };

  if (sample_id) {
    const found = samples.find(s => s.id === Number(sample_id));
    if (found) {
      reading = {
        ph: found.ph,
        turbidity: found.turbidity,
        dissolved_oxygen: found.dissolved_oxygen,
        temperature: found.temperature,
        tds: found.tds,
        electrical_conductivity: found.electrical_conductivity,
      };
    }
  } else {
    reading = {
      ph: ph !== undefined ? Number(ph) : 7.3,
      turbidity: turbidity !== undefined ? Number(turbidity) : 2.1,
      dissolved_oxygen: dissolved_oxygen !== undefined ? Number(dissolved_oxygen) : 8.5,
      temperature: temperature !== undefined ? Number(temperature) : 18.0,
      tds: tds !== undefined ? Number(tds) : 230.0,
      electrical_conductivity: electrical_conductivity !== undefined ? Number(electrical_conductivity) : 360.0,
    };
  }

  const result = evaluateAnomaly(reading);
  return res.json(result);
});

app.get('/api/anomaly/results', (req: Request, res: Response) => {
  const { anomalies_only, station_id } = req.query;
  let list = [...anomalies];
  if (anomalies_only === 'true') {
    list = list.filter(a => a.is_anomaly);
  }
  if (station_id) {
    list = list.filter(a => a.station_id === Number(station_id));
  }
  return res.json(list);
});

// 5. Smart Sampling Prioritizer
app.get('/api/sampling/priorities', (req: Request, res: Response) => {
  const list = stations.map(calculateStationPriority);
  list.sort((a, b) => b.priority_score - a.priority_score);
  return res.json(list);
});

app.post('/api/sampling/recommend', (req: Request, res: Response) => {
  const ranked = stations.map(calculateStationPriority);
  ranked.sort((a, b) => b.priority_score - a.priority_score);

  const high = ranked.filter(r => r.category === 'High Priority').length;
  const med = ranked.filter(r => r.category === 'Medium Priority').length;
  const low = ranked.filter(r => r.category === 'Low Priority').length;

  return res.json({
    total_stations_evaluated: ranked.length,
    high_priority_count: high,
    medium_priority_count: med,
    low_priority_count: low,
    ranked_stations: ranked,
    schedule_summary: `Smart Prioritizer analyzed ${ranked.length} watershed stations. ${high} require immediate physical dispatch (< 24h); ${med} scheduled within 4 days; ${low} on routine bi-weekly rotation.`
  });
});

// 6. Monitoring Station APIs
app.get('/api/stations', (req: Request, res: Response) => {
  return res.json(stations);
});

app.post('/api/stations', (req: Request, res: Response) => {
  const data = req.body;
  if (!data.name || !data.station_code) {
    return res.status(400).json({ detail: 'Name and station_code are required' });
  }
  const newStation: Station = {
    id: stations.length + 1,
    station_code: data.station_code,
    name: data.name,
    basin: data.basin || 'General Basin',
    location_description: data.location_description || '',
    latitude: Number(data.latitude) || 42.65,
    longitude: Number(data.longitude) || -73.75,
    status: data.status || 'active',
    risk_level: data.risk_level || 'medium',
    sensor_health_score: Number(data.sensor_health_score) || 95.0,
    installation_date: data.installation_date || new Date().toISOString().split('T')[0],
    last_calibrated_at: new Date().toISOString(),
  };
  stations.push(newStation);
  return res.status(201).json(newStation);
});

app.get('/api/stations/:id', (req: Request, res: Response) => {
  const stn = stations.find(s => s.id === Number(req.params.id));
  if (!stn) {
    return res.status(404).json({ detail: 'Station not found' });
  }
  return res.json(stn);
});

app.put('/api/stations/:id', (req: Request, res: Response) => {
  const idx = stations.findIndex(s => s.id === Number(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ detail: 'Station not found' });
  }
  stations[idx] = { ...stations[idx], ...req.body };
  return res.json(stations[idx]);
});

app.delete('/api/stations/:id', (req: Request, res: Response) => {
  const idx = stations.findIndex(s => s.id === Number(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ detail: 'Station not found' });
  }
  stations.splice(idx, 1);
  return res.status(204).send();
});

// 7. Analytics APIs
app.get('/api/analytics/trends', (req: Request, res: Response) => {
  const { station_id } = req.query;
  let filtered = [...samples].reverse(); // chronological
  if (station_id) {
    filtered = filtered.filter(s => s.station_id === Number(station_id));
  }

  const trends = filtered.map(s => {
    const anom = anomalies.find(a => a.sample_id === s.id);
    const stn = stations.find(st => st.id === s.station_id);
    return {
      timestamp: s.collected_at,
      station_id: s.station_id,
      station_code: stn ? stn.station_code : `STN-${s.station_id}`,
      ph: s.ph,
      turbidity: s.turbidity,
      dissolved_oxygen: s.dissolved_oxygen,
      temperature: s.temperature,
      tds: s.tds,
      electrical_conductivity: s.electrical_conductivity,
      is_anomaly: anom ? anom.is_anomaly : false,
    };
  });

  return res.json({
    timeframe: 'Last 30 Days',
    parameters: ['ph', 'turbidity', 'dissolved_oxygen', 'temperature', 'tds', 'electrical_conductivity'],
    trends,
    threshold_limits: {
      ph: { min: 6.5, max: 8.5, unit: 'pH units' },
      turbidity: { min: 0, max: 5.0, unit: 'NTU' },
      dissolved_oxygen: { min: 5.0, max: 14.0, unit: 'mg/L' },
      tds: { min: 0, max: 500, unit: 'mg/L' },
      electrical_conductivity: { min: 50, max: 800, unit: 'µS/cm' },
      temperature: { min: 2.0, max: 28.0, unit: '°C' }
    }
  });
});

app.get('/api/analytics/summary', (req: Request, res: Response) => {
  const totalAnomalies = anomalies.filter(a => a.is_anomaly).length;
  const rate = samples.length > 0 ? (totalAnomalies / samples.length) * 100 : 0;
  return res.json({
    summary: {
      total_locations: stations.length,
      total_samples_collected: samples.length,
      total_anomalies_detected: totalAnomalies,
      active_critical_alerts: alerts.filter(a => a.severity === 'Critical' && !a.is_read).length,
      high_priority_stations_count: stations.map(calculateStationPriority).filter(p => p.category === 'High Priority').length,
      overall_water_health_index: 86.4,
    },
    anomaly_rate_percentage: Math.round(rate * 10) / 10,
    most_frequent_violations: [
      { parameter: 'Dissolved Oxygen Depletion', count: 14, severity: 'Critical/High' },
      { parameter: 'Turbidity Spike', count: 11, severity: 'High' },
      { parameter: 'pH Excursion', count: 8, severity: 'Critical' },
      { parameter: 'TDS Mineralization', count: 6, severity: 'Medium' }
    ],
    top_critical_stations: [
      { station_code: 'STN-HUD-02', name: 'Lower Estuary Industrial Outfall', risk: 'Critical', score: 92.5 },
      { station_code: 'STN-BLU-03', name: 'Blue Creek Agricultural Discharge', risk: 'High', score: 78.4 }
    ]
  });
});

// 8. Alert Management
app.get('/api/alerts', (req: Request, res: Response) => {
  const { unread_only } = req.query;
  let list = alerts.map(a => {
    const stn = stations.find(s => s.id === a.station_id);
    return {
      ...a,
      station_name: stn ? stn.name : 'Unknown Station',
      station_code: stn ? stn.station_code : 'STN-?',
    };
  });
  if (unread_only === 'true') {
    list = list.filter(a => !a.is_read);
  }
  return res.json(list);
});

app.patch('/api/alerts/:id/read', (req: Request, res: Response) => {
  const alertId = req.params.id;
  const alert = alerts.find(a => a.alert_id === alertId || a.id === Number(alertId));
  if (!alert) {
    return res.status(404).json({ detail: 'Alert not found' });
  }
  alert.is_read = true;
  const stn = stations.find(s => s.id === alert.station_id);
  return res.json({
    ...alert,
    station_name: stn ? stn.name : 'Unknown Station',
    station_code: stn ? stn.station_code : 'STN-?',
  });
});

// 9. OpenAPI Specification Endpoint
app.get('/api/docs/openapi.json', (req: Request, res: Response) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'AquaShield AI - Water Quality Anomaly Detection & Smart Sampling Prioritizer API',
      version: '1.0.0',
      description: 'REST API backend for real-time water quality parameter ingestion, Isolation Forest ML anomaly scoring, and 0-100 sampling prioritization.'
    },
    paths: {
      '/api/auth/register': { post: { summary: 'Register user' } },
      '/api/auth/login': { post: { summary: 'Login and get JWT token' } },
      '/api/dashboard': { get: { summary: 'Consolidated executive dashboard KPIs' } },
      '/api/samples': {
        get: { summary: 'Get water quality samples' },
        post: { summary: 'Ingest water quality sample' }
      },
      '/api/samples/{id}': { get: { summary: 'Get single sample by ID' } },
      '/api/anomaly/detect': { post: { summary: 'Run Isolation Forest anomaly inference' } },
      '/api/anomaly/results': { get: { summary: 'Get anomaly detection historical records' } },
      '/api/sampling/priorities': { get: { summary: 'Get 0-100 ranked station priorities' } },
      '/api/sampling/recommend': { post: { summary: 'Generate recommended sampling schedule' } },
      '/api/stations': {
        get: { summary: 'List monitoring stations' },
        post: { summary: 'Create monitoring station' }
      },
      '/api/stations/{id}': {
        get: { summary: 'Get station details' },
        put: { summary: 'Update station details' },
        delete: { summary: 'Delete station' }
      },
      '/api/analytics/trends': { get: { summary: 'Time-series water quality trends' } },
      '/api/analytics/summary': { get: { summary: 'Analytics risk summary' } },
      '/api/alerts': { get: { summary: 'Get active alerts' } },
      '/api/alerts/{id}/read': { patch: { summary: 'Acknowledge alert as read' } }
    }
  });
});

// Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, () => {
    console.log(`AquaShield AI Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
