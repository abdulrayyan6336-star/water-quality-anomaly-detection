"""
Anomaly Detection Service:
Orchestrates machine learning (Isolation Forest) and threshold-based regulatory checks.
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.anomaly import AnomalyResult, AnomalySeverity
from backend.app.models.sample import WaterQualitySample
from backend.app.models.alert import Alert
from backend.app.ml.isolation_forest_model import detector
from backend.app.utils.thresholds import evaluate_threshold_violations
import uuid

class AnomalyService:
    @staticmethod
    def evaluate_sample_data(sample_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs hybrid evaluation:
        1. ML Isolation Forest model evaluation
        2. EPA/WHO statutory threshold rule-engine
        3. Harmonization of severity and root-cause explanations
        """
        # 1. ML inference
        ml_res = detector.score_sample(sample_data)
        
        # 2. Rule-based threshold check
        thresh_res = evaluate_threshold_violations(sample_data)

        # 3. Hybrid synthesis
        is_anomaly = ml_res["is_anomaly"] or thresh_res["has_violations"]
        
        # Assign highest severity between ML and rules
        severity_rank = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
        ml_sev = ml_res["severity"]
        rule_sev = thresh_res["severity"]
        
        chosen_sev = ml_sev if severity_rank[ml_sev] >= severity_rank[rule_sev] else rule_sev
        
        # Merge explanations
        all_explanations = []
        if thresh_res["has_violations"]:
            all_explanations.append(thresh_res["explanation"])
        if ml_res["is_anomaly"]:
            all_explanations.append(ml_res["explanation"])
            
        combined_explanation = " | ".join(all_explanations) if all_explanations else "Water quality sample conforms to baseline limnological standards."

        # Merge parameter violations
        combined_violations = list(set(thresh_res["violations"] + [
            p.title().replace("_", " ") for p, pct in ml_res["parameter_contributions"].items() if pct > 30
        ]))

        return {
            "is_anomaly": is_anomaly,
            "severity": chosen_sev,
            "anomaly_score": ml_res["anomaly_score"],
            "violated_parameters": combined_violations,
            "explanation": combined_explanation,
            "parameter_contributions": ml_res["parameter_contributions"],
            "threshold_assessment": thresh_res
        }

    @staticmethod
    def process_and_persist_sample_anomaly(db: Session, sample: WaterQualitySample) -> AnomalyResult:
        """
        Evaluates a persisted sample, creates an AnomalyResult record,
        and generates immediate alerts if thresholds are breached.
        """
        sample_dict = {
            "ph": sample.ph,
            "turbidity": sample.turbidity,
            "dissolved_oxygen": sample.dissolved_oxygen,
            "temperature": sample.temperature,
            "tds": sample.tds,
            "electrical_conductivity": sample.electrical_conductivity
        }

        eval_res = AnomalyService.evaluate_sample_data(sample_dict)

        anomaly_record = AnomalyResult(
            sample_id=sample.id,
            station_id=sample.station_id,
            is_anomaly=eval_res["is_anomaly"],
            severity=eval_res["severity"],
            anomaly_score=eval_res["anomaly_score"],
            violated_parameters=eval_res["violated_parameters"],
            explanation=eval_res["explanation"]
        )
        db.add(anomaly_record)
        db.flush()

        # If anomaly or critical threshold violation, generate corresponding alerts
        if eval_res["is_anomaly"] and eval_res["severity"] in ["Medium", "High", "Critical"]:
            # Specific parameter alerts
            for violation in eval_res["violated_parameters"]:
                alert = Alert(
                    alert_id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
                    station_id=sample.station_id,
                    sample_id=sample.id,
                    parameter=violation,
                    message=f"{eval_res['severity']} alert: {violation} anomaly detected at {sample.location_name}",
                    severity=eval_res["severity"],
                    is_read=False
                )
                db.add(alert)

        db.commit()
        db.refresh(anomaly_record)
        return anomaly_record
