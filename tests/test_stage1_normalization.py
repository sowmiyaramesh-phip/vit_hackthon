"""
Tests for Stage 1: Clinical Normalization Engine
"""

import pytest
from backend.stage1.normalization import (
    normalize_lab_result, parse_date, parse_numeric
)


def test_unit_conversion_alt_ukat_to_ul():
    # Site S07: ALT in ukat/L with factor 60.0
    # 3.995 ukat/L -> 239.7 U/L
    res = normalize_lab_result("ALT", "3.995", "ukat/L")
    assert res.standard_unit == "U/L"
    assert res.conversion_factor == 60.0
    assert abs(res.converted_value - 239.7) < 0.1
    assert "Explicitly converted" in res.notes[0]


def test_censored_viral_load_value():
    # '<5' copies/mL means below detection limit, NOT zero
    res = normalize_lab_result("VL", "<5", "copies/mL")
    assert res.is_censored is True
    assert res.operator == "<"
    assert res.numeric_value == 5.0
    assert res.numeric_value != 0.0


def test_comma_decimal_normalization():
    # Localized European numbers e.g. "12,4" or "0,9"
    num, is_censored, op, is_missing = parse_numeric("12,4")
    assert num == 12.4
    assert is_censored is False
    assert is_missing is False


def test_missing_and_not_done_values():
    # "ND" or "NA" must be marked missing, not crash
    num, is_censored, op, is_missing = parse_numeric("ND")
    assert num is None
    assert is_missing is True


def test_multi_format_dates():
    d1 = parse_date("2026-01-10")
    d2 = parse_date("10/01/2026")
    d3 = parse_date("10-01-2026")
    assert d1 is not None and d1.year == 2026
    assert d2 is not None and d2.year == 2026
    assert d3 is not None and d3.year == 2026
