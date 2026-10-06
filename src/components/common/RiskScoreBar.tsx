import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RiskScoreBarProps {
  score: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const RiskScoreBar: React.FC<RiskScoreBarProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  if (score === null || score === undefined) {
    return (
      <div className={`text-slate-500 font-medium text-xs flex items-center gap-1.5 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
        <span>Risk score unavailable</span>
      </div>
    );
  }

  // Calculate tier
  let tier: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-700';
  let borderColor = 'border-emerald-200';
  let bgColor = 'bg-emerald-50';

  if (score >= 80) {
    tier = 'Critical';
    barColor = 'bg-rose-600';
    textColor = 'text-rose-700';
    borderColor = 'border-rose-200';
    bgColor = 'bg-rose-50';
  } else if (score >= 60) {
    tier = 'High';
    barColor = 'bg-orange-500';
    textColor = 'text-orange-700';
    borderColor = 'border-orange-200';
    bgColor = 'bg-orange-50';
  } else if (score >= 30) {
    tier = 'Medium';
    barColor = 'bg-amber-500';
    textColor = 'text-amber-700';
    borderColor = 'border-amber-200';
    bgColor = 'bg-amber-50';
  }

  if (size === 'sm') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
        <span className={`font-mono text-xs font-semibold ${textColor}`}>{score}/100</span>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`bg-white border rounded-xl p-5 shadow-sm ${borderColor} ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              Evaluated Threat Risk Level
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-3xl font-extrabold tracking-tight font-mono ${textColor}`}>
                {score}
              </span>
              <span className="text-slate-400 font-mono text-sm">/ 100</span>
              <span className={`ml-2 px-2.5 py-0.5 text-xs font-semibold uppercase rounded border ${bgColor} ${borderColor} ${textColor}`}>
                {tier} Risk
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            {tier === 'Low' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ) : tier === 'Critical' ? (
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            <span>Risk scale: 0–29 Low · 30–59 Med · 60–79 High · 80–100 Crit</span>
          </div>
        </div>

        {/* Multi-segment visual meter */}
        <div className="relative w-full bg-slate-100 rounded-lg h-3 overflow-hidden border border-slate-200">
          <div
            className={`h-full ${barColor} transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1.5">
          <span>0 (Safe)</span>
          <span>30 (Medium)</span>
          <span>60 (High)</span>
          <span>80 (Critical)</span>
          <span>100</span>
        </div>
      </div>
    );
  }

  // Medium size
  return (
    <div className={`space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-600">Risk Score</span>
          <span className={`font-mono font-semibold ${textColor}`}>
            {score}/100 ({tier})
          </span>
        </div>
      )}
      <div className="w-full bg-slate-100 rounded-md h-2.5 overflow-hidden border border-slate-200">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
};
