import React, { useState, useEffect } from 'react';
import {
  Inbox,
  RefreshCw,
  Mail,
  ShieldCheck,
  Search,
  Filter,
  CheckSquare,
  AlertCircle,
  FileSearch,
} from 'lucide-react';
import { EmailRecord, ThreatClassification } from '../types';
import { fetchEmails } from '../services/api';
import { EmailTable } from '../components/inbox/EmailTable';
import { ConnectGmailModal } from '../components/inbox/ConnectGmailModal';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';

interface InboxPageProps {
  onViewReport: (emailId: string) => void;
  onNavigateToAnalyze: () => void;
}

export const InboxPage: React.FC<InboxPageProps> = ({
  onViewReport,
  onNavigateToAnalyze,
}) => {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  const loadEmails = async (filter = activeFilter) => {
    try {
      setLoading(true);
      const data = await fetchEmails(filter);
      setEmails(data);
    } catch (err) {
      console.error('Failed to load emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails(activeFilter);
  }, [activeFilter]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredEmails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmails.map((e) => e.id));
    }
  };

  const handleAnalyzeSelected = () => {
    if (selectedIds.length === 0) return;
    setActionNotification(`Queued ${selectedIds.length} email(s) for deep threat re-analysis.`);
    setTimeout(() => setActionNotification(null), 4000);
  };

  const filteredEmails = emails.filter((email) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      email.subject.toLowerCase().includes(q) ||
      email.senderName.toLowerCase().includes(q) ||
      email.senderEmail.toLowerCase().includes(q) ||
      email.bodyPreview.toLowerCase().includes(q)
    );
  });

  const filterTabs = ['All', 'Safe', 'Suspicious', 'Phishing', 'Spam'];

  return (
    <div className="space-y-5">
      {/* Action Notification Toast */}
      {actionNotification && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <span>{actionNotification}</span>
          <button
            onClick={() => setActionNotification(null)}
            className="text-blue-700 font-bold hover:text-blue-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Triage Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Email Inbox Triage</h2>
          <p className="text-xs text-slate-500">
            Incoming communications inspected for phishing, spoofing, and malicious payloads
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadEmails(activeFilter)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsGmailModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>Connect Gmail</span>
          </button>

          <button
            onClick={handleAnalyzeSelected}
            disabled={selectedIds.length === 0}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer ${
              selectedIds.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Analyze Selected ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* Search & Segmented Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Interactive Filter Tabs (Zero-pill compliant segmented control) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search inbox sender or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Main Table or Loading/Empty State */}
      {loading ? (
        <LoadingState message="Fetching parsed email streams..." />
      ) : filteredEmails.length === 0 ? (
        <EmptyState
          title="No emails match your filter"
          description="Try adjusting your classification filters or search criteria, or submit a manual email for threat detection."
          actionText="Analyze an Email Now"
          onAction={onNavigateToAnalyze}
        />
      ) : (
        <EmailTable
          emails={filteredEmails}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onViewReport={onViewReport}
        />
      )}

      {/* Connect Gmail Modal */}
      <ConnectGmailModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
      />
    </div>
  );
};
