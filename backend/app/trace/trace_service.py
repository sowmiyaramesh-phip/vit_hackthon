import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import TraceEntry

class TraceService:
    @staticmethod
    def log(
        db: Session,
        cycle_id: Optional[int],
        study_id: int,
        node_name: str,
        action: str,
        decision: str = "",
        subject_id: str = "",
        finding_id: str = "",
        evidence_ids: Optional[List[str]] = None,
        cut_number: int = 1,
        protocol_version: str = "v1.0",
        user_id: Optional[int] = None,
        message: str = ""
    ) -> TraceEntry:
        ev_json = json.dumps(evidence_ids or [])
        entry = TraceEntry(
            cycle_id=cycle_id,
            study_id=study_id,
            node_name=node_name,
            timestamp=datetime.utcnow(),
            action=action,
            decision=decision,
            subject_id=subject_id,
            finding_id=finding_id,
            evidence_ids_json=ev_json,
            cut_number=cut_number,
            protocol_version=protocol_version,
            user_id=user_id,
            message=message or f"[{node_name}] {action}"
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def get_cycle_traces(db: Session, cycle_id: int) -> List[TraceEntry]:
        return db.query(TraceEntry).filter(TraceEntry.cycle_id == cycle_id).order_by(TraceEntry.id.asc()).all()

    @staticmethod
    def get_study_traces(db: Session, study_id: int, limit: int = 150) -> List[TraceEntry]:
        return db.query(TraceEntry).filter(TraceEntry.study_id == study_id).order_by(TraceEntry.id.desc()).limit(limit).all()
