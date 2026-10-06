import React from 'react';
import { Eye, ShieldAlert, Paperclip, AlertTriangle } from 'lucide-react';
import { EmailRecord } from '../../types';
import { ThreatBadge } from '../common/ThreatBadge';
import { RiskScoreBar } from '../common/RiskScoreBar';

interface EmailTableProps {
  emails: EmailRecord[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onViewReport: (emailId: string) => void;
}

export const EmailTable: React.FC<EmailTableProps> = ({
  emails,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewReport,
}) => {
  const allSelected = emails.length > 0 && selectedIds.length === emails.length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  aria-label="Select all emails"
                />
              </th>
              <th className="py-3 px-4">Sender & Address</th>
              <th className="py-3 px-4 min-w-[280px]">Subject & Snippet</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Classification</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {emails.map((email) => {
              const isSelected = selectedIds.includes(email.id);
              const isCritical = (email.risk_score ?? 0) >= 80;

              return (
                <tr
                  key={email.id}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                    isSelected ? 'bg-blue-50/40' : ''
                  }`}
                  onClick={() => onViewReport(email.id)}
                >
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(email.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      aria-label={`Select email from ${email.senderName}`}
                    />
                  </td>

                  {/* Sender */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                      <span>{email.senderName}</span>
                      {email.prompt_injection_suspected && (
                        <span
                          title="Prompt injection attempt suspected"
                          className="text-rose-600 font-bold"
                        >
                          ⚠
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                      {email.senderEmail}
                    </div>
                  </td>

                  {/* Subject & Preview */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span className="truncate max-w-[320px]">{email.subject}</span>
                      {email.attachments && email.attachments.length > 0 && (
                        <Paperclip className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-sans">
                      {email.bodyPreview}
                    </p>
                  </td>

                  {/* Risk Score */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <RiskScoreBar score={email.risk_score} size="sm" />
                  </td>

                  {/* Classification Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <ThreatBadge classification={email.classification} size="sm" />
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {email.receivedDate}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onViewReport(email.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Report</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
