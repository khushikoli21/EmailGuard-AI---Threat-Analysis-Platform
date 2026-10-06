from typing import Dict, List, Any
from app.schemas.email import EmailAnalyzeRequest
from app.schemas.analysis import IndicatorItem
from app.utils.url_utils import extract_urls, analyze_url_heuristics, is_suspicious_attachment
from app.utils.email_utils import extract_domain_from_email, check_sender_mismatch
from app.utils.text_utils import analyze_linguistic_threat_indicators

class EmailAnalysisAgent:
    """Specialized component analyzing email headers, linguistic cues, URLs, and attachments."""

    def analyze(self, email_req: EmailAnalyzeRequest) -> Dict[str, Any]:
        indicators: List[IndicatorItem] = []
        sender_email = email_req.sender_email
        sender_name = email_req.sender_name or ""
        subject = email_req.subject
        body = email_req.body

        # 1. Sender & Domain Mismatch
        mismatch_detected, mismatch_reason = check_sender_mismatch(sender_name, sender_email)
        if mismatch_detected:
            indicators.append(
                IndicatorItem(
                    indicator_type="sender_domain_mismatch",
                    title="Sender / Display Name Mismatch",
                    description=mismatch_reason or "Sender display name contradicts origin domain.",
                    severity="High",
                    evidence=f"From: '{sender_name}' <{sender_email}>",
                    source="Email Analysis Agent"
                )
            )

        # 2. Extract & Analyze URLs
        found_urls = set(email_req.urls or [])
        extracted = extract_urls(body)
        found_urls.update(extracted)
        url_list = list(found_urls)

        url_heuristic_findings = []
        for url in url_list:
            is_mal, is_susp, reasons = analyze_url_heuristics(url)
            if is_susp or is_mal:
                severity = "Critical" if is_mal else "High"
                indicators.append(
                    IndicatorItem(
                        indicator_type="suspicious_url",
                        title="Suspicious or Malicious URL Identified",
                        description=f"URL inspection flagged anomalies: {', '.join(reasons)}",
                        severity=severity,
                        evidence=f"URL: {url}",
                        source="Email Analysis Agent (URL Heuristics)"
                    )
                )
            url_heuristic_findings.append({
                "url": url,
                "is_malicious": is_mal,
                "is_suspicious": is_susp,
                "reasons": reasons
            })

        # 3. Analyze Attachments
        attachment_findings = []
        for att in (email_req.attachment_info or []):
            is_danger, danger_note = is_suspicious_attachment(att.filename)
            if is_danger or att.is_suspicious:
                indicators.append(
                    IndicatorItem(
                        indicator_type="malicious_attachment",
                        title="Potentially Hazardous Email Attachment",
                        description=danger_note or f"Attachment '{att.filename}' requires isolated sandbox execution.",
                        severity="High",
                        evidence=f"File: {att.filename} ({att.size})",
                        source="Email Analysis Agent"
                    )
                )
            attachment_findings.append({
                "filename": att.filename,
                "is_suspicious": is_danger or att.is_suspicious,
                "notes": danger_note or att.notes
            })

        # 4. Linguistic Cues (Urgency, Credential Solicitation, Payment Pressure, Suppression)
        linguistic = analyze_linguistic_threat_indicators(subject, body)

        if linguistic["urgency"]:
            indicators.append(
                IndicatorItem(
                    indicator_type="urgency_language",
                    title="Coercive Urgency Language",
                    description="High-pressure psychological triggers threatening immediate operational loss or penalties.",
                    severity="Medium" if len(linguistic["urgency"]) == 1 else "High",
                    evidence=f"Keywords: {', '.join(linguistic['urgency'])}",
                    source="Email Analysis Agent (NLP Heuristics)"
                )
            )

        if linguistic["credentials"]:
            indicators.append(
                IndicatorItem(
                    indicator_type="credential_request",
                    title="Credential Solicitation Pattern",
                    description="Message solicits account authentication, password verification, or session renewal.",
                    severity="High",
                    evidence=f"Keywords: {', '.join(linguistic['credentials'])}",
                    source="Email Analysis Agent (NLP Heuristics)"
                )
            )

        if linguistic["payment"]:
            indicators.append(
                IndicatorItem(
                    indicator_type="payment_request",
                    title="Financial Transaction / Wire Request",
                    description="Message solicits expedited wire transfers, invoice settlement, or banking alterations.",
                    severity="High",
                    evidence=f"Keywords: {', '.join(linguistic['payment'])}",
                    source="Email Analysis Agent (NLP Heuristics)"
                )
            )

        if linguistic["suppression"]:
            indicators.append(
                IndicatorItem(
                    indicator_type="impersonation",
                    title="Out-of-Band Verification Suppression",
                    description="Explicit instructions discouraging phone calls or secondary verification (e.g. 'airborne', 'do not call').",
                    severity="High",
                    evidence=f"Phrases: {', '.join(linguistic['suppression'])}",
                    source="Email Analysis Agent"
                )
            )

        return {
            "urls": url_list,
            "indicators": indicators,
            "url_findings": url_heuristic_findings,
            "attachment_findings": attachment_findings,
            "linguistic_matches": linguistic
        }
