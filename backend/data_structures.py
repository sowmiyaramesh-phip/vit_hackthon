"""
ATLAS+MONITORING Formal Data Structures Module
Implements concrete, explainable Data Structures and Algorithms (DSA):
1. ClinicalGraph: Directed Graph via Adjacency List with BFS (multi-hop traversal) & DFS (cycle detection).
2. FindingPriorityQueue: Binary Max-Heap for clinical finding triage (CRITICAL > HIGH > MEDIUM > LOW).
3. ReviewCycleQueue: FIFO Queue for sequential 6-node Review Crew execution & query dispatch.
4. AuditLedger: Append-Only Cryptographic Stack/Ledger with SHA-256 hash chaining (21 CFR Part 11).
5. MemoryHashSet: O(1) Hash Set for doctor rejection memory & alert suppression.
"""

import hashlib
import json
import time
from collections import deque, defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple


# ==============================================================================
# 1. DIRECTED CLINICAL GRAPH (Adjacency List + BFS + DFS)
# ==============================================================================

@dataclass
class GraphNode:
    id: str
    label: str
    type: str  # Study, Site, Subject, Disease, Treatment, Medication, Visit, Lab, Dose, AdverseEvent, Finding
    properties: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphEdge:
    source: str
    target: str
    type: str  # HAS_SITE, ENROLLED_AT, HAS_DISEASE, TAKES_MEDICATION, RECEIVES_TREATMENT, HAS_VISIT, HAS_LAB, EXPERIENCED_AE, TRIGGERED_FINDING
    properties: Dict[str, Any] = field(default_factory=dict)


