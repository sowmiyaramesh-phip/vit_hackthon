# ATLAS MONITOR WATCH: Sovereign Clinical Trial Surveillance System
> **Explainable Clinical Trial Intelligence & Continuous 12-Cut Surveillance**  
> *Compliant with FDA 21 CFR Part 11, ICH E6 (R2) GCP, and CDISC SDTM Standards.*

---

## ?? Overview
**ATLAS MONITOR WATCH** is an enterprise-grade, agentic clinical trial surveillance and monitoring system designed for Phase I-IV trials. It bridges real-time clinical data streams, graph-based knowledge synthesis, multi-agent AI verification, and sovereign Medical Monitor decision-making with immutable audit trails.

### Core Modules
1. **Stage 1 — ATLAS (Clinical Knowledge Graph & Intelligence)**:
   - Graph-based multi-domain clinical entity resolution (DM, AE, LB, CM, EX, DS).
   - Ground-truth natural language search engine (**Ask ATLAS**) retrieving verified lab findings and protocol sections.
   - Live Patient Journey Timeline with CTC-AE grading.
2. **Stage 2 — MONITOR (Sovereign Review Crew)**:
   - 6-Node sequential review pipeline: DETECT $\to$ MEDICAL REVIEW $\to$ DATA MANAGER $\to$ COMPLIANCE $\to$ HUMAN GATE $\to$ EXECUTE.
   - **Human Gate: Sovereign Reviewer Desk**: Medical Monitor authorization portal with **Approve**, **Reject** (with reason memory), and **Clarify** (ground-truth graph retrieval).
   - **Emergency Safety Hold**: Sovereign authority to initiate acute protocol safety holds.
   - **Decision Trace**: Immutable 21 CFR Part 11 compliant audit trail.
3. **Stage 3 — WATCH (Continuous 12-Cut Longitudinal Surveillance)**:
   - 12-Cut longitudinal data simulation tracking study progression.
   - Adversarial event injection (anomalies, fraud, protocol drift).
   - Real-time LLM Explainer & Counterfactual Analysis.
   - Real-time Token & API Budget consumption tracker.

---

## ?? Quickstart

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & 
pm

### 2. Backend Setup
`ash
# From repository root
py -m pip install -r requirements.txt  # or install fastapi uvicorn pydantic sqlalchemy
py -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
`
API Documentation will be accessible at http://127.0.0.1:8000/docs.

### 3. Frontend Setup
`ash
cd frontend
npm install
npm run dev
# or for production preview:
npm run build
npm run preview -- --port 5173
`
Dashboard will be live at http://127.0.0.1:5173/.

---

## ?? Regulatory & Compliance
- **FDA 21 CFR Part 11**: Immutable audit trail, cryptographically stamped decisions, sovereign human signatures.
- **ICH E6 (R2) GCP**: Risk-based monitoring with human-in-the-loop escalation gates.
- **CDISC SDTM**: Native support for Demographics, Adverse Events, Laboratory, Concomitant Meds, and Disposition domains.
