# ATLAS+MONITORING : Clinical Trial Surveillance System
> **Explainable Clinical Trial Intelligence & Continuous 12-Cut Surveillance**  
> *Compliant with FDA 21 CFR Part 11, ICH E6 (R2) GCP, and CDISC SDTM Standards.*

---

## 1. Architecture & Technologies Overview

This project implements an enterprise-grade clinical monitoring surveillance system tailored to academic and industrial evaluation requirements:

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (`frontend/index.html`, `frontend/css/style.css`, `frontend/js/script.js`). Zero external build tools; client-side Hash Router, interactive SVG Knowledge Graph, responsive modals, and slide-out Evidence Drawer.
- **Backend**: Python 3.13 Flask (`backend/app.py`, `backend/routes.py`, `backend/services.py`). High-performance RESTful API service with CORS support, serving both API endpoints and the static frontend directly at port 5000.
- **Data Structures**: Python DSA Module (`backend/data_structures.py`). 5 core DSA implementations: Directed Graph with BFS/DFS, Max-Heap, FIFO Queue, Append-Only Ledger, and Hash Set.
- **Database**: MySQL and SQLite Dual-Mode (`database/schema.sql`, `backend/database.py`). Relational database schema with 14 clinical tables, foreign keys, and indexes. Automatically falls back to SQLite if MySQL service is idle.

---

## 2. Quickstart Guide for VS Code

### Step 1: Open in VS Code
Open the root directory in VS Code:
```powershell
code C:\Users\SOWMIYA\atlas-monitor
```

### Step 2: Install Dependencies
Open the VS Code Terminal (Ctrl + ~) and execute:
```powershell
py -m pip install -r requirements.txt
```

### Step 3: Database Setup (MySQL or SQLite)
- **Option A (Instant - Local SQLite)**: Out of the box, no configuration required! The system automatically creates and seeds `atlas_monitor_watch.db`.
- **Option B (Production MySQL)**:
  1. Open MySQL Workbench or your terminal and run `database/schema.sql`.
  2. In `.env`, set `USE_MYSQL=true` and configure your MySQL credentials.

### Step 4: Run the Project
You can start the project in any of the following ways:

#### Option 1: Double-Click Launcher
Double-click `start.bat` in the project root. It will start the server and automatically launch Google Chrome at `http://127.0.0.1:5000/`.

#### Option 2: VS Code Terminal
Run the Flask server:
```powershell
py -m backend.app
```
Then navigate to: **`http://127.0.0.1:5000/`**

#### Option 3: VS Code Run & Debug
Press `F5` in VS Code to launch with configuration **"Python: Run ATLAS+MONITORING (Flask)"**.

---

## 3. Data Structures and Algorithms (DSA) Implementation

The system features a dedicated module at `backend/data_structures.py` demonstrating 5 core DSA concepts:

### 1. Directed Clinical Graph (ClinicalGraph)
- **Structure**: Adjacency list representation connecting Subjects, Sites, Diseases, Medications, Visits, Labs, and Adverse Events.
- **BFS (Breadth-First Search)**: Multi-hop graph traversal algorithm finding the shortest explainable evidence path between clinical entities (e.g. verifying if a prescribed drug is curatively supported for a disease).
- **DFS (Depth-First Search)**: Cycle detection algorithm ensuring no circular dependencies exist across protocol rules and review stages.

