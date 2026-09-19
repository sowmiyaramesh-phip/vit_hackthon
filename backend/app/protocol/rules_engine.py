from datetime import datetime, date
from typing import Dict, List, Any, Optional, Tuple
from app.normalization.normalizer import parse_date

class ProtocolRulesEngine:
    VISIT_WINDOWS_V1 = {
        "VISIT 1": (-14, 1),
        "SCREENING": (-14, 1),
        "VISIT 2": (12, 16),      # Day 14 +/- 2
        "WEEK 2": (12, 16),
        "VISIT 3": (25, 31),      # Day 28 +/- 3
        "WEEK 4": (25, 31),
        "VISIT 4": (79, 89),      # Day 84 +/- 5
        "WEEK 12": (79, 89),
        "END OF STUDY": (79, 89)
    }

    # Protocol v2.0 Amendment (Tighter windows)
    VISIT_WINDOWS_V2 = {
        "VISIT 1": (-14, 1),
        "SCREENING": (-14, 1),
        "VISIT 2": (13, 15),      # Day 14 +/- 1 (Tightened!)
        "WEEK 2": (13, 15),
        "VISIT 3": (26, 30),      # Day 28 +/- 2 (Tightened!)
        "WEEK 4": (26, 30),
        "VISIT 4": (81, 87),      # Day 84 +/- 3 (Tightened!)
        "WEEK 12": (81, 87),
        "END OF STUDY": (81, 87)
    }

    @classmethod
    def get_visit_window(cls, visit_name: str, protocol_version: str = "v1.0") -> Tuple[int, int]:
        name_clean = str(visit_name).upper().strip()
        table = cls.VISIT_WINDOWS_V2 if "2" in str(protocol_version) else cls.VISIT_WINDOWS_V1
        for k, v in table.items():
            if k in name_clean:
                return v
        return (0, 0)

    @classmethod
    def check_visit_window_compliance(
        cls,
        visit_name: str,
        actual_date_str: str,
        first_dose_date_str: str,
        protocol_version: str = "v1.0"
    ) -> Dict[str, Any]:
        act_date = parse_date(actual_date_str)
        dose_date = parse_date(first_dose_date_str)
        if not act_date or not dose_date:
            return {"is_out_of_window": False, "deviation_days": 0, "window": (0, 0)}

        day_diff = (act_date - dose_date).days
        w_low, w_high = cls.get_visit_window(visit_name, protocol_version)
        if w_low == 0 and w_high == 0:
            return {"is_out_of_window": False, "deviation_days": 0, "window": (0, 0)}

        if day_diff < w_low:
            dev = w_low - day_diff
            return {"is_out_of_window": True, "deviation_days": -dev, "study_day": day_diff, "window": (w_low, w_high)}
        elif day_diff > w_high:
            dev = day_diff - w_high
            return {"is_out_of_window": True, "deviation_days": dev, "study_day": day_diff, "window": (w_low, w_high)}
        else:
            return {"is_out_of_window": False, "deviation_days": 0, "study_day": day_diff, "window": (w_low, w_high)}

    @staticmethod
    def evaluate_hys_law(
        labs: List[Dict[str, Any]],
        screening_alt_elevated: bool = False
    ) -> Dict[str, Any]:
        """
        Hy's Law:
        ALT or AST > 3x ULN
        AND Total Bilirubin > 2x ULN
        AND within 14 days
        If screening ALT was already elevated (baseline elevation), should be classified as MONITOR_ONLY with rationale.
        """
        alt_ast_events = []
        bili_events = []

        for lb in labs:
            code = lb.get("test_code", "").upper()
            val = lb.get("normalized_value")
            uln = lb.get("uln")
            c_date = parse_date(lb.get("collection_date"))
            if val is None or not uln or not c_date:
                continue

            ratio = val / uln
            if code in {"ALT", "AST"} and ratio > 3.0:
                alt_ast_events.append({"record": lb, "date": c_date, "ratio": round(ratio, 2), "val": val, "uln": uln})
            elif "BILI" in code and ratio > 2.0:
                bili_events.append({"record": lb, "date": c_date, "ratio": round(ratio, 2), "val": val, "uln": uln})

        for liver in alt_ast_events:
            for bili in bili_events:
                diff_days = abs((liver["date"] - bili["date"]).days)
                if diff_days <= 14:
                    if screening_alt_elevated:
                        return {
                            "candidate": True,
                            "decision": "MONITOR_ONLY",
                            "severity": "MEDIUM",
                            "rationale": "Liver-signal candidate kept monitor-only because screening ALT was already elevated at baseline (pre-existing condition, non-drug induced).",
                            "evidence": [liver["record"], bili["record"]],
                            "delta_days": diff_days
                        }
                    else:
                        return {
                            "candidate": True,
                            "decision": "ESCALATE",
                            "severity": "CRITICAL",
                            "rationale": f"Hy's Law signal detected: {liver['record']['test_code']} {liver['ratio']}x ULN and Total Bilirubin {bili['ratio']}x ULN within {diff_days} days.",
                            "evidence": [liver["record"], bili["record"]],
                            "delta_days": diff_days
                        }

        return {"candidate": False, "decision": "NONE", "severity": "LOW", "rationale": "No Hy's Law signal.", "evidence": []}

    @staticmethod
    def evaluate_sae_miscoding(ae: Dict[str, Any]) -> Dict[str, Any]:
        """
        Scenario A:
        AESHOSP == 'Y' but AESER == 'N'
        Under ICH-GCP / Protocol, hospitalization qualifies event as serious.
        Identified as SAE_MISCODED, CRITICAL severity.
        """
        hosp = str(ae.get("is_hospitalized", "")).upper()
        ser = str(ae.get("is_serious", "")).upper()
        term = ae.get("aeterm", "Adverse Event")
        rec_id = ae.get("record_id", "AE-XXXX")

        if (hosp == "Y" or hosp == "YES") and (ser == "N" or ser == "NO"):
            return {
                "miscoded": True,
                "finding_code": f"SAE_MISCODED_{rec_id}",
                "severity": "CRITICAL",
                "title": f"Miscoded Serious Adverse Event: '{term}'",
                "rationale": f"AE '{term}' required hospitalization (AESHOSP=Y) but was coded as non-serious (AESER=N). Per protocol and ICH-GCP E2A, any adverse event resulting in hospitalization is serious and requires expedited review.",
                "proposed_action": "Update AESER to 'Y', initiate expedited safety reporting workflow within 24 hours.",
                "evidence": [ae]
            }
        return {"miscoded": False}
