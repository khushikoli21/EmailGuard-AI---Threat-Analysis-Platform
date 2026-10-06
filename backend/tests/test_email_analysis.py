from app.schemas.email import EmailAnalyzeRequest, AttachmentInfo
from app.agents.email_analysis_agent import EmailAnalysisAgent
from app.utils.url_utils import extract_urls, is_suspicious_attachment
from app.utils.email_utils import check_sender_mismatch

def test_url_extraction():
    text = "Visit our portal at https://login-microsoft365.net/auth and check http://redirect.biz?dest=payload.vbs"
    urls = extract_urls(text)
    assert len(urls) == 2
    assert any("login-microsoft365.net" in u for u in urls)

def test_sender_brand_mismatch():
    is_mismatch, reason = check_sender_mismatch(
        sender_name="Microsoft 365 Support",
        sender_email="support@fake-o365-portal.net"
    )
    assert is_mismatch is True
    assert "Microsoft" in reason

def test_sender_legitimate_match():
    is_mismatch, _ = check_sender_mismatch(
        sender_name="GitHub Team",
        sender_email="noreply@github.com"
    )
    assert is_mismatch is False

def test_suspicious_attachment():
    is_susp, note = is_suspicious_attachment("Statement.htm")
    assert is_susp is True
    assert ".htm" in note

    is_safe, _ = is_suspicious_attachment("Meeting_Agenda.pdf")
    assert is_safe is False

def test_email_analysis_agent_findings():
    agent = EmailAnalysisAgent()
    req = EmailAnalyzeRequest(
        sender_name="IT Support",
        sender_email="security@o365-verify.com",
        subject="URGENT: Password Expiry Notification",
        body="Your account will expire immediately. Verify password at https://o365-verify.com/login",
        attachment_info=[AttachmentInfo(filename="payload.vbs", size="12 KB")]
    )
    res = agent.analyze(req)
    assert len(res["indicators"]) >= 3
    types = [ind.indicator_type for ind in res["indicators"]]
    assert "credential_request" in types
    assert "urgency_language" in types
    assert "malicious_attachment" in types
