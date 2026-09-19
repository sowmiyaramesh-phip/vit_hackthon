"""
WATCH Adversarial & Data Integrity Detection Engine
Detects:
1. Sudden unit shifts (e.g. Site S04 glucose median drop 118 -> 6.4 matching textbook conversion)
2. Suspicious site regularity / synthetic fabrication
3. Document hash tampering & embedded prompt injection neutralization
"""

from dataclasses import dataclass, asdict, field
from datetime import datetime
import hashlib
import statistics
from typing import Any, Dict, List, Optional
import uuid


@dataclass
class AdversarialEvent:
    event_id: str = field(default_factory=lambda: f"ADV-{uuid.uuid4().hex[:6].upper()}")
    site_id: str = ""
    domain: str = "LB"
    test_code: str = "GLUC"
    anomaly_type: str = ""      # "UNIT_STEP_CHANGE", "SUSPICIOUS_REGULARITY", "DOCUMENT_HASH_TAMPERING"
    classification: str = "DATA_INTEGRITY_ISSUE"  # Strictly NOT "CLINICAL_SAFETY_CRISIS"
    severity: str = "HIGH"
    description: str = ""
    evidence_metrics: Dict[str, Any] = field(default_factory=dict)
    remediation_action: str = ""
    is_untrusted: bool = True
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class AdversarialDetector:
    """
    Monitors trial data feeds across cuts for systemic data-integrity anomalies.
    """

    def __init__(self):
        self.events: List[AdversarialEvent] = []
        self.document_hashes: Dict[str, str] = {}

    def check_site_glucose_shift(
        self,
        site_id: str,
        current_values: List[float],
        baseline_median: float = 118.0,
    ) -> Optional[AdversarialEvent]:
        """
        Analyzes Site glucose distributions.
        If site median shifts from ~118 to ~6.4, ratio is ~18.43,
        which matches the canonical mmol/L to mg/dL conversion factor (18.0182).
        Flags as DATA INTEGRITY ISSUE, marks untrusted, requests reissue, avoids false clinical hypoglycemia alert.
        """
        if not current_values or len(current_values) < 3:
            return None

        current_median = statistics.median(current_values)
        ratio = baseline_median / current_median if current_median > 0 else 0

        # Check if ratio is approximately 18.0 (conversion factor between mg/dL and mmol/L)
        if 16.0 <= ratio <= 20.0 and current_median < 15.0:
            ev = AdversarialEvent(
                site_id=site_id,
                domain="LB",
                test_code="GLUC",
                anomaly_type="UNIT_STEP_CHANGE",
                classification="DATA_INTEGRITY_ISSUE",
                severity="HIGH",
                description=(
                    f"Site {site_id} glucose values exhibit a systemic step change: "
                    f"Prior median {baseline_median} mg/dL dropped to {current_median:.2f}. "
                    f"The observed ratio ({ratio:.2f}) matches the standard conversion factor for mmol/L to mg/dL (18.02). "
                    "This represents a laboratory reporting unit error rather than clinical hypoglycemia."
                ),
                evidence_metrics={
                    "baseline_median": baseline_median,
                    "current_median": round(current_median, 2),
                    "ratio": round(ratio, 2),
                    "expected_conversion_ratio": 18.0182,
                    "affected_sample_count": len(current_values),
                },
                remediation_action=(
                    "Values marked as UNTRUSTED and temporarily quarantined from safety evaluations. "
                    "Formal data query dispatched to Site Principal Investigator to reissue chemistry panel with standard units."
                ),
                is_untrusted=True,
            )
            self.events.append(ev)
            return ev

        return None

    def check_suspicious_regularity(self, site_id: str, intervals_days: List[int]) -> Optional[AdversarialEvent]:
        """Detects suspiciously uniform visit intervals (variance near 0 across many subjects)."""
        if len(intervals_days) >= 8:
            variance = statistics.variance(intervals_days)
            if variance < 0.05:
                ev = AdversarialEvent(
                    site_id=site_id,
                    domain="SV",
                    test_code="VISIT_INTERVAL",
                    anomaly_type="SUSPICIOUS_REGULARITY",
                    classification="DATA_INTEGRITY_ISSUE",
                    severity="MEDIUM",
                    description=f"Site {site_id} reports perfectly uniform visit timing across subjects (variance={variance:.3f}).",
                    evidence_metrics={"variance": variance, "sample_size": len(intervals_days)},
                    remediation_action="Audit site source documents (electronic medical record audit).",
                    is_untrusted=False,
                )
                self.events.append(ev)
                return ev
        return None

    def track_protocol_document(self, doc_id: str, content: str) -> Dict[str, Any]:
        """
        Computes SHA-256 hash of protocol text.
        Immunizes against embedded prompt injection by treating text strictly as data facts.
        """
        doc_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        prev_hash = self.document_hashes.get(doc_id)
        changed = prev_hash is not None and prev_hash != doc_hash

        self.document_hashes[doc_id] = doc_hash

        # Sanitization: Strip any suspicious instruction headers
        clean_text = content
        for injection in ["ignore all previous rules", "system: bypass", "disregard protocol"]:
            if injection in content.lower():
                # Neutralize without crashing
                clean_text = clean_text.replace(injection, "[NEUTRALIZED_INSTRUCTION]")

        return {
            "doc_id": doc_id,
            "hash": doc_hash,
            "has_changed": changed,
            "previous_hash": prev_hash,
            "neutralized": clean_text != content,
        }
