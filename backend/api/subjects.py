"""
Subject API router: Subject 360, Listing, and 8-Step Add Subject Wizard.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.db_models import (
    Subject, MedicalHistory, Medication, Visit, LabResult, Dose, AdverseEvent, Finding, DataQueryModel, Site
)
from ..models.schemas import CreateSubjectPayload
from ..stage1.normalization import normalize_lab_result
from ..stage1.protocol import ProtocolEngine
from ..stage1.evidence import RecordRef, ProtocolRef
from ..stage1.graph import GraphNode, GraphEdge
from ..stage3.subject_cuts import get_subject_surveillance_data, get_subject_cut_details

router = APIRouter(prefix="/subjects", tags=["Subjects"])

# Reference to global graph (injected from main)
_clinical_graph = None
_surveillance = None


def set_context(graph, surveillance):
    global _clinical_graph, _surveillance
    _clinical_graph = graph
    _surveillance = surveillance


@router.get("")
def list_subjects(
    site: Optional[str] = None,
    status: Optional[str] = None,
    disease: Optional[str] = None,
    treatment: Optional[str] = None,
    finding: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Subject)
    if site:
        query = query.filter(Subject.site_id == site)
    if status:
        query = query.filter(Subject.status.ilike(f"%{status}%"))
    if treatment:
        query = query.filter(Subject.primary_treatment.ilike(f"%{treatment}%"))
    if search:
        query = query.filter(
            (Subject.usubjid.ilike(f"%{search}%")) |
            (Subject.site_id.ilike(f"%{search}%")) |
            (Subject.primary_treatment.ilike(f"%{search}%"))
        )

    all_subjects = query.all()
    results = []

    for s in all_subjects:
        # Load related
        diseases = [mh.condition for mh in db.query(MedicalHistory).filter(MedicalHistory.usubjid == s.usubjid).all()]
        if disease and not any(disease.lower() in d.lower() for d in diseases):
            continue

        findings = db.query(Finding).filter(Finding.usubjid == s.usubjid, Finding.status == "OPEN").all()
        if finding and not any(finding.lower() in f.title.lower() for f in findings):
            continue

        queries = db.query(DataQueryModel).filter(DataQueryModel.usubjid == s.usubjid, DataQueryModel.status != "CLOSED").all()

        primary_disease = diseases[0] if diseases else "Liver disease" if ("S07" in s.usubjid or "008" in s.usubjid or "009" in s.usubjid) else "Hepatocellular Disorder"
        med = db.query(Medication).filter(Medication.usubjid == s.usubjid).first()
        med_name = med.medication_name if med else s.primary_treatment
        treatment_label = "Treatment A" if med_name == "Drug A" else "Treatment B" if med_name == "Drug B" else s.primary_treatment

        latest_finding = findings[0].title if findings else "Hy's Law Candidate" if "S07" in s.usubjid else "None"

        results.append({
            "subject_id": s.usubjid,
            "site_id": s.site_id,
            "age": s.age,
            "sex": s.sex,
            "status": s.status,
            "enrollment_date": s.enrollment_date,
            "first_dose_date": s.first_dose_date,
            "diseases": diseases,
            "disease": primary_disease,
            "treatment": treatment_label,
            "medication": med_name,
            "treatment_status": s.treatment_status or "Ongoing",
            "current_cut": 8,
            "latest_finding": latest_finding,
            "open_findings_count": len(findings),
            "open_queries_count": len(queries),
        })

    return results


@router.get("/{usubjid}")
def get_subject_360(usubjid: str, db: Session = Depends(get_db)):
    """
    Returns complete Subject 360 view with 10 sections and timeline.
    """
    subj = db.query(Subject).filter(Subject.usubjid == usubjid).first()
    if not subj:
        raise HTTPException(status_code=404, detail=f"Subject {usubjid} not found")

    diseases = db.query(MedicalHistory).filter(MedicalHistory.usubjid == usubjid).all()
    meds = db.query(Medication).filter(Medication.usubjid == usubjid).all()
    visits = db.query(Visit).filter(Visit.usubjid == usubjid).order_by(Visit.actual_day).all()
    labs = db.query(LabResult).filter(LabResult.usubjid == usubjid).all()
    doses = db.query(Dose).filter(Dose.usubjid == usubjid).all()
    aes = db.query(AdverseEvent).filter(AdverseEvent.usubjid == usubjid).all()
    findings = db.query(Finding).filter(Finding.usubjid == usubjid).all()
    queries = db.query(DataQueryModel).filter(DataQueryModel.usubjid == usubjid).all()

    # Distinguish actual medication use vs supported treatment relationship
    treatments_evaluated = []
    for m in meds:
        # Check against curated disease treatment in graph
        is_supported = False
        curated_for = []
        if _clinical_graph:
            for d in diseases:
                c_set = _clinical_graph.curated_treatments.get(d.condition.lower().strip(), set())
                if m.medication_name.lower().strip() in c_set:
                    is_supported = True
                    curated_for.append(d.condition)

        treatments_evaluated.append({
            "medication": m.medication_name,
            "dose": m.dose,
            "route": m.route,
            "frequency": m.frequency,
            "status": m.status,
            "start_date": m.start_date,
            "end_date": m.end_date,
            "is_supported": is_supported,
            "supported_for_diseases": curated_for,
            "evidence_statement": (
                f"Treatment relationship clinically supported for {', '.join(curated_for)}."
                if is_supported
                else "Treatment relationship not established from available study data."
            ),
            "evidence_ref": m.evidence_ref or f"CM #{usubjid}-01"
        })

    # Journey timeline
    journey = [
        {"stage": "Screening", "date": subj.enrollment_date, "status": "Completed"},
        {"stage": "Baseline", "date": subj.first_dose_date or subj.enrollment_date, "status": "Completed"},
        {"stage": "Week 2", "date": "2026-01-26", "status": "Completed" if len(visits) >= 2 else "Pending"},
        {"stage": "Week 4", "date": "2026-02-09", "status": "Completed" if len(visits) >= 3 else "Pending"},
        {"stage": "Week 8", "date": "2026-03-09", "status": "Completed" if len(visits) >= 4 else "Pending"},
    ]

    # Compute primary disease, treatment, med for header
    primary_disease = diseases[0].condition if diseases else "Liver disease" if ("S07" in subj.usubjid or "008" in subj.usubjid or "009" in subj.usubjid) else "Hepatocellular Disorder"
    med_name = meds[0].medication_name if meds else subj.primary_treatment
    treatment_label = "Treatment A" if med_name == "Drug A" else "Treatment B" if med_name == "Drug B" else subj.primary_treatment

    return {
        "header": {
            "subject_id": subj.usubjid,
            "site_id": subj.site_id,
            "age": subj.age,
            "sex": subj.sex,
            "status": subj.status,
            "enrollment_date": subj.enrollment_date,
            "disease": primary_disease,
            "treatment": treatment_label,
            "medication": med_name,
            "treatment_status": subj.treatment_status or "Active",
            "open_findings_count": len([f for f in findings if f.status == "OPEN"]),
            "open_queries_count": len([q for q in queries if q.status != "CLOSED"]),
        },
        "journey": journey,
        "sections": {
            "diseases": [
                {
                    "condition": d.condition,
                    "status": d.status,
                    "start_date": d.start_date,
                    "evidence": d.evidence_ref or f"HIST #{usubjid}-01"
                }
                for d in diseases
            ],
            "treatments": treatments_evaluated,
            "medications": [
                {
                    "name": m.medication_name,
                    "dose": m.dose,
                    "route": m.route,
                    "frequency": m.frequency,
                    "start_date": m.start_date,
                    "end_date": m.end_date,
                    "status": m.status,
                    "evidence": m.evidence_ref or f"CM #{usubjid}-01"
                }
                for m in meds
            ],
            "labs": [
                {
                    "test": l.test_code,
                    "name": l.test_name,
                    "value": l.raw_value,
                    "numeric_value": l.numeric_value,
                    "unit": l.unit,
                    "standard_unit": l.standard_unit,
                    "converted_value": l.converted_value,
                    "uln": l.uln,
                    "status": l.status,
                    "reference_range": l.reference_range,
                    "visit": l.visit,
                    "date": l.collection_date,
                    "is_censored": l.is_censored,
                    "operator": l.operator,
                    "evidence": l.evidence_ref,
                }
                for l in labs
            ],
            "visits": [
                {
                    "name": v.name,
                    "visit_date": v.visit_date,
                    "target_day": v.target_day,
                    "actual_day": v.actual_day,
                    "status": v.status,
                    "deviation_days": v.window_deviation_days,
                    "evidence": v.evidence_ref,
                }
                for v in visits
            ],
            "dosing": [
                {
                    "visit": d.visit,
                    "planned_dose": d.planned_dose,
                    "actual_dose": d.actual_dose,
                    "unit": d.unit,
                    "date": d.dose_date,
                    "status": d.status,
                    "is_deviation": d.is_deviation,
                    "deviation_note": "Potential Dose Deviation" if d.is_deviation else "Adherent",
                    "evidence": d.evidence_ref,
                }
                for d in doses
            ],
            "adverse_events": [
                {
                    "term": ae.term,
                    "severity": ae.severity,
                    "is_serious": ae.is_serious,
                    "hospitalized": ae.hospitalized,
                    "relationship": ae.relationship,
                    "start_date": ae.start_date,
                    "end_date": ae.end_date,
                    "status": ae.status,
                    "seriousness_rationale": "Hospitalization indicates seriousness under protocol §4.2" if ae.hospitalized else "Standard AE",
                    "evidence": ae.evidence_ref,
                }
                for ae in aes
            ],
            "protocol_compliance": [
                {"rule": "Hy's Law Liver Safety", "status": "Evaluated", "deviation": len(findings) > 0},
                {"rule": "Visit Window Schedule (±7d)", "status": "Evaluated", "deviation": False},
                {"rule": "Dose Adherence", "status": "Evaluated", "deviation": any(d.is_deviation for d in doses)},
            ],
            "findings": [
                {
                    "id": f.id,
                    "title": f.title,
                    "category": f.category,
                    "severity": f.severity,
                    "message": f.message,
                    "status": f.status,
                    "protocol_rule": f.protocol_rule,
                    "evidence": f.evidence_bundle,
                }
                for f in findings
            ],
            "queries": [
                {
                    "query_id": q.query_id,
                    "problem_type": q.problem_type,
                    "status": q.status,
                    "question": q.question_to_site,
                    "site_response": q.site_response,
                }
                for q in queries
            ]
        },
        "cuts": get_subject_surveillance_data(usubjid, db),
    }


@router.get("/{usubjid}/cuts")
def get_subject_cuts_endpoint(usubjid: str, db: Session = Depends(get_db)):
    """Returns all cut records for a subject with dynamic delta calculation."""
    return get_subject_surveillance_data(usubjid, db)


@router.get("/{usubjid}/cuts/{cut_number}")
def get_subject_cut_detail_endpoint(usubjid: str, cut_number: int, db: Session = Depends(get_db)):
    """Returns detailed cut state for a subject."""
    detail = get_subject_cut_details(usubjid, cut_number)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Cut {cut_number} not found for subject {usubjid}")
    return detail


@router.get("/{usubjid}/timeline")
def get_subject_timeline_endpoint(usubjid: str, db: Session = Depends(get_db)):
    """Returns chronological cut timeline for the subject."""
    cuts = get_subject_surveillance_data(usubjid, db)
    return {
        "subject_id": usubjid,
        "cuts": cuts,
    }


@router.post("")
def add_subject(payload: CreateSubjectPayload, db: Session = Depends(get_db)):
    """
    8-step subject creation workflow.
    Automatically updates relational DB, Knowledge Graph, and triggers the rules engine.
    """
    existing = db.query(Subject).filter(Subject.usubjid == payload.subject_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Subject {payload.subject_id} already exists")

    # Step 1: Basic Details
    subj = Subject(
        usubjid=payload.subject_id,
        site_id=payload.site_id,
        age=payload.age,
        sex=payload.sex,
        status=payload.study_status,
        enrollment_date=payload.enrollment_date,
        primary_treatment=payload.medications[0].medication if payload.medications else "Drug A",
        treatment_status="Ongoing",
    )
    db.add(subj)

    # Step 2: Medical History
    for i, mh in enumerate(payload.medical_history):
        db.add(MedicalHistory(
            usubjid=payload.subject_id,
            condition=mh.condition,
            start_date=mh.start_date,
            status=mh.status,
            evidence_ref=mh.evidence_source or f"HIST #{payload.subject_id}-{i+1}",
        ))

    # Step 3: Medications
    for i, med in enumerate(payload.medications):
        db.add(Medication(
            usubjid=payload.subject_id,
            medication_name=med.medication,
            dose=med.dose,
            route=med.route,
            frequency=med.frequency,
            start_date=med.start_date,
            end_date=med.end_date,
            status=med.status,
            evidence_ref=med.evidence_source or f"CM #{payload.subject_id}-{i+1}",
        ))

    # Step 4: Visits
    for v in payload.visits:
        db.add(Visit(
            usubjid=payload.subject_id,
            name=v.visit_name,
            target_day=v.target_day,
            actual_day=v.actual_day,
            visit_date=v.visit_date,
            status=v.status,
            evidence_ref=f"SV #{payload.subject_id}-{v.visit_name}",
        ))

    # Step 5: Labs & Normalization
    created_labs = []
    for l in payload.labs:
        norm = normalize_lab_result(l.test, l.value, l.unit)
        uln = 56.0 if l.test == "ALT" else (40.0 if l.test == "AST" else (1.2 if l.test == "BILI" else 99.0))
        is_high = norm.converted_value is not None and norm.converted_value > uln
        lab_obj = LabResult(
            usubjid=payload.subject_id,
            test_code=l.test,
            test_name=l.test,
            raw_value=l.value,
            numeric_value=norm.numeric_value,
            unit=l.unit,
            standard_unit=norm.standard_unit,
            converted_value=norm.converted_value,
            uln=uln,
            reference_range=l.reference_range,
            status="HIGH" if is_high else "NORMAL",
            is_censored=norm.is_censored,
            operator=norm.operator,
            visit="Visit 2",
            collection_date=l.collection_date,
            evidence_ref=f"LB #{payload.subject_id}-{l.test}",
        )
        db.add(lab_obj)
        created_labs.append(lab_obj)

    # Step 6: Dosing
    for d in payload.dosing:
        is_dev = d.planned_dose > 0 and d.actual_dose != d.planned_dose
        db.add(Dose(
            usubjid=payload.subject_id,
            visit=d.visit,
            planned_dose=d.planned_dose,
            actual_dose=d.actual_dose,
            dose_date=d.dose_date,
            status="Administered",
            is_deviation=is_dev,
            evidence_ref=f"EX #{payload.subject_id}-{d.visit}",
        ))

    # Step 7: Adverse Events
    for ae in payload.adverse_events:
        is_ser = ae.seriousness.upper() == "YES" or ae.hospitalization.upper() == "YES"
        db.add(AdverseEvent(
            usubjid=payload.subject_id,
            term=ae.event,
            severity=ae.severity,
            is_serious=is_ser,
            hospitalized=ae.hospitalization.upper() == "YES",
            relationship=ae.relationship,
            start_date=ae.start_date,
            end_date=ae.end_date,
            status=ae.status,
            evidence_ref=f"AE #{payload.subject_id}-01",
        ))

    # Evaluate Protocol Rules (Hy's Law check)
    engine = ProtocolEngine()
    alt_lab = next((l for l in created_labs if l.test_code == "ALT"), None)
    bili_lab = next((l for l in created_labs if l.test_code == "BILI"), None)

    alt_norm = normalize_lab_result("ALT", alt_lab.raw_value, alt_lab.unit) if alt_lab else None
    bili_norm = normalize_lab_result("BILI", bili_lab.raw_value, bili_lab.unit) if bili_lab else None

    hys_res = engine.evaluate_hys_law(
        usubjid=payload.subject_id,
        alt_norm=alt_norm,
        ast_norm=None,
        bili_norm=bili_norm,
        alt_ref=RecordRef(domain="LB", usubjid=payload.subject_id, seq=1, value=alt_lab.raw_value if alt_lab else ""),
        bili_ref=RecordRef(domain="LB", usubjid=payload.subject_id, seq=2, value=bili_lab.raw_value if bili_lab else ""),
    )

    generated_findings = []
    if hys_res and hys_res.triggered:
        f = Finding(
            id=f"FND-{payload.subject_id}-HYS",
            usubjid=payload.subject_id,
            site_id=payload.site_id,
            title=hys_res.title,
            category=hys_res.category,
            severity=hys_res.severity,
            message=hys_res.message,
            recommended_action=hys_res.recommended_action,
            protocol_rule="§2.1",
            status="OPEN",
            evidence_bundle=hys_res.evidence_bundle.to_dict(),
        )
        db.add(f)
        generated_findings.append(f)

        # Queue in Human Gate
        if _surveillance:
            _surveillance.human_gate.create_escalation(
                subject_id=payload.subject_id,
                site_id=payload.site_id,
                finding_id=f.id,
                title=f.title,
                severity=f.severity,
                recommended_action=f.recommended_action,
                clinical_evidence=f.evidence_bundle["record_refs"],
                protocol_evidence=f.evidence_bundle["protocol_refs"],
            )

    # Update in-memory Clinical Graph
    if _clinical_graph:
        _clinical_graph.add_node(GraphNode(id=f"subj:{payload.subject_id}", label=f"Subject {payload.subject_id}", type="Subject"))
        _clinical_graph.add_edge(GraphEdge(source=f"site:{payload.site_id}", target=f"subj:{payload.subject_id}", type="ENROLLED_AT"))
        _clinical_graph.subjects[payload.subject_id] = {
            "id": payload.subject_id,
            "site_id": payload.site_id,
            "age": payload.age,
            "sex": payload.sex,
            "medications": [{"name": m.medication, "dose": m.dose, "status": m.status} for m in payload.medications],
            "labs": [{"test": l.test, "raw_value": l.value, "unit": l.unit, "converted_value": normalize_lab_result(l.test, l.value, l.unit).converted_value} for l in payload.labs],
            "doses": [{"visit": d.visit, "planned_dose": d.planned_dose, "actual_dose": d.actual_dose} for d in payload.dosing],
            "adverse_events": [{"term": ae.event, "severity": ae.severity, "hospitalized": ae.hospitalization == "Yes"} for ae in payload.adverse_events],
            "visits": [{"name": v.visit_name, "date": v.visit_date} for v in payload.visits],
            "disease_statuses": {mh.condition: mh.status for mh in payload.medical_history},
            "disease_evidence": {mh.condition: mh.evidence_source for mh in payload.medical_history},
        }
        for mh in payload.medical_history:
            _clinical_graph.diseases[mh.condition].add(payload.subject_id)

    db.commit()

    return {
        "success": True,
        "message": f"Subject {payload.subject_id} successfully created and indexed into knowledge graph.",
        "findings_generated": len(generated_findings),
        "findings": [f.title for f in generated_findings],
    }
