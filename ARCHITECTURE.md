# ATLAS + MONITOR: Technical Architecture & System Design

## 🏛️ System Architecture Overview

ATLAS + MONITOR is architected as an integrated clinical trial intelligence and autonomous monitoring platform, adhering strictly to **CDISC SDTM** standards, **21 CFR Part 11** electronic record guidelines, and **ICH GCP E6(R2)** risk-based monitoring principles.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA INGESTION & NORMALIZATION                  │
│   CDISC SDTM (DM, AE, LB, EX, SV, CM)  │  Censored Values  │  Unit Harmonizer │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         TRIAL KNOWLEDGE GRAPH                          │
│   Study ──> Site ──> Subject ──> Visit ──> LabResult / AdverseEvent    │
│   ConMed ──> Subject         Ego-Subgraphs    Graph Rebuilding Engine  │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│        PROBLEM 1: ATLAS              │  │      PROBLEM 2: MONITOR      │
│  • Patient 360 & Trajectory Plots    │  │  • 6-Node Review Crew:       │
│  • Deterministic NLP Query Engine    │  │    1. DETECT                 │
│    (COUNT, LOOKUP, FINDING, TRAP)    │  │    2. MEDICAL_REVIEW         │
│  • Provable RecordRef Provenance     │  │    3. DATA_MANAGER           │
│  • Zero-Hallucination Safe Mode      │  │    4. COMPLIANCE             │
│                                      │  │    5. HUMAN_GATE             │
│                                      │  │    6. EXECUTE                │
│                                      │  │  • Persistent Memory         │
│                                      │  │  • 21 CFR Part 11 Trace      │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 🗄️ Relational Schema & Knowledge Graph Topology

The platform database comprises 31 relational tables engineered in SQLAlchemy:

### Core Hierarchy
1. `Organization`: Top-level trial sponsor or CRO.
2. `Study`: Clinical protocol definition (`study_id`, `current_cut`, `current_protocol_version`, `status`).
3. `Site`: Investigative medical centers (`site_id`, `name`, `pi_name`, `location`).
4. `Subject`: Trial participants (`usubjid`, `subjid`, `arm`, `age`, `sex`, `rfstdtc`, `rfendtc`).
5. `Visit`: Scheduled protocol checkpoints (`visit_num`, `visit_name`, `target_date`, `actual_date`).

### Clinical Domains (CDISC SDTM)
6. `LabResult` (`LB`): Normalized laboratory results (`test_code`, `raw_value`, `normalized_value`, `normalized_unit`, `uln`, `is_abnormal`, `is_censored`).
7. `AdverseEvent` (`AE`): Toxicities and emergent events (`aeterm`, `severity`, `is_serious`, `is_hospitalized`, `start_date`, `end_date`, `is_miscoded`).
8. `ConMed` (`CM`): Concomitant medications (`treatment`, `indication`, `start_date`, `is_hepatotoxic`).
9. `Exposure` (`EX`): Study drug administration records (`dose`, `dose_unit`, `compliance_pct`).

### Intelligence & Monitoring State
10. `Finding`: Prospective discrepancies detected across Safety, Data Quality, and Compliance.
11. `Evidence`: Provenance citations linking findings to atomic database records via `record_type` and `record_id`.
12. `MonitoringCycle`: Execution snapshot recording run dates, cuts, protocol versions, and status.
13. `Escalation`: Safety actions escalated to Medical Monitors (`proposed_action`, `medical_review_summary`, `status`).
14. `DataQuery`: Formal queries directed to investigative sites (`problem_description`, `requested_action`, `status`).
15. `ProtocolDeviation`: Protocol violations (`rule_code`, `protocol_version`, `type`, `severity`).
16. `SiteFlag`: Recurring site non-adherence flags (`recurring_count`, `reason`).
17. `TraceEntry`: 21 CFR Part 11 append-only audit trail.

---

## 📐 Clinical Normalization Mathematics

### Unit Harmonization
International clinical laboratories frequently report serum enzyme concentrations in katals (`µkat/L`), while FDA submissions mandate `U/L`:

$$1\ \mu\text{kat/L} = 60\ \text{U/L}$$

Given raw lab value $V_{\text{raw}}$ in $\mu\text{kat/L}$:

$$V_{\text{norm}} = V_{\text{raw}} \times 60.0$$

### Comma-Decimal & Censored Value Parsing
Clinical values recorded in European formats ($14,2$) or censored assay ranges ($<5$, $>100$, $\text{ND}$) are parsed via a deterministic lexical scanner:

$$\text{Scan}(s) \to (V_{\text{numeric}}, \text{Operator}, \text{IsCensored})$$

