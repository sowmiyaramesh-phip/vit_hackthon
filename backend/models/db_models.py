"""
SQLAlchemy Database Models for ATLAS MONITOR WATCH
Covers all 22 required clinical trial entities.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Study(Base):
    __tablename__ = "studies"
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(String(64), unique=True, index=True, default="ABC-101")
    protocol_name = Column(String(255), default="A Multicenter, Double-Blind Phase II Trial")
    phase = Column(String(32), default="Phase II")
    status = Column(String(32), default="ACTIVE")
    current_cut = Column(Integer, default=8)
    total_cuts = Column(Integer, default=12)
    current_protocol_version = Column(String(32), default="v1.0")
    created_at = Column(DateTime, default=datetime.utcnow)


class Protocol(Base):
    __tablename__ = "protocols"
    id = Column(Integer, primary_key=True, index=True)
    protocol_id = Column(String(64), index=True)
    version = Column(String(32), default="v1.0")
    effective_date = Column(String(32), default="2026-01-01")
    title = Column(String(255))
    content = Column(Text)
    sha256_hash = Column(String(128))
    is_active = Column(Boolean, default=True)


class Site(Base):
    __tablename__ = "sites"
    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(String(64), unique=True, index=True)
    name = Column(String(255))
    pi_name = Column(String(255))
    country = Column(String(64), default="United States")
    status = Column(String(32), default="ACTIVE")


class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    usubjid = Column(String(64), unique=True, index=True)
    site_id = Column(String(64), ForeignKey("sites.site_id"), index=True)
    age = Column(Integer)
    sex = Column(String(16))
    race = Column(String(64))
    arm = Column(String(128), default="Experimental 50mg")
    status = Column(String(32), default="Active")
    enrollment_date = Column(String(32))
    first_dose_date = Column(String(32), nullable=True)
    primary_treatment = Column(String(128), default="Drug A")
    treatment_status = Column(String(32), default="Ongoing")


class MedicalHistory(Base):
    __tablename__ = "medical_histories"
    id = Column(Integer, primary_key=True, index=True)
    usubjid = Column(String(64), ForeignKey("subjects.usubjid"), index=True)
    condition = Column(String(255), index=True)
    start_date = Column(String(32))
    status = Column(String(64), default="Ongoing")
    evidence_ref = Column(String(128))


class Medication(Base):
    __tablename__ = "medications"
    id = Column(Integer, primary_key=True, index=True)
    usubjid = Column(String(64), ForeignKey("subjects.usubjid"), index=True)
    medication_name = Column(String(255), index=True)
    dose = Column(String(64), default="50 mg")
    route = Column(String(64), default="Oral")
    frequency = Column(String(64), default="Once daily")
    start_date = Column(String(32))
    end_date = Column(String(32), nullable=True)
    status = Column(String(64), default="Ongoing")
    evidence_ref = Column(String(128))


class Visit(Base):
    __tablename__ = "visits"
    id = Column(Integer, primary_key=True, index=True)
    usubjid = Column(String(64), ForeignKey("subjects.usubjid"), index=True)
    name = Column(String(128))
    target_day = Column(Integer)
    actual_day = Column(Integer)
    visit_date = Column(String(32))
    status = Column(String(64), default="Completed")
    window_deviation_days = Column(Integer, default=0)
    evidence_ref = Column(String(128))


class LabResult(Base):
    __tablename__ = "lab_results"
    id = Column(Integer, primary_key=True, index=True)
    usubjid = Column(String(64), ForeignKey("subjects.usubjid"), index=True)
    test_code = Column(String(32), index=True)
    test_name = Column(String(255))
    raw_value = Column(String(64))
    numeric_value = Column(Float, nullable=True)
    unit = Column(String(64))
    standard_unit = Column(String(64))
    converted_value = Column(Float, nullable=True)
    uln = Column(Float, nullable=True)
    reference_range = Column(String(64))
    status = Column(String(32), default="NORMAL")
    is_censored = Column(Boolean, default=False)
    operator = Column(String(8), default="=")
    visit = Column(String(128))
    collection_date = Column(String(32))
    evidence_ref = Column(String(128))


class Dose(Base):
    __tablename__ = "doses"
    id = Column(Integer, primary_key=True, index=True)
    usubjid = Column(String(64), ForeignKey("subjects.usubjid"), index=True)
    visit = Column(String(128))
    planned_dose = Column(Float)
    actual_dose = Column(Float)
    unit = Column(String(32), default="mg")
    dose_date = Column(String(32))
    status = Column(String(64), default="Administered")
    is_deviation = Column(Boolean, default=False)
    evidence_ref = Column(String(128))


class AdverseEvent(Base):
    __tablename__ = "adverse_events"
    id = Column(Integer, primary_key=True, index=True)
    usubjid = Column(String(64), ForeignKey("subjects.usubjid"), index=True)
    term = Column(String(255), index=True)
    severity = Column(String(32), default="Moderate")
    is_serious = Column(Boolean, default=False)
    hospitalized = Column(Boolean, default=False)
    relationship = Column(String(64), default="Possible")
    start_date = Column(String(32))
    end_date = Column(String(32), nullable=True)
    status = Column(String(64), default="Ongoing")
    evidence_ref = Column(String(128))


class Finding(Base):
    __tablename__ = "findings"
    id = Column(String(64), primary_key=True, index=True)
    usubjid = Column(String(64), ForeignKey("subjects.usubjid"), index=True)
    site_id = Column(String(64), default="SITE-101")
    title = Column(String(255))
    category = Column(String(64), default="SAFETY")
    severity = Column(String(32), default="HIGH")
    message = Column(Text)
    recommended_action = Column(Text)
    protocol_rule = Column(String(128), default="§2.1")
    status = Column(String(32), default="OPEN")
    evidence_bundle = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DataQueryModel(Base):
    __tablename__ = "data_queries"
    query_id = Column(String(64), primary_key=True, index=True)
    usubjid = Column(String(64), index=True)
    site_id = Column(String(64), default="SITE-101")
    problem_type = Column(String(128))
    record_ref = Column(String(128))
    question_to_site = Column(Text)
    status = Column(String(32), default="OPEN")
    site_response = Column(Text, nullable=True)
    dm_review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class HumanEscalationModel(Base):
    __tablename__ = "human_escalations"
    escalation_id = Column(String(64), primary_key=True, index=True)
    usubjid = Column(String(64), index=True)
    site_id = Column(String(64), default="SITE-101")
    finding_id = Column(String(64))
    title = Column(String(255))
    severity = Column(String(32), default="CRITICAL")
    status = Column(String(32), default="PENDING")
    recommended_action = Column(Text)
    clinical_evidence = Column(JSON)
    protocol_evidence = Column(JSON)
    clarification_history = Column(JSON, default=list)
    rejection_reason = Column(Text, nullable=True)
    cuts_waiting = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class DecisionTraceModel(Base):
    __tablename__ = "decision_traces"
    id = Column(String(64), primary_key=True, index=True)
    node = Column(String(64))
    decision = Column(String(64))
    subject_id = Column(String(64), nullable=True)
    finding_id = Column(String(64), nullable=True)
    protocol_version = Column(String(32), default="v1.0")
    evidence_refs = Column(JSON)
    actor = Column(String(128))
    notes = Column(Text)
    result_payload = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
