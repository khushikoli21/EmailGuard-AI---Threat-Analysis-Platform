import React, { useState } from 'react';
import {
  Inbox,
  Star,
  Send,
  FileText,
  Archive,
  Trash2,
  AlertOctagon,
  ShieldAlert,
  Sparkles,
  FileSearch,
  FlaskConical,
  Settings,
  ChevronDown,
  ChevronRight,
  PenSquare,
  Shield,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCompose: () => void;
  unreadCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCompose,
  unreadCount = 0,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
}) => {
  const [isInboxDropdownOpen, setIsInboxDropdownOpen] = useState(true);

  // Mail folder items under the collapsible Inbox dropdown
  const mailFolders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, showCount: true },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'archived', label: 'Archived', icon: Archive },
    { id: 'trash', label: 'Trash', icon: Trash2 },
    { id: 'spam', label: 'Spam', icon: AlertOctagon },
  ];

  // 5 Dedicated Core Workspaces
  const coreWorkspaces = [
    {
      id: 'threat_triage',
      label: 'Threat Triage',
      icon: ShieldAlert,
      tag: 'Queue',
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'analysts',
      label: 'Security Analysts',
      icon: Sparkles,
      tag: 'AI Copilot',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'reports',
      label: 'Threat Report',
      icon: FileSearch,
      tag: 'Export',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'evaluation',
      label: 'Dataset Evaluation',
      icon: FlaskConical,
      tag: 'Benchmark',
      tagColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      tag: 'Config',
      tagColor: 'bg-slate-100 text-slate-600 border-slate-200',
    },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  const isMailFolderActive = mailFolders.some((f) => f.id === currentTab);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:static top-16 bottom-0 left-0 z-40 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-200 ease-in-out select-none ${
          isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-16' : 'md:w-60'}`}
      >
        {/* Compose Button (Rich Royal-Blue Action) */}
        <div className="p-3">
          <button
            onClick={onOpenCompose}
            className={`flex items-center gap-2.5 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-bold rounded-2xl shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] border border-blue-500/30 ${
              isCollapsed ? 'p-3 justify-center w-11 h-11 rounded-xl mx-auto' : 'px-4 py-3 w-full'
            }`}
          >
            <PenSquare className="w-4 h-4 shrink-0 drop-shadow-xs" />
            {!isCollapsed && (
              <span className="text-xs font-bold tracking-tight">Compose & Review</span>
            )}
          </button>
        </div>

        {/* Navigation Tree */}
        <div className="flex-1 overflow-y-auto px-2 space-y-3 text-xs font-medium">
          {/* Section 1: Collapsible Inbox Dropdown */}
          <div className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Mail Folders</span>
              </div>
            )}

            {/* Collapsible Inbox Header Button */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleItemClick('inbox')}
                title="Inbox"
                className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                  currentTab === 'inbox'
                    ? 'bg-blue-50/90 text-blue-800 font-bold border-l-3 border-blue-600 shadow-2xs'
                    : isMailFolderActive
                    ? 'text-slate-800 hover:bg-slate-50'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Inbox
                    className={`w-4 h-4 shrink-0 ${
                      currentTab === 'inbox' ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">Inbox</span>}
                </div>
                {!isCollapsed && unreadCount > 0 && (
                  <span className="ml-2 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    {unreadCount}
                  </span>
                )}
              </button>

              {!isCollapsed && (
                <button
                  type="button"
                  aria-label={isInboxDropdownOpen ? 'Collapse folders' : 'Expand folders'}
                  onClick={() => setIsInboxDropdownOpen(!isInboxDropdownOpen)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {isInboxDropdownOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>

            {/* Dropdown Folder Items */}
            {isInboxDropdownOpen && !isCollapsed && (
              <div className="pl-3.5 space-y-0.5 pt-0.5 border-l-2 border-slate-100 ml-4 animate-in fade-in duration-150">
                {mailFolders.slice(1).map((folder) => {
                  const Icon = folder.icon;
                  const isActive = currentTab === folder.id;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => handleItemClick(folder.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer text-left ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-500'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="truncate">{folder.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2 to 6: Core Cybersecurity Workspaces */}
          <div className="space-y-0.5 pt-3 border-t border-slate-100">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>SOC Workspace</span>
                <span className="text-[9px] text-blue-600 font-bold">ACTIVE</span>
              </div>
            )}
            {coreWorkspaces.map((ws) => {
              const Icon = ws.icon;
              const isActive = currentTab === ws.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => handleItemClick(ws.id)}
                  title={ws.label}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-blue-50/90 text-blue-900 font-bold border-l-3 border-blue-600 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                    {!isCollapsed && <span className="truncate">{ws.label}</span>}
                  </div>
                  {!isCollapsed && ws.tag && (
                    <span className={`text-[9px] font-bold uppercase font-mono px-1.5 py-0.2 rounded border ${ws.tagColor}`}>
                      {ws.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Zero-Trust Security Indicator */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-100 text-xs text-slate-500 space-y-1.5 shrink-0 bg-slate-50/50">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Zero-Trust Mailbox</span>
              </span>
              <span className="font-mono text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                SOC ACTIVE
              </span>
            </div>
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-sky-500 h-full w-[38%]" />
            </div>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              Partitioned User Isolation Enforced
            </span>
          </div>
        )}
      </aside>
    </>
  );
};
