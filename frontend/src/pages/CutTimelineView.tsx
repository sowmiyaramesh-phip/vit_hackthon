import React, { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  AlertOctagon,
  User,
  Layers,
  Calendar,
  ChevronRight,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { api } from "../services/api";
import { CutInfo } from "../types";
import { StatusBadge } from "../components/StatusBadge";

interface CutTimelineViewProps {
  onNavigate: (path: string) => void;
}

type TimelineMode = "STUDY" | "SUBJECT";

export const CutTimelineView: React.FC<CutTimelineViewProps> = ({ onNavigate }) => {
  const [mode, setMode] = useState<TimelineMode>("STUDY");
  const [cuts, setCuts] = useState<CutInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("042-S07-001");
  const [subjectCuts, setSubjectCuts] = useState<any[]>([]);
  const [subjectLoading, setSubjectLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (mode === "SUBJECT" && selectedSubjectId) {
      fetchSubjectCuts(selectedSubjectId);
    }
  }, [mode, selectedSubjectId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [studyCuts, subjList] = await Promise.all([
        api.getCutsTimeline(),
        api.getSubjects(),
      ]);
      setCuts(studyCuts);
      setSubjects(subjList);
      if (subjList && subjList.length > 0) {
        setSelectedSubjectId(subjList[0].subject_id || "042-S07-001");
      }
    } catch (err) {
      console.error("Failed to load timeline data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectCuts = async (usubjid: string) => {
    try {
      setSubjectLoading(true);
      const data = await api.getSubjectCuts(usubjid);
      setSubjectCuts(data);
    } catch (err) {
      console.error("Failed to fetch subject cuts:", err);
      setSubjectCuts([]);
    } finally {
      setSubjectLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-600">
            <Clock className="w-5 h-5" />
            <h1 className="text-xl font-bold text-slate-900">12-Cut Surveillance Timeline</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Switch between study-level data ingestion milestones and subject-specific longitudinal cut surveillance.
          </p>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setMode("STUDY")}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "STUDY"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Study Timeline</span>
          </button>
          <button
            onClick={() => {
              setMode("SUBJECT");
              if (selectedSubjectId) fetchSubjectCuts(selectedSubjectId);
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === "SUBJECT"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Subject Timeline</span>
          </button>
        </div>
      </div>

      {/* MODE 1: STUDY TIMELINE */}
      {mode === "STUDY" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
              <Layers className="w-4 h-4 mr-1.5 text-purple-600" /> Scheduled Study Data Cuts (1 to 12)
            </h3>
            <span className="text-xs text-slate-400">Continuous 12-Cut Progression</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cuts.map((c) => {
              const isCompleted = c.status === "COMPLETED";
              const isActive = c.status === "ACTIVE";

              return (
                <div
                  key={c.cut_number}
                  onClick={() => onNavigate(`/watch/cut-details?cut=${c.cut_number}`)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                    isActive
                      ? "bg-purple-50/80 border-purple-300 ring-2 ring-purple-100 shadow-xs"
                      : isCompleted
                      ? "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                      : "bg-slate-50/40 border-slate-200 opacity-60 hover:opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      Cut {c.cut_number}
                    </span>
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive
                          ? "bg-purple-600 text-white animate-pulse"
                          : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? "✓" : isActive ? "●" : "○"}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-800 truncate group-hover:text-purple-700">
                    {c.cut_name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{c.cut_date}</div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{c.new_records} new records</span>
                    <span className="font-bold text-purple-700 group-hover:translate-x-0.5 transition-transform">
                      Delta →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: SUBJECT-SPECIFIC TIMELINE */}
      {mode === "SUBJECT" && (
        <div className="space-y-4">
          {/* Subject Selector Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Subject:
              </span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>
                    {s.subject_id} ({s.site_id || "S07"} - {s.disease || "Liver disease"} - {s.treatment || "Treatment A"})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => onNavigate(`/subjects/${selectedSubjectId}`)}
              className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Open Subject 360 <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Subject Cuts Strip */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
                  <User className="w-4 h-4 mr-1.5 text-indigo-600" /> Subject Surveillance Cuts: {selectedSubjectId}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Longitudinal history across Cuts 1 to 8. Click any cut to navigate directly to detailed clinical evaluation.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 font-bold font-mono">
                {subjectCuts.length} Cuts Evaluated
              </span>
            </div>

            {subjectLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading longitudinal surveillance cuts for {selectedSubjectId}...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {subjectCuts.map((cut: any) => {
                  const hasFindings = cut.findings && cut.findings.length > 0;
                  const hasAE = cut.adverse_events && cut.adverse_events.length > 0;
                  const altLab = cut.labs?.find((l: any) => l.test === "ALT");

                  return (
                    <div
                      key={cut.cut_number}
                      onClick={() => onNavigate(`/subjects/${selectedSubjectId}`)}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-slate-900">
                            Cut {cut.cut_number}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            hasFindings ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {cut.status || "Completed"}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-slate-800 line-clamp-1">
                          {cut.cut_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {cut.visit} · {cut.protocol_version}
                        </div>

                        {/* Snapshot */}
                        <div className="mt-3 pt-2 border-t border-slate-200/60 space-y-1 text-[11px] text-slate-600">
                          <div className="flex justify-between">
                            <span>Dose:</span>
                            <span className="font-semibold text-slate-800">{cut.dose || "0 mg"}</span>
                          </div>
                          {altLab && (
                            <div className="flex justify-between">
                              <span>ALT:</span>
                              <span className={`font-mono font-semibold ${altLab.status === "HIGH" ? "text-rose-600 font-bold" : "text-slate-800"}`}>
                                {altLab.value} {altLab.unit}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Findings:</span>
                            <span className={hasFindings ? "text-rose-600 font-bold" : "text-emerald-700"}>
                              {cut.findings?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-indigo-600 font-semibold">
                        <span>Inspect in Subject 360</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

