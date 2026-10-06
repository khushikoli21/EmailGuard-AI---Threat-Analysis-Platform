import React, { useState } from 'react';
import {
  Menu,
  Search,
  SlidersHorizontal,
  HelpCircle,
  Settings,
  Shield,
  LogOut,
  User as UserIcon,
  X,
  ShieldCheck,
  ShieldAlert,
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
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 select-none">
      {/* Left: Hamburger & Gmail-style Logo */}
      <div className="flex items-center gap-2 sm:gap-3 w-64 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => onNavigateTab('inbox')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex items-baseline">
            <span className="text-lg font-bold text-slate-800 tracking-tight font-sans">
              EmailGuard
            </span>
            <span className="text-xs font-semibold text-slate-400 ml-1 font-sans">
              Mail
            </span>
          </div>
        </div>
      </div>

      {/* Center: Gmail-style Large Search Bar */}
      <div className="flex-1 max-w-2xl px-2 sm:px-4">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            placeholder="Search mail (e.g. from:amazon, urgent, phishing...)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-500 rounded-full border border-transparent focus:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-inner-xs transition-all font-sans"
          />

          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Security Status, Settings, Profile Avatar */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          onClick={() => onNavigateTab('analytics')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
          title="AI Threat Shield Active"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Shield Active</span>
        </button>

        <button
          onClick={() => onNavigateTab('settings')}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Profile Avatar & Popover */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-slate-200 transition-all cursor-pointer"
            aria-label="User account"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-8 h-8 rounded-full ring-1 ring-slate-200 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-14 h-14 rounded-full ring-2 ring-slate-100 mb-2 object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center mb-2">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="font-bold text-sm text-slate-900">{user?.name}</div>
                <div className="text-xs text-slate-500 font-mono truncate max-w-[240px]">
                  {user?.email}
                </div>
                <div className="mt-2 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Google Account Authenticated
                </div>
              </div>

              <div className="pt-3 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigateTab('settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Security & Account Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
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
