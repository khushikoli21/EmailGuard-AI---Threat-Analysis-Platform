from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.analysis import IndicatorItem, ThreatIntelItem, EvidenceDetailItem, PipelineStageLog

class EvidenceGroup(BaseModel):
    emailEvidence: List[EvidenceDetailItem] = []
    threatIntelEvidence: List[EvidenceDetailItem] = []
    ragEvidence: List[EvidenceDetailItem] = []

class EmailSummary(BaseModel):
    id: str
    sender_name: Optional[str] = None
    sender_email: str
    sender_domain: Optional[str] = None
    recipient_email: Optional[str] = None
    subject: str
    body: str
    received_date: str
    urls: List[str] = []
    attachments: List[Dict[str, Any]] = []

class ThreatReportResponse(BaseModel):
    id: str  # report/analysis id
    emailId: str
    emailSummary: Optional[EmailSummary] = None
    classification: str = Field(..., description="Safe, Suspicious, Phishing, Spam, etc.")
    risk_score: Optional[float] = Field(None, description="0-100 deterministic risk score or None")
    risk_level: str = Field(..., description="Low, Medium, High, Critical")
    confidence: Optional[float] = Field(None, description="0-100 confidence score")
    explanation: str
    recommended_action: str
    prompt_injection_suspected: bool = False
    prompt_injection_details: Optional[str] = None
    indicators: List[IndicatorItem] = []
    evidence: EvidenceGroup = Field(default_factory=EvidenceGroup)
    threat_intelligence_findings: List[ThreatIntelItem] = []
    pipelineStages: List[PipelineStageLog] = []
    generatedAt: str

    class Config:
        from_attributes = True
