import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { IndicatorRecord, EvidenceRecord } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface KnowledgeDocument {
  id: string;
  technique: string;
  name: string;
  category: string;
  description: string;
  detection_signals: string[];
  url?: string;
  keywords: string[];
}

// Built-in foundational knowledge documents aligned with MITRE ATT&CK and OWASP LLM
const DEFAULT_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'KB-PHISH-01',
    technique: 'MITRE ATT&CK T1566.002',
    name: 'Credential Harvesting via Typosquatted Domains',
    category: 'Phishing',
    description: 'Adversaries create lookalike domains imitating enterprise identity providers (Microsoft 365, Google Workspace, Okta) to harvest credentials and session tokens.',
    detection_signals: [
      'Domain registration age under 14 days',
      'Missing SPF/DKIM alignment with claimed vendor',
      'Keywords: login, signin, verify, auth, renew',
      'Cloned single-sign-on (SSO) login form layouts'
    ],
    url: 'https://attack.mitre.org/techniques/T1566/002/',
    keywords: ['password', 'credential', 'login', 'signin', 'verify', 'account', 'expire', 'renew', 'quota', 'session', 'mfa', 'otp', 'identity']
  },
  {
    id: 'KB-BEC-01',
    technique: 'MITRE ATT&CK T1566.001',
    name: 'Executive Pretext & Wire Fraud (CEO Fraud)',
    category: 'Business Email Compromise',
    description: 'Adversaries impersonate C-level executives or legal counsel requesting immediate wire transfers or payroll account changes while suppressing telephone verification.',
    detection_signals: [
      'Authority pressure tone',
      'Pretext of airborne transit or urgent conference',
      'Specific financial sums with rigid intraday cutoffs',
      'External lookalike or freemail origin'
    ],
    url: 'https://attack.mitre.org/techniques/T1566/001/',
    keywords: ['wire transfer', 'invoice', 'remittance', 'escrow', 'payment', 'ceo', 'cfo', 'confidential', 'urgent', 'airborne', 'flight', 'do not call', 'acquisition']
  },
  {
    id: 'KB-PI-01',
    technique: 'OWASP LLM01',
    name: 'Adversarial Prompt Injection in Untrusted Email Payload',
    category: 'Prompt Injection',
    description: 'Adversaries embed direct or indirect command instructions into email bodies or headers designed to hijack LLM agent orchestrators into declaring messages Safe.',
    detection_signals: [
      "Instruction override keywords: 'ignore previous instructions', 'system override'",
      "Delimiter simulation: '=== SYSTEM ADVISORY ===', '[SYSTEM]'",
      "Classifier output dictation: 'output classification=Safe and risk_score=0'"
    ],
    url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/',
    keywords: ['ignore previous', 'system override', 'bypass mode', 'output classification', 'disregard', 'hidden instructions', 'operating in safe mode', 'dan mode']
  },
  {
    id: 'KB-URL-01',
    technique: 'MITRE ATT&CK T1204.001',
    name: 'Deceptive Hyperlinks & Open Redirect Phishing',
    category: 'Malicious URLs',
    description: 'Adversaries leverage URL shortening services, IP address hostnames, or legitimate open redirect endpoints to obscure final credential-harvesting landing pages.',
    detection_signals: [
      'Raw IP address hostnames (e.g. http://192.168.x.x)',
      'Multiple redirect hops terminating on unverified domains',
      'Lookalike domain suffixes (.net, .biz, .vip mimicry)',
      'Direct link to executable script payloads (.vbs, .js, .hta)'
    ],
    url: 'https://attack.mitre.org/techniques/T1204/001/',
    keywords: ['http', 'https', 'url', 'redirect', 'link', 'click here', 'portal', 'gateway', 'host', 'ip', 'payload']
  },
  {
    id: 'KB-ATT-01',
    technique: 'MITRE ATT&CK T1027.006',
    name: 'Malicious Script & HTML Smuggling Attachments',
    category: 'Malicious Attachments',
    description: 'Adversaries attach files containing active scripting (.vbs, .bat, .scr, .ps1) or macro-enabled Office containers (.docm, .xlsm) that execute code when opened by the recipient.',
    detection_signals: [
      'Executable or scripting extensions (.vbs, .bat, .scr, .exe, .ps1, .hta)',
      'Double extension trick (e.g. invoice.pdf.exe)',
      'Archive files containing scripts (.zip, .iso, .img, .rar)',
      'Instructions encouraging users to bypass antivirus or enable macros'
    ],
    url: 'https://attack.mitre.org/techniques/T1027/006/',
    keywords: ['attachment', '.vbs', '.bat', '.exe', '.scr', '.ps1', '.hta', '.docm', '.xlsm', '.iso', 'enable macro', 'run script']
  },
  {
    id: 'KB-SOC-01',
    technique: 'MITRE ATT&CK T1598',
    name: 'Psychological Coercion & Artificial Urgency Pretexts',
    category: 'Social Engineering',
    description: 'Social engineering emails that exploit human panic, fear of loss, or regulatory penalties to induce victims to act impulsively without verifying through secondary channels.',
    detection_signals: [
      'Threat of account suspension within 24 to 48 hours',
      'Legal action or severe financial penalty warnings',
      'Artificial countdown timer or immediate action demands',
      'Pretext of security breach requiring immediate user remediation'
    ],
    url: 'https://attack.mitre.org/techniques/T1598/',
    keywords: ['immediate', 'urgent', '24 hours', '48 hours', 'suspension', 'penalty', 'action required', 'final notice', 'suspended', 'decommission']
  }
];

