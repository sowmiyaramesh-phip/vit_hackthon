import json
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    Study, Site, Subject, Visit, LabResult, AdverseEvent,
    ConcomitantMedication, Finding, Query, GraphNode, GraphEdge
)

class KnowledgeGraphService:
    @staticmethod
    def rebuild_study_graph(db: Session, study_id: int) -> Dict[str, int]:
        """Synchronizes relational clinical records into typed GraphNode and GraphEdge entities."""
        # Clear existing nodes & edges for this study
        db.query(GraphEdge).filter(GraphEdge.study_id == study_id).delete()
        db.query(GraphNode).filter(GraphNode.study_id == study_id).delete()
        db.commit()

        study = db.query(Study).filter(Study.id == study_id).first()
        if not study:
            return {"nodes": 0, "edges": 0}

        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []

        # Study Node
        study_key = f"STUDY:{study.study_id}"
        nodes.append(GraphNode(
            study_id=study_id,
            node_key=study_key,
            label=f"Study: {study.study_id}",
            entity_type="Study",
            properties_json=json.dumps({"name": study.name, "sponsor": study.sponsor, "cut": study.current_cut})
        ))

        # Sites
        sites = db.query(Site).filter(Site.study_id == study_id).all()
        for s in sites:
            site_key = f"SITE:{s.site_id}"
            nodes.append(GraphNode(
                study_id=study_id,
                node_key=site_key,
                label=f"Site {s.site_id} ({s.name})",
                entity_type="Site",
                properties_json=json.dumps({"location": s.location, "pi": s.pi_name})
            ))
            edges.append(GraphEdge(
                study_id=study_id,
                source_key=study_key,
                target_key=site_key,
                relationship="HAS_SITE",
                properties_json=json.dumps({"label": "HAS_SITE"})
            ))

        # Subjects
        subjects = db.query(Subject).filter(Subject.study_id == study_id).all()
        for subj in subjects:
            subj_key = f"SUBJ:{subj.usubjid}"
            site_key = f"SITE:{subj.site.site_id}" if subj.site else f"SITE:S01"
            nodes.append(GraphNode(
                study_id=study_id,
                node_key=subj_key,
                label=f"Subject {subj.usubjid}",
                entity_type="Subject",
                properties_json=json.dumps({
                    "arm": subj.arm, "age": subj.age, "sex": subj.sex,
                    "first_dose": subj.rfstdtc, "status": subj.status
                })
            ))
            edges.append(GraphEdge(
                study_id=study_id,
                source_key=site_key,
                target_key=subj_key,
                relationship="ENROLLED",
                properties_json=json.dumps({"label": "ENROLLED"})
            ))

            # Visits
            for v in subj.visits:
                v_key = f"VISIT:{subj.usubjid}:{v.visit_name}"
                nodes.append(GraphNode(
                    study_id=study_id,
                    node_key=v_key,
                    label=f"{v.visit_name} ({subj.usubjid})",
                    entity_type="Visit",
                    properties_json=json.dumps({"scheduled_day": v.scheduled_day, "actual_date": v.actual_date})
                ))
                edges.append(GraphEdge(
                    study_id=study_id,
                    source_key=subj_key,
                    target_key=v_key,
                    relationship="HAS_VISIT",
                    properties_json=json.dumps({"label": "HAS_VISIT"})
                ))

            # Adverse Events
            for ae in subj.adverse_events:
                ae_key = f"AE:{ae.record_id}"
                nodes.append(GraphNode(
                    study_id=study_id,
                    node_key=ae_key,
                    label=f"AE: {ae.aeterm} ({ae.severity})",
                    entity_type="AdverseEvent",
                    properties_json=json.dumps({
                        "record_id": ae.record_id, "severity": ae.severity,
                        "serious": ae.is_serious, "hospitalized": ae.is_hospitalized,
                        "start_date": ae.start_date
                    })
                ))
                edges.append(GraphEdge(
                    study_id=study_id,
                    source_key=subj_key,
                    target_key=ae_key,
                    relationship="EXPERIENCED",
                    properties_json=json.dumps({"label": "EXPERIENCED", "serious": ae.is_serious})
                ))

            # Labs
            for lb in subj.labs:
                lb_key = f"LAB:{lb.record_id}"
                nodes.append(GraphNode(
                    study_id=study_id,
                    node_key=lb_key,
                    label=f"Lab: {lb.test_code} = {lb.raw_value} {lb.normalized_unit}",
                    entity_type="Lab",
                    properties_json=json.dumps({
                        "record_id": lb.record_id, "test": lb.test_code,
                        "norm_val": lb.normalized_value, "is_abnormal": lb.is_abnormal
                    })
                ))
                v_key = f"VISIT:{subj.usubjid}:{lb.visit_name}"
                src = v_key if any(v.visit_name == lb.visit_name for v in subj.visits) else subj_key
                edges.append(GraphEdge(
                    study_id=study_id,
                    source_key=src,
                    target_key=lb_key,
                    relationship="PRODUCED_LAB",
                    properties_json=json.dumps({"label": "PRODUCED_LAB"})
                ))

            # Concomitant Meds
            for cm in subj.conmeds:
                cm_key = f"CM:{cm.record_id}"
                nodes.append(GraphNode(
                    study_id=study_id,
                    node_key=cm_key,
                    label=f"Med: {cm.cmtrt}",
                    entity_type="ConcomitantMedication",
                    properties_json=json.dumps({"indication": cm.indication, "hepatotoxic": cm.is_hepatotoxic})
                ))
                edges.append(GraphEdge(
                    study_id=study_id,
                    source_key=subj_key,
                    target_key=cm_key,
                    relationship="PRESCRIBED",
                    properties_json=json.dumps({"label": "PRESCRIBED"})
                ))

        # Findings
        findings = db.query(Finding).filter(Finding.study_id == study_id).all()
        for f in findings:
            find_key = f"FIND:{f.finding_code}"
            nodes.append(GraphNode(
                study_id=study_id,
                node_key=find_key,
                label=f"Finding: {f.title} [{f.severity}]",
                entity_type="Finding",
                properties_json=json.dumps({"category": f.category, "severity": f.severity, "status": f.status})
            ))
            if f.subject_id:
                subj_obj = db.query(Subject).filter(Subject.id == f.subject_id).first()
                if subj_obj:
                    edges.append(GraphEdge(
                        study_id=study_id,
                        source_key=find_key,
                        target_key=f"SUBJ:{subj_obj.usubjid}",
                        relationship="ABOUT",
                        properties_json=json.dumps({"label": "ABOUT"})
                    ))
            for ev in f.evidence_items:
                ev_target = f"{ev.record_type}:{ev.record_id}"
                edges.append(GraphEdge(
                    study_id=study_id,
                    source_key=find_key,
                    target_key=ev_target,
                    relationship="SUPPORTED_BY",
                    properties_json=json.dumps({"label": "SUPPORTED_BY", "field": ev.field_name})
                ))

        db.add_all(nodes)
        db.add_all(edges)
        db.commit()
        return {"nodes": len(nodes), "edges": len(edges)}

    @staticmethod
    def get_visual_graph(db: Session, study_id: int, limit: int = 250) -> Dict[str, Any]:
        node_records = db.query(GraphNode).filter(GraphNode.study_id == study_id).limit(limit).all()
        edge_records = db.query(GraphEdge).filter(GraphEdge.study_id == study_id).limit(limit * 2).all()

        node_keys = {n.node_key for n in node_records}
        
        nodes = []
        for n in node_records:
            props = json.loads(n.properties_json) if n.properties_json else {}
            color = "#6366f1"
            if n.entity_type == "Study": color = "#3b82f6"
            elif n.entity_type == "Site": color = "#0ea5e9"
            elif n.entity_type == "Subject": color = "#10b981"
            elif n.entity_type == "AdverseEvent": color = "#f97316" if props.get("severity") == "SEVERE" else "#eab308"
            elif n.entity_type == "Lab": color = "#8b5cf6"
            elif n.entity_type == "Finding": color = "#ef4444"
            elif n.entity_type == "ConcomitantMedication": color = "#06b6d4"

            nodes.append({
                "id": n.node_key,
                "label": n.label,
                "type": n.entity_type,
                "color": color,
                "properties": props
            })

        edges = []
        for e in edge_records:
            if e.source_key in node_keys and e.target_key in node_keys:
                edges.append({
                    "id": f"{e.source_key}->{e.target_key}:{e.relationship}",
                    "from": e.source_key,
                    "to": e.target_key,
                    "label": e.relationship,
                    "properties": json.loads(e.properties_json) if e.properties_json else {}
                })

        return {"nodes": nodes, "edges": edges, "total_nodes": len(nodes), "total_edges": len(edges)}

    @staticmethod
    def get_subject_subgraph(db: Session, usubjid: str) -> Dict[str, Any]:
        subj_key = f"SUBJ:{usubjid}"
        # Find all edges connected to or from this subject or related records
        direct_edges = db.query(GraphEdge).filter(
            (GraphEdge.source_key == subj_key) | (GraphEdge.target_key == subj_key)
        ).all()

        connected_keys = {subj_key}
        for e in direct_edges:
            connected_keys.add(e.source_key)
            connected_keys.add(e.target_key)

        # Also get secondary edges from connected labs/events (like findings supported_by)
        second_edges = db.query(GraphEdge).filter(
            GraphEdge.target_key.in_(connected_keys) | GraphEdge.source_key.in_(connected_keys)
        ).limit(100).all()
        for e in second_edges:
            connected_keys.add(e.source_key)
            connected_keys.add(e.target_key)

        nodes_db = db.query(GraphNode).filter(GraphNode.node_key.in_(connected_keys)).all()
        
        nodes = []
        for n in nodes_db:
            props = json.loads(n.properties_json) if n.properties_json else {}
            color = "#10b981" if n.entity_type == "Subject" else "#6366f1"
            if n.entity_type == "AdverseEvent": color = "#ef4444" if props.get("severity") == "SEVERE" else "#f97316"
            elif n.entity_type == "Lab": color = "#8b5cf6"
            elif n.entity_type == "Finding": color = "#dc2626"
            nodes.append({
                "id": n.node_key,
                "label": n.label,
                "type": n.entity_type,
                "color": color,
                "properties": props
            })

        all_edges = list({f"{e.source_key}->{e.target_key}:{e.relationship}": e for e in direct_edges + second_edges}.values())
        edges = []
        node_id_set = {n["id"] for n in nodes}
        for e in all_edges:
            if e.source_key in node_id_set and e.target_key in node_id_set:
                edges.append({
                    "id": f"{e.source_key}->{e.target_key}:{e.relationship}",
                    "from": e.source_key,
                    "to": e.target_key,
                    "label": e.relationship,
                    "properties": json.loads(e.properties_json) if e.properties_json else {}
                })

        return {"nodes": nodes, "edges": edges, "subject_id": usubjid}
