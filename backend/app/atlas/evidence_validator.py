from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.models import LabResult, AdverseEvent, Visit, ConcomitantMedication, Treatment, Subject

class EvidenceValidator:
    @staticmethod
    def validate_record_reference(
        db: Session,
        record_type: str,
        record_id: str,
        subject_usubjid: str = ""
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        rtype = record_type.upper().strip()
        rid = str(record_id).strip()

        if rtype in {"LAB", "LABRESULT"}:
            rec = db.query(LabResult).filter(LabResult.record_id == rid).first()
            if not rec:
                return False, f"Lab record {rid} not found in database.", None
            return True, "Valid lab record.", {
                "record_type": "LAB", "record_id": rec.record_id,
                "test": rec.test_code, "value": f"{rec.raw_value} {rec.normalized_unit}",
                "collection_date": rec.collection_date
            }
        elif rtype in {"AE", "ADVERSE_EVENT"}:
            rec = db.query(AdverseEvent).filter(AdverseEvent.record_id == rid).first()
            if not rec:
                return False, f"Adverse event record {rid} not found in database.", None
            return True, "Valid adverse event record.", {
                "record_type": "AE", "record_id": rec.record_id,
                "term": rec.aeterm, "severity": rec.severity,
                "serious": rec.is_serious, "hospitalized": rec.is_hospitalized,
                "start_date": rec.start_date
            }
        elif rtype in {"CM", "MEDICATION"}:
            rec = db.query(ConcomitantMedication).filter(ConcomitantMedication.record_id == rid).first()
            if not rec:
                return False, f"Concomitant medication {rid} not found in database.", None
            return True, "Valid conmed record.", {
                "record_type": "CM", "record_id": rec.record_id,
                "treatment": rec.cmtrt, "indication": rec.indication,
                "start_date": rec.start_date
            }
        elif rtype in {"VISIT"}:
            rec = db.query(Visit).filter(Visit.id == rid if rid.isdigit() else False).first()
            if not rec:
                return False, f"Visit record {rid} not found.", None
            return True, "Valid visit record.", {
                "record_type": "VISIT", "visit_name": rec.visit_name, "actual_date": rec.actual_date
            }
        elif rtype in {"SUBJECT", "DM"}:
            rec = db.query(Subject).filter(Subject.usubjid == rid).first()
            if not rec:
                return False, f"Subject {rid} not found.", None
            return True, "Valid subject.", {"record_type": "SUBJECT", "usubjid": rec.usubjid, "arm": rec.arm}

        return False, f"Unsupported record type: {record_type}", None
