from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class EvidenceCreateRequest(BaseModel):
    title: str = Field(..., max_length=255)
    category: str = Field(..., description="Phishing, Business Email Compromise, Credential Harvesting, Impersonation, Social Engineering, Malicious URLs")
    content: str = Field(..., description="Knowledge base description and threat patterns")
    source: str = Field("Manual Entry", max_length=120)
    source_url: Optional[str] = None

class EvidenceItemResponse(BaseModel):
    id: str
    title: str
    category: str
    content: str
    summary: Optional[str] = None
    source: str
    source_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
