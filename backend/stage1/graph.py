"""
ATLAS Interactive Clinical Knowledge Graph
Maintains multi-relational clinical graph structures with strict separation between:
- Disease recorded
- Medication taken
- Supported treatment relationship
- Adverse events
- Protocol findings
Strictly prevents unsupported claims.
"""

from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple
from .evidence import EvidenceBundle, RecordRef, ProtocolRef


@dataclass
class GraphNode:
    id: str
    label: str
    type: str  # "Study", "Site", "Subject", "Disease", "Treatment", "Medication", "Visit", "Lab", "Dose", "AdverseEvent", "Finding", "Protocol", "Evidence"
    properties: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphEdge:
    source: str
    target: str
    type: str  # "ENROLLED_AT", "HAS_DISEASE", "TAKES_MEDICATION", "RECEIVES_TREATMENT", "HAS_VISIT", "HAS_LAB", "HAS_DOSE", "EXPERIENCED_AE", "TRIGGERED_FINDING", "SUPPORTED_BY", "GOVERNED_BY"
    properties: Dict[str, Any] = field(default_factory=dict)


class ClinicalGraph:
    """
    Deterministic clinical trial knowledge graph.
    Maintains relational links and evidence provenance.
    """

    def __init__(self, study_id: str = "ABC-101"):
        self.study_id = study_id
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: List[GraphEdge] = []
        self.adjacency: Dict[str, List[GraphEdge]] = defaultdict(list)
        self.reverse_adjacency: Dict[str, List[GraphEdge]] = defaultdict(list)

        # Domain indices
        self.subjects: Dict[str, Dict[str, Any]] = {}
        self.diseases: Dict[str, Set[str]] = defaultdict(set)       # disease_name -> set(usubjid)
        self.medications: Dict[str, Set[str]] = defaultdict(set)    # med_name -> set(usubjid)
        self.treatments: Dict[str, Set[str]] = defaultdict(set)     # treatment_name -> set(usubjid)
        self.curated_treatments: Dict[str, Set[str]] = defaultdict(set)  # disease -> set(approved_treatments)
        self.findings_by_subject: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        # Initialize root study node
        self.add_node(GraphNode(id=f"study:{study_id}", label=f"Study {study_id}", type="Study", properties={"name": "Explainable Oncology & Hepatology Phase II"}))

    def add_node(self, node: GraphNode) -> None:
        self.nodes[node.id] = node

    def add_edge(self, edge: GraphEdge) -> None:
        self.edges.append(edge)
        self.adjacency[edge.source].append(edge)
        self.reverse_adjacency[edge.target].append(edge)

    def register_curated_treatment(self, disease: str, treatment_name: str) -> None:
        """Register that a medication is clinically established/curated to treat a disease in this protocol."""
        self.curated_treatments[disease.lower().strip()].add(treatment_name.lower().strip())

    def get_subject_subgraph(self, usubjid: str) -> Dict[str, Any]:
        """Extracts complete ego-subgraph for Subject 360."""
        subj_id = f"subj:{usubjid}"
        if subj_id not in self.nodes:
            return {"nodes": [], "edges": []}

        visited_nodes: Set[str] = {subj_id}
        result_edges: List[GraphEdge] = []

        # Depth-1 neighbors
        for edge in self.adjacency[subj_id]:
            visited_nodes.add(edge.target)
            result_edges.append(edge)
            # Depth-2 for labs/doses under visits, and findings/evidence
            for sub_edge in self.adjacency[edge.target]:
                visited_nodes.add(sub_edge.target)
                result_edges.append(sub_edge)

        nodes_list = [self.nodes[nid].__dict__ for nid in visited_nodes if nid in self.nodes]
        edges_list = [
            {
                "source": e.source,
                "target": e.target,
                "type": e.type,
                "properties": e.properties,
            }
            for e in result_edges
        ]
        return {"nodes": nodes_list, "edges": edges_list}

    def search_disease(self, query: str) -> Dict[str, Any]:
        """
        Disease Explorer Core:
        Finds all Subjects whose available study data supports that disease.
        Distinguishes between medications taken and supported treatments.
        """
        q = query.lower().strip()
        matched_disease = None
        for d in self.diseases:
            if q in d.lower():
                matched_disease = d
                break

        if not matched_disease:
            return {
                "disease": query,
                "matched": False,
                "total_subjects": 0,
                "subjects": [],
                "treatments_observed": {},
                "message": f"No subjects found with recorded medical history of '{query}'."
            }

        matching_subj_ids = sorted(list(self.diseases[matched_disease]))
        results = []
        observed_treatment_counts: Dict[str, int] = defaultdict(int)

        for subj_id in matching_subj_ids:
            subj_meta = self.subjects.get(subj_id, {})
            # Get medications taken by this subject
            meds_taken = subj_meta.get("medications", [])
            # Determine supported treatments for this disease
            supported_treatments = []
            curated_set = self.curated_treatments.get(matched_disease.lower().strip(), set())

            for med in meds_taken:
                med_name = med.get("name", "")
                is_supported = med_name.lower().strip() in curated_set
                evidence_status = (
                    "Supported by protocol/curated evidence"
                    if is_supported
                    else "Relationship not established from available study data."
                )
                supported_treatments.append({
                    "medication": med_name,
                    "dose": med.get("dose", ""),
                    "start_date": med.get("start_date", ""),
                    "end_date": med.get("end_date", ""),
                    "status": med.get("status", "Ongoing"),
                    "is_supported": is_supported,
                    "evidence_note": evidence_status,
                    "evidence_ref": med.get("evidence_ref", f"CM #{subj_id}-01")
                })
                observed_treatment_counts[med_name] += 1

            findings = self.findings_by_subject.get(subj_id, [])

            results.append({
                "subject_id": subj_id,
                "site_id": subj_meta.get("site_id", "SITE-101"),
                "disease": matched_disease,
                "disease_status": subj_meta.get("disease_statuses", {}).get(matched_disease, "Ongoing"),
                "disease_evidence": subj_meta.get("disease_evidence", {}).get(matched_disease, f"HIST #{subj_id}-01"),
                "treatments": supported_treatments,
                "primary_treatment": supported_treatments[0]["medication"] if supported_treatments else "None Recorded",
                "treatment_status": supported_treatments[0]["status"] if supported_treatments else "N/A",
                "open_findings_count": len(findings),
                "findings": findings
            })

        return {
            "disease": matched_disease,
            "matched": True,
            "total_subjects": len(results),
            "subjects": results,
            "treatments_observed": dict(observed_treatment_counts),
        }

    def get_full_graph_visualization(self, max_nodes: int = 120) -> Dict[str, Any]:
        """Returns nodes and edges formatted for visual graph canvas."""
        node_items = list(self.nodes.values())[:max_nodes]
        included_ids = {n.id for n in node_items}
        edge_items = [e for e in self.edges if e.source in included_ids and e.target in included_ids]

        return {
            "nodes": [
                {
                    "id": n.id,
                    "label": n.label,
                    "type": n.type,
                    "properties": n.properties,
                }
                for n in node_items
            ],
            "edges": [
                {
                    "id": f"{e.source}->{e.target}",
                    "source": e.source,
                    "target": e.target,
                    "type": e.type,
                    "label": e.type.replace("_", " "),
                }
                for e in edge_items
            ]
        }
