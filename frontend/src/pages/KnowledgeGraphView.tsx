import React, { useEffect, useState } from "react";
import {
  Network,
  Users,
  MapPin,
  Activity,
  Pill,
  AlertTriangle,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Info,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { api } from "../services/api";

interface KnowledgeGraphViewProps {
  onNavigate: (path: string) => void;
}

type FilterCategory = "ALL" | "SUBJECT" | "SITE" | "DISEASE" | "TREATMENT" | "MEDICATION" | "FINDING";

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [entityDetails, setEntityDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await api.getKGOverview();
      setOverview(data);
      // Default select the first disease if available
      if (data.diseases && data.diseases.length > 0) {
        selectEntity(data.diseases[0]);
      }
    } catch (err) {
      console.error("Failed to load KG overview:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectEntity = async (entity: any) => {
    setSelectedEntity(entity);
    try {
      setDetailsLoading(true);
      let detail = null;
      if (entity.type === "DISEASE") {
        detail = await api.getKGByDisease(entity.name);
      } else if (entity.type === "TREATMENT") {
        detail = await api.getKGByTreatment(entity.name);
      } else if (entity.type === "MEDICATION") {
        detail = await api.getKGByMedication(entity.name);
      }
      setEntityDetails(detail);
    } catch (err) {
      console.error("Failed to fetch entity details:", err);
      setEntityDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filterTabs: Array<{ id: FilterCategory; label: string; icon: React.ElementType }> = [
    { id: "ALL", label: "All Entities", icon: Network },
    { id: "SUBJECT", label: "Subjects", icon: Users },
    { id: "SITE", label: "Sites", icon: MapPin },
    { id: "DISEASE", label: "Diseases", icon: Activity },
    { id: "TREATMENT", label: "Treatments", icon: ShieldCheck },
    { id: "MEDICATION", label: "Medications", icon: Pill },
    { id: "FINDING", label: "Findings", icon: AlertTriangle },
  ];

  if (loading || !overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] bg-white rounded-xl border border-slate-200 p-8">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Loading Clinical Knowledge Graph...</p>
        <p className="text-xs text-slate-400 mt-1 font-mono">Indexing entities across SDTM DM, MH, CM, EX, LB, AE domains</p>
      </div>
    );
  }

  // Filter entities according to category & search query
  const matchesSearch = (str: string) => str.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredDiseases = overview.diseases.filter((d: any) => matchesSearch(d.name));
  const filteredTreatments = overview.treatments.filter((t: any) => matchesSearch(t.name));
  const filteredMeds = overview.medications.filter((m: any) => matchesSearch(m.name));
  const filteredSites = overview.sites.filter((s: any) => matchesSearch(s.name) || matchesSearch(s.label));
  const filteredSubjects = overview.subjects.filter((s: any) => matchesSearch(s.name) || matchesSearch(s.site));
  const filteredFindings = overview.findings.filter((f: any) => matchesSearch(f.name) || matchesSearch(f.label));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600">
            <Network className="w-5 h-5" />
            <h1 className="text-xl font-bold text-slate-900">Subject-Centered Knowledge Graph</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured relational clinical intelligence connecting Study → Sites → Subjects → Diseases → Treatments → Cuts → Evidentiary Records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search diseases, meds, subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button
            onClick={fetchOverview}
            className="flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1 text-slate-500" /> Refresh
          </button>
        </div>
      </div>

      {/* Top Filter Category Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 bg-white px-4 pt-3 rounded-t-xl overflow-x-auto">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Knowledge Graph Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Entity Card Columns (Left - 5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* DISEASES SECTION */}
          {(activeCategory === "ALL" || activeCategory === "DISEASE") && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-purple-700 font-bold text-xs uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  <span>Diseases / Conditions ({filteredDiseases.length})</span>
                </div>
                <span className="text-[10px] text-slate-400">Click to inspect cohort</span>
              </div>
              <div className="space-y-2">
                {filteredDiseases.map((d: any) => {
                  const isSelected = selectedEntity?.id === d.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => selectEntity(d)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                          : "bg-slate-50/70 border-slate-200 hover:bg-purple-50/40 hover:border-purple-200"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center">
                          {d.name}
                        </div>
                        <div className="text-[11px] text-purple-700 mt-0.5">{d.label}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? "text-purple-600" : "text-slate-400"}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TREATMENTS SECTION */}
          {(activeCategory === "ALL" || activeCategory === "TREATMENT") && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Investigational Treatments ({filteredTreatments.length})</span>
                </div>
              </div>
              <div className="space-y-2">
                {filteredTreatments.map((t: any) => {
                  const isSelected = selectedEntity?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => selectEntity(t)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 shadow-xs"
                          : "bg-slate-50/70 border-slate-200 hover:bg-teal-50/40 hover:border-teal-200"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{t.name}</div>
                        <div className="text-[11px] text-teal-700 mt-0.5">{t.label}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? "text-teal-600" : "text-slate-400"}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MEDICATIONS SECTION */}
          {(activeCategory === "ALL" || activeCategory === "MEDICATION") && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                  <Pill className="w-4 h-4" />
                  <span>Medications Taken ({filteredMeds.length})</span>
                </div>
              </div>
              <div className="space-y-2">
                {filteredMeds.map((m: any) => {
                  const isSelected = selectedEntity?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => selectEntity(m)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-slate-50/70 border-slate-200 hover:bg-blue-50/40 hover:border-blue-200"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[11px] text-blue-700 mt-0.5">{m.label}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SITES SECTION */}
          {(activeCategory === "ALL" || activeCategory === "SITE") && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>Clinical Trial Sites ({filteredSites.length})</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredSites.map((s: any) => (
                  <div key={s.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div className="font-bold text-slate-900 font-mono">{s.name}</div>
                    <div className="text-[10px] text-slate-500 truncate" title={s.label}>{s.label}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-1">{s.count} Subjects Enrolled</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FINDINGS SECTION */}
          {(activeCategory === "ALL" || activeCategory === "FINDING") && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Protocol Findings & Signals ({filteredFindings.length})</span>
                </div>
              </div>
              <div className="space-y-2">
                {filteredFindings.map((f: any) => (
                  <div key={f.id} className="p-2.5 bg-rose-50/50 border border-rose-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-rose-900">{f.name}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{f.label}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase">
                      {f.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Entity Drilldown & Connected Subjects Table (Right - 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            {selectedEntity ? (
              <div className="space-y-5">
                {/* Header of Selected Entity */}
                <div className="pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Entity Type: {selectedEntity.type}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center">
                      {selectedEntity.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ground truth relational connections established in CDISC clinical trial database.
                    </p>
                  </div>

                  {selectedEntity.type === "DISEASE" && (
                    <button
                      onClick={() => onNavigate(`/disease-explorer?disease=${encodeURIComponent(selectedEntity.name)}`)}
                      className="flex items-center px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5 mr-1" /> Open Disease Explorer
                    </button>
                  )}
                </div>

                {/* Loading indicator for entity subjects */}
                {detailsLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Querying associated subjects across trial cuts...
                  </div>
                ) : entityDetails && entityDetails.subjects ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Associated Study Subjects ({entityDetails.subjects.length})
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Click any subject row to open Subject 360
                      </span>
                    </div>

                    {/* Table of Associated Subjects */}
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="p-3">Subject ID</th>
                            <th className="p-3">Site</th>
                            {selectedEntity.type === "DISEASE" && <th className="p-3">Treatment</th>}
                            {selectedEntity.type === "DISEASE" && <th className="p-3">Medication</th>}
                            {selectedEntity.type === "TREATMENT" && <th className="p-3">Disease</th>}
                            {selectedEntity.type === "MEDICATION" && <th className="p-3">Supported For</th>}
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {entityDetails.subjects.map((s: any, idx: number) => (
                            <tr
                              key={idx}
                              onClick={() => onNavigate(`/subjects/${s.subject_id}`)}
                              className="hover:bg-indigo-50/50 cursor-pointer transition-colors"
                            >
                              <td className="p-3 font-mono font-bold text-indigo-600 flex items-center">
                                {s.subject_id}
                                <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
                              </td>
                              <td className="p-3 font-mono text-slate-700">{s.site || "S07"}</td>
                              {selectedEntity.type === "DISEASE" && (
                                <td className="p-3 font-medium text-slate-900">{s.treatment}</td>
                              )}
                              {selectedEntity.type === "DISEASE" && (
                                <td className="p-3 text-slate-600">{s.medication}</td>
                              )}
                              {selectedEntity.type === "TREATMENT" && (
                                <td className="p-3 font-medium text-purple-900">{s.disease}</td>
                              )}
                              {selectedEntity.type === "MEDICATION" && (
                                <td className="p-3">
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                    s.is_supported
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {s.supported_for || "Concomitant"}
                                  </span>
                                </td>
                              )}
                              <td className="p-3">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                  {s.status || "Ongoing"}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <span className="text-xs font-semibold text-indigo-600 hover:underline">
                                  Subject 360 →
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Scientific Rule Note */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start space-x-2">
                      <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Scientific Distinctions Preserved:</strong> Diseases and treatments are mapped through curated protocol criteria. Concomitant medications taken by subjects without formal investigational designation are classified as unverified associations rather than proven indications.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No connected subjects found for this entity.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                <Network className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Select any disease, treatment, or medication card on the left to view connected subjects and trial cuts.
              </div>
            )}
          </div>

          {/* Quick Direct Subject Navigation List */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
                <Users className="w-4 h-4 mr-1.5 text-indigo-600" /> Quick Subject Directory
              </h3>
              <button
                onClick={() => onNavigate("/subjects")}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View All Subjects Directory →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {filteredSubjects.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => onNavigate(`/subjects/${s.name}`)}
                  className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition-colors"
                >
                  <div className="font-mono font-bold text-xs text-indigo-700 truncate">{s.name}</div>
                  <div className="text-[10px] text-slate-500">{s.site} · {s.status}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

