from app.rag.vector_store import vector_store
from app.core.logging_config import logger

DEFAULT_KNOWLEDGE_DOCS = [
    {
        "id": "kb-01",
        "title": "Credential Harvesting via Lookalike Domains (Typosquatting)",
        "category": "Phishing",
        "content": "Attackers register domain variations that mimic recognized vendors (e.g., login-microsoft365.net, o365-verify.com) and deploy cloned authentication dialogs to capture user tokens and passwords. Key indicators include newly registered domains (< 14 days), unaligned WHOIS records, and visual homograph substitutions.",
        "source": "MITRE ATT&CK T1566.002",
        "source_url": "https://attack.mitre.org/techniques/T1566/002/"
    },
    {
        "id": "kb-02",
        "title": "Executive Pretext & Wire Fraud (CEO Fraud / BEC)",
        "category": "Business Email Compromise",
        "content": "Social engineering attack impersonating C-level executives requesting urgent wire transfers, payroll diversion, or gift cards with explicit discouragement of telephone verification. Indicators include authority pressure, claims of being in flight or meetings, and lookalike personal sender domains.",
        "source": "FBI IC3 BEC Advisory / MITRE T1566.001",
        "source_url": "https://attack.mitre.org/techniques/T1566/001/"
    },
    {
        "id": "kb-03",
        "title": "Adversarial Prompt Injection in Email Content",
        "category": "Social Engineering",
        "content": "Direct or indirect prompt injection inserted into email headers or body text aiming to hijack LLM-based security orchestrators into bypassing classifiers or outputting false safe verdicts. Indicators include override tokens ('Ignore previous directions'), delimiter simulation ('=== SYSTEM ==='), and instruction overrides.",
        "source": "OWASP Top 10 for LLM Applications (LLM01)",
        "source_url": "https://owasp.org/www-project-top-10-for-large-language-model-applications/"
    },
    {
        "id": "kb-04",
        "title": "HTML Smuggling and Script Attachment Payloads",
        "category": "Malicious URLs",
        "content": "Delivery technique using HTML5 attributes or base64 encoded JavaScript within attachments (e.g., .htm, .vbs) to assemble malicious malware payloads locally inside the victim's browser, bypassing standard gateway signature filters.",
        "source": "MITRE ATT&CK T1027.006",
        "source_url": "https://attack.mitre.org/techniques/T1027/006/"
    },
    {
        "id": "kb-05",
        "title": "MFA Push Fatigue and Fake Session Expiration",
        "category": "Credential Harvesting",
        "content": "Simulated authentication timeout notices claiming mailbox suspension within 24 hours to induce rushed compliance. Attackers set up reverse-proxy portals (Evilginx) that intercept real-time session cookies and passcodes.",
        "source": "MITRE ATT&CK T1556",
        "source_url": "https://attack.mitre.org/techniques/T1556/"
    },
    {
        "id": "kb-06",
        "title": "Open Redirect Abuse and Multi-Stage URL Redirects",
        "category": "Malicious URLs",
        "content": "Abuse of trusted services (e.g. marketing trackers, open redirectors on corporate sites) to disguise malicious destinations until after the victim clicks the hyperlink.",
        "source": "MITRE ATT&CK T1204.001",
        "source_url": "https://attack.mitre.org/techniques/T1204/001/"
    }
]

def load_default_knowledge():
    """Seeds the RAG vector store with standard cybersecurity threat taxonomy."""
    for doc in DEFAULT_KNOWLEDGE_DOCS:
        vector_store.add_document(
            doc_id=doc["id"],
            title=doc["title"],
            category=doc["category"],
            content=doc["content"],
            source=doc["source"],
            source_url=doc["source_url"]
        )
    logger.info(f"Loaded {len(DEFAULT_KNOWLEDGE_DOCS)} cybersecurity knowledge documents into vector store.")
