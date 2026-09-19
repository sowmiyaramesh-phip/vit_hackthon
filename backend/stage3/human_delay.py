"""
WATCH Human Delay & Standing Limits Monitor
Tracks human decision aging across surveillance cuts.
Strict rule: Silence is NEVER interpreted as approval.
Enforces standing limits and logs non-receipt of approval.
"""

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any, Dict, List, Optional
from ..stage2.trace import TraceLedger


@dataclass
class PendingDecisionStatus:
    decision_id: str
    subject_id: str
    issue_title: str
    cuts_waiting: int
    status: str             # "PENDING"
    standing_limit_action: str
    approval_received: bool = False
    warning: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class HumanDelayMonitor:
    def __init__(self, trace_ledger: Optional[TraceLedger] = None):
        self.trace = trace_ledger

    def advance_cut_aging(
        self,
        pending_escalations: Dict[str, Any],
        current_cut: int,
        protocol_version: str = "v1.0"
    ) -> List[PendingDecisionStatus]:
        """
        Increments cuts_waiting for all pending escalations.
        If waiting >= 4 cuts, enforces standing protocol limits.
        """
        statuses = []
        for esc_id, esc in pending_escalations.items():
            if esc.status == "PENDING":
                esc.cuts_waiting += 1
                standing_action = "Maintain safety dose suspension under standing safety limits"
                warning = ""

                if esc.cuts_waiting >= 4:
                    warning = (
                        f"CRITICAL DELAY: Decision {esc_id} has been pending for {esc.cuts_waiting} cuts. "
                        "Silence is not approval. Patient remains under protective standing limits."
                    )
                    if self.trace:
                        self.trace.record(
                            node="HUMAN_GATE",
                            decision="STANDING_LIMIT_CONTINUED",
                            subject_id=esc.subject_id,
                            finding_id=esc.finding_id,
                            protocol_version=protocol_version,
                            actor="STANDING_SAFETY_POLICY",
                            notes=(
                                f"Human decision unanswered after {esc.cuts_waiting} cuts. "
                                "Silence is not interpreted as approval. Continued under standing limits."
                            ),
                            result_payload={"cuts_waiting": esc.cuts_waiting, "decision_id": esc_id},
                        )
                elif esc.cuts_waiting >= 2:
                    warning = f"Decision pending for {esc.cuts_waiting} cuts. Escalation reminder sent to Medical Monitor."

                statuses.append(
                    PendingDecisionStatus(
                        decision_id=esc_id,
                        subject_id=esc.subject_id,
                        issue_title=esc.title,
                        cuts_waiting=esc.cuts_waiting,
                        status="PENDING",
                        standing_limit_action=standing_action,
                        approval_received=False,
                        warning=warning,
                    )
                )

        return statuses
