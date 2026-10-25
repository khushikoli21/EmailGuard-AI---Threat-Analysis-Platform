import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  Trash2,
  MailCheck,
  MailQuestion,
  Inbox,
  Search,
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
  activeFilter: string;
  onFilterChange: (filter: string) => void;
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
  activeFilter,
  onFilterChange,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Compute live statistics for filter tabs
  const stats = useMemo(() => {
    const total = emails.length;
    const unread = emails.filter((e) => !e.isRead).length;
    const starred = emails.filter((e) => e.isStarred).length;
    const safeCount = emails.filter((e) => e.classification === 'Safe').length;
    const suspiciousCount = emails.filter((e) => e.classification === 'Suspicious').length;
    const phishingCount = emails.filter((e) => e.classification === 'Phishing').length;
    const highCritical = emails.filter(
      (e) =>
        (e.riskScore != null && e.riskScore >= 70) ||
        e.riskLevel === 'High' ||
        e.riskLevel === 'Critical'
    ).length;

    return {
      total,
      unread,
      starred,
      safeCount,
      suspiciousCount,
      phishingCount,
      highCritical,
    };
  }, [emails]);

  // Filter emails both server/props and locally for instantaneous UI response
  const displayedEmails = useMemo(() => {
    return emails.filter((e) => {
      // Search query filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubject = e.subject.toLowerCase().includes(q);
        const matchesSender =
          e.senderName.toLowerCase().includes(q) || e.senderEmail.toLowerCase().includes(q);
        const matchesBody = e.body.toLowerCase().includes(q);
        if (!matchesSubject && !matchesSender && !matchesBody) return false;
      }

      // Quick filter
      const filter = activeFilter.toLowerCase();
      if (filter === 'all' || !filter) return true;
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
  }, [emails, searchQuery, activeFilter]);

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

  const filterTabs = [
    { id: 'all', label: 'All Emails', count: stats.total },
    { id: 'unread', label: 'Unread', count: stats.unread },
    { id: 'starred', label: 'Starred', count: stats.starred },
    { id: 'safe', label: 'Safe', count: stats.safeCount },
    { id: 'suspicious', label: 'Suspicious', count: stats.suspiciousCount },
    { id: 'phishing', label: 'Phishing', count: stats.phishingCount },
    { id: 'high_risk', label: 'High/Critical Risk', count: stats.highCritical },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col min-w-0 bg-[#f8fafc] overflow-y-auto font-sans text-slate-800">
      {/* 1. Header Bar */}
      <div className="px-6 py-4 bg-white border-b border-slate-200/90 shrink-0 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-2xs">
              <Inbox className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                  Mailbox
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Real-time synchronized communications and secure inbox items.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
              title="Refresh Mailbox"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>Refresh Mail</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs text-slate-600 shadow-2xs">
              <span className="font-bold text-slate-800">{emails.length}</span>
              <span>messages</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* 2. Quick Filters & Search Toolbar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {filterTabs.map((tab) => {
                const isActive = activeFilter.toLowerCase() === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onFilterChange(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-blue-700/80 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter messages in view..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Bulk Action Controls Bar */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
                title={allSelected ? 'Deselect all' : 'Select all'}
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    allSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {allSelected && <span className="text-[10px] leading-none font-bold">✓</span>}
                </span>
                <span>Select All ({displayedEmails.length})</span>
              </button>

              {selectedIds.length > 0 && (
                <>
                  <span className="text-slate-400">|</span>
                  <button
                    onClick={() => handleMarkRead(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                    title="Mark as read"
                  >
                    <MailCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mark Read</span>
                  </button>

                  <button
                    onClick={() => handleMarkRead(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                    title="Mark as unread"
                  >
                    <MailQuestion className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mark Unread</span>
                  </button>

                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold cursor-pointer transition-colors"
                    title="Delete selected"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete ({selectedIds.length})</span>
                  </button>
                </>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              Showing {displayedEmails.length} of {emails.length} emails
            </div>
          </div>
        </div>

        {/* 3. Mailbox Items Table Panel */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-4">
              <span>Mailbox Items</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <span>Security Verdict</span>
              <span className="w-18 text-right">Received</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading && emails.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                <div>Synchronizing mailbox database...</div>
              </div>
            ) : displayedEmails.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-800 text-sm">No emails match the selected criteria</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  No records match filter &ldquo;{activeFilter}&rdquo; or query &ldquo;{searchQuery}&rdquo;. Try clearing filters or refreshing mail.
                </p>
                <button
                  onClick={() => {
                    onFilterChange('all');
                    setSearchQuery('');
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
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
    </div>
  );
};
