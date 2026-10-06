# EmailGuard AI — Backend & Security Analysis Engine

AI-Powered Intelligent Email Threat Detection & Security Analysis Platform  
College Final-Year / Semester Academic Project

---

## 1. Project Overview

**EmailGuard AI** is a modular, evidence-grounded cybersecurity backend designed for automated email threat analysis. Rather than producing opaque probability scores, the system coordinates specialized AI agents and security heuristics to detect:

* **Credential Harvesting** (Typosquatting & SSO lookalike domains)
* **Business Email Compromise (BEC)** & CEO Fraud
* **Malicious URLs** via external threat intelligence
* **Adversarial Prompt Injection** targeting LLMs (OWASP LLM01)
* **Social Engineering & Coercive Urgency Language**
* **Impersonation & Display Name Mismatches**

The platform calculates a **deterministic risk score (0–100)** and produces structured threat reports backed by verifiable content indicators, external threat feeds, and vectorized cybersecurity knowledge (RAG).

---

## 2. System Architecture

```text
               User / React Frontend
                         ↓
               FastAPI Backend (:8000)
                         ↓
               AI Threat Orchestrator
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 1. Prompt Injection Detector (Untrusted Payload Boundary)│
│ 2. Email Analysis Agent (MIME, Headers, URLs, NLP)       │
│ 3. Threat Intelligence Agent (VirusTotal, urlscan.io)    │
│ 4. RAG / Evidence Agent (Vector Store & MITRE ATT&CK)    │
│ 5. Deterministic Risk Engine (Weighted Scoring 0–100)    │
│ 6. Report Agent (Explainable Reasoning & Actions)        │
└──────────────────────────────────────────────────────────┘
                         ↓
               Structured Threat Report
                         ↓
         Database (PostgreSQL / SQLite)
                         ↓
               React SOC Dashboard
```

---

## 3. Backend Folder Structure

```text
backend/
├── app/
│   ├── main.py                     # FastAPI application & lifespan lifecycle
│   ├── api/                        # REST API endpoint routers
│   │   ├── routes_analysis.py      # POST /api/analyze
│   │   ├── routes_email.py         # GET /api/emails, GET /api/emails/{id}
│   │   ├── routes_reports.py       # GET /api/report/{analysis_id}
│   │   ├── routes_analytics.py     # GET /api/analytics
│   │   ├── routes_evaluation.py    # GET /api/evaluation, POST /api/evaluation/run
│   │   ├── routes_evidence.py      # GET /api/evidence, POST /api/evidence
│   │   └── routes_gmail.py         # GET /api/gmail/connect, callback, emails
│   ├── core/
│   │   ├── config.py               # Pydantic Settings & environment variables
│   │   ├── security.py             # Fernet cryptographic token encryption
│   │   └── logging_config.py       # Redacting structured logger
│   ├── db/
│   │   ├── database.py             # SQLAlchemy engine & session dependency
│   │   ├── models.py               # Database schemas (Emails, Analyses, Indicators, etc.)
│   │   └── migrations/             # Alembic migration environment
│   ├── schemas/                    # Pydantic validation request/response schemas
│   │   ├── email.py
│   │   ├── analysis.py
│   │   ├── report.py
│   │   ├── evidence.py
│   │   ├── analytics.py
│   │   ├── evaluation.py
│   │   └── gmail.py
│   ├── agents/                     # Specialized AI security agents
│   │   ├── orchestrator.py         # Coordinates multi-agent workflow & DB commits
│   │   ├── prompt_injection_detector.py # Flags adversarial instruction attacks
│   │   ├── email_analysis_agent.py # Header, MIME, URL & NLP heuristic parser
│   │   ├── threat_intelligence_agent.py # Queries external security feeds
│   │   ├── rag_evidence_agent.py   # Vector retrieval against MITRE taxonomy
│   │   └── report_agent.py         # Synthesizes evidence dossier & actions
│   ├── services/
│   │   ├── risk_service.py         # Deterministic weighted risk score engine
│   │   ├── llm_service.py          # Modular LLM client (Gemini, OpenAI, Groq)
│   │   ├── email_service.py        # Email CRUD, search, and pagination
│   │   ├── analytics_service.py    # Real-time DB telemetry calculator
│   │   └── evaluation_service.py   # Empirical benchmark runner
│   ├── integrations/
│   │   ├── virustotal.py           # VirusTotal v3 URL API client with caching
│   │   ├── urlscan.py              # urlscan.io search API client
│   │   └── gmail.py                # Google OAuth 2.0 client
│   ├── rag/
│   │   ├── vector_store.py         # Modular VectorStore (ChromaDB + in-memory fallback)
│   │   ├── embeddings.py           # Cosine similarity and vector normalizer
│   │   └── knowledge_loader.py     # MITRE ATT&CK taxonomy seeder
│   └── utils/
│       ├── url_utils.py            # URL & dangerous attachment extractor
│       ├── email_utils.py          # Domain & display name mismatch checks
│       ├── text_utils.py           # Linguistic urgency and credential patterns
│       └── validators.py           # Input sanitization
├── tests/                          # Real pytest test suite
│   ├── conftest.py
│   ├── test_email_analysis.py
│   ├── test_risk_score.py
│   ├── test_prompt_injection.py
│   └── test_api.py
├── data/
│   └── sample_emails/              # Clearly marked DEVELOPMENT SAMPLE DATA
├── knowledge_base/                 # JSON reference articles by category
├── alembic.ini                     # Migration configuration
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment template
└── run.py                          # Local development runner
```

