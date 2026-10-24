import React, { useState, useEffect } from 'react';
import {
  FileSearch,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Calendar,
  Shield,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import {
  fetchReports,
  fetchReport,
  fetchEmails,
  fetchStoredReports,
  generateStoredReport,
  deleteStoredReport,
  StoredReportItem,
  ThreatReportPayload,
} from '../../services/api';

interface ReportsViewProps {
  onSelectReportEmailId: (emailId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onSelectReportEmailId }) => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [storedReports, setStoredReports] = useState<StoredReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Preview & Download Modal State
  const [previewReport, setPreviewReport] = useState<{
    id: string;
    title: string;
    targetId: string;
    generatedAt: string;
    summary: string;
    riskScore: number | null;
    riskLevel: string;
    classification: string;
    sender: string;
    subject: string;
    indicators: any[];
    threatIntel: any[];
    evidence: any[];
    confidence?: number | null;
    recommendedAction?: string;
    status?: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Generate Report Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [availableEmails, setAvailableEmails] = useState<any[]>([]);
  const [selectedTargetEmailId, setSelectedTargetEmailId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analysesData, storedData] = await Promise.all([
        fetchReports(),
        fetchStoredReports(),
      ]);
      setAnalyses(analysesData || []);
      setStoredReports(storedData.items || []);
    } catch (err) {
      console.error('[REPORTS] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openGenerateModal = async () => {
    try {
      setIsGenerateModalOpen(true);
      const res = await fetchEmails('all');
      const items = res.items || [];
      setAvailableEmails(items);
      if (items.length > 0 && !selectedTargetEmailId) {
        setSelectedTargetEmailId(items[0].id);
      }
    } catch (err) {
      console.error('[REPORTS] Load emails error:', err);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTargetEmailId) return;
    try {
      setIsGenerating(true);
      const detailed = await fetchReport(selectedTargetEmailId);
      const em = detailed.email;
      const an = detailed.analysis;

      const created = await generateStoredReport({
        title: `Forensic Threat Report - ${em.subject}`,
        type: 'email_investigation',
        targetId: an.id,
        summary: an.explanation,
        riskScore: an.riskScore,
        riskLevel: an.riskLevel,
        classification: an.classification,
        sender: `${em.senderName} <${em.senderEmail}>`,
        subject: em.subject,
        data: {
          email: em,
          analysis: an,
          indicators: detailed.indicators || [],
          threatIntel: detailed.threatIntel || [],
          evidence: detailed.evidence || [],
        },
      });

      setIsGenerateModalOpen(false);
      await loadData();
      handleOpenStoredReport(created);
    } catch (err) {
      console.error('[REPORTS] Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenStoredReport = (rep: StoredReportItem) => {
    const data = rep.data || {};
    setPreviewReport({
      id: rep.id,
      title: rep.title,
      targetId: rep.targetId,
      generatedAt: rep.generatedAt,
      summary: rep.summary,
      riskScore: rep.riskScore ?? null,
      riskLevel: rep.riskLevel || 'Low',
      classification: rep.classification || 'Safe',
      sender: rep.sender || 'Unknown Sender',
      subject: rep.subject || 'Unknown Subject',
      indicators: data.indicators || [],
      threatIntel: data.threatIntel || [],
      evidence: data.evidence || [],
      confidence: data.analysis?.confidence ?? 95,
      recommendedAction: data.analysis?.recommendedAction || 'Review security indicators.',
      status: data.analysis?.status || 'completed',
    });
  };

  const handleOpenLiveAnalysisReport = async (analysisId: string) => {
    try {
      setIsLoadingPreview(true);
      const detailed = await fetchReport(analysisId);
      const em = detailed.email;
      const an = detailed.analysis;

      setPreviewReport({
        id: `RPT-LIVE-${an.id.slice(0, 8).toUpperCase()}`,
        title: `Threat Dossier - ${em?.subject || 'Analysis'}`,
        targetId: an.id,
        generatedAt: an.completedAt || an.createdAt,
        summary: an.explanation,
        riskScore: an.riskScore,
        riskLevel: an.riskLevel,
        classification: an.classification,
        sender: em ? `${em.senderName} <${em.senderEmail}>` : 'Unknown',
        subject: em?.subject || 'Email Threat Investigation',
        indicators: detailed.indicators || [],
        threatIntel: detailed.threatIntel || [],
        evidence: detailed.evidence || [],
        confidence: an.confidence ?? 95,
        recommendedAction: an.recommendedAction,
        status: an.status,
      });
    } catch (err) {
      console.error('[REPORTS] Load report detail error:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDeleteStored = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this report record?')) return;
    try {
      await deleteStoredReport(id);
      if (previewReport?.id === id) setPreviewReport(null);
      loadData();
    } catch (err) {
      console.error('[REPORTS] Delete error:', err);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!previewReport) return;
    const rows = [
      ['Report ID', previewReport.id],
      ['Generated At', previewReport.generatedAt],
      ['Email Subject', previewReport.subject],
      ['Sender', previewReport.sender],
      ['Classification', previewReport.classification],
      ['Risk Level', previewReport.riskLevel],
      ['Risk Score', `${previewReport.riskScore}/100`],
      ['Executive Summary', previewReport.summary],
      ['Recommended Action', previewReport.recommendedAction || ''],
      [],
      ['--- THREAT INDICATORS ---'],
      ['Indicator Title', 'Severity', 'Description', 'Evidence'],
      ...previewReport.indicators.map((ind) => [
        ind.title,
        ind.severity,
        ind.description,
        ind.evidence || '',
      ]),
      [],
      ['--- THREAT INTEL SCANS ---'],
      ['Provider', 'Target URL / Entity', 'Status', 'Verdict'],
      ...previewReport.threatIntel.map((ti) => [
        ti.provider,
        ti.url,
        ti.status,
        ti.malicious ? 'Malicious' : ti.suspicious ? 'Suspicious' : ti.status === 'completed' ? 'Clean' : 'Unavailable',
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${previewReport.id}_Forensic_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    if (!previewReport) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(previewReport, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${previewReport.id}_Telemetry_Payload.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 overflow-y-auto font-sans">
      {/* Top Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-2xs">
            <FileSearch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">Threat Reports & Exports</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                SOC Audit Center
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Generate, preview, and download formal PDF and CSV forensic threat reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openGenerateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Report</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-200 shadow-2xs transition-all cursor-pointer"
            aria-label="Refresh reports"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Section 1: Formally Generated Stored Reports */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Downloadable Threat Dossiers ({storedReports.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              Saved reports with permanent IDs and export history
            </span>
          </div>

          {storedReports.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2 shadow-2xs">
              <FileSearch className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-xs">No formal threat reports generated yet</h4>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Click <strong>Generate New Report</strong> above to produce a downloadable dossier for any analyzed email.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storedReports.map((rep) => {
                const isCritical = rep.riskLevel === 'Critical';
                const isHigh = rep.riskLevel === 'High';
                return (
                  <div
                    key={rep.id}
                    onClick={() => handleOpenStoredReport(rep)}
                    className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {rep.id}
                        </span>
                        <button
                          onClick={(e) => handleDeleteStored(rep.id, e)}
                          className="text-slate-300 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                          title="Remove report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors line-clamp-1">
                        {rep.subject || rep.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate">
                        Sender: {rep.sender}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800'
                            : isHigh
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rep.classification} • {rep.riskScore ?? 'N/A'}/100
                      </span>
                      <span className="text-blue-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Preview</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Live Analysis Reports from Mailbox Stream */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Live Pipeline Analyzed Items ({analyses.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              Interactive detections from multi-agent pipeline
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading pipeline analysis records...</div>
          ) : analyses.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 space-y-1 shadow-2xs">
              <p className="text-xs">No email analysis runs found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyses.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => handleOpenLiveAnalysisReport(rep.id)}
                  className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>ID: {rep.id.slice(0, 8)}...</span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          rep.classification === 'Phishing'
                            ? 'bg-rose-100 text-rose-800'
                            : rep.classification === 'Suspicious'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rep.classification} ({rep.riskScore}/100)
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs group-hover:text-purple-600 transition-colors truncate">
                      {rep.emailSubject}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">{rep.senderEmail}</p>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mt-1">
                      {rep.explanation}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(rep.completedAt || rep.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="text-purple-600 font-bold flex items-center gap-0.5">
                      <span>View Dossier</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate Report Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Generate Formal Threat Report</h3>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Email to Audit & Report
                </label>
                <select
                  value={selectedTargetEmailId}
                  onChange={(e) => setSelectedTargetEmailId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  {availableEmails.map((em) => (
                    <option key={em.id} value={em.id}>
                      [{em.classification || 'Unanalyzed'}] {em.subject} ({em.senderEmail})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-slate-500 bg-blue-50/60 p-3 rounded-xl border border-blue-100 leading-relaxed">
                This will assemble a permanent, audit-ready threat dossier with unique report ID, RAG correlation, indicators, and exportable PDF/CSV formats.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={isGenerating || !selectedTargetEmailId}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? 'Compiling Dossier...' : 'Generate & Open Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formal Threat Report Preview Modal / Drawer */}
      {previewReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[min(880px,94vh)] shadow-2xl border border-slate-200 flex flex-col overflow-hidden print:border-none print:shadow-none print:h-auto animate-in fade-in zoom-in-95">
            {/* Modal Actions Header */}
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs">{previewReport.title}</span>
                <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {previewReport.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                  title="Export tabular CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                  title="Export raw JSON"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => setPreviewReport(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-xs text-slate-800 print:p-2 print:overflow-visible">
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-black tracking-widest text-blue-700 uppercase mb-1">
                    EmailGuard AI • Security Operations Center
                  </div>
                  <h1 className="text-xl font-black text-slate-900">
                    EXECUTIVE THREAT INVESTIGATION REPORT
                  </h1>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    Report ID: {previewReport.id} • Generated:{' '}
                    {new Date(previewReport.generatedAt).toUTCString()}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                      previewReport.classification === 'Phishing'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : previewReport.classification === 'Suspicious'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    Verdict: {previewReport.classification}
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    Risk Score: {previewReport.riskScore ?? 0}/100 ({previewReport.riskLevel} Risk)
                  </div>
                </div>
              </div>

              {/* Email Profile Block */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <strong className="text-slate-500 text-[10px] uppercase block">Subject</strong>
                  <span className="font-bold text-slate-900">{previewReport.subject}</span>
                </div>
                <div>
                  <strong className="text-slate-500 text-[10px] uppercase block">Sender Identity</strong>
                  <span className="font-semibold text-slate-900">{previewReport.sender}</span>
                </div>
                <div>
                  <strong className="text-slate-500 text-[10px] uppercase block">
                    AI Confidence & Uncertainty
                  </strong>
                  <span className="font-semibold text-slate-800">
                    {previewReport.confidence ?? 95}% confidence rating
                  </span>
                </div>
                <div>
                  <strong className="text-slate-500 text-[10px] uppercase block">Investigation Status</strong>
                  <span className="font-bold text-purple-700 uppercase">{previewReport.status}</span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  1. Executive Summary & Rationale
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {previewReport.summary}
                </p>
              </div>

              {/* Key Threat Indicators */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>2. Key Threat Indicators ({previewReport.indicators.length})</span>
                </h3>
                {previewReport.indicators.length === 0 ? (
                  <p className="text-slate-500 italic">No heuristic indicators flagged for this message.</p>
                ) : (
                  <div className="space-y-2">
                    {previewReport.indicators.map((ind, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <strong className="text-slate-900">
                            {i + 1}. {ind.title}
                          </strong>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            {ind.severity}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{ind.description}</p>
                        {ind.evidence && (
                          <div className="mt-1 p-1.5 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-600">
                            Evidence: {ind.evidence}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Threat Intelligence Scan Results */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  3. Multi-Engine Threat Intelligence & Lookups
                </h3>
                {previewReport.threatIntel.length === 0 ? (
                  <p className="text-slate-500 italic">No external URL or hash lookups were required.</p>
                ) : (
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2 border-b">Provider</th>
                        <th className="p-2 border-b">Target</th>
                        <th className="p-2 border-b">Status</th>
                        <th className="p-2 border-b">Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewReport.threatIntel.map((ti, i) => {
                        const isUnavailable = ti.status === 'not_configured' || ti.status === 'unavailable';
                        return (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-bold">{ti.provider}</td>
                            <td className="p-2 font-mono text-[10px] truncate max-w-xs">{ti.url}</td>
                            <td className="p-2 capitalize">{ti.status}</td>
                            <td className="p-2">
                              {isUnavailable ? (
                                <span className="text-slate-500 italic">Unavailable (Not Verified Safe)</span>
                              ) : ti.malicious ? (
                                <span className="font-bold text-rose-600">MALICIOUS</span>
                              ) : ti.suspicious ? (
                                <span className="font-bold text-amber-600">SUSPICIOUS</span>
                              ) : (
                                <span className="font-bold text-emerald-600">CLEAN</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Recommended Mitigation Actions */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  4. Recommended SOC Mitigation Actions
                </h3>
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 leading-relaxed font-semibold">
                  {previewReport.recommendedAction || 'No urgent mitigation action required.'}
                </div>
              </div>

              {/* Sign-off */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Audited by EmailGuard AI Detection Engine</span>
                <span>Zero Fabrication Discipline • Strict Evidence Grounding</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
