"""
MONITOR Persistent Review Memory
Ensures idempotency across cycles and cuts.
Prevents duplicate queries, repeat escalations for previously rejected items, and tracks resolution status.
"""

import hashlib
from typing import Dict, Set, Any, Optional


class MonitoringMemory:
    """
    Tracks seen finding signatures, dispatched queries, and human rejection history.
    """

    def __init__(self):
        # Hashes of issued queries
        self.issued_query_hashes: Set[str] = set()
        # Hashes of approved or active escalations
        self.active_escalation_hashes: Set[str] = set()
        # Hashes of rejected escalations (must NOT re-escalate without new data)
        self.rejected_escalations: Dict[str, Dict[str, Any]] = {}
        # Track resolved items
        self.resolved_finding_ids: Set[str] = set()

    @staticmethod
    def compute_signature(*parts: Any) -> str:
        s = "|".join(str(p).strip().upper() for p in parts)
        return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]

    def has_query(self, usubjid: str, domain: str, issue_type: str, record_id: str) -> bool:
        sig = self.compute_signature("QUERY", usubjid, domain, issue_type, record_id)
        return sig in self.issued_query_hashes

    def record_query(self, usubjid: str, domain: str, issue_type: str, record_id: str) -> str:
        sig = self.compute_signature("QUERY", usubjid, domain, issue_type, record_id)
        self.issued_query_hashes.add(sig)
        return sig

    def is_escalation_rejected(self, usubjid: str, finding_type: str) -> bool:
        sig = self.compute_signature("ESCALATION", usubjid, finding_type)
        return sig in self.rejected_escalations

    def record_escalation_rejection(self, usubjid: str, finding_type: str, reason: str, reviewer: str) -> None:
        sig = self.compute_signature("ESCALATION", usubjid, finding_type)
        self.rejected_escalations[sig] = {
            "usubjid": usubjid,
            "finding_type": finding_type,
            "reason": reason,
            "reviewer": reviewer,
        }

    def is_escalation_active(self, usubjid: str, finding_type: str) -> bool:
        sig = self.compute_signature("ESCALATION", usubjid, finding_type)
        return sig in self.active_escalation_hashes

    def record_escalation_active(self, usubjid: str, finding_type: str) -> None:
        sig = self.compute_signature("ESCALATION", usubjid, finding_type)
        self.active_escalation_hashes.add(sig)