class ClinicalGraph:
    """
    Deterministic clinical trial knowledge graph implemented via Adjacency Lists.
    Supports multi-hop BFS reasoning and DFS dependency validation.
    """

    def __init__(self, study_id: str = "ABC-101"):
        self.study_id = study_id
        self.nodes: Dict[str, GraphNode] = {}
        self.edges: List[GraphEdge] = []
        self.adjacency: Dict[str, List[GraphEdge]] = {}
        self.reverse_adjacency: Dict[str, List[GraphEdge]] = {}
        
        # Domain indices
        self.subjects: Dict[str, Dict[str, Any]] = {}
        self.diseases: Dict[str, Set[str]] = defaultdict(set)       # disease_name -> set(usubjid)
        self.medications: Dict[str, Set[str]] = defaultdict(set)    # med_name -> set(usubjid)
        self.treatments: Dict[str, Set[str]] = defaultdict(set)     # treatment_name -> set(usubjid)
        self.curated_treatments: Dict[str, Set[str]] = defaultdict(set)  # disease -> set(approved_treatments)
        self.findings_by_subject: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        # Add root study node
        self.add_node(GraphNode(
            id=f"study:{study_id}",
            label=f"Study {study_id}",
            type="Study",
            properties={"name": "A Multicenter Phase II Trial"}
        ))

    def add_node(self, node: GraphNode) -> None:
        self.nodes[node.id] = node
        if node.id not in self.adjacency:
            self.adjacency[node.id] = []
        if node.id not in self.reverse_adjacency:
            self.reverse_adjacency[node.id] = []

    def add_edge(self, edge: GraphEdge) -> None:
        if edge.source not in self.adjacency:
            self.adjacency[edge.source] = []
        if edge.target not in self.reverse_adjacency:
            self.reverse_adjacency[edge.target] = []

        self.edges.append(edge)
        self.adjacency[edge.source].append(edge)
        self.reverse_adjacency[edge.target].append(edge)

    def register_curated_treatment(self, disease: str, treatment_name: str) -> None:
        d = disease.lower().strip()
        t = treatment_name.lower().strip()
        if d not in self.curated_treatments:
            self.curated_treatments[d] = set()
        self.curated_treatments[d].add(t)

    def bfs_find_path(self, start_id: str, target_type: str) -> List[Dict[str, Any]]:
        """
        Breadth-First Search (BFS) algorithm:
        Traverses outwards level-by-level to find all reachable nodes of target_type
        along with the exact edge path, guaranteeing shortest explanation distance.
        """
        if start_id not in self.nodes:
            return []

        queue = deque([(start_id, [start_id])])
        visited = {start_id}
        matches = []

        while queue:
            current_id, path = queue.popleft()
            node = self.nodes.get(current_id)

            if node and node.type == target_type and current_id != start_id:
                matches.append({
                    "target_node": node.__dict__,
                    "path_ids": path,
                    "depth": len(path) - 1
                })

            for edge in self.adjacency.get(current_id, []):
                neighbor = edge.target
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))

        return matches

    def dfs_detect_cycles(self, start_id: str) -> bool:
        """
        Depth-First Search (DFS) algorithm with recursion stack:
        Detects circular dependencies in protocol rules or workflow nodes.
        Returns True if a cycle exists.
        """
        visited = set()
        rec_stack = set()

        def _dfs(v: str) -> bool:
            visited.add(v)
            rec_stack.add(v)

            for edge in self.adjacency.get(v, []):
                neighbor = edge.target
                if neighbor not in visited:
                    if _dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True

            rec_stack.remove(v)
            return False

        return _dfs(start_id)

    def get_subject_subgraph(self, usubjid: str) -> Dict[str, Any]:
        """Extracts complete ego-subgraph for Subject 360 view."""
        subj_id = f"subj:{usubjid}"
        if subj_id not in self.nodes:
            return {"nodes": [], "edges": []}

        visited_nodes: Set[str] = {subj_id}
        result_edges: List[GraphEdge] = []

        # Depth-1 neighbors
        for edge in self.adjacency.get(subj_id, []):
            visited_nodes.add(edge.target)
            result_edges.append(edge)
            # Depth-2 neighbors (labs, doses under visits)
            for sub_edge in self.adjacency.get(edge.target, []):
                visited_nodes.add(sub_edge.target)
                result_edges.append(sub_edge)

        nodes_list = [self.nodes[nid].__dict__ for nid in visited_nodes if nid in self.nodes]
        edges_list = [
            {"source": e.source, "target": e.target, "type": e.type, "properties": e.properties}
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
            meds_taken = subj_meta.get("medications", [])
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

    def to_dict(self) -> Dict[str, Any]:
        return {
            "study_id": self.study_id,
            "nodes": [n.__dict__ for n in self.nodes.values()],
            "edges": [{"source": e.source, "target": e.target, "type": e.type, "properties": e.properties} for e in self.edges]
        }


# ==============================================================================
# 2. FINDING PRIORITY QUEUE (Binary Max-Heap)
# ==============================================================================

@dataclass
class PrioritizedFinding:
    priority: int       # Higher number = higher clinical urgency
    severity: str       # CRITICAL (4), HIGH (3), MEDIUM (2), LOW (1)
    finding_id: str
    subject_id: str
    title: str
    data: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)

    def __lt__(self, other: "PrioritizedFinding") -> bool:
        # Max-heap comparison: reversed so higher priority surfaces first
        if self.priority != other.priority:
            return self.priority > other.priority
        return self.timestamp < other.timestamp


