def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "llm_provider" in data

def test_analyze_and_retrieve_report(client):
    payload = {
        "sender_name": "IT Desk",
        "sender_email": "security@fake-o365-login.net",
        "subject": "URGENT: Password Expiry Notification - 24 Hours",
        "body": "Your credentials will expire immediately. Renew password at https://fake-o365-login.net/auth",
        "urls": ["https://fake-o365-login.net/auth"]
    }
    # 1. Analyze
    res = client.post("/api/analyze", json=payload)
    assert res.status_code == 201
    report = res.json()
    assert report["classification"] in ["Phishing", "Suspicious"]
    assert report["risk_score"] > 50.0
    analysis_id = report["id"]
    email_id = report["emailId"]

    # 2. Retrieve report by ID
    res_rep = client.get(f"/api/report/{analysis_id}")
    assert res_rep.status_code == 200
    rep_data = res_rep.json()
    assert rep_data["id"] == analysis_id
    assert rep_data["emailId"] == email_id
    assert len(rep_data["indicators"]) >= 1

    # 3. Retrieve email from list
    res_emails = client.get("/api/emails")
    assert res_emails.status_code == 200
    email_list = res_emails.json()
    assert email_list["total"] >= 1

    # 4. Analytics reflects saved record
    res_analytics = client.get("/api/analytics")
    assert res_analytics.status_code == 200
    analytics = res_analytics.json()
    assert analytics["summary"]["totalAnalyzed"] >= 1

def test_evaluation_returns_empty_state_initially(client):
    res = client.get("/api/evaluation")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "pending_evaluation"
    assert data["accuracy"] is None
    assert data["f1Score"] is None
    assert "will appear here" in data["message"].lower()

def test_gmail_connect_returns_status(client):
    res = client.get("/api/gmail/connect")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["configured", "not_configured"]
