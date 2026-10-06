import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { ThreatReport, EmailRecord } from '../../types';
import { ThreatBadge } from '../common/ThreatBadge';
import { RiskScoreBar } from '../common/RiskScoreBar';
import { PromptInjectionAlert } from '../common/PromptInjectionAlert';
import { IndicatorCard } from './IndicatorCard';
import { EvidenceCard } from './EvidenceCard';
import { EmailSummaryCard } from './EmailSummaryCard';
import { AnalysisPipeline } from './AnalysisPipeline';

interface ThreatReportViewProps {
  report: ThreatReport;
  email: EmailRecord;
  onBackToInbox: () => void;
}

export const ThreatReportView: React.FC<ThreatReportViewProps> = ({
  report,
  email,
  onBackToInbox,
}) => {
  const handleExportJson = () => {
    const payload = JSON.stringify({ email, report }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat-report-${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRecommendedActionStyles = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('safe')) {
      return {
        bg: 'bg-emerald-50 border-emerald-300',
        text: 'text-emerald-900',
        icon: ShieldCheck,
        badge: 'bg-emerald-200 text-emerald-800',
      };
    }
    if (lower.includes('quarantine') || lower.includes('delete') || lower.includes('do not click')) {
      return {
        bg: 'bg-rose-50 border-rose-300',
        text: 'text-rose-900',
        icon: ShieldAlert,
        badge: 'bg-rose-200 text-rose-800',
      };
    }
    return {
      bg: 'bg-amber-50 border-amber-300',
      text: 'text-amber-900',
      icon: AlertTriangle,
      badge: 'bg-amber-200 text-amber-800',
    };
  };

  const recStyles = getRecommendedActionStyles(report.recommended_action);
  const RecIcon = recStyles.icon;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBackToInbox}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Inbox / Triage</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON Dossier</span>
          </button>
        </div>
      </div>

      {/* Prompt Injection Warning Banner (Prominently rendered if detected) */}
      {report.prompt_injection_suspected && (
        <PromptInjectionAlert
          suspected={report.prompt_injection_suspected}
          details={report.prompt_injection_details}
        />
      )}

      {/* Main Threat Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
        {/* Title, Classification & Metadata */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-1">
              <span>REPORT REF: {report.id}</span>
              <span>·</span>
              <span>SYNTHESIZED: {report.generatedAt}</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {report.classification.toUpperCase()} VERDICT
              </h2>
              <ThreatBadge classification={report.classification} size="lg" />
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {report.confidence !== null && (
              <div className="text-right">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Model Confidence
                </div>
                <div className="font-mono text-base font-bold text-slate-800">
                  {report.confidence}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Large Dynamic Risk Meter */}
        <RiskScoreBar score={report.risk_score} size="lg" />

        {/* Recommended Action Card (Prominent SOC Card) */}
        <div className={`p-4 sm:p-5 rounded-xl border-2 ${recStyles.bg} flex items-start gap-4`}>
          <div className="p-2.5 bg-white rounded-lg shadow-2xs shrink-0">
            <RecIcon className="w-5 h-5 text-slate-800" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recommended Action
              </h3>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${recStyles.badge}`}>
                Triage Directive
              </span>
            </div>
            <p className={`text-sm font-semibold ${recStyles.text} leading-relaxed`}>
              {report.recommended_action}
            </p>
          </div>
        </div>

        {/* Explanation Section: "Why was this email flagged?" */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Why was this email flagged?</h3>
            <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
              Natural Language Rationale
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-sans">
            {report.explanation}
          </p>
        </div>
      </div>

      {/* Multi-Agent Analysis Pipeline */}
      <AnalysisPipeline stages={report.pipelineStages} />

      {/* Threat Indicators Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Indicators Detected</h3>
            <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {report.indicators.length} Found
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Categorized by MITRE & threat vector taxonomies
          </span>
        </div>

        {report.indicators.length === 0 ? (
          <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
            ✓ No suspicious threat indicators were flagged for this submission.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.indicators.map((ind) => (
              <IndicatorCard key={ind.id} indicator={ind} />
            ))}
          </div>
        )}
      </div>

      {/* Major Evidence Section: Separated into 3 Pillars */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Multi-Source Evidence Traceability</h3>
            <p className="text-xs text-slate-500">
              Grounding telemetry derived from content parsing, external threat intelligence, and vectorized RAG memory
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Column A: Email Evidence */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                A. Email Evidence
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {report.evidence.emailEvidence.length} Signals
              </span>
            </div>
            <div className="space-y-2.5">
              {report.evidence.emailEvidence.map((item) => (
                <EvidenceCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Column B: Threat Intelligence Evidence */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                B. Threat Intelligence
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {report.evidence.threatIntelEvidence.length} Signals
              </span>
            </div>
            <div className="space-y-2.5">
              {report.evidence.threatIntelEvidence.map((item) => (
                <EvidenceCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Column C: RAG / Knowledge Base Evidence */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                C. RAG / Vector Evidence
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {report.evidence.ragEvidence.length} Signals
              </span>
            </div>
            <div className="space-y-2.5">
              {report.evidence.ragEvidence.map((item) => (
                <EvidenceCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Email Summary & Quarantined Payload Inspector */}
      <EmailSummaryCard email={email} />
    </div>
  );
};
