import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  SearchCode,
  FileText,
  BookOpen,
  BarChart3,
  FlaskConical,
  Settings,
  Shield,
  CircleDot,
  Server,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { BackendConfig } from '../../types';

export type NavTab =
  | 'dashboard'
  | 'inbox'
  | 'analyze'
  | 'reports'
  | 'evidence'
  | 'analytics'
  | 'evaluation'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  backendConfig: BackendConfig;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  backendConfig,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'inbox' as NavTab,
      label: 'Email Inbox',
      icon: Inbox,
      badge: '8',
    },
    {
      id: 'analyze' as NavTab,
      label: 'Analyze Email',
      icon: SearchCode,
      badge: undefined,
    },
    {
      id: 'reports' as NavTab,
      label: 'Threat Reports',
      icon: FileText,
      badge: undefined,
    },
    {
      id: 'evidence' as NavTab,
      label: 'Evidence & Knowledge',
      icon: BookOpen,
      badge: undefined,
    },
    {
      id: 'analytics' as NavTab,
      label: 'Analytics',
      icon: BarChart3,
      badge: undefined,
    },
    {
      id: 'evaluation' as NavTab,
      label: 'Dataset Evaluation',
      icon: FlaskConical,
      badge: 'Academic',
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      badge: undefined,
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white font-mono">
                  EmailGuard<span className="text-blue-400">.AI</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-medium">
                Threat Analysis SOC
              </p>
            </div>
          </div>
        </div>

        {/* Academic Project Badge / Context */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
            <span className="flex items-center gap-1.5 text-blue-300">
              <CircleDot className="w-2.5 h-2.5 text-blue-400 animate-pulse" />
              Academic Research
            </span>
            <span className="text-[10px] font-mono text-slate-400">v0.9.4</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-snug">
            Intelligent Multi-Agent Email Security Frontend
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Core Modules
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer group text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                      isActive
                        ? 'bg-blue-700 text-blue-100'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom System Status Section */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                System Status
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                UI Ready
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Server className="w-3.5 h-3.5 text-slate-400" />
                  AI Security Engine
                </span>
                <span className="font-mono text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.5 rounded">
                  {backendConfig.useMockService ? 'Mock Mode' : 'FastAPI Live'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight pt-1">
                {backendConfig.useMockService
                  ? 'Frontend demonstration state. Real FastAPI backend can be connected via Settings.'
                  : `Target: ${backendConfig.baseUrl}`}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
