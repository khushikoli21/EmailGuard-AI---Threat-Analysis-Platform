import React, { useState } from 'react';
import {
  Mail,
  User,
  Globe,
  Calendar,
  Link2,
  Paperclip,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileCode,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { EmailRecord } from '../../types';

interface EmailSummaryCardProps {
  email: EmailRecord;
}

export const EmailSummaryCard: React.FC<EmailSummaryCardProps> = ({ email }) => {
  const [showFullBody, setShowFullBody] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Email Metadata & Payload Summary</h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span className="bg-slate-200/70 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
            ID: {email.id}
          </span>
          <span>{email.receivedDate}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Core Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              From / Sender
            </span>
            <div className="flex items-center gap-1.5 font-medium text-slate-900">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold">{email.senderName}</span>
              <span className="text-slate-500 font-mono text-[11px] truncate">
                &lt;{email.senderEmail}&gt;
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Origin Domain & SPF Alignment
            </span>
            <div className="flex items-center gap-1.5 font-medium text-slate-900">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono text-slate-800">{email.senderDomain}</span>
            </div>
          </div>

          <div className="space-y-1 md:col-span-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Subject Line
            </span>
            <div className="text-sm font-bold text-slate-900 font-sans">
              {email.subject}
            </div>
          </div>
        </div>

        {/* Detected URLs section */}
        {email.urls && email.urls.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-amber-600" />
                Detected URLs in Email ({email.urls.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Quarantined / Defanged</span>
            </div>
            <div className="space-y-1">
              {email.urls.map((url, i) => (
                <div
                  key={i}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 flex items-center justify-between break-all group hover:bg-slate-100 transition-colors"
                >
                  <span className="truncate pr-2">{url}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 shrink-0 select-none">
                    Inactive (Safe View)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments Section */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="space-y-1.5">
            <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
              Attached Files ({email.attachments.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {email.attachments.map((att, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    att.isSuspicious
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode
                      className={`w-4 h-4 shrink-0 ${
                        att.isSuspicious ? 'text-rose-600' : 'text-slate-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-mono font-medium truncate">{att.filename}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{att.size}</div>
                    </div>
                  </div>
                  {att.isSuspicious ? (
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300 shrink-0">
                      ⚠ Suspicious
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                      Scanned
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Untrusted Email Body Sandbox */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
              <span>Quarantined Message Body</span>
              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-normal">
                Untrusted Input Boundary
              </span>
            </div>
            <button
              onClick={() => setShowFullBody(!showFullBody)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              {showFullBody ? (
                <>
                  <span>Show Preview</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Expand Raw Body</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 text-xs font-mono leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap select-text">
            {showFullBody ? email.fullBody : email.bodyPreview}
          </div>
        </div>
      </div>
    </div>
  );
};
