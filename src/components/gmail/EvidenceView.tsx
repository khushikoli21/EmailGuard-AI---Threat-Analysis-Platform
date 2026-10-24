import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { fetchKnowledgeBase } from '../../services/api';

export const EvidenceView: React.FC = () => {
  const [articles, setArticles] = useState<Array<{id:string;name:string;category:string;technique:string;description:string;url?:string}>>([]);
  const [error, setError] = useState('');
  useEffect(() => { fetchKnowledgeBase().then(data => setArticles(data.items)).catch(() => setError('Knowledge base is unavailable.')); }, []);

  return (
    <div className="workspace-page space-y-6">
      <div className="workspace-header">
        <div>
          <h2 className="workspace-title">Evidence & Knowledge Base</h2>
          <p className="workspace-description">
            Cybersecurity taxonomies and MITRE ATT&CK grounding vectors referenced by the threat pipeline
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-slate-500">{error}</p>}
      {!error && articles.length === 0 && <p className="text-sm text-slate-500">No knowledge documents are loaded.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((art) => (
          <div key={art.id} className="workspace-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {art.category}
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {art.technique}
              </span>
            </div>

            <h3 className="font-bold text-slate-900 text-sm">{art.name}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">{art.description}</p>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <a
                href={art.url || 'https://attack.mitre.org/'}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Open source reference</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
