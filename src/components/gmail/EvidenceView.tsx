import React from 'react';
import { BookOpen, Shield, Database, ExternalLink } from 'lucide-react';

export const EvidenceView: React.FC = () => {
  const articles = [
    {
      id: 'KB-01',
      title: 'Credential Harvesting via Lookalike Domains',
      category: 'Phishing',
      technique: 'MITRE ATT&CK T1566.002',
      url: 'https://attack.mitre.org/techniques/T1566/002/',
      summary: 'Adversaries register typosquatted domains imitating single-sign-on (SSO) gateways to capture corporate credentials.',
    },
    {
      id: 'KB-02',
      title: 'Executive Pretext & Wire Fraud (CEO Fraud / BEC)',
      category: 'Business Email Compromise',
      technique: 'MITRE ATT&CK T1566.001',
      url: 'https://attack.mitre.org/techniques/T1566/001/',
      summary: 'Pretexts involving flight travel, urgent acquisition escrows, and explicit suppression of phone verification.',
    },
    {
      id: 'KB-03',
      title: 'Adversarial Prompt Injection in Untrusted Payload',
      category: 'Social Engineering',
      technique: 'OWASP LLM01',
      url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/',
      summary: 'Embedded instruction override directives targeting LLM security analyzers to force false Safe verdicts.',
    },
    {
      id: 'KB-04',
      title: 'HTML Smuggling via Active Scripts in Attachments',
      category: 'Malicious URLs',
      technique: 'MITRE ATT&CK T1027.006',
      url: 'https://attack.mitre.org/techniques/T1027/006/',
      summary: 'Obfuscated JavaScript or HTML templates (.htm, .vbs) used to assemble payloads locally within victim browsers.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Evidence & Knowledge Base (RAG)</h2>
        <p className="text-xs text-slate-500">
          Cybersecurity taxonomies and MITRE ATT&CK grounding vectors referenced by the threat pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((art) => (
          <div key={art.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {art.category}
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {art.technique}
              </span>
            </div>

            <h3 className="font-bold text-slate-900 text-sm">{art.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">{art.summary}</p>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <a
                href={art.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Read Taxonomy Standard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
