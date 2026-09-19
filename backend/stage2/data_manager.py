"""
MONITOR Data Manager Node (Stage 2 Node 3)
Audits trial datasets for discrepancies, generating formal, actionable queries.
Enforces query status lifecycle: OPEN -> SITE RESPONSE -> UNDER REVIEW -> CLOSED.
Never auto-closes a query without formal verification.
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from .trace import TraceLedger
from .memory import MonitoringMemory


@dataclass
class ClinicalDataQuery:
    query_id: str = field(default_factory=lambda: f"QRY-{uuid.uuid4().hex[:6].upper()}")
    problem_type: str = ""       # "AE_BEFORE_FIRST_DOSE", "MISSING_DOSE", "UNIT_MISMATCH", "DUPLICATE_RECORD", "MISSING_FIELD"
    subject_id: str = ""
    site_id: str = "SITE-101"
    record_ref: str = ""
    question_to_site: str = ""
    status: str = "OPEN"         # "OPEN", "SITE_RESPONSE", "UNDER_REVIEW", "CLOSED"
    site_response: Optional[str] = None
    dm_review_notes: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class DataManager:
    """
    Identifies data inconsistencies and manages the complete query lifecycle.
    """

    def __init__(self, trace_ledger: Optional[TraceLedger] = None, memory: Optional[MonitoringMemory] = None):
        self.trace = trace_ledger
        self.memory = memory or MonitoringMemory()
        self.queries: Dict[str, ClinicalDataQuery] = {}

    def audit_subject_data(self, subject: Dict[str, Any], protocol_version: str = "v1.0") -> List[ClinicalDataQuery]:
        usubjid = subject.get("id") or subject.get("subject_id", "")
        site_id = subject.get("site_id", "SITE-101")
        new_queries = []

        # 1. AE before first dose check
        first_dose_date = subject.get("first_dose_date")
        for ae in subject.get("adverse_events", []):
            ae_start = ae.get("start_date")
            if first_dose_date and ae_start and ae_start < first_dose_date:
                # Potential pre-treatment medical history miscoded as treatment AE
                if not self.memory.has_query(usubjid, "AE", "AE_BEFORE_FIRST_DOSE", ae.get("term", "")):
                    q = ClinicalDataQuery(
                        problem_type="AE_BEFORE_FIRST_DOSE",
                        subject_id=usubjid,
                        site_id=site_id,
                        record_ref=ae.get("evidence_ref", f"AE #{usubjid}-01"),
                        question_to_site=(
                            f"Adverse Event '{ae.get('term')}' has onset date {ae_start} which precedes "
                            f"the first investigational product dose on {first_dose_date}. "
                            f"Please confirm if this event should be reclassified as Pre-existing Medical History (MH)."
                        ),
                        status="OPEN"
                    )
                    self.memory.record_query(usubjid, "AE", "AE_BEFORE_FIRST_DOSE", ae.get("term", ""))
                    self.queries[q.query_id] = q
                    new_queries.append(q)

        # 2. Missing dose records for scheduled visits
        visits = subject.get("visits", [])
        doses = subject.get("doses", [])
        dose_visits = {d.get("visit") for d in doses if d.get("visit")}
        for v in visits:
            v_name = v.get("name", "")
            if "Visit" in v_name and v_name not in dose_visits and v.get("status") == "Completed":
                if not self.memory.has_query(usubjid, "EX", "MISSING_DOSE", v_name):
                    q = ClinicalDataQuery(
                        problem_type="MISSING_DOSE",
                        subject_id=usubjid,
                        site_id=site_id,
                        record_ref=f"SV #{usubjid}-{v_name}",
                        question_to_site=f"Visit '{v_name}' is recorded as completed but no dosing record (EX) was submitted.",
                        status="OPEN"
                    )
                    self.memory.record_query(usubjid, "EX", "MISSING_DOSE", v_name)
                    self.queries[q.query_id] = q
                    new_queries.append(q)

        # 3. Unit mismatch or conversion anomalies
        for lab in subject.get("labs", []):
            if lab.get("is_valid") is False or lab.get("unit") == "UNKNOWN":
                test = lab.get("test", "LAB")
                if not self.memory.has_query(usubjid, "LB", "UNIT_MISMATCH", test):
                    q = ClinicalDataQuery(
                        problem_type="UNIT_MISMATCH",
                        subject_id=usubjid,
                        site_id=site_id,
                        record_ref=lab.get("evidence_ref", f"LB #{usubjid}-{test}"),
                        question_to_site=f"Unrecognized or invalid laboratory unit '{lab.get('unit')}' for test {test}. Please re-specify standard unit.",
                        status="OPEN"
                    )
                    self.memory.record_query(usubjid, "LB", "UNIT_MISMATCH", test)
                    self.queries[q.query_id] = q
                    new_queries.append(q)

        # Record in trace
        if self.trace and new_queries:
            for nq in new_queries:
                self.trace.record(
                    node="DATA_MANAGER",
                    decision="QUERY_ISSUED",
                    subject_id=usubjid,
                    protocol_version=protocol_version,
                    actor="DATA_MANAGER_AGENT",
                    notes=f"Created query {nq.query_id}: {nq.problem_type} - {nq.question_to_site}",
                    result_payload={"query_id": nq.query_id, "problem": nq.problem_type},
                )

        return new_queries

    def submit_site_response(self, query_id: str, site_text: str) -> Optional[ClinicalDataQuery]:
        q = self.queries.get(query_id)
        if not q:
            return None
        q.site_response = site_text
        # Enforce principle: site response does NOT automatically close the query
        q.status = "UNDER_REVIEW"
        q.updated_at = datetime.utcnow().isoformat() + "Z"

        if self.trace:
            self.trace.record(
                node="DATA_MANAGER",
                decision="SITE_RESPONDED",
                subject_id=q.subject_id,
                actor="SITE_COORDINATOR",
                notes=f"Site responded to query {query_id}: '{site_text}'. Status moved to UNDER_REVIEW.",
            )
        return q

    def review_and_close_query(self, query_id: str, dm_decision: str, dm_notes: str) -> Optional[ClinicalDataQuery]:
        """Data Manager explicitly closes query after verifying resolution."""
        q = self.queries.get(query_id)
        if not q:
            return None
        q.dm_review_notes = dm_notes
        if dm_decision.upper() == "ACCEPT":
            q.status = "CLOSED"
        else:
            q.status = "OPEN"  # Re-opened if site response was insufficient

        q.updated_at = datetime.utcnow().isoformat() + "Z"

        if self.trace:
            self.trace.record(
                node="DATA_MANAGER",
                decision="QUERY_CLOSED" if q.status == "CLOSED" else "QUERY_REOPENED",
                subject_id=q.subject_id,
                actor="DATA_MANAGER_LEAD",
                notes=f"DM reviewed query {query_id}: {dm_notes} (Status: {q.status})",
            )
        return q
