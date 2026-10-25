import React from 'react';
import { Star, Paperclip, ChevronRight, ShieldAlert, ShieldCheck } from 'lucide-react';
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
            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 shadow-2xs"
            title={`Phishing Detected - Risk ${email.riskScore ?? 0}/100`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
            </span>
            <span>Phishing</span>
            {email.riskScore != null && (
              <span className="font-mono text-[9px] text-rose-600 opacity-90">({email.riskScore})</span>
            )}
          </span>
        );
      case 'Suspicious':
        return (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 shadow-2xs"
            title={`Suspicious - Risk ${email.riskScore ?? 0}/100`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Suspicious</span>
            {email.riskScore != null && (
              <span className="font-mono text-[9px] text-amber-600 opacity-90">({email.riskScore})</span>
            )}
          </span>
        );
      case 'Safe':
        return (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs"
            title="Verified Safe"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Safe</span>
          </span>
        );
      case 'Spam':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Spam</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            <span>Pending</span>
          </span>
        );
    }
  };

  const isUnread = !email.isRead;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
          event.preventDefault();
          onClick();
        }
      }}
      aria-label={`Open email from ${email.senderName || email.senderEmail}: ${email.subject}`}
      className={`group flex items-center gap-3 px-3 sm:px-5 py-3 border-b border-slate-100 hover:bg-blue-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-2px] transition-all cursor-pointer text-xs select-none ${
        isUnread
          ? 'bg-white font-semibold border-l-3 border-l-blue-600 shadow-2xs'
          : 'bg-[#fcfdfd] text-slate-600 border-l-3 border-l-transparent'
      } ${isSelected ? 'bg-blue-50/90 hover:bg-blue-50 border-l-3 border-l-blue-600' : ''}`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggleSelect}
        aria-label={`${isSelected ? 'Deselect' : 'Select'} email from ${email.senderName || email.senderEmail}`}
        aria-pressed={isSelected}
        className="shrink-0 p-1 hover:bg-slate-200/70 rounded-md cursor-pointer transition-colors"
      >
        <span
          aria-hidden="true"
          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white hover:border-blue-400'
          }`}
        >
          {isSelected && <span className="text-[10px] leading-none font-bold">✓</span>}
        </span>
      </button>

      {/* Star */}
      <button
        type="button"
        onClick={onToggleStar}
        aria-label={email.isStarred ? 'Remove star' : 'Add star'}
        aria-pressed={email.isStarred}
        className="shrink-0 p-1 hover:bg-slate-200/70 rounded-md cursor-pointer transition-colors"
      >
        <Star
          className={`w-4 h-4 transition-colors ${
            email.isStarred ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-slate-500'
          }`}
        />
      </button>

      {/* Unread indicator dot */}
      <div className="w-2 flex justify-center shrink-0">
        {isUnread && <span className="w-2 h-2 rounded-full bg-blue-600 shadow-2xs" />}
      </div>

      {/* Sender Display Name */}
      <div className="w-32 sm:w-44 shrink-0 truncate text-[12px]">
        <span className={`truncate ${isUnread ? 'text-slate-900 font-extrabold' : 'text-slate-700 font-medium'}`}>
          {email.senderName || email.senderEmail}
        </span>
      </div>

      {/* Subject & Preview */}
      <div className="flex-1 min-w-0 flex items-baseline gap-2 truncate">
        {email.isDevelopmentSample && (
          <span className="shrink-0 text-[8px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
            Sample
          </span>
        )}
        <span className={`truncate shrink-0 max-w-[240px] sm:max-w-[340px] ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-800 font-medium'}`}>
          {email.subject}
        </span>
        <span className="text-slate-400 font-normal truncate hidden sm:inline text-[11px]">
          — {email.body.replace(/\n+/g, ' ').slice(0, 100)}
        </span>
      </div>

      {/* Attachment icon */}
      {email.hasAttachments && (
        <div className="shrink-0 text-slate-400" title="Contains attachments">
          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
        </div>
      )}

      {/* Threat Badge */}
      <div className="shrink-0 hidden md:flex items-center gap-2">
        {renderSecurityBadge()}
      </div>

      {/* Timestamp */}
      <div className="shrink-0 w-18 text-right font-mono text-[11px] text-slate-400 group-hover:text-slate-700 transition-colors">
        {formatTimestamp(email.receivedAt)}
      </div>

      {/* Action Chevron */}
      <div className="shrink-0 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all hidden sm:block">
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};
