from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SummaryStats(BaseModel):
    totalAnalyzed: int
    safeCount: int
    suspiciousCount: int
    phishingCount: int
    spamCount: int
    averageRiskScore: float
    criticalAlertsCount: int

class DistributionItem(BaseModel):
    name: str
    value: int
    color: str

class RiskScoreBucket(BaseModel):
    range: str
    count: int
    label: str

class TimelineItem(BaseModel):
    date: str
    safe: int
    suspicious: int
    phishing: int
    spam: int
    total: int

class TopIndicatorItem(BaseModel):
    name: str
    frequency: int
    severity: str

class AnalyticsResponse(BaseModel):
    summary: SummaryStats
    threatDistribution: List[DistributionItem]
    riskScoreBuckets: List[RiskScoreBucket]
    volumeOverTime: List[TimelineItem]
    topIndicators: List[TopIndicatorItem]
