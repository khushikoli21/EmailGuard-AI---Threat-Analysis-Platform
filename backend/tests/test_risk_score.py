from app.services.risk_service import risk_engine
from app.schemas.analysis import IndicatorItem, ThreatIntelItem

def test_deterministic_zero_risk_clean():
    res = risk_engine.calculate_risk(
        indicators=[],
        threat_intel=[],
        prompt_injection=False
    )
    assert res["risk_score"] == 0.0
    assert res["risk_level"] == "Low"

def test_deterministic_high_risk_phishing():
    indicators = [
        IndicatorItem(
            indicator_type="credential_request",
            title="Credential Solicitation",
            description="Requests password",
            severity="High"
        ),
        IndicatorItem(
            indicator_type="urgency_language",
            title="Urgency Phrasing",
            description="Threatens loss in 24h",
            severity="High"
        ),
        IndicatorItem(
            indicator_type="malicious_url",
            title="Malicious URL",
            description="Mimics login",
            severity="Critical"
        )
    ]
    res = risk_engine.calculate_risk(
        indicators=indicators,
        threat_intel=[],
        prompt_injection=False
    )
    # Expected: 30 + 20 + 45 = 95
    assert res["risk_score"] >= 80.0
    assert res["risk_level"] == "Critical"

def test_prompt_injection_floor():
    res = risk_engine.calculate_risk(
        indicators=[],
        threat_intel=[],
        prompt_injection=True
    )
    assert res["risk_score"] >= 85.0
    assert res["risk_level"] == "Critical"
