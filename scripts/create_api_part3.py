from pathlib import Path

out_path = Path("backend/app/api/endpoints.py")

part3 = """
# 6. FINDINGS
@router.get("/findings")
def list_findings(
    study_id: int = 1,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Finding).filter(Finding.study_id == study_id)
    if category:
        query = query.filter(Finding.category == category.upper())
    if severity:
        query = query.filter(Finding.severity == severity.upper())
    if status:
        query = query.filter(Finding.status == status.upper())

    findings = query.order_by(Finding.id.desc()).all()
    res = []
    for f in findings:
        subj_code = f.subject.usubjid if f.subject else "Study-level"
        site_code = f.site.site_id if f.site else "S01"
        ev_items = [
            {
                "record_type": e.record_type, "record_id": e.record_id,
                "field": e.field_name, "value": e.value, "rule": e.protocol_rule
            } for e in f.evidence_items
        ]
        res.append({
            "id": f.id,
            "finding_code": f.finding_code,
            "category": f.category,
            "severity": f.severity,
            "subject_id": subj_code,
            "site_id": site_code,
            "title": f.title,
            "description": f.description,
            "rationale": f.rationale,
            "status": f.status,
            "protocol_version": f.protocol_version,
            "cut_number": f.cut_number,
            "evidence": ev_items,
            "created_at": f.created_at.isoformat()
        })
    return res

@router.get("/findings/{finding_id}")
def get_finding(finding_id: int, db: Session = Depends(get_db)):
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found.")
    return {
        "id": f.id,
        "finding_code": f.finding_code,
        "category": f.category,
        "severity": f.severity,
        "subject_id": f.subject.usubjid if f.subject else None,
        "title": f.title,
        "description": f.description,
        "rationale": f.rationale,
        "status": f.status,
        "protocol_version": f.protocol_version,
        "evidence": [
            {
                "record_type": e.record_type, "record_id": e.record_id,
                "field": e.field_name, "value": e.value, "rule": e.protocol_rule
            } for e in f.evidence_items
        ]
    }

# 7. MONITOR REVIEW CREW
@router.post("/monitor/cycles")
def run_monitoring_cycle(req: RunCycleRequest, db: Session = Depends(get_db)):
    crew = ReviewCrew(db, req.study_id, cut_number=req.cut_number, protocol_version=req.protocol_version)
    result = crew.run()
    return result

@router.get("/monitor/cycles")
def list_monitoring_cycles(study_id: int = 1, db: Session = Depends(get_db)):
    cycles = db.query(MonitoringCycle).filter(MonitoringCycle.study_id == study_id).order_by(MonitoringCycle.id.desc()).all()
    res = []
    for c in cycles:
        res.append({
            "id": c.id,
            "cycle_code": c.cycle_code,
            "cut_number": c.cut_number,
            "protocol_version": c.protocol_version,
            "status": c.status,
            "start_time": c.start_time.isoformat() if c.start_time else None,
            "end_time": c.end_time.isoformat() if c.end_time else None,
            "summary": json.loads(c.summary_json or "{}")
        })
    return res

@router.get("/monitor/cycles/{cycle_id}")
def get_monitoring_cycle(cycle_id: int, db: Session = Depends(get_db)):
    c = db.query(MonitoringCycle).filter(MonitoringCycle.id == cycle_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cycle not found.")
    traces = db.query(TraceEntry).filter(TraceEntry.cycle_id == cycle_id).order_by(TraceEntry.id.asc()).all()
    return {
        "id": c.id,
        "cycle_code": c.cycle_code,
        "cut_number": c.cut_number,
        "protocol_version": c.protocol_version,
        "status": c.status,
        "start_time": c.start_time.isoformat(),
        "end_time": c.end_time.isoformat() if c.end_time else None,
        "summary": json.loads(c.summary_json or "{}"),
        "traces": [
            {
                "node": t.node_name, "action": t.action, "decision": t.decision,
                "timestamp": t.timestamp.isoformat(), "message": t.message
            } for t in traces
        ]
    }

# 8. DATA MANAGER QUERIES
@router.get("/queries")
def list_queries(study_id: int = 1, status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(DBQuery).filter(DBQuery.study_id == study_id)
    if status:
        q = q.filter(DBQuery.status == status.upper())
    queries = q.order_by(DBQuery.id.desc()).all()
    res = []
    for item in queries:
        responses = [
            {"id": r.id, "role": r.responder_role, "text": r.response_text, "date": r.created_at.isoformat()}
            for r in item.responses
        ]
        res.append({
            "id": item.id,
            "query_code": item.query_code,
            "subject_id": item.subject.usubjid if item.subject else "Study",
            "site_id": item.site.site_id if item.site else "S01",
            "domain": item.domain,
            "record_id": item.record_id,
            "cut_number": item.cut_number,
            "problem_description": item.problem_description,
            "requested_action": item.requested_action,
            "status": item.status,
            "created_at": item.created_at.isoformat(),
            "responses": responses
        })
    return res

@router.post("/queries")
def create_query(data: QueryCreate, db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.usubjid == data.subject_id).first() if data.subject_id else None
    q_code = f"Q-{data.study_id}-{int(datetime.utcnow().timestamp())}"
    query = DBQuery(
        query_code=q_code,
        study_id=data.study_id,
        subject_id=subj.id if subj else None,
        site_id=subj.site_id if subj else None,
        domain=data.domain,
        record_id=data.record_id or "",
        problem_description=data.problem_description,
        requested_action=data.requested_action,
        status="OPEN"
    )
    db.add(query)
    db.commit()
    db.refresh(query)
    return query

@router.post("/queries/{query_id}/response")
def respond_to_query(query_id: int, payload: QueryAnswerRequest, db: Session = Depends(get_db)):
    q = db.query(DBQuery).filter(DBQuery.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found.")

    resp = QueryResponse(
        query_id=q.id,
        responder_role="Site Coordinator",
        response_text=payload.response_text
    )
    q.status = "CLOSED"
    db.add(resp)
    db.commit()
    return {"status": "SUCCESS", "message": f"Query {q.query_code} answered and closed.", "query_status": q.status}

# 9. COMPLIANCE & PROTOCOL DEVIATIONS
@router.get("/compliance/deviations")
def list_deviations(study_id: int = 1, db: Session = Depends(get_db)):
    devs = db.query(ProtocolDeviation).filter(ProtocolDeviation.study_id == study_id).order_by(ProtocolDeviation.id.desc()).all()
    return [
        {
            "id": d.id,
            "deviation_code": d.deviation_code,
            "subject_id": d.subject.usubjid if d.subject else "Study",
            "site_id": d.site.site_id if d.site else "S01",
            "rule_code": d.rule_code,
            "protocol_version": d.protocol_version,
            "type": d.deviation_type,
            "severity": d.severity,
            "description": d.description,
            "evidence_ref": d.evidence_ref,
            "status": d.status
        } for d in devs
    ]

@router.get("/compliance/site_flags")
def list_site_flags(study_id: int = 1, db: Session = Depends(get_db)):
    flags = db.query(SiteFlag).filter(SiteFlag.study_id == study_id).all()
    return [
        {
            "id": f.id,
            "site_code": f.site.site_id if f.site else "S01",
            "site_name": f.site.name if f.site else "",
            "flag_code": f.flag_code,
            "reason": f.reason,
            "recurring_count": f.recurring_count,
            "cut_number": f.cut_number,
            "status": f.status
        } for f in flags
    ]
"""

with open(out_path, "a", encoding="utf-8") as f:
    f.write(part3)

print("Part 3 appended successfully")
