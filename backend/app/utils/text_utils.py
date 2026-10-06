import re
from typing import List, Dict

URGENCY_PATTERNS = [
    re.compile(r'\b(?:urgent|immediately|within 24 hours|within 48 hours|suspension|decommission|purge|scheduled for deletion|action required|expire immediately|final warning|penalty|account suspended)\b', re.IGNORECASE),
]

CREDENTIAL_PATTERNS = [
    re.compile(r'\b(?:password|credentials|login|sign[- ]in|verify your account|session expired|renew session|confirm identity|update credentials|mailbox quota|storage limit|mfa code|otp)\b', re.IGNORECASE),
]

PAYMENT_PATTERNS = [
    re.compile(r'\b(?:wire transfer|invoice|remittance|unpaid balance|past due|gift card|escrow|routing number|ach payment|swift code|settlement|late fee)\b', re.IGNORECASE),
]

SUPPRESSION_PATTERNS = [
    re.compile(r'\b(?:do not call|in a meeting|currently airborne|boarding a flight|limited connectivity|do not contact my cell|confidential transaction)\b', re.IGNORECASE),
]

def find_matched_terms(text: str, patterns: List[re.Pattern]) -> List[str]:
    matches = set()
    for p in patterns:
        for m in p.finditer(text):
            matches.add(m.group(0))
    return list(matches)

def analyze_linguistic_threat_indicators(subject: str, body: str) -> Dict[str, List[str]]:
    combined = f"{subject}\n{body}"
    return {
        "urgency": find_matched_terms(combined, URGENCY_PATTERNS),
        "credentials": find_matched_terms(combined, CREDENTIAL_PATTERNS),
        "payment": find_matched_terms(combined, PAYMENT_PATTERNS),
        "suppression": find_matched_terms(combined, SUPPRESSION_PATTERNS),
    }
