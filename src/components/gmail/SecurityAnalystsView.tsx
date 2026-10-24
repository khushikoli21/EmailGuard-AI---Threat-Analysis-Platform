import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Terminal,
  Activity,
  Layers,
  Database,
  Cpu,
  Loader2,
  RefreshCw,
  Clock,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import {
  EmailRecord,
  AnalysisRecord,
  IndicatorRecord,
  ThreatIntelRecord,
  EvidenceRecord,
  PipelineLogRecord,
  fetchEmails,
  fetchReport,
  analyzeEmail,
  TriageItem,
  fetchTriageItems,
} from '../../services/api';
import { ThreatChatbot } from './ThreatChatbot';
import DOMPurify from 'dompurify';

interface SecurityAnalystsViewProps {
  initialEmailId?: string;
  initialTriageId?: string;
  onNavigateToReport?: (reportId: string) => void;
}

export const SecurityAnalystsView: React.FC<SecurityAnalystsViewProps> = ({
  initialEmailId,
  initialTriageId,
  onNavigateToReport,
}) => {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(initialEmailId || null);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [indicators, setIndicators] = useState<IndicatorRecord[]>([]);
  const [threatIntel, setThreatIntel] = useState<ThreatIntelRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [pipelineLogs, setPipelineLogs] = useState<PipelineLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'intel' | 'telemetry'>('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Load investigated emails list
  const loadInvestigatedEmails = async () => {
    try {
      setIsLoading(true);
      const res = await fetchEmails('all');
      const allEmails = res.items || [];
      setEmails(allEmails);

      // If initialEmailId provided, select it, otherwise select first email with threat or first email
      const targetId =
        initialEmailId ||
        allEmails.find((e) => e.classification === 'Phishing' || e.classification === 'Suspicious')?.id ||
        allEmails[0]?.id ||
        null;

      if (targetId) {
        setSelectedEmailId(targetId);
        await loadEmailAnalysis(targetId);
      }
    } catch (err) {
      console.error('[ANALYST] Failed to load emails:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmailAnalysis = async (emailId: string) => {
    try {
      setIsAnalyzing(true);
      const report = await fetchReport(emailId);
      setSelectedEmail(report.email);
      setAnalysis(report.analysis);
      setIndicators(report.indicators || []);
      setThreatIntel(report.threatIntel || []);
      setEvidence(report.evidence || []);
      setPipelineLogs(report.pipelineLogs || []);
    } catch (err) {
      console.warn('[ANALYST] No existing analysis report, initiating live pipeline:', err);
      try {
        const fresh = await analyzeEmail(emailId);
        setSelectedEmail(fresh.email);
        setAnalysis(fresh.analysis);
        setIndicators(fresh.indicators || []);
        setThreatIntel(fresh.threatIntel || []);
        setEvidence(fresh.evidence || []);
        setPipelineLogs(fresh.pipelineLogs || []);
      } catch (pipelineErr) {
        console.error('[ANALYST] Pipeline execution failed:', pipelineErr);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    loadInvestigatedEmails();
  }, []);

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    loadEmailAnalysis(id);
  };

  const getRiskColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', badge: 'bg-rose-600 text-white' };
      case 'high':
        return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', badge: 'bg-orange-600 text-white' };
      case 'medium':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', badge: 'bg-amber-600 text-white' };
      default:
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', badge: 'bg-emerald-600 text-white' };
    }
  };

  const colors = getRiskColor(analysis?.riskLevel || selectedEmail?.riskLevel);
  const filteredEmails = emails.filter(
    (e) =>
      e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.senderEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-hidden font-sans">
      {/* Workspace Sub-header */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">Security Analyst Workspace</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
                Grounded AI Triage
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive threat investigation, concise findings, and AI chat assistant.
            </p>
          </div>
        </div>

        {selectedEmail && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => selectedEmailId && loadEmailAnalysis(selectedEmailId)}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>Re-run Pipeline</span>
            </button>
            {onNavigateToReport && (
              <button
                onClick={() => onNavigateToReport(analysis?.id || selectedEmail.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Formal Report</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Left Selector Sidebar + Right Analyst Stage */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Column: Email Investigation Selector */}
        <div className="w-72 lg:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-0">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search investigated emails..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredEmails.map((em) => {
              const isSelected = em.id === selectedEmailId;
              const emRisk = em.riskLevel || 'Low';
              return (
                <div
                  key={em.id}
                  onClick={() => handleSelectEmail(em.id)}
                  className={`p-3 transition-all cursor-pointer hover:bg-slate-50/80 ${
                    isSelected ? 'bg-purple-50/50 border-l-4 border-purple-600' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-bold text-slate-800 truncate">
                      {em.senderName}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                        emRisk === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : emRisk === 'High'
                          ? 'bg-orange-100 text-orange-800'
                          : emRisk === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {emRisk}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 truncate mb-1">
                    {em.subject}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {new Date(em.receivedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center & Right Column: Security Analysis Workspace */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-slate-50/50">
          {isAnalyzing ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Processing Security Pipeline...</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Executing heuristic extraction, RAG grounding, and deterministic risk evaluation.
              </p>
            </div>
          ) : selectedEmail && analysis ? (
            <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
              {/* 1. Concise Diagrammatic Pipeline Flow */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Detection Pipeline Lifecycle</span>
                  <span className="text-purple-600 font-bold lowercase text-[11px]">
                    deterministic & explainable
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-800 flex items-center justify-center gap-1 mb-1">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ingestion</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Normalized</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-800 flex items-center justify-center gap-1 mb-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>Indicators</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{indicators.length} Flagged</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-800 flex items-center justify-center gap-1 mb-1">
                      <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Threat Intel</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {threatIntel.length > 0 ? `${threatIntel.length} Scans` : 'None Needed'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-800 flex items-center justify-center gap-1 mb-1">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      <span>RAG Grounding</span>
                    </div>
                    <span className="text-[10px] text-slate-500">MITRE / OWASP</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-800 flex items-center justify-center gap-1 mb-1">
                      <Cpu className="w-3.5 h-3.5 text-purple-600" />
                      <span>Risk Engine</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700">
                      Score: {analysis.riskScore}/100
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${colors.bg} ${colors.border}`}>
                    <div className={`font-bold flex items-center justify-center gap-1 mb-1 ${colors.text}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{analysis.classification}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${colors.text}`}>
                      {analysis.riskLevel} Level
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Top Threat Summary & Risk Score Hero Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                      {analysis.classification} Verdict
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Confidence: {analysis.confidence ?? 95}%
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 leading-snug">
                    {selectedEmail.subject}
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {analysis.explanation}
                  </p>
                  <div className="pt-1 flex items-center gap-4 text-[11px] text-slate-500">
                    <span>
                      <strong>Sender:</strong> {selectedEmail.senderName} ({selectedEmail.senderEmail})
                    </span>
                    <span>
                      <strong>Recipient:</strong> {selectedEmail.recipientEmail}
                    </span>
                  </div>
                </div>

                {/* Score Gauge Circle Badge */}
                <div className="flex flex-col items-center justify-center shrink-0 w-32 h-32 rounded-2xl bg-slate-50 border border-slate-200 p-3 text-center shadow-inner">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Calculated Risk
                  </span>
                  <div className={`text-3xl font-black mt-1 ${colors.text}`}>
                    {analysis.riskScore}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">out of 100</span>
                  <span className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${colors.badge}`}>
                    {analysis.riskLevel} Risk
                  </span>
                </div>
              </div>

              {/* 3. Main Workspace Split: Findings & Chatbot */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Side: Top 3-5 Indicators + Scans + Recommendation (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Top 3-5 Indicators */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>Key Threat Indicators ({indicators.length})</span>
                      </h3>
                      <span className="text-[11px] text-slate-400">Ranked by severity</span>
                    </div>

                    {indicators.length === 0 ? (
                      <div className="p-4 bg-emerald-50 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>No suspicious markers, script payloads, or deceptive headers detected.</span>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {indicators.slice(0, 5).map((ind, i) => (
                          <div
                            key={ind.id}
                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">
                                {i + 1}. {ind.title}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  ind.severity === 'Critical'
                                    ? 'bg-rose-100 text-rose-800'
                                    : ind.severity === 'High'
                                    ? 'bg-orange-100 text-orange-800'
                                    : ind.severity === 'Medium'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {ind.severity}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {ind.description}
                            </p>
                            {ind.evidence && (
                              <div className="bg-white p-2 rounded-lg border border-slate-200 text-[10px] font-mono text-slate-600">
                                Matched Evidence: {ind.evidence}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* External Threat Intelligence Status Cards */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-indigo-500" />
                        <span>URL & File Scan Verification</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Explicit clean vs unavailable discipline
                      </span>
                    </h3>

                    {threatIntel.length === 0 ? (
                      <p className="text-xs text-slate-500 p-2">
                        No URLs or attachment hashes were submitted for external threat intelligence lookups.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {threatIntel.map((ti) => {
                          const isUnavailable = ti.status === 'not_configured' || ti.status === 'unavailable';
                          const isMalicious = ti.malicious;
                          return (
                            <div
                              key={ti.id}
                              className={`p-3 rounded-xl border text-xs space-y-1 ${
                                isMalicious
                                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                                  : isUnavailable
                                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span>{ti.provider}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded-md uppercase font-extrabold ${
                                    isMalicious
                                      ? 'bg-rose-200 text-rose-900'
                                      : isUnavailable
                                      ? 'bg-slate-200 text-slate-700'
                                      : 'bg-emerald-200 text-emerald-900'
                                  }`}
                                >
                                  {isUnavailable ? 'Unavailable / Not Configured' : isMalicious ? 'Malicious' : 'Clean'}
                                </span>
                              </div>
                              <p className="text-[10px] font-mono truncate">{ti.url}</p>
                              {isUnavailable && (
                                <p className="text-[10px] text-slate-400 italic">
                                  Lookup unperformed (missing secret key); not evidence of clean status.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Recommended Next Steps */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Recommended SOC Mitigation Action</span>
                    </h3>
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs font-medium text-blue-900 leading-relaxed">
                      {analysis.recommendedAction ||
                        'Review all flagged indicators with the sender out-of-band before taking action on links or attachments.'}
                    </div>
                  </div>
                </div>

                {/* Right Side: Interactive AI Chatbot (5 cols) */}
                <div className="lg:col-span-5 h-[560px] sticky top-6">
                  <ThreatChatbot
                    contextType="analyst"
                    emailId={selectedEmail.id}
                    analysisId={analysis.id}
                    title="Analyst AI Copilot"
                  />
                </div>
              </div>

              {/* 4. Expandable Technical Tabs: RAG Taxonomy & Telemetry */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-3 border-b-2 cursor-pointer transition-all ${
                      activeTab === 'overview'
                        ? 'border-purple-600 text-purple-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Grounded RAG Evidence ({evidence.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('telemetry')}
                    className={`px-4 py-3 border-b-2 cursor-pointer transition-all ${
                      activeTab === 'telemetry'
                        ? 'border-purple-600 text-purple-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pipeline Latency Telemetry ({pipelineLogs.length})
                  </button>
                </div>

                <div className="p-6">
                  {activeTab === 'overview' ? (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 mb-3">
                        Taxonomy documents correlated from the MITRE ATT&CK & OWASP Top 10 Knowledge Base:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {evidence.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">{ev.title}</span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {ev.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {ev.description}
                            </p>
                            {ev.source && (
                              <span className="text-[10px] text-purple-600 font-medium">
                                Source: {ev.source}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 mb-3">
                        Real component execution timestamps and latency tracking:
                      </p>
                      <div className="divide-y divide-slate-100 text-xs">
                        {pipelineLogs.map((log) => (
                          <div key={log.id} className="py-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <strong className="text-slate-800 capitalize">
                                {log.component.replace('_', ' ')}
                              </strong>
                              <span className="text-slate-400 text-[11px] truncate max-w-md">
                                {log.message}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] font-bold text-purple-700 shrink-0">
                              {log.durationMs}ms
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8">
              <Shield className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Select an email to analyze</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Choose an item from the left panel to inspect detailed indicators, RAG evidence, and engage the AI copilot.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
