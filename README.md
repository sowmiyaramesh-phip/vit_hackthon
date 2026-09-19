# ATLAS + MONITOR
### Clinical Trial Intelligence, Evidence, Review and Monitoring Platform

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-teal.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.3+-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38bdf8.svg)](https://tailwindcss.com/)
[![Compliance](https://img.shields.io/badge/21_CFR_Part_11-Compliant_Audit_Trail-emerald.svg)]()
[![CDISC](https://img.shields.io/badge/CDISC_SDTM-Compliant-orange.svg)]()

---

## 🔬 Executive Overview

**ATLAS + MONITOR** is a fully integrated, production-grade clinical trial intelligence and autonomous monitoring platform. It combines deterministic knowledge graph reasoning with a rigorous 6-node agentic clinical monitoring crew to transform raw clinical trial datasets (CDISC SDTM domains: `DM`, `AE`, `LB`, `EX`, `SV`, `CM`) into auditable, GCP-compliant trial oversight.

```
                     CLINICAL TRIAL DATA (CDISC SDTM)
                                    ↓
                     INGESTION, VALIDATION & NORMALIZATION
                                    ↓
                        TRIAL KNOWLEDGE GRAPH
                       ↙                     ↘
             [ PROBLEM 1: ATLAS ]     [ PROBLEM 2: MONITOR ]
             • Patient 360            • 6-Node Review Crew
             • Visual Knowledge Graph • Medical Review & DM
             • Ask ATLAS (4 Query     • Protocol Compliance
               Types: COUNT, LOOKUP,  • Human Gate & Clarify
               FINDING, TRAP)         • Persistent Memory
             • Provable RecordRefs    • 21 CFR Part 11 Trace
```

---

## 🌟 Key Architecture & Capabilities

### Problem 1: ATLAS (Clinical Trial Intelligence & Evidence)
1. **Clinical Ingestion & Normalizer**:
   - **Unit Harmonization**: Automatically converts international units to standard CDISC units (e.g., ALT `3.995 µkat/L` × 60 = `239.7 U/L`).
   - **Censored Value Handling**: Parses string qualifiers like `<5`, `>100`, `ND` into structured `{value: 5, operator: "<", is_censored: true}` records.
   - **Comma-Decimal Normalization**: Converts localized comma decimals (`14,2` → `14.2`).
2. **Trial Knowledge Graph**:
   - Multi-relational network connecting Organization, Study, Sites, Subjects, Visits, Adverse Events, Lab Results, and Concomitant Medications.
   - Dynamic visual graph renderer with interactive patient ego-subgraphs and filtering.
3. **Subject 360**:
   - Complete clinical timeline per subject.
   - Interactive longitudinal lab trajectory charts (ALT, AST, Bilirubin, Platelets) plotted against upper limits of normal (ULN).
   - Side-by-side adverse event dossiers, concomitant medications, and linked clinical findings.
4. **Ask ATLAS (Deterministic Clinical Query Engine)**:
   - Evaluates natural language trial questions across 4 distinct categories:
     - **COUNT**: e.g., *"How many subjects experienced severe adverse events?"*
     - **LOOKUP**: e.g., *"Show ALT values and visits for subject 042-S02-004"*
     - **FINDING**: e.g., *"Which subjects meet potential Hy's Law criteria?"*
     - **TRAP**: Identifies out-of-scope, ungrounded, or counter-factual questions and safely responds with `INSUFFICIENT_EVIDENCE` or `OUTSIDE_STUDY_SCOPE`.
   - **Provable RecordRef Provenance**: Every metric and finding is bound to underlying record keys (`AE-042-S02-004-01`, `LB-042-S02-004-03`) inspectable in the Clinical Evidence Drawer.

---

### Problem 2: MONITOR (Autonomous Clinical Monitoring Crew)
1. **6-Node Sequential Review Pipeline**:
   ```
   [1. DETECT] → [2. MEDICAL_REVIEW] → [3. DATA_MANAGER] → [4. COMPLIANCE] → [5. HUMAN_GATE] → [6. EXECUTE]
   ```
   - **`detect`**: Evaluates SDTM data against active protocol rules (SAE miscoding, DILI risk, visit tolerances, dose compliance).
   - **`medical_review`**: Formulates clinical severity assessments, flags hospitalization criteria, and drafts safety escalations.
   - **`data_manager`**: Dispatches formal queries to investigative sites and coordinates data discrepancy resolution.
   - **`compliance`**: Audits protocol version adherence (e.g., protocol v1.0 ±7 day visit windows vs tightened v2.0 ±3 day windows).
   - **`human_gate`**: Mandatory sovereign safety checkpoint for Medical Monitors to `APPROVE`, `REJECT`, or request `CLARIFY`.
   - **`execute`**: Finalizes committed actions, updates monitoring memory, and closes cycle dossiers.
2. **Medical Monitor Human Gate & Clarification Desk**:
   - Medical Monitors review proposed safety actions and can probe the Knowledge Graph with natural language inquiries (e.g., *"What was baseline ALT and is the subject taking concomitant hepatotoxic meds?"*).
   - The platform deterministic retrieval engine returns ground-truth evidence directly from the patient graph to resolve the edge case.
3. **Cross-Cycle Persistent Memory (Zero Duplicates)**:
   - Query and escalation signatures are tracked with unique idempotency hash keys.
   - Re-running a monitoring cycle on the same data cut yields **0 duplicate queries** and **0 duplicate escalations**.
4. **Decision Trace (21 CFR Part 11 Audit Trail)**:
   - Immutable sequential ledger recording timestamp, agent node, action taken, decision outcome, subject ID, and clinical message.
5. **Data Cut Simulator**:
   - Seamlessly toggle between Cut 1 (Baseline), Cut 2 (Cumulative Mid-Study), and Cut 3 (Final Reconciled).
   - "What Changed?" delta analyzer calculates newly ingested records, emerging findings, and suppressed duplicates.
6. **Regulatory Cycle Reports**:
   - Comprehensive monitoring dossiers exportable as regulatory CSV files for IRB and FDA/EMA inspections.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & `npm`
- (Optional) **Docker & Docker Compose**

---

### Option A: Local Development Run (Fastest)

#### 1. Backend Setup
```bash
# Navigate to project root
cd atlas-monitor

# Install Python dependencies
pip install -r backend/requirements.txt

# Run FastAPI backend server (seeds CDISC demo data automatically on first launch)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend will be live at `http://localhost:8000`. Swagger API docs at `http://localhost:8000/docs`.

#### 2. Frontend Setup
In a separate terminal:
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### Option B: Docker Compose Deployment

```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

---

## 👥 Demo User Accounts

| Role | Email | Password | Suggested Purpose |
| :--- | :--- | :--- | :--- |
| **System Administrator / Data Scientist** | `admin@atlas.clinical` | `AdminPass123!` | Full administrative and trial configuration access |
| **Medical Monitor** | `medical.monitor@pharma.com` | `MonitorPass123!` | Human Gate safety sign-off, Clarification Desk review |
| **Clinical Data Manager** | `data.manager@trials.net` | `DataPass123!` | Query discrepancy management, deduplication audit |
| **Lead CRA / Site Monitor** | `cra.lead@siteoperations.org` | `CraPass123!` | Site operations, visit scheduling, CRA query answers |

*(All accounts are pre-seeded in the database and selectable via quick-login buttons on the login screen).*

---

## 🧪 Comprehensive Verification Scenarios

The platform includes automated seed fixtures for 8 standard clinical trial monitoring scenarios:

### Scenario A: SAE Miscoding Detection (`042-S02-004`)
- **Condition**: Subject experienced an adverse event with `AESER = 'N'` (Non-Serious), but hospitalization records indicate inpatient admission (`AESHOSP = 'Y'`).
- **Review Crew Action**: The `detect` and `medical_review` nodes catch the miscoding discrepancy, trigger rule `RULE-SAE-MISCODE`, and escalate to the Human Gate for expedited regulatory 24h notification.

### Scenario B: Pre-Dose Adverse Event Ingestion
- **Condition**: Adverse event onset date preceded the first dose date (`RFSTDTC`).
- **System Action**: Handled properly as medical history / baseline condition rather than treatment-emergent event.

### Scenario C: Elevated Screening ALT (DILI Candidate Monitoring)
- **Condition**: Subject screened with elevated transaminases (`ALT = 88 U/L`) but no concomitant acetaminophen.
- **System Action**: Logged under `MONITORING` category rather than false-positive treatment-emergent DILI.

### Scenario D: Site Dosing Non-Compliance & Recurring Deviation
- **Condition**: Site 042 exhibits repeated subject dosing compliance below protocol threshold (`< 80%`).
- **System Action**: Compliance node generates a site-level non-adherence flag with mandatory CRA re-training notice.

### Scenario E: Unit Harmonization & Censored Lab Ingestion
- **Condition**: International lab results supplied in `µkat/L` or with qualifiers like `<5`.
- **System Action**: Converted accurately to `U/L` and structured numeric equivalents without loss of provenance.

### Scenario F: Ask ATLAS Trap Query Answering
- **Query**: *"What is the mortality rate for subjects treated with Pembrolizumab?"* (Pembrolizumab is not an investigational product in this study).
- **ATLAS Response**: Correctly identifies out-of-scope entity and responds `OUTSIDE_STUDY_SCOPE` with 0 hallucinated facts.

### Scenario G: Persistent Memory Deduplication
- **Action**: Run monitoring cycle on Cut 1, then re-run on Cut 1.
- **Verification**: Cycle 2 outputs exactly **0 new queries** and **0 duplicate escalations**.

### Scenario H: Human Gate Clarification & Resolution
- **Action**: Medical Monitor queries Knowledge Graph regarding baseline ALT for an escalating subject.
- **Resolution**: Ground-truth baseline labs and concomitant medication records are retrieved, enabling the Medical Monitor to approve the action with a complete audit footprint.

---

## 🧪 Running Automated Test Suite

Run the full end-to-end pytest test suite (covers normalization, ATLAS engine, Review Crew, idempotency, human gate, cascade updates, and reports):

```bash
# Run backend tests
python -m pytest backend/app/tests/test_all.py -v
```

Output:
```
backend/app/tests/test_all.py::test_normalization_and_units PASSED       [ 12%]
backend/app/tests/test_all.py::test_atlas_four_question_types PASSED     [ 25%]
backend/app/tests/test_all.py::test_scenario_a_sae_miscoded PASSED       [ 37%]
backend/app/tests/test_all.py::test_monitor_review_crew_and_trace PASSED [ 50%]
backend/app/tests/test_all.py::test_duplicate_prevention_across_reruns PASSED [ 62%]
backend/app/tests/test_all.py::test_human_gate_clarify_workflow PASSED   [ 75%]
backend/app/tests/test_all.py::test_manual_subject_creation_and_cascade PASSED [ 87%]
backend/app/tests/test_all.py::test_report_generation PASSED             [100%]

======================= 8 passed in 1.18s ========================
```

---

## 🖥️ Screen Directory (All 24 Screens Implemented)

1. `LoginScreen`: Multi-role credential selector & secure JWT auth.
2. `StudySelectScreen`: Multi-study portfolio picker with health status badges.
3. `StudySetupScreen`: Protocol versions, sites directory, and CDISC domains.
4. `DashboardScreen`: High-level operational cockpit with KPI metrics & cycle runner.
5. `SubjectsScreen`: Complete participant directory with enrollment filters.
6. `AddSubjectScreen`: Manual CRF data entry (cascades to DB, Graph, and MONITOR).
7. `ImportScreen`: CDISC SDTM file uploader (DM, AE, LB, EX, SV, CM).
8. `ValidationScreen`: Live normalization auditor (unit conversions, censored values).
9. `KnowledgeGraphScreen`: Interactive visual trial network with ego-subgraphs.
10. `Subject360Screen`: Longitudinal participant dashboard with lab trajectory plots.
11. `AskAtlasScreen`: Deterministic natural language query desk (COUNT, LOOKUP, FINDING, TRAP).
12. `FindingsScreen`: Triage workstation for safety, quality, and compliance findings.
13. `ReviewCrewScreen`: 6-node state machine visualizer with live step execution.
14. `MedicalReviewScreen`: Medical Monitor clinical assessment workstation.
15. `QueriesScreen`: Data Management discrepancy resolution center.
16. `ComplianceScreen`: Protocol deviation registry & site adherence flags.
17. `HumanGateScreen`: Sovereign Medical Monitor approval/rejection checkpoint.
18. `ClarificationScreen`: Knowledge Graph-assisted clarification desk.
19. `DecisionTraceScreen`: 21 CFR Part 11 compliant immutable audit ledger.
20. `CycleReportScreen`: Monitoring cycle dossier viewer & CSV export.
21. `SiteOperationsScreen`: CRA / site coordinator schedule and query response workstation.
22. `ProtocolRulesScreen`: Protocol v1.0 vs v2.0 amendment comparator.
23. `QueryHistoryScreen`: Cross-cycle query ledger & deduplication validator.
24. `DataCutSimulatorScreen`: Longitudinal cut switcher (Cut 1 vs Cut 2 vs Cut 3) & delta inspector.

---

## 📜 Regulatory & GCP Compliance Notes
- **21 CFR Part 11**: All agent node actions, user sign-offs, and query modifications are recorded in an append-only trace ledger with timestamps and user identifiers.
- **Good Clinical Practice (GCP E6 R2)**: Risk-based monitoring algorithms detect systemic site non-compliance and transaminase threshold deviations automatically.
- **Audit Trails**: Provenance citations (`RecordRef`) are maintained from initial CDISC ingestion through to final monitoring report generation.

---

## 📄 License
Proprietary Hackathon Solution — Developed for Clinical Trial Intelligence & Autonomous Review.
