import React, { useEffect, useState } from "react";
import { Users, Search, Plus, Filter, ArrowRight, Activity, AlertTriangle, HelpCircle } from "lucide-react";
import { api } from "../services/api";
import { SubjectSummary } from "../types";
import { StatusBadge } from "../components/StatusBadge";

interface SubjectsProps {
  onNavigate: (path: string) => void;
}

export const Subjects: React.FC<SubjectsProps> = ({ onNavigate }) => {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("");
  const [treatmentFilter, setTreatmentFilter] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, [siteFilter, statusFilter, diseaseFilter, treatmentFilter, search]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await api.getSubjects({
        site: siteFilter,
        status: statusFilter,
        disease: diseaseFilter,
        treatment: treatmentFilter,
        search: search,
      });
      setSubjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Study Subjects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Subject directory with real-time links to Disease Explorer and Subject 360.
          </p>
        </div>
        <button
          onClick={() => onNavigate("/subjects/add")}
          className="flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Subject
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[220px] max-w-sm relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Subject ID, site, or treatment..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Site Filter */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Sites</option>
            <option value="SITE-101">SITE-101 (S01)</option>
            <option value="SITE-102">SITE-102 (S02)</option>
            <option value="SITE-103">SITE-103 (S03)</option>
            <option value="SITE-104">SITE-104 (S04)</option>
            <option value="SITE-105">SITE-105 (S05)</option>
            <option value="SITE-107">SITE-107 (S07)</option>
            <option value="SITE-108">SITE-108 (S08)</option>
            <option value="SITE-111">SITE-111 (S11)</option>
          </select>

          {/* Disease Filter */}
          <select
            value={diseaseFilter}
            onChange={(e) => setDiseaseFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Diseases</option>
            <option value="Liver disease">Liver disease (8)</option>
            <option value="Diabetes">Diabetes</option>
            <option value="Hypertension">Hypertension</option>
          </select>

          {/* Treatment Filter */}
          <select
            value={treatmentFilter}
            onChange={(e) => setTreatmentFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Treatments</option>
            <option value="Drug A">Drug A</option>
            <option value="Drug B">Drug B</option>
            <option value="Standard Care">Standard Care</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>

          {(siteFilter || statusFilter || diseaseFilter || treatmentFilter || search) && (
            <button
              onClick={() => {
                setSiteFilter("");
                setStatusFilter("");
                setDiseaseFilter("");
                setTreatmentFilter("");
                setSearch("");
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Subject ID</th>
                <th className="py-3 px-4">Site</th>
                <th className="py-3 px-4">Disease</th>
                <th className="py-3 px-4">Treatment</th>
                <th className="py-3 px-4">Medication</th>
                <th className="py-3 px-4">Treatment Status</th>
                <th className="py-3 px-4 text-center">Current Cut</th>
                <th className="py-3 px-4">Latest Finding</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading clinical subjects...
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No subjects matched the applied search and filter criteria.
                  </td>
                </tr>
              ) : (
                subjects.map((s) => (
                  <tr
                    key={s.subject_id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => onNavigate(`/subjects/${s.subject_id}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 group-hover:text-blue-800">
                      {s.subject_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                      {s.site_id.replace("SITE-", "S").replace("10", "0")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-purple-900">
                        {s.disease || (s.diseases && s.diseases[0]) || "Liver disease"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-teal-900">
                      {s.treatment}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      {s.medication || s.treatment}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        {s.treatment_status || "Active"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-purple-100 text-purple-800">
                        Cut {s.current_cut || 8}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {s.latest_finding && s.latest_finding !== "None" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                          {s.latest_finding}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                        360 View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
