from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class Organization(Base):
    __tablename__ = 'organizations'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, default='')
    created_at = Column(DateTime, default=datetime.utcnow)

    studies = relationship('Study', back_populates='organization')

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_roles = relationship('UserRole', back_populates='user')

class Role(Base):
    __tablename__ = 'roles'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, default='')
    permissions = Column(Text, default='[]')

    user_roles = relationship('UserRole', back_populates='role')

class UserRole(Base):
    __tablename__ = 'user_roles'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=True)
    organization_id = Column(Integer, ForeignKey('organizations.id'), nullable=True)

    user = relationship('User', back_populates='user_roles')
    role = relationship('Role', back_populates='user_roles')

class Study(Base):
    __tablename__ = 'studies'
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey('organizations.id'), nullable=False)
    study_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    sponsor = Column(String(255), default='')
    therapeutic_area = Column(String(100), default='Oncology / Hepatology')
    current_cut = Column(Integer, default=1)
    current_protocol_version = Column(String(50), default='v1.0')
    status = Column(String(50), default='ACTIVE')
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship('Organization', back_populates='studies')
    sites = relationship('Site', back_populates='study')
    subjects = relationship('Subject', back_populates='study')
    protocols = relationship('Protocol', back_populates='study')

class Site(Base):
    __tablename__ = 'sites'
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    site_id = Column(String(50), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    location = Column(String(255), default='')
    pi_name = Column(String(255), default='')
    status = Column(String(50), default='ACTIVE')

    study = relationship('Study', back_populates='sites')
    subjects = relationship('Subject', back_populates='site')

class Protocol(Base):
    __tablename__ = 'protocols'
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    code = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)

    study = relationship('Study', back_populates='protocols')
    versions = relationship('ProtocolVersion', back_populates='protocol')

class ProtocolVersion(Base):
    __tablename__ = 'protocol_versions'
    id = Column(Integer, primary_key=True, index=True)
    protocol_id = Column(Integer, ForeignKey('protocols.id'), nullable=False)
    version_str = Column(String(50), nullable=False)
    effective_date = Column(String(50), default='')
    is_active = Column(Boolean, default=True)
    amendment_summary = Column(Text, default='')

    protocol = relationship('Protocol', back_populates='versions')
    rules = relationship('ProtocolRule', back_populates='protocol_version')

class ProtocolRule(Base):
    __tablename__ = 'protocol_rules'
    id = Column(Integer, primary_key=True, index=True)
    protocol_version_id = Column(Integer, ForeignKey('protocol_versions.id'), nullable=False)
    rule_code = Column(String(100), nullable=False)
    domain = Column(String(50), default='GENERAL')
    rule_data = Column(Text, default='{}')
    description = Column(Text, default='')

    protocol_version = relationship('ProtocolVersion', back_populates='rules')

class DataCut(Base):
    __tablename__ = 'data_cuts'
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    cut_number = Column(Integer, nullable=False)
    protocol_version = Column(String(50), default='v1.0')
    snapshot_date = Column(String(50), default='')
    description = Column(Text, default='')
    status = Column(String(50), default='LOCKED')

class Subject(Base):
    __tablename__ = 'subjects'
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    site_id = Column(Integer, ForeignKey('sites.id'), nullable=False)
    usubjid = Column(String(100), unique=True, index=True, nullable=False)
    subjid = Column(String(50), nullable=False)
    age = Column(Integer, nullable=True)
    sex = Column(String(10), default='UNKNOWN')
    arm = Column(String(100), default='Active Arm')
    rfstdtc = Column(String(50), default='')
    rfendtc = Column(String(50), default='')
    screen_date = Column(String(50), default='')
    status = Column(String(50), default='ONGOING')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    study = relationship('Study', back_populates='subjects')
    site = relationship('Site', back_populates='subjects')
    visits = relationship('Visit', back_populates='subject', cascade='all, delete-orphan')
    labs = relationship('LabResult', back_populates='subject', cascade='all, delete-orphan')
    adverse_events = relationship('AdverseEvent', back_populates='subject', cascade='all, delete-orphan')
    conmeds = relationship('ConcomitantMedication', back_populates='subject')

