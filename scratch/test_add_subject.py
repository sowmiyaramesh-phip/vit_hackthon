import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def test_add_subject():
    print("\n--- 9. Testing Add Subject Wizard Flow (042-S12-008) ---")
    payload = {
        "subject_id": "042-S12-009",
        "site_id": "SITE-112",
        "enrollment_date": "2026-03-10",
        "study_status": "Active",
        "age": 52,
        "sex": "M",
        "medical_history": [
            {"condition": "Liver disease", "start_date": "2025-06-15", "status": "Ongoing", "evidence_source": "HIST #042-S12-009-01"}
        ],
        "medications": [
            {"medication": "Drug A", "dose": "50 mg", "route": "Oral", "frequency": "Once daily", "start_date": "2026-03-12", "end_date": None, "status": "Ongoing", "evidence_source": "CM #042-S12-009-01"}
        ],
        "visits": [
            {"visit_name": "Screening", "visit_date": "2026-03-10", "target_day": -14, "actual_day": -14, "visit_window": "±7 days", "status": "Completed"},
            {"visit_name": "Visit 2", "visit_date": "2026-03-24", "target_day": 14, "actual_day": 14, "visit_window": "±7 days", "status": "Completed"}
        ],
        "labs": [
            {"test": "ALT", "value": "215", "unit": "U/L", "reference_range": "7-56", "collection_date": "2026-03-24"},
            {"test": "BILI", "value": "3.2", "unit": "mg/dL", "reference_range": "0.2-1.2", "collection_date": "2026-03-24"}
        ],
        "dosing": [
            {"visit": "Visit 2", "planned_dose": 50.0, "actual_dose": 50.0, "dose_date": "2026-03-24"}
        ],
        "adverse_events": [
            {"event": "Fatigue", "start_date": "2026-03-25", "end_date": None, "severity": "Moderate", "seriousness": "No", "hospitalization": "No", "relationship": "Possible", "status": "Ongoing"}
        ]
    }

    req = urllib.request.Request(
        f"{BASE_URL}/subjects",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    res = json.loads(urllib.request.urlopen(req).read().decode())
    print("Add Subject Response:", res.get("message"))
    print("Findings generated:", len(res.get("findings", [])))

    # Verify Subject 360 can retrieve the newly created subject
    req_360 = urllib.request.urlopen(f"{BASE_URL}/subjects/042-S12-009")
    s360 = json.loads(req_360.read().decode())
    print("Subject 360 retrieved successfully!")
    header = s360.get("header", {})
    sections = s360.get("sections", {})
    print(f"Subject: {header.get('subject_id')}, Age: {header.get('age')}")
    print(f"Labs count: {len(sections.get('labs', []))}")
    print(f"Findings in Subject 360: {len(sections.get('findings', []))}")
    print("Detected Finding:", sections.get("findings", [{}])[0].get("title"))
    assert header.get('subject_id') == "042-S12-009"
    assert len(sections.get('findings', [])) > 0
    print("Subject 360 Verification Passed!")

if __name__ == "__main__":
    test_add_subject()
