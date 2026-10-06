import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Clock,
  Play,
  Database,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DatasetEvaluationPlaceholders } from '../types';
import { fetchEvaluation } from '../services/api';
import { LoadingState } from '../components/common/LoadingState';

export const EvaluationPage: React.FC = () => {
  const [evaluation, setEvaluation] = useState<DatasetEvaluationPlaceholders | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState('Enron + Nazario Phishing Corpus (Split 80/20)');
  const [showRunNotice, setShowRunNotice] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchEvaluation();
        setEvaluation(data);
      } catch (err) {
        console.error('Failed to load evaluation placeholders:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !evaluation) {
    return <LoadingState message="Connecting to evaluation framework..." fullPage />;
  }

  const metricCards = [
    { label: 'Classification Accuracy', key: 'accuracy', value: evaluation.accuracy },
    { label: 'Macro Precision', key: 'precision', value: evaluation.precision },
    { label: 'Macro Recall', key: 'recall', value: evaluation.recall },
    { label: 'Macro F1-Score', key: 'f1Score', value: evaluation.f1Score },
  ];

  const classLabels = ['Safe', 'Suspicious', 'Phishing', 'Spam'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Academic Validation Harness
            </span>
            <span className="text-xs text-slate-500">Framework Stage 2</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Dataset Evaluation & Performance Metrics</h2>
          <p className="text-xs text-slate-500">
            Empirical benchmark harness for multi-agent threat classification across standard cybersecurity corpora
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRunNotice(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Execute Benchmark Run</span>
          </button>
        </div>
      </div>

      {/* Prominent Academic Status Banner */}
      <div className="p-4 sm:p-5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3.5">
        <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
          <Clock className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-amber-900 text-sm">
            Evaluation Results Pending Backend Execution
          </h4>
          <p className="text-amber-800 leading-relaxed font-sans">
            <strong>"{evaluation.message}"</strong>
          </p>
          <p className="text-amber-700 leading-relaxed pt-1">
            In strict compliance with academic research integrity, no synthetic or fabricated performance figures (e.g. 91% accuracy or 0.89 F1) are displayed on the frontend. Metrics and the confusion matrix will dynamically populate once the model evaluation script is triggered on your FastAPI backend (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">POST /api/evaluation/run</code>).
          </p>
        </div>
      </div>

      {/* Dataset Selection & Upload Placeholder Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Target Benchmark Corpus</h3>
            <p className="text-xs text-slate-500">
              Select or provide pre-labeled email datasets for cross-validation testing
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            Format: CSV / JSONL with ground_truth_label
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-700">Select Dataset Registry:</label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Enron + Nazario Phishing Corpus (Split 80/20)">
                Enron + Nazario Phishing Corpus (Standard Academic Benchmark)
              </option>
              <option value="IWSPA-AP Phishing Corpus 2026">
                IWSPA-AP Phishing Corpus (Multi-class with BEC Pretexts)
              </option>
              <option value="Adversarial Prompt Injection Evaluation Suite (Custom)">
                Adversarial Prompt Injection Evaluation Suite (50 Injections + 50 Clean)
              </option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Total Samples:</label>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
              {evaluation.totalSamples !== null ? evaluation.totalSamples : 'Calculated on backend load (e.g. 1,000+)'}
            </div>
          </div>
        </div>

        {/* Dataset Drag & Drop placeholder UI */}
        <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/40 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800">Upload Custom Benchmark Dataset</span>
            <p className="text-[11px] text-slate-500">
              Drag and drop .csv or .jsonl containing email text and ground-truth classes
            </p>
          </div>
          <p className="text-[10px] font-mono text-slate-400">
            Schema: &#123; "email_id": str, "body": str, "ground_truth": "Safe" | "Suspicious" | "Phishing" | "Spam" &#125;
          </p>
        </div>
      </div>

      {/* 4 Performance Metric Placeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => (
          <div
            key={metric.key}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {metric.label}
            </div>
            <div className="text-2xl font-bold font-mono text-slate-400">
              {metric.value !== null ? `${(metric.value * 100).toFixed(1)}%` : '—'}
            </div>
            <div className="text-[11px] text-slate-400 font-sans flex items-center gap-1.5 pt-1 border-t border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Awaiting model inference run</span>
            </div>
          </div>
        ))}
      </div>

      {/* Confusion Matrix Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Confusion Matrix Structure</h3>
            <p className="text-xs text-slate-500">
              Multi-class contingency table: Predicted Classes vs. Ground Truth Classes
            </p>
          </div>
          <span className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Status: Matrix Unpopulated
          </span>
        </div>

        {/* Matrix Visualization Container */}
        <div className="overflow-x-auto py-2">
          <div className="min-w-[500px] max-w-lg mx-auto">
            <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Predicted Classification →
            </div>

            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-xs font-bold text-slate-400 text-left w-28">
                    Actual Class ↓
                  </th>
                  {classLabels.map((label) => (
                    <th
                      key={label}
                      className="p-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classLabels.map((actualLabel, rIdx) => (
                  <tr key={actualLabel}>
                    <td className="p-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 text-left">
                      {actualLabel}
                    </td>
                    {classLabels.map((predLabel, cIdx) => (
                      <td
                        key={predLabel}
                        className="p-3 border border-slate-200 font-mono text-xs text-slate-400 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="py-2">
                          <span className="text-sm font-semibold text-slate-300">—</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 text-center text-xs text-slate-400 font-mono">
              Cells will calculate true positives, false positives, false negatives upon backend evaluation.
            </div>
          </div>
        </div>
      </div>

      {/* Backend API Contract Explanation */}
      <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl p-5 space-y-2">
        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
          Expected FastAPI Backend Integration Schema
        </h4>
        <p className="text-xs text-slate-300">
          When implementing your Python test runner, expose the evaluation results at:
        </p>
        <div className="p-3 bg-black/40 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
          GET /api/evaluation → &#123;<br />
          &nbsp;&nbsp;"datasetName": "Enron-Phishing-v1",<br />
          &nbsp;&nbsp;"totalSamples": 1250,<br />
          &nbsp;&nbsp;"accuracy": 0.924,<br />
          &nbsp;&nbsp;"precision": 0.901,<br />
          &nbsp;&nbsp;"recall": 0.895,<br />
          &nbsp;&nbsp;"f1Score": 0.898,<br />
          &nbsp;&nbsp;"confusionMatrix": &#123; "labels": ["Safe", "Suspicious", "Phishing", "Spam"], "matrix": [[...]] &#125;<br />
          &#125;
        </div>
      </div>

      {/* Modal notice when user clicks Execute */}
      {showRunNotice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Backend Test Harness Required</h3>
              <p className="text-xs text-slate-500">
                Evaluation runs require executing model inference against the target dataset on your FastAPI backend server.
              </p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
              Target endpoint: POST /api/evaluation/run
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setShowRunNotice(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
