from pathlib import Path

# Update ai_service.py to query LabResult and ConcomitantMedication directly with db.query
ai_path = Path("backend/app/ai/ai_service.py")
text = ai_path.read_text(encoding="utf-8")
old_block = """        for lb in subj.labs:
            if "SCREEN" in str(lb.visit_name).upper() and lb.test_code == "ALT":
                scr_alt = lb
                scr_alt_val = f"{lb.raw_value} {lb.normalized_unit}"
                scr_ev = {
                    "record_type": "LAB",
                    "record_id": lb.record_id,
                    "subject_id": sid,
                    "field": "ALT (Screening)",
                    "value": scr_alt_val
                }
                break

        if not scr_alt and subj.labs:
            # First available ALT
            for lb in subj.labs:
                if lb.test_code == "ALT":
                    scr_alt_val = f"{lb.raw_value} {lb.normalized_unit} ({lb.visit_name})"
                    scr_ev = {
                        "record_type": "LAB", "record_id": lb.record_id,
                        "subject_id": sid, "field": f"ALT ({lb.visit_name})", "value": scr_alt_val
                    }
                    break

        # 2. Retrieve Concomitant Medications (specifically hepatotoxic)
        conmeds = subj.conmeds"""

new_block = """        subj_labs = db.query(LabResult).filter(LabResult.subject_id == subj.id).all()
        for lb in subj_labs:
            if lb.test_code == "ALT":
                scr_alt = lb
                scr_alt_val = f"{lb.raw_value} {lb.normalized_unit}"
                scr_ev = {
                    "record_type": "LAB",
                    "record_id": lb.record_id,
                    "subject_id": sid,
                    "field": "ALT (Screening)",
                    "value": scr_alt_val
                }
                break

        # 2. Retrieve Concomitant Medications (specifically hepatotoxic)
        conmeds = db.query(ConcomitantMedication).filter(ConcomitantMedication.subject_id == subj.id).all()"""

if old_block in text:
    text = text.replace(old_block, new_block)
    ai_path.write_text(text, encoding="utf-8")
    print("ai_service.py updated successfully!")
else:
    print("Pattern not found in ai_service.py")
