"""
MONITOR Review Crew Orchestrator (Stage 2)
Executes the 6-node clinical monitoring workflow in strict sequential order:
1. DETECT
2. MEDICAL REVIEW
3. DATA MANAGER
4. COMPLIANCE
5. HUMAN GATE
6. EXECUTE
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from .trace import TraceLedger
from .memory import MonitoringMemory
from .medical_review import MedicalReviewer
from .data_manager import DataManager
from .compliance import ComplianceOfficer
from .human_gate import HumanGate
from ..stage1.protocol import ProtocolEngine


@dataclass
class CycleReport:
    cycle_id: str
    study_id: str
    cut_number: int
    protocol_version: str
    status: str
    start_time: str
    end_time: str
    nodes_executed: List[Dict[str, Any]]
    findings_detected: int
    safety_findings: int
    data_queries_issued: int
    compliance_deviations: int
    escalations_queued: int
    human_decisions_pending: int
    trace_entries_count: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ReviewCrew:
    """
    6-Node Clinical Monitoring Review Crew.
    """

    def __init__(
        self,
        study_id: str = "ABC-101",
        cut_number: int = 1,
        protocol_version: str = "v1.0",
        trace_ledger: Optional[TraceLedger] = None,
        memory: Optional[MonitoringMemory] = None,
        human_gate: Optional[HumanGate] = None,
        data_manager: Optional[DataManager] = None,
    ):
        self.study_id = study_id
        self.cut_number = cut_number
        self.protocol_version = protocol_version
        self.trace = trace_ledger or TraceLedger()
        self.memory = memory or MonitoringMemory()
        self.medical_reviewer = MedicalReviewer(self.trace)
        self.data_manager = data_manager or DataManager(self.trace, self.memory)
        self.compliance_officer = ComplianceOfficer(self.trace)
        self.human_gate = human_gate or HumanGate(self.trace, self.memory)

    def run_cycle(self, subjects: List[Dict[str, Any]]) -> CycleReport:
        """Runs all 6 sequential nodes."""
        cycle_id = f"CYC-{self.study_id}-CUT{self.cut_number}-{uuid.uuid4().hex[:6].upper()}"
        start_time = datetime.utcnow().isoformat() + "Z"
        nodes_log = []

        # 1. DETECT
        detected_findings = []
        protocol_eng = ProtocolEngine(study_id=self.study_id, protocol_version=self.protocol_version)
        for s in subjects:
            usubjid = s.get("id") or s.get("subject_id", "")
            # Check Hy's Law / ALT elevation
            labs = s.get("labs", [])
            alt_lab = next((l for l in labs if l.get("test") == "ALT"), None)
            ast_lab = next((l for l in labs if l.get("test") == "AST"), None)
            bili_lab = next((l for l in labs if l.get("test") == "BILI"), None)

            if alt_lab or bili_lab:
                alt_norm = alt_lab.get("normalized") if alt_lab else None
                ast_norm = ast_lab.get("normalized") if ast_lab else None
                bili_norm = bili_lab.get("normalized") if bili_lab else None

                hys_res = protocol_eng.evaluate_hys_law(
                    usubjid=usubjid,
                    alt_norm=alt_norm,
                    ast_norm=ast_norm,
                    bili_norm=bili_norm,
                    alt_ref=alt_lab.get("record_ref") if alt_lab else None,
                    ast_ref=ast_lab.get("record_ref") if ast_lab else None,
                    bili_ref=bili_lab.get("record_ref") if bili_lab else None,
                )
                if hys_res and hys_res.triggered:
                    detected_findings.append({
                        "id": f"FND-{uuid.uuid4().hex[:6].upper()}",
                        "subject_id": usubjid,
                        "site_id": s.get("site_id", "SITE-101"),
                        "title": hys_res.title,
                        "category": hys_res.category,
                        "severity": hys_res.severity,
                        "message": hys_res.message,
                        "recommended_action": hys_res.recommended_action,
                        "evidence_bundle": hys_res.evidence_bundle.to_dict(),
                        "status": "OPEN",
                    })

        self.trace.record(
            node="DETECT",
            decision="FINDINGS_DETECTED",
            actor="DETECTION_AGENT",
            protocol_version=self.protocol_version,
            notes=f"Detected {len(detected_findings)} potential clinical findings across {len(subjects)} subjects.",
            result_payload={"count": len(detected_findings)},
        )
        nodes_log.append({"node": "DETECT", "status": "COMPLETED", "output_count": len(detected_findings)})

        # 2. MEDICAL REVIEW
        escalations_candidate = []
        for f in detected_findings:
            assessment = self.medical_reviewer.review_finding(f, self.protocol_version)
            if assessment.recommendation == "ESCALATE_TO_HUMAN_GATE":
                escalations_candidate.append((f, assessment))

        nodes_log.append({"node": "MEDICAL_REVIEW", "status": "COMPLETED", "output_count": len(escalations_candidate)})

        # 3. DATA MANAGER
        total_queries = 0
        for s in subjects:
            qs = self.data_manager.audit_subject_data(s, self.protocol_version)
            total_queries += len(qs)

        nodes_log.append({"node": "DATA_MANAGER", "status": "COMPLETED", "output_count": total_queries})

        # 4. COMPLIANCE
        total_deviations = 0
        for s in subjects:
            devs = self.compliance_officer.check_compliance(s, self.protocol_version)
            total_deviations += len(devs)

        nodes_log.append({"node": "COMPLIANCE", "status": "COMPLETED", "output_count": total_deviations})

        # 5. HUMAN GATE
        queued_escalations = 0
        for f, assessment in escalations_candidate:
            esc = self.human_gate.create_escalation(
                subject_id=f["subject_id"],
                site_id=f["site_id"],
                finding_id=f["id"],
                title=f["title"],
                severity=f["severity"],
                recommended_action=f["recommended_action"],
                clinical_evidence=f["evidence_bundle"]["record_refs"],
                protocol_evidence=f["evidence_bundle"]["protocol_refs"],
                protocol_version=self.protocol_version,
            )
            if esc:
                queued_escalations += 1

        nodes_log.append({"node": "HUMAN_GATE", "status": "WAITING_HUMAN_INPUT" if queued_escalations > 0 else "COMPLETED", "output_count": queued_escalations})

        # 6. EXECUTE
        self.trace.record(
            node="EXECUTE",
            decision="CYCLE_COMMITTED",
            actor="ORCHESTRATOR",
            protocol_version=self.protocol_version,
            notes=f"Monitoring cycle {cycle_id} successfully executed and recorded.",
        )
        nodes_log.append({"node": "EXECUTE", "status": "COMPLETED", "output_count": 1})

        end_time = datetime.utcnow().isoformat() + "Z"

        return CycleReport(
            cycle_id=cycle_id,
            study_id=self.study_id,
            cut_number=self.cut_number,
            protocol_version=self.protocol_version,
            status="COMPLETED",
            start_time=start_time,
            end_time=end_time,
            nodes_executed=nodes_log,
            findings_detected=len(detected_findings),
            safety_findings=sum(1 for f in detected_findings if f["category"] == "SAFETY"),
            data_queries_issued=total_queries,
            compliance_deviations=total_deviations,
            escalations_queued=queued_escalations,
            human_decisions_pending=sum(1 for e in self.human_gate.escalations.values() if e.status == "PENDING"),
            trace_entries_count=len(self.trace.entries),
        )
