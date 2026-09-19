from pathlib import Path

out_path = Path("backend/app/api/endpoints.py")

part4 = """
# 10. HUMAN GATE & ESCALATIONS
@router.get("/escalations")
def list_escalations(study_id: int = 1, status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Escalation).join(Finding).filter(Finding.study_id == study_id)
    if status:
        q = q.filter(Escalation.status == status.upper())

    escalations = q.order_by(Escalation.id.desc()).all()
    res = []
    for e in escalations:
        f = e.finding
        ev_items = [
            {"record_type": ev.record_type, "record_id": ev.record_id, "field": ev.field_name, "value": ev.value, "rule": ev.protocol_rule}
            for ev in f.evidence_items
        ]
        decisions = [
            {"decision": d.decision, "reason": d.reason, "question": d.clarification_question, "answer": d.clarification_answer, "date": d.decided_at.isoformat()}
            for d in e.decisions
        ]
        res.append({
            "id": e.id,
            "escalation_code": e.escalation_code,
            "finding_id": f.id,
            "finding_code": f.finding_code,
            "finding_title": f.title,
            "category": f.category,
            "subject_id": e.subject.usubjid if e.subject else "Study",
            "site_id": e.site.site_id if e.site else "S01",
            "severity": e.severity,
            "protocol_version": e.protocol_version,
            "proposed_action": e.proposed_action,
            "medical_review_summary": e.medical_review_summary or f.rationale,
            "status": e.status,
            "evidence": ev_items,
            "created_at": e.created_at.isoformat(),
            "decisions": decisions
        })
    return res

@router.post("/escalations/{escalation_id}/decision")
def make_human_gate_decision(
    escalation_id: int,
    payload: EscalationDecisionRequest,
    db: Session = Depends(get_db)
):
    esc = db.query(Escalation).filter(Escalation.id == escalation_id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found.")

    dec_upper = payload.decision.upper().strip()

    if dec_upper == "APPROVED":
        esc.status = "APPROVED"
        esc.finding.status = "RESOLVED"
        decision_rec = EscalationDecision(
            escalation_id=esc.id,
            decision="APPROVED",
            reason=payload.reason or "Serious adverse event confirmed; expedited safety report authorized within 24h."
        )
        db.add(decision_rec)
        db.commit()

        TraceService.log(
            db, esc.cycle_id, esc.finding.study_id, "human_gate",
            action="Medical Monitor APPROVED escalation",
            decision=f"APPROVED: {esc.finding.finding_code} -> Action: {esc.proposed_action}",
            subject_id=esc.subject.usubjid if esc.subject else "",
            finding_id=esc.finding.finding_code,
            message=f"human_gate: {esc.finding.finding_code} {esc.subject.usubjid if esc.subject else ''} -> APPROVED: expedited report"
        )
        return {"status": "SUCCESS", "decision": "APPROVED", "escalation_status": esc.status}

    elif dec_upper == "REJECTED":
        esc.status = "REJECTED"
        esc.finding.status = "MONITORING"
        decision_rec = EscalationDecision(
            escalation_id=esc.id,
            decision="REJECTED",
            reason=payload.reason or "Downgraded to monitoring-only after medical monitor evaluation."
        )
        db.add(decision_rec)
        db.commit()

        TraceService.log(
            db, esc.cycle_id, esc.finding.study_id, "human_gate",
            action="Medical Monitor REJECTED escalation",
            decision=f"REJECTED: {esc.finding.finding_code} downgraded to monitoring",
            subject_id=esc.subject.usubjid if esc.subject else "",
            finding_id=esc.finding.finding_code,
            message=f"human_gate: {esc.finding.finding_code} -> REJECTED: downgraded to monitoring (Reason: {payload.reason})"
        )
        return {"status": "SUCCESS", "decision": "REJECTED", "escalation_status": esc.status}

    elif dec_upper == "CLARIFY":
        question = payload.clarification_question or "What was the ALT at screening, and is there a concomitant hepatotoxic medication?"
        subj_id = esc.subject.usubjid if esc.subject else "042-S02-004"
        
        clarif_res = AIService.generate_clarification_response(question, db, subj_id)
        
        esc.status = "CLARIFY"
        decision_rec = EscalationDecision(
            escalation_id=esc.id,
            decision="CLARIFY",
            reason="Clarification requested by medical monitor.",
            clarification_question=question,
            clarification_answer=clarif_res["answer"],
            clarification_evidence_json=json.dumps(clarif_res["evidence"])
        )
        db.add(decision_rec)
        db.commit()

        TraceService.log(
            db, esc.cycle_id, esc.finding.study_id, "human_gate",
            action="Medical Monitor requested CLARIFICATION",
            decision=f"Queried study database/graph for '{question}' and formulated evidence-backed answer.",
            subject_id=subj_id,
            finding_id=esc.finding.finding_code,
            message=f"human_gate: CLARIFY for {subj_id} -> Answered with evidence and resubmitted to Human Gate."
        )
        return {
            "status": "SUCCESS",
            "decision": "CLARIFY",
            "escalation_status": esc.status,
            "clarification_answer": clarif_res["answer"],
            "evidence": clarif_res["evidence"]
        }

    else:
        raise HTTPException(status_code=400, detail=f"Invalid decision '{payload.decision}'. Must be APPROVED, REJECTED, or CLARIFY.")

# 11. TRACE & CYCLE REPORTS
@router.get("/trace")
def list_traces(study_id: int = 1, node: Optional[str] = None, limit: int = 100, db: Session = Depends(get_db)):
    q = db.query(TraceEntry).filter(TraceEntry.study_id == study_id)
    if node:
        q = q.filter(TraceEntry.node_name == node.lower())
    traces = q.order_by(TraceEntry.id.desc()).limit(limit).all()
    return [
        {
            "id": t.id,
            "cycle_id": t.cycle_id,
            "node_name": t.node_name,
            "timestamp": t.timestamp.isoformat(),
            "action": t.action,
            "decision": t.decision,
            "subject_id": t.subject_id,
            "finding_id": t.finding_id,
            "cut_number": t.cut_number,
            "protocol_version": t.protocol_version,
            "message": t.message
        } for t in traces
    ]

@router.get("/reports/{cycle_id}")
def get_cycle_report(cycle_id: int, db: Session = Depends(get_db)):
    rep = ReportService.get_cycle_report(db, cycle_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found for this cycle.")
    return rep

@router.get("/reports/{cycle_id}/export")
def export_cycle_report_csv(cycle_id: int, db: Session = Depends(get_db)):
    rep = ReportService.get_cycle_report(db, cycle_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found.")
    csv_data = ReportService.export_report_csv(rep)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Cycle_Report_CYC-{cycle_id}.csv"}
    )

# 12. PROTOCOLS & DATA CUT SIMULATOR
@router.get("/protocols")
def get_protocols(study_id: int = 1, db: Session = Depends(get_db)):
    prots = db.query(Protocol).filter(Protocol.study_id == study_id).all()
    res = []
    for p in prots:
        vers = [
            {"id": v.id, "version_str": v.version_str, "effective_date": v.effective_date, "is_active": v.is_active, "amendment_summary": v.amendment_summary}
            for v in p.versions
        ]
        res.append({"id": p.id, "code": p.code, "title": p.title, "versions": vers})
    return res

@router.get("/datacuts")
def list_data_cuts(study_id: int = 1, db: Session = Depends(get_db)):
    return db.query(DataCut).filter(DataCut.study_id == study_id).order_by(DataCut.cut_number.asc()).all()

@router.post("/datacuts/switch")
def switch_data_cut(req: DataCutSwitchRequest, db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == req.study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found.")

    study.current_cut = req.target_cut
    if req.protocol_version:
        study.current_protocol_version = req.protocol_version
    elif req.target_cut >= 2:
        study.current_protocol_version = "v2.0"
    else:
        study.current_protocol_version = "v1.0"

    db.commit()

    crew = ReviewCrew(db, study.id, cut_number=study.current_cut, protocol_version=study.current_protocol_version)
    cycle_res = crew.run()

    return {
        "status": "SUCCESS",
        "current_cut": study.current_cut,
        "current_protocol_version": study.current_protocol_version,
        "cycle": cycle_res
    }

@router.post("/datacuts/compare")
def compare_data_cuts(study_id: int = 1, from_cut: int = 1, to_cut: int = 2, db: Session = Depends(get_db)):
    findings_from = db.query(Finding).filter(Finding.study_id == study_id, Finding.cut_number == from_cut).count()
    findings_to = db.query(Finding).filter(Finding.study_id == study_id, Finding.cut_number == to_cut).count()
    queries_from = db.query(DBQuery).filter(DBQuery.study_id == study_id, DBQuery.cut_number == from_cut).count()
    queries_to = db.query(DBQuery).filter(DBQuery.study_id == study_id, DBQuery.cut_number == to_cut).count()

    return {
        "from_cut": from_cut,
        "to_cut": to_cut,
        "from_protocol": "v1.0" if from_cut == 1 else "v2.0",
        "to_protocol": "v2.0" if to_cut >= 2 else "v1.0",
        "changes": [
            f"Protocol version transitioned from v1.0 to v2.0 (Visit windows tightened to +/- 1-3 days).",
            f"Active findings changed from {findings_from} in Cut {from_cut} to {findings_to} in Cut {to_cut}.",
            f"Data queries evaluated: {queries_to} active queries with 0 duplicate query re-issuances.",
            f"Protocol deviations: additional window violations flagged under v2.0 tighter schedule criteria."
        ]
    }

# 13. SITE OPERATIONS OVERVIEW
@router.get("/site_operations/overview")
def site_operations_overview(site_id: str = "S02", study_id: int = 1, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.study_id == study_id, Site.site_id == site_id).first()
    subjs = db.query(Subject).filter(Subject.study_id == study_id, Subject.site_id == site.id if site else 1).all()
    open_queries = db.query(DBQuery).filter(DBQuery.study_id == study_id, DBQuery.site_id == site.id if site else 1, DBQuery.status == "OPEN").all()
    
    visits_today = [
        {"subject": s.usubjid, "visit": s.visits[-1].visit_name if s.visits else "Visit 2", "time": "10:30 AM", "status": "SCHEDULED"}
        for s in subjs[:3]
    ]
    return {
        "site_id": site.site_id if site else site_id,
        "site_name": site.name if site else "Clinical Site",
        "pi_name": site.pi_name if site else "Principal Investigator",
        "total_subjects": len(subjs),
        "open_queries_count": len(open_queries),
        "visits_today": visits_today,
        "open_queries": [
            {"id": q.id, "code": q.query_code, "subject": q.subject.usubjid if q.subject else "N/A", "desc": q.problem_description, "date": q.created_at.isoformat()}
            for q in open_queries
        ]
    }

# 14. RESEED DATA
@router.post("/reseed")
def reseed_database(db: Session = Depends(get_db)):
    res = DataService.seed_initial_study_data(db)
    return res
"""

with open(out_path, "a", encoding="utf-8") as f:
    f.write(part4)

print("Part 4 appended successfully")
