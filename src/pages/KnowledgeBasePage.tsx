import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Database,
  Tag,
  ShieldAlert,
  ExternalLink,
  Layers,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { KnowledgeItem } from '../types';
import { fetchEvidence } from '../services/api';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';

export const KnowledgeBasePage: React.FC = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Phishing',
    'Business Email Compromise',
    'Credential Harvesting',
    'Impersonation',
    'Social Engineering',
    'Malicious URLs',
  ];

  const loadData = async (cat = selectedCategory, q = searchQuery) => {
    try {
      setLoading(true);
      const res = await fetchEvidence(q, cat);
      setItems(res);
    } catch (err) {
      console.error('Failed to load evidence knowledge items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
              RAG Vector Store
            </span>
            <span className="text-xs text-slate-500">ChromaDB Integration Target</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Evidence Knowledge Base & Threat Vectors</h2>
          <p className="text-xs text-slate-500">
            Vectorized threat taxonomy, MITRE ATT&CK techniques, and evidence grounding patterns
          </p>
        </div>
      </div>

      {/* ChromaDB / RAG Architecture Note */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 text-teal-400 font-bold">
            <Database className="w-4 h-4" />
            <span>ChromaDB Vector Retrieval Pipeline</span>
          </div>
          <p className="text-slate-300 max-w-2xl leading-relaxed">
            During threat scanning, Agent 3 (RAG / Evidence Agent) embeds email tokens using sentence transformers and performs cosine similarity search against this vector collection to retrieve verifiable attack precedents.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-[11px] font-mono text-teal-300 bg-teal-950 px-2.5 py-1 rounded border border-teal-800">
            Endpoint: GET /api/evidence
          </span>
        </div>
      </div>

      {/* Search & Category Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Categories Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search taxonomy or MITRE ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Knowledge Base Item Grid */}
      {loading ? (
        <LoadingState message="Querying vector knowledge records..." />
      ) : items.length === 0 ? (
        <EmptyState
          title="No taxonomy records found"
          description="Try broadening your category filter or search keywords."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {item.category}
                  </span>
                  {item.mitreAttackId && (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      MITRE: {item.mitreAttackId}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.summary}
                </p>

                {/* Indicators / Signals */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Recognized Signals:
                  </span>
                  <div className="space-y-1">
                    {item.indicators.map((ind, i) => (
                      <div
                        key={i}
                        className="text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100 flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                        <span>{ind}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-teal-700">
                  <CheckCircle2 className="w-3 h-3 text-teal-600" />
                  {item.vectorDbStatus}
                </span>
                <span>Updated: {item.lastUpdated}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
