import React, { useState } from 'react';
import { Mail, ShieldCheck, AlertCircle, Lock, ExternalLink, CheckCircle } from 'lucide-react';
import { Modal } from '../common/Modal';

interface ConnectGmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectGmailModal: React.FC<ConnectGmailModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState<'initial' | 'backend_required'>('initial');

  const handleContinue = () => {
    setStep('backend_required');
  };

  const handleReset = () => {
    setStep('initial');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Gmail Mailbox Integration (OAuth 2.0)"
      subtitle="Institutional email ingestion & threat triage pipeline"
      maxWidth="md"
    >
      {step === 'initial' ? (
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-blue-900">Zero-Password OAuth Architecture</h4>
              <p className="text-blue-800/90 leading-relaxed">
                EmailGuard AI utilizes official Google Workspace OAuth 2.0 client tokens with least-privilege read scopes (<code className="font-mono bg-blue-100 px-1 py-0.5 rounded">gmail.readonly</code>). <strong>Your Google account password is never collected, requested, or stored.</strong>
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>How Gmail Threat Ingestion Works:</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>MIME headers and raw bodies are fetched via Google Cloud APIs.</li>
              <li>Untrusted email content is streamed into the AI Threat Orchestrator sandbox.</li>
              <li>Flagged phishing emails can be quarantined or labeled automatically.</li>
            </ul>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Academic Project Notice:</strong> Real Gmail OAuth authentication will be handled by the FastAPI backend (<code className="font-mono">/api/gmail/connect</code>) upon deployment.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Continue to OAuth Flow →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-2 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">Backend Integration Required</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              The OAuth 2.0 consent authorization code exchange must be processed by your Python FastAPI backend server.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5 font-mono text-slate-700">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">
              Required Backend Endpoint:
            </div>
            <div className="text-blue-700 font-semibold">POST /api/gmail/connect</div>
            <div className="text-[11px] text-slate-500 font-sans">
              Configured via <code className="text-slate-800">GOOGLE_CLIENT_ID</code> and <code className="text-slate-800">GOOGLE_CLIENT_SECRET</code> on your server.
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={handleReset}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
