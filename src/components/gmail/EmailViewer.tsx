import React, { useState, useEffect } from 'react';
import { AnalysisReport } from './AnalysisReport';
import { EmailBodyEvidence } from './EmailBodyEvidence';
import { ThreatChatbot } from './ThreatChatbot';
import {
  ArrowLeft,
  Star,
  Trash2,
  Shield,
  Loader2,
  CheckCircle2,
  Paperclip,
  FileCode,
  Link2,
  Clock,
  Sparkles,
  Lock,
  X,
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
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);

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

  return (
    <div className="flex-1 min-h-0 flex flex-col min-w-0 bg-white overflow-hidden font-sans">
      {/* Gmail Email Reading Action Bar */}
      <div className="min-h-14 border-b border-slate-200/90 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs bg-white/95 backdrop-blur shrink-0 shadow-2xs">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Back to Inbox"
            aria-label="Back to mail list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            onClick={() => onToggleStar(email.id, !email.isStarred)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 cursor-pointer transition-colors"
            title="Star email"
            aria-label="Star this email"
          >
            <Star
              className={`w-4 h-4 ${
                email.isStarred ? 'text-amber-400 fill-amber-400' : 'hover:text-slate-600'
              }`}
            />
          </button>

          <button
            onClick={() => onDelete(email.id)}
            className="p-2 hover:bg-rose-50 rounded-xl text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete email"
            aria-label="Delete this email"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons: ASK AI & Pipeline Execution */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAskAiOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all cursor-pointer border border-blue-500/30 active:scale-[0.98]"
            title="Ask Analyst AI Copilot about this email"
          >
            <Sparkles className="w-3.5 h-3.5 drop-shadow-xs" />
            <span>ASK AI</span>
          </button>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border border-slate-700 active:scale-[0.98]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>Executing Pipeline...</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-blue-400 drop-shadow-xs" />
                <span>{reportData ? 'Re-Analyze Threat' : 'Analyze Email'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Email Reading Body & Security Panel */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#f8fafc]">
        {/* Email Header Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {email.subject}
              </h1>
              {email.isDevelopmentSample && (
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded uppercase tracking-wider">
                  Development Sample Data
                </span>
              )}
            </div>
            <span className="text-xs font-mono text-slate-400 shrink-0">
              {new Date(email.receivedAt).toLocaleString()}
            </span>
          </div>

          {/* Sender & Recipient Metadata */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-900 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs border border-slate-700/50">
              {email.senderName?.charAt(0) || email.senderEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-bold text-slate-900 text-sm">{email.senderName}</span>
                <span className="text-xs text-slate-500 font-mono">
                  &lt;{email.senderEmail}&gt;
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>to {email.recipientEmail || 'me'}</span>
                <span>·</span>
                <span className="font-mono text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded">
                  Origin: {email.senderDomain || 'standard envelope'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Analysis Progress Animation when Analyzing */}
        {isAnalyzing && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-sky-50/60 border border-blue-200 shadow-xs space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 border-b border-blue-200/60 pb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm">Threat Detection Pipeline Running...</span>
              </div>
              <span className="font-mono text-[10px] text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-full uppercase">
                Multi-Agent Sandbox
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 bg-white/70 p-2 rounded-xl border border-blue-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>MIME structure & linguistic cues processed</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 bg-white/70 p-2 rounded-xl border border-blue-100">
                {analysisStep >= 2 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                )}
                <span>Extracting hyperlinks & adversarial prompt tokens</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 bg-white/70 p-2 rounded-xl border border-blue-100">
                {analysisStep >= 3 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span>Threat Intelligence lookups (VirusTotal & URLhaus)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 bg-white/70 p-2 rounded-xl border border-blue-100">
                {analysisStep >= 4 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span>Querying MITRE ATT&CK RAG & computing risk score</span>
              </div>
            </div>
          </div>
        )}

        {/* 1. Threat Analysis Report Dashboard (inside email) */}
        {reportData && <AnalysisReport data={reportData} />}

        {/* 2. Original Message Body with Evidence Highlighting */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
            <span className="font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Original Message Body</span>
            </span>
            {reportData?.indicators.some((finding) => finding.textSpans?.length) && (
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                Interactive: Click highlights to inspect finding
              </span>
            )}
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm font-sans text-slate-800 select-text leading-relaxed">
            <EmailBodyEvidence body={email.body} indicators={reportData?.indicators || []} />
          </div>
        </div>

        {/* 3. Extracted URLs in Email */}
        {email.urls && email.urls.length > 0 && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Extracted URLs ({email.urls.length})</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Defanged for Analyst Safety</span>
            </div>
            <div className="space-y-1.5">
              {email.urls.map((u, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 flex items-center justify-between"
                >
                  <span className="truncate pr-3 select-all">{u}</span>
                  <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wider">
                    Defanged
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Attachments */}
        {email.attachmentInfo && email.attachmentInfo.length > 0 && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                <span>Attachments ({email.attachmentInfo.length})</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">MIME Triage Verified</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {email.attachmentInfo.map((att, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileCode className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="font-mono font-medium text-slate-800 truncate">{att.filename}</span>
                  </div>
                  {att.isSuspicious ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-md shrink-0">
                      ⚠ Dangerous Payload
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md shrink-0">
                      Clean Extension
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ASK AI Slide-Over Drawer */}
      {isAskAiOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 drop-shadow-xs" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Analyst AI Copilot</h3>
                    <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                      Email Investigation
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-sm">
                    Investigating: <span className="font-semibold text-slate-700">{email.subject}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAskAiOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Close AI Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chatbot Content Area */}
            <div className="flex-1 min-h-0">
              <ThreatChatbot
                contextType="analyst"
                emailId={email.id}
                analysisId={email.latestAnalysisId || reportData?.analysis?.id}
                title="Analyst AI Copilot"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
