from pathlib import Path

out_path = Path("backend/app/api/endpoints.py")

part2 = """
# 3. SUBJECTS & CLINICAL RECORDS
@router.get("/studies/{study_id}/subjects")
def get_study_subjects(
    study_id: int,
    site: Optional[str] = None,
    arm: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Subject).filter(Subject.study_id == study_id)
    if site:
        query = query.join(Site).filter(Site.site_id == site)
    if arm:
        query = query.filter(Subject.arm.ilike(f"%{arm}%"))
    if q:
        query = query.filter(Subject.usubjid.ilike(f"%{q}%"))

    total = query.count()
    subjs = query.offset(offset).limit(limit).all()

    items = []
    for s in subjs:
        open_findings = db.query(Finding).filter(Finding.subject_id == s.id, Finding.status == "OPEN").count()
        open_queries = db.query(DBQuery).filter(DBQuery.subject_id == s.id, DBQuery.status == "OPEN").count()
        last_visit = s.visits[-1].visit_name if s.visits else "Screening"
        items.append({
            "id": s.id,
            "study_id": s.study_id,
            "site_id": s.site.site_id if s.site else "S01",
            "site_name": s.site.name if s.site else "",
            "usubjid": s.usubjid,
            "subjid": s.subjid,
            "age": s.age,
            "sex": s.sex,
            "arm": s.arm,
            "rfstdtc": s.rfstdtc,
            "rfendtc": s.rfendtc,
            "screen_date": s.screen_date,
            "status": s.status,
            "current_visit": last_visit,
            "open_findings_count": open_findings,
            "open_queries_count": open_queries,
            "total_aes": len(s.adverse_events),
            "total_labs": len(s.labs)
        })
    return {"total": total, "items": items}

@router.post("/studies/{study_id}/subjects")
def create_subject(study_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    payload["study_id"] = study_id
    res = DataService.manual_create_subject(db, payload)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("errors", ["Validation error"]))
    return res

@router.get("/subjects/{usubjid}")
def get_subject_detail(usubjid: str, db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.usubjid == usubjid).first()
    if not subj:
        raise HTTPException(status_code=404, detail=f"Subject {usubjid} not found.")
    return {
        "id": subj.id,
        "study_id": subj.study_id,
        "site_id": subj.site.site_id if subj.site else "S01",
        "site_name": subj.site.name if subj.site else "",
        "usubjid": subj.usubjid,
        "age": subj.age,
        "sex": subj.sex,
        "arm": subj.arm,
        "rfstdtc": subj.rfstdtc,
        "screen_date": subj.screen_date,
        "status": subj.status
    }

@router.get("/subjects/{usubjid}/360")
def get_subject_360(usubjid: str, db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.usubjid == usubjid).first()
    if not subj:
        raise HTTPException(status_code=404, detail=f"Subject {usubjid} not found.")

    timeline = []
    if subj.screen_date:
        timeline.append({"date": subj.screen_date, "type": "MILESTONE", "title": "Screening", "details": f"Screening visit on {subj.screen_date}"})
    if subj.rfstdtc:
        timeline.append({"date": subj.rfstdtc, "type": "MILESTONE", "title": "First Dose", "details": f"First study drug exposure ({subj.arm})"})

    for v in subj.visits:
        timeline.append({"date": v.actual_date, "type": "VISIT", "title": v.visit_name, "details": f"Scheduled Day {v.scheduled_day}", "record_id": f"VISIT-{v.id}"})

    for ae in subj.adverse_events:
        timeline.append({
            "date": ae.start_date, "type": "ADVERSE_EVENT", "title": f"AE: {ae.aeterm}",
            "severity": ae.severity, "serious": ae.is_serious, "hospitalized": ae.is_hospitalized,
            "details": f"Severity: {ae.severity}, Serious: {ae.is_serious}, Hosp: {ae.is_hospitalized}",
            "record_id": ae.record_id
        })

    for cm in subj.conmeds:
        timeline.append({"date": cm.start_date, "type": "CONMED", "title": f"Med: {cm.cmtrt}", "details": f"Indication: {cm.indication}", "record_id": cm.record_id})

    timeline = sorted([t for t in timeline if t.get("date")], key=lambda x: x["date"])

    lab_trends: Dict[str, List[Dict[str, Any]]] = {}
    for lb in subj.labs:
        t = lb.test_code.upper()
        if t not in lab_trends:
            lab_trends[t] = []
        lab_trends[t].append({
            "visit": lb.visit_name,
            "date": lb.collection_date,
            "raw_value": lb.raw_value,
            "normalized_value": lb.normalized_value,
            "unit": lb.normalized_unit,
            "uln": lb.uln,
            "ratio": lb.ratio_to_uln,
            "is_abnormal": lb.is_abnormal,
            "record_id": lb.record_id
        })

    findings = db.query(Finding).filter(Finding.subject_id == subj.id).all()
    queries = db.query(DBQuery).filter(DBQuery.subject_id == subj.id).all()
    deviations = db.query(ProtocolDeviation).filter(ProtocolDeviation.subject_id == subj.id).all()

    return {
        "usubjid": subj.usubjid,
        "site": subj.site.site_id if subj.site else "S01",
        "site_name": subj.site.name if subj.site else "",
        "arm": subj.arm,
        "age": subj.age,
        "sex": subj.sex,
        "rfstdtc": subj.rfstdtc,
        "screen_date": subj.screen_date,
        "status": subj.status,
        "timeline": timeline,
        "lab_trends": lab_trends,
        "adverse_events": [
            {
                "record_id": ae.record_id, "term": ae.aeterm, "severity": ae.severity,
                "serious": ae.is_serious, "hospitalized": ae.is_hospitalized,
                "start_date": ae.start_date, "end_date": ae.end_date,
                "causality": ae.causality, "action_taken": ae.action_taken,
                "is_sae_miscoded": ae.is_sae_miscoded
            } for ae in subj.adverse_events
        ],
        "conmeds": [
            {
                "record_id": cm.record_id, "treatment": cm.cmtrt, "indication": cm.indication,
                "start_date": cm.start_date, "is_hepatotoxic": cm.is_hepatotoxic
            } for cm in subj.conmeds
        ],
        "findings": [
            {
                "id": f.id, "code": f.finding_code, "category": f.category,
                "severity": f.severity, "title": f.title, "status": f.status,
                "evidence": [{"record_type": e.record_type, "record_id": e.record_id, "field": e.field_name, "val": e.value} for e in f.evidence_items]
            } for f in findings
        ],
        "queries": [
            {"id": q.id, "code": q.query_code, "domain": q.domain, "record_id": q.record_id, "desc": q.problem_description, "status": q.status} for q in queries
        ],
        "deviations": [
            {"code": d.deviation_code, "type": d.deviation_type, "severity": d.severity, "desc": d.description, "status": d.status} for d in deviations
        ]
    }

# 4. KNOWLEDGE GRAPH
@router.get("/graph")
def get_graph(study_id: int = 1, limit: int = 300, db: Session = Depends(get_db)):
    return KnowledgeGraphService.get_visual_graph(db, study_id, limit)

@router.get("/subjects/{usubjid}/graph")
def get_subject_graph(usubjid: str, db: Session = Depends(get_db)):
    return KnowledgeGraphService.get_subject_subgraph(db, usubjid)

@router.post("/graph/rebuild")
def rebuild_graph(study_id: int = 1, db: Session = Depends(get_db)):
    stats = KnowledgeGraphService.rebuild_study_graph(db, study_id)
    return {"status": "SUCCESS", "message": "Knowledge Graph synchronized.", "stats": stats}

# 5. ASK ATLAS
@router.post("/atlas/answer")
def ask_atlas(req: AskAtlasRequest, db: Session = Depends(get_db)):
    res = AtlasEngine.answer(db, req.question, study_id=req.study_id, context=req.context)
    return res

@router.get("/evidence/{evidence_id}")
def get_evidence_detail(evidence_id: int, db: Session = Depends(get_db)):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence record not found.")
    return ev
"""

with open(out_path, "a", encoding="utf-8") as f:
    f.write(part2)

print("Part 2 appended successfully")
