"""
Tests for Stage 1: Clinical Knowledge Graph and ATLAS Query Engine
"""

import pytest
from backend.stage1.graph import ClinicalGraph, GraphNode, GraphEdge
from backend.stage1.atlas import AtlasEngine


@pytest.fixture
def sample_graph():
    graph = ClinicalGraph(study_id="ABC-101")
    graph.register_curated_treatment("Liver disease", "Drug A")
    graph.register_curated_treatment("Liver disease", "Drug B")

    # Add Liver disease subject taking Drug A
    s1_id = "042-S07-001"
    graph.subjects[s1_id] = {
        "id": s1_id,
        "site_id": "SITE-107",
        "medications": [{"name": "Drug A", "dose": "50 mg", "status": "Ongoing"}],
        "labs": [{"test": "ALT", "converted_value": 145.0, "uln": 56.0}],
        "disease_statuses": {"Liver disease": "Ongoing"},
        "disease_evidence": {"Liver disease": "HIST #042-S07-001-01"},
    }
    graph.diseases["Liver disease"].add(s1_id)

    # Add Liver disease subject taking unrelated drug (unsupported)
    s2_id = "042-S08-015"
    graph.subjects[s2_id] = {
        "id": s2_id,
        "site_id": "SITE-108",
        "medications": [{"name": "Standard Care", "dose": "N/A", "status": "Ongoing"}],
        "labs": [{"test": "ALT", "converted_value": 31.0, "uln": 56.0}],
        "disease_statuses": {"Liver disease": "Ongoing"},
        "disease_evidence": {"Liver disease": "HIST #042-S08-015-01"},
    }
    graph.diseases["Liver disease"].add(s2_id)

    return graph


def test_disease_explorer_curated_vs_unsupported(sample_graph):
    res = sample_graph.search_disease("Liver disease")
    assert res["total_subjects"] == 2
    assert "Drug A" in res["treatments_observed"]
    assert "Standard Care" in res["treatments_observed"]

    # Subject 1 has supported treatment
    s1 = next(s for s in res["subjects"] if s["subject_id"] == "042-S07-001")
    t1 = s1["treatments"][0]
    assert t1["is_supported"] is True
    assert "Supported by protocol" in t1["evidence_note"]

    # Subject 2 has unsupported treatment
    s2 = next(s for s in res["subjects"] if s["subject_id"] == "042-S08-015")
    t2 = s2["treatments"][0]
    assert t2["is_supported"] is False
    assert "Relationship not established from available study data." in t2["evidence_note"]


def test_atlas_engine_trap_question_handling(sample_graph):
    engine = AtlasEngine(sample_graph)
    # Question asking about condition outside study data
    trap_res = engine.ask("Which subjects have heart failure?")
    assert trap_res["kind"] == "TRAP"
    assert trap_res["total_count"] == 0
    assert "Relationship not established from available study data" in trap_res["answer"]


def test_atlas_engine_elevated_alt(sample_graph):
    engine = AtlasEngine(sample_graph)
    res = engine.ask("Which subjects have elevated ALT?")
    assert res["kind"] == "FINDING"
    assert res["total_count"] == 1
    assert res["results"][0]["subject_id"] == "042-S07-001"
