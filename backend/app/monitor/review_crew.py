import uuid
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    Study, Site, Subject, Visit, LabResult, AdverseEvent, ConcomitantMedication,
    Finding, Evidence, MedicalReview, Query, ProtocolDeviation, SiteFlag,
    MonitoringCycle, Escalation, TraceEntry, CycleReport
)
from app.protocol.rules_engine import ProtocolRulesEngine
from app.trace.trace_service import TraceService
from app.memory.memory_service import MemoryService

class ReviewCrew:
    """
    Executes the 6-node clinical monitoring workflow in strict order:
    1. detect
    2. medical_review
    3. data_manager
    4. compliance
    5. human_gate
    6. execute
    """

    def __init__(self, db: Session, study_id: int, cut_number: Optional[int] = None, protocol_version: Optional[str] = None):
        self.db = db
        self.study = db.query(Study).filter(Study.id == study_id).first()
        if not self.study:
            raise ValueError(f"Study ID {study_id} not found.")

        self.study_id = study_id
        self.cut_number = cut_number or self.study.current_cut
        self.protocol_version = protocol_version or self.study.current_protocol_version
        self.cycle: Optional[MonitoringCycle] = None

    def run(self) -> Dict[str, Any]:
        # Initialize cycle
        cycle_code = f"CYC-{self.study.study_id}-CUT{self.cut_number}-{uuid.uuid4().hex[:8].upper()}"
        self.cycle = MonitoringCycle(
            cycle_code=cycle_code,
            study_id=self.study_id,
            cut_number=self.cut_number,
            protocol_version=self.protocol_version,
            status="RUNNING",
            start_time=datetime.utcnow()
        )
        self.db.add(self.cycle)
        self.db.commit()
        self.db.refresh(self.cycle)

        # 1. DETECT
        detect_res = self.node_detect()

        # 2. MEDICAL REVIEW
        med_res = self.node_medical_review(detect_res["findings"])

        # 3. DATA MANAGER
        dm_res = self.node_data_manager(detect_res["data_issues"])

        # 4. COMPLIANCE
        comp_res = self.node_compliance()

        # 5. HUMAN GATE
        hg_res = self.node_human_gate(med_res["escalation_drafts"], comp_res.get("site_escalation"))

        # 6. EXECUTE
        exec_res = self.node_execute(detect_res, med_res, dm_res, comp_res, hg_res)

        return {
            "cycle_id": self.cycle.id,
            "cycle_code": self.cycle.cycle_code,
            "status": "COMPLETED",
            "cut_number": self.cut_number,
            "protocol_version": self.protocol_version,
            "detect": detect_res,
            "medical_review": med_res,
            "data_manager": dm_res,
            "compliance": comp_res,
            "human_gate": hg_res,
            "execute": exec_res
        }

    def node_detect(self) -> Dict[str, Any]:
        """Node 1: DETECT. Finds everything relevant in the current cut."""
        safety_findings = []
        data_issues = []
        subjects = self.db.query(Subject).filter(Subject.study_id == self.study_id).all()

        for subj in subjects:
            # 1. Miscoded Serious AEs (Scenario A: AESHOSP=Y, AESER=N)
            for ae in subj.adverse_events:
                sae_eval = ProtocolRulesEngine.evaluate_sae_miscoding({
                    "record_id": ae.record_id,
                    "is_hospitalized": ae.is_hospitalized,
                    "is_serious": ae.is_serious,
                    "aeterm": ae.aeterm
                })
                if sae_eval.get("miscoded"):
                    f_code = sae_eval["finding_code"]
                    f = self.db.query(Finding).filter(Finding.finding_code == f_code).first()
                    if not f:
                        f = Finding(
                            finding_code=f_code,
                            category="SAFETY",
                            severity="CRITICAL",
                            subject_id=subj.id,
                            site_id=subj.site_id,
                            study_id=self.study_id,
                            cut_number=self.cut_number,
                            protocol_version=self.protocol_version,
                            title=sae_eval["title"],
                            description=sae_eval["rationale"],
                            rationale=sae_eval["rationale"],
                            status="OPEN"
                        )
                        self.db.add(f)
                        self.db.commit()
                        self.db.refresh(f)
                        # Add evidence
                        ev = Evidence(
                            finding_id=f.id,
                            record_type="AE",
                            record_id=ae.record_id,
                            subject_id=subj.usubjid,
                            site_id=subj.site.site_id if subj.site else "",
                            field_name="AESHOSP / AESER",
                            value=f"AESHOSP={ae.is_hospitalized}, AESER={ae.is_serious}",
                            expected_value="AESER=Y",
                            protocol_rule="ICH-GCP E2A: Hospitalization mandates SAE classification"
                        )
                        self.db.add(ev)
                        self.db.commit()
                    safety_findings.append(f)

            # 2. Hy's Law Detection
            labs_dict = [
                {
                    "record_id": lb.record_id, "test_code": lb.test_code,
                    "normalized_value": lb.normalized_value, "uln": lb.uln,
                    "collection_date": lb.collection_date
                } for lb in subj.labs
            ]
            scr_alt = next((lb for lb in subj.labs if "SCREEN" in str(lb.visit_name).upper() and lb.test_code == "ALT"), None)
            scr_elevated = bool(scr_alt and scr_alt.uln and scr_alt.normalized_value and scr_alt.normalized_value > scr_alt.uln)
            
            hl_res = ProtocolRulesEngine.evaluate_hys_law(labs_dict, screening_alt_elevated=scr_elevated)
            if hl_res["candidate"]:
                f_code = f"HYS_LAW_{subj.usubjid}"
                f = self.db.query(Finding).filter(Finding.finding_code == f_code).first()
                if not f:
                    f = Finding(
                        finding_code=f_code,
                        category="SAFETY",
                        severity=hl_res["severity"],
                        subject_id=subj.id,
                        site_id=subj.site_id,
                        study_id=self.study_id,
                        cut_number=self.cut_number,
                        protocol_version=self.protocol_version,
                        title=f"Potential Hy's Law Signal: Subject {subj.usubjid}",
                        description=hl_res["rationale"],
                        rationale=hl_res["rationale"],
                        status="MONITORING" if hl_res["decision"] == "MONITOR_ONLY" else "OPEN"
                    )
                    self.db.add(f)
                    self.db.commit()
                    self.db.refresh(f)
                    for ev_rec in hl_res["evidence"]:
                        ev = Evidence(
                            finding_id=f.id,
                            record_type="LAB",
                            record_id=ev_rec["record_id"],
                            subject_id=subj.usubjid,
                            site_id=subj.site.site_id if subj.site else "",
                            field_name=ev_rec["test_code"],
                            value=f"{ev_rec['normalized_value']} U/L (ULN {ev_rec['uln']})",
                            expected_value="< 3x ULN",
                            protocol_rule="Protocol Section 2: Hy's Law Criteria"
                        )
                        self.db.add(ev)
                    self.db.commit()
                safety_findings.append(f)

            # 3. Data Inconsistencies (Scenario B: Pre-dose AE)
            for ae in subj.adverse_events:
                if subj.rfstdtc and ae.start_date and ae.start_date < subj.rfstdtc:
                    data_issues.append({
                        "type": "PRE_DOSE_AE",
                        "subject": subj,
                        "record_id": ae.record_id,
                        "term": ae.aeterm,
                        "start_date": ae.start_date,
                        "first_dose": subj.rfstdtc
                    })

        msg = f"detect: {len(safety_findings) + len(data_issues)} findings under protocol {self.protocol_version} - safety {len(safety_findings)}, data {len(data_issues)}"
        TraceService.log(
            self.db, self.cycle.id, self.study_id, "detect",
            action="Executed ATLAS study finding detection",
            decision=f"Found {len(safety_findings)} safety findings, {len(data_issues)} data quality findings",
            cut_number=self.cut_number,
            protocol_version=self.protocol_version,
            message=msg
        )
        return {"findings": safety_findings, "data_issues": data_issues, "summary": msg}

    def node_medical_review(self, findings: List[Finding]) -> Dict[str, Any]:
        """Node 2: MEDICAL REVIEW. Evaluates clinical seriousness and determines escalation vs monitoring-only."""
        escalation_drafts = []
        mon_only_count = 0

        for f in findings:
            mr = self.db.query(MedicalReview).filter(MedicalReview.finding_id == f.id).first()
            if not mr:
                # Check if liver candidate with baseline screening elevation (Scenario C)
                if "screening ALT was already elevated" in (f.rationale or ""):
                    mr = MedicalReview(
                        finding_id=f.id,
                        cycle_id=self.cycle.id,
                        seriousness_rating="NON_SERIOUS",
                        plausibility="PRE_EXISTING",
                        clinical_significance="MODERATE",
                        rationale="Liver-signal candidate kept monitor-only because screening ALT was already elevated prior to exposure (baseline abnormality, non-drug induced).",
                        recommendation="MONITOR_ONLY",
                        status="COMPLETED"
                    )
                    f.status = "MONITORING"
                    mon_only_count += 1
                elif "SAE_MISCODED" in f.finding_code or f.severity == "CRITICAL":
                    mr = MedicalReview(
                        finding_id=f.id,
                        cycle_id=self.cycle.id,
                        seriousness_rating="SERIOUS",
                        plausibility="PLAUSIBLE",
                        clinical_significance="CRITICAL",
                        rationale="Inpatient hospitalization confirms serious event per ICH-GCP. Misclassification must be corrected immediately.",
                        recommendation="ESCALATE",
                        alternatives_considered="Maintain non-serious status (Rejected: violates regulatory protocol).",
                        status="COMPLETED"
                    )
                    escalation_drafts.append(f)
                else:
                    mr = MedicalReview(
                        finding_id=f.id,
                        cycle_id=self.cycle.id,
                        seriousness_rating="MODERATE",
                        plausibility="POSSIBLE",
                        clinical_significance="MODERATE",
                        recommendation="MONITOR_ONLY",
                        status="COMPLETED"
                    )
                    mon_only_count += 1
                self.db.add(mr)
                self.db.commit()

        msg = f"medical_review: {len(escalation_drafts)} escalation drafts; {mon_only_count} candidates kept monitor-only"
        TraceService.log(
            self.db, self.cycle.id, self.study_id, "medical_review",
            action="Completed clinical significance assessment",
            decision=f"Drafted {len(escalation_drafts)} escalations, {mon_only_count} monitoring-only",
            cut_number=self.cut_number,
            protocol_version=self.protocol_version,
            message=msg
        )
        return {"escalation_drafts": escalation_drafts, "monitor_only_count": mon_only_count, "summary": msg}

    def node_data_manager(self, data_issues: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Node 3: DATA MANAGER. Emits actionable queries with zero duplicates."""
        new_queries = 0
        suppressed_dups = 0

        for issue in data_issues:
            subj = issue["subject"]
            rec_id = issue["record_id"]
            prob_desc = f"AE '{issue['term']}' starts {issue['start_date']}, before first dose {issue['first_dose']}."
            req_act = "Please verify the AE start date against source documents and correct or confirm."

            # Check duplicate prevention
            if MemoryService.is_query_duplicate(self.db, self.study_id, "AE", rec_id, prob_desc):
                suppressed_dups += 1
                continue

            q_code = f"Q-{self.study.study_id}-{rec_id}"
            q = Query(
                query_code=q_code,
                study_id=self.study_id,
                subject_id=subj.id,
                site_id=subj.site_id,
                domain="AE",
                record_id=rec_id,
                cut_number=self.cut_number,
                problem_description=prob_desc,
                requested_action=req_act,
                status="OPEN"
            )
            self.db.add(q)
            self.db.commit()
            new_queries += 1

        msg = f"data_manager: {new_queries} queries raised; {suppressed_dups} duplicates suppressed"
        TraceService.log(
            self.db, self.cycle.id, self.study_id, "data_manager",
            action="Evaluated data-quality inconsistencies and queries",
            decision=f"Raised {new_queries} queries, suppressed {suppressed_dups} duplicates",
            cut_number=self.cut_number,
            protocol_version=self.protocol_version,
            message=msg
        )
        return {"new_queries": new_queries, "duplicates_suppressed": suppressed_dups, "summary": msg}

    def node_compliance(self) -> Dict[str, Any]:
        """Node 4: COMPLIANCE. Evaluates protocol deviations under current protocol version."""
        deviations = []
        subjects = self.db.query(Subject).filter(Subject.study_id == self.study_id).all()

        site_deviation_counts: Dict[int, int] = {}

        for subj in subjects:
            for v in subj.visits:
                comp = ProtocolRulesEngine.check_visit_window_compliance(
                    v.visit_name, v.actual_date, subj.rfstdtc, self.protocol_version
                )
                if comp["is_out_of_window"]:
                    d_code = f"DEV-{subj.usubjid}-{v.visit_name.replace(' ', '_')}"
                    existing_dev = self.db.query(ProtocolDeviation).filter(ProtocolDeviation.deviation_code == d_code).first()
                    if not existing_dev:
                        dev = ProtocolDeviation(
                            deviation_code=d_code,
                            study_id=self.study_id,
                            subject_id=subj.id,
                            site_id=subj.site_id,
                            rule_code=f"WINDOW_{self.protocol_version}",
                            protocol_version=self.protocol_version,
                            deviation_type="VISIT_WINDOW",
                            severity="MAJOR" if abs(comp["deviation_days"]) > 3 else "MINOR",
                            description=f"{v.visit_name} occurred on Study Day {comp['study_day']}, outside allowable window {comp['window']} by {comp['deviation_days']} days under protocol {self.protocol_version}.",
                            evidence_ref=f"VISIT-{v.id}",
                            status="OPEN"
                        )
                        self.db.add(dev)
                        self.db.commit()
                        deviations.append(dev)
                        site_deviation_counts[subj.site_id] = site_deviation_counts.get(subj.site_id, 0) + 1

        # Check Site-level recurring problems (Scenario D)
        site_flags_raised = 0
        site_escalation = None
        for site_id, count in site_deviation_counts.items():
            if count >= 2:
                flag = MemoryService.evaluate_site_recurrence(self.db, self.study_id, site_id, self.cut_number)
                if flag:
                    site_flags_raised += 1
                    site_obj = self.db.query(Site).filter(Site.id == site_id).first()
                    site_escalation = {
                        "site_id": site_id,
                        "site_code": site_obj.site_id if site_obj else "S01",
                        "title": f"Site {site_obj.site_id if site_obj else 'S01'} Dosing / Schedule Non-Compliance Pattern",
                        "proposed_action": "Issue Site Quality Notice & mandatory re-training for clinical trial coordinator.",
                        "reason": f"Accumulated {count} protocol deviations across subjects at this investigational site."
                    }

        msg = f"compliance: {len(deviations)} deviations under {self.protocol_version}; {site_flags_raised} site flags"
        TraceService.log(
            self.db, self.cycle.id, self.study_id, "compliance",
            action=f"Protocol compliance audit under {self.protocol_version}",
            decision=f"Identified {len(deviations)} deviations and {site_flags_raised} site-level patterns",
            cut_number=self.cut_number,
            protocol_version=self.protocol_version,
            message=msg
        )
        return {"deviations_count": len(deviations), "site_flags": site_flags_raised, "site_escalation": site_escalation, "summary": msg}

    def node_human_gate(self, escalation_drafts: List[Finding], site_escalation: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Node 5: HUMAN GATE. Prepares pending escalations for Medical Monitor review."""
        created_escalations = 0

        for f in escalation_drafts:
            if MemoryService.is_escalation_duplicate(self.db, self.study_id, f.id):
                continue

            esc_code = f"ESC-{self.study.study_id}-{f.finding_code}"
            esc = Escalation(
                escalation_code=esc_code,
                cycle_id=self.cycle.id,
                finding_id=f.id,
                subject_id=f.subject_id,
                site_id=f.site_id,
                severity=f.severity,
                protocol_version=self.protocol_version,
                proposed_action="Expedited safety reporting to Sponsor Safety Board within 24 hours.",
                medical_review_summary=f.rationale,
                status="PENDING"
            )
            self.db.add(esc)
            self.db.commit()
            created_escalations += 1

        msg = f"human_gate: {created_escalations} escalations await the medical monitor"
        TraceService.log(
            self.db, self.cycle.id, self.study_id, "human_gate",
            action="Submitted safety escalations to Human Gate",
            decision=f"{created_escalations} escalations pending medical monitor decision",
            cut_number=self.cut_number,
            protocol_version=self.protocol_version,
            message=msg
        )
        return {"escalations_pending": created_escalations, "summary": msg}

    def node_execute(self, detect_res, med_res, dm_res, comp_res, hg_res) -> Dict[str, Any]:
        """Node 6: EXECUTE. Finalizes cycle status and generates review report."""
        self.cycle.status = "COMPLETED"
        self.cycle.end_time = datetime.utcnow()
        summary = {
            "findings_count": len(detect_res["findings"]),
            "data_queries_raised": dm_res["new_queries"],
            "deviations_count": comp_res["deviations_count"],
            "escalations_pending": hg_res["escalations_pending"]
        }
        self.cycle.summary_json = json.dumps(summary)
        self.db.commit()

        # Update subject histories
        subjects = self.db.query(Subject).filter(Subject.study_id == self.study_id).all()
        for s in subjects:
            f_codes = [f.finding_code for f in self.db.query(Finding).filter(Finding.subject_id == s.id).all()]
            if f_codes:
                MemoryService.update_subject_history(self.db, self.study_id, s.id, self.cut_number, f_codes)

        # Generate Cycle Report
        report_data = {
            "cycle_code": self.cycle.cycle_code,
            "cut_number": self.cut_number,
            "protocol_version": self.protocol_version,
            "timestamp": datetime.utcnow().isoformat(),
            "nodes": {
                "detect": detect_res["summary"],
                "medical_review": med_res["summary"],
                "data_manager": dm_res["summary"],
                "compliance": comp_res["summary"],
                "human_gate": hg_res["summary"]
            },
            "summary": summary
        }
        report = CycleReport(
            cycle_id=self.cycle.id,
            study_id=self.study_id,
            cut_number=self.cut_number,
            protocol_version=self.protocol_version,
            report_json=json.dumps(report_data)
        )
        self.db.add(report)
        self.db.commit()

        msg = "execute: cycle complete"
        TraceService.log(
            self.db, self.cycle.id, self.study_id, "execute",
            action="Monitoring cycle execution concluded",
            decision="Generated Cycle Review Report and updated monitoring memory",
            cut_number=self.cut_number,
            protocol_version=self.protocol_version,
            message=msg
        )
        return {"report_id": report.id, "summary": msg}
