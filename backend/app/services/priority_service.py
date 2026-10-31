"""
Smart Sampling Prioritizer Service:
Implements a 5-factor multi-criteria optimization algorithm (0 - 100 score) to prioritize
field technician sampling dispatches and sensor recalibration visits.
"""

from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models.station import MonitoringStation, RiskLevel
from backend.app.models.sample import WaterQualitySample
from backend.app.models.anomaly import AnomalyResult, AnomalySeverity
from backend.app.models.priority import SamplingPriority, PriorityCategory

class PriorityService:
    @staticmethod
    def calculate_station_priority(db: Session, station: MonitoringStation) -> Dict[str, Any]:
        """
        Calculates priority score (0-100) using 5 weighted dimensions:
        1. Anomaly Severity (Weight: 35% max)
        2. Historical Water Quality Violation Rate (Weight: 20% max)
        3. Time Elapsed Since Last Sample (Weight: 20% max)
        4. Location Risk & Basin Sensitivity (Weight: 15% max)
        5. Sensor Unreliability / Drift / Missing Telemetry (Weight: 10% max)
        """
        now = datetime.now(timezone.utc)
        reasons: List[str] = []

        # 1. Latest sample & anomaly severity (0 to 35 pts)
        latest_sample = (
            db.query(WaterQualitySample)
            .filter(WaterQualitySample.station_id == station.id)
            .order_by(desc(WaterQualitySample.collected_at))
            .first()
        )

        anomaly_points = 5.0
        latest_anomaly = None
        if latest_sample:
            latest_anomaly = (
                db.query(AnomalyResult)
                .filter(AnomalyResult.sample_id == latest_sample.id)
                .first()
            )

        if latest_anomaly and latest_anomaly.is_anomaly:
            if latest_anomaly.severity == AnomalySeverity.Critical:
                anomaly_points = 35.0
                reasons.append("Critical anomaly active on latest sample")
            elif latest_anomaly.severity == AnomalySeverity.High:
                anomaly_points = 26.0
                reasons.append("High severity parameter deviation detected")
            elif latest_anomaly.severity == AnomalySeverity.Medium:
                anomaly_points = 18.0
                reasons.append("Medium anomaly detected in recent readings")
            else:
                anomaly_points = 10.0
        else:
            reasons.append("Recent samples indicate stable parameter values")

        # 2. Previous water quality history (0 to 20 pts)
        # Proportion of anomalous samples in the station's historical record
        total_samples = db.query(WaterQualitySample).filter(WaterQualitySample.station_id == station.id).count()
        if total_samples > 0:
            anom_samples = (
                db.query(AnomalyResult)
                .filter(AnomalyResult.station_id == station.id, AnomalyResult.is_anomaly == True)
                .count()
            )
            historical_rate = (anom_samples / total_samples) * 100.0
        else:
            historical_rate = 0.0

        history_points = min(20.0, (historical_rate / 100.0) * 20.0 * 2.0)
        if historical_rate > 30.0:
            reasons.append(f"High historical violation frequency ({historical_rate:.1f}% of past tests)")

        # 3. Time elapsed since last sample (0 to 20 pts)
        if latest_sample and latest_sample.collected_at:
            sample_time = latest_sample.collected_at
            if sample_time.tzinfo is None:
                days_since = (datetime.now() - sample_time).days
            else:
                days_since = (now - sample_time).days
            days_since = max(0, days_since)
        else:
            days_since = 30  # High default if never sampled

        if days_since >= 21:
            time_points = 20.0
            reasons.append(f"Sampling overdue: {days_since} days since last physical test")
        elif days_since >= 14:
            time_points = 15.0
            reasons.append(f"Standard cadence exceeded ({days_since} days since sample)")
        elif days_since >= 7:
            time_points = 10.0
        elif days_since >= 3:
            time_points = 5.0
        else:
            time_points = 2.0
            reasons.append(f"Sampled recently ({days_since} day(s) ago)")

        # 4. Location risk factor (0 to 15 pts)
        risk_map = {
            RiskLevel.critical: 15.0,
            RiskLevel.high: 11.0,
            RiskLevel.medium: 6.0,
            RiskLevel.low: 2.0
        }
        location_points = risk_map.get(station.risk_level, 6.0)
        if station.risk_level in [RiskLevel.critical, RiskLevel.high]:
            reasons.append(f"High environmental vulnerability zone ({station.risk_level.value.upper()})")

        # 5. Missing / Unreliable Sensor Readings (0 to 10 pts)
        # Inverted sensor health: 100% health = 0 pts; 0% health = 10 pts
        health_score = station.sensor_health_score or 95.0
        unreliability_points = min(10.0, max(0.0, (100.0 - health_score) * 0.10))
        if station.status != "active":
            unreliability_points += 5.0
            reasons.append(f"Station status is {station.status.upper()}")
        elif health_score < 80.0:
            reasons.append(f"Telemetry degradation: Sensor health score is {health_score:.1f}%")

        unreliability_points = min(10.0, unreliability_points)

        # Composite Score (Sum: 0 - 100)
        total_score = round(anomaly_points + history_points + time_points + location_points + unreliability_points, 1)
        total_score = min(100.0, max(0.0, total_score))

        # Priority Category
        if total_score >= 75.0:
            category = PriorityCategory.High
            recommended_date = date.today() + timedelta(days=1)  # Immediate / Next 24h
        elif total_score >= 40.0:
            category = PriorityCategory.Medium
            recommended_date = date.today() + timedelta(days=4)  # Within 4 days
        else:
            category = PriorityCategory.Low
            recommended_date = date.today() + timedelta(days=14) # Routine bi-weekly

        summary_reason = "; ".join(reasons) if reasons else "Routine monitoring schedule."

        return {
            "station_id": station.id,
            "station_code": station.station_code,
            "station_name": station.name,
            "basin": station.basin,
            "priority_score": total_score,
            "category": category.value,
            "days_since_last_sample": days_since,
            "historical_violation_rate": round(historical_rate, 2),
            "location_risk_weight": round(location_points, 2),
            "sensor_unreliability_score": round(unreliability_points, 2),
            "recommended_date": recommended_date,
            "recommendation_reason": summary_reason
        }

    @staticmethod
    def recalculate_all_priorities(db: Session) -> List[SamplingPriority]:
        """
        Evaluates all registered monitoring stations, updates the sampling_priorities table,
        and returns ranked list sorted descending by priority_score.
        """
        stations = db.query(MonitoringStation).all()
        persisted_priorities = []

        for stn in stations:
            calc = PriorityService.calculate_station_priority(db, stn)

            # Check if record exists
            existing = (
                db.query(SamplingPriority)
                .filter(SamplingPriority.station_id == stn.id)
                .first()
            )

            if existing:
                existing.priority_score = calc["priority_score"]
                existing.category = calc["category"]
                existing.days_since_last_sample = calc["days_since_last_sample"]
                existing.historical_violation_rate = calc["historical_violation_rate"]
                existing.location_risk_weight = calc["location_risk_weight"]
                existing.sensor_unreliability_score = calc["sensor_unreliability_score"]
                existing.recommended_date = calc["recommended_date"]
                existing.recommendation_reason = calc["recommendation_reason"]
                persisted_priorities.append(existing)
            else:
                new_p = SamplingPriority(
                    station_id=stn.id,
                    priority_score=calc["priority_score"],
                    category=calc["category"],
                    days_since_last_sample=calc["days_since_last_sample"],
                    historical_violation_rate=calc["historical_violation_rate"],
                    location_risk_weight=calc["location_risk_weight"],
                    sensor_unreliability_score=calc["sensor_unreliability_score"],
                    recommended_date=calc["recommended_date"],
                    recommendation_reason=calc["recommendation_reason"]
                )
                db.add(new_p)
                persisted_priorities.append(new_p)

        db.commit()
        return sorted(persisted_priorities, key=lambda x: x.priority_score, reverse=True)