class Treatment(Base):
    __tablename__ = 'treatments'
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id'), nullable=False)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    arm_code = Column(String(50), default='')
    arm_name = Column(String(100), default='')
    dose = Column(Float, default=0.0)
    dose_unit = Column(String(20), default='mg')
    start_date = Column(String(50), default='')
    end_date = Column(String(50), default='')

class Visit(Base):
    __tablename__ = 'visits'
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey('subjects.id'), nullable=False)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    visit_name = Column(String(100), nullable=False)
    visit_num = Column(Integer, default=1)
    scheduled_day = Column(Integer, default=1)
    actual_date = Column(String(50), default='')
    target_date = Column(String(50), default='')
    window_lower = Column(Integer, default=0)
    window_upper = Column(Integer, default=0)
    is_out_of_window = Column(Boolean, default=False)
    window_deviation_days = Column(Integer, default=0)

    subject = relationship('Subject', back_populates='visits')

class LabResult(Base):
    __tablename__ = 'lab_results'
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(50), index=True, nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id'), nullable=False)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    site_id = Column(Integer, ForeignKey('sites.id'), nullable=True)
    visit_name = Column(String(100), default='')
    test_code = Column(String(50), index=True, nullable=False)
    test_name = Column(String(100), default='')
    raw_value = Column(String(50), default='')
    raw_unit = Column(String(50), default='')
    normalized_value = Column(Float, nullable=True)
    normalized_unit = Column(String(50), default='')
    operator = Column(String(10), default='')
    is_censored = Column(Boolean, default=False)
    uln = Column(Float, nullable=True)
    lln = Column(Float, nullable=True)
    is_abnormal = Column(Boolean, default=False)
    ratio_to_uln = Column(Float, nullable=True)
    collection_date = Column(String(50), default='')
    conversion_method = Column(String(255), default='')

    subject = relationship('Subject', back_populates='labs')

class AdverseEvent(Base):
    __tablename__ = 'adverse_events'
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(50), index=True, nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id'), nullable=False)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    site_id = Column(Integer, ForeignKey('sites.id'), nullable=True)
    seq = Column(Integer, default=1)
    aeterm = Column(String(255), nullable=False)
    aedecod = Column(String(255), default='')
    aebodsys = Column(String(255), default='')
    start_date = Column(String(50), default='')
    end_date = Column(String(50), default='')
    severity = Column(String(50), default='MILD')
    is_serious = Column(String(10), default='N')
    is_hospitalized = Column(String(10), default='N')
    causality = Column(String(100), default='POSSIBLE')
    outcome = Column(String(100), default='RECOVERED')
    action_taken = Column(String(100), default='DOSE NOT CHANGED')
    is_sae_miscoded = Column(Boolean, default=False)

    subject = relationship('Subject', back_populates='adverse_events')

class ConcomitantMedication(Base):
    __tablename__ = 'concomitant_medications'
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(50), index=True, nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id'), nullable=False)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    site_id = Column(Integer, ForeignKey('sites.id'), nullable=True)
    seq = Column(Integer, default=1)
    cmtrt = Column(String(255), nullable=False)
    cmdecod = Column(String(255), default='')
    indication = Column(String(255), default='')
    start_date = Column(String(50), default='')
    end_date = Column(String(50), default='')
    is_hepatotoxic = Column(Boolean, default=False)
    is_prohibited = Column(Boolean, default=False)

    subject = relationship('Subject', back_populates='conmeds')

class GraphNode(Base):
    __tablename__ = 'graph_nodes'
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    node_key = Column(String(100), index=True, nullable=False)
    label = Column(String(255), nullable=False)
    entity_type = Column(String(50), index=True, nullable=False)
    properties_json = Column(Text, default='{}')

