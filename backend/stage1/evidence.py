"""
ATLAS Evidence & Provenance Model
Provides immutable, verifiable RecordRef and ProtocolRef structures.
Every assertion in the system must be linked to these evidence records.
"""

from dataclasses import dataclass, asdict, field
from typing import Any, Dict, List, Optional


@dataclass
class RecordRef:
    domain: str            # CDISC Domain e.g. "LB", "AE", "DM", "CM", "EX", "SV", "MH"
    usubjid: str           # Unique Subject ID e.g. "042-S07-001"
    seq: int               # Sequence number in domain table e.g. 31
    visit: str = ""        # Visit name e.g. "Visit 2", "Screening"
    date: str = ""         # ISO Date e.g. "2026-01-24"
    field: str = ""        # Observed field name e.g. "LBORRES", "AETERM"
    value: str = ""        # Observed value e.g. "145 U/L", "Fatigue"
    source_file: str = ""  # Source record filename e.g. "lb.csv"
    summary: str = ""      # Human-readable summary e.g. "LB #31: ALT 145 U/L at Visit 2 (2026-01-24)"

    def __post_init__(self):
        if not self.summary:
            vis_info = f" at {self.visit}" if self.visit else ""
            date_info = f" ({self.date})" if self.date else ""
            val_info = f": {self.value}" if self.value else ""
            self.summary = f"{self.domain} #{self.seq}{vis_info}{date_info}{val_info} [{self.usubjid}]"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ProtocolRef:
    protocol_id: str       # e.g. "ABC-101"
    version: str           # e.g. "v1.0" or "v2.0"
    section: str           # e.g. "§2.1", "§7.3"
    title: str             # e.g. "Hy's Law (DILI) Stopping Criteria"
    text: str = ""         # Ground-truth protocol excerpt
    rule_id: str = ""      # Canonical rule key e.g. "RULE_DILI_HYS_LAW"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class EvidenceBundle:
    record_refs: List[RecordRef] = field(default_factory=list)
    protocol_refs: List[ProtocolRef] = field(default_factory=list)
    confidence: float = 1.0
    rationale: str = ""

    def add_record(self, ref: RecordRef) -> None:
        self.record_refs.append(ref)

    def add_protocol(self, ref: ProtocolRef) -> None:
        self.protocol_refs.append(ref)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "record_refs": [r.to_dict() for r in self.record_refs],
            "protocol_refs": [p.to_dict() for p in self.protocol_refs],
            "confidence": self.confidence,
            "rationale": self.rationale,
            "has_evidence": len(self.record_refs) > 0 or len(self.protocol_refs) > 0
        }
