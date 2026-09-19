import json
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    Query, Escalation, Finding, SubjectHistory, SiteFlag, ProtocolDeviation
)

class MemoryService:
    @staticmethod
    def is_query_duplicate(
        db: Session,
        study_id: int,
        domain: str,
        record_id: str,
        problem_snippet: str
    ) -> bool:
        """Checks if an identical or matching query has already been raised in this study."""
        existing = db.query(Query).filter(
            Query.study_id == study_id,
            Query.domain == domain,
            Query.record_id == record_id
        ).first()
        if existing:
            return True
        return False

    @staticmethod
    def is_escalation_duplicate(
        db: Session,
        study_id: int,
        finding_id: int
    ) -> bool:
        """Checks if this finding has already been escalated in any cycle."""
        existing = db.query(Escalation).filter(
            Escalation.finding_id == finding_id
        ).first()
        if existing:
            return True
        return False

    @staticmethod
    def update_subject_history(
        db: Session,
        study_id: int,
        subject_id: int,
        cut_number: int,
        finding_codes: List[str]
    ) -> SubjectHistory:
        hist = db.query(SubjectHistory).filter(
            SubjectHistory.study_id == study_id,
            SubjectHistory.subject_id == subject_id
        ).first()

        if hist:
            hist.cut_number = cut_number
            hist.flagged_count += 1
            existing_findings = json.loads(hist.findings_summary_json or "[]")
            hist.findings_summary_json = json.dumps(list(set(existing_findings + finding_codes)))
        else:
            hist = SubjectHistory(
                study_id=study_id,
                subject_id=subject_id,
                cut_number=cut_number,
                flagged_count=1,
                findings_summary_json=json.dumps(finding_codes)
            )
            db.add(hist)
        db.commit()
        db.refresh(hist)
        return hist

    @staticmethod
    def evaluate_site_recurrence(
        db: Session,
        study_id: int,
        site_id: int,
        cut_number: int
    ) -> Optional[SiteFlag]:
        """If multiple deviations occur at the same site, generate or increment a site-level flag."""
        dev_count = db.query(ProtocolDeviation).filter(
            ProtocolDeviation.study_id == study_id,
            ProtocolDeviation.site_id == site_id
        ).count()

        if dev_count >= 2:
            flag = db.query(SiteFlag).filter(
                SiteFlag.study_id == study_id,
                SiteFlag.site_id == site_id,
                SiteFlag.flag_code == "RECURRING_SITE_DEVIATIONS"
            ).first()
            if flag:
                flag.recurring_count = dev_count
                flag.cut_number = cut_number
            else:
                flag = SiteFlag(
                    study_id=study_id,
                    site_id=site_id,
                    flag_code="RECURRING_SITE_DEVIATIONS",
                    reason=f"Multiple protocol deviations ({dev_count}) accumulated at this investigation site across monitoring cycles.",
                    recurring_count=dev_count,
                    cut_number=cut_number,
                    status="ACTIVE"
                )
                db.add(flag)
            db.commit()
            db.refresh(flag)
            return flag
        return None