class GraphEdge(Base):
    __tablename__ = 'graph_edges'
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    source_key = Column(String(100), index=True, nullable=False)
    target_key = Column(String(100), index=True, nullable=False)
    relationship = Column(String(100), index=True, nullable=False)
    properties_json = Column(Text, default='{}')

class Finding(Base):
    __tablename__ = 'findings'
    id = Column(Integer, primary_key=True, index=True)
    finding_code = Column(String(50), index=True, nullable=False)
    category = Column(String(50), index=True, default='SAFETY')
    severity = Column(String(50), index=True, default='MEDIUM')
    subject_id = Column(Integer, ForeignKey('subjects.id'), nullable=True)
    site_id = Column(Integer, ForeignKey('sites.id'), nullable=True)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    cut_number = Column(Integer, default=1)
    protocol_version = Column(String(50), default='v1.0')
    title = Column(String(255), nullable=False)
    description = Column(Text, default='')
    rationale = Column(Text, default='')
    status = Column(String(50), default='OPEN')
    created_at = Column(DateTime, default=datetime.utcnow)

    evidence_items = relationship('Evidence', back_populates='finding', cascade='all, delete-orphan')
    subject = relationship('Subject')
    site = relationship('Site')
    study = relationship('Study')

class Evidence(Base):
    __tablename__ = 'evidence_records'
    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey('findings.id'), nullable=False)
    record_type = Column(String(50), nullable=False)
    record_id = Column(String(50), nullable=False)
    subject_id = Column(String(100), default='')
    site_id = Column(String(50), default='')
    field_name = Column(String(100), default='')
    value = Column(String(255), default='')
    expected_value = Column(String(255), default='')
    protocol_rule = Column(String(255), default='')
    calculation_details = Column(Text, default='')

    finding = relationship('Finding', back_populates='evidence_items')

class MedicalReview(Base):
    __tablename__ = 'medical_reviews'
    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, ForeignKey('findings.id'), nullable=False)
    cycle_id = Column(Integer, nullable=True)
    reviewer_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    seriousness_rating = Column(String(50), default='SERIOUS')
    plausibility = Column(String(50), default='PLAUSIBLE')
    clinical_significance = Column(String(50), default='HIGH')
    rationale = Column(Text, default='')
    recommendation = Column(String(50), default='ESCALATE')
    alternatives_considered = Column(Text, default='')
    status = Column(String(50), default='COMPLETED')

class Query(Base):
    __tablename__ = 'queries'
    id = Column(Integer, primary_key=True, index=True)
    query_code = Column(String(50), unique=True, index=True, nullable=False)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id'), nullable=True)
    site_id = Column(Integer, ForeignKey('sites.id'), nullable=True)
    domain = Column(String(50), default='AE')
    record_id = Column(String(50), default='')
    cut_number = Column(Integer, default=1)
    problem_description = Column(Text, nullable=False)
    requested_action = Column(Text, nullable=False)
    status = Column(String(50), default='OPEN')
    created_at = Column(DateTime, default=datetime.utcnow)

    responses = relationship('QueryResponse', back_populates='query', cascade='all, delete-orphan')
    subject = relationship('Subject')
    site = relationship('Site')
    study = relationship('Study')

