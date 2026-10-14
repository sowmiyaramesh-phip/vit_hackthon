"""
ATLAS+MONITORING Domain Services & DSA Orchestration
Connects relational database, Clinical Knowledge Graph, Max-Heap Priority Queue,
Review Cycle FIFO Queue, 21 CFR Part 11 Audit Ledger, and Alert Suppression Hash Set.
"""

from typing import Any, Dict, List, Optional
from .database import get_db, init_db, SessionLocal
from .models.db_models import (
    Study, Site, Subject, MedicalHistory, Medication, Visit, LabResult, Dose,
    AdverseEvent, Finding, DataQueryModel, HumanEscalationModel, DecisionTraceModel, Protocol
)
from .data_structures import (
    ClinicalGraph, GraphNode, GraphEdge,
    FindingPriorityQueue, ReviewCycleQueue, AuditLedger, MemoryHashSet
)
from .stage1.atlas import AtlasEngine
from .stage1.evidence import RecordRef, ProtocolRef
from .stage2.trace import TraceLedger
from .stage2.human_gate import HumanGate
from .stage2.data_manager import DataManager
from .stage3.watch import WatchSurveillance
from .seed_data import populate_all


class ClinicalServices:
    """
    Central orchestration service managing state, DSA structures, and domain operations.
    """

    def __init__(self, study_id: str = "ABC-101"):
        self.study_id = study_id

        # 1. DSA Components
        self.graph = ClinicalGraph(study_id=study_id)
        self.priority_queue = FindingPriorityQueue()
        self.cycle_queue = ReviewCycleQueue()
        self.audit_ledger = AuditLedger()
        self.rejection_set = MemoryHashSet()

        # 2. Existing Surveillance & Engines
        self.trace_ledger = TraceLedger()
        self.human_gate = HumanGate(self.trace_ledger)
        self.data_manager = DataManager(self.trace_ledger)
        self.surveillance = WatchSurveillance(
            study_id=study_id,
            current_cut=8,
            graph=self.graph,
            trace_ledger=self.trace_ledger,
            human_gate=self.human_gate,
            data_manager=self.data_manager,
        )
        self.atlas_engine = AtlasEngine(self.graph)

    def initialize_system(self):
        """Initializes database and seeds records into DB and DSA structures."""
        init_db()
        populate_all(self.graph, self.surveillance)

        # Sync existing findings into Max-Heap Priority Queue
        db = SessionLocal()
        try:
            findings = db.query(Finding).all()
            for f in findings:
                self.priority_queue.push(
                    finding_id=f.id,
                    subject_id=f.usubjid,
                    title=f.title,
                    severity=f.severity,
                    data={"message": f.message, "rule": f.protocol_rule}
                )

            # Record initialization in Audit Ledger
            self.audit_ledger.append(
                node="SYSTEM",
                decision="SYSTEM_INITIALIZED",
                actor="System Administrator",
                notes="Study ABC-101 seeded with 8 Liver Disease subjects, CDISC records, and DSA queues",
                subject_id="ABC-101",
                payload={"findings_count": len(findings), "total_cuts": 12}
            )
        finally:
            db.close()

    def get_study_metrics(self, study_id: Optional[str] = None) -> Dict[str, Any]:
        """Calculates study overview metrics matching StudyMetrics interface and preserving DSA metadata."""
        db = SessionLocal()
        try:
            target_study_id = study_id or self.study_id
            study = db.query(Study).filter(Study.study_id == target_study_id).first()
            current_cut = study.current_cut if study else self.surveillance.current_cut
            protocol_name = study.protocol_name if study else "A Multicenter, Double-Blind Phase II Trial of Experimental Hepatoprotective Agent"
            current_version = study.current_protocol_version if study else "v1.0"

            total_subjects = db.query(Subject).count()
            active_subjects = db.query(Subject).filter(Subject.status == "Active").count() or total_subjects
            total_sites = db.query(Site).count()
            open_findings = db.query(Finding).filter(Finding.status == "OPEN").count()
            open_queries = db.query(DataQueryModel).filter(DataQueryModel.status != "CLOSED").count()
            under_review_queries = db.query(DataQueryModel).filter(DataQueryModel.status == "UNDER_REVIEW").count()
            pending_escalations = db.query(HumanEscalationModel).filter(HumanEscalationModel.status == "PENDING").count()

            safety_findings = db.query(Finding).filter(Finding.category == "SAFETY", Finding.status == "OPEN").all()
            recent_findings_titles = [f.title for f in safety_findings[:3]]
            if not recent_findings_titles:
                recent_findings_titles = ["Potential Drug-Induced Liver Injury (Hy's Law Candidate)"]

            return {
                "study_id": target_study_id,
                "protocol_name": protocol_name,
                "phase": study.phase if study else "Phase II",
                "protocol_version": current_version,
                "current_protocol_version": current_version,
                "current_cut": current_cut,
                "current_watch_cut": current_cut,
                "total_cuts": 12,
                "total_subjects": total_subjects,
                "active_subjects": active_subjects,
                "total_sites": total_sites,
                "active_sites": total_sites,
                "open_findings": open_findings,
                "open_queries": open_queries,
                "open_data_queries": open_queries,
                "under_review_queries": under_review_queries,
                "pending_escalations": pending_escalations,
                "pending_human_decisions": pending_escalations,
                "priority_queue_size": self.priority_queue.size(),
                "audit_ledger_entries": len(self.audit_ledger.entries),
                "safety": {
                    "serious_adverse_events_count": 2,
                    "new_safety_findings_count": max(len(safety_findings), 1),
                    "escalations_awaiting_decision_count": pending_escalations,
                    "recent_findings": recent_findings_titles,
                },
                "data_quality": {
                    "open_queries_count": open_queries,
                    "missing_records_count": 1,
                    "unit_inconsistencies_count": 1,
                    "duplicate_records_count": 0,
                },
                "compliance": {
                    "protocol_deviations_count": 2,
                    "site_level_issues_count": 1,
                },
                "watch": {
                    "current_cut": current_cut,
                    "total_cuts": 12,
                    "last_completed_cut": current_cut - 1 if current_cut > 1 else 1,
                    "pending_decisions": pending_escalations,
                    "adversarial_events": 1,
                },
            }
        finally:
            db.close()


# Global Singleton instance
services = ClinicalServices(study_id="ABC-101")
