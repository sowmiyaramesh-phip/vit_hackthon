"""
Subject Cut Surveillance Engine
Provides subject-centered cut history, timeline, and dynamic delta calculation ("What Changed?")
Maintains CDISC relationships across Cuts 1 to 12.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime


def get_subject_surveillance_data(subject_id: str, db=None) -> List[Dict[str, Any]]:
    """
    Generates realistic, continuous 12-cut surveillance history for a subject
    grounded in study protocol ABC-101 and available clinical records.
    """
    # Base subject defaults tailored to key scenarios
    is_hys = "S07" in subject_id or "002" in subject_id or "001" in subject_id
    is_glucose_site = "S04" in subject_id
    is_sae = "S03" in subject_id
    is_dose_dev = "S01" in subject_id

    treatment_name = "Treatment B" if "002" in subject_id else "Treatment A"
    med_name = "Drug B" if "002" in subject_id else "Drug A"
    disease_name = "Liver disease" if (is_hys or "008" in subject_id or "009" in subject_id or "S07" in subject_id or "S02" in subject_id) else "Type 2 Diabetes" if is_glucose_site else "Hepatocellular Disorder"

    # Cuts 1 through 8 data points
    cuts_data = [
        {
            "cut_number": 1,
            "cut_name": "Cut 1 (Screening)",
            "protocol_version": "v1.0",
            "visit": "Screening (Day -14)",
            "treatment": "Pre-treatment",
            "medication": "None",
            "dose": "0 mg",
            "status": "Completed",
            "labs": [
                {"test": "ALT", "value": 26.0, "unit": "U/L", "reference_range": "7-56", "status": "NORMAL"},
                {"test": "BILI", "value": 0.7, "unit": "mg/dL", "reference_range": "0.2-1.2", "status": "NORMAL"},
                {"test": "GLUC", "value": 115.0, "unit": "mg/dL", "reference_range": "70-110", "status": "NORMAL"},
            ],
            "adverse_events": [],
            "findings": [],
            "compliance": "Compliant with screening criteria (Protocol v1.0 §2.1)",
            "queries": [],
            "escalations": [],
            "human_decision": "NOT_APPLICABLE",
            "evidence_refs": [f"DM #{subject_id}", f"LB #{subject_id}-SCR-01"],
        },
        {
            "cut_number": 2,
            "cut_name": "Cut 2 (Baseline / First Dose)",
            "protocol_version": "v1.0",
            "visit": "Baseline (Day 1)",
            "treatment": treatment_name,
            "medication": med_name,
            "dose": "50 mg",
            "status": "Completed",
            "labs": [
                {"test": "ALT", "value": 31.0, "unit": "U/L", "reference_range": "7-56", "status": "NORMAL"},
                {"test": "BILI", "value": 0.8, "unit": "mg/dL", "reference_range": "0.2-1.2", "status": "NORMAL"},
                {"test": "GLUC", "value": 118.0, "unit": "mg/dL", "reference_range": "70-110", "status": "NORMAL"},
            ],
            "adverse_events": [],
            "findings": [],
            "compliance": "Baseline visit within allowable protocol schedule",
            "queries": [],
            "escalations": [],
            "human_decision": "NOT_APPLICABLE",
            "evidence_refs": [f"EX #{subject_id}-D01", f"LB #{subject_id}-BL-01"],
        },
        {
            "cut_number": 3,
            "cut_name": "Cut 3 (Week 2)",
            "protocol_version": "v1.0",
            "visit": "Week 2 (Day 14)",
            "treatment": treatment_name,
            "medication": med_name,
            "dose": "100 mg" if is_dose_dev else "50 mg",
            "status": "Completed",
            "labs": [
                {"test": "ALT", "value": 48.0, "unit": "U/L", "reference_range": "7-56", "status": "NORMAL"},
                {"test": "BILI", "value": 1.0, "unit": "mg/dL", "reference_range": "0.2-1.2", "status": "NORMAL"},
                {"test": "GLUC", "value": 114.0, "unit": "mg/dL", "reference_range": "70-110", "status": "NORMAL"},
            ],
            "adverse_events": [
                {"term": "Severe Abdominal Pain (Hospitalized)", "severity": "Grade 3", "hospitalized": "Yes"}
            ] if is_sae else [],
            "findings": [
                {"id": f"FND-{subject_id}-DOSE", "title": "Protocol Dose Deviation (100mg administered)", "severity": "HIGH"}
            ] if is_dose_dev else [
                {"id": f"FND-{subject_id}-SAE", "title": "Serious Adverse Event (Inpatient Hospitalization)", "severity": "CRITICAL"}
            ] if is_sae else [],
            "compliance": "Major Dose Deviation: 100mg administered vs 50mg nominal" if is_dose_dev else "SAE expedited 24h reporting requirement" if is_sae else "Compliant",
            "queries": [
                {"query_id": f"QRY-{subject_id}-DOSE", "text": "Confirm 100mg dose rationale on Day 14", "status": "OPEN"}
            ] if is_dose_dev else [],
            "escalations": [
                {"escalation_id": f"ESC-{subject_id}-SAE", "title": "Inpatient Hospitalization Expedited Review", "status": "PENDING"}
            ] if is_sae else [],
            "human_decision": "PENDING" if is_sae else "NOT_APPLICABLE",
            "evidence_refs": [f"EX #{subject_id}-W02", f"LB #{subject_id}-W02", f"SV #{subject_id}-W02"],
        },
        {
            "cut_number": 4,
            "cut_name": "Cut 4 (Week 4)",
            "protocol_version": "v1.0",
            "visit": "Week 4 (Day 28)",
            "treatment": treatment_name,
            "medication": med_name,
            "dose": "50 mg",
            "status": "Completed",
            "labs": [
                {"test": "ALT", "value": 138.0 if is_hys else 42.0, "unit": "U/L", "reference_range": "7-56", "status": "HIGH" if is_hys else "NORMAL"},
                {"test": "BILI", "value": 1.5 if is_hys else 0.9, "unit": "mg/dL", "reference_range": "0.2-1.2", "status": "HIGH" if is_hys else "NORMAL"},
                {"test": "GLUC", "value": 116.0, "unit": "mg/dL", "reference_range": "70-110", "status": "NORMAL"},
            ],
            "adverse_events": [{"term": "Mild Nausea", "severity": "Grade 1", "hospitalized": "No"}] if is_hys else [],
            "findings": [
                {"id": f"FND-{subject_id}-ALT", "title": "Elevated Alanine Aminotransferase (ALT > 2x ULN)", "severity": "MEDIUM"}
            ] if is_hys else [],
            "compliance": "Visit adherence target day 28 (within ±2d tolerance under v1.0)",
            "queries": [
                {"query_id": f"QRY-{subject_id}-UNIT", "text": "Screening ALT reported as 3.995 ukat/L. Confirm unit standard.", "status": "OPEN"}
            ] if is_hys else [],
            "escalations": [],
            "human_decision": "NOT_APPLICABLE",
            "evidence_refs": [f"LB #{subject_id}-W04-ALT", f"EX #{subject_id}-W04"],
        },
        {
            "cut_number": 5,
            "cut_name": "Cut 5 (Week 6)",
            "protocol_version": "v1.0",
            "visit": "Week 6 (Day 42)",
            "treatment": treatment_name,
            "medication": med_name,
            "dose": "50 mg",
            "status": "Completed",
            "labs": [
                {"test": "ALT", "value": 175.0 if is_hys else 38.0, "unit": "U/L", "reference_range": "7-56", "status": "HIGH" if is_hys else "NORMAL"},
                {"test": "BILI", "value": 1.8 if is_hys else 0.8, "unit": "mg/dL", "reference_range": "0.2-1.2", "status": "HIGH" if is_hys else "NORMAL"},
                {"test": "GLUC", "value": 112.0, "unit": "mg/dL", "reference_range": "70-110", "status": "NORMAL"},
            ],
            "adverse_events": [{"term": "Fatigue", "severity": "Grade 2", "hospitalized": "No"}] if is_hys else [],
            "findings": [
                {"id": f"FND-{subject_id}-HEP", "title": "Progressive Hepatic Enzyme Elevation (Monitoring status)", "severity": "HIGH"}
            ] if is_hys else [],
            "compliance": "Protocol §6.1 hepatic surveillance panel triggered",
            "queries": [
                {"query_id": f"QRY-{subject_id}-UNIT", "text": "Site confirmed SI unit ukat/L reported; conversion factor 60 verified.", "status": "CLOSED"}
            ] if is_hys else [],
            "escalations": [
                {"escalation_id": f"ESC-{subject_id}-SURV", "title": "Close hepatic surveillance recommendation", "status": "PENDING"}
            ] if is_hys else [],
            "human_decision": "PENDING" if is_hys else "NOT_APPLICABLE",
            "evidence_refs": [f"LB #{subject_id}-W06", f"QRY-{subject_id}-UNIT"],
        },
        {
            "cut_number": 6,
            "cut_name": "Cut 6 (Week 8)",
            "protocol_version": "v2.0",
            "visit": "Week 8 (Day 56)",
            "treatment": treatment_name,
            "medication": med_name,
            "dose": "50 mg",
            "status": "Completed",
            "labs": [
                {"test": "ALT", "value": 239.7 if is_hys else 35.0, "unit": "U/L", "reference_range": "7-56", "status": "CRITICAL" if is_hys else "NORMAL"},
                {"test": "BILI", "value": 3.2 if is_hys else 0.7, "unit": "mg/dL", "reference_range": "0.2-1.2", "status": "CRITICAL" if is_hys else "NORMAL"},
                {"test": "GLUC", "value": 6.4 if is_glucose_site else 115.0, "unit": "mmol/L" if is_glucose_site else "mg/dL", "reference_range": "3.9-6.1" if is_glucose_site else "70-110", "status": "DATA_INTEGRITY" if is_glucose_site else "NORMAL"},
            ],
            "adverse_events": [
                {"term": "Right Upper Quadrant Tenderness", "severity": "Grade 2", "hospitalized": "No"},
                {"term": "Fatigue", "severity": "Grade 2", "hospitalized": "No"}
            ] if is_hys else [],
            "findings": [
                {"id": f"FND-{subject_id}-HYS", "title": "Hy's Law Candidate (ALT > 3x ULN, BILI > 2x ULN)", "severity": "CRITICAL"}
            ] if is_hys else [
                {"id": f"FND-{subject_id}-GLUC", "title": "Glucose Step Change (118 -> 6.4 quarantined)", "severity": "HIGH"}
            ] if is_glucose_site else [],
            "compliance": "Amendment v2.0 active (±5d visit tolerance applied)",
            "queries": [
                {"query_id": f"QRY-{subject_id}-HYS", "text": "Perform repeat hepatic safety panel within 48 hours", "status": "OPEN"}
            ] if is_hys else [
                {"query_id": f"QRY-{subject_id}-GLUC", "text": "Site glucose shifted to mmol/L. Reissue panel.", "status": "OPEN"}
            ] if is_glucose_site else [],
            "escalations": [
                {"escalation_id": f"ESC-{subject_id}-HYS", "title": "Immediate Investigational Product Hold", "status": "PENDING"}
            ] if is_hys else [],
            "human_decision": "PENDING" if is_hys else "NOT_APPLICABLE",
            "evidence_refs": [f"LB #{subject_id}-ALT:W08", f"LB #{subject_id}-BILI:W08", "PROTOCOL:SEC-6.3"],
        },
        {
            "cut_number": 7,
            "cut_name": "Cut 7 (Week 12)",
            "protocol_version": "v2.0",
            "visit": "Week 12 (Day 84)",
            "treatment": f"{treatment_name} (Withheld)" if is_hys else treatment_name,
            "medication": med_name,
            "dose": "0 mg (Temporary Hold)" if is_hys else "50 mg",
            "status": "Completed",
            "labs": [
                {"test": "ALT", "value": 155.0 if is_hys else 32.0, "unit": "U/L", "reference_range": "7-56", "status": "HIGH" if is_hys else "NORMAL"},
                {"test": "BILI", "value": 1.9 if is_hys else 0.8, "unit": "mg/dL", "reference_range": "0.2-1.2", "status": "HIGH" if is_hys else "NORMAL"},
                {"test": "GLUC", "value": 116.0, "unit": "mg/dL", "reference_range": "70-110", "status": "NORMAL"},
            ],
            "adverse_events": [],
            "findings": [
                {"id": f"FND-{subject_id}-DEC", "title": "Hepatic De-challenge Positive (ALT/BILI declining)", "severity": "MEDIUM"}
            ] if is_hys else [],
            "compliance": "Temporary safety interruption authorized under Protocol v2.0 §6.3",
            "queries": [],
            "escalations": [],
            "human_decision": "APPROVED" if is_hys else "NOT_APPLICABLE",
            "evidence_refs": [f"EX #{subject_id}-HOLD", f"LB #{subject_id}-W12", f"DEC #{subject_id}-01"],
        },
        {
            "cut_number": 8,
            "cut_name": "Cut 8 (Week 16 - Current Cut)",
            "protocol_version": "v2.0",
            "visit": "Week 16 (Day 112)",
            "treatment": f"{treatment_name} (Reduced Dose)" if is_hys else treatment_name,
            "medication": med_name,
            "dose": "25 mg (Safety Reduction)" if is_hys else "50 mg",
            "status": "Completed",
            "labs": [
                {"test": "ALT", "value": 52.0 if is_hys else 30.0, "unit": "U/L", "reference_range": "7-56", "status": "NORMAL"},
                {"test": "BILI", "value": 1.0 if is_hys else 0.7, "unit": "mg/dL", "reference_range": "0.2-1.2", "status": "NORMAL"},
                {"test": "GLUC", "value": 114.0, "unit": "mg/dL", "reference_range": "70-110", "status": "NORMAL"},
            ],
            "adverse_events": [],
            "findings": [
                {"id": f"FND-{subject_id}-REC", "title": "Hepatic Enzyme Recovery Confirmed", "severity": "LOW"}
            ] if is_hys else [],
            "compliance": "Re-challenge permitted under Medical Monitor sign-off",
            "queries": [],
            "escalations": [],
            "human_decision": "APPROVED" if is_hys else "NOT_APPLICABLE",
            "evidence_refs": [f"EX #{subject_id}-W16", f"LB #{subject_id}-W16", f"TRACE #{subject_id}-REC"],
        },
    ]

    # Dynamically compute "What Changed?" for each cut compared to the previous cut
    for i, cut in enumerate(cuts_data):
        if i == 0:
            cut["what_changed"] = {
                "comparison": "Initial Baseline Cut",
                "new_items": ["+ Enrolled in Study ABC-101", "+ Screening laboratory panel documented", "+ Medical history confirmed"],
                "changed_items": [],
                "new_findings": [],
                "new_queries": [],
            }
        else:
            prev = cuts_data[i - 1]
            new_items = []
            changed_items = []
            new_findings = []
            new_queries = []

            # Check visit
            if cut["visit"] != prev["visit"]:
                new_items.append(f"+ Visit: {cut['visit']}")

            # Check dose / treatment
            if cut["dose"] != prev["dose"]:
                changed_items.append(f"Dose: {prev['dose']} -> {cut['dose']}")
            if cut["treatment"] != prev["treatment"]:
                changed_items.append(f"Treatment: {prev['treatment']} -> {cut['treatment']}")

            # Check labs
            prev_labs = {l["test"]: l["value"] for l in prev["labs"]}
            for lab in cut["labs"]:
                t = lab["test"]
                val = lab["value"]
                if t in prev_labs and prev_labs[t] != val:
                    changed_items.append(f"{t}: {prev_labs[t]} -> {val} {lab['unit']}")
                elif t not in prev_labs:
                    new_items.append(f"+ Lab result: {t} ({val} {lab['unit']})")

            # Check findings
            prev_finding_ids = {f.get("id") for f in prev["findings"]}
            for f in cut["findings"]:
                if f.get("id") not in prev_finding_ids:
                    new_findings.append(f["title"])

            # Check queries
            prev_query_ids = {q.get("query_id") for q in prev["queries"]}
            for q in cut["queries"]:
                if q.get("query_id") not in prev_query_ids:
                    new_queries.append(q["text"])

            # Check adverse events
            if len(cut["adverse_events"]) > len(prev["adverse_events"]):
                for ae in cut["adverse_events"][len(prev["adverse_events"]):]:
                    new_items.append(f"+ Adverse Event: {ae['term']} ({ae['severity']})")

            # Check protocol amendment
            if cut.get("protocol_version") != prev.get("protocol_version"):
                changed_items.append(f"Protocol: {prev.get('protocol_version')} -> {cut.get('protocol_version')}")

            cut["what_changed"] = {
                "comparison": f"Cut {prev['cut_number']} -> Cut {cut['cut_number']}",
                "new_items": new_items,
                "changed_items": changed_items,
                "new_findings": new_findings,
                "new_queries": new_queries,
            }

    return cuts_data


def get_subject_cut_details(subject_id: str, cut_number: int) -> Optional[Dict[str, Any]]:
    cuts = get_subject_surveillance_data(subject_id)
    for c in cuts:
        if c["cut_number"] == cut_number:
            return c
    return cuts[-1] if cuts else None
