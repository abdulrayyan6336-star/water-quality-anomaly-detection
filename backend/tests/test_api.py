"""
AquaShield AI API Integration and Unit Tests.
Run with:
    pytest backend/tests/test_api.py -v
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_root_and_health():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

def test_user_registration_and_login():
    import uuid
    uid = uuid.uuid4().hex[:6]
    username = f"tester_{uid}"
    email = f"tester_{uid}@aquashield.io"
    password = "SecurePassword123!"

    # 1. Register
    reg_payload = {
        "username": username,
        "email": email,
        "password": password,
        "full_name": "QA Limnologist",
        "role": "analyst"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201
    user_data = res.json()
    assert user_data["username"] == username
    assert user_data["role"] == "analyst"

    # 2. Login
    login_payload = {
        "username": username,
        "password": password
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

def test_monitoring_station_endpoints():
    import uuid
    code = f"STN-TEST-{uuid.uuid4().hex[:4].upper()}"
    new_station = {
        "station_code": code,
        "name": "Test Watershed Station Alpha",
        "basin": "Mohawk Tributary",
        "location_description": "Bridge sensor deployment site",
        "latitude": 42.8123,
        "longitude": -73.9456,
        "status": "active",
        "risk_level": "medium",
        "sensor_health_score": 96.5,
        "installation_date": "2026-01-15"
    }
    create_res = client.post("/api/stations", json=new_station)
    assert create_res.status_code == 201
    stn_id = create_res.json()["id"]

    # Retrieve all
    all_res = client.get("/api/stations")
    assert all_res.status_code == 200
    assert len(all_res.json()) >= 1

    # Retrieve single
    single_res = client.get(f"/api/stations/{stn_id}")
    assert single_res.status_code == 200
    assert single_res.json()["station_code"] == code

def test_anomaly_detection_inference():
    # Normal sample
    normal_reading = {
        "ph": 7.4,
        "turbidity": 1.8,
        "dissolved_oxygen": 8.9,
        "temperature": 16.5,
        "tds": 210.0,
        "electrical_conductivity": 320.0
    }
    norm_res = client.post("/api/anomaly/detect", json=normal_reading)
    assert norm_res.status_code == 200
    norm_data = norm_res.json()
    assert norm_data["severity"] in ["Low", "Medium"]
    assert norm_data["anomaly_score"] < 0.65

    # Critical anomaly (severe chemical pollution: pH 9.6, turbidity 28 NTU, DO 2.1 mg/L)
    polluted_reading = {
        "ph": 9.6,
        "turbidity": 28.5,
        "dissolved_oxygen": 2.1,
        "temperature": 27.0,
        "tds": 890.0,
        "electrical_conductivity": 1450.0
    }
    anom_res = client.post("/api/anomaly/detect", json=polluted_reading)
    assert anom_res.status_code == 200
    anom_data = anom_res.json()
    assert anom_data["is_anomaly"] is True
    assert anom_data["severity"] in ["High", "Critical"]
    assert "pH" in anom_data["violated_parameters"]
    assert "Dissolved Oxygen" in anom_data["violated_parameters"]

def test_sampling_priorities_ranking():
    res = client.get("/api/sampling/priorities")
    assert res.status_code == 200
    priorities = res.json()
    assert isinstance(priorities, list)
    if len(priorities) > 0:
        first = priorities[0]
        assert "priority_score" in first
        assert "category" in first
        assert 0 <= first["priority_score"] <= 100
        assert first["category"] in ["High Priority", "Medium Priority", "Low Priority"]

def test_dashboard_and_analytics():
    dash_res = client.get("/api/dashboard")
    assert dash_res.status_code == 200
    d = dash_res.json()
    assert "total_locations" in d
    assert "total_samples_collected" in d
    assert "overall_water_health_index" in d

    trends_res = client.get("/api/analytics/trends")
    assert trends_res.status_code == 200
    assert "trends" in trends_res.json()
