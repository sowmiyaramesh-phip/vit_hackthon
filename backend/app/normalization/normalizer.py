import re
from datetime import datetime, date
from typing import Tuple, Optional, Dict, Any

def parse_date(value: Any) -> Optional[date]:
    if not value:
        return None
    val_str = str(value).strip()
    if not val_str or val_str.upper() in {"ND", "NA", "NONE", "UNKNOWN", ".", "NOT DONE"}:
        return None
    formats = [
        "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d",
        "%d.%m.%Y", "%Y.%m.%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            pass
    return None

def format_canonical_date(value: Any) -> str:
    d = parse_date(value)
    return d.isoformat() if d else str(value).strip()

def parse_clinical_number(value: Any) -> Dict[str, Any]:
    if value is None:
        return {"value": None, "operator": "", "raw_value": "", "is_censored": False, "status": "EMPTY"}
    s = str(value).strip()
    if not s:
        return {"value": None, "operator": "", "raw_value": "", "is_censored": False, "status": "EMPTY"}
    if s.upper() in {"ND", "NOT DONE", "NOT DETECTED", "NA", "UNKNOWN", "."}:
        return {"value": None, "operator": "", "raw_value": s, "is_censored": False, "status": "NOT_DONE"}
    
    if s.startswith("<") or "<" in s:
        m = re.search(r"\d+(?:[.,]\d+)?", s)
        val = float(m.group().replace(",", ".")) if m else None
        return {"value": val, "operator": "<", "raw_value": s, "is_censored": True, "status": "BELOW_DETECTION_LIMIT"}
    
    if s.startswith(">") or ">" in s:
        m = re.search(r"\d+(?:[.,]\d+)?", s)
        val = float(m.group().replace(",", ".")) if m else None
        return {"value": val, "operator": ">", "raw_value": s, "is_censored": True, "status": "ABOVE_DETECTION_LIMIT"}
    
    s_clean = s.replace(",", ".")
    m = re.search(r"-?\d+(?:\.\d+)?", s_clean)
    if m:
        try:
            return {"value": float(m.group()), "operator": "", "raw_value": s, "is_censored": False, "status": "VALID"}
        except ValueError:
            pass
    return {"value": None, "operator": "", "raw_value": s, "is_censored": False, "status": "NON_NUMERIC"}

def normalize_lab_unit(test_code: str, raw_val: Any, raw_unit: str, site_id: str = "") -> Dict[str, Any]:
    parsed = parse_clinical_number(raw_val)
    test_upper = str(test_code).upper().strip()
    unit_str = str(raw_unit).strip()
    val = parsed["value"]
    norm_val = val
    norm_unit = unit_str
    conversion_method = "DIRECT"

    if val is not None and not parsed["is_censored"]:
        if "KAT" in unit_str.upper():
            norm_val = round(val * 60.0, 2)
            norm_unit = "U/L"
            conversion_method = f"{val} µkat/L × 60 = {norm_val} U/L"
        elif "BILI" in test_upper or test_upper == "TBIL":
            if "UMOL" in unit_str.upper():
                norm_val = round(val / 17.1, 2)
                norm_unit = "mg/dL"
                conversion_method = f"{val} µmol/L ÷ 17.1 = {norm_val} mg/dL"
            else:
                norm_unit = "mg/dL"
        elif "CREAT" in test_upper:
            if "UMOL" in unit_str.upper():
                norm_val = round(val / 88.4, 2)
                norm_unit = "mg/dL"
                conversion_method = f"{val} µmol/L ÷ 88.4 = {norm_val} mg/dL"
            else:
                norm_unit = "mg/dL"
        elif test_upper in {"ALT", "AST", "ALP"}:
            norm_unit = "U/L"

    return {
        "raw_value": parsed["raw_value"],
        "raw_unit": raw_unit,
        "parsed_value": val,
        "normalized_value": norm_val,
        "normalized_unit": norm_unit,
        "operator": parsed["operator"],
        "is_censored": parsed["is_censored"],
        "status": parsed["status"],
        "conversion_method": conversion_method
    }
