import re
from urllib.parse import urlparse
from typing import List, Tuple, Set

URL_REGEX = re.compile(
    r'(?:https?://|www\.)[a-zA-Z0-9.\-_~:/?#\[\]@!$&\'()*+,;=%]+',
    re.IGNORECASE
)

SUSPICIOUS_EXTENSIONS = {
    '.exe', '.vbs', '.bat', '.cmd', '.scr', '.ps1', '.hta',
    '.jar', '.js', '.wsf', '.iso', '.img', '.dll', '.htm', '.html'
}

SUSPICIOUS_TLDS = {
    'top', 'xyz', 'biz', 'club', 'work', 'vip', 'men', 'loan', 'gq', 'cf', 'tk', 'ml', 'ga'
}

SUSPICIOUS_KEYWORD_PATTERNS = [
    re.compile(r'(?:microsoft365|office365|o365|login|signin|verify|update|account|portal|secure|banking|service|renew|escrow|auth)[\w-]*\.(?:net|org|biz|info|cloud|co|site|live|space)', re.IGNORECASE),
]

def extract_urls(text: str) -> List[str]:
    """Extracts unique HTTP/HTTPS/WWW URLs from body and text."""
    if not text:
        return []
    matches = URL_REGEX.findall(text)
    clean_urls = set()
    for u in matches:
        # Strip trailing punctuation often caught in sentences
        u_clean = u.rstrip('.,;!?)"\'>]')
        if u_clean.startswith('www.'):
            u_clean = 'http://' + u_clean
        if len(u_clean) > 8:
            clean_urls.add(u_clean)
    return list(clean_urls)

def extract_domain(url: str) -> str:
    """Extracts hostname / domain from URL."""
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc or parsed.path.split('/')[0]
        # Remove port if present
        domain = netloc.split(':')[0].lower()
        return domain
    except Exception:
        return ""

def is_ip_address_host(domain: str) -> bool:
    """Checks if the host domain is a raw IPv4 address."""
    parts = domain.split('.')
    if len(parts) == 4 and all(p.isdigit() and 0 <= int(p) <= 255 for p in parts):
        return True
    return False

def analyze_url_heuristics(url: str) -> Tuple[bool, bool, List[str]]:
    """
    Returns (is_malicious, is_suspicious, reasons).
    """
    reasons = []
    is_malicious = False
    is_suspicious = False

    domain = extract_domain(url)
    if not domain:
        return False, False, []

    # Check for raw IP in URL
    if is_ip_address_host(domain):
        is_suspicious = True
        reasons.append(f"Host uses raw numeric IP address instead of domain name: {domain}")

    # Check for suspicious lookalike keywords
    for pattern in SUSPICIOUS_KEYWORD_PATTERNS:
        if pattern.search(domain):
            is_suspicious = True
            reasons.append(f"Domain '{domain}' matches brand typosquatting / credential-gateway pattern")

    # Check for executable script target
    path_lower = urlparse(url).path.lower()
    for ext in SUSPICIOUS_EXTENSIONS:
        if path_lower.endswith(ext):
            is_malicious = True
            is_suspicious = True
            reasons.append(f"Direct link to executable / script file extension ({ext})")
            break

    # Check TLD
    tld = domain.split('.')[-1].lower() if '.' in domain else ''
    if tld in SUSPICIOUS_TLDS:
        is_suspicious = True
        reasons.append(f"Domain uses high-abuse top-level domain: .{tld}")

    # Open redirect query parameters
    if 'url=' in url.lower() or 'redirect=' in url.lower() or 'dest=' in url.lower() or 'link=' in url.lower():
        is_suspicious = True
        reasons.append("URL contains open redirect forwarding parameters")

    return is_malicious, is_suspicious, reasons

def is_suspicious_attachment(filename: str) -> Tuple[bool, str]:
    """Checks if an attachment filename has dangerous extensions or double extensions."""
    if not filename:
        return False, ""
    name_lower = filename.lower()
    for ext in SUSPICIOUS_EXTENSIONS:
        if name_lower.endswith(ext):
            return True, f"Dangerous executable extension: {ext}"
    
    # Check double extension e.g. Invoice.pdf.exe
    parts = name_lower.split('.')
    if len(parts) > 2 and f".{parts[-1]}" in SUSPICIOUS_EXTENSIONS:
        return True, f"Double extension obfuscation: .{parts[-2]}.{parts[-1]}"

    return False, ""
