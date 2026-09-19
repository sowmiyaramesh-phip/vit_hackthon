import React, { useState, useEffect } from 'react';
import { Cpu, Play, CheckCircle2, ArrowDown, Activity, Clock, ShieldCheck } from 'lucide-react';
import { Study, TraceEntry } from '../types';
import { getMonitoringCycles, getTraces, runMonitoringCycle } from '../api';

interface ReviewCrewScreenProps {
  study: Study;
  onRunCycle: () => void;
  isRunningCycle: boolean;
}

export const ReviewCrewScreen: React.FC<ReviewCrewScreenProps> = ({
  study,
  onRunCycle,
  isRunningCycle
}) => {
  const [cycles, setCycles] = useState<any[]>([]);
  const [traces, setTraces] = useState<TraceEntry[]>([]);

  useEffect(() => {
    getMonitoringCycles(study.id).then(setCycles).catch(() => {});
    getTraces(study.id).then(setTraces).catch(() => {});
  }, [study.id, isRunningCycle]);

  const nodes = [
    { id: 'detect', title: '1. DETECT', desc: 'ATLAS finding detection across safety, data, and compliance domains.' },
    { id: 'medical_review', title: '2. MEDICAL REVIEW', desc: 'Seriousness, plausibility, and clinical significance evaluation.' },
    { id: 'data_manager', title: '3. DATA MANAGER', desc: 'Discrepancy queries generation and duplicate suppression.' },
    { id: 'compliance', title: '4. COMPLIANCE', desc: 'Protocol version schedule and dosing adherence audit.' },
    { id: 'human_gate', title: '5. HUMAN GATE', desc: 'Medical Monitor escalation triage: APPROVE / REJECT / CLARIFY.' },
    { id: 'execute', title: '6. EXECUTE', desc: 'Trace logging, monitoring memory persistence, and report compilation.' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Review Crew Pipeline</h1>
          <p className="text-sm text-slate-400">
            Autonomous multi-agent clinical monitoring architecture executing in six deterministic sequential nodes.
          </p>
        </div>

        <button
          onClick={onRunCycle}
          disabled={isRunningCycle}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg transition disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isRunningCycle ? 'animate-spin' : ''}`} />
          <span>{isRunningCycle ? 'Executing Pipeline...' : 'Run Monitoring Cycle'}</span>
        </button>
      </div>

      {/* 6 Sequential Nodes Display */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        {nodes.map((n, idx) => {
          const nodeTraces = traces.filter(t => t.node_name === n.id);
          const lastTrace = nodeTraces[0];
          return (
            <div
              key={n.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition ${
                isRunningCycle ? 'bg-slate-900 border-indigo-500/50 animate-pulse' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-indigo-400">NODE {idx + 1}</span>
                <h3 className="font-bold text-slate-100 text-xs">{n.title}</h3>
                <p className="text-[11px] text-slate-400 leading-tight">{n.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px]">
                <span className="text-slate-500">Status: </span>
                <span className="font-bold text-emerald-400">READY</span>
                {lastTrace && (
                  <div className="text-[10px] text-slate-400 truncate mt-1" title={lastTrace.message}>
                    {lastTrace.decision || lastTrace.action}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Cycles & Live Trace Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-200">Execution Cycles History</h3>
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-2">
            {cycles.length === 0 ? (
              <p className="text-xs text-slate-500">No monitoring cycles executed yet.</p>
            ) : (
              cycles.map((c) => (
                <div key={c.id} className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-300">{c.cycle_code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Data Cut: {c.cut_number} • Protocol: {c.protocol_version}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Started: {c.start_time}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-200">Live Decision Trace Stream</h3>
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2 text-xs font-mono">
            {traces.slice(0, 10).map((t) => (
              <div key={t.id} className="p-2.5 bg-slate-950 rounded border border-slate-800/80 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="uppercase text-indigo-400 font-bold">{t.node_name}</span>
                  <span>{t.timestamp.split('T')[1]?.slice(0, 8)}</span>
                </div>
                <div className="text-slate-200 text-[11px]">{t.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