---

## 4. Prerequisites

* **Python 3.10+ or Python 3.11+** installed
* **Git** installed
* **PostgreSQL** (Optional for production; SQLite is included out-of-the-box for development)

---

## 5. Environment Setup (Windows & macOS/Linux)

### On Windows (Command Prompt / PowerShell)

```cmd
:: 1. Navigate to backend directory
cd backend

:: 2. Create a virtual environment
python -m venv venv

:: 3. Activate the virtual environment
:: In Command Prompt (cmd):
venv\Scripts\activate.bat

:: In PowerShell:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1

:: 4. Upgrade pip
python -m pip install --upgrade pip

:: 5. Install dependencies
pip install -r requirements.txt
```

### On macOS / Linux

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 6. Environment Configuration (`.env`)

Copy the `.env.example` template:

```cmd
:: On Windows:
copy .env.example .env

:: On Linux / Mac:
cp .env.example .env
```

Edit `.env` to configure your settings:

```ini
ENVIRONMENT=development
DATABASE_URL=sqlite:///./emailguard.db
SECRET_KEY=generate_a_secure_random_key_for_oauth_tokens_32bytes

# LLM Provider (options: 'gemini', 'openai', 'groq', or 'rule_based')
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# External Threat Intelligence (Optional)
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
URLSCAN_API_KEY=your_urlscan_api_key_here

# Google OAuth 2.0 (Optional, for Gmail ingestion)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/gmail/callback
```

*Note: If external keys (VirusTotal, Gemini, Gmail) are left empty, the application will **never crash**; it reports `status: "not_configured"` and uses deterministic explainability.*

---

## 7. Database Initialization & Migrations

### Automatic Schema Creation (Fastest)

The application automatically creates all tables upon first startup:

```bash
python run.py
```

### Alembic Migrations (Recommended for Production)

```bash
# Create an initial migration
alembic revision --autogenerate -m "initial database"

# Apply migrations
alembic upgrade head
```

---

## 8. Running the Backend Server

Start the server using either method:

### Option A: Using the Runner Script

```bash
python run.py
```

### Option B: Using Uvicorn Directly

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
* **API Base:** `http://localhost:8000`
* **Swagger Interactive Docs:** `http://localhost:8000/docs`
* **ReDoc Documentation:** `http://localhost:8000/redoc`

---

## 9. Running the Test Suite

Execute unit and integration tests using `pytest`:

```bash
pytest -v
```

This tests:
1. Health check endpoint (`GET /api/health`)
2. Email analysis and indicator extraction
3. Prompt injection detection
4. Deterministic risk calculation
5. Full pipeline submission (`POST /api/analyze`)
6. Report retrieval (`GET /api/report/{id}`)
7. Real database analytics calculations (`GET /api/analytics`)
8. Unpopulated dataset evaluation state (`GET /api/evaluation`)

---

## 10. Connecting Your React Frontend

1. Ensure your React frontend is running (default: `http://localhost:3000` or `http://localhost:5173`).
2. Open the frontend in your browser.
3. Navigate to **Settings** in the left sidebar:
   * **Operation Mode:** Toggle to **"FastAPI Live Mode"**.
   * **FastAPI Base URL:** Enter `http://localhost:8000`.
   * Click **"Test Health"** — it will ping `GET /api/health` and show "Connected".
4. When you submit an email on the **Analyze Email** page, it will make a live `POST` request to `http://localhost:8000/api/analyze` and save the resulting dossier directly in your database!

---

## 11. API Endpoints Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Service status and configured providers |
| `/api/analyze` | POST | Executes 6-stage threat detection pipeline |
| `/api/emails` | GET | List analyzed emails (pagination, search, filters) |
| `/api/emails/{id}` | GET | Retrieve full normalized email record |
| `/api/report/{analysis_id}` | GET | Retrieve complete structured threat report |
| `/api/analytics` | GET | Real-time corpus distributions and metrics |
| `/api/evidence` | GET | List and search knowledge base articles |
| `/api/evidence` | POST | Add new cybersecurity vector document |
| `/api/evaluation` | GET | Benchmark performance metrics (Accuracy, F1) |
| `/api/evaluation/run` | POST | Run evaluation against labeled dataset |
| `/api/gmail/connect` | GET | Generate Google OAuth 2.0 consent URL |
| `/api/gmail/callback` | GET | Exchange code for encrypted access tokens |
| `/api/gmail/emails` | GET | Retrieve authorized Gmail messages |
