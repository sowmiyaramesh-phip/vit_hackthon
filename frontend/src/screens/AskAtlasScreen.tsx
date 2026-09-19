import React, { useState } from 'react';
import { MessageSquare, Search, Sparkles, CheckCircle2, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { Study, AtlasAnswer } from '../types';
import { askAtlas } from '../api';

interface AskAtlasScreenProps {
  study: Study;
  onViewEvidence?: (evidence: any[]) => void;
}

export const AskAtlasScreen: React.FC<AskAtlasScreenProps> = ({ study, onViewEvidence }) => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AtlasAnswer | null>(null);
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    "How many subjects experienced severe adverse events?",
    "Show ALT for 042-S02-004.",
    "Find potential Hy's Law cases.",
    "Which subjects had an AE before first dose?",
    "What was the exact numeric viral load for subject 042-S07-004?",
    "What was the baseline ALT for subject 999-XXX-000?",
    "How many subjects had serious adverse events?"
  ];

  const handleAsk = async (qText?: string) => {
    const q = (qText || question).trim();
    if (!q) return;
    if (qText) setQuestion(qText);
    setLoading(true);
    try {
      const ans = await askAtlas(study.id, q);
      setResult(ans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Ask ATLAS</h1>
        </div>
        <p className="text-sm text-slate-400">
          Natural-language clinical intelligence query planner. Deterministic multi-table execution with verifiable record citations.
        </p>
      </div>

      {/* Query Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="relative"
      >
        <div className="relative flex items-center bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-2xl shadow-xl transition overflow-hidden">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about this study (e.g. 'Show ALT for 042-S02-004' or 'Find potential Hy's Law cases')..."
            className="w-full bg-transparent pl-5 pr-28 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow transition flex items-center space-x-1"
          >
            <span>{loading ? 'Analyzing...' : 'Ask ATLAS'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Suggestions */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suggested Reviewer Inquiries:</span>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(sq)}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition text-left"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Answer Result Display */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {result.question_type} QUERY
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                result.status === 'ANSWERED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                result.question_type === 'TRAP' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
              }`}>
                {result.status}
              </span>
            </div>

            {result.evidence && result.evidence.length > 0 && onViewEvidence && (
              <button
                onClick={() => onViewEvidence(result.evidence)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Evidence Drawer ({result.evidence.length} RecordRefs)</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-100 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              {result.answer}
            </div>
          </div>

          {/* Calculation & Rules */}
          {(result.calculation_details || result.protocol_rule) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              {result.calculation_details && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Deterministic Arithmetic</span>
                  <p className="font-mono text-indigo-300 text-[11px]">{result.calculation_details}</p>
                </div>
              )}
              {result.protocol_rule && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Protocol Rule Citation</span>
                  <p className="text-slate-300 text-[11px]">{result.protocol_rule}</p>
                </div>
              )}
            </div>
          )}

          {/* Record References Citations */}
          {result.evidence && result.evidence.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Record Citations (Provenance Chain)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {result.evidence.map((ev, i) => (
                  <div key={i} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-mono font-bold text-indigo-300 text-[11px]">{ev.record_id}</div>
                      <div className="text-[10px] text-slate-400">{ev.record_type} • {ev.field || 'Record'}</div>
                    </div>
                    {ev.value && (
                      <span className="font-mono text-amber-400 text-[11px]">{ev.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
