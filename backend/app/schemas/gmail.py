from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class GmailConnectResponse(BaseModel):
    auth_url: Optional[str] = None
    status: str  # 'configured', 'not_configured', 'connected'
    message: str

class GmailMessageItem(BaseModel):
    id: str
    thread_id: Optional[str] = None
    snippet: Optional[str] = None
    sender: str
    subject: str
    date: Optional[str] = None