- If $s = \text{"<5"}$, then $V_{\text{numeric}} = 5.0$, $\text{Operator} = \text{"<"}$, $\text{IsCensored} = \text{True}$.
- If $s = \text{"14,2"}$, then $V_{\text{numeric}} = 14.2$, $\text{Operator} = \text{"="}$, $\text{IsCensored} = \text{False}$.

### Drug-Induced Liver Injury (Hy's Law)
Hy's Law criteria predict severe drug-induced liver injury (DILI) with high specificity:

$$\text{Hy's Law} \iff (\text{ALT} \ge 3 \times \text{ULN}) \land (\text{Total Bilirubin} \ge 2 \times \text{ULN}) \land (\text{ALP} < 2 \times \text{ULN})$$

---

## 🧠 ATLAS: Deterministic Clinical Query Engine

ATLAS evaluates clinical queries deterministically without relying on ungrounded generative hallucination:

1. **Question Categorization**:
   - `COUNT`: Quantitative aggregation across filtered sub-populations.
   - `LOOKUP`: Retrieval of specific record fields for a validated subject or site.
   - `FINDING`: Rule-based evaluation of clinical candidates (e.g., elevated ALT, SAEs).
   - `TRAP`: Ungrounded or out-of-scope inquiries (e.g., non-existent drugs or unrecorded domains).

2. **Provenance Preservation**:
   Every response includes structured provenance metadata:
   ```json
   {
     "record_type": "adverse_events",
     "record_id": "AE-042-S02-004-01",
     "subject_id": "042-S02-004",
     "field": "AESER",
     "value": "N"
   }
   ```

---

## 🤖 MONITOR: 6-Node Autonomous Review Crew

```
[1. DETECT]
   │
   ▼
[2. MEDICAL_REVIEW]
   │
   ▼
[3. DATA_MANAGER]
   │
   ▼
[4. COMPLIANCE]
   │
   ▼
[5. HUMAN_GATE] ──── (Medical Monitor Approval / Clarification)
   │
   ▼
[6. EXECUTE]
```

### State Machine Transition Contract
1. **`detect`**: Evaluates active cut records against versioned rules. Detects safety, data quality, and compliance candidates.
2. **`medical_review`**: Evaluates seriousness criteria (`AESHOSP == 'Y'`), assesses transaminase spikes against baseline values, and creates prospective safety escalations.
3. **`data_manager`**: Inquires Persistent Monitoring Memory. Suppresses duplicates and issues formal queries to sites.
4. **`compliance`**: Audits visit windows ($\pm 7\text{ days}$ under v1.0 vs $\pm 3\text{ days}$ under v2.0) and dosing adherence ($\ge 75\%$ vs $\ge 80\%$). Flags recurring site discrepancies.
5. **`human_gate`**: Sovereign Medical Monitor intervention checkpoint. Options:
   - `APPROVE`: Action endorsed for permanent execution.
   - `REJECT`: Action dismissed with clinical justification.
   - `CLARIFY`: Generates a query to the Trial Knowledge Graph to inspect baseline values and concomitant medications.
6. **`execute`**: Commits status transitions, writes immutable 21 CFR Part 11 audit records, and updates persistent cross-cycle memory.

---

## 🔒 Persistent Memory & Deduplication Hash

To prevent duplicate queries when cuts are re-evaluated, MONITOR generates a deterministic idempotency hash for each discrepancy:

$$H = \text{SHA256}(\text{StudyID} \mathbin{\Vert} \text{RuleCode} \mathbin{\Vert} \text{SubjectID} \mathbin{\Vert} \text{Domain} \mathbin{\Vert} \text{RecordID})$$

Before inserting any query into the active database, the Data Manager node verifies:

$$\exists\ q \in \text{DataQueries} \quad \text{where} \quad \text{Hash}(q) = H \implies \text{Suppress Creation}$$

This ensures that re-running monitoring cycles produces **0 duplicate queries**.

---

## 📜 21 CFR Part 11 Audit Trail Specification

Every state transition in the system records an immutable entry in the `TraceEntry` ledger:
- **Timestamp**: High-precision UTC timestamp.
- **Node**: Agent node responsible for the action (`detect`, `medical_review`, `data_manager`, `compliance`, `human_gate`, `execute`).
- **Action**: Verifiable description of the operation.
- **Decision**: Outcome of the operation (`FLAGGED`, `APPROVED`, `REJECTED`, `CLARIFIED`, `SUPPRESSED`).
- **User / Agent ID**: Actor identifier.
- **Protocol Version & Cut Number**: Exact snapshot parameters under which the action occurred.
