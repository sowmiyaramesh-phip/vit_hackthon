"""
Tests for Adversarial Detection and Decision Explanations
"""

import pytest
from backend.stage3.adversarial import AdversarialDetector
from backend.stage3.explanation import ExplanationEngine
from backend.stage2.trace import TraceLedger


def test_site_glucose_shift_anomaly():
    detector = AdversarialDetector()
    # S04 glucose values dropping from 118 to ~6.4 mmol/L
    current_values = [6.4, 6.2, 6.5, 6.3, 6.6]
    event = detector.check_site_glucose_shift("SITE-104", current_values, baseline_median=118.0)

    assert event is not None
    assert event.classification == "DATA_INTEGRITY_ISSUE"
    assert event.is_untrusted is True
    assert abs(event.evidence_metrics["ratio"] - 18.43) < 0.5


def test_explain_decision_d012():
    trace = TraceLedger()
    explainer = ExplanationEngine(trace)

    d12 = explainer.get_explanation("D-012")
    assert d12 is not None
    assert "Marked Site S04 glucose values as untrusted" in d12.what
    assert len(d12.evidence) >= 2
    assert len(d12.alternatives) >= 2
    assert "data-integrity problem" in d12.why
    assert d12.trace_consistency["verified"] is True
