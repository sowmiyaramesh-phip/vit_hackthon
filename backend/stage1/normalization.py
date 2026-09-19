"""
ATLAS Clinical Data Normalization Engine
Handles unit harmonization, reference ranges, censored values, localized numbers, and dates.
Strictly follows the principle: Never convert a value silently.
"""

from dataclasses import dataclass, field
from datetime import date, datetime
import re
from typing import Any, Dict, List, Optional, Tuple, Union


@dataclass
class NormalizedValue:
    raw_value: Any
    numeric_value: Optional[float]
    unit: str
    standard_unit: str
    converted_value: Optional[float]
    conversion_factor: float
    conversion_formula: str
    is_censored: bool = False
    operator: str = "="  # '=', '<', '>', '<=', '>='
    is_missing: bool = False
    is_valid: bool = True
    notes: List[str] = field(default_factory=list)

    def display_str(self) -> str:
        if self.is_missing:
            return "ND"
        if self.is_censored:
            return f"{self.operator}{self.numeric_value} {self.unit}"
        if self.converted_value is not None and self.unit != self.standard_unit:
            return f"{self.converted_value:.2f} {self.standard_unit} (orig: {self.raw_value} {self.unit})"
        return f"{self.numeric_value} {self.unit}"


# Unit Conversion Factors and Canonical Standard Units
# E.g., ALT / AST standard unit is 'U/L'
# Bilirubin standard unit is 'mg/dL'
# Glucose standard unit is 'mg/dL'
# Creatinine standard unit is 'mg/dL'
UNIT_RULES: Dict[str, Dict[str, Any]] = {
    "ALT": {
        "standard_unit": "U/L",
        "conversions": {
            "u/l": (1.0, "1 * val"),
            "ukat/l": (60.0, "val * 60.0"),
            "µkat/l": (60.0, "val * 60.0"),
            "umol/l": (1.0, "1 * val"),
        },
        "default_uln": 56.0,
        "default_range": (7.0, 56.0),
    },
    "AST": {
        "standard_unit": "U/L",
        "conversions": {
            "u/l": (1.0, "1 * val"),
            "ukat/l": (60.0, "val * 60.0"),
            "µkat/l": (60.0, "val * 60.0"),
        },
        "default_uln": 40.0,
        "default_range": (10.0, 40.0),
    },
    "BILI": {
        "standard_unit": "mg/dL",
        "conversions": {
            "mg/dl": (1.0, "1 * val"),
            "umol/l": (1.0 / 17.104, "val / 17.104"),
            "µmol/l": (1.0 / 17.104, "val / 17.104"),
        },
        "default_uln": 1.2,
        "default_range": (0.2, 1.2),
    },
    "GLUC": {
        "standard_unit": "mg/dL",
        "conversions": {
            "mg/dl": (1.0, "1 * val"),
            "mmol/l": (18.0182, "val * 18.0182"),
        },
        "default_uln": 99.0,
        "default_range": (70.0, 99.0),
    },
    "CREAT": {
        "standard_unit": "mg/dL",
        "conversions": {
            "mg/dl": (1.0, "1 * val"),
            "umol/l": (1.0 / 88.4, "val / 88.4"),
            "µmol/l": (1.0 / 88.4, "val / 88.4"),
        },
        "default_uln": 1.2,
        "default_range": (0.6, 1.2),
    },
    "NEUT": {
        "standard_unit": "10^9/L",
        "conversions": {
            "10^9/l": (1.0, "1 * val"),
            "/ul": (0.001, "val / 1000"),
            "cells/ul": (0.001, "val / 1000"),
        },
        "default_uln": 7.5,
        "default_range": (1.8, 7.5),
    },
}


