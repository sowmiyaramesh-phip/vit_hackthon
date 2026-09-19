import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("--- 1. Testing Study Dashboard ---")
    req = urllib.request.urlopen(f"{BASE_URL}/studies/ABC-101/dashboard")
    dash = json.loads(req.read().decode())
    print(f"Study: {dash.get('study_id')}, Total subjects: {dash.get('total_subjects')}, Active findings: {dash.get('active_findings')}")
    assert dash.get("study_id") == "ABC-101"

    print("\n--- 2. Testing Disease Explorer (Liver disease) ---")
    req = urllib.request.urlopen(f"{BASE_URL}/disease-explorer?disease=Liver%20disease")
    de = json.loads(req.read().decode())
    print(f"Matched: {de.get('matched')}, Subjects found: {de.get('total_subjects')}")
    print(f"Treatments observed: {de.get('treatments_observed')}")
    # Verify 8 subjects found
    assert de.get("total_subjects") == 8
    # Verify Drug A: 5, Drug B: 2, Other/None: 1
    assert de.get("treatments_observed", {}).get("Drug A") == 5
    assert de.get("treatments_observed", {}).get("Drug B") == 2

    print("\n--- 3. Testing Ask ATLAS Trap Question ---")
    trap_payload = json.dumps({"question": "What is the cure rate of Drug A for Liver disease in ABC-101?"}).encode()
    req = urllib.request.Request(f"{BASE_URL}/atlas/answer", data=trap_payload, headers={"Content-Type": "application/json"})
    ans = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"Kind: {ans.get('kind')}")
    print(f"Answer: {ans.get('answer')}")
    # Verify trap immunity: NO UNSUPPORTED CLAIMS
    assert "Relationship not established from available study data" in ans.get("answer") or "not established" in ans.get("answer").lower()

    print("\n--- 4. Testing Adversarial Event (Site S04 Glucose Anomaly) ---")
    req = urllib.request.urlopen(f"{BASE_URL}/watch/events")
    events = json.loads(req.read().decode())
    print(f"Adversarial events count: {len(events)}")
    s04_event = next((e for e in events if "104" in e.get("site_id", "") or "GLUC" in e.get("test_code", "")), None)
    assert s04_event is not None
    print(f"S04 Classification: {s04_event.get('classification')}")
    print(f"Description: {s04_event.get('description')}")
    assert "DATA_INTEGRITY" in s04_event.get("classification")

    print("\n--- 5. Testing Explain Decision (D-012) ---")
    req = urllib.request.urlopen(f"{BASE_URL}/watch/decisions/D-012/explain")
    exp = json.loads(req.read().decode())
    print(f"Decision ID: {exp.get('decision_id')}")
    print(f"WHAT: {exp.get('what')}")
    print(f"WHY: {exp.get('why')}")
    print(f"Trace Verified: {exp.get('trace_consistency', {}).get('verified')}")
    assert exp.get("trace_consistency", {}).get("verified") is True

    print("\n--- 6. Testing Human Gate Clarification Retrieval ---")
    req = urllib.request.urlopen(f"{BASE_URL}/monitor/escalations")
    escalations = json.loads(req.read().decode())
    print(f"Pending escalations: {len(escalations)}")
    hys_esc = next((e for e in escalations if "HYS" in e.get("escalation_id", "") or "042-S07-002" in e.get("subject_id", "")), escalations[0])
    
    clarify_payload = json.dumps({
        "action": "CLARIFY",
        "clarification_question": "What were the baseline AST/ALT levels before the jump?",
        "reviewer": "Dr. Sarah Chen"
    }).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/monitor/escalations/{hys_esc['escalation_id']}/action",
        data=clarify_payload,
        headers={"Content-Type": "application/json"}
    )
    cl_res = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"Clarification Action: {cl_res.get('action')}")
    print(f"Retrieved Evidence: {cl_res.get('clarification_answer')}")
    assert cl_res.get("action") == "CLARIFIED" or cl_res.get("escalation", {}).get("status") == "CLARIFIED"

    print("\n--- 7. Testing Human Gate Approval ---")
    app_payload = json.dumps({
        "action": "APPROVE",
        "reviewer": "Dr. Sarah Chen",
        "notes": "Approved temporary drug hold. Confirmed Hy's law threshold met."
    }).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/monitor/escalations/{hys_esc['escalation_id']}/action",
        data=app_payload,
        headers={"Content-Type": "application/json"}
    )
    app_res = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"Approval Result: {app_res.get('action')}")
    assert app_res.get("action") == "APPROVED" or app_res.get("escalation", {}).get("status") == "APPROVED"

    print("\n--- 8. Testing 21 CFR Part 11 Audit Trail ---")
    req = urllib.request.urlopen(f"{BASE_URL}/governance/audit-trail")
    audit = json.loads(req.read().decode())
    print(f"Audit log length: {len(audit)}")
    assert len(audit) > 0

    print("\n=======================================================")
    print("ALL 8 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!")
    print("=======================================================")

if __name__ == "__main__":
    test_api()
