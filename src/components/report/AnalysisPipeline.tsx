import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Bot,
  Globe2,
  Database,
  FileCheck2,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { PipelineStage } from '../../types';

interface AnalysisPipelineProps {
  stages: PipelineStage[];
}

export const AnalysisPipeline: React.FC<AnalysisPipelineProps> = ({ stages }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStageIcon = (name: string) => {
    if (name.includes('Email')) return Bot;
    if (name.includes('Threat')) return Globe2;
    if (name.includes('RAG') || name.includes('Evidence')) return Database;
    return FileCheck2;
  };

  const getStatusBadge = (status: PipelineStage['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case 'Running':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
            Running
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Failed
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Header bar with toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              AI Multi-Agent Analysis Pipeline
            </h3>
            <p className="text-xs text-slate-500">
              Four-agent orchestrated workflow: Extraction → External Intel → Vector RAG → Structured Report
            </p>
          </div>
        </div>

        <button
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          aria-label={isExpanded ? 'Collapse pipeline' : 'Expand pipeline'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5">
          {/* Horizontal Process Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {stages.map((stage, idx) => {
              const Icon = getStageIcon(stage.name);
              return (
                <div
                  key={stage.id}
                  className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between relative group hover:border-blue-300 transition-all"
                >
                  <div>
                    {/* Stage number & status badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Stage 0{idx + 1}
                      </span>
                      {getStatusBadge(stage.status)}
                    </div>

                    {/* Agent Name */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1 rounded bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {stage.name}
                      </h4>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {stage.description}
                    </p>
                  </div>

                  {/* Footer metadata */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>
                      {stage.executionTimeMs ? `${stage.executionTimeMs}ms` : '—'}
                    </span>
                    {stage.outputSummary && (
                      <span className="text-slate-600 font-sans truncate max-w-[130px]" title={stage.outputSummary}>
                        ✓ Telemetry logged
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-2.5 bg-blue-50/60 border border-blue-200/70 rounded-lg text-xs text-blue-900 flex items-center justify-between">
            <span className="text-[11px] text-blue-800">
              <strong>Architecture Grounding:</strong> The pipeline coordinates isolated specialized agents to prevent single-point LLM hallucinations and preserve evidence traceability.
            </span>
            <span className="text-[10px] font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 shrink-0 ml-2">
              LangGraph / FastAPI Target
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
