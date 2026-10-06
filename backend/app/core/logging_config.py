import logging
import sys
import re

SENSITIVE_PATTERNS = [
    re.compile(r'(api[-_]?key[\s:=]+)[^\s,]+', re.IGNORECASE),
    re.compile(r'(secret[-_]?key[\s:=]+)[^\s,]+', re.IGNORECASE),
    re.compile(r'(access[-_]?token[\s:=]+)[^\s,]+', re.IGNORECASE),
    re.compile(r'(refresh[-_]?token[\s:=]+)[^\s,]+', re.IGNORECASE),
    re.compile(r'(password[\s:=]+)[^\s,]+', re.IGNORECASE),
    re.compile(r'(bearer\s+)[a-zA-Z0-9_\-\.]+', re.IGNORECASE),
]

class RedactingFormatter(logging.Formatter):
    """Sanitizes log messages by masking API keys, credentials, and tokens."""
    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        sanitized = original
        for pattern in SENSITIVE_PATTERNS:
            sanitized = pattern.sub(r'\1[REDACTED]', sanitized)
        return sanitized

def setup_logging(log_level: str = "INFO") -> logging.Logger:
    level = getattr(logging, log_level.upper(), logging.INFO)
    logger = logging.getLogger("emailguard")
    logger.setLevel(level)

    # Avoid duplicate handlers
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        formatter = RedactingFormatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger

logger = setup_logging()
