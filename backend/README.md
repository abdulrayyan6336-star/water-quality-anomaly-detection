# AquaShield AI - Water Quality Anomaly Detection & Smart Sampling Prioritizer

An enterprise-grade backend and analytics system for real-time water quality monitoring, machine learning anomaly detection with Isolation Forest, and automated sampling prioritization algorithms.

---

## 1. System Architecture

```
                       +---------------------------------------+
                       |   React 19 + Tailwind Ops Center      |
                       +---------------------------------------+
                                          |
                                    REST APIs (JSON)
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           FastAPI / Uvicorn Server                                |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | User Auth & RBAC   |  | Ingestion & Storage  |  | Alert Management Engine   |  |
|  | JWT & Bcrypt       |  | Sensors / Field Test |  | Unsafe pH, Low DO, Spikes |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|                                     |                                             |
|                                     v                                             |
|  +-----------------------------------------------------------------------------+  |
|  | Hybrid AI Anomaly Detection Engine                                          |  |
|  | - Scikit-learn Isolation Forest (unsupervised multidimensional outlier)     |  |
|  | - EPA/WHO Regulatory Threshold Engine (pH 6.5-8.5, DO>5, Turb<5, TDS<500)   |  |
|  | - Severity Classifier: Critical (75%+), High, Medium, Low                   |  |
|  | - Feature Attribution Generator (root-cause explainability)                 |  |
|  +-----------------------------------------------------------------------------+  |
|                                     |                                             |
|                                     v                                             |
|  +-----------------------------------------------------------------------------+  |
|  | Smart Sampling Prioritizer Algorithm (0 - 100 Score)                        |  |
|  | Score = 0.35(Anomaly) + 0.20(History) + 0.20(TimeDecay) +                  |  |
|  |         0.15(LocationRisk) + 0.10(SensorUnreliability)                       |  |
|  | - Ranked station schedules & actionable dispatch explanations               |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                          |
                           SQLAlchemy 2.0 ORM Engine
                                          |
                        +-----------------------------------+
                        |   MySQL 8.0 (utf8mb4_unicode_ci)  |
                        |   (Graceful SQLite Dev Fallback)  |
                        +-----------------------------------+
```

---

## 2. Directory Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application, OpenAPI docs, and CORS configuration
│   ├── database.py             # SQLAlchemy session manager & MySQL/SQLite fallback
│   ├── models/                 # SQLAlchemy ORM database models
│   │   ├── __init__.py
│   │   ├── user.py             # Users, passwords, and RBAC roles
│   │   ├── station.py          # Monitoring stations, coordinates, health scores
│   │   ├── sample.py           # 6-parameter water samples (pH, Turbidity, DO, Temp, TDS, EC)
│   │   ├── anomaly.py          # Isolation Forest outputs, scores, root-cause explanations
│   │   ├── priority.py         # 0-100 sampling priority scores & dispatch recommendations
│   │   ├── alert.py            # Real-time incident alerts and read statuses
│   │   └── history.py          # Field technician sampling logs and actions
│   ├── schemas/                # Pydantic v2 schemas for request validation & response formatting
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── station.py
│   │   ├── sample.py
│   │   ├── anomaly.py
│   │   ├── priority.py
│   │   ├── alert.py
│   │   └── analytics.py
│   ├── routes/                 # Modular API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py             # /api/auth/register, /api/auth/login, /api/auth/me
│   │   ├── stations.py         # /api/stations (CRUD, coordinates, health)
│   │   ├── samples.py          # /api/samples (Ingestion, retrieval)
│   │   ├── anomaly.py          # /api/anomaly/detect, /api/anomaly/results
│   │   ├── sampling.py         # /api/sampling/priorities, /api/sampling/recommend
│   │   ├── analytics.py        # /api/analytics/summary, /api/analytics/trends
│   │   ├── alerts.py           # /api/alerts, /api/alerts/{id}/read
│   │   └── dashboard.py        # /api/dashboard
│   ├── services/               # Business logic & algorithm implementations
│   │   ├── __init__.py
│   │   ├── anomaly_service.py  # Hybrid ML & regulatory threshold orchestrator
│   │   ├── priority_service.py # 5-factor sampling prioritizer algorithm (0-100)
│   │   ├── alert_service.py    # Threshold violation alert generator
│   │   ├── station_service.py  # Station management
│   │   └── auth_service.py     # Password hashing and JWT generation
│   ├── ml/                     # Machine learning module
│   │   ├── __init__.py
│   │   ├── isolation_forest_model.py # ML inference & feature attribution
│   │   ├── train.py            # Synthetic/historical baseline training pipeline
│   │   └── preprocessor.py     # StandardScaler & feature ordering
│   └── utils/
│       ├── __init__.py
│       ├── config.py           # App settings & environment variables
│       ├── security.py         # JWT tokens and password hashing
│       └── thresholds.py       # EPA/WHO safe threshold limits
├── init_db.sql                 # MySQL table creation scripts and initial seed data
├── requirements.txt            # Python dependencies
├── .env.example                # Example environment configuration
└── tests/
    └── test_api.py             # Pytest automated test suite
```

---

## 3. Installation & Setup Instructions

### Prerequisites
- Python 3.11+
- MySQL 8.0+ (or use automatic SQLite fallback for zero-dependency local testing)
- Node.js 18+ (for React frontend)

### Step 1: Clone and Set Up Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp backend/.env.example .env
```
Update your MySQL database credentials:
```ini
DATABASE_URL="mysql+pymysql://root:your_password@localhost:3306/water_quality_db"
SECRET_KEY="generate-a-secure-random-key"
```

### Step 3: Initialize MySQL Database
```bash
mysql -u root -p < backend/init_db.sql
```
*(Note: If MySQL is not running, the application automatically boots an embedded SQLite database `water_quality.db` so you can test immediately without errors.)*

### Step 4: Train Machine Learning Model (Optional)
To retrain the Isolation Forest model on historical data:
```bash
python backend/ml/train.py
```

### Step 5: Start the FastAPI Backend
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger API documentation will be available at:
`http://localhost:8000/docs`

---

## 4. REST API Endpoint Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account with role |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT bearer token |
| `GET` | `/api/dashboard` | Executive overview KPI summary |
| `POST` | `/api/samples` | Ingest water quality readings (Sensor/Manual) |
| `GET` | `/api/samples` | Retrieve samples with station/source filtering |
| `GET` | `/api/samples/{id}` | Retrieve specific sample by ID |
| `POST` | `/api/anomaly/detect` | On-demand Isolation Forest anomaly scoring |
| `GET` | `/api/anomaly/results` | Historical anomaly detection records |
| `GET` | `/api/sampling/priorities` | 0-100 ranked monitoring station priorities |
| `POST` | `/api/sampling/recommend` | Generate recommended sampling schedule |
| `GET` | `/api/stations` | List all monitoring stations with health score |
| `POST` | `/api/stations` | Register new monitoring station |
| `GET` | `/api/stations/{id}` | Get single station details and coordinates |
| `GET` | `/api/analytics/trends` | Time-series parameter trends (pH, DO, Turbidity) |
| `GET` | `/api/analytics/summary` | Watershed risk summary and violation frequency |
| `GET` | `/api/alerts` | List real-time water quality alerts |
| `PATCH` | `/api/alerts/{id}/read` | Mark alert as acknowledged/read |

---

## 5. Automated Testing
Run the test suite:
```bash
pytest backend/tests/test_api.py -v
```
