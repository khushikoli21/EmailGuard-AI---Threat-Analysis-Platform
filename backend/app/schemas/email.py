from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

class AttachmentInfo(BaseModel):
    filename: str
    size: Optional[str] = "Unknown"
    mime_type: Optional[str] = "application/octet-stream"
    is_suspicious: Optional[bool] = False
    notes: Optional[str] = None

class EmailAnalyzeRequest(BaseModel):
    sender_name: Optional[str] = Field(None, description="Display name of sender")
    sender_email: str = Field(..., description="Email address of sender")
    recipient_email: Optional[str] = Field(None, description="Recipient email address")
    subject: str = Field(..., description="Subject line")
    body: str = Field(..., description="Body text or MIME content of email")
    urls: Optional[List[str]] = Field(default_factory=list, description="Explicitly extracted URLs")
    attachment_info: Optional[List[AttachmentInfo]] = Field(default_factory=list, description="Attachment metadata")

class EmailURLResponse(BaseModel):
    id: str
    url: str
    domain: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EmailResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    sender_name: Optional[str] = None
    sender_email: str
    sender_domain: Optional[str] = None
    recipient_email: Optional[str] = None
    subject: str
    body: str
    received_at: datetime
    source: str
    message_id: Optional[str] = None
    has_urls: bool
    has_attachments: bool
    attachment_info: List[Dict[str, Any]] = []
    created_at: datetime
    urls: List[str] = []
    classification: Optional[str] = None
    risk_score: Optional[float] = None
    analysis_id: Optional[str] = None
    prompt_injection_suspected: Optional[bool] = False

    class Config:
        from_attributes = True

class EmailListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[EmailResponse]
