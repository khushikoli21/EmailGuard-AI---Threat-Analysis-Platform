from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas.report import ThreatReportResponse, EvidenceGroup, EmailSummary
from app.schemas.analysis import IndicatorItem, ThreatIntelItem, EvidenceDetailItem, PipelineStageLog

router = APIRouter(prefix="/api", tags=["Threat Reports"])

@router.get(
    "/report/{analysis_id}",
    response_model=ThreatReportResponse,
    summary="Retrieve structured threat report dossier by analysis ID or email ID"
)
def get_threat_report_endpoint(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    # Lookup either by analysis ID or email ID
    analysis = (
        db.query(models.Analysis)
        .filter((models.Analysis.id == analysis_id) | (models.Analysis.email_id == analysis_id))
        .first()
    )

    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Threat report for '{analysis_id}' was not found."
        )

    email = analysis.email
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated email record missing."
        )

    urls = [u.url for u in email.urls] if email.urls else []

    email_summary = EmailSummary(
        id=email.id,
        sender_name=email.sender_name,
        sender_email=email.sender_email,
        sender_domain=email.sender_domain,
        recipient_email=email.recipient_email,
        subject=email.subject,
        body=email.body,
        received_date=email.received_at.strftime("%Y-%m-%d %H:%M:%S UTC") if email.received_at else "",
        urls=urls,
        attachments=email.attachment_info or []
    )

    indicators = [
        IndicatorItem(
            id=ind.id,
            indicator_type=ind.indicator_type,
            title=ind.title,
            description=ind.description,
            severity=ind.severity,
            evidence=ind.evidence,
            source=ind.source
        )
        for ind in analysis.indicators
    ]

    threat_intel = [
        ThreatIntelItem(
            provider=ti.provider,
            url=ti.url,
            status=ti.status,
            malicious=ti.malicious,
            suspicious=ti.suspicious,
            reputation=ti.reputation,
            details=ti.raw_result or {}
        )
        for ti in analysis.threat_intel_results
    ]

    email_evidence = []
    rag_evidence = []
    threat_intel_evidence = []

    for ev in analysis.evidence_items:
        detail = EvidenceDetailItem(
            id=ev.id,
            source=ev.evidence_type,
            finding=ev.description,
            status="Malicious" if "Malicious" in ev.description or analysis.risk_score and analysis.risk_score >= 70 else "Suspicious",
            reference=ev.source_url,
            relevance_score=ev.relevance_score
        )
        if "RAG" in ev.evidence_type:
            rag_evidence.append(detail)
        elif "Threat Intelligence" in ev.evidence_type:
            threat_intel_evidence.append(detail)
        else:
            email_evidence.append(detail)

    pipeline_stages = [
        PipelineStageLog(
            id=pl.id,
            name=pl.component,
            description=f"Stage execution completed ({pl.execution_time or 0:.1f}ms).",
            status=pl.status,
            executionTimeMs=pl.execution_time,
            outputSummary=pl.output_summary
        )
        for pl in analysis.pipeline_logs
    ]

    risk_score = analysis.risk_score
    if risk_score is not None:
        risk_level = "Critical" if risk_score >= 80 else "High" if risk_score >= 60 else "Medium" if risk_score >= 30 else "Low"
    else:
        risk_level = "Low"

    return ThreatReportResponse(
        id=analysis.id,
        emailId=email.id,
        emailSummary=email_summary,
        classification=analysis.classification or "Unclassified",
        risk_score=risk_score,
        risk_level=risk_level,
        confidence=analysis.confidence or 90.0,
        explanation=analysis.explanation or "Analysis completed.",
        recommended_action=analysis.recommended_action or "Review carefully.",
        prompt_injection_suspected=analysis.prompt_injection_suspected,
        indicators=indicators,
        evidence=EvidenceGroup(
            emailEvidence=email_evidence,
            threatIntelEvidence=threat_intel_evidence,
            ragEvidence=rag_evidence
        ),
        threat_intelligence_findings=threat_intel,
        pipelineStages=pipeline_stages,
        generatedAt=analysis.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if analysis.created_at else ""
    )
