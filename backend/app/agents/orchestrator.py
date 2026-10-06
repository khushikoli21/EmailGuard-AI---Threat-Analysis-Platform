import time
import uuid
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.schemas.email import EmailAnalyzeRequest
from app.schemas.report import ThreatReportResponse
from app.schemas.analysis import PipelineStageLog
from app.agents.prompt_injection_detector import detect_prompt_injection
from app.agents.email_analysis_agent import EmailAnalysisAgent
from app.agents.threat_intelligence_agent import ThreatIntelligenceAgent
from app.agents.rag_evidence_agent import RAGEvidenceAgent
from app.agents.report_agent import report_agent
from app.services.risk_service import risk_engine
from app.utils.email_utils import extract_domain_from_email
from app.utils.validators import sanitize_text
from app.db import models
from app.core.logging_config import logger

class AIThreatOrchestrator:
    """Coordinates the multi-agent email threat detection pipeline."""

    def __init__(self):
        self.email_agent = EmailAnalysisAgent()
        self.intel_agent = ThreatIntelligenceAgent()
        self.rag_agent = RAGEvidenceAgent()

    async def run_pipeline(self, email_req: EmailAnalyzeRequest, db: Session, user_id: str = None) -> Tuple[models.Email, models.Analysis, ThreatReportResponse]:
        analysis_id = str(uuid.uuid4())
        email_id = str(uuid.uuid4())
        stages_log: list[PipelineStageLog] = []

        logger.info(f"Initiating threat analysis pipeline for email from '{email_req.sender_email}'")

        # 1. Normalization & Untrusted Body Sanitization
        sanitized_body = sanitize_text(email_req.body)
        sanitized_subject = sanitize_text(email_req.subject, max_chars=500)
        sender_domain = extract_domain_from_email(email_req.sender_email)

        # 2. Stage 1: Prompt Injection Detector & Untrusted Input Boundary
        t0 = time.time()
        is_injection, injection_indicators, injection_details = detect_prompt_injection(
            body=sanitized_body, subject=sanitized_subject
        )
        t_injection = (time.time() - t0) * 1000

        # 3. Stage 2: Email Analysis Agent
        t0 = time.time()
        email_findings = self.email_agent.analyze(email_req)
        t_email_agent = (time.time() - t0) * 1000

        all_indicators = injection_indicators + email_findings["indicators"]
        urls = email_findings["urls"]

        stages_log.append(
            PipelineStageLog(
                id=str(uuid.uuid4()),
                name="Email Analysis Agent",
                description="Parsed MIME structure, extracted URLs, decoded entities, and evaluated psychological urgency.",
                status="Completed",
                executionTimeMs=round(t_email_agent, 1),
                outputSummary=f"Extracted {len(urls)} URLs, flagged {len(all_indicators)} indicator signals."
            )
        )

        # 4. Stage 3: Threat Intelligence Agent (External APIs)
        t0 = time.time()
        threat_intel_results, intel_indicators = await self.intel_agent.check_urls(urls)
        all_indicators.extend(intel_indicators)
        t_intel_agent = (time.time() - t0) * 1000

        stages_log.append(
            PipelineStageLog(
                id=str(uuid.uuid4()),
                name="Threat Intelligence Agent",
                description="Queried configured domain age, reputation telemetry, and threat feed APIs.",
                status="Completed",
                executionTimeMs=round(t_intel_agent, 1),
                outputSummary=f"Queried {len(threat_intel_results)} external endpoint findings."
            )
        )

        # 5. Stage 4: RAG / Evidence Agent
        t0 = time.time()
        rag_evidence = self.rag_agent.retrieve_evidence(
            subject=sanitized_subject,
            indicators=all_indicators,
            urls=urls
        )
        t_rag = (time.time() - t0) * 1000

        stages_log.append(
            PipelineStageLog(
                id=str(uuid.uuid4()),
                name="RAG / Evidence Agent",
                description="Queried vector knowledge store for matching MITRE ATT&CK patterns and incident taxonomies.",
                status="Completed",
                executionTimeMs=round(t_rag, 1),
                outputSummary=f"Retrieved {len(rag_evidence)} grounded knowledge evidence records."
            )
        )

        # 6. Stage 5: Deterministic Risk Engine
        risk_data = risk_engine.calculate_risk(
            indicators=all_indicators,
            threat_intel=threat_intel_results,
            prompt_injection=is_injection
        )

        # 7. Stage 6: Report Agent
        t0 = time.time()
        report = await report_agent.generate_report(
            analysis_id=analysis_id,
            email_id=email_id,
            sender_email=email_req.sender_email,
            sender_name=email_req.sender_name or "",
            sender_domain=sender_domain,
            recipient_email=email_req.recipient_email or "",
            subject=sanitized_subject,
            body=sanitized_body,
            urls=urls,
            attachments=[att.dict() for att in (email_req.attachment_info or [])],
            indicators=all_indicators,
            threat_intel=threat_intel_results,
            rag_evidence=rag_evidence,
            risk_data=risk_data,
            prompt_injection_suspected=is_injection,
            prompt_injection_details=injection_details,
            pipeline_stages=stages_log
        )
        t_report = (time.time() - t0) * 1000

        stages_log.append(
            PipelineStageLog(
                id=str(uuid.uuid4()),
                name="Report Agent",
                description="Synthesized evidence-backed threat dossier with explainable reasoning and actionable recommendations.",
                status="Completed",
                executionTimeMs=round(t_report, 1),
                outputSummary=f"Verdict: {report.classification} (Risk {report.risk_score}/100)."
            )
        )

        # 8. Persist into Database
        db_email, db_analysis = self._persist_to_db(
            db=db,
            email_id=email_id,
            analysis_id=analysis_id,
            email_req=email_req,
            sender_domain=sender_domain,
            sanitized_subject=sanitized_subject,
            sanitized_body=sanitized_body,
            urls=urls,
            report=report,
            threat_intel_results=threat_intel_results,
            stages_log=stages_log,
            user_id=user_id
        )

        logger.info(f"Pipeline complete for analysis {analysis_id}. Result: {report.classification} ({report.risk_score})")
        return db_email, db_analysis, report

    def _persist_to_db(
        self,
        db: Session,
        email_id: str,
        analysis_id: str,
        email_req: EmailAnalyzeRequest,
        sender_domain: str,
        sanitized_subject: str,
        sanitized_body: str,
        urls: list[str],
        report: ThreatReportResponse,
        threat_intel_results: list,
        stages_log: list,
        user_id: str = None
    ) -> Tuple[models.Email, models.Analysis]:
        # Save Email
        db_email = models.Email(
            id=email_id,
            user_id=user_id,
            sender_name=email_req.sender_name,
            sender_email=email_req.sender_email,
            sender_domain=sender_domain,
            recipient_email=email_req.recipient_email,
            subject=sanitized_subject,
            body=sanitized_body,
            source="manual",
            has_urls=len(urls) > 0,
            has_attachments=len(email_req.attachment_info or []) > 0,
            attachment_info=[att.dict() for att in (email_req.attachment_info or [])]
        )
        db.add(db_email)

        # Save URLs
        for u in urls:
            domain = extract_domain_from_email(u) or ""
            db_url = models.EmailURL(
                email_id=email_id,
                url=u,
                domain=domain,
                normalized_url=u.strip()
            )
            db.add(db_url)

        # Save Analysis
        db_analysis = models.Analysis(
            id=analysis_id,
            email_id=email_id,
            classification=report.classification,
            risk_score=report.risk_score,
            confidence=report.confidence,
            explanation=report.explanation,
            recommended_action=report.recommended_action,
            prompt_injection_suspected=report.prompt_injection_suspected,
            analysis_status="completed"
        )
        db.add(db_analysis)

        # Save Indicators
        for ind in report.indicators:
            db_ind = models.Indicator(
                analysis_id=analysis_id,
                indicator_type=ind.indicator_type,
                title=ind.title,
                description=ind.description,
                severity=ind.severity,
                evidence=ind.evidence,
                source=ind.source or "heuristic"
            )
            db.add(db_ind)

        # Save Threat Intel Results
        for ti in threat_intel_results:
            db_ti = models.ThreatIntelligenceResult(
                analysis_id=analysis_id,
                url=ti.url,
                provider=ti.provider,
                status=ti.status,
                malicious=ti.malicious,
                suspicious=ti.suspicious,
                reputation=ti.reputation,
                raw_result=ti.details
            )
            db.add(db_ti)

        # Save Evidence Items
        for ev in report.evidence.ragEvidence + report.evidence.emailEvidence:
            db_ev = models.Evidence(
                analysis_id=analysis_id,
                evidence_type=ev.source,
                title=ev.finding[:250],
                description=ev.finding,
                source=ev.source,
                source_url=ev.reference,
                relevance_score=ev.relevance_score
            )
            db.add(db_ev)

        # Save Pipeline Logs
        for stg in stages_log:
            db_log = models.AnalysisPipelineLog(
                analysis_id=analysis_id,
                component=stg.name,
                status=stg.status,
                output_summary=stg.outputSummary,
                execution_time=stg.executionTimeMs
            )
            db.add(db_log)

        db.commit()
        db.refresh(db_email)
        db.refresh(db_analysis)
        return db_email, db_analysis

orchestrator = AIThreatOrchestrator()
