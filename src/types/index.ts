export type ThreatClassification = 'Safe' | 'Suspicious' | 'Phishing' | 'Spam';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type IndicatorSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type PipelineStageStatus = 'Pending' | 'Running' | 'Completed' | 'Failed';

export interface ThreatIndicator {
  id: string;
  name: string;
  severity: IndicatorSeverity;
  description: string;
  detectedText?: string;
  category: 'url' | 'credentials' | 'urgency' | 'domain' | 'impersonation' | 'attachment' | 'social_engineering' | 'prompt_injection';
}

export interface EvidenceItem {
  id: string;
  source: 'Email Content' | 'Threat Intelligence' | 'RAG / Knowledge Base';
  finding: string;
  status: 'Safe' | 'Suspicious' | 'Malicious' | 'Informational';
  reference?: string;
  confidenceScore?: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  status: PipelineStageStatus;
  executionTimeMs?: number;
  outputSummary?: string;
}

export interface ThreatReport {
  id: string;
  emailId: string;
  classification: ThreatClassification;
  risk_score: number | null; // 0-100 or null if unavailable
  confidence: number | null; // 0-100
  generatedAt: string;
  explanation: string;
  recommended_action: string;
  prompt_injection_suspected: boolean;
  prompt_injection_details?: string;
  indicators: ThreatIndicator[];
  evidence: {
    emailEvidence: EvidenceItem[];
    threatIntelEvidence: EvidenceItem[];
    ragEvidence: EvidenceItem[];
  };
  pipelineStages: PipelineStage[];
}

export interface EmailAttachment {
  filename: string;
  size: string;
  mimeType: string;
  isSuspicious: boolean;
  notes?: string;
}

export interface EmailRecord {
  id: string;
  senderName: string;
  senderEmail: string;
  senderDomain: string;
  recipientEmail: string;
  subject: string;
  bodyPreview: string;
  fullBody: string;
  receivedDate: string;
  urls: string[];
  attachments: EmailAttachment[];
  classification: ThreatClassification;
  risk_score: number | null;
  status: 'Analyzed' | 'Pending' | 'In Progress';
  reportId?: string;
  prompt_injection_suspected?: boolean;
}

export interface EmailAnalysisSubmission {
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  urls?: string[];
  attachments?: {
    filename: string;
    size?: string;
    mimeType?: string;
  }[];
}

export interface DashboardSummary {
  totalAnalyzed: number;
  safeCount: number;
  suspiciousCount: number;
  phishingCount: number;
  spamCount: number;
  averageRiskScore: number;
  criticalAlertsCount: number;
}

export interface AnalyticsData {
  summary: DashboardSummary;
  threatDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  riskScoreBuckets: {
    range: string;
    count: number;
    label: string;
  }[];
  volumeOverTime: {
    date: string;
    safe: number;
    suspicious: number;
    phishing: number;
    spam: number;
    total: number;
  }[];
  topIndicators: {
    name: string;
    frequency: number;
    severity: IndicatorSeverity;
  }[];
}

export interface DatasetEvaluationPlaceholders {
  datasetName: string;
  totalSamples: number | null;
  classes: string[];
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
  confusionMatrix: {
    labels: string[];
    matrix: number[][];
  } | null;
  status: 'pending_evaluation' | 'completed' | 'not_started';
  lastEvaluatedAt: string | null;
  message: string;
}

export interface KnowledgeItem {
  id: string;
  category: 'Phishing' | 'Business Email Compromise' | 'Credential Harvesting' | 'Impersonation' | 'Social Engineering' | 'Malicious URLs';
  title: string;
  summary: string;
  indicators: string[];
  mitreAttackId?: string;
  vectorDbStatus: 'Indexed' | 'Ready for ChromaDB Sync';
  lastUpdated: string;
}

export interface BackendConfig {
  baseUrl: string;
  useMockService: boolean;
  isConnected: boolean;
  lastChecked: string | null;
  version?: string;
}
