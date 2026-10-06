import React, { useEffect, useState } from 'react';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Gauge,
  ArrowRight,
  TrendingUp,
  FileSearch,
  ExternalLink,
  PlusCircle,
  Mail,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { EmailRecord, AnalyticsData } from '../types';
import { fetchAnalytics, fetchEmails } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { ThreatBadge } from '../components/common/ThreatBadge';
import { RiskScoreBar } from '../components/common/RiskScoreBar';
import { LoadingState } from '../components/common/LoadingState';

interface DashboardPageProps {
  onNavigateToInbox: () => void;
  onNavigateToAnalyze: () => void;
  onViewReport: (emailId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToInbox,
  onNavigateToAnalyze,
  onViewReport,
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentEmails, setRecentEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [analyticsData, emails] = await Promise.all([
          fetchAnalytics(),
          fetchEmails('All'),
        ]);
        setAnalytics(analyticsData);
        setRecentEmails(emails.slice(0, 5)); // show latest 5
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !analytics) {
    return <LoadingState message="Aggregating security telemetry..." fullPage />;
  }

  const { summary, threatDistribution } = analytics;

  return (
    <div className="space-y-6">
      {/* Top Academic & Demonstration Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-4 sm:p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950/70 border border-blue-800/80 px-2 py-0.5 rounded">
              Academic Architecture Demo
            </span>
            <span className="text-xs text-slate-400">Multi-Agent SOC Operations</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            AI-Powered Email Threat Detection & Security Analysis
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Evidence-grounded email threat analysis coordinating specialized extraction, threat intelligence, RAG vector retrieval, and reporting agents. Values below are dynamic mock demonstration objects.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onNavigateToAnalyze}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Analyze New Email</span>
          </button>
        </div>
      </div>

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard
          label="Total Analyzed"
          value={summary.totalAnalyzed}
          icon={Mail}
          trend="+12 today"
          trendType="neutral"
          subtext="Inbound corpus"
          accentColor="slate"
        />
        <StatCard
          label="Safe Emails"
          value={summary.safeCount}
          icon={ShieldCheck}
          trend={`${Math.round((summary.safeCount / summary.totalAnalyzed) * 100)}%`}
          trendType="positive"
          subtext="Verified clean"
          accentColor="emerald"
        />
        <StatCard
          label="Suspicious"
          value={summary.suspiciousCount}
          icon={AlertTriangle}
          trend="Flagged"
          trendType="warning"
          subtext="Review required"
          accentColor="amber"
        />
        <StatCard
          label="Phishing Emails"
          value={summary.phishingCount}
          icon={ShieldAlert}
          trend="High Alert"
          trendType="danger"
          subtext="Quarantined"
          accentColor="rose"
        />
        <StatCard
          label="Avg Risk Score"
          value={`${summary.averageRiskScore}`}
          icon={Gauge}
          trend="/ 100"
          trendType="neutral"
          subtext="Mean corpus index"
          accentColor="blue"
        />
      </div>

      {/* Middle Section: Threat Distribution Donut Chart & Architecture Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Distribution Chart (Recharts Donut) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Threat Distribution</h3>
              <span className="text-[10px] font-mono text-slate-400">Recharts Visualization</span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Proportion of evaluated emails across threat classifications
            </p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={threatDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {threatDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} emails`, name]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-mono text-slate-400">Corpus</span>
              <span className="text-xl font-bold font-mono text-slate-900">{summary.totalAnalyzed}</span>
            </div>
          </div>

          {/* Clean Legend Matrix */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            {threatDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium text-xs">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Intended System Architecture & Multi-Agent Flow Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Intended Multi-Agent Threat Architecture</h3>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Orchestration Schema
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Real-world academic pipeline separating raw untrusted inputs from specialized analytical agents:
            </p>

            <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              <div className="text-blue-400 font-bold mb-1">Incoming Stream: User / Gmail OAuth</div>
              <div className="text-slate-400">      ↓</div>
              <div className="text-emerald-400 font-bold">Untrusted Email Input (Sanitized Sandbox)</div>
              <div className="text-slate-400">      ↓</div>
              <div className="text-amber-400 font-bold">AI Orchestrator (LangGraph / State Machine)</div>
              <div className="text-slate-400">      ↓</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 text-[11px]">
                <div className="bg-slate-800 p-2 rounded border border-slate-700 text-blue-300">
                  <strong>Agent 1:</strong> Email Analysis (MIME, Sentiment, Headers)
                </div>
                <div className="bg-slate-800 p-2 rounded border border-slate-700 text-purple-300">
                  <strong>Agent 2:</strong> Threat Intel (DNS, WHOIS, IP Feeds)
                </div>
                <div className="bg-slate-800 p-2 rounded border border-slate-700 text-teal-300">
                  <strong>Agent 3:</strong> RAG Evidence (ChromaDB / MITRE ATT&CK)
                </div>
              </div>
              <div className="text-slate-400">      ↓</div>
              <div className="text-rose-400 font-bold">Report Agent (Structured Synthesis & Action Recommendation)</div>
              <div className="text-slate-400">      ↓</div>
              <div className="text-slate-200 font-bold">Security Dashboard & Evidence Audit Dossier</div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Explainable AI (XAI): Grounded findings rather than simple probability labels</span>
            <button
              onClick={onNavigateToInbox}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Email Triage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Emails Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Analyzed Emails</h3>
            <p className="text-xs text-slate-500">
              Latest submissions processed through the security pipeline
            </p>
          </div>
          <button
            onClick={onNavigateToInbox}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Inbox ({summary.totalAnalyzed})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4 min-w-[260px]">Subject</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEmails.map((email) => (
                <tr
                  key={email.id}
                  onClick={() => onViewReport(email.id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                      <span>{email.senderName}</span>
                      {email.prompt_injection_suspected && (
                        <span className="text-rose-600 font-bold" title="Prompt injection attempt">
                          ⚠
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                      {email.senderEmail}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="truncate max-w-[300px]">{email.subject}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <ThreatBadge classification={email.classification} size="sm" />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <RiskScoreBar score={email.risk_score} size="sm" />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {email.receivedDate}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Analyzed
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onViewReport(email.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <FileSearch className="w-3.5 h-3.5" />
                      <span>View Report</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
