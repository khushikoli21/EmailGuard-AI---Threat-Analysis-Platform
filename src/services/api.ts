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
  folder: 'inbox' | 'starred' | 'sent' | 'drafts' | 'trash' | 'analysis' | 'archived' | 'spam';
  latestAnalysisId?: string;
  classification?: 'Safe' | 'Suspicious' | 'Phishing' | 'Spam' | 'Unanalyzed';
  riskScore?: number | null;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  analysisConfidence?: number | null;
  analysisCompletedAt?: string;
  promptInjectionSuspected?: boolean;
  isDevelopmentSample?: boolean;
}

export interface PipelineLogRecord {
  id: string;
  userId: string;
  analysisId: string;
  component:
    | 'email_ingestion'
    | 'normalization'
    | 'prompt_injection'
    | 'email_analysis'
    | 'threat_intelligence'
    | 'rag'
    | 'risk_engine'
    | 'report_generation'
    | 'database_storage';
  status: 'completed' | 'failed' | 'skipped' | 'unavailable';
  startTime: string;
  endTime: string;
  durationMs: number;
  message?: string;
  error?: string;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  emailId: string;
  classification: 'Safe' | 'Suspicious' | 'Phishing' | 'Spam';
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number | null;
  explanation: string;
  recommendedAction: string;
  promptInjectionSuspected: boolean;
  promptInjectionDetails?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt: string;
  riskBreakdown?: Array<{factor:string;weight:number;applied:boolean;source:string}>;
  llmStatus?: 'completed'|'not_configured'|'unavailable';
  recommendedActions?: string[];
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
  textSpans?: Array<{start:number;end:number;findingId:string;category:string;title:string;reason:string;severity?:'Low'|'Medium'|'High'|'Critical';matchedText?:string;evidence?:string}>;
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
  pipelineLogs?: PipelineLogRecord[];
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

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('emailguard_token') : null;
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

export async function startGmailOAuth(): Promise<{ authUrl: string }> {
  const res = await apiFetch('/api/gmail/connect');
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.authUrl) {
    throw new Error(data.error || 'Could not start Gmail authorization.');
  }
  return data;
}

export async function connectGmailDirect(accessToken: string, email?: string): Promise<{ success: boolean; connected: boolean; emailAddress: string }> {
  const res = await apiFetch('/api/gmail/connect-direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not connect Gmail with Google token.');
  return data;
}

export async function fetchGmailStatus(): Promise<{ connected: boolean; emailAddress: string | null }> {
  const res = await apiFetch('/api/gmail/status');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not check Gmail connection.');
  return data;
}

export async function syncGmailInbox(maxResults = 25): Promise<{ total: number; items: EmailRecord[] }> {
  const res = await apiFetch(`/api/gmail/emails?maxResults=${encodeURIComponent(maxResults)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not sync Gmail messages.');
  return data;
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

export async function fetchKnowledgeBase(): Promise<{items: Array<{id:string;name:string;category:string;technique:string;description:string;url?:string}>}> {
  const res = await apiFetch('/api/knowledge-base');
  if (!res.ok) throw new Error('Failed to load security knowledge base');
  return res.json();
}

// --- Threat Triage & Chatbot Types & Methods ---

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  evidenceUsed?: string[];
}

export interface TriageActivity {
  id: string;
  action: string;
  timestamp: string;
  details?: string;
  actor?: string;
}

export interface TriageItem {
  id: string;
  userId: string;
  type: 'compose' | 'analyst';
  title: string;
  status: 'new' | 'in_review' | 'escalated' | 'quarantined' | 'resolved';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore: number | null;
  emailId?: string;
  analysisId?: string;
  draftData?: {
    recipientEmail: string;
    senderEmail?: string;
    senderName?: string;
    subject: string;
    body: string;
    urls: string[];
    attachmentInfo: any[];
  };
  messages: ChatMessage[];
  activities: TriageActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredReportItem {
  id: string;
  userId: string;
  title: string;
  type: 'email_investigation' | 'dataset_evaluation';
  targetId: string;
  generatedAt: string;
  summary: string;
  riskScore?: number | null;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  classification?: string;
  sender?: string;
  subject?: string;
  indicatorsCount?: number;
  data: any;
}

export async function fetchTriageItems(filters?: {
  type?: string;
  riskLevel?: string;
  status?: string;
  q?: string;
}): Promise<{ total: number; items: TriageItem[] }> {
  const params = new URLSearchParams();
  if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
  if (filters?.riskLevel && filters.riskLevel !== 'all') params.append('riskLevel', filters.riskLevel);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.q) params.append('q', filters.q);

  const res = await apiFetch(`/api/triage?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch triage items`);
  return res.json();
}

export async function fetchTriageItem(id: string): Promise<{
  item: TriageItem;
  email: EmailRecord | null;
  analysis: AnalysisRecord | null;
  indicators: IndicatorRecord[];
  threatIntel: ThreatIntelRecord[];
  evidence: EvidenceRecord[];
}> {
  const res = await apiFetch(`/api/triage/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch triage item details`);
  return res.json();
}

export async function createTriageItem(payload: {
  type: 'compose' | 'analyst';
  title?: string;
  emailId?: string;
  draftData?: TriageItem['draftData'];
  status?: TriageItem['status'];
}): Promise<TriageItem> {
  const res = await apiFetch('/api/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create triage item`);
  return res.json();
}

export async function updateTriageItem(id: string, updates: Partial<TriageItem>): Promise<TriageItem> {
  const res = await apiFetch(`/api/triage/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to update triage item`);
  return res.json();
}

export async function sendTriageDraft(id: string): Promise<{ success: boolean; message: string; sentEmail: EmailRecord }> {
  const res = await apiFetch(`/api/triage/${id}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to send triage draft`);
  return res.json();
}

export async function deleteTriageItem(id: string): Promise<void> {
  const res = await apiFetch(`/api/triage/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete triage session`);
}

export async function askChatbot(payload: {
  contextType: 'compose' | 'analyst';
  contextId?: string;
  question: string;
  emailId?: string;
  analysisId?: string;
  draftData?: any;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<{
  answer: string;
  evidenceUsed: string[];
  confidence: number;
  mode: 'gemini' | 'deterministic';
  timestamp: string;
}> {
  const res = await apiFetch('/api/chat/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Chatbot processing failed`);
  return res.json();
}

export async function fetchStoredReports(): Promise<{ items: StoredReportItem[] }> {
  const res = await apiFetch('/api/reports/stored');
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch stored reports`);
  return res.json();
}

export async function generateStoredReport(payload: {
  title?: string;
  type?: 'email_investigation' | 'dataset_evaluation';
  targetId?: string;
  summary?: string;
  riskScore?: number | null;
  riskLevel?: string;
  classification?: string;
  sender?: string;
  subject?: string;
  data: any;
}): Promise<StoredReportItem> {
  const res = await apiFetch('/api/reports/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to generate stored report`);
  return res.json();
}

export async function deleteStoredReport(id: string): Promise<void> {
  const res = await apiFetch(`/api/reports/stored/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete stored report`);
}
