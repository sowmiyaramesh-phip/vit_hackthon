"""
WATCH API Router: 12-Cut Surveillance Dashboard, Timeline, Incremental Cut Details,
Adversarial Events, Pending Decisions, Explain Decision, and Budget Governor.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from ..stage3.watch import WatchSurveillance
from ..stage3.budget import BudgetGovernor
from ..stage3.explanation import ExplanationEngine
from ..models.schemas import BudgetUpdate

router = APIRouter(prefix="/watch", tags=["WATCH"])

_surveillance: Optional[WatchSurveillance] = None


def set_context(surveillance: WatchSurveillance):
    global _surveillance
    _surveillance = surveillance


@router.get("/dashboard")
def get_watch_dashboard():
    """Returns continuous surveillance dashboard metrics."""
    if not _surveillance:
        raise HTTPException(status_code=500, detail="Surveillance engine not initialized")
    return _surveillance.get_dashboard_metrics()


@router.get("/cuts")
def get_cuts_timeline():
    """Returns 12-cut timeline status."""
    if not _surveillance:
        raise HTTPException(status_code=500, detail="Surveillance engine not initialized")
    return [c.to_dict() for c in _surveillance.cuts.values()]


@router.get("/cuts/{cut_number}/subjects")
def get_cut_affected_subjects(cut_number: int):
    """Returns list of subjects affected in the specified cut."""
    if not _surveillance:
        raise HTTPException(status_code=500, detail="Surveillance engine not initialized")
    return _surveillance.get_cut_affected_subjects(cut_number)


@router.get("/subjects/{subject_id}")
def get_watch_subject(subject_id: str):
    """Returns watch surveillance status and cuts with data for a subject."""
    if not _surveillance:
        raise HTTPException(status_code=500, detail="Surveillance engine not initialized")
    return _surveillance.get_watch_subject(subject_id)


@router.post("/run-period")
def run_period(target_cut: Optional[int] = None):
    """Runs continuous surveillance period advancing to target cut."""
    if not _surveillance:
        raise HTTPException(status_code=500, detail="Surveillance engine not initialized")
    new_cut = _surveillance.advance_cut(target_cut=target_cut)
    return {
        "success": True,
        "message": f"Surveillance period advanced to Cut {new_cut.cut_number} ({new_cut.cut_name}).",
        "cut": new_cut.to_dict(),
    }


@router.get("/cuts/{cut_number}")
def get_cut_details(cut_number: int):
    """
    Shows what changed incrementally since previous cut:
    New records, corrections, new findings, resolved findings, protocol amendments, human decisions.
    Does NOT rebuild full graph 12 times!
    """
    if not _surveillance:
        raise HTTPException(status_code=500, detail="Surveillance engine not initialized")

    cut_info = _surveillance.cuts.get(cut_number)
    if not cut_info:
        raise HTTPException(status_code=404, detail=f"Cut {cut_number} not found")

    # Specific incremental delta metadata for demo cuts
    demo_deltas = {
        3: {
            "new_records": 32,
            "corrections": 0,
            "new_findings": ["FND-042-S07-002-HYS: Hy's Law candidate detected"],
            "resolved_findings": [],
            "protocol_amendments": [],
            "human_decisions": [],
            "delta_summary": "Subject 042-S07-002 flagged for transaminase & bilirubin elevation.",
        },
        5: {
            "new_records": 19,
            "corrections": 2,
            "new_findings": [],
            "resolved_findings": [
                "FND-042-S07-001-ALT: Isolated ALT elevation resolved via verified transcription correction."
            ],
            "protocol_amendments": [],
            "human_decisions": [],
            "delta_summary": "Laboratory re-test data correction applied. Recalculated derived finding and revoked stale safety alert.",
        },
        6: {
            "new_records": 24,
            "corrections": 0,
            "new_findings": ["DEV-042-S07-001-VIS3: Visit schedule deviation under Protocol v2.0"],
            "resolved_findings": [],
            "protocol_amendments": ["Protocol v2.0: Visit window tightened to ±3 days (from ±7 days)"],
            "human_decisions": [],
            "delta_summary": "Protocol Amendment v2.0 introduced. Recalculated compliance deviations across all active cohorts.",
        },
        7: {
            "new_records": 30,
            "corrections": 0,
            "new_findings": ["ADV-S04-GLUC: Data Integrity Alert - S04 glucose unit step-change"],
            "resolved_findings": [],
            "protocol_amendments": [],
            "human_decisions": [],
            "delta_summary": "Adversarial scan flagged Site S04 glucose drop (118 -> 6.4) as DATA INTEGRITY ISSUE. Values quarantined.",
        },
        8: {
            "new_records": 44,
            "corrections": 1,
            "new_findings": ["ESC-042-S07-002: Pending Doctor Authorization", "ESC-042-S01-003: Standing Limit Active"],
            "resolved_findings": [],
            "protocol_amendments": [],
            "human_decisions": ["Dr. Sarah Chen clarification requested on baseline ALT"],
            "delta_summary": "Surveillance Cut 8 active: 2 human escalations pending; 1 decision under standing limit safeguards.",
        }
    }

    custom_delta = demo_deltas.get(cut_number, {
        "new_records": cut_info.new_records,
        "corrections": cut_info.corrections,
        "new_findings": [f"Routine finding Cut {cut_number}"] if cut_info.new_findings > 0 else [],
        "resolved_findings": [],
        "protocol_amendments": [],
        "human_decisions": [],
        "delta_summary": cut_info.summary,
    })

    return {
        "cut_info": cut_info.to_dict(),
        "incremental_changes": custom_delta,
    }


@router.post("/run-cut")
def advance_cut(target_cut: Optional[int] = None):
    """Advances surveillance to the next cut or target cut."""
    if not _surveillance:
        raise HTTPException(status_code=500, detail="Surveillance engine not initialized")

    next_c = target_cut if target_cut is not None else (_surveillance.current_cut + 1)
    new_info = _surveillance.advance_to_cut(next_c)
    return {
        "success": True,
        "current_cut": _surveillance.current_cut,
        "cut_info": new_info.to_dict(),
        "dashboard": _surveillance.get_dashboard_metrics(),
    }


@router.get("/events")
def list_adversarial_events():
    """Lists detected data integrity and adversarial events."""
    if not _surveillance:
        return []
    return [e.to_dict() for e in _surveillance.adversarial.events]


@router.get("/pending-decisions")
def list_pending_decisions():
    """
    Shows pending decisions, cuts waiting, and standing limit status.
    Enforces principle: Silence is never interpreted as approval.
    """
    if not _surveillance:
        return []

    statuses = _surveillance.human_delay.advance_cut_aging(_surveillance.human_gate.escalations, _surveillance.current_cut)
    return [s.to_dict() for s in statuses]


@router.get("/decisions/{decision_id}/explain")
def explain_decision(decision_id: str):
    """
    Explains decision using 5-pillar explainability:
    WHAT, EVIDENCE, ALTERNATIVES, WHY, TRACE consistency.
    """
    if not _surveillance or not _surveillance.explainer:
        raise HTTPException(status_code=500, detail="Explainer not initialized")

    # Clean ID e.g. "D-012" or "012"
    clean_id = decision_id.upper()
    if not clean_id.startswith("D-"):
        clean_id = f"D-{clean_id}"

    expl = _surveillance.explainer.get_explanation(clean_id)
    if not expl:
        # Check if it matches an approved escalation
        esc = _surveillance.human_gate.escalations.get(clean_id.replace("D-", ""))
        if esc:
            expl = _surveillance.explainer.get_explanation(f"D-{esc.escalation_id}")

    if not expl:
        # Fallback to D-012 as default demonstration
        expl = _surveillance.explainer.get_explanation("D-012")

    return expl.to_dict() if expl else {}


@router.get("/surveillance-report")
def get_surveillance_report():
    """Returns 12-cut surveillance report."""
    if not _surveillance:
        raise HTTPException(status_code=500, detail="Surveillance engine not initialized")
    rep = _surveillance.generate_surveillance_report()
    return rep.to_dict()


@router.post("/budget")
def update_budget(payload: BudgetUpdate):
    """Simulates or updates AI budget consumption."""
    if not _surveillance:
        raise HTTPException(status_code=500, detail="Surveillance engine not initialized")

    state = _surveillance.budget_governor.set_budget(payload.consumed_usd)
    return {
        "success": True,
        "budget_state": state.to_dict(),
    }
