from pathlib import Path

p = Path("backend/app/services/data_service.py")
text = p.read_text(encoding="utf-8")

old_sec = """        # Baseline & Screening Lab for 042-S02-004 (Screening ALT normal 31 U/L)
        lb_a1 = db.query(LabResult).filter(LabResult.record_id == "LAB-0021").first()
        if not lb_a1:
            lb_a1 = LabResult(
                record_id="LAB-0021",
                subject_id=subj_a.id,
                study_id=study.id,
                site_id=s02.id,
                visit_name="Screening",
                test_code="ALT",
                test_name="Alanine Aminotransferase",
                raw_value="31",
                raw_unit="U/L",
                normalized_value=31.0,
                normalized_unit="U/L",
                uln=56.0,
                lln=10.0,
                is_abnormal=False,
                ratio_to_uln=0.55,
                collection_date="2026-01-03",
                conversion_method="DIRECT"
            )
            db.add(lb_a1)"""

new_sec = """        # Baseline & Screening Lab for 042-S02-004 (Screening ALT normal 31 U/L)
        lb_a1 = db.query(LabResult).filter(LabResult.subject_id == subj_a.id, LabResult.test_code == "ALT").first()
        if not lb_a1:
            lb_a1 = LabResult(
                record_id="LAB-0021",
                subject_id=subj_a.id,
                study_id=study.id,
                site_id=s02.id,
                visit_name="Screening",
                test_code="ALT",
                test_name="Alanine Aminotransferase",
                raw_value="31",
                raw_unit="U/L",
                normalized_value=31.0,
                normalized_unit="U/L",
                uln=56.0,
                lln=10.0,
                is_abnormal=False,
                ratio_to_uln=0.55,
                collection_date="2026-01-03",
                conversion_method="DIRECT"
            )
            db.add(lb_a1)
        else:
            lb_a1.record_id = "LAB-0021"
            lb_a1.raw_value = "31"
            lb_a1.normalized_value = 31.0

        # Concomitant medication for 042-S02-004
        cm_a1 = db.query(ConcomitantMedication).filter(ConcomitantMedication.subject_id == subj_a.id).first()
        if not cm_a1:
            cm_a1 = ConcomitantMedication(
                record_id="CM-0001",
                subject_id=subj_a.id,
                study_id=study.id,
                site_id=s02.id,
                seq=1,
                cmtrt="Acetaminophen 500mg",
                cmdecod="PARACETAMOL",
                indication="Fever / Pain",
                start_date="2026-01-20",
                end_date="2026-01-25",
                is_hepatotoxic=True
            )
            db.add(cm_a1)"""

text = text.replace('rec_id = f"LAB-{idx:04d}"', 'rec_id = f"LAB-SDTM-{idx:04d}"')
text = text.replace(old_sec, new_sec)
p.write_text(text, encoding="utf-8")
print("data_service.py updated with specific LAB-0021 and CM-0001 for 042-S02-004!")
