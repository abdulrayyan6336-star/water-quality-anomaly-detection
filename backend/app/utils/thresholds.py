"""
Standard Water Quality parameter validation thresholds (EPA, WHO, and Limnological standards).
Used in conjunction with Machine Learning Isolation Forest for hybrid anomaly detection.
"""

from typing import Dict, Any, List

WATER_QUALITY_THRESHOLDS = {
    "ph": {
        "min": 6.5,
        "max": 8.5,
        "critical_min": 5.5,
        "critical_max": 9.5,
        "unit": "pH units",
        "description": "Acidity / Basicity measure"
    },
    "turbidity": {
        "min": 0.0,
        "max": 5.0,
        "warning_max": 10.0,
        "critical_max": 20.0,
        "unit": "NTU",
        "description": "Nephelometric Turbidity Units (cloudiness/suspended solids)"
    },
    "dissolved_oxygen": {
        "min": 5.0,  # Aquatic life stress < 5.0 mg/L
        "max": 14.0,
        "critical_min": 3.0, # Severe hypoxia / fish kill risk
        "unit": "mg/L",
        "description": "Dissolved Oxygen concentration"
    },
    "temperature": {
        "min": 2.0,
        "max": 28.0,
        "critical_max": 32.0,
        "unit": "°C",
        "description": "Water Temperature"
    },
    "tds": {
        "min": 10.0,
        "max": 500.0,
        "warning_max": 750.0,
        "critical_max": 1000.0,
        "unit": "mg/L",
        "description": "Total Dissolved Solids"
    },
    "electrical_conductivity": {
        "min": 50.0,
        "max": 800.0,
        "critical_max": 1500.0,
        "unit": "µS/cm",
        "description": "Electrical Conductivity"
    }
}

def evaluate_threshold_violations(sample: Dict[str, float]) -> Dict[str, Any]:
    """
    Evaluates individual water quality parameters against regulatory thresholds.
    Returns list of violated parameters, detailed reasons, and rule-based severity.
    """
    violations: List[str] = []
    explanations: List[str] = []
    highest_severity = "Low"
    
    # 1. pH evaluation
    ph = sample.get("ph")
    if ph is not None:
        if ph < 5.5 or ph > 9.5:
            violations.append("pH")
            highest_severity = "Critical"
            explanations.append(f"Critical pH excursion: {ph:.2f} (safe range: 6.5 - 8.5)")
        elif ph < 6.5 or ph > 8.5:
            violations.append("pH")
            if highest_severity not in ["Critical"]:
                highest_severity = "High"
            explanations.append(f"Abnormal pH: {ph:.2f} outside safe drinking water bounds (6.5 - 8.5)")

    # 2. Dissolved Oxygen evaluation
    do = sample.get("dissolved_oxygen")
    if do is not None:
        if do < 3.0:
            violations.append("Dissolved Oxygen")
            highest_severity = "Critical"
            explanations.append(f"Severe hypoxia: DO is {do:.2f} mg/L (< 3.0 mg/L critical dead-zone)")
        elif do < 5.0:
            violations.append("Dissolved Oxygen")
            if highest_severity not in ["Critical"]:
                highest_severity = "High"
            explanations.append(f"Low DO level: {do:.2f} mg/L (minimum threshold 5.0 mg/L)")

    # 3. Turbidity evaluation
    turb = sample.get("turbidity")
    if turb is not None:
        if turb >= 20.0:
            violations.append("Turbidity")
            highest_severity = "Critical"
            explanations.append(f"Extreme turbidity: {turb:.2f} NTU (exceeds 20 NTU threshold)")
        elif turb > 5.0:
            violations.append("Turbidity")
            if highest_severity not in ["Critical", "High"]:
                highest_severity = "Medium"
            explanations.append(f"Elevated turbidity: {turb:.2f} NTU (> 5.0 NTU limit)")

    # 4. Total Dissolved Solids
    tds = sample.get("tds")
    if tds is not None:
        if tds >= 1000.0:
            violations.append("TDS")
            highest_severity = "Critical"
            explanations.append(f"Dangerous mineralization: TDS is {tds:.1f} mg/L (limit 500 mg/L)")
        elif tds > 500.0:
            violations.append("TDS")
            if highest_severity not in ["Critical", "High"]:
                highest_severity = "Medium"
            explanations.append(f"TDS above recommended threshold: {tds:.1f} mg/L (> 500 mg/L)")

    # 5. Electrical Conductivity
    ec = sample.get("electrical_conductivity")
    if ec is not None:
        if ec >= 1500.0:
            violations.append("Electrical Conductivity")
            if highest_severity not in ["Critical"]:
                highest_severity = "High"
            explanations.append(f"Extreme EC conductivity: {ec:.1f} µS/cm (> 1500 µS/cm)")
        elif ec > 800.0:
            violations.append("Electrical Conductivity")
            if highest_severity == "Low":
                highest_severity = "Medium"
            explanations.append(f"Elevated EC conductivity: {ec:.1f} µS/cm (> 800 µS/cm)")

    # 6. Temperature
    temp = sample.get("temperature")
    if temp is not None and (temp > 28.0 or temp < 2.0):
        violations.append("Temperature")
        if highest_severity == "Low":
            highest_severity = "Medium"
        explanations.append(f"Thermal anomaly: {temp:.1f} °C outside seasonal baseline")

    return {
        "has_violations": len(violations) > 0,
        "violations": list(set(violations)),
        "severity": highest_severity if violations else "Low",
        "explanation": "; ".join(explanations) if explanations else "All parameters within standard EPA/WHO thresholds."
    }
