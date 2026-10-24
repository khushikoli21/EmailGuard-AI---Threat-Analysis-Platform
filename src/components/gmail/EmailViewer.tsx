import React, { useState, useEffect } from 'react';
import { AnalysisReport } from './AnalysisReport';
import { EmailBodyEvidence } from './EmailBodyEvidence';
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
    <div className="flex-1 min-h-0 flex flex-col min-w-0 bg-white overflow-hidden">
      {/* Gmail Email Reading Action Bar */}
      <div className="min-h-14 border-b border-slate-200/90 px-3 sm:px-5 py-2 flex items-center justify-between gap-3 text-xs bg-white/95 backdrop-blur shrink-0">
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
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
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
                <span>Threat Intelligence lookup (VirusTotal & URLhaus status)</span>
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

        {reportData && <AnalysisReport data={reportData} />}

        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-slate-400">Original message body</span>
            {reportData?.indicators.some((finding) => finding.textSpans?.length) && <span className="text-[11px] text-slate-500">Highlighted passages link to findings</span>}
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-sans text-slate-800 select-text">
            <EmailBodyEvidence body={email.body} indicators={reportData?.indicators || []} />
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
