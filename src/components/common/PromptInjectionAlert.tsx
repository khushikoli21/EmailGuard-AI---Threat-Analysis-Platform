import React from 'react';
import { AlertOctagon, ShieldAlert, Terminal, Lock } from 'lucide-react';

interface PromptInjectionAlertProps {
  suspected: boolean;
  details?: string;
  className?: string;
}

export const PromptInjectionAlert: React.FC<PromptInjectionAlertProps> = ({
  suspected,
  details,
  className = '',
}) => {
  if (!suspected) return null;

  return (
    <div
      role="alert"
      className={`bg-rose-950/95 text-rose-100 border-2 border-rose-500 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden ${className}`}
    >
      {/* Visual background grid pattern for security alert aesthetic */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-10 pointer-events-none text-rose-200">
        <Terminal className="w-40 h-40" />
      </div>

      <div className="relative z-10 flex items-start gap-3.5">
        <div className="p-2.5 bg-rose-600 text-white rounded-lg shadow-sm shrink-0">
          <AlertOctagon className="w-6 h-6 animate-pulse" />
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>⚠ Prompt Injection Attempt Detected</span>
            </h4>
            <span className="bg-rose-500/30 text-rose-200 text-xs px-2 py-0.5 rounded font-mono border border-rose-400/40">
              OWASP LLM01
            </span>
            <span className="bg-rose-500/30 text-rose-200 text-xs px-2 py-0.5 rounded font-mono border border-rose-400/40">
              Quarantine Enforced
            </span>
          </div>

          <p className="text-sm text-rose-200/90 leading-relaxed font-sans">
            This email contains text that appears to be attempting to manipulate the AI analysis system.
            Email content is treated strictly as untrusted data and isolated from system directives.
          </p>

          {details && (
            <div className="mt-2.5 p-2.5 bg-black/40 border border-rose-500/40 rounded-lg text-xs font-mono text-rose-300">
              <span className="text-rose-400 font-semibold mr-1">Heuristic Signature:</span>
              {details}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 text-xs text-rose-300">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>AI Orchestrator Execution Boundary: Context injection neutralized. Untrusted payload isolated.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
