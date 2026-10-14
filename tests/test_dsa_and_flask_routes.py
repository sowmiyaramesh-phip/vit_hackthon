"""
Unit and Integration Tests for ATLAS+MONITORING
Verifies:
1. DSA Module: ClinicalGraph (BFS/DFS), FindingPriorityQueue (Max-Heap), ReviewCycleQueue (FIFO), AuditLedger (21 CFR Part 11), MemoryHashSet (O(1)).
2. Flask Backend Routes: Dashboard, Subjects, Subject 360, Ask ATLAS, Emergency Safety Hold, and DSA Telemetry.
"""

import pytest
from backend.app import app
from backend.data_structures import (
    ClinicalGraph, GraphNode, GraphEdge,
    FindingPriorityQueue, ReviewCycleQueue, AuditLedger, MemoryHashSet
)


# ==============================================================================
# 1. DSA UNIT TESTS
# ==============================================================================

def test_clinical_graph_bfs_and_dfs():
    graph = ClinicalGraph(study_id="TEST-101")
    graph.add_node(GraphNode(id="subj:S1", label="Subject 1", type="Subject"))
    graph.add_node(GraphNode(id="disease:Liver", label="Liver Disease", type="Disease"))
    graph.add_node(GraphNode(id="med:DrugA", label="Drug A", type="Medication"))
    
    graph.add_edge(GraphEdge(source="subj:S1", target="disease:Liver", type="HAS_DISEASE"))
    graph.add_edge(GraphEdge(source="disease:Liver", target="med:DrugA", type="TREATED_BY"))

    # Test BFS finding path from Subject 1 to Medication
    paths = graph.bfs_find_path("subj:S1", "Medication")
    assert len(paths) == 1
    assert paths[0]["depth"] == 2
    assert paths[0]["path_ids"] == ["subj:S1", "disease:Liver", "med:DrugA"]

    # Test DFS cycle detection (acyclic graph)
    assert graph.dfs_detect_cycles("subj:S1") is False

    # Introduce cycle and verify detection
    graph.add_edge(GraphEdge(source="med:DrugA", target="subj:S1", type="CYCLE"))
    assert graph.dfs_detect_cycles("subj:S1") is True


def test_finding_priority_queue_max_heap():
    pq = FindingPriorityQueue()
    pq.push("F-LOW", "042-S01", "Minor Window Deviation", "LOW")
    pq.push("F-CRIT", "042-S07", "Hy's Law Transaminase Surge", "CRITICAL")
    pq.push("F-MED", "042-S02", "Dose Variance", "MEDIUM")
    pq.push("F-HIGH", "042-S04", "Glucose Step Change", "HIGH")

    assert pq.size() == 4
    # Pop in order of priority: CRITICAL (4) -> HIGH (3) -> MEDIUM (2) -> LOW (1)
    first = pq.pop()
    assert first.finding_id == "F-CRIT"
    assert first.severity == "CRITICAL"

    second = pq.pop()
    assert second.finding_id == "F-HIGH"

    third = pq.pop()
    assert third.finding_id == "F-MED"

    fourth = pq.pop()
    assert fourth.finding_id == "F-LOW"
    assert pq.is_empty() is True


def test_review_cycle_queue_fifo():
    q = ReviewCycleQueue()
    q.enqueue("STAGE_1_INGESTION")
    q.enqueue("STAGE_2_DETECTION")
    q.enqueue("STAGE_3_DATA_MANAGER")

    assert q.size() == 3
    assert q.dequeue() == "STAGE_1_INGESTION"
    assert q.dequeue() == "STAGE_2_DETECTION"
    assert q.dequeue() == "STAGE_3_DATA_MANAGER"
    assert q.is_empty() is True


def test_audit_ledger_21_cfr_part_11():
    ledger = AuditLedger()
    # Genesis entry exists
    assert len(ledger.entries) == 1

    ledger.append("STAGE_1", "NORMALIZATION", "Harmonizer", "ukat/L to U/L", "042-S07-001")
    ledger.append("STAGE_2", "ESCALATION", "Medical Monitor", "Hy's Law Declared", "042-S07-001")

    assert len(ledger.entries) == 3
    is_valid, msg = ledger.verify_integrity()
    assert is_valid is True
    assert "100% cryptographic continuity" in msg

    # Test tampering detection: mutate an entry and check failure
    ledger.entries[1].notes = "TAMPERED NOTES"
    is_valid_after_tamper, msg_tamper = ledger.verify_integrity()
    assert is_valid_after_tamper is False
    assert "Tampered entry detected" in msg_tamper


def test_memory_hash_set():
    hs = MemoryHashSet(initial_capacity=8)
    hs.add("042-S07-001:Hy's Law")
    hs.add("042-S04-006:Glucose Switch")

    assert hs.contains("042-S07-001:Hy's Law") is True
    assert hs.contains("042-S04-006:Glucose Switch") is True
    assert hs.contains("NON_EXISTENT_ALERT") is False

    hs.remove("042-S04-006:Glucose Switch")
    assert hs.contains("042-S04-006:Glucose Switch") is False


# ==============================================================================
# 2. FLASK REST API INTEGRATION TESTS
# ==============================================================================

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_get_study_dashboard(client):
    res = client.get("/studies/ABC-101/dashboard")
    assert res.status_code == 200
    data = res.get_json()
    assert data["study_id"] == "ABC-101"
    assert data["total_subjects"] >= 8
    assert data["phase"] == "Phase II"


def test_list_subjects(client):
    res = client.get("/subjects")
    assert res.status_code == 200
    subjs = res.get_json()
    assert len(subjs) >= 8
    # Verify enrollment dates exist
    for s in subjs:
        assert "enrollment_date" in s
        assert s["enrollment_date"] is not None


def test_get_subject_360(client):
    res = client.get("/subjects/042-S07-001")
    assert res.status_code == 200
    data = res.get_json()
    assert data["subject_id"] == "042-S07-001"
    assert len(data["labs"]) > 0
    assert len(data["visits"]) > 0


def test_ask_atlas_trap_handling(client):
    res = client.post("/atlas/answer", json={"question": "Can Drug A cure heart failure?"})
    assert res.status_code == 200
    data = res.get_json()
    assert "not established" in data["answer"].lower() or data.get("kind") == "TRAP"


def test_emergency_safety_hold(client):
    payload = {
        "subject_id": "042-S07-001",
        "title": "Automated Test Emergency Hold",
        "reason": "Test transaminase surge above safety boundary",
        "recommended_action": "Immediate clinical pause",
        "physician": "Dr. Sarah Chen"
    }
    res = client.post("/monitor/escalations/emergency", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert "EMERGENCY-HOLD-" in data["escalation_id"]


def test_dsa_telemetry_status(client):
    res = client.get("/api/dsa/status")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "OPERATIONAL"
    assert "priority_queue" in data
    assert "clinical_graph" in data
    assert "audit_ledger" in data
