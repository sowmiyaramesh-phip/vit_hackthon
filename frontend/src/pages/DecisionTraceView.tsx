import React, { useEffect, useState } from "react";
import { History, ShieldCheck, Download, Filter, ArrowRight } from "lucide-react";
import { api } from "../services/api";
import { TraceItem } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { EvidenceDrawer } from "../components/EvidenceDrawer";

interface DecisionTraceViewProps {
  onNavigate: (path: string) => void;
}

export const DecisionTraceView: React.FC<DecisionTraceViewProps> = ({ onNavigate }) => {
  const [trace, setTrace] = useState<TraceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  useEffect(() => {
    fetchTrace();
  }, []);

  const fetchTrace = async () => {
    try {
      setLoading(true);
      const data = await api.getDecisionTrace();
      setTrace(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600">
            <History className="w-5 h-5" />
            <h1 className="text-xl font-bold text-slate-900">Decision Trace (21 CFR Part 11 Audit Trail)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sequential, immutable record of decisions made at each Review Crew node and human gate.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Immutable Sequential Ledger
          </span>
        </div>
      </div>

      {/* Sequential Trace Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Trace ID</th>
              <th className="py-3 px-4">Node</th>
              <th className="py-3 px-4">Decision Outcome</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Protocol Version</th>
              <th className="py-3 px-4">Clinical Notes & Action</th>
              <th className="py-3 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  Loading Decision Trace ledger...
                </td>
              </tr>
            ) : trace.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No trace entries recorded yet.
                </td>
              </tr>
            ) : (
              trace.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{t.id}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 font-bold text-[10px] uppercase rounded bg-slate-100 text-slate-800">
                      {t.node}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={t.decision} />
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    {t.subject_id ? (
                      <button
                        onClick={() => onNavigate(`/subjects/${t.subject_id}`)}
                        className="hover:underline"
                      >
                        {t.subject_id}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{t.actor}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{t.protocol_version}</td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-sm truncate" title={t.notes}>
                    {t.notes}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[10px] text-slate-400">
                    {t.timestamp}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={Boolean(selectedEvidence)}
        onClose={() => setSelectedEvidence(null)}
        evidenceRef={selectedEvidence}
      />
    </div>
  );
};
