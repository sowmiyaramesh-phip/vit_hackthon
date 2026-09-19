import React, { useState } from "react";
import { Users2, Play, CheckCircle, Clock, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { api } from "../services/api";

interface ReviewCrewViewProps {
  onNavigate: (path: string) => void;
}

export const ReviewCrewView: React.FC<ReviewCrewViewProps> = ({ onNavigate }) => {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<any>(null);

  const nodes = [
    { name: "1. DETECT", status: "COMPLETED", desc: "Evaluates SDTM domains against protocol rules (Hy's law, DILI, dose deviations).", icon: "✓" },
    { name: "2. MEDICAL REVIEW", status: "COMPLETED", desc: "Assesses clinical seriousness, plausibility, and drafts safety escalations.", icon: "✓" },
    { name: "3. DATA MANAGER", status: "COMPLETED", desc: "Audits discrepancies, dispatches formal actionable site queries.", icon: "✓" },
    { name: "4. COMPLIANCE", status: "COMPLETED", desc: "Compares cohorts against active protocol version (v1.0 ±7d vs v2.0 ±3d).", icon: "✓" },
    { name: "5. HUMAN GATE", status: "WAITING_INPUT", desc: "Sovereign safety checkpoint: Medical Monitor APPROVES, REJECTS, or CLARIFIES.", icon: "●" },
    { name: "6. EXECUTE", status: "PENDING", desc: "Finalizes committed actions, updates monitoring memory, generates cycle report.", icon: "○" },
  ];

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await api.runReviewCycle();
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600">
            <Users2 className="w-5 h-5" />
            <h1 className="text-xl font-bold text-slate-900">MONITOR: 6-Node Review Crew</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sequential multi-agent monitoring pipeline enforcing sovereign human gate oversight.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Play className="w-4 h-4 mr-1.5" />
          {running ? "Executing 6 Sequential Nodes..." : "Execute Review Cycle"}
        </button>
      </div>

      {/* 6 Sequential Nodes Visualization */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Review Crew Sequential Execution Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node, idx) => (
            <div
              key={node.name}
              className={`p-4 rounded-xl border transition-all ${
                node.status === "COMPLETED"
                  ? "bg-emerald-50/50 border-emerald-200"
                  : node.status === "WAITING_INPUT"
                  ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-100"
                  : "bg-slate-50 border-slate-200 opacity-70"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-900">{node.name}</span>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    node.status === "COMPLETED"
                      ? "bg-emerald-500 text-white"
                      : node.status === "WAITING_INPUT"
                      ? "bg-amber-500 text-white animate-pulse"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {node.icon}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{node.desc}</p>
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60">
                <span
                  className={`font-semibold uppercase tracking-wider text-[10px] ${
                    node.status === "COMPLETED"
                      ? "text-emerald-700"
                      : node.status === "WAITING_INPUT"
                      ? "text-amber-800 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  {node.status}
                </span>

                {node.name.includes("HUMAN GATE") && (
                  <button
                    onClick={() => onNavigate("/monitor/human-gate")}
                    className="text-blue-600 font-semibold hover:underline flex items-center"
                  >
                    Open Gate <ArrowRight className="w-3 h-3 ml-0.5" />
                  </button>
                )}
                {node.name.includes("DATA MANAGER") && (
                  <button
                    onClick={() => onNavigate("/monitor/queries")}
                    className="text-blue-600 font-semibold hover:underline flex items-center"
                  >
                    Queries <ArrowRight className="w-3 h-3 ml-0.5" />
                  </button>
                )}
                {node.name.includes("MEDICAL REVIEW") && (
                  <button
                    onClick={() => onNavigate("/monitor/medical-review")}
                    className="text-blue-600 font-semibold hover:underline flex items-center"
                  >
                    Dossier <ArrowRight className="w-3 h-3 ml-0.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cycle Output / Report */}
      {report && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Monitoring Cycle Result: {report.cycle_id}
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              Completed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Findings Detected</span>
              <span className="text-lg font-bold text-slate-900">{report.findings_detected}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Data Queries Issued</span>
              <span className="text-lg font-bold text-amber-600">{report.data_queries_issued}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Deviations Logged</span>
              <span className="text-lg font-bold text-slate-900">{report.compliance_deviations}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Pending Human Decisions</span>
              <span className="text-lg font-bold text-rose-600">{report.human_decisions_pending}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
