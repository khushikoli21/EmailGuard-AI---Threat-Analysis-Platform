import React from 'react';
import { Mail, Globe2, Database, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { EvidenceItem } from '../../types';

interface EvidenceCardProps {
  item: EvidenceItem;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ item }) => {
  const getStatusIcon = (status: EvidenceItem['status']) => {
    switch (status) {
      case 'Safe':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'Suspicious':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'Malicious':
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'Informational':
      default:
        return <Info className="w-4 h-4 text-blue-600 shrink-0" />;
    }
  };

  const getSourceIcon = (source: EvidenceItem['source']) => {
    switch (source) {
      case 'Email Content':
        return <Mail className="w-3.5 h-3.5 text-slate-500" />;
      case 'Threat Intelligence':
        return <Globe2 className="w-3.5 h-3.5 text-blue-500" />;
      case 'RAG / Knowledge Base':
        return <Database className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  const getStatusClasses = (status: EvidenceItem['status']) => {
    switch (status) {
      case 'Safe':
        return 'border-l-emerald-500 bg-emerald-50/30';
      case 'Suspicious':
        return 'border-l-amber-500 bg-amber-50/30';
      case 'Malicious':
        return 'border-l-rose-500 bg-rose-50/30';
      case 'Informational':
      default:
        return 'border-l-blue-500 bg-blue-50/30';
    }
  };

  return (
    <div
      className={`border border-slate-200 border-l-4 rounded-xl p-3.5 bg-white shadow-2xs hover:shadow-xs transition-all ${getStatusClasses(
        item.status
      )}`}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
          {getSourceIcon(item.source)}
          <span>{item.source}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono font-medium">
          {getStatusIcon(item.status)}
          <span
            className={
              item.status === 'Safe'
                ? 'text-emerald-700'
                : item.status === 'Suspicious'
                ? 'text-amber-700'
                : item.status === 'Malicious'
                ? 'text-rose-700 font-bold'
                : 'text-blue-700'
            }
          >
            {item.status}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-800 leading-relaxed font-sans">{item.finding}</p>

      {item.reference && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="text-slate-400">Grounding Ref:</span>
          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-xs">
            {item.reference}
          </span>
        </div>
      )}
    </div>
  );
};
