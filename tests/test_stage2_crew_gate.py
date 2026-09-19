"""
Tests for Stage 2: MONITOR Review Crew and Human Gate
"""

import pytest
from backend.stage2.human_gate import HumanGate
from backend.stage2.memory import MonitoringMemory
from backend.stage2.trace import TraceLedger
from backend.stage2.crew import ReviewCrew


def test_human_gate_approve():
    trace = TraceLedger()
    memory = MonitoringMemory()
    gate = HumanGate(trace, memory)

    esc = gate.create_escalation(
        subject_id="042-S07-002",
        site_id="SITE-107",
        finding_id="FND-001",
        title="Potential Hy's Law Candidate",
        severity="CRITICAL",
        recommended_action="Interrupt study drug",
        clinical_evidence=[{"summary": "ALT 220 U/L", "domain": "LB"}],
        protocol_evidence=[{"section": "§2.1", "title": "Hy's Law"}],
    )
    assert esc.status == "PENDING"

    approved = gate.approve(esc.escalation_id, reviewer="Dr. Sarah Chen")
    assert approved.status == "APPROVED"
    assert any(t.decision == "APPROVED" for t in trace.entries)


def test_human_gate_reject_suppresses_repeat():
    trace = TraceLedger()
    memory = MonitoringMemory()
    gate = HumanGate(trace, memory)

    esc = gate.create_escalation(
        subject_id="042-S01-003",
        site_id="SITE-101",
        finding_id="FND-002",
        title="Dose Modification",
        severity="MEDIUM",
        recommended_action="Audit site",
        clinical_evidence=[],
        protocol_evidence=[],
    )
    gate.reject(esc.escalation_id, reason="Clinically justified dose titration")

    # Attempting to re-escalate same title without new evidence should be suppressed by memory!
    esc2 = gate.create_escalation(
        subject_id="042-S01-003",
        site_id="SITE-101",
        finding_id="FND-002",
        title="Dose Modification",
        severity="MEDIUM",
        recommended_action="Audit site",
        clinical_evidence=[],
        protocol_evidence=[],
    )
    assert esc2 is None


def test_human_gate_clarify_never_rejects():
    trace = TraceLedger()
    memory = MonitoringMemory()
    gate = HumanGate(trace, memory)

    esc = gate.create_escalation(
        subject_id="042-S07-002",
        site_id="SITE-107",
        finding_id="FND-001",
        title="Hy's Law Candidate",
        severity="CRITICAL",
        recommended_action="Interrupt drug",
        clinical_evidence=[],
        protocol_evidence=[],
    )

    clarified = gate.request_clarification(
        escalation_id=esc.escalation_id,
        question="Was baseline normal?",
        retrieved_evidence=[{"summary": "Screening ALT: 28 U/L", "domain": "LB"}],
        answer="Yes, baseline was normal at 28 U/L.",
    )
    # Must remain PENDING for doctor review, NOT rejected!
    assert clarified.status == "PENDING"
    assert len(clarified.clarification_history) == 1
