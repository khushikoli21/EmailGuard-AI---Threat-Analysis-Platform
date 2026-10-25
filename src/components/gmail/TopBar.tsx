import React, { useState } from 'react';
import {
  Menu,
  Search,
  Settings,
  Shield,
  LogOut,
  X,
  ShieldCheck,
  Sparkles,
  Command,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onNavigateTab,
}) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200/90 sticky top-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-6 select-none shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      {/* Left: Hamburger & SOC-grade Logo */}
      <div className="flex items-center gap-2 sm:gap-3.5 w-auto sm:w-60 lg:w-64 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer active:scale-95"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('inbox')}
          className="flex items-center gap-2.5 cursor-pointer group text-left"
          aria-label="EmailGuard Mail, go to Inbox"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 text-white flex items-center justify-center shadow-xs border border-blue-400/30 group-hover:shadow-blue-500/20 group-hover:scale-102 transition-all">
            <Shield className="w-5 h-5 drop-shadow-xs" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
                EmailGuard
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded">
                AI
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 -mt-0.5 tracking-tight font-sans hidden sm:block">
              Intelligent Threat Defense
            </span>
          </div>
        </button>
      </div>

      {/* Center: High-contrast Search Bar with cyber cues */}
      <div className="flex-1 min-w-0 max-w-2xl px-1 sm:px-4">
        <div className="relative flex items-center group">
          <div className="absolute left-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            placeholder="Search threats, senders, IOCs, indicators..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-12 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200/90 focus:border-blue-500 focus:outline-hidden focus:ring-3 focus:ring-blue-500/15 shadow-2xs transition-all font-sans"
            aria-label="Search email"
          />

          <div className="absolute right-2.5 flex items-center gap-1">
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
                <Command className="w-2.5 h-2.5" /> K
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Security Status, Settings, Profile Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          onClick={() => onNavigateTab('threat_triage')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50/90 border border-emerald-200/90 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
          title="Threat Defense Engine Active"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold tracking-tight">Shield Active</span>
        </button>

        <button
          onClick={() => onNavigateTab('settings')}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="Security Settings"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-slate-500 hover:text-slate-800 transition-colors" />
        </button>

        {/* User Profile Avatar & Popover */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-0.5 rounded-full ring-2 ring-transparent hover:ring-blue-300 transition-all cursor-pointer"
            aria-label="User account"
            aria-expanded={showProfileMenu}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-8 h-8 rounded-full ring-1 ring-slate-200 object-cover shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-76 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-14 h-14 rounded-full ring-2 ring-blue-100 mb-2.5 object-cover shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-700 to-blue-500 text-white font-black text-xl flex items-center justify-center mb-2.5 shadow-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="font-bold text-sm text-slate-900">{user?.name}</div>
                <div className="text-xs text-slate-500 font-mono truncate max-w-[240px] mt-0.5">
                  {user?.email}
                </div>
                <div className="mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Google Account Authenticated</span>
                </div>
              </div>

              <div className="pt-3 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigateTab('settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Security & Account Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
