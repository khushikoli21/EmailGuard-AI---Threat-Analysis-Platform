import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Layers,
  Database,
} from 'lucide-react';
import { fetchEvaluation, runEvaluation, EvaluationBenchmarkData } from '../../services/api';

export const EvaluationView: React.FC = () => {
  const [data, setData] = useState<EvaluationBenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState('nazario-enron-split');
  const [customCsvInput, setCustomCsvInput] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [expandedSampleId, setExpandedSampleId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchEvaluation();
      setData(res);
    } catch (err) {
      console.error('[EVAL] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExecuteBenchmark = async () => {
    try {
      setIsRunning(true);
      const res = await runEvaluation(selectedDatasetId);
      if (res.run) {
        setData((prev) => (prev ? { ...prev, latestRun: res.run } : null));
      }
    } catch (err: any) {
      console.error('[EVAL] Execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCustomUpload = async () => {
    if (!customCsvInput.trim()) return;
    try {
      setIsRunning(true);
      // Parse CSV lines: subject,senderEmail,body,groundTruth
      const lines = customCsvInput.trim().split('\n');
      const samples = [];
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 4) {
          samples.push({
            id: `custom-${i + 1}`,
            subject: parts[0],
            senderEmail: parts[1],
            body: parts[2],
            groundTruth: parts[3],
          });
        }
      }

      if (samples.length > 0) {
        const res = await runEvaluation(selectedDatasetId, samples);
        if (res.run) {
          setData((prev) => (prev ? { ...prev, latestRun: res.run } : null));
          setShowUploadModal(false);
          setCustomCsvInput('');
        }
      }
    } catch (err) {
      console.error('[EVAL] Custom upload run error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const latestRun = data?.latestRun;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5" />
              Academic Research Harness
            </span>
            <span className="text-xs text-slate-500 font-medium">Offline Dataset Evaluation</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Threat Detection Benchmark & Performance Metrics
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Empirical validation harness evaluating the multi-agent detection pipeline against offline cybersecurity test corpora. Metrics are computed strictly on-demand from real execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(!showUploadModal)}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Upload Dataset CSV</span>
          </button>

          <button
            onClick={handleExecuteBenchmark}
            disabled={isRunning}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Evaluating Samples...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Execute Benchmark Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Modal Drawer */}
      {showUploadModal && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              Custom CSV Dataset Ingestion
            </h4>
            <button
              onClick={() => setShowUploadModal(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-500 font-sans">
            Paste test email samples in comma-separated format: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">subject,senderEmail,body,groundTruth</code>
          </p>
          <textarea
            rows={4}
            value={customCsvInput}
            onChange={(e) => setCustomCsvInput(e.target.value)}
            placeholder="Security Alert: Urgent Action,security@bank-verify.com,Please reset password immediately at http://verify-portal.co,Phishing&#10;Team Sync Tomorrow,colleague@company.com,Hi team lets meet tomorrow at 10am in room 2B,Safe"
            className="w-full text-xs font-mono p-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowUploadModal(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomUpload}
              disabled={isRunning || !customCsvInput.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Parse & Run Benchmark
            </button>
          </div>
        </div>
      )}

      {/* Dataset Selection Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-700">Target Corpus:</span>
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden"
          >
            {data?.datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.totalSamples} test emails)
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>Evaluation protocol: Ground truth comparison against pipeline classification</span>
        </div>
      </div>

      {/* Academic Truth Notice */}
      <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900 text-xs space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-purple-800">
          <Info className="w-4 h-4 text-purple-600 shrink-0" />
          <span>Research Integrity & Reproducibility Notice</span>
        </div>
        <p className="text-purple-700 leading-relaxed text-[11px]">
          In accordance with academic standards, no hardcoded or fabricated scores (accuracy, recall, precision, F1) are displayed. The cards below reflect only real, executed test pipeline results against verified ground-truth test items.
        </p>
      </div>

      {/* 4 Main Benchmark Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Accuracy */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Accuracy
            </span>
            <span className="text-[10px] font-mono text-slate-400">(TP + TN) / Total</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">
            {latestRun ? `${latestRun.metrics.accuracy}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500">
            {latestRun ? `Computed over ${latestRun.totalEvaluated} emails` : 'Awaiting benchmark run'}
          </div>
        </div>

        {/* Precision */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Precision
            </span>
            <span className="text-[10px] font-mono text-slate-400">TP / (TP + FP)</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-blue-600">
            {latestRun ? `${latestRun.metrics.precision}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500">
            {latestRun ? 'True positive threat fraction' : 'Awaiting benchmark run'}
          </div>
        </div>

        {/* Recall */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Recall
            </span>
            <span className="text-[10px] font-mono text-slate-400">TP / (TP + FN)</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-600">
            {latestRun ? `${latestRun.metrics.recall}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500">
            {latestRun ? 'Threat sensitivity rate' : 'Awaiting benchmark run'}
          </div>
        </div>

        {/* F1 Score */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Macro F1-Score
            </span>
            <span className="text-[10px] font-mono text-slate-400">2·(P·R)/(P+R)</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-purple-600">
            {latestRun ? `${latestRun.metrics.f1Score}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500">
            {latestRun ? 'Harmonic balance index' : 'Awaiting benchmark run'}
          </div>
        </div>
      </div>

      {/* Confusion Matrix & Execution Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Confusion Matrix Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Confusion Matrix</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Binary Threat vs Safe
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-slate-100 text-slate-600 font-bold p-2 text-center text-[11px]">
              <div>Ground Truth \ Prediction</div>
              <div>Predicted Threat</div>
              <div>Predicted Safe</div>
            </div>

            <div className="grid grid-cols-3 p-3 border-t border-slate-100 items-center text-center">
              <div className="font-bold text-slate-700 text-left pl-2">Actual Threat</div>
              <div className="p-2 rounded bg-emerald-50 text-emerald-800 font-mono font-bold text-sm">
                TP: {latestRun?.confusionMatrix.truePositives ?? '—'}
              </div>
              <div className="p-2 rounded bg-rose-50 text-rose-800 font-mono font-bold text-sm">
                FN: {latestRun?.confusionMatrix.falseNegatives ?? '—'}
              </div>
            </div>

            <div className="grid grid-cols-3 p-3 border-t border-slate-100 items-center text-center">
              <div className="font-bold text-slate-700 text-left pl-2">Actual Safe</div>
              <div className="p-2 rounded bg-rose-50 text-rose-800 font-mono font-bold text-sm">
                FP: {latestRun?.confusionMatrix.falsePositives ?? '—'}
              </div>
              <div className="p-2 rounded bg-emerald-50 text-emerald-800 font-mono font-bold text-sm">
                TN: {latestRun?.confusionMatrix.trueNegatives ?? '—'}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            * True Positive (TP): Phishing/Suspicious correctly flagged. False Negative (FN): Phishing missed.
          </p>
        </div>

        {/* Benchmark Execution Telemetry */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Execution Telemetry & Benchmark Spec</span>
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Corpus Evaluated:</span>
              <span className="font-semibold text-slate-800 font-mono">
                {latestRun?.datasetName || 'None yet'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Timestamp:</span>
              <span className="font-mono text-slate-800">
                {latestRun?.executedAt ? new Date(latestRun.executedAt).toLocaleString() : '—'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Total Run Duration:</span>
              <span className="font-mono text-slate-800">
                {latestRun ? `${latestRun.durationMs} ms` : '—'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Average Latency per Email:</span>
              <span className="font-mono text-slate-800">
                {latestRun && latestRun.totalEvaluated > 0
                  ? `${Math.round(latestRun.durationMs / latestRun.totalEvaluated)} ms / item`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Pipeline Stages Checked:</span>
              <span className="font-mono text-emerald-600 font-semibold">
                Email NLP · OWASP LLM01 · Deterministic Risk
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Sample Audit Trail Table */}
      {latestRun && latestRun.samples && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Per-Sample Benchmark Audit Trail ({latestRun.samples.length} items)</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Sender Email</th>
                  <th className="py-2.5 px-3">Ground Truth</th>
                  <th className="py-2.5 px-3">Predicted</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {latestRun.samples.map((s) => {
                  const isExpanded = expandedSampleId === s.id;
                  return (
                    <React.Fragment key={s.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          {s.isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Match
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              Mismatch
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-xs truncate">
                          {s.subject}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] truncate">
                          {s.senderEmail}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                            {s.groundTruth}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              s.predictedClass === 'Phishing'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : s.predictedClass === 'Suspicious'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {s.predictedClass}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                          {s.riskScore}/100
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => setExpandedSampleId(isExpanded ? null : s.id)}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Details</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={7} className="p-3 text-xs text-slate-600 font-sans space-y-1">
                            <div className="font-semibold text-slate-800 text-[11px]">
                              Detection Rationale:
                            </div>
                            <p className="text-[11px] leading-relaxed">{s.explanation}</p>
                            <div className="text-[10px] font-mono text-slate-400">
                              Indicators Detected: {s.indicatorsCount}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
