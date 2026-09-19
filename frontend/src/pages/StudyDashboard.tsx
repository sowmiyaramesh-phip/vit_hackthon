import React, { useEffect, useState } from "react";
import {
  Users,
  MapPin,
  AlertTriangle,
  HelpCircle,
  UserCheck,
  Clock,
  ShieldAlert,
  Database,
  CheckCircle2,
  Activity,
  ArrowRight,
  Plus,
  Search,
  MessageSquare,
  Play,
  RotateCw,
} from "lucide-react";
import { api } from "../services/api";
import { StudyMetrics } from "../types";

interface StudyDashboardProps {
  onNavigate: (path: string) => void;
}

export const StudyDashboard: React.FC<StudyDashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<StudyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [cycleRunning, setCycleRunning] = useState(false);
  const [advancingCut, setAdvancingCut] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const data = await api.getStudyDashboard("ABC-101");
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunReviewCycle = async () => {
    setCycleRunning(true);
    try {
      await api.runReviewCycle();
      await fetchMetrics();
      onNavigate("/monitor/crew");
    } catch (err) {
      console.error(err);
    } finally {
      setCycleRunning(false);
    }
  };

  const handleRunWatchCut = async () => {
    setAdvancingCut(true);
    try {
      await api.advanceCut();
      await fetchMetrics();
      onNavigate("/watch");
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancingCut(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-400">
        Loading clinical study dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 text-blue-800">
              Active Phase II Study
            </span>
            <span className="text-xs text-slate-400">Protocol: {metrics.current_protocol_version}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Study Dashboard: ABC-101</h1>
          <p className="text-xs text-slate-500 mt-0.5">{metrics.protocol_name}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate("/subjects/add")}
            className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Subject
          </button>
          <button
            onClick={() => onNavigate("/disease-explorer")}
            className="flex items-center px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Search className="w-3.5 h-3.5 mr-1 text-slate-400" /> Search Disease
          </button>
          <button
            onClick={() => onNavigate("/ask-atlas")}
            className="flex items-center px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" /> Ask ATLAS
          </button>
          <button
            onClick={handleRunReviewCycle}
            disabled={cycleRunning}
            className="flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            {cycleRunning ? "Running Crew..." : "Run Review Cycle"}
          </button>
          <button
            onClick={handleRunWatchCut}
            disabled={advancingCut}
            className="flex items-center px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1 text-purple-600" />
            {advancingCut ? "Advancing..." : "Run WATCH Cut"}
          </button>
        </div>
      </div>

      {/* High-Level Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          onClick={() => onNavigate("/subjects")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Subjects</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.total_subjects}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across {metrics.active_sites} clinical sites</div>
        </div>

        <div
          onClick={() => onNavigate("/subjects")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Sites</span>
            <MapPin className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.active_sites}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">All sites operational</div>
        </div>

        <div
          onClick={() => onNavigate("/findings")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Open Findings</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{metrics.open_findings}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Safety & compliance alerts</div>
        </div>

        <div
          onClick={() => onNavigate("/monitor/queries")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Data Queries</span>
            <HelpCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{metrics.open_data_queries}</div>
          <div className="text-[11px] text-slate-500 mt-1">Site queries under review</div>
        </div>

        <div
          onClick={() => onNavigate("/monitor/human-gate")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Human Decisions</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{metrics.pending_human_decisions}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Awaiting Dr. Sarah Chen</div>
        </div>

        <div
          onClick={() => onNavigate("/watch")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">WATCH Cut</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">
            Cut {metrics.current_watch_cut} <span className="text-xs text-slate-400 font-normal">/ 12</span>
          </div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">Surveillance active</div>
        </div>
      </div>

      {/* 4 Core Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: SAFETY */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Safety Dossier</h3>
              </div>
              <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                High Priority
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <span className="text-lg font-bold text-slate-900 block">
                  {metrics.safety.serious_adverse_events_count}
                </span>
                <span className="text-[11px] text-slate-500">Serious AEs (SAE)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <span className="text-lg font-bold text-rose-600 block">
                  {metrics.safety.new_safety_findings_count}
                </span>
                <span className="text-[11px] text-slate-500">New Safety Signals</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <span className="text-lg font-bold text-amber-600 block">
                  {metrics.safety.escalations_awaiting_decision_count}
                </span>
                <span className="text-[11px] text-slate-500">Escalations Pending</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-slate-400 font-medium block text-[11px] uppercase tracking-wider">Active Signals</span>
              {metrics.safety.recent_findings.map((rf, idx) => (
                <div key={idx} className="p-2 bg-rose-50/60 rounded border border-rose-100 text-rose-900 flex items-center justify-between">
                  <span>{rf}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate("/monitor/human-gate")}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center justify-center transition-colors"
          >
            Open Human Gate Desk <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {/* Pillar 2: DATA QUALITY */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Data Quality & Integrity</h3>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                GCP Audit Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-base font-bold text-slate-900">{metrics.data_quality.open_queries_count}</div>
                <div className="text-[11px] text-slate-500">Open Data Queries</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-base font-bold text-slate-900">{metrics.data_quality.unit_inconsistencies_count}</div>
                <div className="text-[11px] text-slate-500">Unit Inconsistencies</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-base font-bold text-slate-900">{metrics.data_quality.missing_records_count}</div>
                <div className="text-[11px] text-slate-500">Missing Dosage Records</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-base font-bold text-emerald-600">{metrics.data_quality.duplicate_records_count}</div>
                <div className="text-[11px] text-slate-500">Duplicate Records</div>
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-blue-900 leading-relaxed">
              <strong>Query Lifecycle:</strong> Discrepancies generate formal site queries (OPEN → SITE RESPONSE → UNDER REVIEW → CLOSED). Queries are never auto-closed without DM validation.
            </div>
          </div>

          <button
            onClick={() => onNavigate("/monitor/queries")}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center justify-center transition-colors"
          >
            Review Data Queries <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {/* Pillar 3: COMPLIANCE */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Protocol Compliance</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Version {metrics.current_protocol_version}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-base font-bold text-slate-900">{metrics.compliance.protocol_deviations_count}</div>
                <div className="text-[11px] text-slate-500">Visit Window Deviations</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-base font-bold text-slate-900">{metrics.compliance.site_level_issues_count}</div>
                <div className="text-[11px] text-slate-500">Site-level Dosing Flags</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
              Subject visits and dosing are audited against the protocol version active at that cut (v1.0 allowable window: ±7 days vs v2.0 allowable window: ±3 days).
            </div>
          </div>

          <button
            onClick={() => onNavigate("/monitor/compliance")}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center justify-center transition-colors"
          >
            Audit Protocol Deviations <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {/* Pillar 4: WATCH SURVEILLANCE */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">12-Cut Continuous Surveillance</h3>
              </div>
              <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Incremental Engine
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-base font-bold text-purple-700">Cut {metrics.watch.current_cut} of 12</div>
                <div className="text-[11px] text-slate-500">Current Surveillance Cut</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-base font-bold text-rose-600">{metrics.watch.adversarial_events} Anomaly</div>
                <div className="text-[11px] text-slate-500">Site S04 Glucose Shift</div>
              </div>
            </div>

            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 text-xs text-purple-900 leading-relaxed">
              <strong>Explainable Decisions:</strong> Every decision is bound to 5 pillars: WHAT, EVIDENCE, ALTERNATIVES, WHY, and verifiable TRACE consistency.
            </div>
          </div>

          <button
            onClick={() => onNavigate("/watch")}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center justify-center transition-colors"
          >
            Launch WATCH Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
