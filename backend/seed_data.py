"""
Clinical Trial Data Seeder for Study ABC-101
Populates database and in-memory knowledge graph with realistic CDISC SDTM records.
Fulfills all prompt scenarios:
- 8 Subjects matching Liver disease (Drug A: 5, Drug B: 2, Other: 1)
- Unit anomalies (ukat/L to U/L, S04 glucose step change 118 -> 6.4)
- Censored values (<5 copies/mL, ND, comma decimals '12,4')
- Dose deviation
- SAE with Hospitalization
- 12 cuts timeline & pending decisions
"""

from datetime import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal, init_db
from .models.db_models import (
    Study, Site, Subject, MedicalHistory, Medication, Visit, LabResult, Dose,
    AdverseEvent, Finding, DataQueryModel, HumanEscalationModel, DecisionTraceModel, Protocol
)
from .stage1.graph import ClinicalGraph, GraphNode, GraphEdge
from .stage1.normalization import normalize_lab_result
from .stage1.evidence import RecordRef, ProtocolRef
from .stage2.data_manager import ClinicalDataQuery
from .stage3.watch import WatchSurveillance


def populate_all(graph: ClinicalGraph, surveillance: WatchSurveillance):
    from .database import Base, engine
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding Study ABC-101 and Clinical Trial Records...")

    # 1. Study
    study = Study(
        study_id="ABC-101",
        protocol_name="A Multicenter, Double-Blind Phase II Trial of Experimental Hepatoprotective Agent",
        phase="Phase II",
        status="ACTIVE",
        current_cut=8,
        total_cuts=12,
        current_protocol_version="v1.0"
    )
    db.add(study)

    # 2. Protocol Versions
    p1 = Protocol(
        protocol_id="ABC-101",
        version="v1.0",
        effective_date="2026-01-01",
        title="Protocol ABC-101 Revision 1.0",
        content="Primary safety rules: Hy's Law (ALT > 3x ULN, BILI > 2x ULN). Allowable visit window ±7 days.",
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        is_active=True
    )
    p2 = Protocol(
        protocol_id="ABC-101",
        version="v2.0",
        effective_date="2026-06-01",
        title="Protocol ABC-101 Amendment 2.0",
        content="Tightened visit schedule window from ±7 days to ±3 days.",
        sha256_hash="a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
        is_active=False
    )
    db.add_all([p1, p2])

    # 3. Sites
    sites_data = [
        ("S01", "SITE-101", "Memorial Oncology Center", "Dr. Robert Vance"),
        ("S02", "SITE-102", "St. Jude Clinical Research", "Dr. Elena Rostova"),
        ("S03", "SITE-103", "Pacific Liver Institute", "Dr. Alan Grant"),
        ("S04", "SITE-104", "Metro Valley Hospital", "Dr. Marcus Brody"),
        ("S05", "SITE-105", "Bay Area Medical Center", "Dr. Sarah Lin"),
        ("S07", "SITE-107", "University Hepatology Clinic", "Dr. James Miller"),
        ("S08", "SITE-108", "Midwest General Hospital", "Dr. Karen White"),
        ("S11", "SITE-111", "Highland Health Sciences", "Dr. Thomas Clark"),
        ("S12", "SITE-112", "Lakeside Clinical Center", "Dr. Emily Davis"),
    ]
    for short_s, s_id, s_name, pi in sites_data:
        site_obj = Site(site_id=s_id, name=f"{s_name} ({short_s})", pi_name=pi, status="ACTIVE")
        db.add(site_obj)
        graph.add_node(GraphNode(id=f"site:{s_id}", label=f"Site {short_s}", type="Site", properties={"name": s_name, "pi": pi}))
        graph.add_edge(GraphEdge(source="study:ABC-101", target=f"site:{s_id}", type="HAS_SITE"))

    # Register Curated Treatments for Liver Disease
    # Drug A and Drug B are evaluated in the study; standard care is observed
    graph.register_curated_treatment("Liver disease", "Drug A")
    graph.register_curated_treatment("Liver disease", "Drug B")

    # 4. Subjects Data Setup
    # 8 Subjects specifically with Liver Disease:
    # 042-S07-001 (Drug A), 042-S07-002 (Drug A), 042-S02-004 (Drug B), 042-S11-005 (Drug A),
    # 042-S01-003 (Drug A), 042-S03-009 (Drug A), 042-S05-012 (Drug B), 042-S08-015 (Standard Care / Other)
    subjects_seed = [
        {
            "id": "042-S07-001", "site_id": "SITE-107", "age": 54, "sex": "M", "status": "Active",
            "enrollment_date": "2026-01-10", "first_dose_date": "2026-01-12", "treatment": "Drug A",
            "diseases": [("Liver disease", "2025-06-10", "Ongoing", "HIST #042-S07-001-01"), ("Diabetes", "2024-02-15", "Ongoing", "HIST #042-S07-001-02")],
            "meds": [("Drug A", "50 mg", "Oral", "Once daily", "2026-01-12", None, "Ongoing", "CM #042-S07-001-01"), ("Metformin", "500 mg", "Oral", "Twice daily", "2024-03-01", None, "Ongoing", "CM #042-S07-001-02")],
            "labs": [
                ("ALT", "3.995", "ukat/L", "7-56", "Screening", "2026-01-10"),  # Converted: ~239.7 U/L!
                ("BILI", "2.1", "mg/dL", "0.2-1.2", "Screening", "2026-01-10"),
                ("ALT", "145", "U/L", "7-56", "Visit 2", "2026-01-26"),
                ("BILI", "2.1", "mg/dL", "0.2-1.2", "Visit 2", "2026-01-26"),
                ("CREAT", "0,9", "mg/dL", "0.6-1.2", "Visit 2", "2026-01-26"),
            ],
            "doses": [("Screening", 0, 0, "2026-01-10"), ("Visit 2", 50, 50, "2026-01-26")],
            "aes": [("Fatigue", "Moderate", False, False, "Possible", "2026-01-28", None, "Ongoing")],
            "visits": [("Screening", -14, -14, "2026-01-10", "Completed"), ("Baseline", 1, 1, "2026-01-12", "Completed"), ("Visit 2", 14, 14, "2026-01-26", "Completed")],
        },
        {
            "id": "042-S07-002", "site_id": "SITE-107", "age": 48, "sex": "F", "status": "Active",
            "enrollment_date": "2026-01-12", "first_dose_date": "2026-01-14", "treatment": "Drug A",
            "diseases": [("Liver disease", "2025-08-01", "Ongoing", "HIST #042-S07-002-01")],
            "meds": [("Drug A", "50 mg", "Oral", "Once daily", "2026-01-14", None, "Ongoing", "CM #042-S07-002-01")],
            "labs": [
                ("ALT", "28", "U/L", "7-56", "Screening", "2026-01-12"),
                ("BILI", "0.8", "mg/dL", "0.2-1.2", "Screening", "2026-01-12"),
                ("ALT", "185", "U/L", "7-56", "Visit 2", "2026-01-26"),
                ("AST", "162", "U/L", "10-40", "Visit 2", "2026-01-26"),
                ("BILI", "3,1", "mg/dL", "0.2-1.2", "Visit 2", "2026-01-26"),
                ("ALT", "220", "U/L", "7-56", "Visit 3", "2026-02-09"),
                ("BILI", "3.8", "mg/dL", "0.2-1.2", "Visit 3", "2026-02-09"),
            ],
            "doses": [("Screening", 0, 0, "2026-01-12"), ("Visit 2", 50, 50, "2026-01-26"), ("Visit 3", 50, 50, "2026-02-09")],
            "aes": [("Jaundice", "Severe", True, True, "Probable", "2026-02-08", None, "Ongoing")],
            "visits": [("Screening", -14, -14, "2026-01-12", "Completed"), ("Visit 2", 14, 14, "2026-01-26", "Completed"), ("Visit 3", 28, 28, "2026-02-09", "Completed")],
        },
        {
            "id": "042-S02-004", "site_id": "SITE-102", "age": 39, "sex": "F", "status": "Completed",
            "enrollment_date": "2026-01-20", "first_dose_date": "2026-01-22", "treatment": "Drug B",
            "diseases": [("Liver disease", "2025-05-18", "Resolved", "HIST #042-S02-004-01")],
            "meds": [("Drug B", "25 mg", "Oral", "Once daily", "2026-01-22", "2026-04-20", "Completed", "CM #042-S02-004-01")],
            "labs": [
                ("VL", "<5", "copies/mL", "<5", "Screening", "2026-01-20"),
                ("TROP", "ND", "ng/mL", "<0.04", "Screening", "2026-01-20"),
                ("ALT", "18", "U/L", "7-56", "Screening", "2026-01-20"),
                ("ALT", "22", "U/L", "7-56", "Visit 2", "2026-02-05"),
            ],
            "doses": [("Visit 2", 25, 25, "2026-02-05")],
            "aes": [],
            "visits": [("Screening", -14, -14, "2026-01-20", "Completed"), ("Visit 2", 14, 16, "2026-02-05", "Completed")],
        },
        {
            "id": "042-S11-005", "site_id": "SITE-111", "age": 62, "sex": "M", "status": "Active",
            "enrollment_date": "2026-01-25", "first_dose_date": "2026-01-27", "treatment": "Drug A",
            "diseases": [("Liver disease", "2025-09-12", "Ongoing", "HIST #042-S11-005-01")],
            "meds": [("Drug A", "50 mg", "Oral", "Once daily", "2026-01-27", None, "Ongoing", "CM #042-S11-005-01")],
            "labs": [("ALT", "42", "U/L", "7-56", "Screening", "2026-01-25"), ("BILI", "0.9", "mg/dL", "0.2-1.2", "Screening", "2026-01-25")],
            "doses": [("Visit 2", 50, 50, "2026-02-10")],
            "aes": [("Headache", "Mild", False, False, "Unlikely", "2026-02-11", "2026-02-13", "Resolved")],
            "visits": [("Screening", -14, -14, "2026-01-25", "Completed"), ("Visit 2", 14, 16, "2026-02-10", "Completed")],
        },
        {
            "id": "042-S01-003", "site_id": "SITE-101", "age": 58, "sex": "F", "status": "Active",
            "enrollment_date": "2026-02-01", "first_dose_date": "2026-02-03", "treatment": "Drug A",
            "diseases": [("Liver disease", "2025-11-05", "Ongoing", "HIST #042-S01-003-01"), ("Hypertension", "2023-01-10", "Ongoing", "HIST #042-S01-003-02")],
            "meds": [("Drug A", "50 mg", "Oral", "Once daily", "2026-02-03", None, "Ongoing", "CM #042-S01-003-01"), ("Lisinopril", "10 mg", "Oral", "Once daily", "2023-02-01", None, "Ongoing", "CM #042-S01-003-02")],
            "labs": [("ALT", "35", "U/L", "7-56", "Screening", "2026-02-01")],
            "doses": [("Visit 2", 50, 25, "2026-02-17")],  # Potential dose deviation: planned 50 vs actual 25
            "aes": [],
            "visits": [("Screening", -14, -14, "2026-02-01", "Completed"), ("Visit 2", 14, 16, "2026-02-17", "Completed")],
        },
        {
            "id": "042-S03-009", "site_id": "SITE-103", "age": 67, "sex": "M", "status": "Active",
            "enrollment_date": "2026-02-10", "first_dose_date": "2026-02-12", "treatment": "Drug A",
            "diseases": [("Liver disease", "2025-07-20", "Ongoing", "HIST #042-S03-009-01")],
            "meds": [("Drug A", "50 mg", "Oral", "Once daily", "2026-02-12", None, "Ongoing", "CM #042-S03-009-01")],
            "labs": [("ALT", "48", "U/L", "7-56", "Screening", "2026-02-10")],
            "doses": [("Visit 2", 50, 50, "2026-02-26")],
            "aes": [],
            "visits": [("Screening", -14, -14, "2026-02-10", "Completed")],
        },
        {
            "id": "042-S05-012", "site_id": "SITE-105", "age": 51, "sex": "F", "status": "Completed",
            "enrollment_date": "2026-02-15", "first_dose_date": "2026-02-17", "treatment": "Drug B",
            "diseases": [("Liver disease", "2025-04-14", "Resolved", "HIST #042-S05-012-01")],
            "meds": [("Drug B", "25 mg", "Oral", "Once daily", "2026-02-17", "2026-05-17", "Completed", "CM #042-S05-012-01")],
            "labs": [("ALT", "26", "U/L", "7-56", "Screening", "2026-02-15")],
            "doses": [("Visit 2", 25, 25, "2026-03-03")],
            "aes": [],
            "visits": [("Screening", -14, -14, "2026-02-15", "Completed")],
        },
        {
            "id": "042-S08-015", "site_id": "SITE-108", "age": 70, "sex": "M", "status": "Active",
            "enrollment_date": "2026-02-20", "first_dose_date": "2026-02-22", "treatment": "Standard Care",
            "diseases": [("Liver disease", "2025-03-10", "Ongoing", "HIST #042-S08-015-01")],
            "meds": [("Standard Care", "N/A", "Oral", "As directed", "2026-02-22", None, "Ongoing", "CM #042-S08-015-01")],
            "labs": [("ALT", "31", "U/L", "7-56", "Screening", "2026-02-20")],
            "doses": [("Visit 2", 0, 0, "2026-03-06")],
            "aes": [],
            "visits": [("Screening", -14, -14, "2026-02-20", "Completed")],
        },
        # Site S04 cohort with Glucose Unit Anomaly (Median 118 -> 6.4)
        {
            "id": "042-S04-001", "site_id": "SITE-104", "age": 55, "sex": "M", "status": "Active",
            "enrollment_date": "2026-03-01", "first_dose_date": "2026-03-03", "treatment": "Drug A",
            "diseases": [("Diabetes", "2023-05-10", "Ongoing", "HIST #042-S04-001-01")],
            "meds": [("Drug A", "50 mg", "Oral", "Once daily", "2026-03-03", None, "Ongoing", "CM #042-S04-001-01")],
            "labs": [("GLUC", "6.4", "mmol/L", "70-99", "Visit 2", "2026-03-17"), ("ALT", "29", "U/L", "7-56", "Visit 2", "2026-03-17")],
            "doses": [("Visit 2", 50, 50, "2026-03-17")],
            "aes": [],
            "visits": [("Screening", -14, -14, "2026-03-01", "Completed"), ("Visit 2", 14, 14, "2026-03-17", "Completed")],
        },
        {
            "id": "042-S04-002", "site_id": "SITE-104", "age": 49, "sex": "F", "status": "Active",
            "enrollment_date": "2026-03-01", "first_dose_date": "2026-03-03", "treatment": "Drug A",
            "diseases": [("Diabetes", "2024-01-15", "Ongoing", "HIST #042-S04-002-01")],
            "meds": [("Drug A", "50 mg", "Oral", "Once daily", "2026-03-03", None, "Ongoing", "CM #042-S04-002-01")],
            "labs": [("GLUC", "6.2", "mmol/L", "70-99", "Visit 2", "2026-03-17")],
            "doses": [("Visit 2", 50, 50, "2026-03-17")],
            "aes": [],
            "visits": [("Screening", -14, -14, "2026-03-01", "Completed")],
        },
        {
            "id": "042-S04-003", "site_id": "SITE-104", "age": 61, "sex": "M", "status": "Active",
            "enrollment_date": "2026-03-02", "first_dose_date": "2026-03-04", "treatment": "Drug A",
            "diseases": [("Diabetes", "2022-08-20", "Ongoing", "HIST #042-S04-003-01")],
            "meds": [("Drug A", "50 mg", "Oral", "Once daily", "2026-03-04", None, "Ongoing", "CM #042-S04-003-01")],
            "labs": [("GLUC", "6.5", "mmol/L", "70-99", "Visit 2", "2026-03-18")],
            "doses": [("Visit 2", 50, 50, "2026-03-18")],
            "aes": [],
            "visits": [("Screening", -14, -14, "2026-03-02", "Completed")],
        },
    ]

    # Ingest into DB & Clinical Graph
    for s_dict in subjects_seed:
        sid = s_dict["id"]
        site_id = s_dict["site_id"]
        subj_obj = Subject(
            usubjid=sid,
            site_id=site_id,
            age=s_dict["age"],
            sex=s_dict["sex"],
            status=s_dict["status"],
            enrollment_date=s_dict["enrollment_date"],
            first_dose_date=s_dict.get("first_dose_date"),
            primary_treatment=s_dict["treatment"],
            treatment_status="Ongoing" if s_dict["status"] == "Active" else "Completed",
        )
        db.add(subj_obj)

        # Graph node
        graph.add_node(GraphNode(id=f"subj:{sid}", label=f"Subject {sid}", type="Subject", properties=s_dict))
        graph.add_edge(GraphEdge(source=f"site:{site_id}", target=f"subj:{sid}", type="ENROLLED_AT"))

        # Setup graph subjects entry
        graph.subjects[sid] = {
            "id": sid,
            "subject_id": sid,
            "site_id": site_id,
            "age": s_dict["age"],
            "sex": s_dict["sex"],
            "status": s_dict["status"],
            "first_dose_date": s_dict.get("first_dose_date"),
            "medications": [],
            "doses": [],
            "labs": [],
            "adverse_events": [],
            "visits": [],
            "disease_statuses": {},
            "disease_evidence": {},
        }

        # Medical History / Diseases
        for cond, s_date, st, ev_ref in s_dict["diseases"]:
            db.add(MedicalHistory(usubjid=sid, condition=cond, start_date=s_date, status=st, evidence_ref=ev_ref))
            graph.diseases[cond].add(sid)
            graph.subjects[sid]["disease_statuses"][cond] = st
            graph.subjects[sid]["disease_evidence"][cond] = ev_ref
            graph.add_node(GraphNode(id=f"dis:{cond}", label=cond, type="Disease"))
            graph.add_edge(GraphEdge(source=f"subj:{sid}", target=f"dis:{cond}", type="HAS_DISEASE"))

        # Medications
        for m_name, m_dose, m_rt, m_frq, m_sdt, m_edt, m_st, ev_ref in s_dict["meds"]:
            db.add(Medication(usubjid=sid, medication_name=m_name, dose=m_dose, route=m_rt, frequency=m_frq, start_date=m_sdt, end_date=m_edt, status=m_st, evidence_ref=ev_ref))
            graph.medications[m_name].add(sid)
            med_entry = {
                "name": m_name, "dose": m_dose, "route": m_rt, "frequency": m_frq,
                "start_date": m_sdt, "end_date": m_edt, "status": m_st, "evidence_ref": ev_ref,
            }
            graph.subjects[sid]["medications"].append(med_entry)
            graph.add_node(GraphNode(id=f"med:{m_name}", label=m_name, type="Medication"))
            graph.add_edge(GraphEdge(source=f"subj:{sid}", target=f"med:{m_name}", type="TAKES_MEDICATION"))

        # Visits
        for v_name, v_tgt, v_act, v_dt, v_st in s_dict["visits"]:
            db.add(Visit(usubjid=sid, name=v_name, target_day=v_tgt, actual_day=v_act, visit_date=v_dt, status=v_st, evidence_ref=f"SV #{sid}-{v_name}"))
            graph.subjects[sid]["visits"].append({"name": v_name, "target_day": v_tgt, "actual_day": v_act, "date": v_dt, "status": v_st})
            graph.add_node(GraphNode(id=f"vis:{sid}:{v_name}", label=f"{v_name} ({v_dt})", type="Visit"))
            graph.add_edge(GraphEdge(source=f"subj:{sid}", target=f"vis:{sid}:{v_name}", type="HAS_VISIT"))

        # Labs
        for t_cd, raw_v, unit, ref_rng, vis, dt in s_dict["labs"]:
            norm = normalize_lab_result(t_cd, raw_v, unit)
            uln_val = 56.0 if t_cd == "ALT" else (40.0 if t_cd == "AST" else (1.2 if t_cd == "BILI" else 99.0))
            is_high = norm.converted_value is not None and norm.converted_value > uln_val
            lab_st = "HIGH" if is_high else "NORMAL"

            db.add(LabResult(
                usubjid=sid, test_code=t_cd, test_name=t_cd, raw_value=str(raw_v),
                numeric_value=norm.numeric_value, unit=unit, standard_unit=norm.standard_unit,
                converted_value=norm.converted_value, uln=uln_val, reference_range=ref_rng,
                status=lab_st, is_censored=norm.is_censored, operator=norm.operator,
                visit=vis, collection_date=dt, evidence_ref=f"LB #{sid}-{t_cd}",
            ))
            lab_entry = {
                "test": t_cd, "raw_value": str(raw_v), "numeric_value": norm.numeric_value,
                "unit": unit, "converted_value": norm.converted_value, "standard_unit": norm.standard_unit,
                "uln": uln_val, "status": lab_st, "visit": vis, "date": dt,
                "normalized": norm, "evidence_ref": f"LB #{sid}-{t_cd}",
            }
            graph.subjects[sid]["labs"].append(lab_entry)
            graph.add_node(GraphNode(id=f"lab:{sid}:{t_cd}:{vis}", label=f"{t_cd} {norm.display_str()}", type="Lab"))
            graph.add_edge(GraphEdge(source=f"vis:{sid}:{vis}", target=f"lab:{sid}:{t_cd}:{vis}", type="HAS_LAB"))

        # Doses
        for vis, pln, act, d_dt in s_dict["doses"]:
            is_dev = pln > 0 and act != pln
            db.add(Dose(usubjid=sid, visit=vis, planned_dose=pln, actual_dose=act, dose_date=d_dt, is_deviation=is_dev, evidence_ref=f"EX #{sid}-{vis}"))
            graph.subjects[sid]["doses"].append({"visit": vis, "planned_dose": pln, "actual_dose": act, "date": d_dt, "is_deviation": is_dev})
            graph.add_node(GraphNode(id=f"dose:{sid}:{vis}", label=f"Dose: {act}mg (Plan {pln}mg)", type="Dose"))
            graph.add_edge(GraphEdge(source=f"vis:{sid}:{vis}", target=f"dose:{sid}:{vis}", type="HAS_DOSE"))

        # Adverse Events
        for term, sev, is_ser, hosp, rel, s_dt, e_dt, st in s_dict["aes"]:
            db.add(AdverseEvent(
                usubjid=sid, term=term, severity=sev, is_serious=is_ser, hospitalized=hosp,
                relationship=rel, start_date=s_dt, end_date=e_dt, status=st, evidence_ref=f"AE #{sid}-01",
            ))
            ae_entry = {
                "term": term, "severity": sev, "is_serious": is_ser, "hospitalized": hosp,
                "relationship": rel, "start_date": s_dt, "end_date": e_dt, "status": st, "evidence_ref": f"AE #{sid}-01",
            }
            graph.subjects[sid]["adverse_events"].append(ae_entry)
            graph.add_node(GraphNode(id=f"ae:{sid}:{term}", label=f"AE: {term} ({sev})", type="AdverseEvent"))
            graph.add_edge(GraphEdge(source=f"subj:{sid}", target=f"ae:{sid}:{term}", type="EXPERIENCED_AE"))

    # 5. Seed Findings & Human Escalation
    f1 = Finding(
        id="FND-042-S07-002-HYS",
        usubjid="042-S07-002",
        site_id="SITE-107",
        title="Potential Drug-Induced Liver Injury (Hy's Law Candidate)",
        category="SAFETY",
        severity="CRITICAL",
        message="ALT 220 U/L (>3x ULN of 56 U/L) and Total Bilirubin 3.8 mg/dL (>2x ULN of 1.2 mg/dL) confirmed across Visits 2 and 3.",
        recommended_action="Immediate study drug interruption; urgent Medical Review and Hepatology consultation.",
        protocol_rule="§2.1",
        status="OPEN",
        evidence_bundle={
            "record_refs": [
                {"summary": "LB #042-S07-002-6: ALT 220 U/L (Visit 3, 2026-02-09)", "domain": "LB"},
                {"summary": "LB #042-S07-002-7: Total Bilirubin 3.8 mg/dL (Visit 3, 2026-02-09)", "domain": "LB"},
            ],
            "protocol_refs": [
                {"section": "§2.1", "title": "Hy's Law (DILI) Stopping Criteria", "protocol_id": "ABC-101"}
            ]
        }
    )
    db.add(f1)
    graph.findings_by_subject["042-S07-002"].append(f1.__dict__)

    # Escalation in Human Gate
    esc1 = HumanEscalationModel(
        escalation_id="ESC-042-S07-002",
        usubjid="042-S07-002",
        site_id="SITE-107",
        finding_id="FND-042-S07-002-HYS",
        title="Potential Drug-Induced Liver Injury (Hy's Law Candidate)",
        severity="CRITICAL",
        status="PENDING",
        recommended_action="Immediate study drug interruption and hepatology consult.",
        clinical_evidence=[
            {"summary": "LB #042-S07-002-6: ALT 220 U/L (Visit 3, 2026-02-09)", "domain": "LB"},
            {"summary": "LB #042-S07-002-7: Total Bilirubin 3.8 mg/dL (Visit 3, 2026-02-09)", "domain": "LB"},
            {"summary": "AE #042-S07-002-01: Jaundice (Severe, Hospitalized: Yes)", "domain": "AE"},
        ],
        protocol_evidence=[
            {"section": "§2.1", "title": "Hy's Law Stopping Criteria", "protocol_id": "ABC-101"}
        ],
        cuts_waiting=0
    )
    db.add(esc1)
    # Also register in in-memory human gate
    surveillance.human_gate.create_escalation(
        subject_id="042-S07-002",
        site_id="SITE-107",
        finding_id="FND-042-S07-002-HYS",
        title="Potential Drug-Induced Liver Injury (Hy's Law Candidate)",
        severity="CRITICAL",
        recommended_action="Immediate study drug interruption and hepatology consult.",
        clinical_evidence=esc1.clinical_evidence,
        protocol_evidence=esc1.protocol_evidence,
    )

    # Escalation 2: Pending decision waiting multiple cuts (enforcing standing limits!)
    esc2 = HumanEscalationModel(
        escalation_id="ESC-042-S01-003",
        usubjid="042-S01-003",
        site_id="SITE-101",
        finding_id="FND-042-S01-003-DOSE",
        title="Unconfirmed Dose Modification under Protocol §3.0",
        severity="MEDIUM",
        status="PENDING",
        recommended_action="Audit dispensing log and maintain 25mg dose reduction under standing safety limits.",
        clinical_evidence=[
            {"summary": "EX #042-S01-003-Visit 2: Planned 50mg vs Actual 25mg", "domain": "EX"}
        ],
        protocol_evidence=[
            {"section": "§3.0", "title": "Investigational Product Dosing Compliance", "protocol_id": "ABC-101"}
        ],
        cuts_waiting=4  # 4 cuts waiting!
    )
    db.add(esc2)
    e2 = surveillance.human_gate.create_escalation(
        subject_id="042-S01-003",
        site_id="SITE-101",
        finding_id="FND-042-S01-003-DOSE",
        title="Unconfirmed Dose Modification under Protocol §3.0",
        severity="MEDIUM",
        recommended_action="Audit dispensing log and maintain 25mg dose reduction under standing safety limits.",
        clinical_evidence=esc2.clinical_evidence,
        protocol_evidence=esc2.protocol_evidence,
    )
    if e2:
        e2.cuts_waiting = 4

    # 6. Data Queries
    q1 = DataQueryModel(
        query_id="QRY-101-01",
        usubjid="042-S07-001",
        site_id="SITE-107",
        problem_type="UNIT_MISMATCH",
        record_ref="LB #042-S07-001-ALT",
        question_to_site="Screening ALT reported as 3.995 ukat/L. System converted to 239.7 U/L. Please confirm reference standard.",
        status="CLOSED",
        site_response="Confirmed international SI unit ukat/L reported by central lab; conversion factor 60.0 verified.",
        dm_review_notes="Unit conversion verified against lab manual §4. Query resolved.",
    )
    q2 = DataQueryModel(
        query_id="QRY-104-01",
        usubjid="042-S04-001",
        site_id="SITE-104",
        problem_type="UNIT_STEP_CHANGE",
        record_ref="LB #042-S04-001-GLUC",
        question_to_site="Site glucose values shifted from median 118 to 6.4. Observed ratio matches mmol/L. Please reissue panel.",
        status="OPEN",
        site_response=None,
        dm_review_notes=None,
    )
    db.add_all([q1, q2])

    # Ingest into DataManager
    surveillance.data_manager.queries["QRY-101-01"] = ClinicalDataQuery(
        query_id="QRY-101-01",
        problem_type="UNIT_MISMATCH",
        subject_id="042-S07-001",
        site_id="SITE-107",
        record_ref="LB #042-S07-001-ALT",
        question_to_site="Screening ALT reported as 3.995 ukat/L. System converted to 239.7 U/L. Please confirm reference standard.",
        status="CLOSED",
        site_response="Confirmed international SI unit ukat/L reported by central lab; conversion factor 60.0 verified.",
        dm_review_notes="Unit conversion verified against lab manual §4. Query resolved.",
    )
    surveillance.data_manager.queries["QRY-104-01"] = ClinicalDataQuery(
        query_id="QRY-104-01",
        problem_type="UNIT_STEP_CHANGE",
        subject_id="042-S04-001",
        site_id="SITE-104",
        record_ref="LB #042-S04-001-GLUC",
        question_to_site="Site glucose values shifted from median 118 to 6.4. Observed ratio matches mmol/L. Please reissue panel.",
        status="OPEN",
        site_response=None,
        dm_review_notes=None,
    )

    # 7. Check Site S04 Glucose Anomaly
    s04_glucose_vals = [6.4, 6.2, 6.5, 6.3, 6.6]
    surveillance.adversarial.check_site_glucose_shift("SITE-104", s04_glucose_vals, baseline_median=118.0)

    # 8. Decision Traces
    t1 = DecisionTraceModel(
        id="TRC-001",
        node="DETECT",
        decision="FINDINGS_DETECTED",
        subject_id="042-S07-002",
        finding_id="FND-042-S07-002-HYS",
        protocol_version="v1.0",
        evidence_refs=[{"summary": "LB #042-S07-002-ALT: 220 U/L", "domain": "LB"}],
        actor="DETECTION_AGENT",
        notes="Hy's Law candidate detected: concurrent ALT and Bilirubin elevation.",
    )
    t2 = DecisionTraceModel(
        id="TRC-002",
        node="MEDICAL_REVIEW",
        decision="ESCALATE_TO_HUMAN_GATE",
        subject_id="042-S07-002",
        finding_id="FND-042-S07-002-HYS",
        protocol_version="v1.0",
        evidence_refs=[{"summary": "LB #042-S07-002-ALT: 220 U/L", "domain": "LB"}],
        actor="MEDICAL_REVIEW_AGENT",
        notes="High-risk hepatotoxicity. Authorized immediate escalation to Medical Monitor.",
    )
    db.add_all([t1, t2])
    surveillance.trace.record("DETECT", "FINDINGS_DETECTED", "042-S07-002", "FND-042-S07-002-HYS", notes="Hy's law detected.")
    surveillance.trace.record("MEDICAL_REVIEW", "ESCALATE_TO_HUMAN_GATE", "042-S07-002", "FND-042-S07-002-HYS", notes="High-risk hepatotoxicity.")

    db.commit()
    db.close()
    print("Seed data successfully populated!")
