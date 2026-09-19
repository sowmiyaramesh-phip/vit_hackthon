import sys
from pathlib import Path
import pytest

# Ensure backend in path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.core.database import Base, engine, SessionLocal
from app.services.data_service import DataService
from app.normalization.normalizer import parse_clinical_number, normalize_lab_unit, parse_date
from app.atlas.engine import AtlasEngine
from app.protocol.rules_engine import ProtocolRulesEngine
from app.monitor.review_crew import ReviewCrew
from app.ai.ai_service import AIService
from app.reports.report_service import ReportService
from app.models.models import (
    Study, Subject, AdverseEvent, LabResult, Finding, Query,
    Escalation, EscalationDecision, TraceEntry, SiteFlag, MonitoringCycle
)

@pytest.fixture(scope="session")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    DataService.seed_initial_study_data(db)
    yield db
    db.close()

def test_normalization_and_units():
    # Censored value
    c_res = parse_clinical_number("<5")
    assert c_res["is_censored"] is True
    assert c_res["value"] == 5.0
    assert c_res["operator"] == "<"
    assert c_res["status"] == "BELOW_DETECTION_LIMIT"

    # Comma decimal
    dec_res = parse_clinical_number("14,2")
    assert dec_res["value"] == 14.2
    assert dec_res["is_censored"] is False

    # Unit harmonization (3.995 µkat/L * 60 = 239.7 U/L)
    kat_res = normalize_lab_unit("ALT", "3.995", "µkat/L")
    assert kat_res["normalized_value"] == 239.7
    assert kat_res["normalized_unit"] == "U/L"

    # Dates
    d1 = parse_date("15-01-2026")
    assert d1 is not None and d1.year == 2026 and d1.day == 15
    d2 = parse_date("2026-02-04")
    assert d2 is not None and d2.month == 2

def test_atlas_four_question_types(db_session):
    # 1. COUNT
    cnt_ans = AtlasEngine.answer(db_session, "How many subjects experienced severe adverse events?")
    assert cnt_ans["question_type"] == "COUNT"
    assert "subjects experienced severe adverse events" in cnt_ans["answer"]
    assert len(cnt_ans["evidence"]) > 0

    # 2. LOOKUP
    lkp_ans = AtlasEngine.answer(db_session, "Show ALT for 042-S02-004")
    assert lkp_ans["question_type"] == "LOOKUP"
    assert "042-S02-004" in lkp_ans["answer"]
    assert len(lkp_ans["evidence"]) > 0

    # 3. FINDING
    fnd_ans = AtlasEngine.answer(db_session, "Find potential Hy's Law cases")
    assert fnd_ans["question_type"] == "FINDING"
    assert len(fnd_ans["evidence"]) > 0

    # 4. TRAP (Censored measurement)
    trp_ans1 = AtlasEngine.answer(db_session, "What was the exact numeric viral load for subject 042-S07-004?")
    assert trp_ans1["question_type"] == "TRAP"
    assert "TRAP DETECTED" in trp_ans1["answer"]

    # 5. TRAP (Non-existent subject)
    trp_ans2 = AtlasEngine.answer(db_session, "What was the baseline ALT for subject 999-XXX-000?")
    assert trp_ans2["question_type"] == "TRAP"
    assert "TRAP DETECTED" in trp_ans2["answer"]

def test_scenario_a_sae_miscoded(db_session):
    # 042-S02-004 Cellulitis AESHOSP=Y, AESER=N
    subj = db_session.query(Subject).filter(Subject.usubjid == "042-S02-004").first()
    assert subj is not None
    ae = db_session.query(AdverseEvent).filter(AdverseEvent.subject_id == subj.id, AdverseEvent.aeterm == "Cellulitis").first()
    assert ae is not None
    assert ae.is_hospitalized == "Y"
    assert ae.is_serious == "N"

    res = ProtocolRulesEngine.evaluate_sae_miscoding({
        "record_id": ae.record_id,
        "is_hospitalized": ae.is_hospitalized,
        "is_serious": ae.is_serious,
        "aeterm": ae.aeterm
    })
    assert res["miscoded"] is True
    assert res["severity"] == "CRITICAL"
    assert "hospitalization" in res["rationale"].lower()

