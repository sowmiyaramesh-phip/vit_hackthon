"""
Tests for Stage 3: WATCH Incremental Updates and Retroactive Corrections
"""

import pytest
from backend.stage1.graph import ClinicalGraph
from backend.stage2.trace import TraceLedger
from backend.stage3.incremental import IncrementalEngine
from backend.stage3.watch import WatchSurveillance


def test_watch_incremental_correction_resolves_finding():
    graph = ClinicalGraph(study_id="ABC-101")
    trace = TraceLedger()
    engine = IncrementalEngine(graph, trace)

    # Subject initially had high ALT triggering a finding in Cut 3
    subj_id = "042-S07-001"
    graph.subjects[subj_id] = {
        "id": subj_id,
        "site_id": "SITE-107",
        "labs": [{"test": "ALT", "raw_value": "145", "unit": "U/L", "converted_value": 145.0, "uln": 56.0}],
    }
    graph.findings_by_subject[subj_id].append({
        "id": "FND-001",
        "title": "Elevated Alanine Aminotransferase (> 3x ULN)",
        "status": "OPEN",
    })

    # Cut 5 delta: Lab re-test correction arrives with normal ALT (32 U/L)
    delta_payload = {
        "corrections": [
            {
                "subject_id": subj_id,
                "domain": "LB",
                "test": "ALT",
                "field": "LBORRES",
                "old_value": "145",
                "new_value": "32",
                "reason": "Transcription verification confirmed 32 U/L",
            }
        ]
    }

    delta = engine.apply_cut_delta(cut_number=5, delta_payload=delta_payload)
    assert delta.corrections_count == 1
    assert delta.resolved_findings_count == 1

    # Finding must now be revoked/resolved, not retained as stale!
    fnd = graph.findings_by_subject[subj_id][0]
    assert fnd["status"] == "RESOLVED_BY_CORRECTION"
    assert "Retroactive lab correction" in fnd["resolution_note"]


def test_watch_cut_progression():
    surveillance = WatchSurveillance(current_cut=1)
    assert surveillance.current_cut == 1

    surveillance.advance_to_cut(8)
    assert surveillance.current_cut == 8
    assert surveillance.cuts[1].status == "COMPLETED"
    assert surveillance.cuts[8].status == "ACTIVE"
    assert surveillance.cuts[12].status == "PENDING"
