import React from 'react';
import {
  Link2,
  KeyRound,
  Clock,
  Globe,
  UserX,
  FileCode,
  Users,
  Terminal,
  AlertTriangle,
} from 'lucide-react';
import { ThreatIndicator } from '../../types';
import { ThreatBadge } from '../common/ThreatBadge';

interface IndicatorCardProps {
  indicator: ThreatIndicator;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = ({ indicator }) => {
  const getCategoryIcon = (category: ThreatIndicator['category']) => {
    switch (category) {
      case 'url':
        return Link2;
      case 'credentials':
        return KeyRound;
      case 'urgency':
        return Clock;
      case 'domain':
        return Globe;
      case 'impersonation':
        return UserX;
      case 'attachment':
        return FileCode;
      case 'social_engineering':
        return Users;
      case 'prompt_injection':
        return Terminal;
      default:
        return AlertTriangle;
    }
  };

  const Icon = getCategoryIcon(indicator.category);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            <Icon className="w-4 h-4 text-slate-700" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">{indicator.name}</h4>
        </div>
        <ThreatBadge severity={indicator.severity} size="sm" />
      </div>

      <p className="text-xs text-slate-600 leading-relaxed pl-9">
        {indicator.description}
      </p>

      {indicator.detectedText && (
        <div className="mt-2.5 ml-9 p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-mono break-all">
          <span className="text-slate-400 select-none mr-1.5 font-sans font-semibold">Matched Pattern:</span>
          <span className="text-rose-700 font-medium">"{indicator.detectedText}"</span>
        </div>
      )}
    </div>
  );
};
