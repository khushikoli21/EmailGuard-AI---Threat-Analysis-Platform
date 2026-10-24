import React from 'react';
import {
  Inbox,
  Star,
  Clock,
  Send,
  FileText,
  Trash2,
  ShieldAlert,
  FileSearch,
  BookOpen,
  BarChart3,
  FlaskConical,
  Settings,
  Plus,
  PenSquare,
  HardDrive,
  Cloud,
  ChevronDown,
  ChevronRight,
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
  const [isInboxExpanded, setIsInboxExpanded] = React.useState(true);

  const mailNavItems = [
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'snoozed', label: 'Snoozed', icon: Clock },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  const securityNavItems = [
    { id: 'threats', label: 'Threat Triage', icon: ShieldAlert },
    { id: 'reports', label: 'Threat Reports', icon: FileSearch },
    { id: 'evidence', label: 'Evidence & Knowledge', icon: BookOpen },
    { id: 'analytics', label: 'Security Analytics', icon: BarChart3 },
    { id: 'evaluation', label: 'Dataset Evaluation', icon: FlaskConical },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

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
        className={`fixed md:static top-16 bottom-0 left-0 z-40 bg-white md:bg-transparent border-r border-slate-200/80 flex flex-col transition-all duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-16' : 'md:w-60'}`}
      >
        {/* Compose Button (Gmail-style Pill) */}
        <div className="p-3">
          <button
            onClick={onOpenCompose}
            className={`flex items-center gap-3 bg-blue-100 hover:bg-blue-200/90 text-blue-900 font-bold rounded-2xl shadow-sm hover:shadow transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              isCollapsed ? 'p-3 justify-center w-12 h-12 rounded-full' : 'px-5 py-3.5 w-full'
            }`}
          >
            <PenSquare className="w-5 h-5 text-blue-700 shrink-0" />
            {!isCollapsed && <span className="text-sm font-semibold">Compose & Analyze</span>}
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 text-xs font-medium">
          {/* Mail Folders */}
          <div className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Mail
              </div>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleItemClick('inbox')}
                title="Inbox"
                className={`min-w-0 flex-1 flex items-center justify-between px-3 py-2 rounded-r-full text-xs font-semibold transition-colors cursor-pointer text-left ${
                  currentTab === 'inbox'
                    ? 'bg-blue-50 text-blue-800 font-bold border-l-4 border-blue-600'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Inbox className={`w-4 h-4 shrink-0 ${currentTab === 'inbox' ? 'text-blue-600' : 'text-slate-500'}`} />
                  {!isCollapsed && <span className="truncate">Inbox</span>}
                </span>
                {!isCollapsed && unreadCount > 0 && (
                  <span className="ml-2 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                    {unreadCount}
                  </span>
                )}
              </button>
              {!isCollapsed && (
                <button
                  type="button"
                  aria-label={isInboxExpanded ? 'Collapse Inbox folders' : 'Expand Inbox folders'}
                  aria-expanded={isInboxExpanded}
                  onClick={() => setIsInboxExpanded((expanded) => !expanded)}
                  className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  {isInboxExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
                isInboxExpanded && !isCollapsed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
              aria-hidden={!isInboxExpanded || isCollapsed}
            >
              <div className="overflow-hidden">
                {mailNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      title={item.label}
                      tabIndex={isInboxExpanded && !isCollapsed ? 0 : -1}
                      className={`w-full flex items-center gap-3 pl-9 pr-3 py-2 rounded-r-full text-xs font-semibold transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'bg-blue-50 text-blue-800 font-bold border-l-4 border-blue-600'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Security Suite */}
          <div className="space-y-0.5 pt-2 border-t border-slate-100">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Security Suite
              </div>
            )}
            {securityNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-r-full text-xs font-semibold transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 font-bold border-l-4 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Storage / Cloud Indicator at Bottom */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-200 text-xs text-slate-500 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span>Protected Mailbox</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">0.2 GB / 15 GB</span>
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-[2%]" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
