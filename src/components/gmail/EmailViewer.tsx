import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  Star,
  Trash2,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Paperclip,
  FileCode,
  Link2,
  Info,
  Clock,
  Terminal,
  Activity,
  ChevronDown,
  ChevronUp,
  Globe2,
  Database,
} from 'lucide-react';
import { EmailRecord, ThreatReportPayload, analyzeEmail, fetchReport } from '../../services/api';

interface EmailViewerProps {
  email: EmailRecord;
  onBack: () => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onEmailUpdated: (updated: EmailRecord) => void;
}

export const EmailViewer: React.FC<EmailViewerProps> = ({
  email,
  onBack,
  onDelete,
  onToggleStar,
  onEmailUpdated,
}) => {
  const [reportData, setReportData] = useState<ThreatReportPayload | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  // Load existing report if email has one
  useEffect(() => {
    async function loadExistingReport() {
      if (email.latestAnalysisId) {
        try {
          setLoadingReport(true);
          const data = await fetchReport(email.latestAnalysisId);
          setReportData(data);
        } catch (err) {
          console.warn('[REPORT] Failed to load existing report:', err);
        } finally {
          setLoadingReport(false);
        }
      } else {
        setReportData(null);
      }
    }
    loadExistingReport();
  }, [email.id, email.latestAnalysisId]);

  const handleRunAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisStep(1);

      // Visual step animation corresponding to server steps
      setTimeout(() => setAnalysisStep(2), 300);
      setTimeout(() => setAnalysisStep(3), 600);
      setTimeout(() => setAnalysisStep(4), 900);

      const result = await analyzeEmail(email.id);
      setReportData(result);
      if (result.email) {
        onEmailUpdated(result.email);
      }
    } catch (err: any) {
      alert('Analysis execution failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const getRiskColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'text-slate-500 bg-slate-100 border-slate-200';
    if (score >= 80) return 'text-rose-700 bg-rose-50 border-rose-300';
    if (score >= 60) return 'text-orange-700 bg-orange-50 border-orange-300';
    if (score >= 30) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-emerald-700 bg-emerald-50 border-emerald-300';
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
      {/* Gmail Email Reading Action Bar */}
      <div className="h-12 border-b border-slate-200/90 px-3 sm:px-4 flex items-center justify-between text-xs bg-white select-none shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition-colors cursor-pointer"
            title="Back to Inbox"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleStar(email.id, !email.isStarred)}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
            title="Star email"
          >
            <Star
              className={`w-4 h-4 ${
                email.isStarred ? 'text-amber-400 fill-amber-400' : 'hover:text-slate-600'
              }`}
            />
          </button>

          <button
            onClick={() => onDelete(email.id)}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete email"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Prominent Analyze Email button in header */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running Multi-Agent Pipeline...</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>{reportData ? 'Re-Analyze Threat' : 'Analyze Email'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Email Reading Body & Security Panel */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Email Header */}
        <div className="space-y-4 pb-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {email.subject}
              </h1>
              {email.isDevelopmentSample && (
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded uppercase tracking-wider">
                  Development Sample Data
                </span>
              )}
            </div>
            <span className="text-xs font-mono text-slate-500 shrink-0">
              {new Date(email.receivedAt).toLocaleString()}
            </span>
          </div>

          {/* Sender & Recipient Metadata */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
              {email.senderName?.charAt(0) || email.senderEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-bold text-slate-900 text-sm">{email.senderName}</span>
                <span className="text-xs text-slate-500 font-mono">
                  &lt;{email.senderEmail}&gt;
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <span>to {email.recipientEmail || 'me'}</span>
                <span>·</span>
                <span className="font-mono text-[11px] text-slate-500">
                  Origin: {email.senderDomain || 'standard envelope'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Analysis Progress Animation when Analyzing */}
        {isAnalyzing && (
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>AI Threat Detection Pipeline Executing...</span>
              </div>
              <span className="font-mono text-blue-700">Multi-Agent Sandbox</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>MIME structure & linguistic cues processed</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                {analysisStep >= 2 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                )}
                <span>Extracting hyperlinks & adversarial prompt tokens</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                {analysisStep >= 3 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Threat Intelligence lookup (VirusTotal & urlscan status)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                {analysisStep >= 4 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Querying MITRE ATT&CK RAG knowledge & calculating risk score</span>
              </div>
            </div>
          </div>
        )}

        {/* Security Analysis Panel (Prominently rendered if analyzed) */}
        {reportData && (
          <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
            {/* Header: Classification & Risk Score */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Security Analysis Dossier
                </div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {reportData.analysis.classification.toUpperCase()}
                  </h3>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase border ${getRiskColor(
                      reportData.analysis.riskScore
                    )}`}
                  >
                    Risk {reportData.analysis.riskScore} / 100 ({reportData.analysis.riskLevel})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400">
                  Confidence: {reportData.analysis.confidence}%
                </span>
              </div>
            </div>

            {/* Prompt Injection Warning Alert if detected */}
            {reportData.analysis.promptInjectionSuspected && (
              <div className="p-4 rounded-xl bg-rose-950 text-rose-100 border-2 border-rose-500 flex items-start gap-3">
                <Terminal className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-white text-sm">
                    ⚠ Prompt Injection Attempt Detected (OWASP LLM01)
                  </h4>
                  <p className="text-rose-200 leading-relaxed font-sans">
                    This email contains text that appears to be attempting to manipulate the AI analysis system.
                    Email content is treated as untrusted data and isolated from system directives.
                  </p>
                  {reportData.analysis.promptInjectionDetails && (
                    <div className="mt-1 font-mono text-[11px] text-rose-300 bg-black/40 p-1.5 rounded">
                      {reportData.analysis.promptInjectionDetails}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommended Action Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs text-slate-700 shrink-0">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Recommended Action
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {reportData.analysis.recommendedAction}
                </p>
              </div>
            </div>

            {/* Explanation: "Why was this email flagged?" */}
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-1">
              <span className="text-xs font-bold text-blue-900 block">
                Why was this email flagged?
              </span>
              <p className="text-xs text-blue-950 leading-relaxed font-sans">
                {reportData.analysis.explanation}
              </p>
            </div>

            {/* Threat Indicators List */}
            {reportData.indicators && reportData.indicators.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Threat Indicators Detected ({reportData.indicators.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reportData.indicators.map((ind) => (
                    <div
                      key={ind.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{ind.title}</span>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                            ind.severity === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : ind.severity === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {ind.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{ind.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Threat Intelligence (VirusTotal & urlscan.io) */}
            {reportData.threatIntel && reportData.threatIntel.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe2 className="w-4 h-4 text-blue-600" />
                    <span>External Threat Intelligence ({reportData.threatIntel.length})</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">VirusTotal · urlscan.io</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reportData.threatIntel.map((ti) => (
                    <div
                      key={ti.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{ti.provider}</span>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            ti.malicious
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : ti.suspicious
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : ti.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {ti.malicious ? 'MALICIOUS' : ti.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 truncate" title={ti.url}>
                        {ti.url}
                      </div>
                      <p className="text-[11px] text-slate-700 leading-normal">
                        {ti.reputation || 'No reputation data'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence & Grounding List */}
            {reportData.evidence && reportData.evidence.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-purple-600" />
                    <span>Traceable Knowledge Base Grounding ({reportData.evidence.length})</span>
                  </span>
                  <span className="text-[11px] font-mono text-purple-600">MITRE ATT&CK · OWASP</span>
                </div>
                <div className="space-y-1.5">
                  {reportData.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{ev.title}</span>
                          {ev.relevanceScore !== undefined && (
                            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 shrink-0">
                              {Math.round(ev.relevanceScore * 100)}% match
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{ev.description}</p>
                      </div>
                      <div className="shrink-0 text-right space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 block">
                          {ev.source}
                        </span>
                        {ev.sourceUrl && (
                          <a
                            href={ev.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            <span>Reference</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Pipeline Audit Trail (Collapsible) */}
            {reportData.pipelineLogs && reportData.pipelineLogs.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowAuditTrail(!showAuditTrail)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Analysis Pipeline Audit Trail ({reportData.pipelineLogs.length} stages)</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <span>{showAuditTrail ? 'Hide Log' : 'Show Execution Log'}</span>
                    {showAuditTrail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>

                {showAuditTrail && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs bg-slate-50">
                    {reportData.pipelineLogs.map((log) => (
                      <div key={log.id} className="p-2.5 flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 text-[11px]">
                              {log.component}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                                log.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.status === 'unavailable'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {log.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{log.message || log.error || 'Done'}</p>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          {log.durationMs} ms
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Email Body Content (Sanitized Viewport) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-slate-400">Message Body</span>
            <span className="font-mono text-[11px] text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sanitized HTML & Plaintext Viewport (DOMPurify XSS-Protected)</span>
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-sans text-slate-800 select-text leading-relaxed">
            {/<[a-z][\s\S]*>/i.test(email.body) ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(email.body, {
                    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
                    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
                  }),
                }}
                className="prose prose-sm max-w-none text-slate-800 font-sans"
              />
            ) : (
              <div className="whitespace-pre-wrap">{email.body}</div>
            )}
          </div>
        </div>

        {/* Detected URLs in Email */}
        {email.urls && email.urls.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Extracted URLs ({email.urls.length})</span>
            </span>
            <div className="space-y-1">
              {email.urls.map((u, i) => (
                <div
                  key={i}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 flex items-center justify-between"
                >
                  <span className="truncate pr-2">{u}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded shrink-0">
                    Defanged
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {email.attachmentInfo && email.attachmentInfo.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
              <span>Attachments ({email.attachmentInfo.length})</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {email.attachmentInfo.map((att, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono font-medium truncate">{att.filename}</span>
                  </div>
                  {att.isSuspicious && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded shrink-0">
                      ⚠ Suspicious
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
