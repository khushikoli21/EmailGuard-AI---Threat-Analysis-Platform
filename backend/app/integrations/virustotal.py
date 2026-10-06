import base64
import httpx
from typing import Dict, Any
from app.core.config import settings
from app.core.logging_config import logger

# In-memory lookup cache to preserve API quota
_VT_CACHE: Dict[str, Dict[str, Any]] = {}

class VirusTotalClient:
    """VirusTotal API v3 Client for URL & Domain reputation."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.VIRUSTOTAL_API_KEY
        self.base_url = "https://www.virustotal.com/api/v3"

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    async def scan_url(self, url: str) -> Dict[str, Any]:
        """Queries VirusTotal v3 URL analysis. Returns normalized response."""
        if not self.is_configured():
            return {
                "provider": "VirusTotal",
                "url": url,
                "status": "not_configured",
                "malicious": False,
                "suspicious": False,
                "reputation": "API Key Not Configured",
                "details": {"message": "VIRUSTOTAL_API_KEY not configured in environment"}
            }

        if url in _VT_CACHE:
            return _VT_CACHE[url]

        try:
            url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
            headers = {"x-apikey": self.api_key}

            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(f"{self.base_url}/urls/{url_id}", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                    malicious_count = stats.get("malicious", 0)
                    suspicious_count = stats.get("suspicious", 0)

                    result = {
                        "provider": "VirusTotal",
                        "url": url,
                        "status": "completed",
                        "malicious": malicious_count > 0,
                        "suspicious": suspicious_count > 0,
                        "reputation": f"{malicious_count} malicious / {suspicious_count} suspicious engines",
                        "details": stats
                    }
                    _VT_CACHE[url] = result
                    return result
                elif res.status_code == 404:
                    return {
                        "provider": "VirusTotal",
                        "url": url,
                        "status": "completed",
                        "malicious": False,
                        "suspicious": False,
                        "reputation": "No previous scan record found",
                        "details": {"status_code": 404}
                    }
                else:
                    return {
                        "provider": "VirusTotal",
                        "url": url,
                        "status": "unavailable",
                        "malicious": False,
                        "suspicious": False,
                        "reputation": f"HTTP {res.status_code}",
                        "details": {"status_code": res.status_code}
                    }
        except Exception as e:
            logger.warning(f"VirusTotal query failed for URL: {e}")
            return {
                "provider": "VirusTotal",
                "url": url,
                "status": "unavailable",
                "malicious": False,
                "suspicious": False,
                "reputation": "Service Query Failed",
                "details": {"error": str(e)}
            }
