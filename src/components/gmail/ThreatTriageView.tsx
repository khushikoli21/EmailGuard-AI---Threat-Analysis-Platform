import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Plus,
  PenSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Trash2,
  Send,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  User,
  Calendar,
  Sparkles,
  FileText,
  Activity,
  ArrowLeft,
  X,
  BadgeAlert,
} from 'lucide-react';
import {
  TriageItem,
  fetchTriageItems,
  fetchTriageItem,
  createTriageItem,
  updateTriageItem,
  deleteTriageItem,
  sendTriageDraft,
  EmailRecord,
  AnalysisRecord,
  IndicatorRecord,
  ThreatIntelRecord,
  EvidenceRecord,
} from '../../services/api';
import { ThreatChatbot } from './ThreatChatbot';
import DOMPurify from 'dompurify';

interface ThreatTriageViewProps {
  onOpenAnalystView?: (emailId?: string, triageId?: string) => void;
  onOpenReport?: (reportId: string) => void;
}

export const ThreatTriageView: React.FC<ThreatTriageViewProps> = ({
  onOpenAnalystView,
  onOpenReport,
}) => {
  const [items, setItems] = useState<TriageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Detail / active inspection state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<{
    item: TriageItem;
    email: EmailRecord | null;
    analysis: AnalysisRecord | null;
    indicators: IndicatorRecord[];
    threatIntel: ThreatIntelRecord[];
    evidence: EvidenceRecord[];
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // New Draft / Investigation modal inside Triage
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createType, setCreateType] = useState<'compose' | 'analyst'>('compose');
  const [createForm, setCreateForm] = useState({
    title: '',
    recipientEmail: '',
    subject: '',
    body: '',
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState<boolean>(false);

  // Status updating state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isSendingDraft, setIsSendingDraft] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadTriageItems = async () => {
    try {
      setIsLoading(true);
      const res = await fetchTriageItems({
        type: typeFilter,
        riskLevel: riskFilter,
        status: statusFilter,
        q: searchQuery,
      });
      setItems(res.items || []);
    } catch (err) {
      console.error('[TRIAGE] Failed to fetch items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTriageItems();
  }, [riskFilter, statusFilter, typeFilter, searchQuery]);

  const loadItemDetail = async (id: string) => {
    try {
      setSelectedItemId(id);
      setIsLoadingDetail(true);
      const detail = await fetchTriageItem(id);
      setSelectedDetail(detail);
    } catch (err) {
      console.error('[TRIAGE] Failed to fetch item detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingCreate(true);
      const payload: any = {
        type: createType,
        title: createForm.title.trim() || (createType === 'compose' ? `Draft: ${createForm.subject || 'Untitled'}` : 'Manual Threat Investigation'),
      };

      if (createType === 'compose') {
        payload.draftData = {
          recipientEmail: createForm.recipientEmail.trim(),
          subject: createForm.subject.trim(),
          body: createForm.body.trim(),
          urls: [],
          attachmentInfo: [],
        };
      }

      const created = await createTriageItem(payload);
      setIsCreateModalOpen(false);
      setCreateForm({ title: '', recipientEmail: '', subject: '', body: '' });
      await loadTriageItems();
      loadItemDetail(created.id);
      showToast('Created new session in Threat Triage');
    } catch (err: any) {
      console.error('[TRIAGE] Failed to create triage item:', err);
      showToast(err.message || 'Creation failed');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleUpdateStatus = async (newStatus: TriageItem['status']) => {
    if (!selectedDetail) return;
    try {
      setIsUpdatingStatus(true);
      const updated = await updateTriageItem(selectedDetail.item.id, { status: newStatus });
      setSelectedDetail((prev) => (prev ? { ...prev, item: updated } : null));
      loadTriageItems();
      showToast(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      console.error('[TRIAGE] Status update error:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendDraft = async () => {
    if (!selectedDetail || selectedDetail.item.type !== 'compose') return;
    try {
      setIsSendingDraft(true);
      await sendTriageDraft(selectedDetail.item.id);
      showToast('Email sent successfully! Moved to Sent folder.');
      await loadItemDetail(selectedDetail.item.id);
      loadTriageItems();
    } catch (err: any) {
      console.error('[TRIAGE] Send error:', err);
      showToast(err.message || 'Failed to send draft');
    } finally {
      setIsSendingDraft(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this triage session?')) return;
    try {
      await deleteTriageItem(id);
      if (selectedItemId === id) {
        setSelectedItemId(null);
        setSelectedDetail(null);
      }
      loadTriageItems();
      showToast('Triage session deleted.');
    } catch (err: any) {
      console.error('[TRIAGE] Delete error:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getRiskBadge = (level: string, score: number | null) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Critical {score !== null ? `(${score})` : ''}</span>
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            <span>High {score !== null ? `(${score})` : ''}</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Medium {score !== null ? `(${score})` : ''}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Low {score !== null ? `(${score})` : ''}</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">New</span>;
      case 'in_review':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 uppercase">In Review</span>;
      case 'escalated':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">Escalated</span>;
      case 'quarantined':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">Quarantined</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">Resolved</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">{status}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-2xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Threat Triage Workspace</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                Central SOC Queue
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage suspicious emails, security investigations, and isolated draft sessions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCreateType('compose');
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer shadow-2xs"
          >
            <PenSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>New Compose Draft</span>
          </button>
          <button
            onClick={() => {
              setCreateType('analyst');
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Investigation</span>
          </button>
          <button
            onClick={loadTriageItems}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Refresh Triage"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-3 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search triage subjects, senders, or titles..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('analyst')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                typeFilter === 'analyst' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Analyst
            </button>
            <button
              onClick={() => setTypeFilter('compose')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                typeFilter === 'compose' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Compose Drafts
            </button>
          </div>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Risk: All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="new">New</option>
            <option value="in_review">In Review</option>
            <option value="escalated">Escalated</option>
            <option value="quarantined">Quarantined</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Main Workspace Stage: Split Grid */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Side: Triage Queue Items */}
        <div
          className={`${
            selectedItemId ? 'hidden lg:flex lg:w-1/2 xl:w-5/12' : 'w-full'
          } flex flex-col border-r border-slate-200 overflow-y-auto bg-white`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-semibold">Loading Threat Triage items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center p-6 text-slate-400">
              <ShieldAlert className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No triage items found</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                No active threats or drafts match your current filter. Create a new compose draft or start an analyst investigation.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCreateType('compose');
                    setIsCreateModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
                >
                  Create Compose Draft
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const isSelected = selectedItemId === item.id;
                const isCompose = item.type === 'compose';
                return (
                  <div
                    key={item.id}
                    onClick={() => loadItemDetail(item.id)}
                    className={`p-4 transition-all cursor-pointer hover:bg-slate-50/80 ${
                      isSelected ? 'bg-blue-50/50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isCompose ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {isCompose ? <PenSquare className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {getRiskBadge(item.riskLevel, item.riskScore)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <div className="flex items-center gap-2 truncate">
                        {getStatusBadge(item.status)}
                        {item.draftData ? (
                          <span className="truncate">To: {item.draftData.recipientEmail || 'Draft'}</span>
                        ) : (
                          <span className="truncate">Investigation</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(item.updatedAt || item.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {item.activities && item.activities.length > 0 && (
                      <p className="text-[10px] text-slate-400 mt-1.5 truncate">
                        Latest: {item.activities[item.activities.length - 1].action}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Selected Triage Inspection Stage */}
        <div
          className={`${
            selectedItemId ? 'flex-1' : 'hidden lg:flex lg:flex-1'
          } flex flex-col min-h-0 bg-slate-50/40 overflow-y-auto`}
        >
          {selectedItemId && selectedDetail ? (
            <div className="flex flex-col h-full min-h-0">
              {/* Inspection Header */}
              <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => {
                      setSelectedItemId(null);
                      setSelectedDetail(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 truncate">
                        {selectedDetail.item.title}
                      </h2>
                      {getRiskBadge(selectedDetail.item.riskLevel, selectedDetail.item.riskScore)}
                      {getStatusBadge(selectedDetail.item.status)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Session ID: {selectedDetail.item.id} • Created{' '}
                      {new Date(selectedDetail.item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Status Dropdown */}
                  <select
                    value={selectedDetail.item.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as any)}
                    disabled={isUpdatingStatus}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="new">Mark New</option>
                    <option value="in_review">In Review</option>
                    <option value="escalated">Escalate to SOC</option>
                    <option value="quarantined">Quarantine</option>
                    <option value="resolved">Mark Resolved</option>
                  </select>

                  {/* Send Action for Drafts */}
                  {selectedDetail.item.type === 'compose' && selectedDetail.item.status !== 'resolved' && (
                    <button
                      onClick={handleSendDraft}
                      disabled={isSendingDraft}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      {isSendingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send Mail</span>
                    </button>
                  )}

                  {/* Go to Security Analyst View if email is linked */}
                  {selectedDetail.item.type === 'analyst' && onOpenAnalystView && selectedDetail.item.emailId && (
                    <button
                      onClick={() => onOpenAnalystView(selectedDetail.item.emailId, selectedDetail.item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Open in Analyst</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteItem(selectedDetail.item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Inspection Content Grid */}
              <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 min-h-0 overflow-y-auto">
                {/* Left Side: Content & Indicators (7 cols) */}
                <div className="xl:col-span-7 p-6 space-y-6 overflow-y-auto border-r border-slate-200/80">
                  {/* Draft Preview if Compose */}
                  {selectedDetail.item.type === 'compose' && selectedDetail.item.draftData && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Draft Message Content (Triage Isolated)
                        </span>
                        <span className="text-[11px] font-semibold text-blue-600">
                          Not visible in normal Inbox
                        </span>
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-600">
                        <div>
                          <strong className="text-slate-800">To:</strong>{' '}
                          {selectedDetail.item.draftData.recipientEmail || '(No recipient)'}
                        </div>
                        <div>
                          <strong className="text-slate-800">Subject:</strong>{' '}
                          {selectedDetail.item.draftData.subject || '(No subject)'}
                        </div>
                      </div>
                      <div className="pt-2">
                        <div className="text-xs font-semibold text-slate-500 mb-1">Body Preview:</div>
                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-800 whitespace-pre-wrap font-sans border border-slate-100">
                          {selectedDetail.item.draftData.body || '(Empty body)'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email Analysis Preview if Analyst */}
                  {selectedDetail.item.type === 'analyst' && selectedDetail.email && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {selectedDetail.email.subject}
                          </h3>
                          <p className="text-xs text-slate-500">
                            From: {selectedDetail.email.senderName} &lt;{selectedDetail.email.senderEmail}&gt;
                          </p>
                        </div>
                        {getRiskBadge(selectedDetail.email.riskLevel || 'Low', selectedDetail.email.riskScore ?? null)}
                      </div>

                      {/* Threat Indicators Summary */}
                      <div>
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Detected Indicators ({selectedDetail.indicators.length})</span>
                          <span className="text-[10px] text-slate-400 font-normal">Deterministic Heuristics</span>
                        </div>
                        {selectedDetail.indicators.length === 0 ? (
                          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>No suspicious threat indicators detected in this message.</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedDetail.indicators.map((ind) => (
                              <div
                                key={ind.id}
                                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800">{ind.title}</span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800">
                                    {ind.severity}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-[11px]">{ind.description}</p>
                                {ind.evidence && (
                                  <div className="text-[10px] text-slate-500 font-mono bg-white p-1 rounded-md border border-slate-200 mt-1">
                                    Evidence: {ind.evidence}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Email Body Preview */}
                      <div>
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Original Email Body
                        </div>
                        <div
                          className="p-4 bg-slate-50 rounded-xl text-xs text-slate-800 font-sans border border-slate-200 max-h-56 overflow-y-auto whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(selectedDetail.email.body.replace(/\n/g, '<br/>')),
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Activity Log / History */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Investigation Activity History</span>
                    </h4>
                    <div className="space-y-3 relative pl-4 before:content-[''] before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {(selectedDetail.item.activities || []).map((act) => (
                        <div key={act.id} className="relative text-xs">
                          <div className="w-2 h-2 rounded-full bg-blue-600 absolute -left-[17px] top-1.5 ring-4 ring-white" />
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{act.action}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(act.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {act.details && <p className="text-[11px] text-slate-500 mt-0.5">{act.details}</p>}
                          {act.actor && <p className="text-[10px] text-slate-400">By {act.actor}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Integrated Chatbot (5 cols) */}
                <div className="xl:col-span-5 p-4 flex flex-col min-h-[420px] bg-slate-50/50">
                  <ThreatChatbot
                    contextType={selectedDetail.item.type}
                    contextId={selectedDetail.item.id}
                    emailId={selectedDetail.item.emailId}
                    analysisId={selectedDetail.analysis?.id}
                    draftData={selectedDetail.item.draftData}
                    initialMessages={selectedDetail.item.messages || []}
                    title={
                      selectedDetail.item.type === 'compose'
                        ? 'Draft Safety Assistant'
                        : 'Analyst Investigation Chatbot'
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-8">
              <ShieldAlert className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Select a Triage Session</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Choose a session from the list to inspect email context, risk indicators, review history, or chat with the AI assistant.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Triage Item Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  {createType === 'compose' ? <PenSquare className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {createType === 'compose' ? 'Create New Compose Draft' : 'Start Threat Investigation'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder={createType === 'compose' ? 'e.g. Draft: Enterprise Security Advisory' : 'e.g. Investigation: Suspicious Wire Request'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {createType === 'compose' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Email</label>
                    <input
                      type="email"
                      required
                      value={createForm.recipientEmail}
                      onChange={(e) => setCreateForm({ ...createForm, recipientEmail: e.target.value })}
                      placeholder="colleague@organization.edu"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={createForm.subject}
                      onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                      placeholder="Security Notice: Password Verification"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Draft Body</label>
                    <textarea
                      required
                      rows={4}
                      value={createForm.body}
                      onChange={(e) => setCreateForm({ ...createForm, body: e.target.value })}
                      placeholder="Type your drafted message here for AI security safety review..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500 resize-none"
                    />
                  </div>
                </>
              )}

              <p className="text-[11px] text-slate-500 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                Notice: Activities created here are stored securely inside <strong>Threat Triage</strong> and will not appear in the normal Inbox until sent.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {isSubmittingCreate ? 'Saving...' : 'Save in Threat Triage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
