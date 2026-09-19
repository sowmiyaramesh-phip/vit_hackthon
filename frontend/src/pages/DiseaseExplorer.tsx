import React, { useState, useEffect } from "react";
import { Search, Activity, Users, ArrowRight, ShieldCheck, AlertTriangle, Filter, Pill } from "lucide-react";
import { api } from "../services/api";
import { DiseaseSearchResult } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { EvidenceDrawer } from "../components/EvidenceDrawer";

interface DiseaseExplorerProps {
  initialDisease?: string;
  onNavigate: (path: string) => void;
}

export const DiseaseExplorer: React.FC<DiseaseExplorerProps> = ({
  initialDisease = "Liver disease",
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialDisease);
  const [data, setData] = useState<DiseaseSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  // Filters
  const [siteFilter, setSiteFilter] = useState("");
  const [treatmentFilter, setTreatmentFilter] = useState("");
  const [treatmentStatusFilter, setTreatmentStatusFilter] = useState("");

  useEffect(() => {
    executeSearch(searchTerm);
  }, []);

  const executeSearch = async (diseaseName: string) => {
    if (!diseaseName.trim()) return;
    setLoading(true);
    try {
      const res = await api.exploreDisease(diseaseName);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = data?.subjects?.filter((s) => {
    if (siteFilter && s.site_id !== siteFilter) return false;
    if (treatmentFilter && s.primary_treatment !== treatmentFilter) return false;
    if (treatmentStatusFilter && s.treatment_status !== treatmentStatusFilter) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Search */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-purple-700">
          <Activity className="w-5 h-5" />
          <h1 className="text-xl font-bold text-slate-900">Disease Explorer</h1>
        </div>
        <p className="text-xs text-slate-500">
          Search for a medical condition or disease to discover all trial subjects whose verified study data establishes that condition.
        </p>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch(searchTerm);
          }}
          className="flex gap-2 max-w-xl"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search disease (e.g. Liver disease, Diabetes, Hypertension)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            {loading ? "Searching..." : "Explore Disease"}
          </button>
        </form>

        {/* Disease Suggestion Pills */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 pt-1">
          <span>Popular Conditions:</span>
          {["Liver disease", "Diabetes", "Hypertension"].map((cond) => (
            <button
              key={cond}
              type="button"
              onClick={() => {
                setSearchTerm(cond);
                executeSearch(cond);
              }}
              className="px-2.5 py-0.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 rounded text-[11px] font-medium transition-colors"
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <>
          {/* Summary & Observed Treatments Banner */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-purple-950">{data.disease}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-200 text-purple-900">
                  {data.total_subjects} Subjects found
                </span>
              </div>
              <p className="text-xs text-purple-800 mt-1">
                Evaluated against primary Medical History (<code>MH</code>) domains and protocol reference criteria.
              </p>
            </div>

            {/* Observed Treatments Breakdown */}
            <div className="flex items-center space-x-3 bg-white px-4 py-2.5 rounded-lg border border-purple-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-700">Observed Treatments:</span>
              {Object.entries(data.treatments_observed || {}).map(([med, count]) => (
                <div key={med} className="flex items-center space-x-1 text-xs">
                  <span className="font-bold text-slate-900">{med}</span>
                  <span className="text-slate-400 font-medium">({count})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Table Filters */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">Filter Matching Subjects:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700"
              >
                <option value="">All Sites</option>
                <option value="SITE-107">SITE-107 (S07)</option>
                <option value="SITE-102">SITE-102 (S02)</option>
                <option value="SITE-111">SITE-111 (S11)</option>
                <option value="SITE-101">SITE-101 (S01)</option>
                <option value="SITE-103">SITE-103 (S03)</option>
                <option value="SITE-105">SITE-105 (S05)</option>
                <option value="SITE-108">SITE-108 (S08)</option>
              </select>

              <select
                value={treatmentFilter}
                onChange={(e) => setTreatmentFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700"
              >
                <option value="">All Treatments</option>
                <option value="Drug A">Drug A</option>
                <option value="Drug B">Drug B</option>
                <option value="Standard Care">Standard Care</option>
              </select>

              <select
                value={treatmentStatusFilter}
                onChange={(e) => setTreatmentStatusFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>

              {(siteFilter || treatmentFilter || treatmentStatusFilter) && (
                <button
                  onClick={() => {
                    setSiteFilter("");
                    setTreatmentFilter("");
                    setTreatmentStatusFilter("");
                  }}
                  className="text-xs text-purple-600 font-semibold px-2 py-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Matching Subjects Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Site</th>
                  <th className="py-3 px-4">Disease</th>
                  <th className="py-3 px-4">Observed Treatment</th>
                  <th className="py-3 px-4">Treatment Status</th>
                  <th className="py-3 px-4">Evidence Status</th>
                  <th className="py-3 px-4 text-center">Findings</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map((s) => {
                  const tr = s.treatments[0];
                  return (
                    <tr
                      key={s.subject_id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => onNavigate(`/subjects/${s.subject_id}`)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 group-hover:text-blue-800">
                        {s.subject_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{s.site_id}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(`/disease-detail?disease=${encodeURIComponent(s.disease)}`);
                          }}
                          className="font-semibold text-purple-700 hover:underline flex items-center"
                        >
                          {s.disease} <ArrowRight className="w-3 h-3 ml-1" />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {s.primary_treatment}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={s.treatment_status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {tr?.is_supported ? (
                          <span className="inline-flex items-center text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" /> Supported
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Relationship not established
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {s.open_findings_count > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 mr-1" /> {s.open_findings_count}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                          Subject 360 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={Boolean(selectedEvidence)}
        onClose={() => setSelectedEvidence(null)}
        evidenceRef={selectedEvidence}
      />
    </div>
  );
};