### 2. Binary Max-Heap Priority Queue (FindingPriorityQueue)
- **Structure**: Array-based binary max-heap.
- **Urgency Ranking**: Clinical findings are scored by severity: CRITICAL (4), HIGH (3), MEDIUM (2), LOW (1).
- **Complexity**: O(log N) insertion (push) and O(log N) extraction (pop).
- **Application**: Immediately surfaces acute liver injury (Hy's Law candidates with ALT > 4x ULN and BILI > 2x ULN) to the top of the surveillance desk.

### 3. Review Cycle FIFO Queue (ReviewCycleQueue)
- **Structure**: First-In First-Out Queue implemented via collections.deque.
- **Complexity**: O(1) enqueue and O(1) dequeue.
- **Application**: Sequentially coordinates the 6-stage autonomous Review Crew:
  INGESTION -> DETECTION -> DATA MANAGER -> COMPLIANCE -> HUMAN GATE -> EXECUTE

### 4. 21 CFR Part 11 Append-Only Audit Ledger (AuditLedger)
- **Structure**: Cryptographically chained sequential ledger / stack.
- **Integrity Guarantee**: Each entry incorporates the SHA-256 hash of its predecessor.
- **Verification**: `verify_integrity()` inspects the entire chain to validate that historical records cannot be altered, deleted, or backdated.

### 5. Memory Hash Set (MemoryHashSet)
- **Structure**: Custom hash table with dynamic rehashing when load factor >= 0.75.
- **Complexity**: O(1) average time add and contains.
- **Application**: Remembers Medical Monitor rejection decisions to suppress dismissed false-positive alerts across future surveillance cuts.

---

## 4. Relational Database Schema (MySQL)

Located at `database/schema.sql`, the relational schema defines 14 CDISC SDTM and governance entities:
1. `studies`: Master study definition (Study ABC-101, Phase II, Cut 8/12).
2. `protocols`: Protocol version history (v1.0 active, v2.0 draft) with SHA-256 checksums.
3. `sites`: Clinical research sites (S01 to S12) and Principal Investigator records.
4. `subjects`: CDISC SDTM Demographics (DM) with age, sex, enrollment date, and treatment.
5. `medical_histories`: CDISC SDTM Medical History (MH) capturing baseline diseases.
6. `medications`: CDISC SDTM Concomitant Medications (CM) recording drug name, dose, and frequency.
7. `visits`: CDISC SDTM Subject Visits (SV) with planned vs actual visit days.
8. `lab_results`: CDISC SDTM Laboratory Tests (LB) with raw values, harmonized units, and ULN.
9. `doses`: CDISC SDTM Exposure (EX) tracking administered doses and deviations.
10. `adverse_events`: CDISC SDTM Adverse Events (AE) with CTC-AE grading and seriousness flags.
11. `findings`: Protocol findings and Hy's Law candidate alerts.
12. `data_queries`: Data manager queries, site responses, and review notes.
13. `human_escalations`: Sovereign Human Gate safety holds awaiting physician sign-off.
14. `decision_traces`: 21 CFR Part 11 regulatory audit log.

---

## 5. Key Application Features & Navigation

- **Study Dashboard (`#dashboard`)**: Study overview, active cohort metrics, recent findings, and quick review actions.
- **Subjects Directory (`#subjects`)**: Comprehensive listing with search, filtering, and clinical enrollment dates.
- **Subject 360 (`#subjects/:id`)**: Complete patient journey dossier, hepatic panel lab results, visit windows, and exposure.
- **Disease Explorer (`#disease-explorer`)**: Deterministic search demonstrating supported vs observed treatments for Liver Disease across all 8 subjects.
- **Knowledge Graph (`#graph`)**: Interactive SVG graph visualization with draggable nodes and click-to-inspect evidence drawer.
- **Ask ATLAS (`#ask-atlas`)**: Evidence-grounded natural language query engine that answers questions deterministically and rejects trap questions.
- **Review Crew (`#review-crew`)**: Interactive 6-stage review pipeline animation with live node progress.
- **Sovereign Human Gate (`#human-gate`)**: Medical Monitor authorization desk with "+ Emergency Safety Hold", Approve, and Reject controls.
- **DSA Telemetry (`#dsa-telemetry`)**: Live status and visual inspection of the Binary Max-Heap, Graph, FIFO Queue, and Hash Set.
- **21 CFR Part 11 Decision Trace (`#decision-trace`)**: Cryptographically verified audit log with SHA-256 chain validation.
