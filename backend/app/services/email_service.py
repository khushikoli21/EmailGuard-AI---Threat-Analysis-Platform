from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.db import models
from app.schemas.email import EmailResponse

class EmailService:
    """Service layer handling Email database queries and triage retrieval."""

    def list_emails(
        self,
        db: Session,
        classification: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        query = db.query(models.Email)

        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    models.Email.subject.ilike(s),
                    models.Email.sender_email.ilike(s),
                    models.Email.sender_name.ilike(s),
                    models.Email.body.ilike(s)
                )
            )

        # Filter by classification if specified
        if classification and classification.lower() != "all":
            query = query.join(models.Analysis).filter(
                models.Analysis.classification.ilike(classification.strip())
            )

        total = query.count()
        offset = (page - 1) * page_size
        emails = query.order_by(desc(models.Email.received_at)).offset(offset).limit(page_size).all()

        results: List[EmailResponse] = []
        for e in emails:
            # Get latest analysis if exists
            latest_analysis = (
                db.query(models.Analysis)
                .filter(models.Analysis.email_id == e.id)
                .order_by(desc(models.Analysis.created_at))
                .first()
            )

            urls = [u.url for u in e.urls] if e.urls else []

            results.append(
                EmailResponse(
                    id=e.id,
                    user_id=e.user_id,
                    sender_name=e.sender_name,
                    sender_email=e.sender_email,
                    sender_domain=e.sender_domain,
                    recipient_email=e.recipient_email,
                    subject=e.subject,
                    body=e.body,
                    received_at=e.received_at,
                    source=e.source,
                    message_id=e.message_id,
                    has_urls=e.has_urls,
                    has_attachments=e.has_attachments,
                    attachment_info=e.attachment_info or [],
                    created_at=e.created_at,
                    urls=urls,
                    classification=latest_analysis.classification if latest_analysis else "Pending",
                    risk_score=latest_analysis.risk_score if latest_analysis else None,
                    analysis_id=latest_analysis.id if latest_analysis else None,
                    prompt_injection_suspected=latest_analysis.prompt_injection_suspected if latest_analysis else False
                )
            )

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": results
        }

    def get_email(self, db: Session, email_id: str) -> Optional[EmailResponse]:
        e = db.query(models.Email).filter(models.Email.id == email_id).first()
        if not e:
            return None

        latest_analysis = (
            db.query(models.Analysis)
            .filter(models.Analysis.email_id == e.id)
            .order_by(desc(models.Analysis.created_at))
            .first()
        )
        urls = [u.url for u in e.urls] if e.urls else []

        return EmailResponse(
            id=e.id,
            user_id=e.user_id,
            sender_name=e.sender_name,
            sender_email=e.sender_email,
            sender_domain=e.sender_domain,
            recipient_email=e.recipient_email,
            subject=e.subject,
            body=e.body,
            received_at=e.received_at,
            source=e.source,
            message_id=e.message_id,
            has_urls=e.has_urls,
            has_attachments=e.has_attachments,
            attachment_info=e.attachment_info or [],
            created_at=e.created_at,
            urls=urls,
            classification=latest_analysis.classification if latest_analysis else "Pending",
            risk_score=latest_analysis.risk_score if latest_analysis else None,
            analysis_id=latest_analysis.id if latest_analysis else None,
            prompt_injection_suspected=latest_analysis.prompt_injection_suspected if latest_analysis else False
        )

email_service = EmailService()
