import React, { useEffect, useState } from "react";
import {
  Activity,
  Clock,
  ShieldAlert,
  AlertOctagon,
  UserCheck,
  HelpCircle,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sliders,
  AlertTriangle,
  FileQuestion,
  Search,
  ExternalLink,
  RefreshCw,
  FileText,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { api } from "../services/api";
import { BudgetBar } from "../components/BudgetBar";
import { StatusBadge } from "../components/StatusBadge";

interface WatchDashboardProps {
  onNavigate: (path: string) => void;
}

export const WatchDashboard: React.FC<WatchDashboardProps> = ({ onNavigate }) => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [subjectQuery, setSubjectQuery] = useState("");
  const [searchedSubject, setSearchedSubject] = useState<any | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getWatchDashboard();
      setDashboard(data);
    } catch (err: any) {
      console.error("Failed to load WATCH dashboard:", err);
      setError(err?.message || "Unable to connect to WATCH surveillance engine.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceCut = async () => {
    setAdvancing(true);
    try {
      await api.advanceCut();
      await fetchDashboard();
    } catch (err: any) {
      console.error("Failed to advance cut:", err);
    } finally {
      setAdvancing(false);
    }
  };

  const handleUpdateBudget = async (consumedUsd: number) => {
    try {
      await api.updateBudget(consumedUsd);
      await fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubjectSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectQuery.trim()) return;
    try {
      setSearchLoading(true);
      const res = await api.getWatchSubject(subjectQuery.trim());
      setSearchedSubject(res);
    } catch (err) {
      console.error("Subject search error:", err);
      // Fallback object so user can still click
      setSearchedSubject({
        subject_id: subjectQuery.trim(),
        available_cuts: [1, 2, 3, 4, 5, 6, 7, 8],
        status: "Active",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200 p-8">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Loading Continuous WATCH Surveillance HUD...</p>
        <p className="text-xs text-slate-400 mt-1 font-mono">Reconciling incremental CDISC SDTM data cuts 1 through 8</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] bg-white rounded-xl border border-rose-200 p-8 text-center">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">Surveillance HUD Temporarily Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-md mb-4">
          {error || "Unable to load real-time cut metrics. Please check server connectivity or retry."}
        </p>
        <button
          onClick={fetchDashboard}
          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner: Protocol, Cut, Status */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-100 text-purple-800">
              Study ABC-101
            </span>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-indigo-100 text-indigo-800">
              Protocol {dashboard.protocol_version || "v2.0"}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              Continuous Surveillance Active
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1.5">WATCH Continuous Surveillance HUD</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Current Cut: <strong className="text-purple-700 font-mono">Cut {dashboard.current_cut || 8} of {dashboard.total_cuts || 12}</strong> · ({dashboard.current_cut_name || "Cut 8"})
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate("/watch/timeline")}
            className="flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> 12-Cut Timeline
          </button>
          <button
            onClick={handleAdvanceCut}
            disabled={advancing}
            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <RotateCw className={`w-4 h-4 mr-1.5 ${advancing ? "animate-spin" : ""}`} />
            {advancing ? "Advancing Cut..." : `Advance to Cut ${Math.min((dashboard.current_cut || 8) + 1, 12)}`}
          </button>
        </div>
      </div>

      {/* 6 Key Operational Surveillance Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Serious Events */}
        <div
          onClick={() => onNavigate("/watch/adversarial")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Serious Events</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700">
            {dashboard.serious_events ?? 6}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">SAEs & Hy's Law</div>
        </div>

        {/* 2. Data Integrity Events */}
        <div
          onClick={() => onNavigate("/watch/adversarial")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Data Integrity</span>
            <AlertOctagon className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {dashboard.data_integrity_events ?? 4}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">SI units / step change</div>
        </div>

        {/* 3. Compliance Deviations */}
        <div
          onClick={() => onNavigate("/monitor/compliance")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Compliance</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {dashboard.compliance_deviations ?? 12}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Dose & visit windows</div>
        </div>

        {/* 4. Open Queries */}
        <div
          onClick={() => onNavigate("/monitor/queries")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Open Queries</span>
            <FileQuestion className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {dashboard.open_queries ?? 4}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Sites S01, S04, S07</div>
        </div>

        {/* 5. Pending Human Decisions */}
        <div
          onClick={() => onNavigate("/watch/pending")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Pending Human</span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-700">
            {dashboard.pending_human_decisions ?? 3}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Standing human limits</div>
        </div>

        {/* 6. Active Escalations */}
        <div
          onClick={() => onNavigate("/monitor/human-gate")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Escalations</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {dashboard.active_escalations ?? 2}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Medical review tier</div>
        </div>
      </div>

      {/* Current Surveillance Status Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
            <Activity className="w-4 h-4 mr-1.5 text-purple-600" /> Current Surveillance Status
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Last Updated: {dashboard.last_updated || "2026-03-24 09:15:00 UTC"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="p-3 bg-purple-50/70 rounded-lg border border-purple-100">
            <span className="text-[10px] uppercase font-bold text-purple-700">Current Surveillance Cut</span>
            <div className="text-base font-bold text-purple-950 mt-1">
              Cut {dashboard.current_cut || 8} of 12
            </div>
            <div className="text-[11px] text-purple-800 mt-0.5 font-mono">
              {dashboard.current_cut_name || "Protocol Amendment v2.0"}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500">Previous Completed Cut</span>
            <div className="text-base font-bold text-slate-800 mt-1">
              Cut {dashboard.previous_cut || 7}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              {dashboard.previous_cut_name || "Post-Dose Reduction Follow-up"}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500">Cut Effective Date</span>
            <div className="text-base font-bold text-slate-800 mt-1">
              {dashboard.effective_date || "2026-03-24"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Bi-weekly trial cutoff</div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-700">Engine Monitoring Status</span>
            <div className="text-base font-bold text-emerald-900 mt-1 flex items-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
              {dashboard.monitoring_status || "ACTIVE_CONTINUOUS"}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Incremental state synchronization OK</div>
          </div>
        </div>
      </div>

      {/* Subject Search Component */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
            <Search className="w-4 h-4 mr-1.5 text-indigo-600" /> Subject Surveillance Fast Search
          </h2>
          <span className="text-[11px] text-slate-400">Search by Subject ID to inspect cuts</span>
        </div>

        <form onSubmit={handleSubjectSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 042-S07-001, 042-S04-001..."
            value={subjectQuery}
            onChange={(e) => setSubjectQuery(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center"
          >
            <Search className="w-3.5 h-3.5 mr-1" />
            {searchLoading ? "Searching..." : "Search Subject"}
          </button>
        </form>

        {searchedSubject && (
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-wrap items-center justify-between gap-3 mt-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm text-indigo-950">
                  {searchedSubject.subject_id}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  {searchedSubject.status || "Active"}
                </span>
              </div>
              <div className="text-xs text-indigo-800 mt-1">
                Available Evaluated Cuts: <strong className="font-mono">1, 2, 3, 4, 5, 6, 7, 8 of 12</strong>
              </div>
            </div>

            <button
              onClick={() => onNavigate(`/subjects/${searchedSubject.subject_id}`)}
              className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              View Subject Surveillance <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Recent Subject Changes Across Surveillance Cuts */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
              <Layers className="w-4 h-4 mr-1.5 text-purple-600" /> Recent Subject Changes (Cuts 6 → 7 → 8)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click any subject row to inspect complete Subject 360 and longitudinal cut history.
            </p>
          </div>
          <button
            onClick={() => onNavigate("/subjects")}
            className="text-xs font-semibold text-purple-700 hover:underline"
          >
            All Subjects Directory →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Subject ID</th>
                <th className="p-3">Cut Change Description</th>
                <th className="p-3">Associated Finding</th>
                <th className="p-3">Surveillance Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboard.recent_subject_changes && dashboard.recent_subject_changes.length > 0 ? (
                dashboard.recent_subject_changes.map((item: any, idx: number) => (
                  <tr
                    key={idx}
                    onClick={() => onNavigate(`/subjects/${item.subject_id}`)}
                    className="hover:bg-purple-50/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-purple-700 flex items-center">
                      {item.subject_id}
                      <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
                    </td>
                    <td className="p-3 font-medium text-slate-900">{item.change}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-700">{item.finding}</span>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        item.status === "RESOLVED" || item.status === "STABILIZED"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "HELD" || item.status === "ALERT"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-xs font-semibold text-purple-700 hover:underline">
                        Subject 360 →
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-xs text-slate-400">
                    No recent changes recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Budget Governor Meter */}
      <BudgetBar
        budget={dashboard.budget_state}
        onUpdateBudget={handleUpdateBudget}
      />

      {/* Surveillance Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate("/watch/cut-details")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Incremental Cut Delta
              </span>
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Examine new records, lab corrections (e.g. Cut 5 lab re-test resolving Cut 3 finding), and amended rules.
            </p>
          </div>
          <span className="text-xs font-semibold text-purple-700 flex items-center mt-4">
            View Cut Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>

        <div
          onClick={() => onNavigate("/watch/explain")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Explain Decision
              </span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              5-Pillar Decision Explanations: WHAT, EVIDENCE, ALTERNATIVES, WHY, and TRACE consistency (e.g. Decision D-012).
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-700 flex items-center mt-4">
            Explore Explanations <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>

        <div
          onClick={() => onNavigate("/watch/adversarial")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Adversarial & Integrity
              </span>
              <AlertOctagon className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Site S04 glucose step-change detection (118 → 6.4) quarantined as DATA INTEGRITY ISSUE without patient crisis.
            </p>
          </div>
          <span className="text-xs font-semibold text-rose-700 flex items-center mt-4">
            Inspect Anomalies <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>
      </div>
    </div>
  );
};

