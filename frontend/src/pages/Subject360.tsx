import React, { useEffect, useState } from "react";
import {
  User,
  MapPin,
  Calendar,
  Activity,
  Pill,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Network,
  History,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  X,
  RefreshCw,
  Info,
  Check,
  AlertOctagon,
  Eye,
  GitCommit,
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { EvidenceDrawer } from "../components/EvidenceDrawer";

interface Subject360Props {
  subjectId: string;
  onNavigate: (path: string) => void;
}

export const Subject360: React.FC<Subject360Props> = ({ subjectId, onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [activeCut, setActiveCut] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSubject360(subjectId);
      setData(res);
      // Default to latest cut if cuts are available
      if (res.cuts && res.cuts.length > 0) {
        setActiveCut(res.cuts[res.cuts.length - 1]);
      }
    } catch (err: any) {
      console.error("Failed to load subject 360:", err);
      setError(err?.message || `Unable to load Subject 360 dossier for ${subjectId}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200 p-8">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Loading Subject 360 dossier...</p>
        <p className="text-xs text-slate-400 mt-1 font-mono">Querying CDISC SDTM/ADaM records for {subjectId}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] bg-white rounded-xl border border-rose-200 p-8 text-center">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-3">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">Subject Dossier Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-md mb-4">
          {error || `Unable to load data for subject "${subjectId}". Please verify the Subject ID or check server connection.`}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </button>
          <button
            onClick={() => onNavigate("/subjects")}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Back to Subjects
          </button>
        </div>
      </div>
    );
  }

  const { header, journey, sections, cuts = [] } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Subject Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center border border-blue-200">
              <span className="text-xl font-bold">{header.sex === "M" ? "♂" : "♀"}</span>
              <span className="text-[10px] font-semibold text-slate-500">{header.age}y</span>
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 font-mono">Subject {header.subject_id}</h1>
                <StatusBadge status={header.status || "ACTIVE"} />
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-semibold">
                  Site {header.site_id}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                  Status: {header.treatment_status || "Active"}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1 flex-wrap">
                <span>Enrolled: <strong className="text-slate-700">{header.enrollment_date}</strong></span>
                <span>Current Cut: <strong className="text-slate-900 font-mono">Cut 8 / 12</strong></span>
                <span className="text-rose-600 font-semibold">{header.open_findings_count || 0} Open Findings</span>
                <span className="text-amber-600 font-semibold">{header.open_queries_count || 0} Queries</span>
              </div>
            </div>
          </div>

          {/* Global Subject Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedEvidence(`Subject Dossier: ${header.subject_id}`)}
              className="flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-500" /> View Evidence
            </button>
            <button
              onClick={() => onNavigate(`/ask-atlas?q=Show+the+treatment+history+of+Subject+${header.subject_id}`)}
              className="flex items-center px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" /> Ask ATLAS
            </button>
            <button
              onClick={() => onNavigate("/graph")}
              className="flex items-center px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Network className="w-3.5 h-3.5 mr-1 text-slate-400" /> Knowledge Graph
            </button>
            <button
              onClick={() => onNavigate("/monitor/trace")}
              className="flex items-center px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <History className="w-3.5 h-3.5 mr-1 text-slate-400" /> Decision Trace
            </button>
          </div>
        </div>

        {/* Clinical Summary Cards Header Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-100">
            <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Primary Disease / History</div>
            <div className="text-xs font-bold text-purple-950 mt-1 truncate" title={header.disease}>
              {header.disease || "Liver disease"}
            </div>
            <div className="text-[10px] text-purple-600 mt-0.5">ICD-10 / MedDRA Verified</div>
          </div>

          <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-100">
            <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Study Treatment</div>
            <div className="text-xs font-bold text-teal-950 mt-1">
              {header.treatment || "Treatment A"}
            </div>
            <div className="text-[10px] text-teal-600 mt-0.5">Protocol Investigational Arm</div>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Current Medication</div>
            <div className="text-xs font-bold text-blue-950 mt-1">
              {header.medication || "Drug A"}
            </div>
            <div className="text-[10px] text-blue-600 mt-0.5">Dose evaluated across cuts</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Treatment Status</div>
            <div className="text-xs font-bold text-slate-900 mt-1 flex items-center">
              <span className={`w-2 h-2 rounded-full mr-1.5 ${header.treatment_status === "Active" ? "bg-emerald-500" : "bg-amber-500"}`} />
              {header.treatment_status || "Active"}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Protocol ABC-101 v2.0</div>
          </div>
        </div>
      </div>

      {/* Subject Clinical Journey (Horizontal) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center">
          <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Subject Clinical Journey
        </h3>
        <div className="flex items-center justify-between relative overflow-x-auto py-2">
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 -z-0" />
          {journey.map((item: any, idx: number) => {
            const isDone = item.status === "Completed";
            return (
              <div key={idx} className="flex flex-col items-center relative z-10 px-2 min-w-[90px]">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white border-white shadow-xs"
                      : "bg-white text-slate-400 border-slate-300"
                  }`}
                >
                  {isDone ? "✓" : idx + 1}
                </div>
                <span className="text-xs font-semibold text-slate-800 mt-2 text-center">{item.stage}</span>
                <span className="text-[10px] text-slate-400">{item.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUBJECT SURVEILLANCE HISTORY (12-Cut History) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Subject Surveillance History (Cuts 1 to 8 of 12)
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                Continuous Monitoring
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select any data cut to inspect visit laboratory trends, adverse events, dose changes, protocol compliance, and explainable decision traces.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(`/watch/timeline`)}
              className="flex items-center px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <History className="w-3.5 h-3.5 mr-1 text-slate-400" /> Global 12-Cut Timeline
            </button>
            <button
              onClick={() => onNavigate(`/watch`)}
              className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Activity className="w-3.5 h-3.5 mr-1" /> WATCH HUD
            </button>
          </div>
        </div>

        {/* Cuts Strip / Cards */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {cuts.map((cut: any) => {
            const isSelected = activeCut?.cut_number === cut.cut_number;
            const hasFindings = cut.findings && cut.findings.length > 0;
            const hasAE = cut.adverse_events && cut.adverse_events.length > 0;
            const isEscalated = cut.escalations && cut.escalations.length > 0;
            const altLab = cut.labs?.find((l: any) => l.test === "ALT");

            return (
              <div
                key={cut.cut_number}
                onClick={() => setActiveCut(cut)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-800">
                      Cut {cut.cut_number}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      hasFindings || isEscalated
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {cut.status || "Completed"}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-1 line-clamp-1">
                    {cut.cut_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-2 font-mono">
                    {cut.visit} · {cut.protocol_version}
                  </p>

                  {/* Key Metrics Snapshot */}
                  <div className="space-y-1 text-[11px] pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Dose:</span>
                      <span className="font-semibold text-slate-800">{cut.dose || "0 mg"}</span>
                    </div>
                    {altLab && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>ALT:</span>
                        <span className={`font-mono font-semibold ${altLab.status === "HIGH" ? "text-rose-600 font-bold" : "text-slate-800"}`}>
                          {altLab.value} {altLab.unit}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-600">
                      <span>AEs / Findings:</span>
                      <span className="font-semibold">
                        <span className={hasAE ? "text-rose-600" : "text-slate-500"}>{cut.adverse_events?.length || 0} AEs</span>
                        {" · "}
                        <span className={hasFindings ? "text-amber-600" : "text-slate-500"}>{cut.findings?.length || 0} Fnds</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-indigo-600 flex items-center">
                    {isSelected ? "Inspecting Details" : "Click to view"}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "text-indigo-600 transform rotate-90" : "text-slate-400"}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Cut Detail Slide-down Panel */}
        {activeCut && (
          <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded bg-indigo-600 text-white font-mono font-bold text-xs">
                    Cut {activeCut.cut_number} of 12
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeCut.cut_name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                    Protocol {activeCut.protocol_version}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Visit: <strong>{activeCut.visit}</strong> · Treatment: <strong>{activeCut.treatment}</strong> ({activeCut.medication}) · Dose: <strong>{activeCut.dose}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedEvidence(activeCut.evidence_refs?.join(", ") || `Cut ${activeCut.cut_number}`)}
                  className="flex items-center px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-500" /> View Evidence
                </button>
                <button
                  onClick={() => onNavigate("/monitor/trace")}
                  className="flex items-center px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs"
                >
                  <History className="w-3.5 h-3.5 mr-1 text-slate-500" /> View Decision Trace
                </button>
                <button
                  onClick={() => onNavigate(`/watch/explain?subject=${header.subject_id}&cut=${activeCut.cut_number}`)}
                  className="flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1" /> Explain Decision
                </button>
              </div>
            </div>

            {/* WHAT CHANGED? Section */}
            <div className="p-4 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-indigo-50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center">
                  <GitCommit className="w-4 h-4 mr-1.5 text-indigo-600" /> What Changed? (Delta from Cut {activeCut.cut_number > 1 ? activeCut.cut_number - 1 : 1})
                </h4>
                <span className="text-[11px] text-indigo-600 font-medium">Continuous Surveillance Delta</span>
              </div>

              {activeCut.what_changed && activeCut.what_changed.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {activeCut.what_changed.map((delta: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs flex items-start space-x-2 ${
                        delta.severity === "CRITICAL" || delta.severity === "HIGH"
                          ? "bg-rose-50/70 border-rose-200 text-rose-900"
                          : delta.severity === "MEDIUM"
                          ? "bg-amber-50/70 border-amber-200 text-amber-900"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                        delta.severity === "CRITICAL" || delta.severity === "HIGH"
                          ? "bg-rose-500"
                          : delta.severity === "MEDIUM"
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`} />
                      <div>
                        <span className="font-bold">{delta.label}: </span>
                        <span>{delta.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-1 italic">
                  {activeCut.cut_number === 1
                    ? "Initial baseline data cut - no prior cut comparison exists."
                    : "No significant changes or escalations detected compared to previous cut."}
                </p>
              )}
            </div>

            {/* 10 Clinical Sections Detail Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Protocol & Visit */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">1 & 2. Protocol & Visit</div>
                <div className="font-semibold text-slate-900">{activeCut.visit}</div>
                <div className="text-slate-600">Protocol Amendment: <strong className="font-mono">{activeCut.protocol_version}</strong></div>
                <div className="text-[11px] text-slate-500">Status: <strong className="text-emerald-700">{activeCut.status}</strong></div>
              </div>

              {/* 3. Treatment & Dose */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">3. Treatment & Dose</div>
                <div className="font-semibold text-slate-900">{activeCut.treatment} ({activeCut.medication})</div>
                <div className="text-slate-600">Administered Dose: <strong className="font-mono text-indigo-700">{activeCut.dose}</strong></div>
                <div className="text-[11px] text-slate-500">Route: Oral / IV per protocol schedule</div>
              </div>

              {/* 4. Laboratory Trends */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">4. Laboratory Results</div>
                {activeCut.labs && activeCut.labs.length > 0 ? (
                  <div className="space-y-1">
                    {activeCut.labs.map((l: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-700">{l.test}:</span>
                        <span className={`font-mono font-semibold ${l.status === "HIGH" ? "text-rose-600 font-bold" : "text-slate-900"}`}>
                          {l.value} {l.unit} ({l.reference_range || "NL"})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 italic">No lab draws this cut</div>
                )}
              </div>

              {/* 5. Adverse Events */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">5. Adverse Events</div>
                {activeCut.adverse_events && activeCut.adverse_events.length > 0 ? (
                  <div className="space-y-1.5">
                    {activeCut.adverse_events.map((ae: any, idx: number) => (
                      <div key={idx} className="p-2 bg-rose-50 rounded border border-rose-100 text-[11px] text-rose-900">
                        <div className="font-bold">{ae.term}</div>
                        <div className="text-rose-700 text-[10px]">Severity: {ae.severity} · Hospitalized: {ae.hospitalized || "No"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-emerald-700 font-medium">✓ No adverse events reported</div>
                )}
              </div>

              {/* 6. Protocol Compliance */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">6. Compliance Assessment</div>
                <p className="text-slate-700 leading-relaxed text-[11px]">{activeCut.compliance || "Compliant"}</p>
                <div className="text-[10px] text-slate-400">Evaluated by Protocol Compliance Engine</div>
              </div>

              {/* 7. Findings & Queries */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">7. Findings & Data Queries</div>
                {activeCut.findings && activeCut.findings.length > 0 ? (
                  <div className="space-y-1">
                    {activeCut.findings.map((f: any, idx: number) => (
                      <div key={idx} className="p-1.5 bg-amber-50 border border-amber-200 rounded text-[11px] font-medium text-amber-900">
                        {f.title}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-emerald-700 font-medium text-[11px]">✓ No active findings</div>
                )}
                {activeCut.queries && activeCut.queries.length > 0 && (
                  <div className="text-[11px] text-blue-700 font-semibold pt-1">
                    {activeCut.queries.length} Open Data Query: {activeCut.queries[0]?.query_id}
                  </div>
                )}
              </div>

              {/* 8. Escalations & Human Decisions */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">8. Human Decisions & Escalations</div>
                <div className="text-slate-700">
                  Decision Status: <strong className="font-mono text-indigo-700">{activeCut.human_decision || "N/A"}</strong>
                </div>
                {activeCut.escalations && activeCut.escalations.length > 0 ? (
                  <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800">
                    Active Escalation: {activeCut.escalations[0]?.reason}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500">No human gate escalation required</div>
                )}
              </div>

              {/* 9. Evidence References */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2 lg:col-span-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">9 & 10. Evidence Trace & RecordRefs</div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeCut.evidence_refs && activeCut.evidence_refs.length > 0 ? (
                    activeCut.evidence_refs.map((ref: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedEvidence(ref)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded font-mono text-[11px] transition-colors"
                      >
                        {ref}
                      </button>
                    ))
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px]">DM #{header.subject_id}</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 pt-1">
                  Click any RecordRef to inspect the raw SDTM domain record with cryptographic hash integrity verification.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Clinical Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1 & 2: Diseases & Supported Treatment */}
        <div className="space-y-6">
          {/* Diseases */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center">
                <Activity className="w-3.5 h-3.5 mr-1.5" /> 1. Medical History & Diseases
              </h3>
              <span className="text-[11px] text-slate-400">Strictly evidence-backed</span>
            </div>
            <div className="space-y-2">
              {sections.diseases.map((d: any, idx: number) => (
                <div key={idx} className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 flex items-center justify-between text-xs">
                  <div>
                    <button
                      onClick={() => onNavigate(`/disease-explorer?disease=${encodeURIComponent(d.condition)}`)}
                      className="font-bold text-purple-900 hover:underline flex items-center"
                    >
                      {d.condition} <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Status: <strong>{d.status}</strong> · Onset: {d.start_date}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEvidence(d.evidence)}
                    className="px-2 py-1 bg-white border border-purple-200 text-purple-700 rounded text-[11px] font-mono hover:bg-purple-100"
                  >
                    {d.evidence}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Treatments & Separate Medications */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center">
                <Pill className="w-3.5 h-3.5 mr-1.5" /> 2 & 3. Treatments vs Medications Taken
              </h3>
              <span className="text-[11px] text-slate-400">No Unsupported Claims</span>
            </div>
            <div className="space-y-2.5">
              {sections.treatments.map((t: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{t.medication}</span>
                    <span className="font-mono text-slate-500">{t.dose} · {t.route}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Administration: {t.start_date} {t.end_date ? `to ${t.end_date}` : "(Ongoing)"} · Status: <strong>{t.status}</strong>
                  </div>
                  {/* Strict product principle distinction */}
                  <div
                    className={`p-2 rounded border text-[11px] font-medium ${
                      t.is_supported
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {t.evidence_statement}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelectedEvidence(t.evidence_ref)}
                      className="text-[10px] font-mono text-blue-600 hover:underline"
                    >
                      Inspect {t.evidence_ref}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Dosing Adherence */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> 6. Investigational Product Dosing
              </h3>
            </div>
            <div className="space-y-2">
              {sections.dosing.map((d: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    d.is_deviation ? "bg-amber-50/70 border-amber-200" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div>
                    <span className="font-bold text-slate-800">{d.visit}</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Planned: <strong>{d.planned_dose} {d.unit}</strong> | Administered: <strong>{d.actual_dose} {d.unit}</strong> ({d.date})
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase ${
                        d.is_deviation ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {d.deviation_note}
                    </span>
                    <button
                      onClick={() => setSelectedEvidence(d.evidence)}
                      className="block text-[10px] font-mono text-slate-400 hover:text-slate-600 mt-1"
                    >
                      {d.evidence}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4 & 7: Labs & Adverse Events */}
        <div className="space-y-6">
          {/* Section 4: Laboratory Results */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-700 flex items-center">
                <Activity className="w-3.5 h-3.5 mr-1.5" /> 4. Laboratory Results & Unit Harmonization
              </h3>
              <span className="text-[11px] text-slate-400">Never converted silently</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="p-2">Test</th>
                    <th className="p-2">Observed</th>
                    <th className="p-2">Harmonized</th>
                    <th className="p-2">ULN</th>
                    <th className="p-2">Status</th>
                    <th className="p-2 text-right">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sections.labs.map((l: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedEvidence(`${l.evidence}: ${l.test} ${l.value} ${l.unit}`)}
                    >
                      <td className="p-2 font-mono font-bold text-slate-800">{l.test}</td>
                      <td className="p-2 font-mono">{l.value} {l.unit}</td>
                      <td className="p-2 font-mono font-semibold text-slate-900">
                        {l.converted_value !== null ? `${l.converted_value} ${l.standard_unit}` : "ND"}
                      </td>
                      <td className="p-2 text-slate-500 font-mono">{l.uln || "—"}</td>
                      <td className="p-2">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="p-2 text-right font-mono text-[10px] text-blue-600">
                        {l.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500 leading-relaxed">
              <strong>Unit Rule:</strong> International SI units (e.g. <code>ukat/L</code> at Site S07) are explicitly harmonized using standard factors (<code>× 60 = U/L</code>). Censored values (<code>&lt;5</code>) are parsed as non-detectable, never zero.
            </div>
          </div>

          {/* Section 7: Adverse Events */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> 7. Adverse Events (AE)
              </h3>
            </div>
            <div className="space-y-2">
              {sections.adverse_events.map((ae: any, idx: number) => (
                <div key={idx} className="p-3 bg-rose-50/50 rounded-lg border border-rose-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 text-sm">{ae.term}</span>
                    <span className="font-semibold text-rose-700 uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-rose-100 rounded border border-rose-200">
                      {ae.severity}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Onset: {ae.start_date} | Hospitalized: <strong>{ae.hospitalized ? "YES" : "NO"}</strong> | Drug Relationship: {ae.relationship}
                  </div>
                  <p className="text-[11px] text-rose-800 italic">{ae.seriousness_rationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 9: Active Findings */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> 9. Supported Protocol Findings
              </h3>
            </div>
            <div className="space-y-2">
              {sections.findings.map((f: any) => (
                <div key={f.id} className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{f.title}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-200 text-amber-900">
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-700">{f.message}</p>
                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-500 font-semibold">Rule: Protocol {f.protocol_rule}</span>
                    <button
                      onClick={() => onNavigate(`/findings/${f.id}`)}
                      className="text-blue-600 font-semibold hover:underline flex items-center"
                    >
                      Finding Detail <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
