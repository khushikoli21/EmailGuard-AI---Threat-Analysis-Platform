import urllib.parse
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.config import settings
from app.core.security import encrypt_token, decrypt_token
from app.core.logging_config import logger

class GmailOAuthClient:
    """
    Handles Google Workspace OAuth 2.0 flow for Gmail API.
    Zero-password architecture: authenticates solely via OAuth authorization tokens.
    """

    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
        self.scopes = [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/userinfo.email"
        ]

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def get_authorization_url(self, state: str = "security_state_token") -> Dict[str, Any]:
        """Generates Google OAuth consent screen authorization URL."""
        if not self.is_configured():
            return {
                "auth_url": None,
                "status": "not_configured",
                "message": "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not configured in .env"
            }

        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "access_type": "offline",
            "prompt": "consent",
            "state": state
        }
        encoded_query = urllib.parse.urlencode(params)
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{encoded_query}"

        return {
            "auth_url": auth_url,
            "status": "configured",
            "message": "OAuth 2.0 consent URL generated successfully."
        }

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchanges authorization code for access and refresh tokens."""
        if not self.is_configured():
            return {"status": "not_configured", "error": "OAuth credentials missing"}

        import httpx
        token_endpoint = "https://oauth2.googleapis.com/token"
        payload = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(token_endpoint, data=payload)
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "status": "success",
                        "access_token": data.get("access_token"),
                        "refresh_token": data.get("refresh_token"),
                        "expires_in": data.get("expires_in")
                    }
                else:
                    logger.warning(f"Google token exchange failed: {res.text}")
                    return {"status": "failed", "error": f"HTTP {res.status_code}"}
        except Exception as e:
            logger.error(f"Token exchange exception: {e}")
            return {"status": "failed", "error": str(e)}

    async def fetch_messages(self, access_token: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """Fetches list of inbox messages using Gmail REST API."""
        import httpx
        url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={max_results}"
        headers = {"Authorization": f"Bearer {access_token}"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    return res.json().get("messages", [])
                return []
        except Exception as e:
            logger.warning(f"Gmail message retrieval error: {e}")
            return []

gmail_client = GmailOAuthClient()
