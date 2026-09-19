"""
MONITOR Human Gate Node (Stage 2 Node 5)
Mandatory sovereign safety checkpoint for Medical Monitors.
Provides three distinct human actions:
1. APPROVE: Commit escalation, execute action, record immutable trace.
2. REJECT: Downgrade to monitoring, preserve reason, suppress repeat escalation.
3. CLARIFY: Retrieve ground-truth evidence, answer clinical inquiry, resubmit to Human Gate.
Never treats CLARIFY as REJECT.
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from .trace import TraceLedger
from .memory import MonitoringMemory


@dataclass
class HumanEscalation:
    escalation_id: str = field(default_factory=lambda: f"ESC-{uuid.uuid4().hex[:6].upper()}")
    subject_id: str = ""
    site_id: str = "SITE-101"
    finding_id: str = ""
    title: str = ""
    severity: str = "CRITICAL"    # "CRITICAL", "HIGH", "MEDIUM"
    status: str = "PENDING"       # "PENDING", "APPROVED", "REJECTED", "CLARIFIED"
    recommended_action: str = ""
    clinical_evidence: List[Dict[str, Any]] = field(default_factory=list)
    protocol_evidence: List[Dict[str, Any]] = field(default_factory=list)
    clarification_history: List[Dict[str, Any]] = field(default_factory=list)
    rejection_reason: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    cuts_waiting: int = 0         # Cuts waiting without human response

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class HumanGate:
    def __init__(self, trace_ledger: Optional[TraceLedger] = None, memory: Optional[MonitoringMemory] = None):
        self.trace = trace_ledger
        self.memory = memory or MonitoringMemory()
        self.escalations: Dict[str, HumanEscalation] = {}

    def create_escalation(
        self,
        subject_id: str,
        site_id: str,
        finding_id: str,
        title: str,
        severity: str,
        recommended_action: str,
        clinical_evidence: List[Dict[str, Any]],
        protocol_evidence: List[Dict[str, Any]],
        protocol_version: str = "v1.0",
    ) -> Optional[HumanEscalation]:
        # Check if previously rejected without new evidence
        if self.memory.is_escalation_rejected(subject_id, title):
            return None

        # Check if already active
        if self.memory.is_escalation_active(subject_id, title):
            # Already pending
            for esc in self.escalations.values():
                if esc.subject_id == subject_id and esc.title == title and esc.status == "PENDING":
                    return esc

        esc = HumanEscalation(
            subject_id=subject_id,
            site_id=site_id,
            finding_id=finding_id,
            title=title,
            severity=severity,
            recommended_action=recommended_action,
            clinical_evidence=clinical_evidence,
            protocol_evidence=protocol_evidence,
        )
        self.escalations[esc.escalation_id] = esc
        self.memory.record_escalation_active(subject_id, title)

        if self.trace:
            self.trace.record(
                node="HUMAN_GATE",
                decision="ESCALATION_QUEUED",
                subject_id=subject_id,
                finding_id=finding_id,
                protocol_version=protocol_version,
                actor="SYSTEM_AGENT",
                notes=f"Escalation {esc.escalation_id} queued at Human Gate: {title}",
            )

        return esc

    def approve(self, escalation_id: str, reviewer: str = "Dr. Sarah Chen (Medical Monitor)", notes: str = "") -> Optional[HumanEscalation]:
        """Commit action and record decision."""
        esc = self.escalations.get(escalation_id)
        if not esc:
            return None

        esc.status = "APPROVED"
        esc.updated_at = datetime.utcnow().isoformat() + "Z"

        if self.trace:
            self.trace.record(
                node="HUMAN_GATE",
                decision="APPROVED",
                subject_id=esc.subject_id,
                finding_id=esc.finding_id,
                actor=reviewer,
                notes=f"Escalation approved by {reviewer}. Execution authorized. {notes}".strip(),
                result_payload={"escalation_id": esc.escalation_id, "action": esc.recommended_action},
            )

        return esc

    def reject(self, escalation_id: str, reason: str, reviewer: str = "Dr. Sarah Chen (Medical Monitor)") -> Optional[HumanEscalation]:
        """Downgrade to monitoring; record reason; prevent auto-repeat in next cycle."""
        esc = self.escalations.get(escalation_id)
        if not esc:
            return None

        esc.status = "REJECTED"
        esc.rejection_reason = reason
        esc.updated_at = datetime.utcnow().isoformat() + "Z"

        # Record in memory so review crew doesn't immediately re-escalate next cycle
        self.memory.record_escalation_rejection(esc.subject_id, esc.title, reason, reviewer)

        if self.trace:
            self.trace.record(
                node="HUMAN_GATE",
                decision="REJECTED",
                subject_id=esc.subject_id,
                finding_id=esc.finding_id,
                actor=reviewer,
                notes=f"Escalation downgraded to routine monitoring by {reviewer}. Justification: {reason}",
                result_payload={"escalation_id": esc.escalation_id, "reason": reason},
            )

        return esc

    def request_clarification(
        self,
        escalation_id: str,
        question: str,
        retrieved_evidence: List[Dict[str, Any]],
        answer: str,
        reviewer: str = "Dr. Sarah Chen (Medical Monitor)",
    ) -> Optional[HumanEscalation]:
        """
        Retrieves evidence, answers the doctor's query, and resubmits to Human Gate.
        NEVER treats clarify as reject.
        """
        esc = self.escalations.get(escalation_id)
        if not esc:
            return None

        clarification_entry = {
            "id": f"CLR-{uuid.uuid4().hex[:6].upper()}",
            "question": question,
            "answer": answer,
            "retrieved_evidence": retrieved_evidence,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "reviewer": reviewer,
        }
        esc.clarification_history.append(clarification_entry)
        esc.status = "PENDING"  # Remains in Human Gate for final decision
        esc.updated_at = datetime.utcnow().isoformat() + "Z"

        if self.trace:
            self.trace.record(
                node="HUMAN_GATE",
                decision="CLARIFIED",
                subject_id=esc.subject_id,
                finding_id=esc.finding_id,
                actor=reviewer,
                notes=f"Doctor requested clarification: '{question}'. ATLAS retrieved {len(retrieved_evidence)} supporting records.",
                result_payload={"clarification": clarification_entry},
            )

        return esc
