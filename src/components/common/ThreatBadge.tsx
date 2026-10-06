import React from 'react';
import { ThreatClassification, IndicatorSeverity } from '../../types';

interface ThreatBadgeProps {
  classification?: ThreatClassification;
  severity?: IndicatorSeverity;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ThreatBadge: React.FC<ThreatBadgeProps> = ({
  classification,
  severity,
  size = 'md',
  className = '',
}) => {
  const value = classification || severity || 'Safe';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1 font-semibold',
  }[size];

  // Professional SOC styling: crisp geometric borders, subtle tints, strong contrast
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-300';

  const valUpper = value.toUpperCase();
  if (valUpper === 'SAFE' || valUpper === 'LOW') {
    colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  } else if (valUpper === 'SUSPICIOUS' || valUpper === 'MEDIUM') {
    colorStyles = 'bg-amber-50 text-amber-800 border-amber-300';
  } else if (valUpper === 'PHISHING' || valUpper === 'CRITICAL' || valUpper === 'HIGH') {
    colorStyles = 'bg-rose-50 text-rose-800 border-rose-300';
  } else if (valUpper === 'SPAM') {
    colorStyles = 'bg-purple-50 text-purple-800 border-purple-300';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border tracking-wide uppercase font-mono ${sizeClasses} ${colorStyles} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          valUpper === 'SAFE' || valUpper === 'LOW'
            ? 'bg-emerald-500'
            : valUpper === 'SUSPICIOUS' || valUpper === 'MEDIUM'
            ? 'bg-amber-500'
            : valUpper === 'SPAM'
            ? 'bg-purple-500'
            : 'bg-rose-500'
        }`}
      />
      {value}
    </span>
  );
};
