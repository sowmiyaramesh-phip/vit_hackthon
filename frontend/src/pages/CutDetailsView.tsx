import React, { useEffect, useState } from "react";
import {
  Layers,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Users,
  ExternalLink,
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";

interface CutDetailsViewProps {
  initialCut?: number;
  onNavigate: (path: string) => void;
}

export const CutDetailsView: React.FC<CutDetailsViewProps> = ({ initialCut = 5, onNavigate }) => {
  const [selectedCut, setSelectedCut] = useState(initialCut);
  const [details, setDetails] = useState<any>(null);
  const [cutSubjects, setCutSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCutDetails(selectedCut);
  }, [selectedCut]);

  const fetchCutDetails = async (cutNum: number) => {
    try {
      setLoading(true);
      const [res, subjRes] = await Promise.all([
        api.getCutDetails(cutNum),
        api.getCutSubjects(cutNum).catch(() => ({ subjects: [] })),
      ]);
      setDetails(res);
      const list = Array.isArray(subjRes) ? subjRes : (subjRes?.subjects || []);
      setCutSubjects(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Cut Selector */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-700">
            <Layers className="w-5 h-5" />
            <h1 className="text-xl font-bold text-slate-900">Incremental Cut Delta Details</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            WATCH is strictly incremental. Tracks data corrections, derived variable recalculations, and affected subjects per cut.
          </p>
        </div>

        {/* Cut Selector Buttons */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
            <button
              key={num}
              onClick={() => setSelectedCut(num)}
              className={`w-7 h-7 rounded text-xs font-bold font-mono transition-colors ${
                selectedCut === num
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {loading || !details ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading incremental delta for Cut {selectedCut}...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm text-purple-700">Cut {details.cut_info.cut_number}:</span>
                <span className="text-sm font-bold text-slate-900">{details.cut_info.cut_name}</span>
                <StatusBadge status={details.cut_info.status} />
              </div>
              <span className="text-xs text-slate-500">{details.cut_info.cut_date}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {details.incremental_changes.delta_summary}
            </p>
          </div>

          {/* Delta Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold block mb-1">
                New Records Ingested
              </span>
              <div className="text-2xl font-bold text-slate-900">
                {details.incremental_changes.new_records}
              </div>
              <span className="text-[11px] text-slate-400">Appended to graph</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold block mb-1">
                Data Corrections
              </span>
              <div className="text-2xl font-bold text-purple-700">
                {details.incremental_changes.corrections}
              </div>
              <span className="text-[11px] text-purple-600 font-medium">Derived findings recalculated</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold block mb-1">
                Resolved / Revoked Findings
              </span>
              <div className="text-2xl font-bold text-emerald-600">
                {details.incremental_changes.resolved_findings.length}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">Obsolete conclusions undone</span>
            </div>
          </div>

          {/* AFFECTED SUBJECTS IN THIS CUT SECTION */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
                  <Users className="w-4 h-4 mr-1.5 text-purple-600" /> Affected Subjects in Cut {selectedCut} ({cutSubjects.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Subjects with changes, dosing actions, or laboratory assessments during this cut interval. Click to open Subject 360.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Subject ID</th>
                    <th className="p-3">Site</th>
                    <th className="p-3">Visit</th>
                    <th className="p-3">Dose</th>
                    <th className="p-3">Change Description</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cutSubjects.length > 0 ? (
                    cutSubjects.map((s: any, idx: number) => (
                      <tr
                        key={idx}
                        onClick={() => onNavigate(`/subjects/${s.subject_id}`)}
                        className="hover:bg-purple-50/50 cursor-pointer transition-colors"
                      >
                        <td className="p-3 font-mono font-bold text-purple-700 flex items-center">
                          {s.subject_id}
                          <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
                        </td>
                        <td className="p-3 font-mono text-slate-700">{s.site || "S07"}</td>
                        <td className="p-3 text-slate-800 font-medium">{s.visit || "Routine"}</td>
                        <td className="p-3 font-mono text-slate-800">{s.dose || "50 mg"}</td>
                        <td className="p-3 text-slate-700">{s.change}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            s.status === "ACTIVE" || s.status === "COMPLETED" || s.status === "RESOLVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}>
                            {s.status}
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
                      <td colSpan={7} className="p-4 text-center text-xs text-slate-400">
                        No subject-specific changes recorded for this cut.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Highlight: Incremental Correction Example (Cut 5) */}
          {selectedCut === 5 && (
            <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span>Demonstration: Retroactive Lab Correction Revoking Stale Finding</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                In Cut 3, Subject 042-S07-001 exhibited an apparent ALT elevation. In Cut 5, a formal laboratory re-test correction was submitted confirming standard ALT (32 U/L).
                The WATCH incremental engine automatically updated the graph node, re-evaluated protocol criteria, and <strong>undid the stale safety alert</strong> while preserving the full 21 CFR Part 11 audit history.
              </p>
              <div className="p-3 bg-white rounded-lg border border-emerald-200 font-mono text-[11px] text-slate-700 space-y-1">
                <div>Correction: Subject 042-S07-001 ALT '145' → '32 U/L'</div>
                <div>Action: Finding FND-042-S07-001-ALT status moved to RESOLVED_BY_CORRECTION</div>
                <div>Audit: Preserved in Decision Trace ledger</div>
              </div>
            </div>
          )}

          {/* Highlight: Protocol Amendment Recalculation (Cut 6) */}
          {selectedCut === 6 && (
            <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Protocol Amendment v2.0 Invalidation & Recalculation</span>
              </div>
              <p className="text-xs text-blue-950 leading-relaxed">
                Protocol Amendment v2.0 tightened the allowable visit window from ±7 days to ±3 days.
                WATCH re-evaluated all active visits under the new version rule, identifying emerging deviations without requiring a complete database rebuild.
              </p>
            </div>
          )}

          {/* Highlight: S04 Glucose Anomaly (Cut 7) */}
          {selectedCut === 7 && (
            <div className="p-5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-purple-600" />
                <span>Adversarial Anomaly Detection: Site S04 Glucose Unit Shift</span>
              </div>
              <p className="text-xs text-purple-950 leading-relaxed">
                Site S04 glucose values dropped from baseline median 118 mg/dL to 6.4 mmol/L. Ratio (18.43) matches mmol/L to mg/dL conversion factor.
                Classified as <strong>DATA INTEGRITY ISSUE</strong>: quarantined values, requested lab reissue, avoided false patient hypoglycemia crisis!
              </p>
              <button
                onClick={() => onNavigate("/watch/explain?decision=D-012")}
                className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700"
              >
                View 5-Pillar Explanation for Decision D-012 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

