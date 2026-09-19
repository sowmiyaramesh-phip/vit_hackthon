"""
ATLAS Clinical Protocol Rules Engine
Encapsulates versioned protocol criteria and rules.
Never relies on LLM speculation; uses deterministic medical logic.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
from .evidence import ProtocolRef, RecordRef, EvidenceBundle
from .normalization import NormalizedValue


@dataclass
class ProtocolRuleResult:
    rule_id: str
    triggered: bool
    title: str
    severity: str        # "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"
    category: str        # "SAFETY", "DATA_QUALITY", "COMPLIANCE", "SITE"
    message: str
    evidence_bundle: EvidenceBundle
    recommended_action: str


class ProtocolEngine:
    """
    Evaluates clinical records against versioned trial protocols.
    Supports Protocol v1.0 (effective Jan 2026) and Protocol v2.0 (effective Jun 2026).
    """

    def __init__(self, study_id: str = "ABC-101", protocol_version: str = "v1.0"):
        self.study_id = study_id
        self.protocol_version = protocol_version

    def evaluate_hys_law(
        self,
        usubjid: str,
        alt_norm: Optional[NormalizedValue],
        ast_norm: Optional[NormalizedValue],
        bili_norm: Optional[NormalizedValue],
        alt_ref: Optional[RecordRef] = None,
        ast_ref: Optional[RecordRef] = None,
        bili_ref: Optional[RecordRef] = None,
        alt_uln: float = 56.0,
        ast_uln: float = 40.0,
        bili_uln: float = 1.2,
    ) -> Optional[ProtocolRuleResult]:
        """
        FDA Hy's Law Criteria:
        1. ALT > 3x ULN or AST > 3x ULN
        2. Total Bilirubin > 2x ULN
        """
        alt_val = alt_norm.converted_value if alt_norm and alt_norm.converted_value is not None else 0.0
        ast_val = ast_norm.converted_value if ast_norm and ast_norm.converted_value is not None else 0.0
        bili_val = bili_norm.converted_value if bili_norm and bili_norm.converted_value is not None else 0.0

        alt_elevated = alt_val > (3.0 * alt_uln)
        ast_elevated = ast_val > (3.0 * ast_uln)
        bili_elevated = bili_val > (2.0 * bili_uln)

        if (alt_elevated or ast_elevated) and bili_elevated:
            bundle = EvidenceBundle(
                rationale=(
                    f"Subject {usubjid} meets potential Hy's Law criteria: "
                    f"Transaminase elevation (ALT: {alt_val:.1f} U/L [ULN: {alt_uln}], "
                    f"AST: {ast_val:.1f} U/L [ULN: {ast_uln}]) combined with "
                    f"hyperbilirubinemia (Total Bilirubin: {bili_val:.2f} mg/dL [ULN: {bili_uln}])."
                )
            )
            if alt_ref and alt_elevated:
                bundle.add_record(alt_ref)
            if ast_ref and ast_elevated:
                bundle.add_record(ast_ref)
            if bili_ref and bili_elevated:
                bundle.add_record(bili_ref)

            bundle.add_protocol(
                ProtocolRef(
                    protocol_id=self.study_id,
                    version=self.protocol_version,
                    section="§2.1",
                    title="Drug-Induced Liver Injury (Hy's Law) Criteria",
                    text=(
                        "A subject qualifies as a potential Hy's Law candidate if: "
                        "1. ALT > 3x ULN or AST > 3x ULN, AND 2. Total Bilirubin > 2x ULN. "
                        "Action: Study drug must be immediately interrupted or discontinued, and hepatology consultation requested."
                    ),
                    rule_id="RULE_SAFETY_HYS_LAW",
                )
            )

            return ProtocolRuleResult(
                rule_id="RULE_SAFETY_HYS_LAW",
                triggered=True,
                title="Potential Drug-Induced Liver Injury (Hy's Law Candidate)",
                severity="CRITICAL",
                category="SAFETY",
                message=f"ALT/AST > 3x ULN and Total Bilirubin > 2x ULN confirmed for {usubjid}.",
                evidence_bundle=bundle,
                recommended_action="Immediate study drug interruption; urgent Medical Review and Hepatology consultation.",
            )

        # Isolated ALT elevation > 3x ULN (liver safety signal)
        if alt_elevated:
            bundle = EvidenceBundle(
                rationale=f"ALT elevation {alt_val:.1f} U/L exceeds 3x ULN ({alt_uln} U/L)."
            )
            if alt_ref:
                bundle.add_record(alt_ref)
            bundle.add_protocol(
                ProtocolRef(
                    protocol_id=self.study_id,
                    version=self.protocol_version,
                    section="§2.1",
                    title="Hepatic Transaminase Safety Threshold",
                    text="ALT > 3x ULN requires close hepatic monitoring and repeat testing within 48-72 hours.",
                    rule_id="RULE_SAFETY_ALT_ELEVATION",
                )
            )
            return ProtocolRuleResult(
                rule_id="RULE_SAFETY_ALT_ELEVATION",
                triggered=True,
                title="Elevated Alanine Aminotransferase (> 3x ULN)",
                severity="HIGH",
                category="SAFETY",
                message=f"Marked ALT elevation ({alt_val:.1f} U/L) observed for {usubjid}.",
                evidence_bundle=bundle,
                recommended_action="Repeat liver panel within 48-72 hours; assess for concomitant medications.",
            )

        return None

    def evaluate_visit_window(
        self,
        usubjid: str,
        visit_name: str,
        target_day: int,
        actual_day: int,
        visit_ref: Optional[RecordRef] = None,
    ) -> Optional[ProtocolRuleResult]:
        """
        Evaluates allowable visit schedule windows.
        Protocol v1.0: Window ±7 days.
        Protocol v2.0 (amended): Window ±3 days (tightened).
        """
        allowed_window = 3 if self.protocol_version >= "v2.0" else 7
        deviation_days = abs(actual_day - target_day)

        if deviation_days > allowed_window:
            bundle = EvidenceBundle(
                rationale=(
                    f"Visit '{visit_name}' occurred at Day {actual_day} (target Day {target_day}). "
                    f"Deviation of {deviation_days} days exceeds allowable ±{allowed_window} day window under Protocol {self.protocol_version}."
                )
            )
            if visit_ref:
                bundle.add_record(visit_ref)

            bundle.add_protocol(
                ProtocolRef(
                    protocol_id=self.study_id,
                    version=self.protocol_version,
                    section="§1.1",
                    title="Schedule of Activities & Visit Windows",
                    text=f"Allowable visit tolerance window is ±{allowed_window} days from target protocol day under {self.protocol_version}.",
                    rule_id="RULE_COMPLIANCE_VISIT_WINDOW",
                )
            )

            return ProtocolRuleResult(
                rule_id="RULE_COMPLIANCE_VISIT_WINDOW",
                triggered=True,
                title=f"Protocol Deviation: Visit Schedule Window Exceeded ({visit_name})",
                severity="MEDIUM",
                category="COMPLIANCE",
                message=f"Visit {visit_name} off by {deviation_days} days (max allowable: ±{allowed_window} days under {self.protocol_version}).",
                evidence_bundle=bundle,
                recommended_action="Record protocol deviation log entry; confirm safety assessments completed.",
            )
        return None

    def evaluate_dose_deviation(
        self,
        usubjid: str,
        planned_dose: float,
        actual_dose: float,
        dose_unit: str = "mg",
        dose_ref: Optional[RecordRef] = None,
    ) -> Optional[ProtocolRuleResult]:
        """
        Identifies dosing discrepancies.
        Strict rule: Actual != Planned is a 'Potential Dose Deviation', NOT automatically a clinical safety crisis.
        """
        if planned_dose > 0 and actual_dose != planned_dose:
            bundle = EvidenceBundle(
                rationale=f"Administered dose ({actual_dose} {dose_unit}) differed from prescribed planned dose ({planned_dose} {dose_unit})."
            )
            if dose_ref:
                bundle.add_record(dose_ref)

            bundle.add_protocol(
                ProtocolRef(
                    protocol_id=self.study_id,
                    version=self.protocol_version,
                    section="§3.0",
                    title="Investigational Product Dosing Compliance",
                    text="Dose modifications must follow explicit protocol dose reduction criteria.",
                    rule_id="RULE_COMPLIANCE_DOSE_DEVIATION",
                )
            )

            return ProtocolRuleResult(
                rule_id="RULE_COMPLIANCE_DOSE_DEVIATION",
                triggered=True,
                title="Potential Dose Deviation",
                severity="MEDIUM",
                category="COMPLIANCE",
                message=f"Administered {actual_dose} {dose_unit} vs planned {planned_dose} {dose_unit} for {usubjid}.",
                evidence_bundle=bundle,
                recommended_action="Investigate dispensing record and site dosing log; verify if AE-triggered reduction.",
            )
        return None

    def evaluate_adverse_event_seriousness(
        self,
        usubjid: str,
        ae_term: str,
        aeser_flag: str,
        hospitalized: bool,
        ae_ref: Optional[RecordRef] = None,
    ) -> ProtocolRuleResult:
        """
        Evaluates AE seriousness.
        Recognizes that Hospitalization = YES can establish protocol seriousness even if AESER is incorrectly coded as 'N'.
        """
        is_serious = (str(aeser_flag).upper() == "Y") or hospitalized

        bundle = EvidenceBundle(
            rationale=f"Adverse Event '{ae_term}': AESER='{aeser_flag}', Hospitalization={'YES' if hospitalized else 'NO'}."
        )
        if ae_ref:
            bundle.add_record(ae_ref)

        bundle.add_protocol(
            ProtocolRef(
                protocol_id=self.study_id,
                version=self.protocol_version,
                section="§4.2",
                title="Serious Adverse Event (SAE) Definition",
                text="An AE requiring or prolonging inpatient hospitalization qualifies as an SAE regardless of preliminary site designation.",
                rule_id="RULE_SAFETY_SAE_CRITERIA",
            )
        )

        if not (str(aeser_flag).upper() == "Y") and hospitalized:
            return ProtocolRuleResult(
                rule_id="RULE_DATA_SAE_MISCODED",
                triggered=True,
                title="Potential Miscoded SAE (Hospitalization without SAE Flag)",
                severity="HIGH",
                category="DATA_QUALITY",
                message=f"Event '{ae_term}' involved hospitalization but AESER is not marked 'Y'.",
                evidence_bundle=bundle,
                recommended_action="Issue data query to investigator to reconcile SAE status.",
            )

        return ProtocolRuleResult(
            rule_id="RULE_SAFETY_SAE_VERIFIED",
            triggered=is_serious,
            title=f"Serious Adverse Event: {ae_term}" if is_serious else f"Non-Serious AE: {ae_term}",
            severity="HIGH" if is_serious else "LOW",
            category="SAFETY",
            message=f"SAE verified for {usubjid}: {ae_term}" if is_serious else f"Standard AE: {ae_term}",
            evidence_bundle=bundle,
            recommended_action="Expedited pharmacovigilance notification required within 24h" if is_serious else "Routine monitoring.",
        )
