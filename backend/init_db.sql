-- ==============================================================================
-- Water Quality Anomaly Detection & Smart Sampling Prioritizer
-- MySQL Database Schema and Seed Data
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS water_quality_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE water_quality_db;

-- 1. Users Table (Authentication & RBAC)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'analyst', 'technician') NOT NULL DEFAULT 'technician',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_username (username),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Monitoring Stations Table
CREATE TABLE IF NOT EXISTS monitoring_stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    station_code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    basin VARCHAR(100) NOT NULL,
    location_description TEXT,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    status ENUM('active', 'maintenance', 'offline') NOT NULL DEFAULT 'active',
    risk_level ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    sensor_health_score DECIMAL(5, 2) NOT NULL DEFAULT 95.00,
    installation_date DATE NOT NULL,
    last_calibrated_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_station_code (station_code),
    INDEX idx_station_status (status),
    INDEX idx_station_risk (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Water Quality Samples Table
CREATE TABLE IF NOT EXISTS water_quality_samples (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sample_id VARCHAR(50) NOT NULL UNIQUE,
    station_id INT NOT NULL,
    location_name VARCHAR(150) NOT NULL,
    ph DECIMAL(4, 2) NOT NULL,
    turbidity DECIMAL(6, 2) NOT NULL,
    dissolved_oxygen DECIMAL(5, 2) NOT NULL,
    temperature DECIMAL(5, 2) NOT NULL,
    tds DECIMAL(7, 2) NOT NULL,
    electrical_conductivity DECIMAL(7, 2) NOT NULL,
    source_type ENUM('sensor', 'manual', 'simulated') NOT NULL DEFAULT 'sensor',
    collected_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES monitoring_stations(id) ON DELETE CASCADE,
    INDEX idx_samples_station_date (station_id, collected_at),
    INDEX idx_samples_source (source_type),
    INDEX idx_samples_collected (collected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Anomaly Results Table
CREATE TABLE IF NOT EXISTS anomaly_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sample_id INT NOT NULL UNIQUE,
    station_id INT NOT NULL,
    is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Low',
    anomaly_score DECIMAL(6, 4) NOT NULL,
    violated_parameters JSON NULL,
    explanation TEXT NOT NULL,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sample_id) REFERENCES water_quality_samples(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES monitoring_stations(id) ON DELETE CASCADE,
    INDEX idx_anomaly_station (station_id),
    INDEX idx_anomaly_severity (severity),
    INDEX idx_anomaly_flag (is_anomaly)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Sampling Priorities Table
CREATE TABLE IF NOT EXISTS sampling_priorities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    priority_score DECIMAL(5, 2) NOT NULL,
    category ENUM('Low Priority', 'Medium Priority', 'High Priority') NOT NULL,
    days_since_last_sample INT NOT NULL DEFAULT 0,
    historical_violation_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    location_risk_weight DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    sensor_unreliability_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    recommended_date DATE NOT NULL,
    recommendation_reason TEXT NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES monitoring_stations(id) ON DELETE CASCADE,
    INDEX idx_priority_station (station_id),
    INDEX idx_priority_score (priority_score DESC),
    INDEX idx_priority_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id VARCHAR(50) NOT NULL UNIQUE,
    station_id INT NOT NULL,
    sample_id INT NULL,
    parameter VARCHAR(50) NOT NULL,
    message VARCHAR(255) NOT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES monitoring_stations(id) ON DELETE CASCADE,
    FOREIGN KEY (sample_id) REFERENCES water_quality_samples(id) ON DELETE SET NULL,
    INDEX idx_alert_station (station_id),
    INDEX idx_alert_read (is_read),
    INDEX idx_alert_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Sampling History Table
CREATE TABLE IF NOT EXISTS sampling_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    sample_id INT NULL,
    technician_name VARCHAR(100) NOT NULL,
    notes TEXT,
    action_taken VARCHAR(255),
    sampled_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES monitoring_stations(id) ON DELETE CASCADE,
    FOREIGN KEY (sample_id) REFERENCES water_quality_samples(id) ON DELETE SET NULL,
    INDEX idx_history_station (station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================================================
-- Initial Seed Data
-- ==============================================================================

-- Seed Users (password: 'Admin123!' hashed with bcrypt)
INSERT INTO users (username, email, hashed_password, full_name, role) VALUES
('admin', 'admin@aquashield.io', '$2b$12$e8Yy8f6eYdK1Qz6P589qIuQ1X9K7wH1LhK8p7vU3YdM7G2bXw1qZa', 'System Administrator', 'admin'),
('analyst_elena', 'elena.vance@aquashield.io', '$2b$12$e8Yy8f6eYdK1Qz6P589qIuQ1X9K7wH1LhK8p7vU3YdM7G2bXw1qZa', 'Dr. Elena Vance (Lead Limnologist)', 'analyst'),
('tech_marcus', 'marcus.chen@aquashield.io', '$2b$12$e8Yy8f6eYdK1Qz6P589qIuQ1X9K7wH1LhK8p7vU3YdM7G2bXw1qZa', 'Marcus Chen (Field Technician)', 'technician')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Seed Monitoring Stations
INSERT INTO monitoring_stations (id, station_code, name, basin, location_description, latitude, longitude, status, risk_level, sensor_health_score, installation_date, last_calibrated_at) VALUES
(1, 'STN-HUD-01', 'Upper Hudson Intake Reserve', 'Hudson River Valley', 'Upstream drinking water supply intake 4.2 km north of municipal dam', 42.652588, -73.756232, 'active', 'low', 98.5, '2023-03-15', '2026-09-12 10:00:00'),
(2, 'STN-HUD-02', 'Lower Estuary Industrial Outfall', 'Hudson River Valley', 'Direct industrial discharge confluence zone, chemical refinery proximity', 42.548900, -73.784500, 'active', 'critical', 78.0, '2022-07-20', '2026-08-01 14:30:00'),
(3, 'STN-CLR-01', 'Clearwater Alpine Reservoir', 'Adirondack Basin', 'Pristine mountain runoff source feeding metropolitan aqueduct', 43.120000, -74.150000, 'active', 'low', 99.2, '2024-01-10', '2026-10-15 09:00:00'),
(4, 'STN-BLU-03', 'Blue Creek Agricultural Discharge', 'Mohawk River Basin', 'Intensive agricultural runoff zone with seasonal nitrate/phosphate influx', 42.895000, -74.220000, 'active', 'high', 84.5, '2023-09-01', '2026-07-18 11:20:00'),
(5, 'STN-QNS-05', 'Queensbury Wetland Sump', 'Lake George Watershed', 'Natural bio-filtration marsh monitoring natural denitrification', 43.340000, -73.680000, 'maintenance', 'medium', 62.0, '2021-11-05', '2026-05-20 16:45:00'),
(6, 'STN-ALB-08', 'Albany Port Maritime Basin', 'Hudson Estuary', 'Commercial shipping dock, potential petroleum ballast and heavy metal wash', 42.620000, -73.760000, 'active', 'high', 91.0, '2023-11-12', '2026-09-29 08:30:00')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Seed Initial Water Quality Samples
INSERT INTO water_quality_samples (id, sample_id, station_id, location_name, ph, turbidity, dissolved_oxygen, temperature, tds, electrical_conductivity, source_type, collected_at) VALUES
(1, 'SMP-2026-001', 1, 'Upper Hudson Intake Reserve', 7.42, 2.15, 8.85, 16.4, 210.0, 310.0, 'sensor', '2026-10-30 08:00:00'),
(2, 'SMP-2026-002', 2, 'Lower Estuary Industrial Outfall', 9.20, 14.80, 3.10, 26.8, 680.0, 940.0, 'sensor', '2026-10-30 08:15:00'),
(3, 'SMP-2026-003', 3, 'Clearwater Alpine Reservoir', 7.10, 0.85, 9.60, 11.2, 85.0, 120.0, 'sensor', '2026-10-30 08:30:00'),
(4, 'SMP-2026-004', 4, 'Blue Creek Agricultural Discharge', 6.15, 9.40, 4.30, 21.5, 540.0, 780.0, 'manual', '2026-10-30 09:00:00'),
(5, 'SMP-2026-005', 6, 'Albany Port Maritime Basin', 7.85, 6.20, 5.90, 19.8, 420.0, 590.0, 'sensor', '2026-10-30 09:30:00')
ON DUPLICATE KEY UPDATE collected_at = VALUES(collected_at);

-- Seed Anomaly Results
INSERT INTO anomaly_results (id, sample_id, station_id, is_anomaly, severity, anomaly_score, violated_parameters, explanation, detected_at) VALUES
(1, 2, 2, TRUE, 'Critical', 0.8750, '["pH", "Turbidity", "Dissolved Oxygen", "TDS"]', 'Severe alkaline excursion (pH 9.20 > 8.5) paired with critical hypoxia (DO 3.10 < 5.0 mg/L) and turbidity spike (14.8 NTU > 5.0). Indicates chemical spill or industrial effluent discharge.', '2026-10-30 08:16:00'),
(2, 4, 4, TRUE, 'High', 0.6920, '["pH", "Turbidity", "Dissolved Oxygen", "TDS"]', 'Sub-neutral acidic reading (pH 6.15) with depleted dissolved oxygen (4.30 mg/L) and elevated suspended solids (9.4 NTU). Consistent with agricultural fertilizer wash.', '2026-10-30 09:02:00')
ON DUPLICATE KEY UPDATE detected_at = NOW();

-- Seed Alerts
INSERT INTO alerts (id, alert_id, station_id, sample_id, parameter, message, severity, is_read, triggered_at) VALUES
(1, 'ALT-2026-001', 2, 2, 'Dissolved Oxygen & pH', 'Critical DO hypoxia detected (3.1 mg/L) with alkaline spike (pH 9.2) at Lower Estuary', 'Critical', FALSE, '2026-10-30 08:16:05'),
(2, 'ALT-2026-002', 2, 2, 'Turbidity', 'Turbidity threshold exceeded: 14.80 NTU (Safe limit: 5.0 NTU)', 'High', FALSE, '2026-10-30 08:16:06'),
(3, 'ALT-2026-003', 4, 4, 'Dissolved Oxygen', 'Low DO reading at Blue Creek Agricultural (4.30 mg/L < 5.0 mg/L threshold)', 'Medium', FALSE, '2026-10-30 09:02:10')
ON DUPLICATE KEY UPDATE is_read = VALUES(is_read);
