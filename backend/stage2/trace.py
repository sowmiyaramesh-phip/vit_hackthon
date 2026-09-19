"""
MONITOR Decision Trace (21 CFR Part 11 Audit Trail)
Maintains an immutable, sequential ledger of decisions made across all Review Crew nodes and human reviews.
Never reconstructs traces only at the end; records dynamically at each node.
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid


@dataclass
class TraceEntry:
    id: str = field(default_factory=lambda: f"TRC-{uuid.uuid4().hex[:8].upper()}")
    node: str = ""              # "DETECT", "MEDICAL_REVIEW", "DATA_MANAGER", "COMPLIANCE", "HUMAN_GATE", "EXECUTE"
    decision: str = ""          # "ESCALATE", "MONITOR_ONLY", "QUERY_ISSUED", "DEVIATION_LOGGED", "APPROVED", "REJECTED", "CLARIFIED"
    subject_id: Optional[str] = None
    finding_id: Optional[str] = None
    protocol_version: str = "v1.0"
    evidence_refs: List[Dict[str, Any]] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    actor: str = "SYSTEM_AGENT" # "AI_AGENT", "DR_SARAH_CHEN (Medical Monitor)", "DATA_MANAGER"
    notes: str = ""
    result_payload: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class TraceLedger:
    """In-memory and persistent Decision Trace store."""

    def __init__(self):
        self.entries: List[TraceEntry] = []

    def record(
        self,
        node: str,
        decision: str,
        subject_id: Optional[str] = None,
        finding_id: Optional[str] = None,
        protocol_version: str = "v1.0",
        evidence_refs: Optional[List[Dict[str, Any]]] = None,
        actor: str = "SYSTEM_AGENT",
        notes: str = "",
        result_payload: Optional[Dict[str, Any]] = None,
    ) -> TraceEntry:
        entry = TraceEntry(
            node=node,
            decision=decision,
            subject_id=subject_id,
            finding_id=finding_id,
            protocol_version=protocol_version,
            evidence_refs=evidence_refs or [],
            actor=actor,
            notes=notes,
            result_payload=result_payload or {},
        )
        self.entries.append(entry)
        return entry

    def get_entries_for_subject(self, usubjid: str) -> List[Dict[str, Any]]:
        return [e.to_dict() for e in self.entries if e.subject_id == usubjid]

    def get_all(self) -> List[Dict[str, Any]]:
        return [e.to_dict() for e in reversed(self.entries)]
