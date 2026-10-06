import React, { useState } from 'react';
import { RefreshCw, Trash2, MailCheck, Shield, Inbox, AlertTriangle } from 'lucide-react';
import { EmailRecord } from '../../services/api';
import { EmailRow } from './EmailRow';

interface EmailListProps {
  emails: EmailRecord[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectEmail: (email: EmailRecord) => void;
  onToggleStar: (emailId: string, isStarred: boolean) => void;
  onDeleteSelected: (emailIds: string[]) => void;
  onMarkReadSelected: (emailIds: string[], isRead: boolean) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  isLoading,
  onRefresh,
  onSelectEmail,
  onToggleStar,
  onDeleteSelected,
  onMarkReadSelected,
  activeFilter,
  onFilterChange,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSelected = emails.length > 0 && selectedIds.length === emails.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(emails.map((e) => e.id));
    }
  };

  const handleToggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleStarClick = (e: React.MouseEvent, email: EmailRecord) => {
    e.stopPropagation();
    onToggleStar(email.id, !email.isStarred);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    onDeleteSelected(selectedIds);
    setSelectedIds([]);
  };

  const handleMarkRead = (isRead: boolean) => {
    if (selectedIds.length === 0) return;
    onMarkReadSelected(selectedIds, isRead);
    setSelectedIds([]);
  };

  const filterTabs = [
    { id: 'all', label: 'All Mail' },
    { id: 'phishing', label: 'Phishing', color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { id: 'suspicious', label: 'Suspicious', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'safe', label: 'Safe', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
      {/* Gmail Top Action Toolbar */}
      <div className="h-12 border-b border-slate-200/90 px-3 sm:px-4 flex items-center justify-between text-xs bg-white select-none">
        {/* Left Toolbar actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleToggleSelectAll}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
            title="Select All"
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => {}}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5 pointer-events-none"
            />
          </button>

          <button
            onClick={onRefresh}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Refresh mail"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => handleMarkRead(true)}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Mark as read"
              >
                <MailCheck className="w-4 h-4" />
              </button>

              <button
                onClick={handleDelete}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Right: Security Classification Segmented Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg overflow-x-auto">
          {filterTabs.map((tab) => {
            const isActive = activeFilter.toLowerCase() === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Email Rows List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading && emails.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <div>Loading mailbox from database...</div>
          </div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="font-semibold text-slate-800 text-sm">No emails in this folder</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your dynamic database has no emails matching the current criteria. Use the <strong>Compose & Analyze</strong> button to test or submit an email.
            </p>
          </div>
        ) : (
          emails.map((email) => (
            <EmailRow
              key={email.id}
              email={email}
              isSelected={selectedIds.includes(email.id)}
              onToggleSelect={(e) => handleToggleSelect(e, email.id)}
              onToggleStar={(e) => handleStarClick(e, email)}
              onClick={() => onSelectEmail(email)}
            />
          ))
        )}
      </div>
    </div>
  );
};
