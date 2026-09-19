import React, { useState, useEffect } from "react";
import { MessageSquare, Send, ShieldCheck, ShieldAlert, Sparkles, FileText, ArrowRight } from "lucide-react";
import { api } from "../services/api";
import { AskAtlasResult } from "../types";
import { EvidenceDrawer } from "../components/EvidenceDrawer";

interface AskAtlasProps {
  initialQuestion?: string;
  onNavigate: (path: string) => void;
}

export const AskAtlas: React.FC<AskAtlasProps> = ({ initialQuestion = "", onNavigate }) => {
  const [question, setQuestion] = useState(
    initialQuestion || "Show all subjects with liver disease and their current treatment."
  );
  const [result, setResult] = useState<AskAtlasResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  const sampleQuestions = [
    "Show all subjects with liver disease and their current treatment.",
    "Which subjects have liver disease?",
    "Which liver disease subjects received Drug A?",
    "Which subjects have elevated ALT?",
    "Show the treatment history of Subject 042-S07-001.",
    "Which subjects had a serious adverse event?",
    "Which subjects at Site S01 received a wrong dose?",
    "Which subjects have heart failure?", // Trap question
  ];

  useEffect(() => {
    if (initialQuestion) {
      handleAsk(initialQuestion);
    } else {
      handleAsk(question);
    }
  }, []);

  const handleAsk = async (qText: string) => {
    if (!qText.trim()) return;
    setLoading(true);
    try {
      const res = await api.askAtlas(qText);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-blue-600">
          <MessageSquare className="w-5 h-5" />
          <h1 className="text-xl font-bold text-slate-900">Ask ATLAS: Natural Language Clinical Inquiry</h1>
        </div>
        <p className="text-xs text-slate-500">
          Query trial intelligence deterministically. ATLAS evaluates intent and verifies facts against primary EDC records.
          Hallucinations and ungrounded speculation are strictly prohibited.
        </p>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(question);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask ATLAS a trial question..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center transition-colors"
          >
            {loading ? "Querying..." : "Ask ATLAS"} <Send className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </form>

        {/* Question Shortcuts */}
        <div className="space-y-1.5 pt-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Suggested Trial Questions & Trap Tests:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sampleQuestions.map((q, idx) => {
              const isTrap = q.includes("heart failure");
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuestion(q);
                    handleAsk(q);
                  }}
                  className={`px-2.5 py-1 text-[11px] rounded font-medium border transition-colors ${
                    isTrap
                      ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {isTrap ? "🚨 [Trap Test] " : ""}{q}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Answer Container */}
      {result && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Answer Banner */}
          <div
            className={`p-5 border-b flex items-start justify-between ${
              result.kind === "TRAP"
                ? "bg-amber-50/70 border-amber-200 text-amber-950"
                : "bg-blue-50/50 border-blue-100 text-slate-900"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    result.kind === "TRAP"
                      ? "bg-amber-200 text-amber-900"
                      : "bg-blue-200 text-blue-900"
                  }`}
                >
                  {result.kind} QUERY
                </span>
                <span className="text-xs text-slate-500 font-mono">Confidence: {result.confidence * 100}% (Deterministic)</span>
              </div>
              <p className="text-sm font-semibold pt-1">{result.answer}</p>
              {result.warning && (
                <p className="text-xs text-amber-800 flex items-center mt-1">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-600" /> {result.warning}
                </p>
              )}
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Evidence Verified
            </div>
          </div>

          {/* Results Details Table / List */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Ground-Truth Extracted Records ({result.total_count})
              </h3>
            </div>

            {Array.isArray(result.results) && result.results.length > 0 ? (
              <div className="space-y-2">
                {result.results.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-blue-700">{r.subject_id}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600 font-medium">Site: {r.site_id}</span>
                        {r.disease && (
                          <>
                            <span className="text-slate-400">·</span>
                            <span className="text-purple-700 font-semibold">{r.disease}</span>
                          </>
                        )}
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        {r.primary_treatment && (
                          <span>Treatment: <strong>{r.primary_treatment}</strong> ({r.treatment_status})</span>
                        )}
                        {r.test && (
                          <span>Lab: <strong>{r.test} = {r.value} {r.unit}</strong> ({r.ratio_uln}x ULN)</span>
                        )}
                        {r.event && (
                          <span>Event: <strong>{r.event}</strong> ({r.severity})</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate(`/subjects/${r.subject_id}`)}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-blue-600 rounded text-xs font-semibold flex items-center transition-colors"
                    >
                      Subject 360 <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                ))}
              </div>
            ) : result.kind === "TRAP" ? (
              <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                <p className="font-bold text-slate-800">No unsupported records found</p>
                <p className="mt-1">
                  ATLAS strictly avoids hallucinations. The condition was checked against all registered CDISC domains and found to be unestablished.
                </p>
              </div>
            ) : null}

            {/* Evidence Provenance Citations */}
            {result.evidence && result.evidence.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Attached RecordRef Evidence:
                </span>
                <div className="space-y-1">
                  {result.evidence.map((ev, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEvidence(ev.summary)}
                      className="w-full text-left p-2 bg-slate-100/70 hover:bg-slate-200/60 rounded border border-slate-200 text-xs font-mono text-slate-700 flex items-center justify-between"
                    >
                      <span>{ev.summary}</span>
                      <span className="text-blue-600 text-[11px] font-sans font-semibold">Inspect Record</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={Boolean(selectedEvidence)}
        onClose={() => setSelectedEvidence(null)}
        evidenceRef={selectedEvidence}
      />
    </div>
  );
};
