import re
from typing import Tuple

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

def validate_email_address(email_str: str) -> bool:
    if not email_str:
        return False
    return bool(EMAIL_REGEX.match(email_str.strip()))

def sanitize_text(text: str, max_chars: int = 50000) -> str:
    if not text:
        return ""
    # Truncate overly large payload attacks
    return text[:max_chars].strip()
