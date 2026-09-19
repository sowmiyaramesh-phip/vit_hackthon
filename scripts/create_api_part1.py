from pathlib import Path

out_path = Path("backend/app/api/endpoints.py")

part1 = """import json
import csv
import io
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query as QueryParam
from fastapi.responses import Response, PlainTextResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, hash_password
from app.models.models import (
    User, Role, UserRole, Organization, Study, Site, Protocol, ProtocolVersion,
    Subject, Treatment, Visit, LabResult, AdverseEvent, ConcomitantMedication,
    Finding, Evidence, MedicalReview, Query as DBQuery, QueryResponse,
    ProtocolDeviation, SiteFlag, MonitoringCycle, Escalation, EscalationDecision,
    TraceEntry, DataCut, CycleReport
)
from app.schemas.schemas import (
    LoginRequest, Token, SubjectCreate, AskAtlasRequest, AtlasAnswer,
    QueryCreate, QueryAnswerRequest, EscalationDecisionRequest, RunCycleRequest,
    DataCutSwitchRequest
)
from app.normalization.normalizer import parse_date, parse_clinical_number, normalize_lab_unit
from app.normalization.validator import ClinicalValidator
from app.protocol.rules_engine import ProtocolRulesEngine
from app.knowledge_graph.graph_service import KnowledgeGraphService
from app.atlas.engine import AtlasEngine
from app.monitor.review_crew import ReviewCrew
from app.ai.ai_service import AIService
from app.reports.report_service import ReportService
from app.trace.trace_service import TraceService
from app.services.data_service import DataService

router = APIRouter()

# 1. AUTH & USERS
@router.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    role_name = "Clinical Reviewer"
    if user.user_roles:
        role_name = user.user_roles[0].role.name
        
    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": role_name
    }

@router.get("/auth/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for u in users:
        r_name = u.user_roles[0].role.name if u.user_roles else "Clinical Reviewer"
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": r_name,
            "suggested_password": "AdminPass123!" if "admin" in u.email else f"{r_name.split()[0]}Pass123!"
        })
    return result

@router.get("/auth/me")
def get_current_user(user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).first()
    role_name = user.user_roles[0].role.name if user and user.user_roles else "Study Administrator"
    return {
        "id": user.id if user else 1,
        "email": user.email if user else "admin@atlas.clinical",
        "full_name": user.full_name if user else "Admin",
        "role": role_name
    }

# 2. ORGANIZATIONS & STUDIES
@router.get("/organizations")
def list_organizations(db: Session = Depends(get_db)):
    return db.query(Organization).all()

@router.post("/organizations")
def create_organization(data: Dict[str, Any], db: Session = Depends(get_db)):
    name = data.get("name", "New Organization")
    slug = data.get("slug") or name.lower().replace(" ", "-")
    org = Organization(name=name, slug=slug, description=data.get("description", ""))
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@router.get("/studies")
def list_studies(db: Session = Depends(get_db)):
    studies = db.query(Study).all()
    res = []
    for s in studies:
        sub_count = db.query(Subject).filter(Subject.study_id == s.id).count()
        site_count = db.query(Site).filter(Site.study_id == s.id).count()
        f_count = db.query(Finding).filter(Finding.study_id == s.id).count()
        q_count = db.query(DBQuery).filter(DBQuery.study_id == s.id, DBQuery.status == "OPEN").count()
        esc_count = db.query(Escalation).join(MonitoringCycle).filter(MonitoringCycle.study_id == s.id, Escalation.status == "PENDING").count()
        res.append({
            "id": s.id,
            "org_id": s.org_id,
            "study_id": s.study_id,
            "name": s.name,
            "sponsor": s.sponsor,
            "therapeutic_area": s.therapeutic_area,
            "current_cut": s.current_cut,
            "current_protocol_version": s.current_protocol_version,
            "status": s.status,
            "subjects_count": sub_count,
            "sites_count": site_count,
            "findings_count": f_count,
            "open_queries_count": q_count,
            "pending_escalations_count": esc_count
        })
    return res

@router.post("/studies")
def create_study(data: Dict[str, Any], db: Session = Depends(get_db)):
    org = db.query(Organization).first()
    study = Study(
        org_id=data.get("org_id", org.id if org else 1),
        study_id=data.get("study_id", "STUDY-002").upper(),
        name=data.get("name", "New Clinical Study"),
        sponsor=data.get("sponsor", "BioPharma Sponsor"),
        therapeutic_area=data.get("therapeutic_area", "Oncology"),
        current_cut=1,
        current_protocol_version=data.get("protocol_version", "v1.0")
    )
    db.add(study)
    db.commit()
    db.refresh(study)
    site = Site(study_id=study.id, site_id="S01", name="Primary Clinical Site", location="Main Campus")
    db.add(site)
    db.commit()
    return study

@router.get("/studies/{study_id}")
def get_study(study_id: int, db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found.")
    return study

@router.post("/studies/{study_id}/sites")
def add_site(study_id: int, data: Dict[str, Any], db: Session = Depends(get_db)):
    site = Site(
        study_id=study_id,
        site_id=data.get("site_id", "S99"),
        name=data.get("name", "New Investigation Site"),
        location=data.get("location", ""),
        pi_name=data.get("pi_name", "")
    )
    db.add(site)
    db.commit()
    db.refresh(site)
    return site
"""

out_path.write_text(part1, encoding="utf-8")
print("Part 1 written successfully")
