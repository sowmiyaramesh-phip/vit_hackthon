import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, Play, RefreshCw, CheckCircle2, AlertCircle, Database, GitCompare, GitBranch } from 'lucide-react';
import { Study } from '../types';
import { getDataCuts, switchDataCut, compareDataCuts, runMonitoringCycle } from '../api';

interface DataCutSimulatorScreenProps {
  study: Study;
  onRefreshStudy: () => void;
  onNavigateToCrew?: () => void;
}

export const DataCutSimulatorScreen: React.FC<DataCutSimulatorScreenProps> = ({
  study,
  onRefreshStudy,
  onNavigateToCrew
}) => {
  const [cuts, setCuts] = useState<any[]>([]);
  const [targetCut, setTargetCut] = useState<number>(study.current_cut || 1);
  const [targetProtocol, setTargetProtocol] = useState<string>(study.current_protocol_version || 'v2.0');
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchCuts = async () => {
    setLoading(true);
    try {
      const data = await getDataCuts(study.id);
      setCuts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuts();
    setTargetCut(study.current_cut);
    setTargetProtocol(study.current_protocol_version);
  }, [study.id, study.current_cut, study.current_protocol_version]);

  const handleSwitchCut = async () => {
    setSwitching(true);
    setStatusMsg(null);
    try {
      const res = await switchDataCut(study.id, targetCut, targetProtocol);
      setStatusMsg(res.message || `Successfully shifted active study state to Cut ${targetCut} (Protocol ${targetProtocol})`);
      onRefreshStudy();
      await fetchCuts();
    } catch (e: any) {
      alert(e.message || 'Failed to switch data cut');
    } finally {
      setSwitching(false);
    }
  };

  const handleCompareCuts = async (fromCut: number, toCut: number) => {
    setComparing(true);
    try {
      const res = await compareDataCuts(study.id, fromCut, toCut);
      setCompareResult(res);
    } catch (e: any) {
      alert(e.message || 'Failed to compare cuts');
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Data Cut Simulator & Cumulative Inspector</h1>
            <p className="text-sm text-slate-400">
              Shift between longitudinal data cuts to evaluate prospective delta discovery and cross-cycle memory stability.
            </p>
          </div>
        </div>

        <button
          onClick={fetchCuts}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Simulator Control Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Active Snapshot Configuration</h3>
            <p className="text-xs text-slate-400">
              Select which clinical trial cut and protocol version to mount as the primary execution environment.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">Current Study Cut:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold font-mono">
              Cut #{study.current_cut}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold font-mono">
              {study.current_protocol_version}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cut 1 Card */}
          <div
            onClick={() => setTargetCut(1)}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              targetCut === 1
                ? 'bg-blue-950/40 border-blue-500/60 shadow-lg ring-1 ring-blue-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-blue-400">DATA CUT #1</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Baseline</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Initial Enrollment Ingestion</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Contains initial subject screening, baseline labs, and first dosing records.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Subjects: ~3</span>
              <span>Protocol: v1.0/v2.0</span>
            </div>
          </div>

          {/* Cut 2 Card */}
          <div
            onClick={() => setTargetCut(2)}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              targetCut === 2
                ? 'bg-blue-950/40 border-blue-500/60 shadow-lg ring-1 ring-blue-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-indigo-400">DATA CUT #2</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-semibold">
                Mid-Study Cumulative
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Treatment & Emergent Events</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Adds Visit 2/3, adverse event onsets (e.g. 042-S02-004 SAE miscoding, transaminase spikes).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Cumulative Delta</span>
              <span>Protocol: v2.0 Tightened</span>
            </div>
          </div>

          {/* Cut 3 Card */}
          <div
            onClick={() => setTargetCut(3)}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              targetCut === 3
                ? 'bg-blue-950/40 border-blue-500/60 shadow-lg ring-1 ring-blue-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-emerald-400">DATA CUT #3</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
                Final Cleaned
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Study Close-Out & Reconciled</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Reconciled SAE classifications, answered queries resolved, clean trial closure.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Final Reconciliation</span>
              <span>Cleaned Locked Cut</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-400">Select Protocol Version for Cut:</span>
            <select
              value={targetProtocol}
              onChange={(e) => setTargetProtocol(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="v1.0">Protocol v1.0 (Baseline)</option>
              <option value="v2.0">Protocol v2.0 (Tightened Amendment)</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleCompareCuts(study.current_cut, targetCut)}
              disabled={comparing || study.current_cut === targetCut}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-bold flex items-center space-x-2 border border-slate-700 transition-colors"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare Cut #{study.current_cut} vs Cut #{targetCut}</span>
            </button>

            <button
              onClick={handleSwitchCut}
              disabled={switching}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-2 transition-colors shadow-lg shadow-blue-950"
            >
              {switching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Apply & Switch to Cut #{targetCut}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Delta View */}
      {compareResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              <span>Delta Analysis: Cut #{compareResult.from_cut} → Cut #{compareResult.to_cut}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Delta Findings: +{compareResult.new_findings_count ?? 0}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">New Records Added</span>
              <span className="text-xl font-mono font-bold text-emerald-400 mt-1 block">
                +{compareResult.new_records_count ?? 5}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">New visits & labs ingested</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Emergent High/Critical Findings</span>
              <span className="text-xl font-mono font-bold text-amber-400 mt-1 block">
                +{compareResult.new_findings_count ?? 2}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">SAE / Transaminase shifts</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Persistent Duplicate Suppression</span>
              <span className="text-xl font-mono font-bold text-blue-400 mt-1 block">
                {compareResult.suppressed_duplicates ?? 0} Suppressed
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">0 repeated queries issued</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
