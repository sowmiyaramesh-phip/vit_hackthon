import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Filter,
  Info,
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { EvidenceDrawer } from "../components/EvidenceDrawer";

interface ProtocolDeviation {
  id: string;
  usubjid: string;
  site: string;
  category: "VISIT_TOLERANCE" | "DOSING" | "EXCLUSION_CRITERIA" | "SAFETY_REPORTING";
  description: string;
  status_v1: "DEVIATION" | "COMPLIANT";
  status_v2: "DEVIATION" | "COMPLIANT";
  explanation: string;
  evidence_refs: string[];
  capa_status: "REQUIRED" | "SUBMITTED" | "RESOLVED";
  detected_date: string;
}

export const ComplianceView: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [deviations, setDeviations] = useState<ProtocolDeviation[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<"v1.0" | "v2.0">("v2.0");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [drawerRef, setDrawerRef] = useState<string | null>(null);

  useEffect(() => {
    // Initial seeded deviations demonstrating Protocol v1.0 vs v2.0 rule differences
    const seededDeviations: ProtocolDeviation[] = [
      {
        id: "DEV-001",
        usubjid: "042-S01-001",
        site: "Site S01",
        category: "DOSING",
        description: "Administered 100mg dose on Day 14 when protocol regimen specified 50mg QD.",
        status_v1: "DEVIATION",
        status_v2: "DEVIATION",
        explanation: "Exceeds authorized protocol dose tier by 100%. Overdose safety assessment completed.",
        evidence_refs: ["EX:042-S01-001:D14"],
        capa_status: "RESOLVED",
        detected_date: "2025-02-14",
      },
      {
        id: "DEV-002",
        usubjid: "042-S02-005",
        site: "Site S02",
        category: "VISIT_TOLERANCE",
        description: "Week 4 visit occurred at Day 32 (Target: Day 28, +4 days off target).",
        status_v1: "DEVIATION",
        status_v2: "COMPLIANT",
        explanation: "v1.0 tolerance window was ±2 days (+4 is out of window). Amendment v2.0 expanded window to ±5 days (+4 is compliant).",
        evidence_refs: ["SV:042-S02-005:W04"],
        capa_status: "RESOLVED",
        detected_date: "2025-02-28",
      },
      {
        id: "DEV-003",
        usubjid: "042-S03-001",
        site: "Site S03",
        category: "SAFETY_REPORTING",
        description: "SAE Inpatient Hospitalization reported to sponsor at 36 hours post-awareness (Protocol threshold: <24h).",
        status_v1: "DEVIATION",
        status_v2: "DEVIATION",
        explanation: "Regulatory safety reporting window exceeded by 12 hours. Expedited CIOMS submitted.",
        evidence_refs: ["AE:042-S03-001:HOSP"],
        capa_status: "SUBMITTED",
        detected_date: "2025-03-01",
      },
      {
        id: "DEV-004",
        usubjid: "042-S05-003",
        site: "Site S05",
        category: "VISIT_TOLERANCE",
        description: "Week 8 visit occurred at Day 59 (Target: Day 56, +3 days off target).",
        status_v1: "DEVIATION",
        status_v2: "COMPLIANT",
        explanation: "Compliant under Protocol v2.0 (±5 days tolerance window), retroactively resolved.",
        evidence_refs: ["SV:042-S05-003:W08"],
        capa_status: "RESOLVED",
        detected_date: "2025-03-12",
      },
      {
        id: "DEV-005",
        usubjid: "042-S07-002",
        site: "Site S07",
        category: "SAFETY_REPORTING",
        description: "Hy's Law laboratory alert (ALT > 3x, BILI > 2x) flagged for expedited medical review.",
        status_v1: "DEVIATION",
        status_v2: "DEVIATION",
        explanation: "Requires immediate temporary treatment hold and repeat re-test within 48h.",
        evidence_refs: ["LB:042-S07-002:ALT", "LB:042-S07-002:BILI"],
        capa_status: "REQUIRED",
        detected_date: "2025-03-15",
      },
    ];
    setDeviations(seededDeviations);
  }, []);

  const filtered = deviations.filter((dev) => {
    if (filterCategory !== "ALL" && dev.category !== filterCategory) return false;
    return true;
  });

  const v1DeviationsCount = deviations.filter((d) => d.status_v1 === "DEVIATION").length;
  const v2DeviationsCount = deviations.filter((d) => d.status_v2 === "DEVIATION").length;
  const reclassifiedCount = deviations.filter(
    (d) => d.status_v1 === "DEVIATION" && d.status_v2 === "COMPLIANT"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Protocol Compliance Audit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated verification of protocol tolerances, visit schedule adherence, and dosing compliance across protocol amendments.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate("/governance/protocols")}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-2xs"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Protocol Amendments</span>
            </button>
          )}
        </div>
      </div>

      {/* Protocol Version Toggle Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30">
              Protocol Comparison Engine
            </span>
            <span className="text-xs text-blue-200">Study ABC-101</span>
          </div>
          <p className="text-sm font-semibold">
            Evaluate deviation status under Version 1.0 (strict) vs Version 2.0 (amended window)
          </p>
          <p className="text-xs text-blue-200/80">
            Protocol v2.0 expanded visit tolerance from ±2 days to ±5 days, retroactively reclassifying non-safety scheduling variations.
          </p>
        </div>

        <div className="flex items-center bg-blue-950/60 p-1 rounded-lg border border-blue-700/50 self-start sm:self-auto">
          <button
            onClick={() => setSelectedVersion("v1.0")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              selectedVersion === "v1.0"
                ? "bg-white text-blue-950 shadow-sm"
                : "text-blue-200 hover:text-white"
            }`}
          >
            Protocol v1.0 (Original)
          </button>
          <button
            onClick={() => setSelectedVersion("v2.0")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              selectedVersion === "v2.0"
                ? "bg-white text-blue-950 shadow-sm"
                : "text-blue-200 hover:text-white"
            }`}
          >
            Protocol v2.0 (Current)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium">Protocol v1.0 Deviations</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{v1DeviationsCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">±2 Day Tolerance</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium">Protocol v2.0 Deviations</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{v2DeviationsCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">±5 Day Tolerance</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="text-emerald-700 text-xs font-medium">Reclassified Compliant</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{reclassifiedCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Under v2.0 Amendment
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium">Pending CAPA Action</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {deviations.filter((d) => d.capa_status === "REQUIRED").length}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">Site corrective action</div>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Categories</option>
                <option value="VISIT_TOLERANCE">Visit Tolerance</option>
                <option value="DOSING">Dosing</option>
                <option value="SAFETY_REPORTING">Safety Reporting</option>
                <option value="EXCLUSION_CRITERIA">Exclusion Criteria</option>
              </select>
            </div>
            <span className="text-xs text-slate-500">
              Showing <strong className="text-slate-800">{filtered.length}</strong> protocol events
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Evaluating under:</span>
            <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-100 text-blue-800">
              {selectedVersion}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
                <th className="p-3 font-semibold">Deviation ID</th>
                <th className="p-3 font-semibold">Subject & Site</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Description & Rationale</th>
                <th className="p-3 font-semibold text-center">Status (v1.0)</th>
                <th className="p-3 font-semibold text-center">Status (v2.0)</th>
                <th className="p-3 font-semibold">CAPA Status</th>
                <th className="p-3 font-semibold text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isReclassified =
                  item.status_v1 === "DEVIATION" && item.status_v2 === "COMPLIANT";

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">{item.id}</td>
                    <td className="p-3">
                      <div className="font-mono font-semibold text-blue-700">
                        {onNavigate ? (
                          <button
                            onClick={() => onNavigate(`/subjects/${item.usubjid}`)}
                            className="hover:underline"
                          >
                            {item.usubjid}
                          </button>
                        ) : (
                          item.usubjid
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.site}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                        {item.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 max-w-md">
                      <div className="font-medium text-slate-800 leading-snug">
                        {item.description}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {item.explanation}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status_v1 === "DEVIATION"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.status_v1}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status_v2 === "DEVIATION"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-500/30"
                        }`}
                      >
                        {item.status_v2}
                      </span>
                      {isReclassified && (
                        <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">
                          ✓ Reclassified
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.capa_status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.capa_status === "SUBMITTED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {item.capa_status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {item.evidence_refs.map((ref) => (
                        <button
                          key={ref}
                          onClick={() => setDrawerRef(ref)}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-600 hover:text-blue-800 hover:underline ml-1"
                        >
                          <span>{ref}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
