import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'neutral' | 'positive' | 'warning' | 'danger';
  subtext?: string;
  accentColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  trendType = 'neutral',
  subtext,
  accentColor = 'blue',
  className = '',
}) => {
  const accentClasses = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      borderHover: 'hover:border-blue-300',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      borderHover: 'hover:border-emerald-300',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      borderHover: 'hover:border-amber-300',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      borderHover: 'hover:border-rose-300',
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      borderHover: 'hover:border-slate-300',
    },
  }[accentColor];

  const trendClasses = {
    neutral: 'text-slate-500 bg-slate-100',
    positive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    danger: 'text-rose-700 bg-rose-50 border-rose-200',
  }[trendType];

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-sm ${accentClasses.borderHover} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg border ${accentClasses.iconBg} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(trend || subtext) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {trend && (
            <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-medium border ${trendClasses}`}>
              {trend}
            </span>
          )}
          {subtext && <span className="text-slate-400 font-sans">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