class QueryResponse(Base):
    __tablename__ = 'query_responses'
    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey('queries.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    responder_role = Column(String(100), default='Site Coordinator')
    response_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    query = relationship('Query', back_populates='responses')

class ProtocolDeviation(Base):
    __tablename__ = 'protocol_deviations'
    id = Column(Integer, primary_key=True, index=True)
    deviation_code = Column(String(50), unique=True, index=True, nullable=False)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id'), nullable=True)
    site_id = Column(Integer, ForeignKey('sites.id'), nullable=True)
    rule_code = Column(String(100), nullable=False)
    protocol_version = Column(String(50), default='v1.0')
    deviation_type = Column(String(100), default='VISIT_WINDOW')
    severity = Column(String(50), default='MAJOR')
    description = Column(Text, nullable=False)
    evidence_ref = Column(String(100), default='')
    status = Column(String(50), default='OPEN')
    subject = relationship('Subject')
    site = relationship('Site')
    study = relationship('Study')

class SiteFlag(Base):
    __tablename__ = 'site_flags'
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    site_id = Column(Integer, ForeignKey('sites.id'), nullable=False)
    flag_code = Column(String(50), nullable=False)
    reason = Column(Text, nullable=False)
    recurring_count = Column(Integer, default=1)
    cut_number = Column(Integer, default=1)
    status = Column(String(50), default='ACTIVE')
    site = relationship('Site')
    study = relationship('Study')

class MonitoringCycle(Base):
    __tablename__ = 'monitoring_cycles'
    id = Column(Integer, primary_key=True, index=True)
    cycle_code = Column(String(50), unique=True, index=True, nullable=False)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    cut_number = Column(Integer, default=1)
    protocol_version = Column(String(50), default='v1.0')
    status = Column(String(50), default='RUNNING')
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    summary_json = Column(Text, default='{}')

class Escalation(Base):
    __tablename__ = 'escalations'
    id = Column(Integer, primary_key=True, index=True)
    escalation_code = Column(String(50), unique=True, index=True, nullable=False)
    cycle_id = Column(Integer, ForeignKey('monitoring_cycles.id'), nullable=True)
    finding_id = Column(Integer, ForeignKey('findings.id'), nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id'), nullable=True)
    site_id = Column(Integer, ForeignKey('sites.id'), nullable=True)
    severity = Column(String(50), default='CRITICAL')
    protocol_version = Column(String(50), default='v1.0')
    proposed_action = Column(Text, nullable=False)
    medical_review_summary = Column(Text, default='')
    status = Column(String(50), default='PENDING')
    created_at = Column(DateTime, default=datetime.utcnow)

    decisions = relationship('EscalationDecision', back_populates='escalation', cascade='all, delete-orphan')
    finding = relationship('Finding')
    subject = relationship('Subject')
    site = relationship('Site')

class EscalationDecision(Base):
    __tablename__ = 'escalation_decisions'
    id = Column(Integer, primary_key=True, index=True)
    escalation_id = Column(Integer, ForeignKey('escalations.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    decision = Column(String(50), nullable=False)
    reason = Column(Text, default='')
    clarification_question = Column(Text, default='')
    clarification_answer = Column(Text, default='')
    clarification_evidence_json = Column(Text, default='[]')
    decided_at = Column(DateTime, default=datetime.utcnow)

    escalation = relationship('Escalation', back_populates='decisions')

class TraceEntry(Base):
    __tablename__ = 'trace_entries'
    id = Column(Integer, primary_key=True, index=True)
    cycle_id = Column(Integer, nullable=True, index=True)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    node_name = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String(255), nullable=False)
    decision = Column(String(100), default='')
    subject_id = Column(String(100), default='')
    finding_id = Column(String(100), default='')
    evidence_ids_json = Column(Text, default='[]')
    cut_number = Column(Integer, default=1)
    protocol_version = Column(String(50), default='v1.0')
    user_id = Column(Integer, nullable=True)
    message = Column(Text, nullable=False)

class SubjectHistory(Base):
    __tablename__ = 'subject_histories'
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    subject_id = Column(Integer, ForeignKey('subjects.id'), nullable=False)
    cut_number = Column(Integer, default=1)
    flagged_count = Column(Integer, default=1)
    findings_summary_json = Column(Text, default='[]')

class CycleReport(Base):
    __tablename__ = 'cycle_reports'
    id = Column(Integer, primary_key=True, index=True)
    cycle_id = Column(Integer, ForeignKey('monitoring_cycles.id'), nullable=False)
    study_id = Column(Integer, ForeignKey('studies.id'), nullable=False)
    cut_number = Column(Integer, default=1)
    protocol_version = Column(String(50), default='v1.0')
    report_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
