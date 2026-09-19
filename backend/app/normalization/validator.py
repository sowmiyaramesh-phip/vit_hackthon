from typing import Dict, List, Any
from app.normalization.normalizer import parse_date, parse_clinical_number

class ClinicalValidator:
    @staticmethod
    def validate_subject_data(subject_dict: Dict[str, Any]) -> Dict[str, Any]:
        issues = []
        warnings = []
        usubjid = subject_dict.get("usubjid")
        if not usubjid:
            issues.append("Missing mandatory Subject ID (USUBJID).")
        screen_date = parse_date(subject_dict.get("screen_date"))
        first_dose_date = parse_date(subject_dict.get("rfstdtc"))
        if screen_date and first_dose_date and screen_date > first_dose_date:
            issues.append(f"Screening date ({screen_date}) cannot be after first dose date ({first_dose_date}).")

        for i, ae in enumerate(subject_dict.get("adverse_events", [])):
            ae_term = ae.get("aeterm")
            if not ae_term:
                issues.append(f"AE row {i+1}: Missing adverse event term (AETERM).")
            ae_start = parse_date(ae.get("start_date"))
            if first_dose_date and ae_start and ae_start < first_dose_date:
                warnings.append({
                    "type": "PRE_DOSE_AE",
                    "message": f"AE '{ae_term}' starts on {ae_start}, which is before first dose {first_dose_date}."
                })

        for j, lb in enumerate(subject_dict.get("labs", [])):
            val_info = parse_clinical_number(lb.get("raw_value"))
            if val_info["status"] == "NON_NUMERIC":
                warnings.append({
                    "type": "NON_NUMERIC_LAB",
                    "message": f"Lab {lb.get('test_code')}: Non-standard raw value '{lb.get('raw_value')}'."
                })

        return {"is_valid": len(issues) == 0, "errors": issues, "warnings": warnings}
