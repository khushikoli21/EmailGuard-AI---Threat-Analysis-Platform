from typing import List, Dict, Any, Tuple
from app.core.config import settings
from app.schemas.analysis import IndicatorItem, ThreatIntelItem

class DeterministicRiskEngine:
    """
    Calculates deterministic risk scores based on verifiable findings and weighted rules.
    Prevents LLM hallucination from assigning arbitrary security scores.
    """

    def calculate_risk(
        self,
        indicators: List[IndicatorItem],
        threat_intel: List[ThreatIntelItem],
        prompt_injection: bool = False
    ) -> Dict[str, Any]:
        raw_score = 0.0
        reasons: List[str] = []

        # Weight definitions from centralized settings
        weights = {
            "malicious_url": settings.WEIGHT_MALICIOUS_URL,
            "suspicious_url": settings.WEIGHT_SUSPICIOUS_URL,
            "credential_request": settings.WEIGHT_CREDENTIAL_REQUEST,
            "urgency_language": settings.WEIGHT_URGENCY_LANGUAGE,
            "sender_domain_mismatch": settings.WEIGHT_SENDER_MISMATCH,
            "impersonation": settings.WEIGHT_IMPERSONATION,
            "payment_request": settings.WEIGHT_PAYMENT_REQUEST,
            "malicious_attachment": settings.WEIGHT_MALICIOUS_ATTACHMENT,
            "prompt_injection": settings.WEIGHT_PROMPT_INJECTION,
        }

        # Track seen categories to prevent runaway compounding of the exact same signal
        seen_types = set()

        for ind in indicators:
            itype = ind.indicator_type
            if itype in weights:
                if itype not in seen_types:
                    weight_val = weights[itype]
                    raw_score += weight_val
                    reasons.append(f"{ind.title} (+{weight_val:.0f} pts)")
                    seen_types.add(itype)
                else:
                    # Secondary occurrence adds half weight
                    raw_score += weights[itype] * 0.3
            else:
                # Default indicator contribution
                raw_score += 15.0
                reasons.append(f"{ind.title} (+15 pts)")

        # External Threat Intelligence findings
        for ti in threat_intel:
            if ti.malicious:
                raw_score += 45.0
                reasons.append(f"Confirmed Malicious Verdict by {ti.provider} (+45 pts)")
            elif ti.suspicious:
                raw_score += 20.0
                reasons.append(f"Suspicious Telemetry Hit by {ti.provider} (+20 pts)")

        # Prompt injection flag adds immediate critical severity floor
        if prompt_injection:
            if raw_score < 85.0:
                raw_score = max(raw_score + settings.WEIGHT_PROMPT_INJECTION, 85.0)
            reasons.append(f"Adversarial Prompt Injection Floor Enforced (+{settings.WEIGHT_PROMPT_INJECTION:.0f} pts)")

        # Clamp between 0 and 100
        final_score = min(100.0, max(0.0, raw_score))
        final_score_rounded = round(final_score, 1)

        # Thresholds: 0-29 Low, 30-59 Medium, 60-79 High, 80-100 Critical
        if final_score_rounded >= 80.0:
            risk_level = "Critical"
        elif final_score_rounded >= 60.0:
            risk_level = "High"
        elif final_score_rounded >= 30.0:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        return {
            "risk_score": final_score_rounded,
            "risk_level": risk_level,
            "reasons": reasons
        }

risk_engine = DeterministicRiskEngine()
