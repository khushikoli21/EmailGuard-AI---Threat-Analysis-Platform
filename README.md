# EmailGuard AI — Intelligent Email Threat Detection & Security Platform

**Academic Project Title:** AI-Powered Intelligent Email Threat Detection & Security Analysis Platform  
**Architecture:** Multi-Agent Cybersecurity Pipeline · Deterministic Risk Engine · Grounded RAG · SOC Telemetry Dashboard  

---

## 1. Project Overview

EmailGuard AI is an end-to-end cybersecurity email threat analysis platform built to inspect inbound emails for:
* **Phishing & Credential Harvesting**
* **Business Email Compromise (BEC) & CEO Fraud**
* **Adversarial Prompt Injection (OWASP LLM01)**
* **Malicious URLs & Lookalike Domains**
* **Dangerous File Attachments (.vbs, .exe, .scr, double extensions)**
* **Coercive Urgency & Social Engineering Pretexts**

The system provides explainable AI rationales grounded in the **MITRE ATT&CK** matrix and **OWASP Top 10 for LLMs**, backed by a deterministic risk scoring index (0–100) with zero fabricated metrics.

---

## 2. System Architecture

```
                  USER / INBOUND EMAIL
                           │
                           ▼
                 GOOGLE AUTHENTICATION
                           │
                           ▼
                  EMAIL INGESTION
             (Manual, EML, Dataset Harness)
                           │
                           ▼
                  EMAIL NORMALIZATION
           (URL extraction, attachment metadata)
                           │
                           ▼
             PROMPT INJECTION DETECTOR (OWASP LLM01)
                           │
                           ▼
                 AI ORCHESTRATOR
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   EMAIL ANALYSIS    THREAT INTEL      RAG KNOWLEDGE
     (NLP Agent)     (VirusTotal /       RETRIEVAL
                      urlscan.io)      (MITRE ATT&CK)
         └─────────────────┼─────────────────┘
                           ▼
               DETERMINISTIC RISK ENGINE
          (Weighted mathematical scoring: 0-100)
                           │
                           ▼
                  REPORT GENERATOR
          (Structured JSON Dossier + XAI Rationale)
                           │
                           ▼
                 PERSISTENT DATABASE
          (Isolated user collections & audit logs)
                           │
                           ▼
               GMAIL-STYLE SOC DASHBOARD
```

---

## 3. Technology Stack

* **Frontend:** React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons, DOMPurify
* **Backend:** Express, Node.js (`tsx server.ts`), Google GenAI SDK (`gemini-3.8-flash`)
* **Database:** Production document store with strict per-user authorization & JSON schema
* **Threat Intelligence:** VirusTotal API v3, urlscan.io API v1
* **Knowledge Base (RAG):** Grounded MITRE ATT&CK & OWASP LLM01 vector/lexical retrieval engine
* **Evaluation:** Empirical benchmark harness calculating real Accuracy, Precision, Recall, F1, and Confusion Matrix

---

## 4. Local Development Setup (Windows & Linux)

### Prerequisites
* Node.js 20+ installed
* npm or bun

### Windows (PowerShell / Command Prompt)

```powershell
# 1. Clone or navigate to the repository
cd C:\path\to\emailguard-ai

# 2. Install all dependencies
npm install

# 3. Create environment configuration
copy .env.example .env

# 4. Run the development server (runs full-stack on port 3000)
npm run dev
```

### Linux / macOS (Bash)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start server
npm run dev
```

Visit: `http://localhost:3000`

---

## 5. Environment & Secrets Configuration

All external service credentials are read server-side and never exposed to the browser client:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Recommended | Google Gemini API key (defaults to deterministic rationale fallback if absent) |
| `VIRUSTOTAL_API_KEY` | Optional | VirusTotal API v3 key for real-time URL scanning |
| `URLSCAN_API_KEY` | Optional | urlscan.io API key for public domain verdicts |
| `APP_URL` | Auto-injected | Deployment host URL |
| `PORT` | Optional | Server port (default: 3000) |

To configure in AI Studio: Open the **Secrets** panel in the UI and enter your keys.

---

## 6. Real Dataset Evaluation Harness

In strict accordance with academic integrity standards:
* **Zero Fabricated Results:** Accuracy, Precision, Recall, F1-Score, and Confusion Matrix are **never hardcoded**.
* Benchmark runs execute over real test corpora (Nazario Phishing Corpus + Enron Split) or user-uploaded CSV datasets (`subject,senderEmail,body,groundTruth`).

### Running the Evaluation Benchmark
1. In the sidebar, select **Dataset Evaluation**.
2. Review the target corpus or upload your own CSV file.
3. Click **Execute Benchmark Run**.
4. The system executes the full pipeline over each email sample and computes:
   $$\text{Accuracy} = \frac{\text{TP} + \text{TN}}{\text{Total}}$$
   $$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}}$$
   $$\text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}}$$
   $$\text{F1} = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$

---

## 7. Running Automated Tests

Run the automated system test suite:

```powershell
# Windows
npx tsx tests/system.test.ts

# Linux / Mac
npm test
```

### Verified Test Cases:
* [x] **User Isolation:** User B cannot read User A's private emails or reports.
* [x] **Prompt Injection Defense:** Blocks adversarial instruction overrides (OWASP LLM01).
* [x] **Credential Solicitation:** Detects lookalike domains and credential reset pretexts.
* [x] **Attachment Security:** Flags dangerous script extensions (`.vbs`, `.exe`, `.scr`).
* [x] **Safe Baseline:** Benign academic emails receive low risk scores (<30) with 0 false alarms.
* [x] **RAG Retrieval:** Successfully retrieves relevant MITRE ATT&CK grounded evidence.
* [x] **URL Normalization:** Strips ports, fragments, and queries for defanged threat intelligence lookups.

---

## 8. Troubleshooting

* **Cookie blocked in iframe:** The platform automatically uses `Authorization: Bearer <token>` in `localStorage` alongside cookies for zero-downtime operation in cross-origin iframes.
* **LLM quota spike / 503 error:** The system includes a deterministic heuristic engine that generates verified threat rationales if the upstream LLM encounters temporary rate limiting.
* **XSS / HTML in emails:** All email bodies pass through `DOMPurify` before rendering to neutralize malicious scripts, iframes, and active tags.
