import React, { useEffect, useState } from "react";
import { Hourglass, ShieldAlert, ArrowRight, UserCheck, CheckCircle } from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";

interface PendingDecisionsViewProps {
  onNavigate: (path: string) => void;
}

export const PendingDecisionsView: React.FC<PendingDecisionsViewProps> = ({ onNavigate }) => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await api.getPendingDecisions();
      setDecisions(data);
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
          <div className="flex items-center space-x-2 text-amber-600">
            <Hourglass className="w-5 h-5" />
            <h1 className="text-xl font-bold text-slate-900">Pending Human Decisions & Standing Limits</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Surveillance aging tracker. Strictly enforces the principle: Silence is never interpreted as approval.
          </p>
        </div>

        <button
          onClick={() => onNavigate("/monitor/human-gate")}
          className="flex items-center px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <UserCheck className="w-3.5 h-3.5 mr-1" /> Open Human Gate Desk
        </button>
      </div>

      {/* Regulatory Notice */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="block text-amber-950 font-bold mb-0.5">Human Decision Aging Protocol</strong>
          If an escalation remains unanswered across multiple cuts (e.g. 4 cuts), the system logs that approval was not received and maintains protective measures under pre-configured standing protocol safety limits.
        </div>
      </div>

      {/* Decisions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Decision ID</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Clinical Issue</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Cuts Waiting</th>
              <th className="py-3 px-4">Standing Limit Policy Action</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Checking surveillance decision aging...
                </td>
              </tr>
            ) : decisions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No pending decisions recorded.
                </td>
              </tr>
            ) : (
              decisions.map((d) => (
                <tr key={d.decision_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{d.decision_id}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{d.subject_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{d.issue_title}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        d.cuts_waiting >= 4
                          ? "bg-rose-100 text-rose-800"
                          : d.cuts_waiting >= 2
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {d.cuts_waiting} cuts
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs">{d.standing_limit_action}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onNavigate("/monitor/human-gate")}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded text-xs hover:bg-blue-100 transition-colors inline-flex items-center"
                    >
                      Review <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
