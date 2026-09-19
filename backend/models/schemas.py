"""
Pydantic Schemas for Request/Response validation.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# --- Subject Creation 8-step wizard schema ---
class MedicalHistoryIn(BaseModel):
    condition: str
    start_date: str
    status: str = "Ongoing"
    evidence_source: str = "HIST #01"


class MedicationIn(BaseModel):
    medication: str
    dose: str = "50 mg"
    route: str = "Oral"
    frequency: str = "Once daily"
    start_date: str
    end_date: Optional[str] = None
    status: str = "Ongoing"
    evidence_source: str = "CM #01"


class VisitIn(BaseModel):
    visit_name: str
    visit_date: str
    target_day: int = 14
    actual_day: int = 14
    visit_window: str = "±7 days"
    status: str = "Completed"


class LabResultIn(BaseModel):
    test: str
    value: str
    unit: str = "U/L"
    reference_range: str = "7-56"
    collection_date: str


class DoseIn(BaseModel):
    visit: str
    planned_dose: float
    actual_dose: float
    dose_date: str


class AdverseEventIn(BaseModel):
    event: str
    start_date: str
    end_date: Optional[str] = None
    severity: str = "Moderate"
    seriousness: str = "No"
    hospitalization: str = "No"
    relationship: str = "Possible"
    status: str = "Ongoing"


class CreateSubjectPayload(BaseModel):
    subject_id: str
    site_id: str
    enrollment_date: str
    study_status: str = "Active"
    age: int = 54
    sex: str = "M"
    medical_history: List[MedicalHistoryIn] = []
    medications: List[MedicationIn] = []
    visits: List[VisitIn] = []
    labs: List[LabResultIn] = []
    dosing: List[DoseIn] = []
    adverse_events: List[AdverseEventIn] = []


# --- Ask ATLAS Schema ---
class AskAtlasRequest(BaseModel):
    question: str


# --- Human Gate Action Schema ---
class HumanGateAction(BaseModel):
    action: str  # "APPROVE", "REJECT", "CLARIFY"
    reviewer: str = "Dr. Sarah Chen (Medical Monitor)"
    rejection_reason: Optional[str] = None
    clarification_question: Optional[str] = None
    notes: Optional[str] = None


# --- Query Action Schema ---
class QuerySiteResponse(BaseModel):
    site_response: str


class QueryReviewAction(BaseModel):
    decision: str  # "ACCEPT", "REJECT"
    dm_notes: str


# --- Budget Set Schema ---
class BudgetUpdate(BaseModel):
    consumed_usd: float
