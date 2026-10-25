import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw,
  Shield,
  Bot,
  User,
  CheckCircle2,
  HelpCircle,
  Terminal,
} from 'lucide-react';
import { askChatbot, ChatMessage } from '../../services/api';

interface ThreatChatbotProps {
  contextType: 'compose' | 'analyst';
  contextId?: string;
  emailId?: string;
  analysisId?: string;
  draftData?: {
    recipientEmail?: string;
    subject?: string;
    body?: string;
    urls?: string[];
    attachmentInfo?: any[];
  };
  initialMessages?: ChatMessage[];
  onMessageAdded?: (msg: ChatMessage) => void;
  title?: string;
}

const ANALYST_STARTER_QUESTIONS = [
  'Why is this email suspicious?',
  'Which indicators caused the risk score?',
  'Is the sender trustworthy?',
  'Explain the suspicious URL.',
  'What should I do next?',
  'Summarize the evidence in simple language.',
];

const COMPOSE_STARTER_QUESTIONS = [
  'Is this email draft safe to send?',
  'Does my draft contain accidental phishing indicators?',
  'Check for high-urgency or coercive language.',
  'Are the links in my draft safe?',
];

export const ThreatChatbot: React.FC<ThreatChatbotProps> = ({
  contextType,
  contextId,
  emailId,
  analysisId,
  draftData,
  initialMessages = [],
  onMessageAdded,
  title = 'Analyst AI Copilot',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync initial messages when changed externally
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (questionToSend?: string) => {
    const query = (questionToSend || inputQuestion).trim();
    if (!query || isLoading) return;

    setErrorMessage(null);
    setLastQuestion(query);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (onMessageAdded) onMessageAdded(userMsg);
    if (!questionToSend) setInputQuestion('');

    setIsLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await askChatbot({
        contextType,
        contextId,
        question: query,
        emailId,
        analysisId,
        draftData,
        history,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: response.answer,
        timestamp: response.timestamp || new Date().toISOString(),
        evidenceUsed: response.evidenceUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (onMessageAdded) onMessageAdded(assistantMsg);
    } catch (err: any) {
      console.error('[CHATBOT UI] Query error:', err);
      setErrorMessage(err.message || 'Failed to retrieve response from AI assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const starterQuestions = contextType === 'compose' ? COMPOSE_STARTER_QUESTIONS : ANALYST_STARTER_QUESTIONS;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs font-sans">
      {/* Header (Sleek Cybersecurity Command Styling) */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-sky-300 flex items-center justify-center shadow-[0_0_10px_rgba(37,99,235,0.3)] border border-blue-400/40">
            <Sparkles className="w-4 h-4 text-sky-300 drop-shadow-xs" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-extrabold text-white tracking-tight">{title}</h4>
              <span className="text-[9px] font-mono font-bold uppercase bg-blue-500/20 text-sky-200 px-1.5 py-0.2 rounded border border-blue-400/30">
                SOC AI
              </span>
            </div>
            <p className="text-[10px] text-slate-300">
              Grounded in email context & MITRE ATT&CK RAG
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      </div>

      {/* Suggested Starter Questions (when conversation is fresh) */}
      {messages.length === 0 && (
        <div className="p-3.5 bg-gradient-to-b from-blue-50/80 via-blue-50/40 to-transparent border-b border-blue-100 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Suggested Inquiries:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {starterQuestions.slice(0, 4).map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="text-[11px] font-medium text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-xl px-2.5 py-1.5 transition-all text-left cursor-pointer shadow-2xs active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[140px] text-xs">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-2xs mb-2.5">
              <Shield className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">Analyst Copilot Ready</p>
            <p className="text-[11px] text-slate-500 max-w-[260px] mt-1 leading-relaxed">
              Ask about threat indicators, suspicious links, domain reputation, or recommended next steps.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs border border-blue-400/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-br-xs font-medium shadow-blue-500/10'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {!isUser && m.evidenceUsed && m.evidenceUsed.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Terminal className="w-2.5 h-2.5 text-blue-600" />
                        Grounded Evidence:
                      </span>
                      {m.evidenceUsed.map((ev, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
                          <span>{ev}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    className={`text-[9px] mt-1.5 text-right font-mono ${
                      isUser ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs border border-blue-400/30">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-4 py-2.5 shadow-2xs flex items-center gap-2.5 text-slate-600 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="font-medium text-slate-700">Evaluating grounded evidence & threat indicators...</span>
            </div>
          </div>
        )}

        {/* Error State with Retry */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-2 text-rose-700 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            {lastQuestion && (
              <button
                type="button"
                onClick={() => handleSend(lastQuestion)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-slate-200/90 shrink-0">
        <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-500/15 transition-all shadow-inner-xs">
          <textarea
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              contextType === 'compose'
                ? 'Ask about draft safety, indicators, or wording...'
                : 'Ask a question about this threat, URL, or sender...'
            }
            rows={1}
            disabled={isLoading}
            className="w-full text-xs text-slate-800 bg-transparent resize-none outline-hidden px-2 py-1 max-h-24 min-h-[32px] placeholder-slate-400"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputQuestion.trim() || isLoading}
            className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              inputQuestion.trim() && !isLoading
                ? 'bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white shadow-xs active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Send question (Enter)"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
