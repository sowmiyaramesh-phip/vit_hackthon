"""
ATLAS MONITOR WATCH - FastAPI Application Root
Explainable Clinical Trial Intelligence & Continuous 12-Cut Surveillance.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .stage1.graph import ClinicalGraph
from .stage2.trace import TraceLedger
from .stage2.human_gate import HumanGate
from .stage2.data_manager import DataManager
from .stage3.watch import WatchSurveillance
from .seed_data import populate_all

from .api import studies, subjects, atlas_api, monitor_api, watch_api, governance_api

# Global singletons
clinical_graph = ClinicalGraph(study_id="ABC-101")
trace_ledger = TraceLedger()
human_gate = HumanGate(trace_ledger)
data_manager = DataManager(trace_ledger)
surveillance = WatchSurveillance(
    study_id="ABC-101",
    current_cut=8,
    graph=clinical_graph,
    trace_ledger=trace_ledger,
    human_gate=human_gate,
    data_manager=data_manager,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB & Seed realistic clinical trial records
    init_db()
    populate_all(clinical_graph, surveillance)

    # Inject shared singletons into routers
    subjects.set_context(clinical_graph, surveillance)
    atlas_api.set_context(clinical_graph)
    monitor_api.set_context(surveillance)
    watch_api.set_context(surveillance)
    governance_api.set_context(surveillance)

    yield


app = FastAPI(
    title="ATLAS MONITOR WATCH API",
    description="Explainable Clinical Trial Intelligence & Continuous 12-Cut Surveillance",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(studies.router)
app.include_router(subjects.router)
app.include_router(atlas_api.router)
app.include_router(monitor_api.router)
app.include_router(watch_api.router)
app.include_router(governance_api.router)


@app.get("/")
def root():
    return {
        "title": "ATLAS MONITOR WATCH",
        "subtitle": "Explainable Clinical Trial Intelligence & Continuous Monitoring",
        "tagline": "Understand the data. Review the risk. Watch what changes. Explain every decision.",
        "status": "OPERATIONAL",
        "study": "ABC-101",
        "current_cut": surveillance.current_cut,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
