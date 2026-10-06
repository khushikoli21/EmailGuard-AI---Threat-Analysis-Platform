import httpx
from typing import Dict, Any
from app.core.config import settings
from app.core.logging_config import logger

_URLSCAN_CACHE: Dict[str, Dict[str, Any]] = {}

class URLScanClient:
    """urlscan.io API client for threat intelligence search."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.URLSCAN_API_KEY
        self.base_url = "https://urlscan.io/api/v1"

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    async def search_url(self, url: str) -> Dict[str, Any]:
        """Searches urlscan.io for existing scan verdicts."""
        if not self.is_configured():
            return {
                "provider": "urlscan.io",
                "url": url,
                "status": "not_configured",
                "malicious": False,
                "suspicious": False,
                "reputation": "API Key Not Configured",
                "details": {"message": "URLSCAN_API_KEY not configured in environment"}
            }

        if url in _URLSCAN_CACHE:
            return _URLSCAN_CACHE[url]

        try:
            headers = {"API-Key": self.api_key}
            query = f'page.url:"{url}"'
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(f"{self.base_url}/search/?q={query}", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    results = data.get("results", [])
                    malicious = False
                    if results:
                        verdicts = results[0].get("verdicts", {})
                        malicious = verdicts.get("overall", {}).get("malicious", False)

                    res_obj = {
                        "provider": "urlscan.io",
                        "url": url,
                        "status": "completed",
                        "malicious": malicious,
                        "suspicious": False,
                        "reputation": "Malicious" if malicious else "No malicious verdict",
                        "details": {"match_count": len(results)}
                    }
                    _URLSCAN_CACHE[url] = res_obj
                    return res_obj
                else:
                    return {
                        "provider": "urlscan.io",
                        "url": url,
                        "status": "unavailable",
                        "malicious": False,
                        "suspicious": False,
                        "reputation": f"HTTP {res.status_code}",
                        "details": {"status_code": res.status_code}
                    }
        except Exception as e:
            logger.warning(f"urlscan.io query failed: {e}")
            return {
                "provider": "urlscan.io",
                "url": url,
                "status": "unavailable",
                "malicious": False,
                "suspicious": False,
                "reputation": "Query Error",
                "details": {"error": str(e)}
            }
