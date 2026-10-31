"""
Database connection and session configuration for AquaShield AI.
Supports MySQL with automatic graceful fallback to SQLite for local development.
"""

import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)

MYSQL_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://root:password123@localhost:3306/water_quality_db"
)
SQLITE_URL = os.getenv("SQLITE_FALLBACK_URL", "sqlite:///./water_quality.db")

engine = None
try:
    # Attempt MySQL connection
    engine = create_engine(
        MYSQL_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=10,
        max_overflow=20,
        connect_args={"connect_timeout": 3}
    )
    # Test connection
    with engine.connect() as conn:
        logger.info("Successfully connected to MySQL database.")
except Exception as e:
    logger.warning(
        f"Could not connect to MySQL ({e}). Falling back to SQLite local database ({SQLITE_URL})."
    )
    engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for injecting database session into FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
