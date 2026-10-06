export interface EmailRecord {
  id: string;
  userId: string;
  senderName: string;
  senderEmail: string;
  senderDomain?: string;
  recipientEmail: string;
  subject: string;
  body: string;
  receivedAt: string;
  source: string;
  hasUrls: boolean;
  hasAttachments: boolean;
  attachmentInfo: {
    filename: string;
    size?: string;
    mimeType?: string;
    isSuspicious?: boolean;
    notes?: string;
  }[];
  urls: string[];
  createdAt: string;
  isStarred: boolean;
  isRead: boolean;
  folder: 'inbox' | 'starred' | 'sent' | 'drafts' | 'trash';
  latestAnalysisId?: string;
  classification?: 'Safe' | 'Suspicious' | 'Phishing' | 'Spam' | 'Unanalyzed';
  riskScore?: number | null;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  promptInjectionSuspected?: boolean;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  emailId: string;
  classification: 'Safe' | 'Suspicious' | 'Phishing' | 'Spam';
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  explanation: string;
  recommendedAction: string;
  promptInjectionSuspected: boolean;
  promptInjectionDetails?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt: string;
}

export interface IndicatorRecord {
  id: string;
  userId: string;
  analysisId: string;
  type: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  evidence?: string;
  source: string;
  createdAt: string;
}

export interface ThreatIntelRecord {
  id: string;
  userId: string;
  analysisId: string;
  url: string;
  provider: string;
  status: 'completed' | 'not_configured' | 'unavailable' | 'failed';
  malicious: boolean;
  suspicious: boolean;
  reputation?: string;
  details?: Record<string, any>;
  checkedAt: string;
}

export interface EvidenceRecord {
  id: string;
  userId: string;
  analysisId: string;
  type: string;
  title: string;
  description: string;
  source: string;
  sourceUrl?: string;
  relevanceScore?: number;
  createdAt: string;
}

export interface ThreatReportPayload {
  analysis: AnalysisRecord;
  email: EmailRecord;
  indicators: IndicatorRecord[];
  threatIntel: ThreatIntelRecord[];
  evidence: EvidenceRecord[];
}

export interface AnalyticsSummary {
  summary: {
    totalEmails: number;
    analyzedEmails: number;
    threatsDetected: number;
    criticalAlertsCount: number;
    averageRiskScore: number;
    safeCount: number;
    suspiciousCount: number;
    phishingCount: number;
    spamCount: number;
  };
  threatDistribution: { name: string; value: number; color: string }[];
  riskScoreBuckets: { range: string; count: number; label: string }[];
}

function getStoredToken(): string {
  try {
    return localStorage.getItem('emailguard_token') || '';
  } catch {
    return '';
  }
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}

export async function fetchEmails(
  folder: string = 'inbox',
  q?: string,
  classification?: string
): Promise<{ total: number; items: EmailRecord[] }> {
  const params = new URLSearchParams();
  if (folder) params.append('folder', folder);
  if (q) params.append('q', q);
  if (classification && classification !== 'all') params.append('classification', classification);

  const res = await apiFetch(`/api/emails?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch emails`);
  return res.json();
}

export async function fetchEmail(id: string): Promise<EmailRecord> {
  const res = await apiFetch(`/api/emails/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch email`);
  return res.json();
}

export async function updateEmail(id: string, updates: Partial<EmailRecord>): Promise<EmailRecord> {
  const res = await apiFetch(`/api/emails/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to update email`);
  return res.json();
}

export async function deleteEmail(id: string): Promise<void> {
  const res = await apiFetch(`/api/emails/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete email`);
}

export async function analyzeEmail(emailId: string): Promise<ThreatReportPayload> {
  const res = await apiFetch(`/api/emails/${emailId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Analysis pipeline failed`);
  return res.json();
}

export async function directAnalyze(payload: {
  senderName?: string;
  senderEmail?: string;
  recipientEmail?: string;
  subject: string;
  body: string;
  urls?: string[];
  attachmentInfo?: any[];
}): Promise<ThreatReportPayload> {
  const res = await apiFetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Direct analysis failed`);
  return res.json();
}

export async function fetchReports(): Promise<any[]> {
  const res = await apiFetch('/api/reports');
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch reports`);
  return res.json();
}

export async function fetchReport(id: string): Promise<ThreatReportPayload> {
  const res = await apiFetch(`/api/reports/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch report`);
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const res = await apiFetch('/api/analytics');
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch analytics`);
  return res.json();
}

export async function fetchSettings(): Promise<any> {
  const res = await apiFetch('/api/settings');
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch settings`);
  return res.json();
}

export async function updateSettings(updates: any): Promise<any> {
  const res = await apiFetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to update settings`);
  return res.json();
}

export async function fetchHealth(): Promise<any> {
  const res = await apiFetch('/api/health');
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch health`);
  return res.json();
}

export interface EvaluationBenchmarkData {
  datasets: { id: string; name: string; description: string; totalSamples: number }[];
  latestRun: {
    datasetId: string;
    datasetName: string;
    executedAt: string;
    durationMs: number;
    totalEvaluated: number;
    metrics: {
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
    };
    confusionMatrix: {
      truePositives: number;
      falsePositives: number;
      trueNegatives: number;
      falseNegatives: number;
    };
    samples: {
      id: string;
      subject: string;
      senderEmail: string;
      groundTruth: string;
      predictedClass: string;
      riskScore: number;
      isCorrect: boolean;
      explanation: string;
      indicatorsCount: number;
    }[];
  } | null;
  schemaNotice: string;
}

export async function fetchEvaluation(): Promise<EvaluationBenchmarkData> {
  const res = await apiFetch('/api/evaluation');
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch evaluation`);
  return res.json();
}

export async function runEvaluation(datasetId?: string, customSamples?: any[]): Promise<any> {
  const res = await apiFetch('/api/evaluation/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetId, customSamples }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Benchmark run failed`);
  return res.json();
}
