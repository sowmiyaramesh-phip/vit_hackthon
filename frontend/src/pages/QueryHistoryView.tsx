import React, { useState, useEffect } from "react";
import {
  SearchCheck,
  HelpCircle,
  CheckCircle2,
  Clock,
  Filter,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { EvidenceDrawer } from "../components/EvidenceDrawer";

interface QueryHistoryRecord {
  query_id: string;
  usubjid: string;
  site: string;
  domain: string;
  variable: string;
  query_text: string;
  site_response?: string;
  dm_notes?: string;
  status: "OPEN" | "SITE_RESPONSE" | "UNDER_REVIEW" | "CLOSED";
  created_at: string;
  resolved_at?: string;
  evidence_refs: string[];
}

export const QueryHistoryView: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [queries, setQueries] = useState<QueryHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterDomain, setFilterDomain] = useState<string>("ALL");
  const [selectedQuery, setSelectedQuery] = useState<QueryHistoryRecord | null>(null);
  const [drawerRef, setDrawerRef] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueries = async () => {
      setLoading(true);
      try {
        const data = await api.getQueryHistory();
        setQueries(data);
        if (data && data.length > 0) {
          setSelectedQuery(data[0]);
        }
      } catch (e) {
        console.error("Failed to load query history", e);
        // Fallback sample query records
        const fallbackQueries: QueryHistoryRecord[] = [
          {
            query_id: "Q-S04-GLUC-01",
            usubjid: "042-S04-001",
            site: "Site S04",
            domain: "LB",
            variable: "GLUC",
            query_text: "Fasting glucose value of 6.4 mg/dL reported at Visit 6 appears physiologically implausible without acute hypoglycemic symptoms. Confirm if value was reported in mmol/L or requires unit correction.",
            site_response: "Investigator confirmed: New lab analyzer reported glucose in mmol/L instead of mg/dL. True value is 6.4 mmol/L (equivalent to 115.3 mg/dL). Unit corrected in lab feed.",
            dm_notes: "Response reviewed and accepted. Unit conversion rule applied. Query closed.",
            status: "CLOSED",
            created_at: "2025-02-21T10:14:00Z",
            resolved_at: "2025-02-24T15:30:00Z",
            evidence_refs: ["LB:042-S04-001:GLUC:V06"],
          },
          {
            query_id: "Q-S01-DOSE-02",
            usubjid: "042-S01-001",
            site: "Site S01",
            domain: "EX",
            variable: "EXDOSE",
            query_text: "Subject received 100mg dose on Day 14. Protocol schedule specified 50mg QD. Please confirm administration record and provide reason for deviation.",
            site_response: "Dispensing pharmacy mistakenly selected 100mg capsule pack. Subject monitored for 48 hours with no adverse events.",
            dm_notes: "Protocol deviation log updated (DEV-001). Safety assessment confirmed clean.",
            status: "CLOSED",
            created_at: "2025-02-15T08:30:00Z",
            resolved_at: "2025-02-18T11:00:00Z",
            evidence_refs: ["EX:042-S01-001:D14"],
          },
          {
            query_id: "Q-S03-AE-01",
            usubjid: "042-S03-001",
            site: "Site S03",
            domain: "AE",
            variable: "AEOUT",
            query_text: "Severe hospitalization reported without discharge date recorded in CRF. Provide expected or actual discharge date and outcome.",
            site_response: "Patient was discharged on 2025-03-04 with symptoms fully resolved.",
            dm_notes: "Under review pending discharge summary verification.",
            status: "UNDER_REVIEW",
            created_at: "2025-03-02T14:00:00Z",
            evidence_refs: ["AE:042-S03-001:HOSP"],
          },
          {
            query_id: "Q-S07-LAB-03",
            usubjid: "042-S07-002",
            site: "Site S07",
            domain: "LB",
            variable: "ALT",
            query_text: "Repeat hepatic panel required within 48 hours of elevated ALT/BILI alert. Submit follow-up laboratory accession number.",
            status: "OPEN",
            created_at: "2025-03-15T11:20:00Z",
            evidence_refs: ["LB:042-S07-002:ALT"],
          },
        ];
        setQueries(fallbackQueries);
        setSelectedQuery(fallbackQueries[0]);
      } finally {
        setLoading(false);
      }
    };
    fetchQueries();
  }, []);

  const filtered = queries.filter((q) => {
    if (filterStatus !== "ALL" && q.status !== filterStatus) return false;
    if (filterDomain !== "ALL" && q.domain !== filterDomain) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SearchCheck className="w-6 h-6 text-blue-600" />
            Data Query History & Lifecycle Archive
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete lifecycle records of clinical queries generated, site responses, investigator affirmations, and data manager resolutions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate("/monitor/queries")}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Active Query Desk</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium">Total Lifetime Queries</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{queries.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all sites & visits</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="text-blue-700 text-xs font-medium">Open Queries</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {queries.filter((q) => q.status === "OPEN").length}
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5">Awaiting site input</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="text-amber-700 text-xs font-medium">Under Review</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {queries.filter((q) => q.status === "UNDER_REVIEW" || q.status === "SITE_RESPONSE").length}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">Data Manager triage</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="text-emerald-700 text-xs font-medium">Closed & Reconciled</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {queries.filter((q) => q.status === "CLOSED").length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Audited in CDISC</div>
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Query List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col h-[650px] overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="CLOSED">Closed</option>
              </select>
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">All Domains</option>
                <option value="LB">LB (Labs)</option>
                <option value="EX">EX (Exposure)</option>
                <option value="AE">AE (Adverse Events)</option>
              </select>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">{filtered.length} queries</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading queries...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No queries found.</div>
            ) : (
              filtered.map((q) => {
                const isSelected = selectedQuery?.query_id === q.query_id;
                return (
                  <div
                    key={q.query_id}
                    onClick={() => setSelectedQuery(q)}
                    className={`p-3.5 cursor-pointer transition-colors text-left ${
                      isSelected ? "bg-blue-50/80 border-l-4 border-blue-600" : "hover:bg-slate-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{q.query_id}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {q.domain}:{q.variable}
                        </span>
                      </div>
                      <StatusBadge status={q.status} />
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-2 leading-snug">
                      {q.query_text}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>Subject: <strong className="text-blue-700 font-mono">{q.usubjid}</strong></span>
                      <span>{q.site}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Query Deep-Dive & Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col h-[650px] overflow-y-auto">
          {selectedQuery ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-slate-900">
                      {selectedQuery.query_id}
                    </span>
                    <StatusBadge status={selectedQuery.status} />
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                      Domain: {selectedQuery.domain} ({selectedQuery.variable})
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>Subject: <strong className="font-mono text-blue-700">{selectedQuery.usubjid}</strong></span>
                    <span>•</span>
                    <span>{selectedQuery.site}</span>
                    <span>•</span>
                    <span>Created: {new Date(selectedQuery.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate(`/subjects/${selectedQuery.usubjid}`)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>View Subject</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Lifecycle Stage 1: Query Issued */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Query Issued by Data Manager
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(selectedQuery.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-sans">
                  {selectedQuery.query_text}
                </p>
              </div>

              {/* Lifecycle Stage 2: Site Investigator Response */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Site Investigator Response
                  </span>
                  {selectedQuery.site_response && (
                    <span className="text-[10px] text-blue-600 font-mono">Affirmed by Site PI</span>
                  )}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans italic">
                  {selectedQuery.site_response ? (
                    `"${selectedQuery.site_response}"`
                  ) : (
                    <span className="text-slate-400">Awaiting formal response from clinical study coordinator at {selectedQuery.site}.</span>
                  )}
                </p>
              </div>

              {/* Lifecycle Stage 3: Resolution / Closure */}
              {selectedQuery.status === "CLOSED" && (
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Query Resolved & Closed
                    </span>
                    {selectedQuery.resolved_at && (
                      <span className="text-[10px] text-emerald-700 font-mono">
                        {new Date(selectedQuery.resolved_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {selectedQuery.dm_notes || "Discrepancy reconciled in study data feed."}
                  </p>
                </div>
              )}

              {/* Evidence Records */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  CDISC Ground Truth Citation
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedQuery.evidence_refs.map((ref) => (
                    <button
                      key={ref}
                      onClick={() => setDrawerRef(ref)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-lg text-xs font-mono text-blue-700 flex items-center gap-1.5"
                    >
                      <span>{ref}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a query from the left list to review its complete lifecycle.
            </div>
          )}
        </div>
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={Boolean(drawerRef)}
        onClose={() => setDrawerRef(null)}
        evidenceRef={drawerRef}
      />
    </div>
  );
};
