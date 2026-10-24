import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Layers,
  RefreshCw,
  Gauge,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { fetchAnalytics, AnalyticsSummary } from '../../services/api';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAnalytics();
      setData(res);
    } catch (err) {
      console.error('[ANALYTICS] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 p-12 text-center text-xs text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
        <div>Computing dynamic analytics from your database...</div>
      </div>
    );
  }

  const { summary, threatDistribution, riskScoreBuckets } = data;

  return (
    <div className="workspace-page space-y-6">
      {/* Header */}
      <div className="workspace-header">
        <div>
          <h2 className="workspace-title">Security Telemetry & Analytics</h2>
          <p className="workspace-description">
            Real-time security metrics derived dynamically from your authenticated mailbox database
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-700 hover:border-blue-200 shadow-sm transition-colors cursor-pointer" aria-label="Refresh analytics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Dynamic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="workspace-card p-5 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Emails</div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">{summary.totalEmails}</div>
          <div className="text-[11px] text-slate-500">Inbound corpus stored</div>
        </div>

        <div className="workspace-card p-5 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Analyzed Emails</div>
          <div className="text-3xl font-extrabold font-mono text-blue-600">{summary.analyzedEmails}</div>
          <div className="text-[11px] text-slate-500">Processed by AI pipeline</div>
        </div>

        <div className="workspace-card p-5 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Threats Detected</div>
          <div className="text-3xl font-extrabold font-mono text-rose-600">{summary.threatsDetected}</div>
          <div className="text-[11px] text-slate-500">Phishing & suspicious hits</div>
        </div>

        <div className="workspace-card p-5 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mean Risk Score</div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">{summary.averageRiskScore} <span className="text-xs text-slate-400 font-normal">/ 100</span></div>
          <div className="text-[11px] text-slate-500">Deterministic index</div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Distribution */}
        <div className="workspace-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Threat Classification Share</h3>
            <p className="text-xs text-slate-500 mb-4">Distribution of verdicts for analyzed messages</p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={threatDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {threatDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            {threatDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1 rounded bg-slate-50">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Score Buckets */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Risk Score Histogram</h3>
            <p className="text-xs text-slate-500 mb-4">Emails partitioned into 20-point risk score bands</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskScoreBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} emails`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono text-center">
            Evaluated deterministically from user database records
          </div>
        </div>
      </div>
    </div>
  );
};