def norm_str(s: Any) -> str:
    """Normalize string for safe, case/punctuation-insensitive lookup."""
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def parse_date(value: Any) -> Optional[date]:
    """
    Robust multi-format date parser.
    Supports ISO (2026-01-10), European (15/01/2026, 15-01-2026, 15.01.2026),
    US (01/15/2026), timestamps, and year-month.
    """
    if value is None:
        return None
    val_str = str(value).strip()
    if not val_str or val_str.upper() in {"ND", "NA", "NONE", "UNKNOWN", ".", "-", "N/A"}:
        return None

    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%m/%d/%Y",
        "%Y/%m/%d",
        "%d.%m.%Y",
        "%Y.%m.%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%Y-%m",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            pass
    return None


def format_date_iso(d: Optional[date]) -> str:
    """Standardize output to ISO format YYYY-MM-DD."""
    return d.strftime("%Y-%m-%d") if d else ""


def parse_numeric(val: Any) -> Tuple[Optional[float], bool, str, bool]:
    """
    Parses a string/numeric lab or dose value.
    Returns: (numeric_value, is_censored, operator, is_missing)

    Handles:
    - '<5' -> (5.0, True, '<', False) (below detection limit, NOT zero)
    - '>100' -> (100.0, True, '>', False)
    - '<=10' -> (10.0, True, '<=', False)
    - 'ND', 'NA', None -> (None, False, '=', True)
    - '12,4' -> (12.4, False, '=', False)
    """
    if val is None:
        return None, False, "=", True

    s = str(val).strip()
    if not s or s.upper() in {"ND", "NA", "NONE", "UNKNOWN", ".", "-", "NOT DONE"}:
        return None, False, "=", True

    # Handle comma decimals e.g. "12,4" -> "12.4"
    s = s.replace(",", ".")

    # Check for inequalities e.g. "<5", ">100"
    match = re.match(r"^([<>]=?)\s*([0-9]+(?:\.[0-9]+)?)$", s)
    if match:
        op = match.group(1)
        num = float(match.group(2))
        return num, True, op, False

    try:
        num = float(s)
        return num, False, "=", False
    except ValueError:
        return None, False, "=", False


def normalize_lab_result(test_cd: str, raw_value: Any, unit: str) -> NormalizedValue:
    """
    Harmonizes a laboratory result with standard units and explicit conversion tracking.
    Never silently converts values; keeps track of formula, factor, and raw input.
    """
    clean_test = test_cd.upper().strip()
    unit_clean = str(unit).strip().lower() if unit else ""
    num, is_censored, op, is_missing = parse_numeric(raw_value)

    rule = UNIT_RULES.get(clean_test)
    if not rule:
        return NormalizedValue(
            raw_value=raw_value,
            numeric_value=num,
            unit=unit or "U/L",
            standard_unit=unit or "U/L",
            converted_value=num,
            conversion_factor=1.0,
            conversion_formula="1.0 * val (unregistered test)",
            is_censored=is_censored,
            operator=op,
            is_missing=is_missing,
            notes=["No specific unit conversion rule found; maintained as reported."],
        )

    std_unit = rule["standard_unit"]
    conversions = rule.get("conversions", {})
    conv_info = conversions.get(unit_clean)

    if conv_info:
        factor, formula = conv_info
        conv_val = round(num * factor, 4) if num is not None else None
        notes = []
        if factor != 1.0:
            notes.append(f"Explicitly converted from {unit} to {std_unit} via {formula}")
        return NormalizedValue(
            raw_value=raw_value,
            numeric_value=num,
            unit=unit or std_unit,
            standard_unit=std_unit,
            converted_value=conv_val,
            conversion_factor=factor,
            conversion_formula=formula,
            is_censored=is_censored,
            operator=op,
            is_missing=is_missing,
            notes=notes,
        )
    else:
        return NormalizedValue(
            raw_value=raw_value,
            numeric_value=num,
            unit=unit or "UNKNOWN",
            standard_unit=std_unit,
            converted_value=num,
            conversion_factor=1.0,
            conversion_formula="Unrecognized unit; unconverted",
            is_censored=is_censored,
            operator=op,
            is_missing=is_missing,
            is_valid=False,
            notes=[f"Unrecognized unit '{unit}' for test {clean_test}; value not converted."],
        )
