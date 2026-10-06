import React, { useState, useEffect } from 'react';
import { ThreatReport, EmailRecord } from '../types';
import { fetchThreatReport, fetchEmail, fetchEmails } from '../services/api';
import { ThreatReportView } from '../components/report/ThreatReportView';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ThreatBadge } from '../components/common/ThreatBadge';
import { Shield, ChevronRight } from 'lucide-react';

interface ReportPageProps {
  currentEmailId: string | null;
  onSelectEmailId: (emailId: string) => void;
  onNavigateToInbox: () => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  currentEmailId,
  onSelectEmailId,
  onNavigateToInbox,
}) => {
  const [report, setReport] = useState<ThreatReport | null>(null);
  const [email, setEmail] = useState<EmailRecord | null>(null);
  const [allEmails, setAllEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const emails = await fetchEmails('All');
        setAllEmails(emails);

        const targetId = currentEmailId || (emails[0] ? emails[0].id : null);
        if (targetId) {
          const [foundEmail, foundReport] = await Promise.all([
            fetchEmail(targetId),
            fetchThreatReport(targetId),
          ]);
          setEmail(foundEmail);
          setReport(foundReport);
        }
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentEmailId]);

  if (loading) {
    return <LoadingState message="Retrieving structured threat dossier..." fullPage />;
  }

  if (!report || !email) {
    return (
      <EmptyState
        title="No Threat Report Selected"
        description="Select an email from your inbox to inspect its multi-agent threat analysis, or submit an email for scanning."
        actionText="Browse Email Inbox"
        onAction={onNavigateToInbox}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Dossier Quick Switcher Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900">Active Dossier:</span>
            <span className="text-xs text-slate-600 ml-1.5 font-medium truncate max-w-sm inline-block align-bottom">
              {email.subject}
            </span>
          </div>
        </div>

        {/* Dropdown to switch analyzed report */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">
            Switch Report:
          </label>
          <select
            value={email.id}
            onChange={(e) => onSelectEmailId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            {allEmails.map((em) => (
              <option key={em.id} value={em.id}>
                [{em.classification}] {em.subject.slice(0, 40)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Threat Report View */}
      <ThreatReportView
        report={report}
        email={email}
        onBackToInbox={onNavigateToInbox}
      />
    </div>
  );
};
