import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  Shield,
  Gauge,
  Calendar,
  Layers,
} from 'lucide-react';
import { AnalyticsData } from '../types';
import { fetchAnalytics } from '../services/api';
import { LoadingState } from '../components/common/LoadingState';
import { StatCard } from '../components/common/StatCard';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchAnalytics();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return <LoadingState message="Synthesizing telemetry analytics..." fullPage />;
  }

  const { summary, threatDistribution, riskScoreBuckets, volumeOverTime, topIndicators } = data;

  return (
    <div className="space-y-6">
      {/* Top Academic & Data Integrity Notice */}
      <div className="p-4 bg-slate-900 text-slate-200 border border-slate-800 rounded-xl space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-wider bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
            Telemetry Dashboard
          </span>
          <span className="text-xs text-slate-400">Endpoint: GET /api/analytics</span>
        </div>
        <h2 className="text-lg font-bold text-white">Aggregated Threat Analytics & Distributions</h2>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          The charts below illustrate corpus distributions and threat telemetry formatted for future backend synthesis. In accordance with academic methodology, formal model evaluation benchmarks (precision, recall, F1) are kept in the separate Dataset Evaluation module awaiting test run execution.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Volume"
          value={summary.totalAnalyzed}
          icon={Layers}
          trend="+8 this week"
          trendType="neutral"
          subtext="Analyzed emails"
          accentColor="slate"
        />
        <StatCard
          label="Malicious / Phishing"
          value={summary.phishingCount}
          icon={Shield}
          trend={`${Math.round((summary.phishingCount / summary.totalAnalyzed) * 100)}%`}
          trendType="danger"
          subtext="Quarantined rate"
          accentColor="rose"
        />
        <StatCard
          label="Average Risk Index"
          value={`${summary.averageRiskScore}`}
          icon={Gauge}
          trend="/ 100 scale"
          trendType="neutral"
          subtext="Mean corpus score"
          accentColor="blue"
        />
        <StatCard
          label="Critical Severity Hits"
          value={summary.criticalAlertsCount}
          icon={AlertCircle}
          trend="Score ≥ 80"
          trendType="warning"
          subtext="High-risk incidents"
          accentColor="amber"
        />
      </div>

      {/* Row 1: Emails Over Time (Area Chart) & Threat Breakdown (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Emails Analyzed Over Time (Area Chart) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Emails Analyzed Over Time</h3>
              <p className="text-xs text-slate-500">
                Daily volume partitioned by safe and suspicious threat signals
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Last 6 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPhishing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  name="Total Analyzed"
                />
                <Area
                  type="monotone"
                  dataKey="phishing"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPhishing)"
                  name="Phishing Incidents"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Distribution (Donut Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Classification Breakdown</h3>
              <span className="text-[10px] font-mono text-slate-400">Share %</span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Proportion of overall corpus categories
            </p>
          </div>

          <div className="h-52 w-full relative">
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

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {threatDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <div className="font-mono text-slate-900">
                  {item.value} ({Math.round((item.value / summary.totalAnalyzed) * 100)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Risk Score Distribution & Top Indicators Detected */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Score Distribution Buckets (Bar Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Risk Score Distribution</h3>
              <p className="text-xs text-slate-500">
                Number of emails clustered by 20-point risk score severity buckets
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Histogram
            </span>
          </div>

          <div className="h-60 w-full">
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
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="Email Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Indicators Frequency */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Top Detected Threat Indicators</h3>
              <span className="text-[10px] font-mono text-slate-400">Frequency Ranking</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Most recurring anomalies flagged across analyzed emails
            </p>
          </div>

          <div className="space-y-2.5">
            {topIndicators.map((ind, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 truncate max-w-[280px]">
                    {ind.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                        ind.severity === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : ind.severity === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ind.severity}
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs w-6 text-right">
                      {ind.frequency}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${
                      ind.severity === 'Critical'
                        ? 'bg-rose-600'
                        : ind.severity === 'High'
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, (ind.frequency / 40) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Normalized across 148 analyzed messages</span>
            <span className="font-mono">FastAPI: /api/analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
};
