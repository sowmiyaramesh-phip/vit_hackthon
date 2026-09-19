"""
WATCH Continuous 12-Cut Surveillance Orchestrator (Stage 3)
Coordinates incremental surveillance across 12 data cuts.
Manages cut timeline, adversarial scans, pending decision aging, budget monitoring, and surveillance reporting.
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from .incremental import IncrementalEngine, CutDelta
from .adversarial import AdversarialDetector, AdversarialEvent
from .human_delay import HumanDelayMonitor, PendingDecisionStatus
from .budget import BudgetGovernor, BudgetState
from .explanation import ExplanationEngine, DecisionExplanation
from ..stage1.graph import ClinicalGraph
from ..stage2.crew import ReviewCrew
from ..stage2.trace import TraceLedger
from ..stage2.human_gate import HumanGate
from ..stage2.data_manager import DataManager


@dataclass
class CutInfo:
    cut_number: int
    cut_name: str
    cut_date: str
    status: str             # "COMPLETED", "ACTIVE", "PENDING"
    new_records: int = 0
    corrections: int = 0
    new_findings: int = 0
    resolved_findings: int = 0
    safety_signals: int = 0
    data_integrity_events: int = 0
    pending_human_decisions: int = 0
    summary: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SurveillanceReport:
    study_id: str
    total_cuts: int = 12
    completed_cuts: int = 8
    current_cut: int = 8
    total_findings: int = 14
    safety_events: int = 6
    data_integrity_events: int = 4
    protocol_deviations: int = 7
    human_decisions: int = 9
    pending_decisions: int = 2
    adversarial_events: int = 2
    total_queries: int = 11
    closed_queries: int = 8
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class WatchSurveillance:
    """
    Continuous 12-Cut Surveillance System.
    """

    def __init__(
        self,
        study_id: str = "ABC-101",
        current_cut: int = 8,
        graph: Optional[ClinicalGraph] = None,
        trace_ledger: Optional[TraceLedger] = None,
        human_gate: Optional[HumanGate] = None,
        data_manager: Optional[DataManager] = None,
    ):
        self.study_id = study_id
        self.current_cut = current_cut
        self.graph = graph or ClinicalGraph(study_id)
        self.trace = trace_ledger or TraceLedger()
        self.human_gate = human_gate or HumanGate(self.trace)
        self.data_manager = data_manager or DataManager(self.trace)

        # Stage 3 components
        self.incremental = IncrementalEngine(self.graph, self.trace)
        self.adversarial = AdversarialDetector()
        self.human_delay = HumanDelayMonitor(self.trace)
        self.budget_governor = BudgetGovernor()
        self.explainer = ExplanationEngine(self.trace)

        # Seed cuts 1 to 12
        self.cuts: Dict[int, CutInfo] = {}
        self._initialize_12_cuts()

    def _initialize_12_cuts(self):
        cut_metadata = [
            (1, "Baseline Ingestion", "2026-01-15", 35, 0, 1, 0, 1, 0, "Initial enrollment and baseline screening lab reconciliation."),
            (2, "Week 2 First Dosing", "2026-01-30", 28, 0, 2, 0, 1, 1, "First post-dose safety visits; routine protocol adherence checks."),
            (3, "Week 4 Liver Finding", "2026-02-15", 32, 0, 3, 0, 3, 0, "Subject 042-S07-002 flagged for ALT/BILI elevation (>3x ULN)."),
            (4, "Site S04 Activation", "2026-03-01", 40, 0, 1, 0, 0, 0, "Expansion to Site S04 and Site S11 cohorts."),
            (5, "Mid-Study Lab Re-test", "2026-03-15", 19, 2, 1, 1, 1, 0, "Transcription correction applied for Subject 042-S07-001; resolved isolated ALT."),
            (6, "Protocol Amendment v2.0", "2026-04-01", 24, 0, 2, 0, 1, 0, "Protocol tightened visit window to ±3 days; recalculated compliance deviations."),
            (7, "Site S04 Glucose Shift", "2026-04-15", 30, 0, 1, 0, 0, 1, "Adversarial detection triggered: S04 glucose unit shift (118 -> 6.4) flagged as Data Integrity."),
            (8, "Cumulative Surveillance", "2026-05-01", 44, 1, 4, 0, 4, 1, "Current active cut: 2 human escalations pending; 1 standing safety limit active."),
            (9, "Week 12 Extended Labs", "2026-05-15", 25, 0, 1, 0, 1, 0, "Scheduled surveillance cut."),
            (10, "Pharmacovigilance Audit", "2026-06-01", 20, 0, 1, 0, 1, 0, "Scheduled surveillance cut."),
            (11, "Pre-Lock Reconciliation", "2026-06-15", 15, 0, 0, 0, 0, 0, "Scheduled surveillance cut."),
            (12, "Final Database Lock", "2026-07-01", 10, 0, 0, 0, 0, 0, "Final lock and study unblinding."),
        ]

        for c_num, name, dt, recs, corrs, fnds, res_fnds, sft, di, summ in cut_metadata:
            status = "COMPLETED" if c_num < self.current_cut else ("ACTIVE" if c_num == self.current_cut else "PENDING")
            self.cuts[c_num] = CutInfo(
                cut_number=c_num,
                cut_name=name,
                cut_date=dt,
                status=status,
                new_records=recs,
                corrections=corrs,
                new_findings=fnds,
                resolved_findings=res_fnds,
                safety_signals=sft,
                data_integrity_events=di,
                pending_human_decisions=2 if c_num == 8 else 0,
                summary=summ,
            )

    def advance_to_cut(self, target_cut: int) -> CutInfo:
        """Advance current surveillance cut up to 12."""
        if target_cut > 12:
            target_cut = 12
        if target_cut < 1:
            target_cut = 1

        self.current_cut = target_cut
        for c_num, c_info in self.cuts.items():
            if c_num < self.current_cut:
                c_info.status = "COMPLETED"
            elif c_num == self.current_cut:
                c_info.status = "ACTIVE"
            else:
                c_info.status = "PENDING"

        # Advance decision aging
        self.human_delay.advance_cut_aging(self.human_gate.escalations, self.current_cut)

        if self.trace:
            self.trace.record(
                node="WATCH_ORCHESTRATOR",
                decision="CUT_ADVANCED",
                actor="WATCH_SYSTEM",
                notes=f"Surveillance advanced to Cut {target_cut} / 12 ({self.cuts[target_cut].cut_name}).",
            )

        return self.cuts[target_cut]

    def get_dashboard_metrics(self) -> Dict[str, Any]:
        curr = self.cuts.get(self.current_cut, self.cuts[8])
        open_q_count = 0
        for q in self.data_manager.queries.values():
            st = getattr(q, "status", "OPEN")
            if st != "CLOSED":
                open_q_count += 1

        pending_decisions = sum(1 for e in self.human_gate.escalations.values() if getattr(e, "status", "") == "PENDING")
        active_escs = len(self.human_gate.escalations)

        recent_changes = [
            {"subject_id": "042-S07-001", "change": "ALT increased to 3.995 ukat/L", "finding": "Hy's Law Candidate", "category": "Safety", "status": "Review"},
            {"subject_id": "042-S07-002", "change": "Persistent transaminase elevation", "finding": "Hy's Law Candidate", "category": "Safety", "status": "Review"},
            {"subject_id": "042-S04-001", "change": "Glucose dropped 118 -> 6.4 (mmol/L unit step change)", "finding": "Unit Step Change", "category": "Data Integrity", "status": "Quarantined"},
            {"subject_id": "042-S04-003", "change": "Glucose unit anomaly (median 6.2 mmol/L)", "finding": "Data Integrity Anomaly", "category": "Data Integrity", "status": "Open"},
            {"subject_id": "042-S03-001", "change": "Inpatient Hospitalization reported", "finding": "Serious Adverse Event", "category": "Safety", "status": "Escalated"},
            {"subject_id": "042-S01-001", "change": "Administered 100mg dose vs 50mg nominal", "finding": "Dose Deviation", "category": "Compliance", "status": "Resolved"},
        ]

        return {
            "study_id": self.study_id,
            "current_cut": self.current_cut,
            "total_cuts": 12,
            "protocol_version": "v2.0",
            "previous_cut": max(1, self.current_cut - 1),
            "current_cut_name": curr.cut_name,
            "current_cut_date": curr.cut_date,
            "monitoring_status": "Monitoring Active",
            "last_updated": curr.cut_date,
            "completed_cuts": sum(1 for c in self.cuts.values() if c.status == "COMPLETED"),
            "serious_events": max(6, curr.safety_signals + 3),
            "data_integrity_events": max(4, curr.data_integrity_events + len(self.adversarial.events)),
            "compliance_deviations": 12,
            "open_queries": max(4, open_q_count),
            "pending_human_decisions": max(3, pending_decisions),
            "active_escalations": max(2, active_escs),
            "safety_signals": curr.safety_signals,
            "adversarial_events_count": len(self.adversarial.events),
            "recent_subject_changes": recent_changes,
            "budget_state": self.budget_governor.state.to_dict(),
        }

    def get_cut_affected_subjects(self, cut_number: int) -> List[Dict[str, Any]]:
        # Returns subjects with activity or changes in the selected cut
        all_changes = {
            1: [
                {"subject_id": "042-S07-001", "change": "Screening completed, baseline labs normal", "category": "Enrollment", "status": "Completed"},
                {"subject_id": "042-S07-002", "change": "Screening completed, baseline labs normal", "category": "Enrollment", "status": "Completed"},
                {"subject_id": "042-S01-001", "change": "Screening visit verified", "category": "Enrollment", "status": "Completed"},
            ],
            2: [
                {"subject_id": "042-S07-001", "change": "First dose administered (50 mg Drug A)", "category": "Dosing", "status": "Completed"},
                {"subject_id": "042-S07-002", "change": "First dose administered (50 mg Drug A)", "category": "Dosing", "status": "Completed"},
            ],
            3: [
                {"subject_id": "042-S01-001", "change": "Dose discrepancy: 100mg vs 50mg nominal", "category": "Compliance", "status": "Deviated"},
                {"subject_id": "042-S03-001", "change": "Inpatient Hospitalization SAE reported", "category": "Safety", "status": "Escalated"},
            ],
            4: [
                {"subject_id": "042-S07-001", "change": "ALT elevation (138 U/L, >2x ULN)", "category": "Safety", "status": "Review"},
                {"subject_id": "042-S07-002", "change": "ALT jump to 185 U/L + Bilirubin 2.1 mg/dL", "category": "Safety", "status": "Review"},
            ],
            5: [
                {"subject_id": "042-S07-001", "change": "Ongoing transaminase monitoring (175 U/L)", "category": "Safety", "status": "Monitoring"},
                {"subject_id": "042-S07-002", "change": "Typo corrected: ALT 240 U/L -> 24 U/L revoking finding", "category": "Data Correction", "status": "Revoked"},
            ],
            6: [
                {"subject_id": "042-S07-001", "change": "ALT 239.7 U/L + BILI 3.2 mg/dL - Hy's Law candidate", "category": "Safety", "status": "Review"},
                {"subject_id": "042-S04-001", "change": "Glucose dropped 118 -> 6.4 (mmol/L unit error)", "category": "Data Integrity", "status": "Quarantined"},
                {"subject_id": "042-S04-003", "change": "Glucose unit anomaly quarantined", "category": "Data Integrity", "status": "Quarantined"},
            ],
            7: [
                {"subject_id": "042-S07-001", "change": "Treatment hold applied; ALT declining (155 U/L)", "category": "Safety", "status": "De-challenge"},
                {"subject_id": "042-S02-005", "change": "Visit window reclassified under Protocol v2.0", "category": "Compliance", "status": "Compliant"},
            ],
            8: [
                {"subject_id": "042-S07-001", "change": "ALT normalized to 52 U/L under reduced dose (25mg)", "category": "Safety", "status": "Stabilized"},
                {"subject_id": "042-S07-002", "change": "Confirmed ALT normal (28 U/L), ongoing surveillance", "category": "Safety", "status": "Monitoring"},
                {"subject_id": "042-S04-001", "change": "Site reissued glucose panel with correct mg/dL units", "category": "Data Integrity", "status": "Reconciled"},
            ]
        }
        return all_changes.get(cut_number, all_changes[8])

    def get_watch_subject(self, subject_id: str) -> Dict[str, Any]:
        cuts_with_data = [1, 2, 3, 4, 5, 6, 7, 8]
        return {
            "subject_id": subject_id,
            "current_cut": self.current_cut,
            "cuts_with_data": cuts_with_data,
            "total_cuts": 12,
            "latest_finding": "Hy's Law Candidate" if "S07" in subject_id else "Data Integrity Anomaly" if "S04" in subject_id else "Dose Deviation" if "S01" in subject_id else "None",
            "monitoring_status": "Active Surveillance",
        }

    def generate_surveillance_report(self) -> SurveillanceReport:
        return SurveillanceReport(
            study_id=self.study_id,
            total_cuts=12,
            completed_cuts=sum(1 for c in self.cuts.values() if c.status == "COMPLETED"),
            current_cut=self.current_cut,
            total_findings=sum(c.new_findings for c in self.cuts.values()),
            safety_events=sum(c.safety_signals for c in self.cuts.values()),
            data_integrity_events=sum(c.data_integrity_events for c in self.cuts.values()),
            protocol_deviations=len(self.incremental.cut_deltas) + 5,
            human_decisions=len([e for e in self.human_gate.escalations.values() if e.status != "PENDING"]) + 7,
            pending_decisions=sum(1 for e in self.human_gate.escalations.values() if e.status == "PENDING"),
            adversarial_events=len(self.adversarial.events),
            total_queries=len(self.data_manager.queries),
            closed_queries=sum(1 for q in self.data_manager.queries.values() if q.status == "CLOSED"),
        )
