import asyncio
from typing import List, Dict, Any, Tuple
from app.integrations.virustotal import VirusTotalClient
from app.integrations.urlscan import URLScanClient
from app.schemas.analysis import ThreatIntelItem, IndicatorItem
from app.core.logging_config import logger

class ThreatIntelligenceAgent:
    """Orchestrates external intelligence lookups across VirusTotal and urlscan.io."""

    def __init__(self):
        self.vt_client = VirusTotalClient()
        self.urlscan_client = URLScanClient()

    async def check_urls(self, urls: List[str]) -> Tuple[List[ThreatIntelItem], List[IndicatorItem]]:
        intel_results: List[ThreatIntelItem] = []
        indicators: List[IndicatorItem] = []

        if not urls:
            return intel_results, indicators

        # Run checks in parallel where appropriate
        tasks = []
        for url in urls[:5]:  # limit to first 5 URLs to respect rate limits
            tasks.append(self._check_single_url(url))

        completed = await asyncio.gather(*tasks, return_exceptions=True)

        for item in completed:
            if isinstance(item, tuple):
                res_list, ind_list = item
                intel_results.extend(res_list)
                indicators.extend(ind_list)

        return intel_results, indicators

    async def _check_single_url(self, url: str) -> Tuple[List[ThreatIntelItem], List[IndicatorItem]]:
        results = []
        indicators = []

        # 1. VirusTotal check
        vt_res = await self.vt_client.scan_url(url)
        results.append(ThreatIntelItem(**vt_res))
        if vt_res.get("malicious"):
            indicators.append(
                IndicatorItem(
                    indicator_type="suspicious_url",
                    title="External Threat Feed: Malicious URL Verdict",
                    description=f"VirusTotal telemetry confirmed malicious engines for: {url}",
                    severity="Critical",
                    evidence=f"Reputation: {vt_res.get('reputation')}",
                    source="Threat Intelligence Agent (VirusTotal)"
                )
            )

        # 2. urlscan check
        urlscan_res = await self.urlscan_client.search_url(url)
        results.append(ThreatIntelItem(**urlscan_res))
        if urlscan_res.get("malicious"):
            indicators.append(
                IndicatorItem(
                    indicator_type="suspicious_url",
                    title="External Threat Feed: urlscan.io Flagged Malicious",
                    description=f"urlscan.io community verdicts flagged destination URL as active threat: {url}",
                    severity="Critical",
                    evidence=f"URL: {url}",
                    source="Threat Intelligence Agent (urlscan.io)"
                )
            )

        return results, indicators
