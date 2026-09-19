import sys
import os
from pathlib import Path
from contextlib import asynccontextmanager

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.endpoints import router as api_router
from app.services.data_service import DataService

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed initial clinical data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        DataService.seed_initial_study_data(db)
        print("Initial clinical trial database & Knowledge Graph seeded successfully.")
    except Exception as e:
        print(f"Seed note: {e}")
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Integrated Clinical Trial Intelligence, Evidence, Review and Monitoring Platform",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
from fastapi.responses import FileResponse
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health():
    return {"status": "HEALTHY", "platform": "ATLAS + MONITOR", "version": settings.VERSION}

@app.get("/download-source-code")
def download_source_code_root():
    zip_path = Path(__file__).resolve().parent / "atlas-monitor-complete-source-code.zip"
    if not zip_path.exists():
        zip_path = Path(r"C:\Users\SOWMIYA\.gemini\antigravity\scratch\atlas-monitor\atlas-monitor-complete-source-code.zip")
    if not zip_path.exists():
        return {"error": "Archive not found"}
    return FileResponse(path=str(zip_path), filename="atlas-monitor-complete-source-code.zip", media_type="application/zip")


# Mount static frontend if available
frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
