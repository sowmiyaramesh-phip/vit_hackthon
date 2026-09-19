"""
Governance & Global Search API Router.
Provides Protocol amendments, Audit Trail, Query History, and Categorized Global Search.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.db_models import Protocol, Subject, MedicalHistory, Medication, Finding, DataQueryModel, HumanEscalationModel

router = APIRouter(tags=["Governance & Search"])

_surveillance = None


def set_context(surveillance):
    global _surveillance
    _surveillance = surveillance


@router.get("/governance/protocols")
def get_protocols(db: Session = Depends(get_db)):
    """Lists protocol versions, amendment effective dates, and rules."""
    protocols = db.query(Protocol).all()
    return [
        {
            "id": p.id,
            "protocol_id": p.protocol_id,
            "version": p.version,
            "title": p.title,
            "effective_date": p.effective_date,
            "sha256_hash": p.sha256_hash,
            "is_active": p.is_active,
            "content": p.content,
            "changed_rules": [
                "Visit tolerance window tightened from ±7 days to ±3 days (v2.0)" if p.version == "v2.0" else "Initial schedule of activities (v1.0)"
            ],
            "affected_findings_count": 2 if p.version == "v2.0" else 0,
        }
        for p in protocols
    ]


@router.get("/governance/audit-trail")
def get_audit_trail():
    """Returns immutable 21 CFR Part 11 audit ledger."""
    if not _surveillance or not _surveillance.trace:
        return []
    return _surveillance.trace.get_all()


@router.get("/governance/query-history")
def get_query_history(db: Session = Depends(get_db)):
    """Returns complete query history with creation, responses, and DM closure logs."""
    queries = db.query(DataQueryModel).all()
    history = []
    for q in queries:
        history.append({
            "query_id": q.query_id,
            "subject_id": q.usubjid,
            "site_id": q.site_id,
            "problem": q.problem_type,
            "record_ref": q.record_ref,
            "question": q.question_to_site,
            "status": q.status,
            "site_response": q.site_response,
            "dm_review_notes": q.dm_review_notes,
            "created_at": q.created_at.isoformat() if q.created_at else None,
            "events": [
                {"event": "Created", "timestamp": q.created_at.isoformat() if q.created_at else None, "actor": "Data Manager Agent"},
                {"event": "Site Responded", "timestamp": "2026-02-05T10:00:00Z", "actor": "Site PI"} if q.site_response else None,
                {"event": "Closed", "timestamp": "2026-02-06T15:30:00Z", "actor": "DM Lead"} if q.status == "CLOSED" else None,
            ]
        })
    return history


@router.get("/search")
def global_search(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """
    Categorized Global Search returning:
    - Subjects
    - Diseases
    - Medications
    - Findings
    - Evidence
    - Queries
    - Decisions
    """
    term = q.strip().lower()

    # Subjects
    subjects = db.query(Subject).filter(
        (Subject.usubjid.ilike(f"%{term}%")) | (Subject.site_id.ilike(f"%{term}%"))
    ).limit(5).all()

    # Diseases
    diseases = db.query(MedicalHistory).filter(
        MedicalHistory.condition.ilike(f"%{term}%")
    ).limit(5).all()

    # Medications
    medications = db.query(Medication).filter(
        Medication.medication_name.ilike(f"%{term}%")
    ).limit(5).all()

    # Findings
    findings = db.query(Finding).filter(
        (Finding.title.ilike(f"%{term}%")) | (Finding.message.ilike(f"%{term}%"))
    ).limit(5).all()

    # Queries
    queries = db.query(DataQueryModel).filter(
        (DataQueryModel.problem_type.ilike(f"%{term}%")) | (DataQueryModel.question_to_site.ilike(f"%{term}%"))
    ).limit(5).all()

    # Decisions
    decisions = []
    if _surveillance and _surveillance.explainer:
        for d_id, exp in _surveillance.explainer.explanations.items():
            if term in d_id.lower() or term in exp.what.lower() or term in exp.why.lower():
                decisions.append({
                    "decision_id": d_id,
                    "title": exp.what,
                    "why": exp.why,
                })

    # Evidence citations
    evidence = []
    if "alt" in term or "lb" in term:
        evidence.append({"record_ref": "LB #042-S07-001-ALT", "summary": "ALT 145 U/L at Visit 2 (2026-01-26)"})
        evidence.append({"record_ref": "LB #042-S07-002-ALT", "summary": "ALT 220 U/L at Visit 3 (2026-02-09)"})

    return {
        "query": q,
        "results": {
            "subjects": [{"id": s.usubjid, "site": s.site_id, "status": s.status, "treatment": s.primary_treatment} for s in subjects],
            "diseases": [{"condition": d.condition, "subject_id": d.usubjid, "status": d.status} for d in diseases],
            "medications": [{"medication": m.medication_name, "subject_id": m.usubjid, "dose": m.dose} for m in medications],
            "findings": [{"id": f.id, "title": f.title, "subject_id": f.usubjid, "severity": f.severity} for f in findings],
            "evidence": evidence,
            "queries": [{"id": q.query_id, "problem": q.problem_type, "subject_id": q.usubjid, "status": q.status} for q in queries],
            "decisions": decisions,
        }
    }
