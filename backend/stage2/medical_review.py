"""
MONITOR Medical Review Node (Stage 2 Node 2)
Evaluates findings for clinical severity, seriousness, biological plausibility,
and prepares candidate escalations for the Human Gate.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from .trace import TraceLedger


@dataclass
class MedicalReviewAssessment:
    finding_id: str
    subject_id: str
    seriousness: str            # "SERIOUS", "NON_SERIOUS", "POTENTIALLY_SERIOUS"
    plausibility: str           # "HIGH", "MODERATE", "LOW", "UNVERIFIED"
    recommendation: str         # "ESCALATE_TO_HUMAN_GATE", "CONTINUE_MONITORING", "DATA_CLARIFICATION"
    clinical_rationale: str
    hepatology_consult_needed: bool = False
    dose_adjustment_needed: bool = False


class MedicalReviewer:
    def __init__(self, trace_ledger: Optional[TraceLedger] = None):
        self.trace = trace_ledger

    def review_finding(self, finding: Dict[str, Any], protocol_version: str = "v1.0") -> MedicalReviewAssessment:
        f_type = finding.get("type", "")
        f_cat = finding.get("category", "SAFETY")
        subj = finding.get("subject_id", "")
        title = finding.get("title", "")

        if "Hy's Law" in title or "DILI" in title or f_type == "RULE_SAFETY_HYS_LAW":
            assessment = MedicalReviewAssessment(
                finding_id=finding.get("id", ""),
                subject_id=subj,
                seriousness="SERIOUS",
                plausibility="HIGH",
                recommendation="ESCALATE_TO_HUMAN_GATE",
                clinical_rationale=(
                    "Concurrent transaminase elevation (>3x ULN) and hyperbilirubinemia (>2x ULN) "
                    "constitutes high-risk hepatotoxicity. Protocol requires immediate study drug interruption "
                    "and mandatory Medical Monitor authorization."
                ),
                hepatology_consult_needed=True,
                dose_adjustment_needed=True,
            )
        elif "ALT" in title or f_type == "RULE_SAFETY_ALT_ELEVATION":
            assessment = MedicalReviewAssessment(
                finding_id=finding.get("id", ""),
                subject_id=subj,
                seriousness="POTENTIALLY_SERIOUS",
                plausibility="HIGH",
                recommendation="ESCALATE_TO_HUMAN_GATE",
                clinical_rationale="Isolated ALT > 3x ULN. Requires close surveillance and repeat testing before next administration.",
                hepatology_consult_needed=False,
                dose_adjustment_needed=False,
            )
        elif "SAE" in title or finding.get("is_serious"):
            assessment = MedicalReviewAssessment(
                finding_id=finding.get("id", ""),
                subject_id=subj,
                seriousness="SERIOUS",
                plausibility="HIGH",
                recommendation="ESCALATE_TO_HUMAN_GATE",
                clinical_rationale=f"Serious adverse event reported ({title}). Expedited regulatory notification required.",
                hepatology_consult_needed=False,
                dose_adjustment_needed=False,
            )
        else:
            assessment = MedicalReviewAssessment(
                finding_id=finding.get("id", ""),
                subject_id=subj,
                seriousness="NON_SERIOUS",
                plausibility="MODERATE",
                recommendation="CONTINUE_MONITORING",
                clinical_rationale=f"Standard protocol observation ({title}). Manage under routine site monitoring.",
                hepatology_consult_needed=False,
                dose_adjustment_needed=False,
            )

        if self.trace:
            self.trace.record(
                node="MEDICAL_REVIEW",
                decision=assessment.recommendation,
                subject_id=subj,
                finding_id=finding.get("id"),
                protocol_version=protocol_version,
                actor="MEDICAL_REVIEW_AGENT",
                notes=assessment.clinical_rationale,
                result_payload={
                    "seriousness": assessment.seriousness,
                    "plausibility": assessment.plausibility,
                },
            )

        return assessment
