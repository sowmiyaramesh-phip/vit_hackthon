"""
Study API router: Studies and Dashboard metrics.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.db_models import Study, Site, Subject, Finding, DataQueryModel, HumanEscalationModel

router = APIRouter(prefix="/studies", tags=["Studies"])


@router.get("")
def get_studies(db: Session = Depends(get_db)):
    studies = db.query(Study).all()
    return studies


@router.get("/{study_id}/dashboard")
def get_study_dashboard(study_id: str, db: Session = Depends(get_db)):
    total_subjects = db.query(Subject).count()
    active_sites = db.query(Site).count()
    open_findings = db.query(Finding).filter(Finding.status == "OPEN").count()
    open_queries = db.query(DataQueryModel).filter(DataQueryModel.status != "CLOSED").count()
    pending_decisions = db.query(HumanEscalationModel).filter(HumanEscalationModel.status == "PENDING").count()

    study = db.query(Study).filter(Study.study_id == study_id).first()
    current_cut = study.current_cut if study else 8

    # Categorized sections
    safety_findings = db.query(Finding).filter(Finding.category == "SAFETY", Finding.status == "OPEN").all()
    data_queries = db.query(DataQueryModel).filter(DataQueryModel.status != "CLOSED").all()

    return {
        "study_id": study_id,
        "protocol_name": study.protocol_name if study else "Phase II Trial",
        "current_protocol_version": study.current_protocol_version if study else "v1.0",
        "total_subjects": total_subjects,
        "active_sites": active_sites,
        "open_findings": open_findings,
        "open_data_queries": open_queries,
        "pending_human_decisions": pending_decisions,
        "current_watch_cut": current_cut,
        "safety": {
            "serious_adverse_events_count": 2,
            "new_safety_findings_count": len(safety_findings),
            "escalations_awaiting_decision_count": pending_decisions,
            "recent_findings": [f.title for f in safety_findings[:3]]
        },
        "data_quality": {
            "open_queries_count": open_queries,
            "missing_records_count": 1,
            "unit_inconsistencies_count": 1,
            "duplicate_records_count": 0,
        },
        "compliance": {
            "protocol_deviations_count": 2,
            "site_level_issues_count": 1,
        },
        "watch": {
            "current_cut": current_cut,
            "total_cuts": 12,
            "last_completed_cut": current_cut - 1 if current_cut > 1 else 1,
            "pending_decisions": pending_decisions,
            "adversarial_events": 1,
        }
    }
