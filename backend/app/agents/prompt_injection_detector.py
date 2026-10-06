import re
from typing import Tuple, List
from app.schemas.analysis import IndicatorItem

INJECTION_PATTERNS = [
    (re.compile(r'ignore\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|directions|rules|prompts|protocols)', re.IGNORECASE), "Instruction Override Directive"),
    (re.compile(r'disregard\s+(?:all\s+)?(?:previous|prior|system|security)\s+(?:instructions|protocols|classifiers)', re.IGNORECASE), "Disregard Security Protocols"),
    (re.compile(r'you\s+are\s+now\s+(?:operating\s+in\s+)?(?:a\s+)?(?:bypass|unrestricted|god|dan|jailbroken|safe|override)\s+mode', re.IGNORECASE), "Persona / Mode Hijacking"),
    (re.compile(r'(?:output|classify|respond\s+with)\s+(?:only\s+)?(?:classification\s*=\s*["\']?Safe["\']?|risk_score\s*=\s*0)', re.IGNORECASE), "Forced Classifier Output Manipulation"),
    (re.compile(r'(?:===+\s*(?:system|override|admin|advisory|prompt)\s*===+|\[\s*(?:system|admin|override)\s*\])', re.IGNORECASE), "Adversarial Delimiter Simulation"),
    (re.compile(r'do\s+not\s+(?:analyze|scan|flag|inspect)\s+this\s+(?:email|message|attachment)', re.IGNORECASE), "Analysis Suppression Directive"),
    (re.compile(r'(?:reveal|print|leak)\s+(?:your\s+)?(?:system\s+prompt|developer\s+instructions)', re.IGNORECASE), "System Prompt Extraction Attempt"),
]

def detect_prompt_injection(body: str, subject: str = "") -> Tuple[bool, List[IndicatorItem], str]:
    """
    Evaluates untrusted email text for adversarial prompt injection patterns (OWASP LLM01).
    Returns (prompt_injection_suspected, indicators, details).
    """
    combined_text = f"{subject}\n{body}"
    indicators: List[IndicatorItem] = []
    matched_reasons = []

    for pattern, rule_name in INJECTION_PATTERNS:
        match = pattern.search(combined_text)
        if match:
            matched_snippet = match.group(0)
            matched_reasons.append(f"{rule_name} ('{matched_snippet}')")
            indicators.append(
                IndicatorItem(
                    indicator_type="prompt_injection",
                    title="Adversarial Prompt Injection Attempt",
                    description=f"Detected pattern attempting to override or hijack AI security analyzer directives: {rule_name}",
                    severity="Critical",
                    evidence=f"Matched text: \"{matched_snippet}\"",
                    source="Prompt Injection Detector (OWASP LLM01)"
                )
            )

    if matched_reasons:
        details = f"Adversarial instruction markers detected: {'; '.join(matched_reasons)}"
        return True, indicators, details

    return False, [], ""
