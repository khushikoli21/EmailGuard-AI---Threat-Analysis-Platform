import React, { useEffect, useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Terminal,
  Database,
  Clock,
  Layers,
  Lock,
  Cpu,
  Globe,
  Globe2,
  Copy,
  Check,
  Zap,
  Info,
  Sliders,
  FileText,
} from 'lucide-react';
import { ThreatReportPayload } from '../../services/api';

interface AnalysisReportProps {
  data: ThreatReportPayload;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ data }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [showPipelineDetails, setShowPipelineDetails] = useState<boolean>(false);
  const [copiedActionIndex, setCopiedActionIndex] = useState<number | null>(null);

  const a = data.analysis;
  const findings = data.indicators || [];
  const intel = data.threatIntel || [];
  const kb = (data.evidence || []).filter((e) => e.type === 'RAG / Knowledge Base' || !e.type) || [];
  const allEvidence = data.evidence || [];
  const logs = data.pipelineLogs || [];

  // Listen for text span click events from EmailBodyEvidence to reveal and highlight specific finding
  useEffect(() => {
    const reveal = (event: Event) => {
      const findingId = (event as CustomEvent<{ findingId: string }>).detail?.findingId;
      if (!findingId) return;
      setExpanded(true);
      window.setTimeout(() => {
        const finding = document.getElementById('finding-' + findingId);
        finding?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        finding?.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/50');
        window.setTimeout(() => {
          finding?.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/50');
        }, 2200);
      }, 60);
    };
    window.addEventListener('emailguard:show-finding', reveal);
    return () => window.removeEventListener('emailguard:show-finding', reveal);
  }, []);

  // Copy recommendation helper
  const handleCopyAction = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedActionIndex(index);
    setTimeout(() => setCopiedActionIndex(null), 2000);
  };

  // Severity styling configuration
  const getSeverityConfig = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-700',
          badge: 'bg-rose-600 text-white',
          lightBadge: 'bg-rose-100 text-rose-800 border-rose-300',
          gaugeStroke: 'stroke-rose-600',
          accent: 'rose',
        };
      case 'high':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          badge: 'bg-orange-600 text-white',
          lightBadge: 'bg-orange-100 text-orange-800 border-orange-300',
          gaugeStroke: 'stroke-orange-500',
          accent: 'orange',
        };
      case 'medium':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          badge: 'bg-amber-600 text-white',
          lightBadge: 'bg-amber-100 text-amber-800 border-amber-300',
          gaugeStroke: 'stroke-amber-500',
          accent: 'amber',
        };
      default:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          badge: 'bg-emerald-600 text-white',
          lightBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          gaugeStroke: 'stroke-emerald-500',
          accent: 'emerald',
        };
    }
  };

  const severityTheme = getSeverityConfig(a.riskLevel);

  // Status badge styling helper
  const statusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'checked':
      case 'clean':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'malicious':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'suspicious':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
      case 'unavailable':
      case 'not_configured':
      case 'failed':
        return 'bg-slate-100 text-slate-700 border-slate-300 font-medium';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Threat Intel providers resolution
  const vtRecords = intel.filter((t) => t.provider.toLowerCase().includes('virustotal'));
  const urlhausRecords = intel.filter(
    (t) =>
      t.provider.toLowerCase().includes('urlhaus') ||
      t.provider.toLowerCase().includes('urlscan') ||
      !t.provider.toLowerCase().includes('virustotal')
  );

  const getProviderState = (records: typeof intel) => {
    if (records.length === 0) return { status: 'no_urls', label: 'No URLs Scanned' };
    if (records.some((t) => t.malicious)) return { status: 'malicious', label: 'Malicious Detected' };
    if (records.some((t) => t.suspicious)) return { status: 'suspicious', label: 'Suspicious Verdict' };
    if (records.some((t) => t.status === 'not_configured')) return { status: 'not_configured', label: 'Not Configured' };
    if (records.some((t) => t.status === 'unavailable' || t.status === 'failed'))
      return { status: 'unavailable', label: 'Unavailable / Offline' };
    if (records.some((t) => t.status === 'completed')) return { status: 'clean', label: 'Clean / Passed' };
    return { status: 'unknown', label: 'No Scan Record' };
  };

  const vtState = getProviderState(vtRecords);
  const urlhausState = getProviderState(urlhausRecords);

  // Recommended actions normalization
  const actions = a.recommendedActions?.length
    ? a.recommendedActions
    : a.recommendedAction
    ? [a.recommendedAction]
    : [];

  // Applied score factors from riskBreakdown or derived from findings
  const appliedFactors = (a.riskBreakdown || []).filter((f) => f.applied);

  // Circular gauge math for Risk Score
  const gaugeRadius = 30;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const clampedScore = Math.min(100, Math.max(0, a.riskScore || 0));
  const gaugeOffset = gaugeCircumference - (clampedScore / 100) * gaugeCircumference;

  // Findings pagination/expand
  const shownFindings = expanded ? findings : findings.slice(0, 3);

  return (
    <section
      aria-labelledby="threat-analysis-dashboard-title"
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs font-sans text-slate-800"
    >
      {/* Dashboard Sub-Header */}
      <div className="bg-slate-50/80 border-b border-slate-200/90 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shadow-2xs">
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="threat-analysis-dashboard-title" className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Threat Analysis Report
              </h2>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-100/70 text-blue-800 border border-blue-200 rounded-md uppercase">
                SOC Forensic Dashboard
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Heuristic extraction, grounded taxonomy evidence & deterministic scoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{a.completedAt ? new Date(a.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Verified'}</span>
          </span>
          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Deterministic Engine</span>
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* A. TOP SUMMARY METRIC CARDS (4-Column Compact Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Threat Classification */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Classification</span>
              {a.classification === 'Phishing' || a.classification === 'Suspicious' ? (
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-900 truncate">{a.classification}</span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${severityTheme.lightBadge}`}>
                {a.classification === 'Phishing' ? 'High Urgency Threat' : a.classification === 'Suspicious' ? 'Potential Attack' : 'Benign Envelope'}
              </span>
            </div>
          </div>

          {/* Card 2: Risk Score Circular Gauge */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Risk Score</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black ${severityTheme.text}`}>{clampedScore}</span>
                <span className="text-[11px] font-bold text-slate-400">/100</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 block mt-1">
                Deterministic Score
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
              <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 72 72">
                <circle
                  cx="36"
                  cy="36"
                  r={gaugeRadius}
                  className="stroke-slate-200"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="36"
                  cy="36"
                  r={gaugeRadius}
                  className={`transition-all duration-700 ${severityTheme.gaugeStroke}`}
                  strokeWidth="6"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-[11px] font-black text-slate-700">
                {clampedScore}%
              </div>
            </div>
          </div>

          {/* Card 3: Severity Level */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Severity</span>
              <AlertTriangle className={`w-4 h-4 ${severityTheme.text}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-lg font-black ${severityTheme.text}`}>{a.riskLevel}</span>
            </div>
            {/* Visual 4-segment severity bar */}
            <div className="mt-2 flex items-center gap-1 w-full">
              <div className={`h-1.5 flex-1 rounded-full ${clampedScore >= 20 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${clampedScore >= 40 ? 'bg-amber-500' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${clampedScore >= 60 ? 'bg-orange-500' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${clampedScore >= 80 ? 'bg-rose-600' : 'bg-slate-200'}`} />
            </div>
          </div>

          {/* Card 4: Model Confidence */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confidence</span>
              <Cpu className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">
                {a.confidence === null || a.confidence === undefined ? '—' : `${a.confidence}%`}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>Multi-Agent Consensus</span>
            </div>
          </div>
        </div>

        {/* Adversarial Prompt Injection Alert Banner (if triggered) */}
        {a.promptInjectionSuspected && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3 shadow-2xs">
            <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <div className="font-bold flex items-center gap-2">
                <span>Adversarial Prompt Injection Vector Flagged</span>
                <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-mono uppercase">
                  OWASP LLM01
                </span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                {a.promptInjectionDetails ||
                  'The email body contains tokens designed to override model instructions. Direct instruction following was rejected.'}
              </p>
            </div>
          </div>
        )}

        {/* Verdict Rationale Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Verdict Rationale</span>
            </span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-semibold">
                Findings: {findings.length}
              </span>
              {a.llmStatus && (
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${statusStyle(a.llmStatus)}`}>
                  {a.llmStatus === 'completed' ? 'AI Rationale Verified' : 'AI: ' + a.llmStatus}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 font-normal">
            {a.explanation}
          </p>
          <p className="text-[10px] text-slate-400 italic">
            Email findings are observed text or metadata. Classification and severity are risk-engine assessments. Unavailable intelligence sources are unknown, not clean.
          </p>
        </div>

        {/* B. KEY FINDINGS (Visual Grid of Compact Cards) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Key Forensic Findings</span>
              <span className="text-[11px] font-normal text-slate-500">({findings.length})</span>
            </h3>
            {findings.length > 3 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{expanded ? 'Show fewer' : `Show all (${findings.length})`}</span>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {findings.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No suspicious patterns, deceptive headers, or script payloads detected in this message.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {shownFindings.map((f, i) => {
                const sevConfig = getSeverityConfig(f.severity);
                return (
                  <article
                    id={'finding-' + f.id}
                    key={f.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all text-xs flex flex-col justify-between shadow-2xs space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-900 truncate max-w-[190px]">
                          {i + 1}. {f.title}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase border ${sevConfig.lightBadge}`}>
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {f.description}
                      </p>
                    </div>

                    {f.evidence && (
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200 font-mono text-[10px] text-slate-600 break-all">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase font-sans">
                          Evidence Match
                        </span>
                        {f.evidence}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* C. EXTERNAL THREAT INTELLIGENCE (VirusTotal & urlscan.io Side by Side) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-600" />
              <span>External Threat Intelligence Verification</span>
            </h3>
            <span className="text-[10px] text-slate-400">Explicit clean vs unavailable discipline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* VirusTotal Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between shadow-2xs space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="font-bold text-xs text-slate-900">VirusTotal v3 API</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${statusStyle(vtState.status)}`}>
                    {vtState.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {vtState.status === 'clean'
                    ? 'Queried external telemetry engines; zero security vendors flagged scanned URLs.'
                    : vtState.status === 'malicious'
                    ? 'Multiple security engines flagged one or more destination URLs as malicious.'
                    : vtState.status === 'not_configured' || vtState.status === 'unavailable'
                    ? 'External API key not configured or service unreachable. Status is unknown, not clean.'
                    : 'No external URLs or file hashes found in this email to query against VirusTotal.'}
                </p>
              </div>

              {vtRecords.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-slate-200/60">
                  {vtRecords.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-[10px] font-mono text-slate-600 truncate bg-white p-1.5 rounded border border-slate-200">
                      <span className="truncate pr-2">{item.url}</span>
                      <span className="text-[9px] uppercase font-bold text-slate-500 shrink-0">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* urlscan.io / URLhaus Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between shadow-2xs space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <span className="font-bold text-xs text-slate-900">urlscan.io & URLhaus</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${statusStyle(urlhausState.status)}`}>
                    {urlhausState.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {urlhausState.status === 'clean'
                    ? 'Queried community feeds & sandbox databases; zero active malware campaigns matched.'
                    : urlhausState.status === 'malicious'
                    ? 'Identified within active malware or phishing hosting feeds.'
                    : urlhausState.status === 'not_configured' || urlhausState.status === 'unavailable'
                    ? 'API feed offline or unconfigured. Unperformed checks remain explicitly unverified.'
                    : 'No external URLs found in this email to query against URL reputation feeds.'}
                </p>
              </div>

              {urlhausRecords.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-slate-200/60">
                  {urlhausRecords.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-[10px] font-mono text-slate-600 truncate bg-white p-1.5 rounded border border-slate-200">
                      <span className="truncate pr-2">{item.url}</span>
                      <span className="text-[9px] uppercase font-bold text-slate-500 shrink-0">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* E. SCORE FACTORS & RECOMMENDED ACTIONS (Balanced 2-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Column 1: Score Factors */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
                <span>Score Factors</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-purple-700">
                Sum: {clampedScore}/100
              </span>
            </div>

            <div className="space-y-1.5">
              {appliedFactors.length > 0 ? (
                appliedFactors.map((factor) => (
                  <div
                    key={factor.factor}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800 capitalize truncate max-w-[200px]">
                      {factor.factor.replaceAll('_', ' ')}
                    </span>
                    <span className="font-mono font-bold text-[11px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                      +{factor.weight} pts
                    </span>
                  </div>
                ))
              ) : findings.length > 0 ? (
                findings.slice(0, 4).map((f) => {
                  const pts = f.severity === 'Critical' ? 35 : f.severity === 'High' ? 25 : f.severity === 'Medium' ? 15 : 5;
                  return (
                    <div
                      key={f.id}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                        {f.title}
                      </span>
                      <span className="font-mono font-bold text-[11px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                        +{pts} pts
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-500">
                  No adverse risk factors applied. Email evaluated as clean baseline.
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Recommended Actions */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Recommended Actions</span>
              </h3>
              <span className="text-[10px] text-slate-400">SOC Advisory</span>
            </div>

            {actions.length > 0 ? (
              <div className="space-y-2">
                {/* Primary Action Prominently Displayed */}
                <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-blue-700 shrink-0 mt-0.5">1.</span>
                    <span className="font-medium leading-relaxed">{actions[0]}</span>
                  </div>
                  <button
                    onClick={() => handleCopyAction(actions[0], 0)}
                    className="p-1 rounded hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer shrink-0"
                    title="Copy recommendation"
                  >
                    {copiedActionIndex === 0 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Secondary Actions */}
                {actions.slice(1).map((act, idx) => (
                  <div
                    key={act}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-400 shrink-0">{idx + 2}.</span>
                      <span className="leading-relaxed">{act}</span>
                    </div>
                    <button
                      onClick={() => handleCopyAction(act, idx + 1)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer shrink-0"
                      title="Copy recommendation"
                    >
                      {copiedActionIndex === idx + 1 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-500">
                No mitigation action required.
              </div>
            )}
          </div>
        </div>

        {/* D. KNOWLEDGE BASE MATCHES & SECURITY EVIDENCE */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>Grounded Knowledge Base & Taxonomy Evidence</span>
              <span className="text-[11px] font-normal text-slate-500">({allEvidence.length})</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">MITRE ATT&CK & OWASP</span>
          </div>

          {allEvidence.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allEvidence.map((ev) => (
                <a
                  key={ev.id}
                  href={ev.sourceUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-blue-700 hover:bg-blue-50/60 hover:border-blue-200 transition-all shadow-2xs group"
                >
                  <span className="font-bold text-indigo-700 text-[11px]">{ev.source || 'KB'}:</span>
                  <span className="truncate max-w-[280px] font-medium">{ev.title}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No external taxonomy articles required for this verification.</p>
          )}
        </div>

        {/* G. ANALYSIS PIPELINE & AUDIT TRAIL TIMELINE (Expandable Panel) */}
        {logs.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowPipelineDetails(!showPipelineDetails)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Detection Pipeline Latency & Audit Trail</span>
                <span className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                  {logs.length} Stages Recorded
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold">
                <span>{showPipelineDetails ? 'Hide Timeline' : 'View Timestamps'}</span>
                {showPipelineDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showPipelineDetails && (
              <div className="px-4 pb-3 pt-1 border-t border-slate-200/80 bg-white space-y-1.5">
                <div className="divide-y divide-slate-100 text-xs">
                  {logs.map((log) => (
                    <div key={log.id} className="py-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${log.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span className="font-semibold text-slate-900 capitalize shrink-0">
                          {log.component.replaceAll('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate max-w-sm">
                          {log.message}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold border ${statusStyle(log.status)}`}>
                          {log.status}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-slate-600">
                          {log.durationMs}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