def test_monitor_review_crew_and_trace(db_session):
    study = db_session.query(Study).first()
    crew = ReviewCrew(db_session, study.id, cut_number=1, protocol_version="v1.0")
    result = crew.run()

    assert result["status"] == "COMPLETED"
    cycle_id = result["cycle_id"]

    # Verify all 6 nodes produced trace entries
    traces = db_session.query(TraceEntry).filter(TraceEntry.cycle_id == cycle_id).all()
    node_names = {t.node_name for t in traces}
    expected_nodes = {"detect", "medical_review", "data_manager", "compliance", "human_gate", "execute"}
    assert expected_nodes.issubset(node_names), f"Missing trace nodes: {expected_nodes - node_names}"

def test_duplicate_prevention_across_reruns(db_session):
    study = db_session.query(Study).first()
    
    # Run cycle once
    crew1 = ReviewCrew(db_session, study.id, cut_number=1, protocol_version="v1.0")
    res1 = crew1.run()
    
    # Run cycle a second time on the same cut
    crew2 = ReviewCrew(db_session, study.id, cut_number=1, protocol_version="v1.0")
    res2 = crew2.run()

    # Verify 0 duplicate queries and 0 duplicate escalations
    assert res2["data_manager"]["new_queries"] == 0, "Duplicate queries were incorrectly raised!"
    assert res2["human_gate"]["escalations_pending"] == 0, "Duplicate escalations were incorrectly raised!"

def test_human_gate_clarify_workflow(db_session):
    # Find a pending escalation
    esc = db_session.query(Escalation).first()
    assert esc is not None

    # Test CLARIFY
    clarif_res = AIService.generate_clarification_response(
        "What was the ALT at screening, and is there a concomitant hepatotoxic medication?",
        db_session,
        "042-S02-004"
    )
    assert "Screening ALT" in clarif_res["answer"]
    assert len(clarif_res["evidence"]) > 0

def test_manual_subject_creation_and_cascade(db_session):
    import random
    study = db_session.query(Study).first()
    new_subjid = f"042-S02-{random.randint(600, 999)}"
    payload = {
        "study_id": study.id,
        "site_id": "S02",
        "usubjid": new_subjid,
        "age": 49,
        "sex": "F",
        "arm": "Active Drug A 50mg",
        "screen_date": "2026-02-01",
        "rfstdtc": "2026-02-10",
        "labs": [
            {"test_code": "ALT", "raw_value": "45", "raw_unit": "U/L", "visit_name": "Screening", "collection_date": "2026-02-01"},
            {"test_code": "ALT", "raw_value": "3.5", "raw_unit": "µkat/L", "visit_name": "Visit 2", "collection_date": "2026-02-24"}
        ],
        "adverse_events": [
            {"aeterm": "Nausea", "severity": "MILD", "is_serious": "N", "start_date": "2026-02-15"}
        ]
    }
    create_res = DataService.manual_create_subject(db_session, payload)
    assert create_res["success"] is True

    # Check that subject immediately exists in DB
    subj = db_session.query(Subject).filter(Subject.usubjid == new_subjid).first()
    assert subj is not None
    assert len(subj.labs) == 2
    # Verify unit normalization on second lab (3.5 * 60 = 210.0 U/L)
    w2_lab = [lb for lb in subj.labs if lb.visit_name == "Visit 2"][0]
    assert w2_lab.normalized_value == 210.0
    assert w2_lab.normalized_unit == "U/L"

    # Check Ask ATLAS can immediately query this subject!
    ans = AtlasEngine.answer(db_session, f"Show ALT for {new_subjid}", study_id=study.id)
    assert ans["status"] == "ANSWERED"
    assert new_subjid in ans["answer"]

def test_report_generation(db_session):
    cycle = db_session.query(MonitoringCycle).first()
    assert cycle is not None
    rep = ReportService.get_cycle_report(db_session, cycle.id)
    assert rep is not None
    assert "traces" in rep
    assert "summary" in rep

    csv_out = ReportService.export_report_csv(rep)
    assert "ATLAS + MONITOR — Cycle Review Report" in csv_out
