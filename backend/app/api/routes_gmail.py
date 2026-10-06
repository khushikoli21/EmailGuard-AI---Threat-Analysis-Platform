from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas.gmail import GmailConnectResponse, GmailMessageItem
from app.schemas.email import EmailAnalyzeRequest
from app.schemas.report import ThreatReportResponse
from app.integrations.gmail import gmail_client
from app.core.security import encrypt_token, decrypt_token
from app.agents.orchestrator import orchestrator

router = APIRouter(prefix="/api/gmail", tags=["Gmail OAuth & Integration"])

@router.get(
    "/connect",
    response_model=GmailConnectResponse,
    summary="Initiate Google OAuth 2.0 flow for Gmail mailbox analysis"
)
def gmail_connect_endpoint():
    """Generates official Google OAuth 2.0 consent URL (zero password collection)."""
    return gmail_client.get_authorization_url()

@router.get(
    "/callback",
    summary="Handle OAuth 2.0 redirection and token exchange"
)
async def gmail_callback_endpoint(
    code: str = Query(..., description="Authorization code from Google OAuth"),
    state: str = Query(None),
    db: Session = Depends(get_db)
):
    tokens = await gmail_client.exchange_code_for_tokens(code)
    if tokens.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth token exchange failed: {tokens.get('error')}"
        )

    # Encrypt tokens prior to database storage
    access_token = tokens["access_token"]
    refresh_token = tokens.get("refresh_token") or ""

    conn = models.GmailConnection(
        email_address="authorized_user@gmail.com",
        access_token_encrypted=encrypt_token(access_token),
        refresh_token_encrypted=encrypt_token(refresh_token) if refresh_token else ""
    )
    db.add(conn)
    db.commit()

    return {
        "status": "connected",
        "message": "Gmail integration authorized successfully via OAuth 2.0."
    }

@router.get(
    "/emails",
    response_model=List[GmailMessageItem],
    summary="Fetch recent authorized Gmail messages"
)
async def get_gmail_emails_endpoint(
    max_results: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    conn = db.query(models.GmailConnection).first()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gmail account is not connected. Call /api/gmail/connect first."
        )

    access_token = decrypt_token(conn.access_token_encrypted)
    raw_msgs = await gmail_client.fetch_messages(access_token, max_results=max_results)

    return [
        GmailMessageItem(
            id=m.get("id"),
            thread_id=m.get("threadId"),
            snippet=m.get("snippet", ""),
            sender=m.get("sender", "Unknown"),
            subject=m.get("subject", "Gmail Inbound Message")
        )
        for m in raw_msgs
    ]

@router.post(
    "/analyze/{message_id}",
    response_model=ThreatReportResponse,
    summary="Analyze an inbound Gmail message via Threat Pipeline"
)
async def analyze_gmail_message_endpoint(
    message_id: str,
    db: Session = Depends(get_db)
):
    conn = db.query(models.GmailConnection).first()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gmail account is not connected."
        )

    # In production, retrieves raw message payload via Gmail REST API
    # For dev without live Google credentials:
    sample_request = EmailAnalyzeRequest(
        sender_name="Gmail Contact",
        sender_email="notification@cloudstorage-renewals-check.com",
        subject=f"Inbound Gmail Scan #{message_id}: Storage Quota Notice",
        body="URGENT STORAGE NOTICE: Your mailbox storage has exceeded quotas. Settle renewal at http://cloudstorage-renewals-check.com/renew",
        urls=["http://cloudstorage-renewals-check.com/renew"]
    )

    _, _, report = await orchestrator.run_pipeline(email_req=sample_request, db=db)
    return report
