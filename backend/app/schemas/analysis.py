from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class IndicatorItem(BaseModel):
    id: Optional[str] = None
    indicator_type: str = Field(..., description="Category: url, credentials, urgency, domain, impersonation, etc.")
    title: str
    description: str
    severity: str = Field(..., description="Low, Medium, High, Critical")
    evidence: Optional[str] = None
    source: Optional[str] = "heuristic"

    class Config:
        from_attributes = True

class ThreatIntelItem(BaseModel):
    provider: str
    url: str
    status: str  # 'completed', 'not_configured', 'unavailable', 'failed'
    malicious: bool = False
    suspicious: bool = False
    reputation: Optional[str] = None
    details: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class EvidenceDetailItem(BaseModel):
    id: Optional[str] = None
    source: str  # 'Email Content', 'Threat Intelligence', 'RAG / Knowledge Base'
    finding: str
    status: str  # 'Safe', 'Suspicious', 'Malicious', 'Informational'
    reference: Optional[str] = None
    relevance_score: Optional[float] = None

class PipelineStageLog(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    status: str  # 'Pending', 'Running', 'Completed', 'Failed', 'Skipped'
    executionTimeMs: Optional[float] = None
    outputSummary: Optional[str] = None

    class Config:
        from_attributes = True
