"""
AquaShield AI - Water Quality Anomaly Detection & Smart Sampling Prioritizer
FastAPI Application Entry Point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from backend.app.database import engine, Base
from backend.app.routes import (
    auth_router,
    stations_router,
    samples_router,
    anomaly_router,
    sampling_router,
    analytics_router,
    alerts_router,
    dashboard_router
)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("aquashield.main")

# Initialize DB tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified and initialized.")
except Exception as e:
    logger.warning(f"Could not auto-create database tables on startup: {e}")

app = FastAPI(
    title="AquaShield AI - Water Quality Monitoring & Smart Sampling Prioritizer",
    description=(
        "Production-grade REST API backend for AI-powered limnological anomaly detection, "
        "Isolation Forest ML inference, multi-criteria sampling prioritization (0-100), "
        "and IoT sensor telemetry ingestion."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers under /api
api_prefix = "/api"
app.include_router(auth_router, prefix=api_prefix)
app.include_router(stations_router, prefix=api_prefix)
app.include_router(samples_router, prefix=api_prefix)
app.include_router(anomaly_router, prefix=api_prefix)
app.include_router(sampling_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)
app.include_router(alerts_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "system": "AquaShield AI Water Quality Monitoring System",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "api_endpoints": "/api"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AquaShield AI Backend"}

# Global exception handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please inspect server logs."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
