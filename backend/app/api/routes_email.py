from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.email import EmailResponse, EmailListResponse
from app.services.email_service import email_service

router = APIRouter(prefix="/api", tags=["Emails"])

@router.get(
    "/emails",
    response_model=EmailListResponse,
    summary="List normalized and analyzed emails with pagination and search"
)
def get_emails_endpoint(
    classification: Optional[str] = Query(None, description="Filter: Safe, Suspicious, Phishing, Spam"),
    search: Optional[str] = Query(None, description="Search subject, sender, or content"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    result = email_service.list_emails(
        db=db,
        classification=classification,
        search=search,
        page=page,
        page_size=page_size
    )
    return EmailListResponse(**result)

@router.get(
    "/emails/{email_id}",
    response_model=EmailResponse,
    summary="Retrieve a single email by ID"
)
def get_email_by_id_endpoint(
    email_id: str,
    db: Session = Depends(get_db)
):
    email = email_service.get_email(db=db, email_id=email_id)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email with ID '{email_id}' was not found."
        )
    return email
