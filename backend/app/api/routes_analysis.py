from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.email import EmailAnalyzeRequest, EmailResponse
from app.schemas.report import ThreatReportResponse
from app.agents.orchestrator import orchestrator
from app.core.logging_config import logger

router = APIRouter(prefix="/api", tags=["Threat Analysis"])

@router.post(
    "/analyze",
    response_model=ThreatReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit an email to the multi-agent threat detection pipeline"
)
async def analyze_email_endpoint(
    payload: EmailAnalyzeRequest,
    db: Session = Depends(get_db)
):
    """
    Submits an email for full end-to-end multi-agent security evaluation:
    1. Input normalization & prompt injection quarantine
    2. Email analysis (MIME, headers, urgency, credentials)
    3. Threat intelligence lookup (VirusTotal, urlscan.io)
    4. RAG / Evidence retrieval from vector store
    5. Deterministic risk calculation
    6. Explainable reasoning and recommended action
    7. Database persistence
    """
    if not payload.sender_email or not payload.body:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="sender_email and body are required fields."
        )

    try:
        _, _, report = await orchestrator.run_pipeline(email_req=payload, db=db)
        return report
    except Exception as e:
        logger.error(f"Error executing analysis pipeline: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline execution failed: {str(e)}"
        )
