from datetime import datetime
from typing import List, Dict, Any
from app.schemas.analysis import IndicatorItem, ThreatIntelItem, EvidenceDetailItem, PipelineStageLog
from app.schemas.report import ThreatReportResponse, EvidenceGroup, EmailSummary
from app.services.llm_service import llm_service

class ReportAgent:
    """Synthesizes agent outputs into evidence-grounded threat reports."""

    async def generate_report(
        self,
        analysis_id: str,
        email_id: str,
        sender_email: str,
        sender_name: str,
        sender_domain: str,
        recipient_email: str,
        subject: str,
        body: str,
        urls: List[str],
        attachments: List[Dict[str, Any]],
        indicators: List[IndicatorItem],
        threat_intel: List[ThreatIntelItem],
        rag_evidence: List[EvidenceDetailItem],
        risk_data: Dict[str, Any],
        prompt_injection_suspected: bool,
        prompt_injection_details: str,
        pipeline_stages: List[PipelineStageLog]
    ) -> ThreatReportResponse:
        risk_score = risk_data["risk_score"]
        risk_level = risk_data["risk_level"]

        # Determine classification deterministically
        if prompt_injection_suspected:
            classification = "Phishing"
            confidence = 0.98
        elif risk_score >= 70.0:
            classification = "Phishing"
            confidence = 0.92
        elif risk_score >= 35.0:
            classification = "Suspicious"
            confidence = 0.85
        elif any(ind.indicator_type == "payment_request" for ind in indicators):
            classification = "Suspicious"
            confidence = 0.80
        elif any("marketing" in ind.title.lower() for ind in indicators):
            classification = "Spam"
            confidence = 0.88
        else:
            classification = "Safe"
            confidence = 0.95

        # Query LLM / Rule service for explainable reasoning
        reasoning = await llm_service.generate_explanation(
            subject=subject,
            sender_email=sender_email,
            classification=classification,
            risk_score=risk_score,
            indicators=indicators,
            prompt_injection=prompt_injection_suspected
        )

        # Assemble Evidence Group
        email_evidence = []
        for ind in indicators:
            if ind.source in ["Email Analysis Agent", "Email Analysis Agent (NLP Heuristics)", "Prompt Injection Detector (OWASP LLM01)"]:
                status = "Malicious" if ind.severity in ["Critical", "High"] else "Suspicious"
                email_evidence.append(
                    EvidenceDetailItem(
                        source="Email Content",
                        finding=f"{ind.title}: {ind.description}",
                        status=status,
                        reference=ind.evidence
                    )
                )

        threat_intel_evidence = []
        for ti in threat_intel:
            status = "Malicious" if ti.malicious else "Suspicious" if ti.suspicious else "Informational"
            threat_intel_evidence.append(
                EvidenceDetailItem(
                    source="Threat Intelligence",
                    finding=f"{ti.provider}: {ti.reputation}",
                    status=status,
                    reference=ti.url
                )
            )

        evidence_group = EvidenceGroup(
            emailEvidence=email_evidence,
            threatIntelEvidence=threat_intel_evidence,
            ragEvidence=rag_evidence
        )

        email_summary = EmailSummary(
            id=email_id,
            sender_name=sender_name,
            sender_email=sender_email,
            sender_domain=sender_domain,
            recipient_email=recipient_email,
            subject=subject,
            body=body,
            received_date=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            urls=urls,
            attachments=attachments
        )

        return ThreatReportResponse(
            id=analysis_id,
            emailId=email_id,
            emailSummary=email_summary,
            classification=classification,
            risk_score=risk_score,
            risk_level=risk_level,
            confidence=round(confidence * 100, 1),
            explanation=reasoning["explanation"],
            recommended_action=reasoning["recommended_action"],
            prompt_injection_suspected=prompt_injection_suspected,
            prompt_injection_details=prompt_injection_details if prompt_injection_suspected else None,
            indicators=indicators,
            evidence=evidence_group,
            threat_intelligence_findings=threat_intel,
            pipelineStages=pipeline_stages,
            generatedAt=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        )

report_agent = ReportAgent()