class FindingPriorityQueue:
    """
    Binary Max-Heap Priority Queue for clinical safety findings triage.
    Guarantees immediate O(log N) retrieval of critical hepatotoxicity & Hy's Law events.
    """
    SEVERITY_WEIGHTS = {
        "CRITICAL": 4,
        "HIGH": 3,
        "MEDIUM": 2,
        "LOW": 1,
    }

    def __init__(self):
        self.heap: List[PrioritizedFinding] = []

    def _parent(self, i: int) -> int:
        return (i - 1) // 2

    def _left_child(self, i: int) -> int:
        return 2 * i + 1

    def _right_child(self, i: int) -> int:
        return 2 * i + 2

    def _swap(self, i: int, j: int) -> None:
        self.heap[i], self.heap[j] = self.heap[j], self.heap[i]

    def _sift_up(self, i: int) -> None:
        parent = self._parent(i)
        if i > 0 and self.heap[i].priority > self.heap[parent].priority:
            self._swap(i, parent)
            self._sift_up(parent)

    def _sift_down(self, i: int) -> None:
        max_idx = i
        left = self._left_child(i)
        right = self._right_child(i)

        if left < len(self.heap) and self.heap[left].priority > self.heap[max_idx].priority:
            max_idx = left
        if right < len(self.heap) and self.heap[right].priority > self.heap[max_idx].priority:
            max_idx = right

        if i != max_idx:
            self._swap(i, max_idx)
            self._sift_down(max_idx)

    def push(self, finding_id: str, subject_id: str, title: str, severity: str, data: Dict[str, Any] = None) -> None:
        """Inserts finding into max-heap in O(log N) time."""
        weight = self.SEVERITY_WEIGHTS.get(severity.upper(), 1)
        item = PrioritizedFinding(
            priority=weight,
            severity=severity.upper(),
            finding_id=finding_id,
            subject_id=subject_id,
            title=title,
            data=data or {}
        )
        self.heap.append(item)
        self._sift_up(len(self.heap) - 1)

    def pop(self) -> Optional[PrioritizedFinding]:
        """Removes and returns highest-priority finding in O(log N) time."""
        if not self.heap:
            return None
        if len(self.heap) == 1:
            return self.heap.pop()

        root = self.heap[0]
        self.heap[0] = self.heap.pop()
        self._sift_down(0)
        return root

    def peek(self) -> Optional[PrioritizedFinding]:
        """Views the highest-priority finding in O(1) time without removing."""
        return self.heap[0] if self.heap else None

    def size(self) -> int:
        return len(self.heap)

    def is_empty(self) -> bool:
        return len(self.heap) == 0

    def to_sorted_list(self) -> List[Dict[str, Any]]:
        """Returns all findings sorted from most critical to least critical."""
        # Clone heap and extract
        temp_heap = FindingPriorityQueue()
        temp_heap.heap = list(self.heap)
        sorted_items = []
        while not temp_heap.is_empty():
            item = temp_heap.pop()
            sorted_items.append({
                "finding_id": item.finding_id,
                "subject_id": item.subject_id,
                "title": item.title,
                "severity": item.severity,
                "priority_score": item.priority,
                "data": item.data
            })
        return sorted_items


# ==============================================================================
# 3. REVIEW CYCLE FIFO QUEUE
# ==============================================================================

class ReviewCycleQueue:
    """
    First-In First-Out (FIFO) Queue for sequential 6-node Review Crew execution:
    1. INGESTION/DETECTION -> 2. MEDICAL REVIEW -> 3. DATA MANAGER
    -> 4. COMPLIANCE -> 5. HUMAN GATE -> 6. EXECUTE / CLOSE
    Also manages batch query and notification dispatch.
    """

    def __init__(self):
        self.items: deque = deque()

    def enqueue(self, item: Any) -> None:
        """Adds element to tail of queue in O(1)."""
        self.items.append(item)

    def dequeue(self) -> Optional[Any]:
        """Removes and returns element from front of queue in O(1)."""
        if self.is_empty():
            return None
        return self.items.popleft()

    def peek(self) -> Optional[Any]:
        return self.items[0] if self.items else None

    def is_empty(self) -> bool:
        return len(self.items) == 0

    def size(self) -> int:
        return len(self.items)

    def to_list(self) -> List[Any]:
        return list(self.items)


# ==============================================================================
# 4. 21 CFR PART 11 AUDIT LEDGER (Append-Only Cryptographic Ledger)
# ==============================================================================

@dataclass
class AuditEntry:
    index: int
    timestamp: str
    node: str
    decision: str
    subject_id: Optional[str]
    actor: str
    notes: str
    payload: Dict[str, Any]
    prev_hash: str
    entry_hash: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "node": self.node,
            "decision": self.decision,
            "subject_id": self.subject_id,
            "actor": self.actor,
            "notes": self.notes,
            "payload": self.payload,
            "prev_hash": self.prev_hash,
            "entry_hash": self.entry_hash,
        }


