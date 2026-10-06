import re
from typing import Tuple, Optional

KNOWN_BRANDS = [
    ("microsoft", ["microsoft.com", "office.com", "live.com", "outlook.com"]),
    ("google", ["google.com", "gmail.com"]),
    ("apple", ["apple.com", "icloud.com"]),
    ("amazon", ["amazon.com", "aws.amazon.com"]),
    ("paypal", ["paypal.com"]),
    ("github", ["github.com"]),
    ("quickbooks", ["intuit.com", "quickbooks.com"]),
    ("bank of america", ["bankofamerica.com"]),
    ("wells fargo", ["wellsfargo.com"]),
    ("chase", ["chase.com"]),
]

def extract_domain_from_email(email_str: str) -> str:
    """Extracts domain from email address (e.g. user@example.com -> example.com)."""
    if not email_str:
        return ""
    if "@" in email_str:
        return email_str.split("@")[-1].strip().lower()
    return ""

def check_sender_mismatch(sender_name: Optional[str], sender_email: str) -> Tuple[bool, Optional[str]]:
    """
    Detects brand or executive display-name spoofing where display name claims
    a known authority / brand, but sender domain does not match official domains.
    """
    if not sender_name or not sender_email:
        return False, None

    sender_domain = extract_domain_from_email(sender_email)
    name_lower = sender_name.lower()

    # Check known brands
    for brand, valid_domains in KNOWN_BRANDS:
        if brand in name_lower:
            if not any(sender_domain == d or sender_domain.endswith(f".{d}") for d in valid_domains):
                return True, f"Display name claims '{sender_name}' ({brand}) but sending address originates from unverified domain '{sender_domain}'"

    # Check Executive pretexts (CEO, CFO, President, Managing Director)
    exec_cues = ["ceo", "cfo", "chief executive", "president", "treasurer", "human resources", "it support", "it desk", "security team"]
    for cue in exec_cues:
        if cue in name_lower:
            # If using public freemail / lookalike
            if any(freemail in sender_domain for freemail in ["gmail.com", "yahoo.com", "fastmail", "mail.com", "hotmail.com", "outlook.com"]):
                return True, f"High-privilege role '{sender_name}' sent from external freemail address: {sender_email}"

    return False, None
