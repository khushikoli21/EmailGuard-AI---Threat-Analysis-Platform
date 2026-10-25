import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  User,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Layers,
  ExternalLink,
  Cpu,
  Terminal,
  Database,
  Lock,
  Globe,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchSettings, updateSettings, fetchHealth, fetchKnowledgeBase } from '../../services/api';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'preferences' | 'knowledge' | 'integrations'>('preferences');
  const [settings, setSettings] = useState<any>({
    promptInjectionGuard: true,
    threatIntelEnabled: true,
    notifications: true,
  });
  const [health, setHealth] = useState<any>(null);
  const [articles, setArticles] = useState<Array<{
    id: string;
    name: string;
    category: string;
    technique: string;
    description: string;
    url?: string;
  }>>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [s, h] = await Promise.all([fetchSettings(), fetchHealth()]);
        setSettings(s);
        setHealth(h);
      } catch (err) {
        console.warn('[SETTINGS] Error loading settings or health:', err);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (activeTab === 'knowledge' && articles.length === 0) {
      setIsLoadingKnowledge(true);
      fetchKnowledgeBase()
        .then((data) => setArticles(data.items || []))
        .catch((err) => console.error('[SETTINGS] Error loading knowledge base:', err))
        .finally(() => setIsLoadingKnowledge(false));
    }
  }, [activeTab]);

  const handleToggle = async (key: string) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await updateSettings({ [key]: updated[key] });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error('[SETTINGS] Update error:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc] overflow-y-auto font-sans text-slate-800">
      {/* Top Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 text-white flex items-center justify-center shadow-xs border border-blue-400/30">
            <Settings className="w-5 h-5 drop-shadow-xs" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Platform Settings & Knowledge</h1>
              {isSaved && (
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Saved
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Configure identity, security safeguards, integrations, and RAG knowledge base.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            Tenant Isolated Environment
          </span>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-2 text-xs font-bold shrink-0">
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-3 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'preferences'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 text-blue-600" />
          <span>Security & Identity</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-4 py-3 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'knowledge'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-purple-600" />
          <span>Evidence & Knowledge Base</span>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-3 border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'integrations'
              ? 'border-blue-600 text-blue-700 bg-blue-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4 text-emerald-600" />
          <span>Integrations & Telemetry</span>
        </button>
      </div>

      {/* Main Tab Stage */}
      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* TAB 1: Preferences & Identity */}
        {activeTab === 'preferences' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Account Profile Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Authenticated Identity Profile</span>
              </div>

              <div className="flex items-center gap-4">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-14 h-14 rounded-2xl ring-2 ring-blue-100 object-cover shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white font-extrabold text-xl flex items-center justify-center shadow-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-slate-900">{user?.name}</h3>
                  <p className="text-xs text-slate-600 font-mono">{user?.email}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    User Session ID: <span className="text-slate-700 font-semibold">{user?.uid}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Safeguards */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Security Engine Policies</span>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/40 hover:border-blue-300 transition-all">
                  <input
                    type="checkbox"
                    checked={settings.promptInjectionGuard}
                    onChange={() => handleToggle('promptInjectionGuard')}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>OWASP LLM01 Prompt Injection Active Defense</span>
                      <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Scans incoming email bodies for adversarial override keywords (e.g. system instructions, DAN mode bypass) and blocks attempts to manipulate the risk scoring engine.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/40 hover:border-blue-300 transition-all">
                  <input
                    type="checkbox"
                    checked={settings.threatIntelEnabled}
                    onChange={() => handleToggle('threatIntelEnabled')}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-slate-900">
                      External Multi-Engine Threat Intelligence Lookups
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Enables real queries to VirusTotal v3 and URLhaus for links and attachment SHA256 hashes detected in triaged messages.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-blue-50/40 hover:border-blue-300 transition-all">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={() => handleToggle('notifications')}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-slate-900">
                      High-Risk Phishing Real-Time Alerts
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Receive immediate visual banners when an email scores Critical (&gt;80/100 risk points) in the triage stream.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Evidence & Knowledge Base (Moved into Settings) */}
        {activeTab === 'knowledge' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Security Knowledge Base & Grounding Vectors
                </h3>
                <p className="text-xs text-slate-500">
                  MITRE ATT&CK taxonomies, OWASP threat models, and phishing attack vectors referenced by the RAG engine.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                {articles.length} Grounding Taxonomies Loaded
              </span>
            </div>

            {isLoadingKnowledge ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Loading knowledge base taxonomies...
              </div>
            ) : articles.length === 0 ? (
              <p className="text-xs text-slate-400">No knowledge base articles loaded.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {art.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                        {art.technique}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs">{art.name}</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                      {art.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <a
                        href={art.url || 'https://attack.mitre.org/'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open MITRE reference</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Integrations & Secrets Health */}
        {activeTab === 'integrations' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Connected Services & Secrets Status</h3>
              <p className="text-xs text-slate-500">
                Audited connection status of detection APIs, external scanners, and LLM reasoning.
              </p>
            </div>

            {health && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {Object.entries(health.services || {}).map(([key, svc]: [string, any]) => {
                  const isConnected = svc.status === 'CONNECTED' || svc.status === 'READY';
                  return (
                    <div
                      key={key}
                      className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-2xs space-y-2 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold">{svc.label || key}</strong>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                            isConnected
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                          {svc.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{svc.detail}</p>
                      {svc.provider && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Provider: {svc.provider}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
