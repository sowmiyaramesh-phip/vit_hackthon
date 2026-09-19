import os
import csv
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import hash_password
from app.models.models import (
    Organization, User, Role, UserRole, Study, Site, Protocol, ProtocolVersion,
    ProtocolRule, DataCut, Subject, Treatment, Visit, LabResult, AdverseEvent,
    ConcomitantMedication, Finding, Evidence, Query, ProtocolDeviation,
    MonitoringCycle, TraceEntry
)
from app.normalization.normalizer import parse_date, parse_clinical_number, normalize_lab_unit
from app.normalization.validator import ClinicalValidator
from app.protocol.rules_engine import ProtocolRulesEngine
from app.knowledge_graph.graph_service import KnowledgeGraphService

class DataService:
    @staticmethod
    def seed_initial_study_data(db: Session) -> Dict[str, Any]:
        """Seeds full study dataset, demo users, protocols, and worked clinical scenarios."""
        # 1. Organization
        org = db.query(Organization).filter(Organization.slug == "biopharma-global").first()
        if not org:
            org = Organization(
                name="BioPharma Global Clinical Research",
                slug="biopharma-global",
                description="International oncology and hepatology clinical development sponsor."
            )
            db.add(org)
            db.commit()
            db.refresh(org)

        # 2. Roles
        roles_data = [
            ("Study Administrator", "Full administrative control over study, sites, users, protocols, and data."),
            ("Medical Monitor", "Human Gate decision-maker, approval/rejection/clarification of escalations, evidence review."),
            ("Data Manager", "Data validation, discrepancy management, raising and resolving data queries."),
            ("Clinical Reviewer", "Medical review of adverse events, biomarker trajectories, and safety signals."),
            ("Compliance Reviewer", "Protocol deviation tracking, visit window compliance, regulatory adherence."),
            ("Site Coordinator", "Investigative site operations, subject visits, responding to site data queries.")
        ]
        role_map = {}
        for r_name, r_desc in roles_data:
            r = db.query(Role).filter(Role.name == r_name).first()
            if not r:
                r = Role(name=r_name, description=r_desc, permissions="[\"ALL\"]")
                db.add(r)
                db.commit()
                db.refresh(r)
            role_map[r_name] = r

        # 3. Seeded Demo Users (with password 'AdminPass123!', etc.)
        users_data = [
            ("admin@atlas.clinical", "Dr. Sarah Jenkins", "AdminPass123!", "Study Administrator"),
            ("medical.monitor@atlas.clinical", "Dr. Elena Rostova", "MedicalPass123!", "Medical Monitor"),
            ("data.manager@atlas.clinical", "Marcus Chen", "DataPass123!", "Data Manager"),
            ("clinical.reviewer@atlas.clinical", "Dr. Raj Patel", "ClinicalPass123!", "Clinical Reviewer"),
            ("compliance.reviewer@atlas.clinical", "Amina Al-Mansoor", "CompliancePass123!", "Compliance Reviewer"),
            ("site.coordinator@atlas.clinical", "David Miller", "SitePass123!", "Site Coordinator")
        ]
        for email, name, pwd, r_name in users_data:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    email=email,
                    full_name=name,
                    hashed_password=hash_password(pwd),
                    is_active=True
                )
                db.add(u)
                db.commit()
                db.refresh(u)
                ur = UserRole(user_id=u.id, role_id=role_map[r_name].id, organization_id=org.id)
                db.add(ur)
                db.commit()

        # 4. Study
        study = db.query(Study).filter(Study.study_id == "ATLAS-001").first()
        if not study:
            study = Study(
                org_id=org.id,
                study_id="ATLAS-001",
                name="Phase II Multi-Center Study of Novel Kinase Inhibitor in Advanced Solid Tumors",
                sponsor="BioPharma Global Clinical Research",
                therapeutic_area="Oncology / Hepatology",
                current_cut=1,
                current_protocol_version="v1.0",
                status="ACTIVE"
            )
            db.add(study)
            db.commit()
            db.refresh(study)

        # 5. Protocol & Versions
        prot = db.query(Protocol).filter(Protocol.study_id == study.id).first()
        if not prot:
            prot = Protocol(study_id=study.id, code="ATLAS-001-PROT", title="ATLAS-001 Investigational Protocol")
            db.add(prot)
            db.commit()
            db.refresh(prot)

            v1 = ProtocolVersion(
                protocol_id=prot.id,
                version_str="v1.0",
                effective_date="2025-11-01",
                is_active=True,
                amendment_summary="Initial approved protocol baseline with standard visit windows (+/- 2-5 days)."
            )
            v2 = ProtocolVersion(
                protocol_id=prot.id,
                version_str="v2.0",
                effective_date="2026-03-01",
                is_active=False,
                amendment_summary="Amended protocol: Tightened visit windows (+/- 1-3 days), mandatory site dosing consistency rules."
            )
            db.add_all([v1, v2])
            db.commit()

        # 6. Sites
        sites_seed = [
            ("S02", "Memorial Regional Medical Center", "Chicago, IL", "Dr. Walter White"),
            ("S07", "University Clinical Trials Institute", "Boston, MA", "Dr. Anthony Ross"),
            ("S11", "Bayview Research Hospital", "San Francisco, CA", "Dr. Lisa Cuddy"),
            ("102", "St. Jude European Investigation Center", "Geneva, CH", "Dr. Henri Dubois"),
            ("103", "Nordic Oncology Research Hub", "Stockholm, SE", "Dr. Astrid Lind")
        ]
        site_map = {}
        for s_id, s_name, loc, pi in sites_seed:
            site = db.query(Site).filter(Site.study_id == study.id, Site.site_id == s_id).first()
            if not site:
                site = Site(study_id=study.id, site_id=s_id, name=s_name, location=loc, pi_name=pi)
                db.add(site)
                db.commit()
                db.refresh(site)
            site_map[s_id] = site

        # 7. Data Cuts
        for cut_num, p_ver, desc in [(1, "v1.0", "Baseline Data Cut 1"), (2, "v2.0", "Interim Data Cut 2 - Protocol Amended"), (3, "v2.0", "Final Cycle Data Cut 3")]:
            dcut = db.query(DataCut).filter(DataCut.study_id == study.id, DataCut.cut_number == cut_num).first()
            if not dcut:
                dcut = DataCut(
                    study_id=study.id,
                    cut_number=cut_num,
                    protocol_version=p_ver,
                    snapshot_date=f"2026-0{cut_num}-15",
                    description=desc
                )
                db.add(dcut)
                db.commit()

        # 8. Load CDISC Data from data/hackathon-data/
        data_dir = settings.DATA_PATH / "hackathon-data"
        if data_dir.exists():
            DataService._load_cdisc_csvs(db, study, site_map, data_dir)

        # 9. Seed Worked Scenarios
        DataService._seed_worked_scenarios(db, study, site_map)

        # 10. Rebuild Knowledge Graph
        KnowledgeGraphService.rebuild_study_graph(db, study.id)

        return {"status": "SUCCESS", "study_id": study.id, "study_code": study.study_id}

    @staticmethod
    def _load_cdisc_csvs(db: Session, study: Study, site_map: Dict[str, Site], data_dir: Path):
        # Reference ranges
        ref_ranges = {}
        ref_file = data_dir / "reference_ranges.csv"
        if ref_file.exists():
            with open(ref_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    site = r.get("SITEID", "").strip()
                    test = r.get("LBTESTCD", "").strip().upper()
                    try:
                        uln = float(r.get("ANRHI", "0").replace(",", "."))
                        lln = float(r.get("ANRLO", "0").replace(",", "."))
                        ref_ranges[(site, test)] = (lln, uln)
                    except Exception:
                        pass

        # Load Demographics (dm.csv)
        dm_file = data_dir / "dm.csv"
        subj_map = {}
        if dm_file.exists():
            with open(dm_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    usubjid = r.get("USUBJID", "").strip()
                    site_code = r.get("SITEID", "S07").strip()
                    site_obj = site_map.get(site_code) or list(site_map.values())[0]

                    subj = db.query(Subject).filter(Subject.usubjid == usubjid).first()
                    if not subj:
                        subj = Subject(
                            study_id=study.id,
                            site_id=site_obj.id,
                            usubjid=usubjid,
                            subjid=r.get("SUBJID", usubjid.split("-")[-1] if "-" in usubjid else usubjid),
                            age=int(r.get("AGE", 0)) if r.get("AGE") and r.get("AGE").isdigit() else 55,
                            sex=r.get("SEX", "F"),
                            arm=r.get("ARM", "Active Drug A 50mg"),
                            rfstdtc=r.get("RFSTDTC", "2026-01-15"),
                            rfendtc=r.get("RFENDTC", ""),
                            screen_date="2026-01-05",
                            status="ONGOING"
                        )
                        db.add(subj)
                        db.commit()
                        db.refresh(subj)
                    subj_map[usubjid] = subj

        # Load Labs (lb.csv)
        lb_file = data_dir / "lb.csv"
        if lb_file.exists():
            with open(lb_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                idx = 1
                for r in reader:
                    usubjid = r.get("USUBJID", "").strip()
                    subj = subj_map.get(usubjid) or db.query(Subject).filter(Subject.usubjid == usubjid).first()
                    if not subj:
                        continue

                    test_code = r.get("LBTESTCD", "ALT").strip().upper()
                    raw_val = r.get("LBORRES", "").strip()
                    raw_unit = r.get("LBORRESU", "U/L").strip()
                    norm_info = normalize_lab_unit(test_code, raw_val, raw_unit)

                    site_code = subj.site.site_id if subj.site else "S07"
                    lln, uln = ref_ranges.get((site_code, test_code), (0.0, 56.0))

                    rec_id = f"LAB-SDTM-{idx:04d}"
                    existing_lb = db.query(LabResult).filter(LabResult.record_id == rec_id).first()
                    if not existing_lb:
                        is_abn = False
                        ratio = None
                        if norm_info["normalized_value"] is not None and uln > 0:
                            ratio = round(norm_info["normalized_value"] / uln, 2)
                            is_abn = ratio > 1.0

                        lb_rec = LabResult(
                            record_id=rec_id,
                            subject_id=subj.id,
                            study_id=study.id,
                            site_id=subj.site_id,
                            visit_name=r.get("VISIT", "Visit 1"),
                            test_code=test_code,
                            test_name=r.get("LBTEST", test_code),
                            raw_value=norm_info["raw_value"],
                            raw_unit=norm_info["raw_unit"],
                            normalized_value=norm_info["normalized_value"],
                            normalized_unit=norm_info["normalized_unit"],
                            operator=norm_info["operator"],
                            is_censored=norm_info["is_censored"],
                            uln=uln,
                            lln=lln,
                            is_abnormal=is_abn,
                            ratio_to_uln=ratio,
                            collection_date=r.get("LBDTC", "2026-01-15"),
                            conversion_method=norm_info["conversion_method"]
                        )
                        db.add(lb_rec)
                    idx += 1
                db.commit()

        # Load AEs (ae.csv)
        ae_file = data_dir / "ae.csv"
        if ae_file.exists():
            with open(ae_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                idx = 1
                for r in reader:
                    usubjid = r.get("USUBJID", "").strip()
                    subj = subj_map.get(usubjid) or db.query(Subject).filter(Subject.usubjid == usubjid).first()
                    if not subj:
                        continue

                    rec_id = f"AE-{idx:04d}"
                    existing_ae = db.query(AdverseEvent).filter(AdverseEvent.record_id == rec_id).first()
                    if not existing_ae:
                        ae_rec = AdverseEvent(
                            record_id=rec_id,
                            subject_id=subj.id,
                            study_id=study.id,
                            site_id=subj.site_id,
                            seq=int(r.get("AESEQ", 1)),
                            aeterm=r.get("AETERM", "Adverse Event"),
                            aedecod=r.get("AEDECOD", ""),
                            aebodsys=r.get("AEBODSYS", ""),
                            start_date=r.get("AESTDTC", "2026-02-01"),
                            end_date=r.get("AEENDTC", ""),
                            severity=r.get("AESEV", "MILD").upper(),
                            is_serious=r.get("AESER", "N").upper(),
                            is_hospitalized="Y" if "HOSP" in str(r.get("AESHOSP", "")).upper() or r.get("AESHOSP", "") == "Y" else "N",
                            causality=r.get("AEREL", "POSSIBLE"),
                            outcome=r.get("AEOUT", "RECOVERED"),
                            action_taken=r.get("AEACN", "DOSE NOT CHANGED")
                        )
                        db.add(ae_rec)
                    idx += 1
                db.commit()

        # Load Subject Visits (sv.csv)
        sv_file = data_dir / "sv.csv"
        if sv_file.exists():
            with open(sv_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    usubjid = r.get("USUBJID", "").strip()
                    subj = subj_map.get(usubjid) or db.query(Subject).filter(Subject.usubjid == usubjid).first()
                    if not subj:
                        continue
                    v_name = r.get("VISIT", "Visit 1")
                    act_date = r.get("SVSTDTC", "2026-01-15")
                    v_rec = db.query(Visit).filter(Visit.subject_id == subj.id, Visit.visit_name == v_name).first()
                    if not v_rec:
                        v_rec = Visit(
                            subject_id=subj.id,
                            study_id=study.id,
                            visit_name=v_name,
                            scheduled_day=int(r.get("VISITNUM", 1)) * 14,
                            actual_date=act_date
                        )
                        db.add(v_rec)
                db.commit()

    @staticmethod
    def _seed_worked_scenarios(db: Session, study: Study, site_map: Dict[str, Site]):
        # Scenario A: Subject 042-S02-004 Cellulitis AESHOSP=Y, AESER=N
        s02 = site_map.get("S02") or list(site_map.values())[0]
        subj_a = db.query(Subject).filter(Subject.usubjid == "042-S02-004").first()
        if not subj_a:
            subj_a = Subject(
                study_id=study.id,
                site_id=s02.id,
                usubjid="042-S02-004",
                subjid="004",
                age=58,
                sex="M",
                arm="Active Drug A 50mg",
                rfstdtc="2026-01-13",
                screen_date="2026-01-03",
                status="ONGOING"
            )
            db.add(subj_a)
            db.commit()
            db.refresh(subj_a)

        # Baseline & Screening Lab for 042-S02-004 (Screening ALT normal 31 U/L)
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
            db.add(cm_a1)

        # Cellulitis AE with hospitalization (Scenario A worked example)
        ae_a = db.query(AdverseEvent).filter(AdverseEvent.record_id == "AE-0001-S02").first()
        if not ae_a:
            ae_a = AdverseEvent(
                record_id="AE-0001-S02",
                subject_id=subj_a.id,
                study_id=study.id,
                site_id=s02.id,
                seq=1,
                aeterm="Cellulitis",
                aedecod="CELLULITIS",
                aebodsys="INFECTIONS AND INFESTATIONS",
                start_date="2026-01-28",
                end_date="2026-02-04",
                severity="SEVERE",
                is_serious="N",         # Miscoded! Hospitalized=Y but coded N
                is_hospitalized="Y",    # Confirmed hospitalized
                causality="POSSIBLE",
                outcome="RECOVERED",
                action_taken="DOSE NOT CHANGED",
                is_sae_miscoded=True
            )
            db.add(ae_a)

        # Scenario B: Subject 042-S11-005 Pre-dose AE (starts 2026-01-08, first dose 2026-01-13)
        s11 = site_map.get("S11") or list(site_map.values())[0]
        subj_b = db.query(Subject).filter(Subject.usubjid == "042-S11-005").first()
        if not subj_b:
            subj_b = Subject(
                study_id=study.id,
                site_id=s11.id,
                usubjid="042-S11-005",
                subjid="005",
                age=62,
                sex="F",
                arm="Active Drug A 50mg",
                rfstdtc="2026-01-13",
                screen_date="2026-01-02",
                status="ONGOING"
            )
            db.add(subj_b)
            db.commit()
            db.refresh(subj_b)

        ae_b = db.query(AdverseEvent).filter(AdverseEvent.record_id == "AE-PREDOSE-005").first()
        if not ae_b:
            ae_b = AdverseEvent(
                record_id="AE-PREDOSE-005",
                subject_id=subj_b.id,
                study_id=study.id,
                site_id=s11.id,
                seq=1,
                aeterm="Fatigue syndrome",
                aedecod="FATIGUE",
                aebodsys="GENERAL DISORDERS",
                start_date="2026-01-08",   # 5 days before first dose!
                end_date="2026-01-20",
                severity="MODERATE",
                is_serious="N",
                is_hospitalized="N",
                causality="NOT RELATED",
                action_taken="DOSE NOT CHANGED"
            )
            db.add(ae_b)

        # Scenario C: Liver candidate with already elevated screening ALT (Subject 042-S07-009)
        s07 = site_map.get("S07") or list(site_map.values())[0]
        subj_c = db.query(Subject).filter(Subject.usubjid == "042-S07-009").first()
        if not subj_c:
            subj_c = Subject(
                study_id=study.id,
                site_id=s07.id,
                usubjid="042-S07-009",
                subjid="009",
                age=51,
                sex="M",
                arm="Active Drug A 50mg",
                rfstdtc="2026-01-18",
                screen_date="2026-01-08",
                status="ONGOING"
            )
            db.add(subj_c)
            db.commit()
            db.refresh(subj_c)

        lb_c_scr = db.query(LabResult).filter(LabResult.record_id == "LAB-SCR-009").first()
        if not lb_c_scr:
            lb_c_scr = LabResult(
                record_id="LAB-SCR-009",
                subject_id=subj_c.id,
                study_id=study.id,
                site_id=s07.id,
                visit_name="Screening",
                test_code="ALT",
                test_name="Alanine Aminotransferase",
                raw_value="120",
                raw_unit="U/L",
                normalized_value=120.0,
                normalized_unit="U/L",
                uln=50.0,
                lln=10.0,
                is_abnormal=True,
                ratio_to_uln=2.4, # Elevated at screening baseline!
                collection_date="2026-01-08",
                conversion_method="DIRECT"
            )
            db.add(lb_c_scr)

        lb_c_w2 = db.query(LabResult).filter(LabResult.record_id == "LAB-W2-009").first()
        if not lb_c_w2:
            lb_c_w2 = LabResult(
                record_id="LAB-W2-009",
                subject_id=subj_c.id,
                study_id=study.id,
                site_id=s07.id,
                visit_name="Visit 2",
                test_code="ALT",
                test_name="Alanine Aminotransferase",
                raw_value="175",
                raw_unit="U/L",
                normalized_value=175.0,
                normalized_unit="U/L",
                uln=50.0,
                lln=10.0,
                is_abnormal=True,
                ratio_to_uln=3.5, # > 3x ULN
                collection_date="2026-02-01",
                conversion_method="DIRECT"
            )
            db.add(lb_c_w2)

        lb_c_bili = db.query(LabResult).filter(LabResult.record_id == "LAB-BILI-009").first()
        if not lb_c_bili:
            lb_c_bili = LabResult(
                record_id="LAB-BILI-009",
                subject_id=subj_c.id,
                study_id=study.id,
                site_id=s07.id,
                visit_name="Visit 2",
                test_code="BILI",
                test_name="Total Bilirubin",
                raw_value="2.3",
                raw_unit="mg/dL",
                normalized_value=2.3,
                normalized_unit="mg/dL",
                uln=1.0,
                lln=0.2,
                is_abnormal=True,
                ratio_to_uln=2.3, # > 2x ULN
                collection_date="2026-02-02",
                conversion_method="DIRECT"
            )
            db.add(lb_c_bili)

        # Scenario D: Multiple subjects at Site S02 with visit deviations
        # Add visits for 042-S02-004 and 042-S02-005 that violate window
        v_d1 = db.query(Visit).filter(Visit.subject_id == subj_a.id, Visit.visit_name == "Visit 2").first()
        if not v_d1:
            v_d1 = Visit(
                subject_id=subj_a.id,
                study_id=study.id,
                visit_name="Visit 2",
                scheduled_day=14,
                actual_date="2026-02-04" # Day 22 (+8 days out of window!)
            )
            db.add(v_d1)

        subj_d2 = db.query(Subject).filter(Subject.usubjid == "042-S02-005").first()
        if not subj_d2:
            subj_d2 = Subject(
                study_id=study.id,
                site_id=s02.id,
                usubjid="042-S02-005",
                subjid="005",
                age=66,
                sex="F",
                arm="Active Drug A 50mg",
                rfstdtc="2026-01-14",
                screen_date="2026-01-04",
                status="ONGOING"
            )
            db.add(subj_d2)
            db.commit()
            db.refresh(subj_d2)

        v_d2 = db.query(Visit).filter(Visit.subject_id == subj_d2.id, Visit.visit_name == "Visit 2").first()
        if not v_d2:
            v_d2 = Visit(
                subject_id=subj_d2.id,
                study_id=study.id,
                visit_name="Visit 2",
                scheduled_day=14,
                actual_date="2026-02-06" # Day 23 (+9 days out of window!)
            )
            db.add(v_d2)

        db.commit()

    @staticmethod
    def manual_create_subject(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Requirements 6, 7, 8, 9, 10:
        Manually adds a new subject, validates, normalizes, persists,
        updates Knowledge Graph, and returns Subject 360 payload.
        """
        # Validate
        val_res = ClinicalValidator.validate_subject_data(data)
        if not val_res["is_valid"]:
            return {"success": False, "errors": val_res["errors"], "warnings": val_res["warnings"]}

        study_id = data.get("study_id", 1)
        study = db.query(Study).filter(Study.id == study_id).first()
        if not study:
            return {"success": False, "errors": [f"Study {study_id} not found."]}

        site_code = data.get("site_id", "S02")
        site = db.query(Site).filter(Site.study_id == study_id, Site.site_id == site_code).first()
        if not site:
            site = db.query(Site).filter(Site.study_id == study_id).first()

        usubjid = data["usubjid"].strip()
        existing = db.query(Subject).filter(Subject.usubjid == usubjid).first()
        if existing:
            return {"success": False, "errors": [f"Subject {usubjid} already exists in study database."]}

        subj = Subject(
            study_id=study_id,
            site_id=site.id if site else 1,
            usubjid=usubjid,
            subjid=usubjid.split("-")[-1] if "-" in usubjid else usubjid,
            age=data.get("age"),
            sex=data.get("sex", "UNKNOWN"),
            arm=data.get("arm", "Active Arm"),
            rfstdtc=data.get("rfstdtc", ""),
            rfendtc=data.get("rfendtc", ""),
            screen_date=data.get("screen_date", ""),
            status="ONGOING"
        )
        db.add(subj)
        db.commit()
        db.refresh(subj)

        # Add Visits
        for v in data.get("visits", []):
            v_obj = Visit(
                subject_id=subj.id,
                study_id=study_id,
                visit_name=v.get("visit_name", "Visit 1"),
                scheduled_day=v.get("scheduled_day", 1),
                actual_date=v.get("actual_date", "")
            )
            db.add(v_obj)

        # Add Labs with normalization
        idx = db.query(LabResult).count() + 1
        for lb in data.get("labs", []):
            t_code = lb.get("test_code", "ALT").upper()
            raw_v = lb.get("raw_value", "")
            raw_u = lb.get("raw_unit", "U/L")
            norm = normalize_lab_unit(t_code, raw_v, raw_u)
            uln = 56.0 if t_code in {"ALT", "AST"} else 1.0
            ratio = round(norm["normalized_value"] / uln, 2) if norm["normalized_value"] is not None else None
            is_abn = ratio > 1.0 if ratio is not None else False

            lb_obj = LabResult(
                record_id=f"LAB-{idx:04d}",
                subject_id=subj.id,
                study_id=study_id,
                site_id=site.id if site else None,
                visit_name=lb.get("visit_name", "Baseline"),
                test_code=t_code,
                test_name=lb.get("test_name", t_code),
                raw_value=norm["raw_value"],
                raw_unit=norm["raw_unit"],
                normalized_value=norm["normalized_value"],
                normalized_unit=norm["normalized_unit"],
                operator=norm["operator"],
                is_censored=norm["is_censored"],
                uln=uln,
                lln=10.0,
                is_abnormal=is_abn,
                ratio_to_uln=ratio,
                collection_date=lb.get("collection_date", ""),
                conversion_method=norm["conversion_method"]
            )
            db.add(lb_obj)
            idx += 1

        # Add Adverse Events
        ae_idx = db.query(AdverseEvent).count() + 1
        for ae in data.get("adverse_events", []):
            hosp = ae.get("is_hospitalized", "N").upper()
            ser = ae.get("is_serious", "N").upper()
            ae_obj = AdverseEvent(
                record_id=f"AE-{ae_idx:04d}",
                subject_id=subj.id,
                study_id=study_id,
                site_id=site.id if site else None,
                seq=ae_idx,
                aeterm=ae.get("aeterm", "Adverse Event"),
                aedecod=ae.get("aedecod", ""),
                start_date=ae.get("start_date", ""),
                end_date=ae.get("end_date", ""),
                severity=ae.get("severity", "MILD").upper(),
                is_serious=ser,
                is_hospitalized=hosp,
                causality=ae.get("causality", "POSSIBLE"),
                action_taken=ae.get("action_taken", "DOSE NOT CHANGED"),
                is_sae_miscoded=(hosp == "Y" and ser == "N")
            )
            db.add(ae_obj)
            ae_idx += 1

        # Add Concomitant Medications
        cm_idx = db.query(ConcomitantMedication).count() + 1
        for cm in data.get("conmeds", []):
            med_name = cm.get("cmtrt", "")
            is_hep = any(h in med_name.lower() for h in ["acetaminophen", "paracetamol", "amoxicillin", "clavulanate", "isoniazid"])
            cm_obj = ConcomitantMedication(
                record_id=f"CM-{cm_idx:04d}",
                subject_id=subj.id,
                study_id=study_id,
                site_id=site.id if site else None,
                seq=cm_idx,
                cmtrt=med_name,
                indication=cm.get("indication", ""),
                start_date=cm.get("start_date", ""),
                end_date=cm.get("end_date", ""),
                is_hepatotoxic=is_hep
            )
            db.add(cm_obj)
            cm_idx += 1

        db.commit()

        # Update Knowledge Graph
        KnowledgeGraphService.rebuild_study_graph(db, study_id)

        # Return full Subject 360 view
        return {
            "success": True,
            "usubjid": subj.usubjid,
            "subject_id": subj.id,
            "message": f"Subject {subj.usubjid} created, normalized, and mapped into Knowledge Graph."
        }
