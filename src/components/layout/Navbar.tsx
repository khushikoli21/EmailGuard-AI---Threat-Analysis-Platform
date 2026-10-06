import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Mail,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  User,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onConnectGmailClick: () => void;
  onSearch?: (query: string) => void;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenMobileMenu,
  onConnectGmailClick,
  onSearch,
  onSelectTab,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Email Security Dashboard',
      subtitle: 'AI-powered, evidence-grounded email threat analysis',
    },
    inbox: {
      title: 'Email Inbox',
      subtitle: 'Cybersecurity-focused incoming mailbox inspection and triage',
    },
    analyze: {
      title: 'Analyze an Email',
      subtitle: 'Manual email submission to multi-agent threat detection pipeline',
    },
    reports: {
      title: 'Threat Analysis Report',
      subtitle: 'In-depth evidence, indicators, agent traces, and explanations',
    },
    evidence: {
      title: 'Evidence & Knowledge Base',
      subtitle: 'MITRE ATT&CK patterns, threat vectors, and ChromaDB RAG store',
    },
    analytics: {
      title: 'Threat Telemetry & Analytics',
      subtitle: 'Aggregated threat distributions and classification telemetry',
    },
    evaluation: {
      title: 'Dataset Evaluation Framework',
      subtitle: 'Model benchmark harness (Accuracy, Precision, Recall, F1)',
    },
    settings: {
      title: 'Platform Settings',
      subtitle: 'FastAPI backend endpoint configuration, Gmail OAuth & preferences',
    },
  };

  const currentMeta = titles[currentTab] || {
    title: 'EmailGuard AI',
    subtitle: 'Intelligent Security Platform',
  };

  const sampleAlerts = [
    {
      id: 'n-1',
      title: 'Adversarial Prompt Injection Blocked',
      desc: 'Candidate resume email contained delimiter override payload.',
      time: '15m ago',
      level: 'critical',
    },
    {
      id: 'n-2',
      title: 'Spearphishing Pretext Flagged',
      desc: 'CEO wire request spoofed from exec-priority-mail.co.',
      time: '1h ago',
      level: 'high',
    },
    {
      id: 'n-3',
      title: 'O365 Typosquatted Domain Detected',
      desc: 'microsoft365-verify-portal.net registered 4 days ago.',
      time: '3h ago',
      level: 'high',
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {currentMeta.title}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block truncate">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Search, Gmail status, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search emails, indicators, CVEs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 lg:w-64 pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
          />
        </form>

        {/* Gmail OAuth Status Button */}
        <button
          onClick={onConnectGmailClick}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          title="Gmail Integration Status"
        >
          <Mail className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden lg:inline text-slate-600">Gmail:</span>
          <span className="font-mono text-[11px] text-amber-700 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            OAuth Ready
          </span>
        </button>

        {/* Notification Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors relative cursor-pointer"
            aria-label="Security notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white"></span>
          </button>

          {/* Notification Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Security Alerts & Telemetry
                </span>
                <span className="text-[11px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-semibold border border-rose-200">
                  3 Critical Signals
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {sampleAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors text-xs space-y-1 cursor-pointer"
                    onClick={() => {
                      setShowNotifications(false);
                      onSelectTab('reports');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        {alt.level === 'critical' ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        {alt.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{alt.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{alt.desc}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100 mt-2 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onSelectTab('inbox');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  View All Scanned Emails →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User / Analyst Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
            DR
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              Dr. R. Vance
            </div>
            <div className="text-[10px] text-slate-500 font-mono">SOC / Research Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
};
