/**
 * API SERVICE ARCHITECTURE FOR EMAILGUARD AI
 * 
 * -----------------------------------------------------------------------------------
 * FASTAPI INTEGRATION GUIDE:
 * -----------------------------------------------------------------------------------
 * This module is the single source of truth for all communication between the
 * React frontend and backend security services.
 * 
 * Currently, this file operates in MOCK SERVICE MODE for UI development and
 * frontend testing. When your FastAPI backend is developed, you can toggle
 * `useMockService = false` (or set `VITE_USE_MOCK_API=false` in .env) and
 * the functions will automatically make real HTTP calls to the endpoints below.
 * 
 * Expected FastAPI Endpoints:
 * - POST   /api/analyze          -> Submits email for multi-agent threat pipeline
 * - GET    /api/emails           -> Retrieves list of analyzed / ingested emails
 * - GET    /api/emails/{id}      -> Retrieves specific email payload
 * - GET    /api/report/{id}      -> Retrieves structured threat report
 * - GET    /api/analytics        -> Aggregated threat telemetry & distributions
 * - GET    /api/evaluation       -> Dataset validation & confusion matrix metrics
 * - GET    /api/evidence         -> Vector knowledge base & RAG document records
 * - POST   /api/gmail/connect    -> OAuth flow kick-off (redirect URL or session)
 * - GET    /api/health           -> Backend health check
 * -----------------------------------------------------------------------------------
 */

import {
  EmailRecord,
  ThreatReport,
  EmailAnalysisSubmission,
  AnalyticsData,
  DatasetEvaluationPlaceholders,
  KnowledgeItem,
  BackendConfig,
} from '../types';
import {
  MOCK_EMAILS,
  MOCK_REPORTS,
  MOCK_ANALYTICS,
  MOCK_EVALUATION_PLACEHOLDER,
  MOCK_KNOWLEDGE_BASE,
} from '../data/mockData';

// In-memory store for newly submitted emails during the frontend session
let localEmailsStore: EmailRecord[] = [...MOCK_EMAILS];
let localReportsStore: Record<string, ThreatReport> = { ...MOCK_REPORTS };

// Configuration state (can be inspected or updated via Settings UI)
const DEFAULT_API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';
let currentConfig: BackendConfig = {
  baseUrl: DEFAULT_API_BASE,
  useMockService: true, // Default to mock mode until backend is running
  isConnected: false,
  lastChecked: null,
};

export function getBackendConfig(): BackendConfig {
  return { ...currentConfig };
}

export function updateBackendConfig(config: Partial<BackendConfig>): BackendConfig {
  currentConfig = { ...currentConfig, ...config };
  return { ...currentConfig };
}

/**
 * Health check to verify if the real FastAPI backend is accessible
 * FASTAPI ENDPOINT: GET /api/health
 */