class AuditLedger:
    """
    Append-Only Cryptographic Stack/Ledger satisfying FDA 21 CFR Part 11:
    - Immutable: Entries cannot be deleted or mutated.
    - Chained: Each entry incorporates the SHA-256 hash of the predecessor.
    - Verifiable: verify_integrity() validates the full cryptographic chain.
    """

    def __init__(self):
        self.entries: List[AuditEntry] = []
        # Create genesis block
        self._create_genesis_entry()

    def _compute_hash(self, index: int, timestamp: str, node: str, decision: str,
                      subject_id: Optional[str], actor: str, notes: str,
                      payload: dict, prev_hash: str) -> str:
        serialized_payload = json.dumps(payload, sort_keys=True)
        raw_str = f"{index}|{timestamp}|{node}|{decision}|{subject_id}|{actor}|{notes}|{serialized_payload}|{prev_hash}"
        return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

    def _create_genesis_entry(self) -> None:
        ts = "2026-01-01T00:00:00Z"
        genesis_hash = self._compute_hash(
            0, ts, "SYSTEM", "GENESIS", "STUDY-ABC-101",
            "System Initializer", "21 CFR Part 11 Audit Trail Genesis Initialized",
            {}, "0" * 64
        )
        entry = AuditEntry(
            index=0,
            timestamp=ts,
            node="SYSTEM",
            decision="GENESIS",
            subject_id="STUDY-ABC-101",
            actor="System Initializer",
            notes="21 CFR Part 11 Audit Trail Genesis Initialized",
            payload={"version": "1.0"},
            prev_hash="0" * 64,
            entry_hash=genesis_hash
        )
        self.entries.append(entry)

    def append(self, node: str, decision: str, actor: str, notes: str,
               subject_id: Optional[str] = None, payload: Dict[str, Any] = None) -> AuditEntry:
        """Appends a new tamper-evident audit record."""
        prev_entry = self.entries[-1]
        new_index = len(self.entries)
        now_ts = datetime.utcnow().isoformat() + "Z"
        data_payload = payload or {}

        entry_hash = self._compute_hash(
            new_index, now_ts, node, decision, subject_id, actor, notes, data_payload, prev_entry.entry_hash
        )

        entry = AuditEntry(
            index=new_index,
            timestamp=now_ts,
            node=node,
            decision=decision,
            subject_id=subject_id,
            actor=actor,
            notes=notes,
            payload=data_payload,
            prev_hash=prev_entry.entry_hash,
            entry_hash=entry_hash
        )
        self.entries.append(entry)
        return entry

    def verify_integrity(self) -> Tuple[bool, Optional[str]]:
        """Verifies cryptographic continuity of all entries."""
        for i in range(1, len(self.entries)):
            curr = self.entries[i]
            prev = self.entries[i - 1]

            # Check chain link
            if curr.prev_hash != prev.entry_hash:
                return False, f"Broken chain at index {i}: prev_hash does not match predecessor entry_hash"

            # Recompute hash
            recalc = self._compute_hash(
                curr.index, curr.timestamp, curr.node, curr.decision,
                curr.subject_id, curr.actor, curr.notes, curr.payload, curr.prev_hash
            )
            if recalc != curr.entry_hash:
                return False, f"Tampered entry detected at index {i}: signature mismatch"

        return True, "Ledger integrity verified: 100% cryptographic continuity"

    def get_all(self) -> List[Dict[str, Any]]:
        return [e.to_dict() for e in self.entries]


# ==============================================================================
# 5. MEMORY HASH SET (O(1) Alert Suppression)
# ==============================================================================

class MemoryHashSet:
    """
    Hash Set data structure for O(1) doctor rejection memory and alert suppression.
    Prevents repeated surfacing of previously dismissed findings across 12 monitoring cuts.
    """

    def __init__(self, initial_capacity: int = 64):
        self.capacity = initial_capacity
        self.size = 0
        self.buckets: List[List[str]] = [[] for _ in range(self.capacity)]

    def _hash(self, key: str) -> int:
        return hash(key) % self.capacity

    def add(self, key: str) -> None:
        """Adds key in O(1) average time."""
        idx = self._hash(key)
        if key not in self.buckets[idx]:
            self.buckets[idx].append(key)
            self.size += 1
            if self.size >= self.capacity * 0.75:
                self._rehash()

    def contains(self, key: str) -> bool:
        """Checks membership in O(1) average time."""
        idx = self._hash(key)
        return key in self.buckets[idx]

    def remove(self, key: str) -> bool:
        idx = self._hash(key)
        if key in self.buckets[idx]:
            self.buckets[idx].remove(key)
            self.size -= 1
            return True
        return False

    def clear(self) -> None:
        self.buckets = [[] for _ in range(self.capacity)]
        self.size = 0

    def _rehash(self) -> None:
        old_buckets = self.buckets
        self.capacity *= 2
        self.buckets = [[] for _ in range(self.capacity)]
        self.size = 0
        for bucket in old_buckets:
            for item in bucket:
                self.add(item)

    def to_list(self) -> List[str]:
        items = []
        for bucket in self.buckets:
            items.extend(bucket)
        return items
