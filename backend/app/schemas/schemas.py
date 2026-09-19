from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# Auth & Users
class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user_id: int
    email: str
    full_name: str
    role: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role_name: str = 'Clinical Reviewer'

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool

# Organization & Study
class OrganizationCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = ''

class OrganizationResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    created_at: datetime

class StudyCreate(BaseModel):
    org_id: int
    study_id: str
    name: str
    sponsor: str = ''
    therapeutic_area: str = 'Oncology / Hepatology'
    protocol_version: str = 'v1.0'

class StudyResponse(BaseModel):
    id: int
    org_id: int
    study_id: str
    name: str
    sponsor: str
    therapeutic_area: str
    current_cut: int
    current_protocol_version: str
    status: str
    created_at: datetime
    sites_count: Optional[int] = 0
    subjects_count: Optional[int] = 0

class SiteCreate(BaseModel):
    site_id: str
    name: str
    location: str = ''
    pi_name: str = ''

class SiteResponse(BaseModel):
    id: int
    study_id: int
    site_id: str
    name: str
    location: str
    pi_name: str
    status: str

# Clinical Records
class LabInput(BaseModel):
    test_code: str
    test_name: Optional[str] = ''
    raw_value: str
    raw_unit: str = ''
    visit_name: Optional[str] = 'Baseline'
    collection_date: Optional[str] = ''

class AEInput(BaseModel):
    aeterm: str
    aedecod: Optional[str] = ''
    severity: str = 'MILD'
    is_serious: str = 'N'
    is_hospitalized: str = 'N'
    start_date: str
    end_date: Optional[str] = ''
    causality: str = 'POSSIBLE'
    action_taken: str = 'DOSE NOT CHANGED'

class ConMedInput(BaseModel):
    cmtrt: str
    indication: Optional[str] = ''
    start_date: str
    end_date: Optional[str] = ''

class VisitInput(BaseModel):
    visit_name: str
    scheduled_day: int = 1
    actual_date: str = ''

class SubjectCreate(BaseModel):
    study_id: int
    site_id: str
    usubjid: str
    age: Optional[int] = None
    sex: str = 'UNKNOWN'
    arm: str = 'Active Arm'
    screen_date: Optional[str] = ''
    rfstdtc: Optional[str] = ''  # First dose date
    rfendtc: Optional[str] = ''
    visits: Optional[List[VisitInput]] = []
    labs: Optional[List[LabInput]] = []
    adverse_events: Optional[List[AEInput]] = []
    conmeds: Optional[List[ConMedInput]] = []

class SubjectResponse(BaseModel):
    id: int
    study_id: int
    site_id: str
    site_name: Optional[str] = ''
    usubjid: str
    subjid: str
    age: Optional[int]
    sex: str
    arm: str
    rfstdtc: str
    rfendtc: str
    screen_date: str
    status: str
    open_findings_count: int = 0
    open_queries_count: int = 0
    current_visit: str = 'Visit 1'

# ATLAS & Evidence
class RecordRef(BaseModel):
    record_type: str
    record_id: str
    subject_id: str
    site_id: Optional[str] = ''
    field_name: Optional[str] = ''
    value: Optional[str] = ''
    source_table: Optional[str] = ''

class AskAtlasRequest(BaseModel):
    question: str
    study_id: int
    context: Optional[Dict[str, Any]] = None

class AtlasAnswer(BaseModel):
    answer: str
    question_type: str  # COUNT, LOOKUP, FINDING, TRAP
    status: str  # ANSWERED, INSUFFICIENT_EVIDENCE, OUTSIDE_STUDY_SCOPE, AMBIGUOUS
    evidence: List[Dict[str, Any]] = []
    calculation_details: Optional[str] = None
    protocol_rule: Optional[str] = None
    confidence: float = 1.0

# Findings & Monitor
class FindingResponse(BaseModel):
    id: int
    finding_code: str
    category: str
    severity: str
    subject_id: Optional[str] = None
    site_id: Optional[str] = None
    title: str
    description: str
    rationale: str
    status: str
    protocol_version: str
    cut_number: int
    evidence: List[Dict[str, Any]] = []
    created_at: datetime

class QueryCreate(BaseModel):
    study_id: int
    subject_id: Optional[str] = None
    site_id: Optional[str] = None
    domain: str = 'AE'
    record_id: Optional[str] = ''
    problem_description: str
    requested_action: str

class QueryResponseSchema(BaseModel):
    id: int
    query_code: str
    study_id: int
    subject_id: Optional[str]
    site_id: Optional[str]
    domain: str
    record_id: str
    cut_number: int
    problem_description: str
    requested_action: str
    status: str
    created_at: datetime
    responses: List[Dict[str, Any]] = []

class QueryAnswerRequest(BaseModel):
    response_text: str

class EscalationDecisionRequest(BaseModel):
    decision: str  # APPROVED, REJECTED, CLARIFY
    reason: Optional[str] = ''
    clarification_question: Optional[str] = ''

class EscalationResponse(BaseModel):
    id: int
    escalation_code: str
    finding_id: int
    finding_title: str
    subject_id: Optional[str]
    site_id: Optional[str]
    severity: str
    protocol_version: str
    proposed_action: str
    medical_review_summary: str
    status: str
    evidence: List[Dict[str, Any]] = []
    created_at: datetime
    decisions: List[Dict[str, Any]] = []

class TraceEntryResponse(BaseModel):
    id: int
    cycle_id: Optional[int]
    node_name: str
    timestamp: datetime
    action: str
    decision: str
    subject_id: str
    finding_id: str
    evidence_ids: List[str] = []
    cut_number: int
    protocol_version: str
    message: str

class RunCycleRequest(BaseModel):
    study_id: int
    cut_number: Optional[int] = None
    protocol_version: Optional[str] = None

class DataCutSwitchRequest(BaseModel):
    study_id: int
    target_cut: int
    protocol_version: Optional[str] = None