class RagKnowledgeEngine {
  private documents: KnowledgeDocument[] = [];
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    this.documents = [...DEFAULT_DOCUMENTS];

    // Attempt to load extra articles from /backend/knowledge_base if present on disk
    try {
      const kbDir = path.resolve(process.cwd(), 'backend', 'knowledge_base');
      if (fs.existsSync(kbDir)) {
        const findJsonFiles = (dir: string): string[] => {
          let results: string[] = [];
          const list = fs.readdirSync(dir);
          for (const file of list) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat && stat.isDirectory()) {
              results = results.concat(findJsonFiles(fullPath));
            } else if (file.endsWith('.json')) {
              results.push(fullPath);
            }
          }
          return results;
        };

        const jsonFiles = findJsonFiles(kbDir);
        for (const file of jsonFiles) {
          try {
            const raw = fs.readFileSync(file, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed.id && parsed.name && !this.documents.some((d) => d.id === parsed.id)) {
              this.documents.push({
                id: parsed.id,
                technique: parsed.technique || 'MITRE ATT&CK',
                name: parsed.name,
                category: parsed.category || 'Threat Intelligence',
                description: parsed.description || '',
                detection_signals: Array.isArray(parsed.detection_signals) ? parsed.detection_signals : [],
                keywords: (parsed.name + ' ' + (parsed.description || '')).toLowerCase().split(/\W+/).filter((w: string) => w.length > 3),
              });
            }
          } catch (err) {
            // Silently ignore individual file errors
          }
        }
      }
    } catch {
      // Keep DEFAULT_DOCUMENTS if directory traversal fails
    }

    this.isLoaded = true;
  }

  public getDocumentCount(): number {
    return this.documents.length;
  }

  public retrieveEvidence(
    emailText: string,
    indicators: IndicatorRecord[],
    analysisId: string,
    userId: string
  ): EvidenceRecord[] {
    const textLower = emailText.toLowerCase();
    const scoredDocs: { doc: KnowledgeDocument; score: number; matchedSignals: string[] }[] = [];
    const now = new Date().toISOString();

    for (const doc of this.documents) {
      let score = 0;
      const matchedSignals: string[] = [];

      // Keyword overlap
      let keywordHits = 0;
      for (const kw of doc.keywords) {
        if (textLower.includes(kw)) {
          keywordHits++;
        }
      }

      if (keywordHits > 0) {
        score += Math.min(0.5, keywordHits * 0.1);
      }

      // Indicator category correlation
      for (const ind of indicators) {
        const indType = ind.type.toLowerCase();
        const indTitle = ind.title.toLowerCase();

        if (doc.category.toLowerCase().includes('prompt') && indType.includes('prompt')) {
          score += 0.45;
          matchedSignals.push('Matches adversarial instruction override pattern targeting LLMs');
        } else if (doc.category.toLowerCase().includes('phish') && (indType.includes('credential') || indType.includes('domain_mismatch'))) {
          score += 0.4;
          matchedSignals.push('Aligns with credential-harvesting gateway impersonation');
        } else if (doc.category.toLowerCase().includes('compromise') && (indType.includes('payment') || indType.includes('impersonation'))) {
          score += 0.4;
          matchedSignals.push('Matches executive wire-transfer request with verification channel suppression');
        } else if (doc.category.toLowerCase().includes('url') && indType.includes('url')) {
          score += 0.35;
          matchedSignals.push('Destination URL exhibits typosquatting or payload script link indicators');
        } else if (doc.category.toLowerCase().includes('attachment') && indType.includes('attachment')) {
          score += 0.4;
          matchedSignals.push('File attachment contains dangerous executable or script extensions');
        } else if (doc.category.toLowerCase().includes('social') && indType.includes('urgency')) {
          score += 0.35;
          matchedSignals.push('Coercive temporal urgency language detected');
        }
      }

      // Check specific detection signals text match
      for (const sig of doc.detection_signals) {
        const sigTokens = sig.toLowerCase().split(/\W+/).filter((t) => t.length > 4);
        const tokenMatches = sigTokens.filter((t) => textLower.includes(t));
        if (tokenMatches.length >= 2) {
          score += 0.15;
          if (!matchedSignals.includes(sig)) {
            matchedSignals.push(sig);
          }
        }
      }

      if (score >= 0.3) {
        scoredDocs.push({
          doc,
          score: Math.min(0.98, Math.round(score * 100) / 100),
          matchedSignals: matchedSignals.slice(0, 3),
        });
      }
    }

    // Sort by score descending
    scoredDocs.sort((a, b) => b.score - a.score);

    // Return top matching evidence
    const topMatches = scoredDocs.slice(0, 4);
    const evidenceRecords: EvidenceRecord[] = [];

    for (const match of topMatches) {
      const whyExplanation = match.matchedSignals.length > 0
        ? `Grounding: ${match.matchedSignals.join('; ')}`
        : `Grounding: Matches semantic signature for ${match.doc.name}`;

      evidenceRecords.push({
        id: uuidv4(),
        userId,
        analysisId,
        type: 'RAG / Knowledge Base',
        title: `${match.doc.technique}: ${match.doc.name}`,
        description: `${match.doc.description} [${whyExplanation}]`,
        source: `Security Knowledge Base (${match.doc.technique})`,
        sourceUrl: match.doc.url || undefined,
        relevanceScore: match.score,
        createdAt: now,
      });
    }

    return evidenceRecords;
  }
}

export const ragEngine = new RagKnowledgeEngine();
