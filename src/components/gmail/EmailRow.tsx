import React from 'react';
import { Star, ShieldAlert, Paperclip, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { EmailRecord } from '../../services/api';

interface EmailRowProps {
  email: EmailRecord;
  isSelected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export const EmailRow: React.FC<EmailRowProps> = ({
  email,
  isSelected,
  onToggleSelect,
  onToggleStar,
  onClick,
}) => {
  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const renderSecurityBadge = () => {
    const classification = email.classification || 'Unanalyzed';
    switch (classification) {
      case 'Phishing':
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
            title={`Phishing Detected - Risk ${email.riskScore || 0}/100`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            <span>Phishing</span>
          </span>
        );
      case 'Suspicious':
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
            title={`Suspicious - Risk ${email.riskScore || 0}/100`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Suspicious</span>
          </span>
        );
      case 'Safe':
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
            title="Verified Safe"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Safe</span>
          </span>
        );
      case 'Spam':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Spam</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            <span>Scan Pending</span>
          </span>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-slate-150 hover:bg-slate-50 transition-colors cursor-pointer text-xs select-none ${
        !email.isRead ? 'bg-white font-semibold' : 'bg-slate-50/40 text-slate-600'
      } ${isSelected ? 'bg-blue-50/80 hover:bg-blue-50' : ''}`}
    >
      {/* Checkbox */}
      <div onClick={onToggleSelect} className="shrink-0 p-1 hover:bg-slate-200/50 rounded">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
        />
      </div>

      {/* Star */}
      <div onClick={onToggleStar} className="shrink-0 p-1 hover:bg-slate-200/50 rounded">
        <Star
          className={`w-4 h-4 transition-colors cursor-pointer ${
            email.isStarred ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-slate-500'
          }`}
        />
      </div>

      {/* Sender Display Name */}
      <div className="w-36 sm:w-44 shrink-0 truncate">
        <span
          className={`truncate ${
            !email.isRead ? 'text-slate-900 font-bold' : 'text-slate-700 font-normal'
          }`}
        >
          {email.senderName || email.senderEmail}
        </span>
      </div>

      {/* Subject & Preview */}
      <div className="flex-1 min-w-0 flex items-baseline gap-1.5 truncate">
        {email.isDevelopmentSample && (
          <span className="shrink-0 text-[9px] font-mono font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
            Development Sample Data
          </span>
        )}
        <span
          className={`truncate shrink-0 max-w-[260px] sm:max-w-[340px] ${
            !email.isRead ? 'text-slate-900 font-bold' : 'text-slate-800 font-medium'
          }`}
        >
          {email.subject}
        </span>
        <span className="text-slate-400 font-normal truncate hidden sm:inline">
          — {email.body.replace(/\n+/g, ' ').slice(0, 120)}
        </span>
      </div>

      {/* Attachment icon */}
      {email.hasAttachments && (
        <div className="shrink-0 text-slate-400">
          <Paperclip className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Threat Badge */}
      <div className="shrink-0 hidden md:block">{renderSecurityBadge()}</div>

      {/* Timestamp */}
      <div className="shrink-0 w-16 text-right font-mono text-[11px] text-slate-500 group-hover:text-slate-700">
        {formatTimestamp(email.receivedAt)}
      </div>
    </div>
  );
};
