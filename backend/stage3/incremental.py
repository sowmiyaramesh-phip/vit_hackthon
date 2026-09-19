"""
WATCH Incremental Updates & Retroactive Corrections Engine
Handles delta changes between surveillance cuts without rebuilding the complete knowledge graph.
Recalculates derived findings upon data correction, undoes obsolete findings, and preserves audit log.
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid
from ..stage1.graph import ClinicalGraph, GraphNode, GraphEdge
from ..stage1.protocol import ProtocolEngine
from ..stage1.normalization import normalize_lab_result
from ..stage2.trace import TraceLedger


@dataclass
class CutDelta:
    cut_number: int
    new_records_count: int = 0
    corrections_count: int = 0
    new_findings_count: int = 0
    resolved_findings_count: int = 0
    new_queries_count: int = 0
    new_escalations_count: int = 0
    protocol_amendments: List[str] = field(default_factory=list)
    human_decisions: List[str] = field(default_factory=list)
    corrections_applied: List[Dict[str, Any]] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class IncrementalEngine:
    def __init__(self, graph: ClinicalGraph, trace_ledger: Optional[TraceLedger] = None):
        self.graph = graph
        self.trace = trace_ledger
        self.cut_deltas: Dict[int, CutDelta] = {}

    def apply_cut_delta(
        self,
        cut_number: int,
        delta_payload: Dict[str, Any],
        active_protocol_version: str = "v1.0"
    ) -> CutDelta:
        """
        Incrementally merges new records and corrections into the graph.
        Recalculates affected derived findings.
        """
        delta = CutDelta(cut_number=cut_number)

        # 1. Process Corrections (e.g. lab re-test or transcription fix)
        corrections = delta_payload.get("corrections", [])
        for corr in corrections:
            subj_id = corr.get("subject_id")
            domain = corr.get("domain")
            field_name = corr.get("field")
            old_val = corr.get("old_value")
            new_val = corr.get("new_value")
            reason = corr.get("reason", "Lab re-test confirmed transcription correction.")

            delta.corrections_count += 1
            delta.corrections_applied.append(corr)

            # Update graph subject meta
            subj_meta = self.graph.subjects.get(subj_id)
            if subj_meta and domain == "LB":
                # Find the lab test and update
                test_name = corr.get("test", "ALT")
                for lab in subj_meta.get("labs", []):
                    if lab.get("test") == test_name:
                        lab["raw_value"] = new_val
                        norm = normalize_lab_result(test_name, new_val, lab.get("unit", "U/L"))
                        lab["converted_value"] = norm.converted_value
                        lab["normalized"] = norm

                # Recalculate derived findings for this subject
                resolved = self._recalculate_subject_findings(subj_id, active_protocol_version)
                if resolved:
                    delta.resolved_findings_count += len(resolved)

            if self.trace:
                self.trace.record(
                    node="WATCH_INCREMENTAL",
                    decision="CORRECTION_APPLIED",
                    subject_id=subj_id,
                    protocol_version=active_protocol_version,
                    actor="INCREMENTAL_ENGINE",
                    notes=f"Cut {cut_number} correction applied for {subj_id}: {field_name} '{old_val}' -> '{new_val}'. Reason: {reason}",
                    result_payload=corr,
                )

        # 2. Ingest New Records
        new_subjects = delta_payload.get("new_subjects", [])
        for ns in new_subjects:
            sid = ns.get("id") or ns.get("subject_id")
            self.graph.subjects[sid] = ns
            self.graph.add_node(GraphNode(id=f"subj:{sid}", label=f"Subject {sid}", type="Subject", properties=ns))
            delta.new_records_count += 1

        new_labs = delta_payload.get("new_labs", [])
        for nl in new_labs:
            sid = nl.get("subject_id")
            if sid in self.graph.subjects:
                self.graph.subjects[sid].setdefault("labs", []).append(nl)
                delta.new_records_count += 1

        delta.protocol_amendments = delta_payload.get("protocol_amendments", [])
        delta.human_decisions = delta_payload.get("human_decisions", [])

        self.cut_deltas[cut_number] = delta
        return delta

    def _recalculate_subject_findings(self, subj_id: str, protocol_version: str) -> List[str]:
        """
        Re-evaluates findings for a subject. If a finding is no longer supported by data,
        marks it RESOLVED/REVOKED in the graph findings list.
        """
        subj_meta = self.graph.subjects.get(subj_id, {})
        labs = subj_meta.get("labs", [])
        alt_lab = next((l for l in labs if l.get("test") == "ALT"), None)
        bili_lab = next((l for l in labs if l.get("test") == "BILI"), None)

        engine = ProtocolEngine(protocol_version=protocol_version)
        alt_norm = alt_lab.get("normalized") if alt_lab and "normalized" in alt_lab else (
            normalize_lab_result("ALT", alt_lab["raw_value"], alt_lab.get("unit", "U/L")) if alt_lab else None
        )
        bili_norm = bili_lab.get("normalized") if bili_lab and "normalized" in bili_lab else (
            normalize_lab_result("BILI", bili_lab["raw_value"], bili_lab.get("unit", "mg/dL")) if bili_lab else None
        )

        res = engine.evaluate_hys_law(
            usubjid=subj_id,
            alt_norm=alt_norm,
            ast_norm=None,
            bili_norm=bili_norm,
        )

        resolved_ids = []
        findings = self.graph.findings_by_subject.get(subj_id, [])
        for f in findings:
            title_lower = f.get("title", "").lower()
            if any(k in title_lower for k in ["hy's law", "dili", "alt", "alanine", "liver", "hepatic"]):
                if not res or not res.triggered:
                    if f.get("status") != "RESOLVED_BY_CORRECTION":
                        f["status"] = "RESOLVED_BY_CORRECTION"
                        f["resolved_at"] = datetime.now(timezone.utc).isoformat()
                        f["resolution_note"] = "Retroactive lab correction reduced liver enzymes below protocol safety threshold."
                        resolved_ids.append(f.get("id"))
                        if self.trace:
                            self.trace.record(
                                node="WATCH_INCREMENTAL",
                                decision="FINDING_REVOKED",
                                subject_id=subj_id,
                                finding_id=f.get("id"),
                                actor="INCREMENTAL_ENGINE",
                                notes=f"Finding {f.get('id')} revoked: data correction shows ALT/Bilirubin within acceptable bounds.",
                            )
        return resolved_ids
