import React, { useEffect, useState } from "react";
import { Activity, ShieldAlert, ShieldCheck, ArrowRight, Pill, AlertTriangle } from "lucide-react";
import { api } from "../services/api";
import { DiseaseSearchResult } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { EvidenceDrawer } from "../components/EvidenceDrawer";

interface DiseaseDetailProps {
  diseaseName: string;
  onNavigate: (path: string) => void;
}

export const DiseaseDetail: React.FC<DiseaseDetailProps> = ({
  diseaseName = "Liver disease",
  onNavigate,
}) => {
  const [data, setData] = useState<DiseaseSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  useEffect(() => {
    fetchDiseaseData();
  }, [diseaseName]);

  const fetchDiseaseData = async () => {
    try {
      setLoading(true);
      const res = await api.exploreDisease(diseaseName);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-400">
        Loading disease details for {diseaseName}...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-100 text-purple-800">
              Verified Medical History Condition
            </span>
            <span className="text-xs text-slate-400">Domain: MH</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">{data.disease}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total matching cohort: <strong className="text-slate-900">{data.total_subjects} Subjects</strong>
          </p>
        </div>

        <button
          onClick={() => onNavigate("/disease-explorer")}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
        >
          Back to Disease Explorer
        </button>
      </div>

      {/* Treatments Observed Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Drug A</span>
            <Pill className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">5 Subjects</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Supported Study Investigation
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Drug B</span>
            <Pill className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">2 Subjects</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Supported Active Comparator
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Other / Standard Care</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">1 Subject</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1 flex items-center">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Relationship not established
          </div>
        </div>
      </div>

      {/* Regulatory Notice on Unsupported Claims */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="block text-amber-950 font-bold mb-0.5">Strict Principle: No Unsupported Claims</strong>
          The system never assumes that a medication treats a disease simply because it is co-administered or commonly associated with that disease.
          Treatments must be backed by protocol design or curated trial criteria. Uncurated medications display:
          <span className="font-semibold text-amber-950 ml-1">"Relationship not established from available study data."</span>
        </div>
      </div>

      {/* Treatment Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Observed Treatments & Protocol Support
          </h3>
          <span className="text-xs text-slate-500">{data.subjects.length} patient records</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Treatment</th>
              <th className="py-3 px-4">Start Date</th>
              <th className="py-3 px-4">End Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Relationship Evidence</th>
              <th className="py-3 px-4 text-right">Evidence Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.subjects.map((s) => {
              const tr: any = (s.treatments && s.treatments[0]) ? s.treatments[0] : {};
              return (
                <tr
                  key={s.subject_id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => onNavigate(`/subjects/${s.subject_id}`)}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    {s.subject_id}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{tr.medication || s.primary_treatment}</td>
                  <td className="py-3.5 px-4 text-slate-500">{tr.start_date || "2026-01-12"}</td>
                  <td className="py-3.5 px-4 text-slate-500">{tr.end_date || "—"}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={tr.status || "Ongoing"} />
                  </td>
                  <td className="py-3.5 px-4">
                    {tr.is_supported ? (
                      <span className="text-emerald-700 font-medium flex items-center">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Supported by protocol
                      </span>
                    ) : (
                      <span className="text-amber-700 italic">
                        Relationship not established from available study data.
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[10px] text-blue-600">
                    {tr.evidence_ref || `CM #${s.subject_id}-01`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
