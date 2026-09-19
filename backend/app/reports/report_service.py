import json
import csv
import io
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    MonitoringCycle, CycleReport, Finding, Query, ProtocolDeviation,
    Escalation, EscalationDecision, TraceEntry, Study
)

class ReportService:
    @staticmethod
    def get_cycle_report(db: Session, cycle_id: int) -> Optional[Dict[str, Any]]:
        report = db.query(CycleReport).filter(CycleReport.cycle_id == cycle_id).first()
        if not report:
            # Try to build from cycle data
            cycle = db.query(MonitoringCycle).filter(MonitoringCycle.id == cycle_id).first()
            if not cycle:
                return None
            return {
                "cycle_id": cycle.id,
                "cycle_code": cycle.cycle_code,
                "cut_number": cycle.cut_number,
                "protocol_version": cycle.protocol_version,
                "status": cycle.status,
                "summary": json.loads(cycle.summary_json or "{}")
            }
        data = json.loads(report.report_json)
        data["report_id"] = report.id
        data["cycle_id"] = report.cycle_id

        # Enrich with live database counts
        data["findings_total"] = db.query(Finding).filter(Finding.study_id == report.study_id).count()
        data["safety_findings"] = db.query(Finding).filter(Finding.study_id == report.study_id, Finding.category == "SAFETY").count()
        data["data_findings"] = db.query(Finding).filter(Finding.study_id == report.study_id, Finding.category == "DATA_QUALITY").count()
        data["open_queries"] = db.query(Query).filter(Query.study_id == report.study_id, Query.status == "OPEN").count()
        data["closed_queries"] = db.query(Query).filter(Query.study_id == report.study_id, Query.status == "CLOSED").count()
        data["deviations"] = db.query(ProtocolDeviation).filter(ProtocolDeviation.study_id == report.study_id).count()
        data["escalations"] = db.query(Escalation).filter(Escalation.cycle_id == cycle_id).count()
        data["approved_decisions"] = db.query(EscalationDecision).join(Escalation).filter(Escalation.cycle_id == cycle_id, EscalationDecision.decision == "APPROVED").count()
        data["rejected_decisions"] = db.query(EscalationDecision).join(Escalation).filter(Escalation.cycle_id == cycle_id, EscalationDecision.decision == "REJECTED").count()

        traces = db.query(TraceEntry).filter(TraceEntry.cycle_id == cycle_id).order_by(TraceEntry.id.asc()).all()
        data["traces"] = [
            {
                "node": t.node_name, "action": t.action, "decision": t.decision,
                "timestamp": t.timestamp.isoformat(), "message": t.message
            } for t in traces
        ]
        return data

    @staticmethod
    def export_report_csv(report_data: Dict[str, Any]) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ATLAS + MONITOR — Cycle Review Report"])
        writer.writerow(["Cycle Code", report_data.get("cycle_code")])
        writer.writerow(["Data Cut", report_data.get("cut_number")])
        writer.writerow(["Protocol Version", report_data.get("protocol_version")])
        writer.writerow(["Timestamp", report_data.get("timestamp")])
        writer.writerow([])
        writer.writerow(["Metric", "Count"])
        writer.writerow(["Total Findings", report_data.get("findings_total", 0)])
        writer.writerow(["Safety Findings", report_data.get("safety_findings", 0)])
        writer.writerow(["Data Quality Queries", report_data.get("open_queries", 0)])
        writer.writerow(["Protocol Deviations", report_data.get("deviations", 0)])
        writer.writerow(["Pending Escalations", report_data.get("escalations", 0)])
        writer.writerow([])
        writer.writerow(["Node Trace Entries"])
        writer.writerow(["Node", "Action", "Decision", "Timestamp"])
        for t in report_data.get("traces", []):
            writer.writerow([t.get("node"), t.get("action"), t.get("decision"), t.get("timestamp")])

        return output.getvalue()
