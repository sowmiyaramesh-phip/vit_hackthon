import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle2, AlertTriangle, Layers, Calendar, RefreshCw, ChevronRight } from 'lucide-react';
import { Study } from '../types';
import { getMonitoringCycles, getCycleReport, getExportReportCsvUrl } from '../api';

interface CycleReportScreenProps {
  study: Study;
  onSelectSubject?: (usubjid: string) => void;
}

export const CycleReportScreen: React.FC<CycleReportScreenProps> = ({
  study,
  onSelectSubject
}) => {
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const data = await getMonitoringCycles(study.id);
      setCycles(data);
      if (data.length > 0 && !selectedCycleId) {
        setSelectedCycleId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, [study.id]);

  useEffect(() => {
    if (!selectedCycleId) return;
    setLoadingReport(true);
    getCycleReport(selectedCycleId)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoadingReport(false));
  }, [selectedCycleId]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Monitoring Cycle Review Reports</h1>
            <p className="text-sm text-slate-400">
              Audit dossiers generated automatically per cycle, summarizing safety escalations, queries, and deviations.
            </p>
          </div>
        </div>

        {selectedCycleId && (
          <a
            href={getExportReportCsvUrl(selectedCycleId)}
            download
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-2 transition-colors shadow-lg shadow-emerald-950"
          >
            <Download className="w-4 h-4" />
            <span>Export Regulatory CSV Dossier</span>
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Cycles Selector Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3 h-[720px] flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Completed Cycles ({cycles.length})
            </span>
            <button
              onClick={fetchCycles}
              disabled={loading}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {cycles.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No monitoring cycles executed yet.</p>
            ) : (
              cycles.map((c) => {
                const isSelected = selectedCycleId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCycleId(c.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-950/40 border-teal-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-teal-400">{c.cycle_code}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        Cut #{c.cut_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                      <span>{new Date(c.run_date).toLocaleDateString()}</span>
                      <span className="text-slate-300 font-bold">{c.protocol_version}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Report Details Pane */}
        <div className="lg:col-span-3 space-y-6">
          {loadingReport ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 font-mono text-sm">
              Loading cycle dossier...
            </div>
          ) : report ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              {/* Report Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-sm font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20">
                      {report.cycle_code}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {report.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Cut {report.cut_number}</span>
                    <span className="text-xs text-slate-400 font-mono">Protocol {report.protocol_version}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-100 mt-2">Executive Monitoring Summary</h2>
                </div>

                <div className="text-right text-xs text-slate-400 font-mono">
                  <div>Executed: {new Date(report.run_date).toLocaleString()}</div>
                  <div className="text-slate-500">Study: {study.study_id}</div>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Findings Detected</span>
                  <span className="text-2xl font-mono font-bold text-slate-100 mt-1 block">{report.total_findings ?? 0}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Safety Escalations</span>
                  <span className="text-2xl font-mono font-bold text-amber-400 mt-1 block">{report.total_escalations ?? 0}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Data Queries Raised</span>
                  <span className="text-2xl font-mono font-bold text-blue-400 mt-1 block">{report.total_queries ?? 0}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Protocol Deviations</span>
                  <span className="text-2xl font-mono font-bold text-purple-400 mt-1 block">{report.total_deviations ?? 0}</span>
                </div>
              </div>

              {/* Review Crew 6-Node Execution Dossier */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Review Crew 6-Node Execution Dossier
                </h3>
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 font-sans text-xs">
                  <div className="flex items-start space-x-3 pb-3 border-b border-slate-800/80">
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold">1. DETECT</span>
                    <p className="text-slate-300">
                      Evaluated CDISC domains (AE, LB, EX, SV, CM) against versioned protocol rules. Extracted prospective findings with full record references.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3 pb-3 border-b border-slate-800/80">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">2. MEDICAL REVIEW</span>
                    <p className="text-slate-300">
                      Evaluated clinical gravity, hospitalization criteria, transaminase elevations (Hy's Law candidates), and proposed targeted escalations.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3 pb-3 border-b border-slate-800/80">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">3. DATA MANAGER</span>
                    <p className="text-slate-300">
                      Checked persistent cross-cycle memory to suppress duplicates. Dispatched formal clinical queries to investigational sites.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3 pb-3 border-b border-slate-800/80">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">4. COMPLIANCE</span>
                    <p className="text-slate-300">
                      Audited protocol amendments (e.g. tightened visit windows v1.0 vs v2.0) and recorded deviations with site-level operational flags.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3 pb-3 border-b border-slate-800/80">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">5. HUMAN GATE</span>
                    <p className="text-slate-300">
                      Preserved human-in-the-loop sovereign authority for Medical Monitors to Approve, Reject, or Query Knowledge Graph for clarifications.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">6. EXECUTE</span>
                    <p className="text-slate-300">
                      Committed decisions, wrote immutable audit trails, and persisted cycle status in Monitoring Memory.
                    </p>
                  </div>
                </div>
              </div>

              {/* Narrative Summary */}
              {report.narrative && (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Narrative</h4>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{report.narrative}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 font-mono text-sm">
              Select a cycle on the left to view the comprehensive dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
