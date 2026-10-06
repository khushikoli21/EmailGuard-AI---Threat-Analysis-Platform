import base64
import hashlib
from cryptography.fernet import Fernet
from app.core.config import settings

def _get_fernet_instance() -> Fernet:
    """Derives a deterministic 32-byte urlsafe base64 key from settings.SECRET_KEY."""
    raw_bytes = settings.SECRET_KEY.encode("utf-8")
    derived_32 = hashlib.sha256(raw_bytes).digest()
    key_b64 = base64.urlsafe_b64encode(derived_32)
    return Fernet(key_b64)

def encrypt_token(plain_token: str) -> str:
    """Encrypts sensitive OAuth tokens before database storage."""
    if not plain_token:
        return ""
    f = _get_fernet_instance()
    encrypted = f.encrypt(plain_token.encode("utf-8"))
    return encrypted.decode("utf-8")

def decrypt_token(encrypted_token: str) -> str:
    """Decrypts stored OAuth tokens."""
    if not encrypted_token:
        return ""
    try:
        f = _get_fernet_instance()
        decrypted = f.decrypt(encrypted_token.encode("utf-8"))
        return decrypted.decode("utf-8")
    except Exception:
        return ""
