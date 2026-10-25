import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  Trash2,
  MailCheck,
  MailQuestion,
  Inbox,
} from 'lucide-react';
import { EmailRecord } from '../../services/api';
import { EmailRow } from './EmailRow';

interface EmailListProps {
  emails: EmailRecord[];
  title: string;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectEmail: (email: EmailRecord) => void;
  onToggleStar: (emailId: string, isStarred: boolean) => void;
  onDeleteSelected: (emailIds: string[]) => void;
  onMarkReadSelected: (emailIds: string[], isRead: boolean) => void;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  title,
  isLoading,
  onRefresh,
  onSelectEmail,
  onToggleStar,
  onDeleteSelected,
  onMarkReadSelected,
  activeFilter = 'all',
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter emails according to activeFilter (if specified)
  const displayedEmails = useMemo(() => {
    return emails.filter((e) => {
      const filter = (activeFilter || 'all').toLowerCase();
      if (filter === 'all') return true;
      if (filter === 'unread') return !e.isRead;
      if (filter === 'starred') return e.isStarred;
      if (filter === 'phishing') return e.classification?.toLowerCase() === 'phishing';
      if (filter === 'suspicious') return e.classification?.toLowerCase() === 'suspicious';
      if (filter === 'safe') return e.classification?.toLowerCase() === 'safe';
      if (filter === 'high_risk' || filter === 'critical') {
        return (
          (e.riskScore != null && e.riskScore >= 70) ||
          e.riskLevel === 'High' ||
          e.riskLevel === 'Critical'
        );
      }
      return true;
    });
  }, [emails, activeFilter]);

  const allSelected =
    displayedEmails.length > 0 && selectedIds.length === displayedEmails.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedEmails.map((e) => e.id));
    }
  };

  const handleToggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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

  return (
    <div className="flex-1 min-h-0 flex flex-col min-w-0 bg-white overflow-hidden font-sans text-slate-800">
      {/* Gmail-style Compact Top Action Toolbar */}
      <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200/90 shrink-0 sticky top-0 z-20 flex items-center justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Select all checkbox */}
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 text-slate-700 select-none"
            title={allSelected ? 'Deselect all' : 'Select all'}
            aria-label={allSelected ? 'Deselect all' : 'Select all'}
          >
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                allSelected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-300 bg-white hover:border-blue-400'
              }`}
            >
              {allSelected && <span className="text-[10px] leading-none font-bold">✓</span>}
            </span>
            <span className="hidden sm:inline font-semibold text-slate-700">
              Select All ({displayedEmails.length})
            </span>
          </button>

          {/* Refresh Mail button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 sm:px-2.5 sm:py-1.5 inline-flex items-center gap-1.5 text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg transition-colors cursor-pointer text-xs font-semibold disabled:opacity-60"
            title="Refresh Mailbox"
            aria-label="Refresh Mailbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Action buttons when emails are selected */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => handleMarkRead(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer text-xs shadow-2xs transition-colors"
                title="Mark as read"
              >
                <MailCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Mark Read</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarkRead(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer text-xs shadow-2xs transition-colors"
                title="Mark as unread"
              >
                <MailQuestion className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mark Unread</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold cursor-pointer text-xs transition-colors shadow-2xs"
                title="Delete selected"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete ({selectedIds.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* Right side: Email count / status */}
        <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
          <span>
            {displayedEmails.length === 0
              ? '0 emails'
              : `1–${displayedEmails.length} of ${emails.length}`}
          </span>
        </div>
      </div>

      {/* Main Mailbox Items List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="divide-y divide-slate-100">
          {isLoading && emails.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              <div className="font-medium">Synchronizing mailbox...</div>
            </div>
          ) : displayedEmails.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="font-bold text-slate-800 text-sm">No emails in {title}</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your mailbox is clean and up to date.
              </p>
            </div>
          ) : (
            displayedEmails.map((email) => (
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
    </div>
  );
};
