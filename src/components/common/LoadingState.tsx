import React from 'react';
import { Loader2, Shield } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
  fullPage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading security data...',
  subtext = 'Querying orchestrator intelligence agents',
  fullPage = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-blue-200" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-slate-800">{message}</h4>
        <p className="text-xs text-slate-500 max-w-sm">{subtext}</p>
      </div>
    </div>
  );

  if (fullPage) {
    return <div className="min-h-[400px] flex items-center justify-center">{content}</div>;
  }

  return content;
};

export const SkeletonRow: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3 animate-pulse p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
          <div className="w-5 h-5 bg-slate-200 rounded"></div>
          <div className="w-36 h-4 bg-slate-200 rounded"></div>
          <div className="flex-1 h-4 bg-slate-100 rounded"></div>
          <div className="w-20 h-4 bg-slate-200 rounded"></div>
          <div className="w-16 h-6 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
  );
};
