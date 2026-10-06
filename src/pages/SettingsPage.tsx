import React, { useState } from 'react';
import {
  Settings,
  Server,
  Mail,
  User,
  Shield,
  Bell,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { BackendConfig } from '../types';
import { getBackendConfig, updateBackendConfig, checkBackendHealth } from '../services/api';

interface SettingsPageProps {
  backendConfig: BackendConfig;
  onUpdateConfig: (config: Partial<BackendConfig>) => void;
  onOpenGmailModal: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  backendConfig,
  onUpdateConfig,
  onOpenGmailModal,
}) => {
  const [baseUrlInput, setBaseUrlInput] = useState(backendConfig.baseUrl);
  const [useMock, setUseMock] = useState(backendConfig.useMockService);
  const [healthStatus, setHealthStatus] = useState<{
    tested: boolean;
    online: boolean;
    message: string;
  } | null>(null);
  const [testingHealth, setTestingHealth] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Security preferences
  const [promptInjectionGuard, setPromptInjectionGuard] = useState(true);
  const [quarantineExecutableAttachments, setQuarantineExecutableAttachments] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleSaveApiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = onUpdateConfig({
      baseUrl: baseUrlInput.trim(),
      useMockService: useMock,
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleTestHealth = async () => {
    setTestingHealth(true);
    try {
      const res = await checkBackendHealth();
      setHealthStatus({
        tested: true,
        online: res.isOnline,
        message: res.message,
      });
    } catch (err: any) {
      setHealthStatus({
        tested: true,
        online: false,
        message: err.message || 'Connection refused',
      });
    } finally {
      setTestingHealth(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast */}
      {saveToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Backend configuration updated successfully.</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Platform Settings & Integrations</h2>
        <p className="text-xs text-slate-500">
          Configure FastAPI endpoints, OAuth integrations, security heuristics, and environment preferences
        </p>
      </div>

      {/* 1. Backend Service Configuration (Critical for user's FastAPI integration) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">FastAPI Backend Connection</h3>
            <p className="text-xs text-slate-500">
              Switch between local frontend mock mode and your live Python backend server
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveApiConfig} className="space-y-4">
          {/* Mode Switch Toggle */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Operation Mode
              </span>
              <p className="text-xs text-slate-500">
                {useMock
                  ? 'Currently in Frontend Demonstration Mock Mode (simulated responses)'
                  : 'Direct HTTP calls enabled to your live FastAPI endpoints'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUseMock(!useMock)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                useMock
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}
            >
              {useMock ? 'Using Mock Service' : 'FastAPI Live Mode'}
            </button>
          </div>

          {/* Backend URL Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              FastAPI Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 px-3 py-2 text-xs bg-slate-50 focus:bg-white text-slate-900 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
              <button
                type="button"
                onClick={handleTestHealth}
                disabled={testingHealth}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingHealth ? 'animate-spin' : ''}`} />
                <span>Test Health</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Default development host: http://localhost:8000 (FastAPI / Uvicorn)
            </p>
          </div>

          {/* Health Check Feedback */}
          {healthStatus && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                healthStatus.online
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}
            >
              {healthStatus.online ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong>Health Check Result:</strong> {healthStatus.message}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Save Backend Configuration
            </button>
          </div>
        </form>
      </div>

      {/* 2. Gmail OAuth Integration */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Gmail Ingestion Channel</h3>
            <p className="text-xs text-slate-500">
              OAuth 2.0 authorization for mailbox surveillance (Zero password collection)
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800">Connection Status:</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                OAuth Backend Required
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Google Workspace OAuth credentials (CLIENT_ID and CLIENT_SECRET) must be configured on your server to handle token authorization callbacks.
            </p>
          </div>

          <button
            onClick={onOpenGmailModal}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
          >
            Review OAuth Architecture →
          </button>
        </div>
      </div>

      {/* 3. Security Preferences & Prompt Injection Safeguards */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Security & Adversarial Safeguards</h3>
            <p className="text-xs text-slate-500">
              Controls for untrusted payload isolation and prompt injection detection
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
            <input
              type="checkbox"
              checked={promptInjectionGuard}
              onChange={(e) => setPromptInjectionGuard(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-slate-900 block">
                Adversarial Prompt Injection Pre-Filter (OWASP LLM01)
              </span>
              <span className="text-slate-500 leading-relaxed block">
                Intercepts instruction override keywords and delimiters prior to LLM agent prompt synthesis.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
            <input
              type="checkbox"
              checked={quarantineExecutableAttachments}
              onChange={(e) => setQuarantineExecutableAttachments(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-slate-900 block">
                Defang Suspicious Executable Attachments (.vbs, .htm, .iso, .exe)
              </span>
              <span className="text-slate-500 leading-relaxed block">
                Never renders active scripts or download redirects inside the browser viewport.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* 4. Analyst Profile */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Analyst Profile & Attribution</h3>
            <p className="text-xs text-slate-500">
              Operator identity stamped onto exported threat dossiers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-slate-700">Analyst Name:</span>
            <input
              type="text"
              defaultValue="Dr. R. Vance"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-slate-700">Role:</span>
            <input
              type="text"
              defaultValue="Lead Cybersecurity Researcher"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
