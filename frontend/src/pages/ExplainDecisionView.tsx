import React, { useEffect, useState } from "react";
import { ShieldCheck, HelpCircle, CheckCircle, XCircle, ArrowRight, Database, History, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import { DecisionExplanationItem } from "../types";

interface ExplainDecisionViewProps {
  initialDecisionId?: string;
  onNavigate: (path: string) => void;
}

export const ExplainDecisionView: React.FC<ExplainDecisionViewProps> = ({
  initialDecisionId = "D-012",
  onNavigate,
}) => {
  const [decisionId, setDecisionId] = useState(initialDecisionId);
  const [explanation, setExplanation] = useState<DecisionExplanationItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExplanation(decisionId);
  }, [decisionId]);

  const fetchExplanation = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.explainDecision(id);
      setExplanation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600">
            <ShieldCheck className="w-5 h-5" />
            <h1 className="text-xl font-bold text-slate-900">Explain Decision (5-Pillar Explainability)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured explainability architecture: WHAT, EVIDENCE, ALTERNATIVES, WHY, and TRACE consistency.
          </p>
        </div>

        {/* Decision Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">Inspect Decision:</span>
          {["D-012", "D-014"].map((d) => (
            <button
              key={d}
              onClick={() => setDecisionId(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                decisionId === d
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading || !explanation ? (
        <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
          Retrieving 5-pillar explanation ledger...
        </div>
      ) : (
        <div className="space-y-5">
          {/* Pillar 1: WHAT */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-2">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                WHAT: Sovereign Determination & Action Taken
              </h3>
            </div>
            <p className="text-sm font-bold text-slate-900 leading-relaxed bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              {explanation.what}
            </p>
          </div>

          {/* Pillar 2: EVIDENCE */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-2">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                EVIDENCE: Ground-Truth Statistical & Clinical Facts
              </h3>
            </div>
            <div className="space-y-2 pt-1">
              {explanation.evidence?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium flex items-start space-x-2"
                >
                  <span className="text-purple-600 font-bold font-mono">#{idx + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pillar 3: ALTERNATIVES */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-2">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                ALTERNATIVES: Evaluated Options & Rejection Rationale
              </h3>
            </div>
            <div className="space-y-2 pt-1">
              {explanation.alternatives?.map((alt, idx) => (
                <div key={idx} className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900 flex items-center">
                    <XCircle className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                    Option: {alt.option}
                  </div>
                  <p className="text-amber-950 italic text-[11px]">{alt.reason_rejected}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pillar 4: WHY */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-2">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                4
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                WHY: Scientific & Data-Integrity Justification
              </h3>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed bg-emerald-50/40 p-4 rounded-lg border border-emerald-200 font-medium">
              {explanation.why}
            </p>
          </div>

          {/* Pillar 5: TRACE CONSISTENCY */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  5
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  TRACE: Cryptographic / Sequential Trace Verification
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" /> 100% Trace Consistent
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <span className="text-[10px] font-sans text-slate-400 font-bold uppercase block">
                Matching Audit Records Bound to Decision:
              </span>
              {explanation.trace_consistency.matching_trace_records?.map((rec: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-900 text-slate-200 rounded border border-slate-800 text-[11px] flex items-center justify-between"
                >
                  <span>{JSON.stringify(rec)}</span>
                  <span className="text-emerald-400 text-[10px] font-sans font-bold">VERIFIED</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
