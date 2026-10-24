import { v4 as uuidv4 } from 'uuid';
import { db, EmailRecord, AnalysisRecord, IndicatorRecord, ThreatIntelRecord, EvidenceRecord, PipelineLogRecord } from './db.js';
import { ragEngine } from './ragService.js';
import { threatIntelService } from './threatIntelService.js';
import { calculateRiskScore } from './riskEngine.js';

const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|directions|rules|prompts|protocols)/i,
  /disregard\s+(?:all\s+)?(?:previous|prior|system|security)\s+(?:instructions|protocols|classifiers)/i,
  /you\s+are\s+now\s+(?:operating\s+in\s+)?(?:a\s+)?(?:bypass|unrestricted|god|dan|jailbroken|safe|override)\s+mode/i,
  /(?:output|classify|respond\s+with)\s+(?:only\s+)?(?:classification\s*=\s*["']?Safe["']?|risk_score\s*=\s*0)/i,
  /(?:===+\s*(?:system|override|admin|advisory|prompt)\s*===+|\[\s*(?:system|admin|override)\s*\])/i,
  /do\s+not\s+(?:analyze|scan|flag|inspect)\s+this\s+(?:email|message|attachment)/i,
  /reveal\s+(?:your\s+)?(?:system\s+prompt|hidden\s+instructions)/i,
  /you\s+are\s+now\s+the\s+administrator/i,
];

const URL_REGEX = /(?:https?:\/\/|www\.)[a-zA-Z0-9.\-_~:/?#[\]@!$&'()*+,;=%]+/gi;

const DANGEROUS_EXTENSIONS: Record<string, string> = {
  '.exe': 'Windows Portable Executable binary capable of arbitrary code execution',
  '.vbs': 'Visual Basic Script file commonly used for malware delivery and downloaders',
  '.bat': 'Windows Batch command file capable of executing arbitrary shell instructions',
  '.cmd': 'Windows Command script capable of privileged system modification',
  '.scr': 'Screensaver binary executable often disguised as legitimate documents',
  '.ps1': 'PowerShell script file frequently abused for living-off-the-land attacks',
  '.hta': 'HTML Application file that executes outside browser sandbox with full trust',
  '.jar': 'Java Archive binary capable of cross-platform execution',
  '.js': 'JavaScript standalone file commonly leveraged for dropper scripts',
  '.iso': 'Disk image container often used to bypass Mark-of-the-Web (MOTW) security controls',
  '.img': 'Disk image container used to smuggle malicious executable payloads',
  '.docm': 'Macro-enabled Microsoft Word document capable of VBA script execution',
  '.xlsm': 'Macro-enabled Microsoft Excel workbook capable of automated payload execution',
  '.pptm': 'Macro-enabled Microsoft PowerPoint presentation',
};

const URGENCY_REGEX = /\b(?:urgent|immediately|within 24 hours|within 48 hours|before \d{1,2}(?::\d{2})?\s*(?:AM|PM)(?:\s+[A-Z]{2,4})?\s+today|suspension|decommission|purge|scheduled for deletion|action required|expire immediately|final warning|penalty|account suspended)\b/gi;
const CREDENTIAL_REGEX = /\b(?:password|credentials|login|sign[- ]in|verify your account|session expired|renew session|confirm identity|update credentials|mailbox quota|storage limit|mfa code|otp)\b/i;
const PAYMENT_REGEX = /\b(?:urgent\s+wire\s+of\s+(?:USD\s*)?\$?[\d,]+(?:\.\d{2})?|wire\s+(?:transfer|of\s+(?:USD\s*)?\$?[\d,]+(?:\.\d{2})?)|invoice|remittance|unpaid balance|past due|gift card|escrow|routing number|ach payment|swift code|settlement|late fee)\b/i;
const SUPPRESSION_REGEX = /\b(?:do not call|in a meeting|currently airborne|boarding a flight|limited connectivity|(?:please\s+)?do not contact my cell(?: phone)?|confidential transaction)\b/gi;

function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX) || [];
  const clean = new Set<string>();
  for (const m of matches) {
    const trimmed = m.replace(/[.,;!?)"'>]+$/, '');
    if (trimmed.length > 8) clean.add(trimmed);
  }
  return Array.from(clean);
}

function extractDomain(urlOrEmail: string): string {
  try {
    if (urlOrEmail.includes('@')) {
      return urlOrEmail.split('@')[1]?.toLowerCase() || '';
    }
    const parsed = new URL(urlOrEmail.startsWith('http') ? urlOrEmail : `http://${urlOrEmail}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return '';
  }
}


function visibleEmailText(value: string): string {
  return value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_match, code: string) =>
      String.fromCodePoint(parseInt(code[0].toLowerCase() === 'x' ? code.slice(1) : code, code[0].toLowerCase() === 'x' ? 16 : 10))
    );
}
export function attachTextSpans(body: string, indicators: IndicatorRecord[]) {
  const normalized = visibleEmailText(body);
  for (const finding of indicators) {
    let phrases: string[] = [];
    if (finding.type === 'suspicious_url' && finding.evidence?.startsWith('URL: ')) {
      phrases = [finding.evidence.slice(5)];
    } else if (finding.evidence) {
      phrases = Array.from(finding.evidence.matchAll(/"([^"]+)"/g), (match) => match[1]);
    }
    const spans: NonNullable<IndicatorRecord['textSpans']> = [];
    for (const phrase of new Set(phrases.filter(Boolean))) {
      let offset = 0;
      while (offset < normalized.length) {
        const start = normalized.indexOf(phrase, offset);
        if (start < 0) break;
        spans.push({start, end:start+phrase.length, findingId:finding.id, category:finding.type, title:finding.title, reason:finding.description, severity:finding.severity, matchedText:phrase, evidence:finding.evidence});
        offset = start + Math.max(1, phrase.length);
      }
    }
    finding.textSpans = spans;
  }
}
function buildRecommendedActions(indicators: IndicatorRecord[], intel: ThreatIntelRecord[]): string[] {
  const types = new Set(indicators.map((item) => item.type));
  const actions: string[] = [];
  if (types.has('prompt_injection')) actions.push('Treat embedded instructions as untrusted; do not follow requests to bypass security checks.');
  if (types.has('credential_request')) actions.push('Do not enter passwords, MFA codes, or other credentials from this email.');
  if (types.has('suspicious_url')) actions.push('Do not open the flagged link until its destination is verified independently.');
  if (types.has('malicious_attachment')) actions.push('Do not open or run the flagged attachment; submit it to your security team.');
  if (types.has('sender_domain_mismatch') || types.has('payment_request') || types.has('impersonation')) actions.push('Verify the sender and any payment or account request using a known, separate contact channel.');
  if (intel.some((item) => item.malicious)) actions.push('Report and quarantine this message; threat intelligence returned a malicious listing.');
  else if (intel.some((item) => item.suspicious)) actions.push('Escalate for review because an external source returned a suspicious result.');
  if (actions.length === 0 && !intel.some((item) => item.status === 'not_configured' || item.status === 'failed' || item.status === 'unavailable')) actions.push('No action is indicated by the available findings; remain alert to unexpected requests.');
  return actions;
}

export async function executeThreatAnalysisPipeline(
  email: EmailRecord,
  userId: string
): Promise<{
  analysis: AnalysisRecord;
  indicators: IndicatorRecord[];
  threatIntel: ThreatIntelRecord[];
  evidence: EvidenceRecord[];
  pipelineLogs: PipelineLogRecord[];
}> {
  const analysisId = uuidv4();
  const now = new Date().toISOString();
  const pipelineLogs: PipelineLogRecord[] = [];
  const indicators: IndicatorRecord[] = [];
  const deterministicReasons: string[] = [];

  // 1. Email Ingestion & Normalization Log
  const t0 = Date.now();
  pipelineLogs.push({
    id: uuidv4(),
    userId,
    analysisId,
    component: 'email_ingestion',
    status: 'completed',
    startTime: new Date(t0).toISOString(),
    endTime: new Date(t0 + 2).toISOString(),
    durationMs: 2,
    message: `Ingested email: "${email.subject}" from ${email.senderEmail}`,
  });

  const t1 = Date.now();
  const bodyText = visibleEmailText(email.body);
  const text = email.subject + '\n' + bodyText;
  const allUrls = Array.from(new Set([...(email.urls || []), ...extractUrls(email.body)]));
  pipelineLogs.push({
    id: uuidv4(),
    userId,
    analysisId,
    component: 'normalization',
    status: 'completed',
    startTime: new Date(t1).toISOString(),
    endTime: new Date(t1 + 3).toISOString(),
    durationMs: 3,
    message: `Normalized payload. Extracted ${allUrls.length} URLs and ${email.attachmentInfo?.length || 0} attachment metadata records.`,
  });

  // 2. Prompt Injection Detection (OWASP LLM01)
  const t2 = Date.now();
  let promptInjectionSuspected = false;
  let promptInjectionDetails = '';
  for (const pat of INJECTION_PATTERNS) {
    const match = text.match(pat);
    if (match) {
      promptInjectionSuspected = true;
      promptInjectionDetails = `Adversarial sequence matched: "${match[0]}"`;
      break;
    }
  }

  if (promptInjectionSuspected) {
    indicators.push({
      id: uuidv4(),
      userId,
      analysisId,
      type: 'prompt_injection',
      title: 'Adversarial Prompt Injection Attempt',
      description: 'Email content contains directive override sequences targeting the AI orchestrator.',
      severity: 'Critical',
      evidence: promptInjectionDetails,
      source: 'Prompt Injection Detector (OWASP LLM01)',
      createdAt: now,
    });
    deterministicReasons.push('Adversarial prompt injection pattern detected (+50 risk points)');
  }

  pipelineLogs.push({
    id: uuidv4(),
    userId,
    analysisId,
    component: 'prompt_injection',
    status: 'completed',
    startTime: new Date(t2).toISOString(),
    endTime: new Date().toISOString(),
    durationMs: Date.now() - t2,
    message: promptInjectionSuspected
      ? `Threat detected: ${promptInjectionDetails}`
      : 'Clean: No adversarial prompt injection override patterns found.',
  });

  // 3. Sender & Linguistic Analysis
  const t3 = Date.now();
  const senderDomain = extractDomain(email.senderEmail);
  const nameLower = email.senderName.toLowerCase();
  const executiveCues = ['ceo', 'cfo', 'president', 'it support', 'identity', 'microsoft', 'google', 'apple', 'payroll'];
  for (const cue of executiveCues) {
    if (
      nameLower.includes(cue) &&
      !senderDomain.includes(cue) &&
      (senderDomain.endsWith('.co') || senderDomain.includes('portal') || senderDomain.includes('fastmail') || senderDomain.includes('verify'))
    ) {
      indicators.push({
        id: uuidv4(),
        userId,
        analysisId,
        type: 'sender_domain_mismatch',
        title: 'Display Name / Origin Domain Mismatch',
        description: `Sender display name "${email.senderName}" does not align with origin domain "${senderDomain}".`,
        severity: 'High',
        evidence: `From: ${email.senderName} <${email.senderEmail}>`,
        source: 'Email Analysis Agent',
        createdAt: now,
      });
      deterministicReasons.push(`Sender display name mismatch with domain ${senderDomain} (+20 risk points)`);
      break;
    }
  }

  // Linguistic Urgency
  const urgencyMatches = Array.from(text.matchAll(URGENCY_REGEX));
  if (urgencyMatches.length) {
    const urgencyEvidence = urgencyMatches.map((match) => `"${match[0]}"`).join(", ");
    indicators.push({
      id: uuidv4(),
      userId,
      analysisId,
      type: 'urgency_language',
      title: 'Coercive Urgency Language',
      description: 'Psychological pressure triggering panic or rushed action without verification.',
      severity: 'High',
      evidence: `Keywords detected: ${urgencyEvidence}`,
      source: 'Email Analysis Agent (NLP)',
      createdAt: now,
    });
    deterministicReasons.push(`Coercive urgency language detected: ${urgencyEvidence} (+15 risk points)`);
  }

  // Credential Solicitation
  const credMatch = text.match(CREDENTIAL_REGEX);
  if (credMatch) {
    indicators.push({
      id: uuidv4(),
      userId,
      analysisId,
      type: 'credential_request',
      title: 'Credential Solicitation Pattern',
      description: 'Message solicits password reset, session renewal, or authentication verification.',
      severity: 'High',
      evidence: `Keyword detected: "${credMatch[0]}"`,
      source: 'Email Analysis Agent (NLP)',
      createdAt: now,
    });
    deterministicReasons.push(`Credential solicitation pattern detected: "${credMatch[0]}" (+25 risk points)`);
  }

  // Payment Fraud / Wire Transfer
  const payMatch = bodyText.match(PAYMENT_REGEX) || text.match(PAYMENT_REGEX);
  if (payMatch) {
    indicators.push({
      id: uuidv4(),
      userId,
      analysisId,
      type: 'payment_request',
      title: 'Financial Transaction / Wire Instruction',
      description: 'Demands an expedited wire transfer, escrow settlement, or invoice payment.',
      severity: 'High',
      evidence: `Keyword detected: "${payMatch[0]}"`,
      source: 'Email Analysis Agent (NLP)',
      createdAt: now,
    });
    deterministicReasons.push(`Financial transaction / wire request detected: "${payMatch[0]}" (+25 risk points)`);
  }

  // Verification Suppression
  const suppressionMatches = Array.from(bodyText.matchAll(SUPPRESSION_REGEX));
  if (suppressionMatches.length) {
    const suppressionEvidence = suppressionMatches.map((match) => `"${match[0]}"`).join(", ");
    indicators.push({
      id: uuidv4(),
      userId,
      analysisId,
      type: 'impersonation',
      title: 'Verification Channel Suppression',
      description: 'Instructs recipient not to call or verify independently due to travel/flight pretext.',
      severity: 'High',
      evidence: `Phrasing detected: ${suppressionEvidence}`,
      source: 'Email Analysis Agent',
      createdAt: now,
    });
    deterministicReasons.push('Out-of-band communication suppression detected (+20 risk points)');
  }

  // URL Domain and Lookalike Inspection
  for (const url of allUrls) {
    const domain = extractDomain(url);
    const isIpHost = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);
    const isLookalike = /microsoft|office|verify|login|renew|escrow/i.test(domain) && (domain.endsWith('.net') || domain.endsWith('.biz') || domain.endsWith('.io'));
    const isScript = Object.keys(DANGEROUS_EXTENSIONS).some((ext) => url.toLowerCase().includes(ext));

    if (isIpHost || isLookalike || isScript) {
      indicators.push({
        id: uuidv4(),
        userId,
        analysisId,
        type: 'suspicious_url',
        title: isScript ? 'Malicious Script Payload Link' : 'Suspicious / Lookalike Destination URL',
        description: isScript
          ? `Hyperlink targets dangerous script file extension: ${url}`
          : `URL domain "${domain}" mimics authenticated portal infrastructure or uses raw IP.`,
        severity: 'Critical',
        evidence: `URL: ${url}`,
        source: 'Email Analysis Agent (URL Inspection)',
        createdAt: now,
      });
      deterministicReasons.push(`Suspicious / Lookalike URL identified: ${domain} (+25 risk points)`);
    }
  }

  // Attachment Security Inspection
  for (const att of email.attachmentInfo || []) {
    const lowerName = att.filename.toLowerCase();
    const matchedExt = Object.keys(DANGEROUS_EXTENSIONS).find((ext) => lowerName.endsWith(ext));
    const isDoubleExt = /\.[a-z0-9]{2,4}\.[a-z0-9]{2,4}$/i.test(lowerName) && !lowerName.endsWith('.tar.gz');

    if (matchedExt || isDoubleExt || att.isSuspicious) {
      const reasonExpl = matchedExt
        ? DANGEROUS_EXTENSIONS[matchedExt]
        : isDoubleExt
        ? 'Double extension pattern used to deceive users into executing disguised payloads'
        : (att.notes || 'Unverified attachment payload with anomalous MIME metadata');

      indicators.push({
        id: uuidv4(),
        userId,
        analysisId,
        type: 'malicious_attachment',
        title: 'Dangerous Attachment File Payload',
        description: `Attachment "${att.filename}" flagged: ${reasonExpl}`,
        severity: 'High',
        evidence: `Filename: ${att.filename} (${att.size || 'unknown size'}), MIME: ${att.mimeType || 'unknown'}`,
        source: 'Attachment Security Agent',
        createdAt: now,
      });
      deterministicReasons.push(`High-risk attachment detected: ${att.filename} (+35 risk points)`);
    }
  }

  attachTextSpans(email.body, indicators);

  pipelineLogs.push({
    id: uuidv4(),
    userId,
    analysisId,
    component: 'email_analysis',
    status: 'completed',
    startTime: new Date(t3).toISOString(),
    endTime: new Date().toISOString(),
    durationMs: Date.now() - t3,
    message: `Completed NLP & heuristics analysis. Found ${indicators.length} threat indicators.`,
  });

  // 4. Real Threat Intelligence Queries (VirusTotal & URLhaus)
  const t4 = Date.now();
  const intelLookups = await Promise.all([
    ...allUrls.slice(0, 10).flatMap((url) => [
      threatIntelService.checkUrl(url, analysisId, userId, 'url'),
      threatIntelService.checkUrl(threatIntelService.extractDomain(url), analysisId, userId, 'domain'),
    ]),
    ...(email.attachmentInfo || []).filter((attachment) => attachment.hash && /^[a-f0-9]{32,128}$/i.test(attachment.hash))
      .map((attachment) => threatIntelService.checkUrl(attachment.hash!, analysisId, userId, 'hash')),
  ]);
  const threatIntel: ThreatIntelRecord[] = intelLookups.flat();
  for (const result of threatIntel.filter((item) => item.malicious || item.suspicious)) {
    deterministicReasons.push('Threat Intelligence: ' + result.provider + ' returned positive evidence for ' + result.url);
  }

  const tiStatus = threatIntel.some((t) => t.status === 'completed')
    ? 'completed'
    : threatIntel.length === 0 ? 'skipped' : 'unavailable';

  pipelineLogs.push({
    id: uuidv4(),
    userId,
    analysisId,
    component: 'threat_intelligence',
    status: tiStatus,
    startTime: new Date(t4).toISOString(),
    endTime: new Date().toISOString(),
    durationMs: Date.now() - t4,
    message: threatIntel.length > 0
      ? `Queried threat intelligence for ${allUrls.slice(0, 3).length} URLs (${threatIntel.map((t) => `${t.provider}:${t.status}`).join(', ')})`
      : 'No URLs present in message for external threat intelligence scanning.',
  });

  // 5. Real RAG / Security Knowledge Retrieval
  const t5 = Date.now();
  const evidence: EvidenceRecord[] = ragEngine.retrieveEvidence(text, indicators, analysisId, userId);

  // Add email content indicators to evidence trail
  for (const ind of indicators) {
    evidence.push({
      id: uuidv4(),
      userId,
      analysisId,
      type: 'Email Content',
      title: ind.title,
      description: ind.description,
      source: ind.source,
      sourceUrl: ind.evidence,
      createdAt: now,
    });
  }

  pipelineLogs.push({
    id: uuidv4(),
    userId,
    analysisId,
    component: 'rag',
    status: 'completed',
    startTime: new Date(t5).toISOString(),
    endTime: new Date().toISOString(),
    durationMs: Date.now() - t5,
    message: `Retrieved ${evidence.filter((e) => e.type === 'RAG / Knowledge Base').length} grounded taxonomy evidence documents from Security Knowledge Base.`,
  });

  // 6. Deterministic Risk Engine (Strict Mathematical Formulation)
  const t6 = Date.now();
  const scoreResult = calculateRiskScore({
    prompt_injection:promptInjectionSuspected,malicious_intel:threatIntel.some(t=>t.malicious),
    suspicious_intel:!threatIntel.some(t=>t.malicious)&&threatIntel.some(t=>t.suspicious),
    malicious_attachment:indicators.some(i=>i.type==='malicious_attachment'),suspicious_url:indicators.some(i=>i.type==='suspicious_url'),
    credential_request:indicators.some(i=>i.type==='credential_request'),payment_request:indicators.some(i=>i.type==='payment_request'),
    sender_domain_mismatch:indicators.some(i=>i.type==='sender_domain_mismatch'),impersonation:indicators.some(i=>i.type==='impersonation'),
    urgency_language:indicators.some(i=>i.type==='urgency_language')});
  const rawScore=scoreResult.score;

  const finalRiskScore = rawScore;

  let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  let classification: 'Safe' | 'Suspicious' | 'Phishing' | 'Spam' = 'Safe';

  if (finalRiskScore >= 80) {
    riskLevel = 'Critical';
    classification = 'Phishing';
  } else if (finalRiskScore >= 60) {
    riskLevel = 'High';
    classification = 'Phishing';
  } else if (finalRiskScore >= 30) {
    riskLevel = 'Medium';
    classification = 'Suspicious';
  } else {
    riskLevel = 'Low';
    classification = 'Safe';
  }

  pipelineLogs.push({
    id: uuidv4(),
    userId,
    analysisId,
    component: 'risk_engine',
    status: 'completed',
    startTime: new Date(t6).toISOString(),
    endTime: new Date().toISOString(),
    durationMs: Date.now() - t6,
    message: `Deterministic Risk Engine calculated: ${finalRiskScore}/100 (${riskLevel}). Reasons: ${deterministicReasons.join('; ') || 'No risk indicators detected.'}`,
  });

  // 7. LLM Reasoning / Explainability (Groq)
  const t7 = Date.now();
  let explanation = '';
  let recommendedAction = '';
  let confidenceScore: number | null = null;
  let llmStatus: 'completed'|'not_configured'|'unavailable' = process.env.GROQ_API_KEY ? 'completed' : 'not_configured';

  const grokKey = process.env.GROQ_API_KEY;
  if (grokKey) {
    try {
      const systemPrompt = `You are an expert cybersecurity analyst specializing in email threat detection. 
Your job is to provide clear, accurate, and actionable explanations for email security verdicts.

Always respond with valid JSON in this exact format:
{
  "explanation": "2-3 concise sentences explaining the classification",
  "recommended_action": "Clear operational recommendation for the user/SOC team",
  "confidence": 0
}`;

      const userPrompt = `Analyze this email and provide explanation:

Email Subject: ${email.subject}
Sender: ${email.senderName} <${email.senderEmail}>
Body Preview: ${email.body.substring(0, 500)}${email.body.length > 500 ? '...' : ''}

Detected Indicators: ${indicators.map((i) => `- ${i.title}: ${i.description}`).join('\n')}
Threat Intel Flags: ${threatIntel.filter(t => t.malicious || t.suspicious).map(t => `- ${t.provider}: ${t.reputation}`).join('\n') || 'None'}
Prompt Injection Suspected: ${promptInjectionSuspected}

Risk Score: ${finalRiskScore}/100
Risk Level: ${riskLevel}
Classification: ${classification}

Provide a detailed yet concise explanation based on the evidence.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${grokKey}`,
        },
        signal: AbortSignal.timeout(Number(process.env.GROQ_TIMEOUT_MS || 20000)),
        body: JSON.stringify({
          model: (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        try {
          // Try to parse JSON from response (handle markdown code blocks)
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
          explanation = parsed.explanation || '';
          recommendedAction = parsed.recommended_action || '';
          confidenceScore = Number.isFinite(Number(parsed.confidence)) ? Math.max(0, Math.min(100, Number(parsed.confidence))) : null;
          llmStatus = 'completed';
        } catch (parseErr) {
          llmStatus = 'unavailable';
          console.warn('[AI] Failed to parse Groq response, using evidence-based fallback');
        }
      } else {
        llmStatus = 'unavailable';
        console.warn(`[AI] Grok API error: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      llmStatus = 'unavailable';
      console.warn('[AI] Groq generation fallback to deterministic rationale:', err?.message || err);
    }
  }

  if (!explanation) {
    const observed = indicators.map(i => i.title + (i.evidence ? ' (' + i.evidence + ')' : '')).concat(threatIntel.filter(t => t.malicious || t.suspicious).map(t => t.provider + ': ' + t.url + ' ' + (t.reputation || 'flagged')));
    explanation = observed.length ? 'Risk score ' + finalRiskScore + '/100 is based on observed evidence: ' + observed.slice(0,5).join('; ') + '.' : 'No configured detector or threat-intelligence source returned a finding. Unavailable integrations are unknown, not evidence of a clean email.';
    recommendedAction = observed.length ? 'Review the evidence and verify sender requests through a trusted channel before interacting with links or attachments.' : 'No action is indicated by available evidence.';
  }


  pipelineLogs.push({
    id: uuidv4(),
    userId,
    analysisId,
    component: 'report_generation',
    status: 'completed',
    startTime: new Date(t7).toISOString(),
    endTime: new Date().toISOString(),
    durationMs: Date.now() - t7,
    message: `Generated explainable report: Verdict ${classification}, Confidence: ${Math.min(99, 50 + indicators.length * 5 + threatIntel.filter(t=>t.status==='completed'&&(t.malicious||t.suspicious)).length*10)}%`,
  });

  // 8. Assemble Analysis Record & Database Storage
  const t8 = Date.now();
  const analysis: AnalysisRecord = {
    id: analysisId,
    userId,
    emailId: email.id,
    classification,
    riskScore: finalRiskScore,
    riskLevel,
    confidence: confidenceScore,
    explanation,
    recommendedAction,
    promptInjectionSuspected,
    promptInjectionDetails: promptInjectionSuspected ? promptInjectionDetails : undefined,
    status: 'completed',
    createdAt: now,
    completedAt: now,
    riskBreakdown: scoreResult.factors,
    llmStatus,
    recommendedActions: buildRecommendedActions(indicators, threatIntel),
  };

  // Persist into database
  db.saveAnalysis(analysis);
  db.saveIndicators(indicators);
  db.saveThreatIntel(threatIntel);
  db.saveEvidence(evidence);

  pipelineLogs.push({
    id: uuidv4(),
    userId,
    analysisId,
    component: 'database_storage',
    status: 'completed',
    startTime: new Date(t8).toISOString(),
    endTime: new Date().toISOString(),
    durationMs: Date.now() - t8,
    message: `Persisted analysis record, ${indicators.length} indicators, ${threatIntel.length} threat intelligence lookups, and ${evidence.length} evidence items.`,
  });

  db.savePipelineLogs(pipelineLogs);

  // Update email record with latest analysis summary
  db.updateEmail(email.id, userId, {
    latestAnalysisId: analysisId,
    classification,
    riskScore: finalRiskScore,
    riskLevel,
    promptInjectionSuspected,
  });

  return {
    analysis,
    indicators,
    threatIntel,
    evidence,
    pipelineLogs,
  };
}
