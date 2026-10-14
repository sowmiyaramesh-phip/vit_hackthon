"""
ATLAS+MONITORING Database Engine & Connection Manager
Dual-mode: Production MySQL with automatic resilient SQLite fallback.
Provides thread-safe sessions, connection pooling, and parameterized execution.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment configuration
load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "atlas_monitoring")

SQLITE_PATH = Path(__file__).resolve().parent / "atlas_monitor_watch.db"

# Establish database engine
engine = None
db_mode = "SQLite (Fallback)"

# Attempt MySQL connection if configured
if os.getenv("USE_MYSQL", "false").lower() in ("true", "1", "yes") or MYSQL_PASSWORD:
    try:
        mysql_url = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
        test_engine = create_engine(
            mysql_url,
            pool_recycle=3600,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3}
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = test_engine
        db_mode = f"MySQL ({MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE})"
        print(f"[DATABASE] Connected successfully to MySQL: {db_mode}")
    except Exception as e:
        print(f"[DATABASE] MySQL connection failed ({e}). Falling back to local SQLite.")

if engine is None:
    sqlite_url = f"sqlite:///{SQLITE_PATH}"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    db_mode = f"SQLite ({SQLITE_PATH.name})"
    print(f"[DATABASE] Active database engine: {db_mode}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
from .models.db_models import Base


def init_db():
    """Initializes schema tables in the active database engine."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI & Flask yield dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def execute_query(query: str, params: dict = None) -> list:
    """Executes a parameterized read query and returns list of dictionaries."""
    with engine.connect() as conn:
        result = conn.execute(text(query), params or {})
        columns = result.keys()
        return [dict(zip(columns, row)) for row in result.fetchall()]


def execute_write(query: str, params: dict = None) -> int:
    """Executes a parameterized write query and commits transaction."""
    with engine.connect() as conn:
        result = conn.execute(text(query), params or {})
        conn.commit()
        return result.rowcount


def get_db_status() -> dict:
    """Returns database connection telemetry."""
    return {
        "engine": db_mode,
        "is_mysql": "MySQL" in db_mode,
        "sqlite_path": str(SQLITE_PATH) if "SQLite" in db_mode else None,
    }
