"""
MONITOR Compliance Node (Stage 2 Node 4)
Evaluates subject data against active protocol specifications (v1.0 vs v2.0).
Produces auditable, evidence-backed Protocol Deviation records.
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from .trace import TraceLedger
from ..stage1.protocol import ProtocolEngine


@dataclass
class ProtocolDeviation:
    id: str = field(default_factory=lambda: f"DEV-{uuid.uuid4().hex[:6].upper()}")
    subject_id: str = ""
    site_id: str = "SITE-101"
    rule_name: str = ""
    protocol_version: str = "v1.0"
    expected: str = ""
    actual: str = ""
    severity: str = "MEDIUM"
    evidence_ref: str = ""
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ComplianceOfficer:
    def __init__(self, trace_ledger: Optional[TraceLedger] = None):
        self.trace = trace_ledger
        self.deviations: List[ProtocolDeviation] = []

    def check_compliance(self, subject: Dict[str, Any], protocol_version: str = "v1.0") -> List[ProtocolDeviation]:
        usubjid = subject.get("id") or subject.get("subject_id", "")
        site_id = subject.get("site_id", "SITE-101")
        engine = ProtocolEngine(protocol_version=protocol_version)
        found_deviations: List[ProtocolDeviation] = []

        # 1. Visit window compliance
        visits = subject.get("visits", [])
        for v in visits:
            v_name = v.get("name", "")
            target_day = v.get("target_day", 14)
            actual_day = v.get("actual_day", 14)
            res = engine.evaluate_visit_window(usubjid, v_name, target_day, actual_day)
            if res and res.triggered:
                dev = ProtocolDeviation(
                    subject_id=usubjid,
                    site_id=site_id,
                    rule_name="Visit Schedule Window Adherence",
                    protocol_version=protocol_version,
                    expected=f"Day {target_day} ±{'3' if protocol_version >= 'v2.0' else '7'} days",
                    actual=f"Day {actual_day} (diff: {abs(actual_day - target_day)} days)",
                    severity="MEDIUM",
                    evidence_ref=f"SV #{usubjid}-{v_name}",
                )
                found_deviations.append(dev)
                self.deviations.append(dev)

        # 2. Dosing compliance
        doses = subject.get("doses", [])
        for d in doses:
            planned = float(d.get("planned_dose", 50.0))
            actual = float(d.get("actual_dose", 50.0))
            res = engine.evaluate_dose_deviation(usubjid, planned, actual)
            if res and res.triggered:
                dev = ProtocolDeviation(
                    subject_id=usubjid,
                    site_id=site_id,
                    rule_name="Investigational Product Dose Adherence",
                    protocol_version=protocol_version,
                    expected=f"{planned} mg",
                    actual=f"{actual} mg",
                    severity="MEDIUM",
                    evidence_ref=d.get("evidence_ref", f"EX #{usubjid}-01"),
                )
                found_deviations.append(dev)
                self.deviations.append(dev)

        if self.trace and found_deviations:
            for dev in found_deviations:
                self.trace.record(
                    node="COMPLIANCE",
                    decision="DEVIATION_LOGGED",
                    subject_id=usubjid,
                    protocol_version=protocol_version,
                    actor="COMPLIANCE_AGENT",
                    notes=f"Protocol deviation logged under {protocol_version}: {dev.rule_name} (Expected: {dev.expected}, Actual: {dev.actual})",
                    result_payload=dev.to_dict(),
                )

        return found_deviations