export async function checkBackendHealth(): Promise<{ isOnline: boolean; message: string; version?: string }> {
  if (currentConfig.useMockService) {
    return {
      isOnline: false,
      message: 'Running in Frontend Mock Mode (FastAPI backend is disconnected)',
    };
  }

  try {
    const response = await fetch(`${currentConfig.baseUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json();
      currentConfig.isConnected = true;
      currentConfig.lastChecked = new Date().toLocaleTimeString();
      return {
        isOnline: true,
        message: 'FastAPI Backend Connected',
        version: data.version || '1.0.0',
      };
    } else {
      currentConfig.isConnected = false;
      return {
        isOnline: false,
        message: `Backend returned status ${response.status}`,
      };
    }
  } catch (err: any) {
    currentConfig.isConnected = false;
    return {
      isOnline: false,
      message: `Failed to reach backend at ${currentConfig.baseUrl}: ${err.message || 'Network error'}`,
    };
  }
}

/**
 * Fetch all emails with optional category filter
 * FASTAPI ENDPOINT: GET /api/emails?filter={classification}
 */
export async function fetchEmails(filter?: string): Promise<EmailRecord[]> {
  if (!currentConfig.useMockService) {
    try {
      const url = new URL(`${currentConfig.baseUrl}/api/emails`);
      if (filter && filter !== 'All') {
        url.searchParams.append('classification', filter);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (error) {
      console.warn('Real API call failed, falling back to mock emails:', error);
    }
  }

  // Mock service response with brief artificial delay
  await new Promise((r) => setTimeout(r, 120));
  if (!filter || filter === 'All') {
    return [...localEmailsStore];
  }
  return localEmailsStore.filter(
    (e) => e.classification.toLowerCase() === filter.toLowerCase()
  );
}

/**
 * Fetch a single email by ID
 * FASTAPI ENDPOINT: GET /api/emails/{id}
 */
export async function fetchEmail(id: string): Promise<EmailRecord | null> {
  if (!currentConfig.useMockService) {
    try {
      const res = await fetch(`${currentConfig.baseUrl}/api/emails/${id}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (error) {
      console.warn(`Real API call failed for email ${id}, falling back:`, error);
    }
  }

  await new Promise((r) => setTimeout(r, 80));
  const email = localEmailsStore.find((e) => e.id === id);
  return email || null;
}

/**
 * Fetch detailed Threat Report by report ID or email ID
 * FASTAPI ENDPOINT: GET /api/report/{id}
 */
export async function fetchThreatReport(reportIdOrEmailId: string): Promise<ThreatReport | null> {
  if (!currentConfig.useMockService) {
    try {
      const res = await fetch(`${currentConfig.baseUrl}/api/report/${reportIdOrEmailId}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (error) {
      console.warn(`Real API call failed for report ${reportIdOrEmailId}, falling back:`, error);
    }
  }

  await new Promise((r) => setTimeout(r, 150));
  // Check directly by report ID
  if (localReportsStore[reportIdOrEmailId]) {
    return localReportsStore[reportIdOrEmailId];
  }
  // Check if caller passed email ID
  const found = Object.values(localReportsStore).find(
    (r) => r.emailId === reportIdOrEmailId || r.id === reportIdOrEmailId
  );
  return found || null;
}

/**
 * Submit an email for multi-agent security analysis
 * FASTAPI ENDPOINT: POST /api/analyze
 * Request Body: EmailAnalysisSubmission
 * Response: { email: EmailRecord, report: ThreatReport }
 */
export async function analyzeEmail(
  submission: EmailAnalysisSubmission,
  onStageUpdate?: (stageName: string, progress: number) => void
): Promise<{ email: EmailRecord; report: ThreatReport }> {
  // If connected to live FastAPI backend:
  if (!currentConfig.useMockService) {
    try {
      const res = await fetch(`${currentConfig.baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });
      if (!res.ok) throw new Error(`Analysis failed with status ${res.status}`);
      const data = await res.json();
      return data;
    } catch (error) {
      console.warn('Real analyze API failed, falling back to mock pipeline simulator:', error);
    }
  }

  // Mock Multi-Agent Pipeline Simulator
  // Emulates the 4-agent workflow steps with UI callbacks
  const steps = [
    { name: 'Email Analysis Agent', label: 'Extracting headers, URLs, and linguistic cues...', time: 400 },
    { name: 'Threat Intelligence Agent', label: 'Querying domain age, DNS telemetry, and threat feeds...', time: 500 },
    { name: 'RAG / Evidence Agent', label: 'Searching ChromaDB vector knowledge base for attack signatures...', time: 450 },
    { name: 'Report Agent', label: 'Synthesizing evidence-grounded threat report...', time: 350 },
  ];

  for (let i = 0; i < steps.length; i++) {
    onStageUpdate?.(steps[i].label, Math.round(((i + 1) / steps.length) * 100));
    await new Promise((r) => setTimeout(r, steps[i].time));
  }

  // Create a structured demonstration result based on simple heuristic simulation
  // (NOTE: In production this will be determined entirely by the backend AI agents)
  const isPromptInjection = /ignore.*(instruction|system|previous|classifier)|operating in bypass|system override/i.test(
    submission.body
  );
  const isCredentialRequest = /password|credential|login|verify.*account|session.*renew/i.test(
    submission.body
  );
  const isUrgent = /urgent|immediate|24 hours|suspension|expedited/i.test(
    submission.body
  );

  let classification: ThreatReport['classification'] = 'Safe';
  let riskScore: number = 15;

  if (isPromptInjection) {
    classification = 'Phishing';
    riskScore = 95;
  } else if (isCredentialRequest && isUrgent) {
    classification = 'Phishing';
    riskScore = 88;
  } else if (isCredentialRequest || isUrgent || (submission.urls && submission.urls.length > 0)) {
    classification = 'Suspicious';
    riskScore = 58;
  }

  const newEmailId = `em-user-${Date.now()}`;
  const newReportId = `rep-user-${Date.now()}`;

  const domain = submission.senderEmail.split('@')[1] || 'unknown-domain.com';

  const newEmail: EmailRecord = {
    id: newEmailId,
    senderName: submission.senderName || 'Anonymous Sender',
    senderEmail: submission.senderEmail,
    senderDomain: domain,
    recipientEmail: 'security-analyst@enterprise.internal',
    subject: submission.subject,
    bodyPreview: submission.body.slice(0, 150) + '...',
    fullBody: submission.body,
    receivedDate: 'Just now (Manual Submission)',
    urls: submission.urls || [],
    attachments: (submission.attachments || []).map((att) => ({
      filename: att.filename,
      size: att.size || '45 KB',
      mimeType: att.mimeType || 'application/octet-stream',
      isSuspicious: att.filename.endsWith('.vbs') || att.filename.endsWith('.htm') || att.filename.endsWith('.exe'),
    })),
    classification,
    risk_score: riskScore,
    status: 'Analyzed',
    reportId: newReportId,
    prompt_injection_suspected: isPromptInjection,
  };

  const newReport: ThreatReport = {
    id: newReportId,
    emailId: newEmailId,
    classification,
    risk_score: riskScore,
    confidence: 91,
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    explanation: isPromptInjection
      ? 'CRITICAL ADVERSARIAL ALERT: This submission contains instruction override patterns matching prompt injection techniques. The system handled this input as untrusted data.'
      : classification === 'Phishing'
      ? 'This email contains high-confidence phishing indicators including coercive urgency cues and requests for user authentication or financial action.'
      : classification === 'Suspicious'
      ? 'This submission contains moderate risk indicators requiring secondary validation prior to end-user delivery.'
      : 'No high-risk indicators detected. Sender characteristics and payload appear benign.',
    recommended_action: isPromptInjection
      ? 'Quarantine message immediately. Disregard any embedded directives.'
      : classification === 'Phishing'
      ? 'Do not click links or furnish credentials. Quarantine message.'
      : classification === 'Suspicious'
      ? 'Verify sender through secondary authenticated internal channels.'
      : 'Safe to proceed with regular delivery.',
    prompt_injection_suspected: isPromptInjection,
    prompt_injection_details: isPromptInjection
      ? 'Simulated detector flagged heuristic token sequence indicating attempts to command the AI system.'
      : undefined,
    indicators: [
      ...(isPromptInjection
        ? [
            {
              id: 'ind-dyn-pi',
              name: 'Adversarial Prompt Injection Attempt',
              severity: 'Critical' as const,
              category: 'prompt_injection' as const,
              description: 'Text pattern attempts to override LLM system prompt instructions.',
            },
          ]
        : []),
      ...(isCredentialRequest
        ? [
            {
              id: 'ind-dyn-cred',
              name: 'Credential Solicitation Keyword Pattern',
              severity: 'High' as const,
              category: 'credentials' as const,
              description: 'Body requests user authentication, session renew, or password verification.',
            },
          ]
        : []),
      ...(isUrgent
        ? [
            {
              id: 'ind-dyn-urg',
              name: 'Artificial Urgency Language',
              severity: 'Medium' as const,
              category: 'urgency' as const,
              description: 'Coercive temporal phrasing identified to induce rushed action.',
            },
          ]
        : []),
    ],
    evidence: {
      emailEvidence: [
        {
          id: 'ev-dyn-1',
          source: 'Email Content',
          finding: isPromptInjection
            ? 'Adversarial instruction markers detected in message body.'
            : isCredentialRequest
            ? 'Credential solicitation language identified.'
            : 'Standard textual syntax with no high-risk urgency terms.',
          status: isPromptInjection ? 'Malicious' : isCredentialRequest ? 'Suspicious' : 'Safe',
        },
      ],
      threatIntelEvidence: [
        {
          id: 'ev-dyn-2',
          source: 'Threat Intelligence',
          finding: `Domain "${domain}" evaluated against reputation feed (Mock check).`,
          status: classification === 'Phishing' ? 'Suspicious' : 'Safe',
          reference: 'Dynamic Telemetry Check',
        },
      ],
      ragEvidence: [
        {
          id: 'ev-dyn-3',
          source: 'RAG / Knowledge Base',
          finding: isPromptInjection
            ? 'Matches OWASP LLM01: Prompt Injection taxonomy in local vector knowledge.'
            : 'Vector similarity queried across known phishing templates.',
          status: isPromptInjection ? 'Malicious' : classification === 'Phishing' ? 'Suspicious' : 'Safe',
          reference: 'ChromaDB Local Vector Index (Demo)',
        },
      ],
    },
    pipelineStages: [
      {
        id: 'stg-dyn-1',
        name: 'Email Analysis Agent',
        description: 'Completed parsing, indicator extraction, and sentiment urgency analysis.',
        status: 'Completed',
        executionTimeMs: 410,
      },
      {
        id: 'stg-dyn-2',
        name: 'Threat Intelligence Agent',
        description: 'Queried domain attributes and link safety registers.',
        status: 'Completed',
        executionTimeMs: 520,
      },
      {
        id: 'stg-dyn-3',
        name: 'RAG / Evidence Agent',
        description: 'Retrieved matching threat vector embeddings and MITRE references.',
        status: 'Completed',
        executionTimeMs: 440,
      },
      {
        id: 'stg-4-dyn',
        name: 'Report Agent',
        description: 'Generated evidence-backed threat dossier.',
        status: 'Completed',
        executionTimeMs: 310,
      },
    ],
  };

  // Prepend to local mock state so it shows up in Inbox & Dashboard
  localEmailsStore = [newEmail, ...localEmailsStore];
  localReportsStore[newReportId] = newReport;

  return { email: newEmail, report: newReport };
}

/**
 * Fetch Aggregated Threat Analytics
 * FASTAPI ENDPOINT: GET /api/analytics
 */
export async function fetchAnalytics(): Promise<AnalyticsData> {
  if (!currentConfig.useMockService) {
    try {
      const res = await fetch(`${currentConfig.baseUrl}/api/analytics`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (error) {
      console.warn('Real analytics API failed, falling back to mock analytics:', error);
    }
  }

  await new Promise((r) => setTimeout(r, 140));

  // Dynamically reflect any added emails into the summary counts
  const total = localEmailsStore.length;
  const safeCount = localEmailsStore.filter((e) => e.classification === 'Safe').length;
  const suspiciousCount = localEmailsStore.filter((e) => e.classification === 'Suspicious').length;
  const phishingCount = localEmailsStore.filter((e) => e.classification === 'Phishing').length;
  const spamCount = localEmailsStore.filter((e) => e.classification === 'Spam').length;

  const validScores = localEmailsStore
    .map((e) => e.risk_score)
    .filter((s): s is number => typeof s === 'number');
  const avgScore = validScores.length
    ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
    : 0;

  return {
    ...MOCK_ANALYTICS,
    summary: {
      totalAnalyzed: total,
      safeCount,
      suspiciousCount,
      phishingCount,
      spamCount,
      averageRiskScore: avgScore,
      criticalAlertsCount: localEmailsStore.filter((e) => (e.risk_score ?? 0) >= 80).length,
    },
    threatDistribution: [
      { name: 'Safe', value: safeCount, color: '#10B981' },
      { name: 'Suspicious', value: suspiciousCount, color: '#F59E0B' },
      { name: 'Phishing', value: phishingCount, color: '#EF4444' },
      { name: 'Spam', value: spamCount, color: '#8B5CF6' },
    ],
  };
}

/**
 * Fetch Dataset Evaluation Placeholders / Results
 * FASTAPI ENDPOINT: GET /api/evaluation
 */
export async function fetchEvaluation(): Promise<DatasetEvaluationPlaceholders> {
  if (!currentConfig.useMockService) {
    try {
      const res = await fetch(`${currentConfig.baseUrl}/api/evaluation`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (error) {
      console.warn('Real evaluation API failed, falling back to evaluation placeholder:', error);
    }
  }

  await new Promise((r) => setTimeout(r, 100));
  return { ...MOCK_EVALUATION_PLACEHOLDER };
}

/**
 * Fetch Knowledge Base / ChromaDB RAG documents
 * FASTAPI ENDPOINT: GET /api/evidence?query={query}&category={category}
 */
export async function fetchEvidence(query?: string, category?: string): Promise<KnowledgeItem[]> {
  if (!currentConfig.useMockService) {
    try {
      const url = new URL(`${currentConfig.baseUrl}/api/evidence`);
      if (query) url.searchParams.append('query', query);
      if (category && category !== 'All') url.searchParams.append('category', category);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (error) {
      console.warn('Real evidence API failed, falling back to mock knowledge base:', error);
    }
  }

  await new Promise((r) => setTimeout(r, 120));
  let items = [...MOCK_KNOWLEDGE_BASE];
  if (category && category !== 'All') {
    items = items.filter((k) => k.category === category);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase();
    items = items.filter(
      (k) =>
        k.title.toLowerCase().includes(q) ||
        k.summary.toLowerCase().includes(q) ||
        k.category.toLowerCase().includes(q) ||
        k.indicators.some((ind) => ind.toLowerCase().includes(q))
    );
  }
  return items;
}

/**
 * Connect Gmail Placeholder flow
 * FASTAPI ENDPOINT: POST /api/gmail/connect
 * In real production, this initiates OAuth consent URL redirect or token exchange.
 */
export async function connectGmail(): Promise<{ success: boolean; message: string; requiresBackend: boolean }> {
  // Always returns clear explanation that OAuth backend integration is required
  await new Promise((r) => setTimeout(r, 300));
  return {
    success: false,
    requiresBackend: true,
    message: 'Gmail OAuth2 integration requires the FastAPI backend with valid Google Cloud OAuth Client credentials (CLIENT_ID and redirect URI). Passwords are never collected.',
  };
}
