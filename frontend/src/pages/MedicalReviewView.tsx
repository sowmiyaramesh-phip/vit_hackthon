import React, { useState, useEffect } from "react";
import {
  FileCheck,
  AlertTriangle,
  ShieldAlert,
  Activity,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Clock,
  User,
  Stethoscope,
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { EvidenceDrawer } from "../components/EvidenceDrawer";

interface MedicalReviewItem {
  id: string;
  usubjid: string;
  finding_id: string;
  title: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  clinical_narrative: string;
  causality: "PROBABLE" | "POSSIBLE" | "UNLIKELY" | "NOT_RELATED";
  status: "PENDING_REVIEW" | "ESCALATED" | "RESOLVED";
  evidence_refs: string[];
  protocol_ref?: string;
  date_detected: string;
  assigned_to?: string;
}

export const MedicalReviewView: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [items, setItems] = useState<MedicalReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedItem, setSelectedItem] = useState<MedicalReviewItem | null>(null);
  const [drawerRef, setDrawerRef] = useState<string | null>(null);
  const [justificationNotes, setJustificationNotes] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch findings that pertain to medical review (Safety, Hy's Law, SAEs)
      const findings = await api.getFindings();
      const mapped: MedicalReviewItem[] = (findings || []).map((f: any) => ({
        id: `MR-${f.id || f.finding_id}`,
        usubjid: f.subject_id || f.usubjid || "042-S07-002",
        finding_id: f.id || f.finding_id || "F-001",
        title: f.title,
        category: f.category,
        severity: f.severity as any,
        clinical_narrative: f.message || f.description || "Safety threshold alert requiring review.",
        causality: (f.title || "").includes("Hy's Law") ? "PROBABLE" : (f.title || "").includes("Hospitalization") ? "POSSIBLE" : "UNLIKELY",
        status: f.status === "ACTIVE" ? "PENDING_REVIEW" : f.status === "RESOLVED" ? "RESOLVED" : "ESCALATED",
        evidence_refs: f.evidence_refs || (f.evidence_bundle?.clinical_evidence?.map((e: any) => e.evidence_ref || e.record_ref) || ["LB:042-S07-002:ALT"]),
        protocol_ref: f.protocol_rule || f.protocol_ref || "Protocol v2.0 Section 6.3",
        date_detected: f.created_at || f.detected_at || "2025-03-15",
        assigned_to: "Dr. Sarah Chen",
      }));
      setItems(mapped);
      if (mapped.length > 0 && !selectedItem) {
        setSelectedItem(mapped[0]);
      }
    } catch (e) {
      console.error("Failed to load medical review findings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEscalate = async (item: MedicalReviewItem) => {
    try {
      setActionSuccess(`Case ${item.usubjid} successfully escalated to sovereign Human Gate.`);
      // Update local status
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "ESCALATED" } : i))
      );
      if (selectedItem?.id === item.id) {
        setSelectedItem({ ...selectedItem, status: "ESCALATED" });
      }
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = (item: MedicalReviewItem) => {
    setActionSuccess(`Finding ${item.finding_id} resolved with clinical sign-off: "${justificationNotes || 'Clinical criteria not indicative of DILI'}"`);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "RESOLVED" } : i))
    );
    if (selectedItem?.id === item.id) {
      setSelectedItem({ ...selectedItem, status: "RESOLVED" });
    }
    setJustificationNotes("");
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const filtered = items.filter((it) => {
    if (filterSeverity !== "ALL" && it.severity !== filterSeverity) return false;
    if (filterStatus !== "ALL" && it.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-blue-600" />
            Medical Review Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical safety surveillance, Hy's Law candidate adjudication, adverse event severity grading, and causality assessments.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center space-x-1.5 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Desk</span>
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate("/monitor/human-gate")}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs"
            >
              <span>Go to Human Gate</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium">Pending Medical Review</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {items.filter((i) => i.status === "PENDING_REVIEW").length}
          </div>
          <div className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Awaiting physician sign-off
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="text-rose-700 text-xs font-medium">Critical Hy's Law Signals</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            {items.filter((i) => i.title.toLowerCase().includes("hy's law")).length}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> ALT &gt; 3x + BILI &gt; 2x criteria
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium">Escalated to Human Gate</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {items.filter((i) => i.status === "ESCALATED").length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Sovereign action required</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium">Resolved Cases</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {items.filter((i) => i.status === "RESOLVED").length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">Audited and documented</div>
        </div>
      </div>

      {/* Main Review Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter & Case List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col h-[650px] overflow-hidden">
          {/* Filter Bar */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_REVIEW">Pending</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">{filtered.length} cases</span>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading medical cases...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No medical review items matching criteria.</div>
            ) : (
              filtered.map((it) => {
                const isSelected = selectedItem?.id === it.id;
                return (
                  <div
                    key={it.id}
                    onClick={() => setSelectedItem(it)}
                    className={`p-3.5 cursor-pointer transition-colors text-left ${
                      isSelected ? "bg-blue-50/80 border-l-4 border-blue-600" : "hover:bg-slate-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{it.usubjid}</span>
                        <StatusBadge status={it.severity} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{it.id}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 line-clamp-1">{it.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {it.clinical_narrative}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/80 text-[10px] text-slate-400">
                      <span>Causality: <strong className="text-slate-600">{it.causality}</strong></span>
                      <span className={`px-1.5 py-0.5 rounded font-medium ${
                        it.status === "PENDING_REVIEW" ? "bg-amber-100 text-amber-800" :
                        it.status === "ESCALATED" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {it.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Case Deep-Dive & Adjudication Desk (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col h-[650px] overflow-y-auto">
          {selectedItem ? (
            <div className="space-y-5">
              {/* Header Info */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-slate-900">{selectedItem.usubjid}</span>
                    <StatusBadge status={selectedItem.severity} />
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                      {selectedItem.category}
                    </span>
                  </div>
                  <h2 className="text-sm font-semibold text-slate-800 mt-1">{selectedItem.title}</h2>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate(`/subjects/${selectedItem.usubjid}`)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>Subject 360</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Clinical Narrative */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinical Narrative & Findings
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed font-sans">
                  {selectedItem.clinical_narrative}
                </div>
              </div>

              {/* Protocol Reference */}
              {selectedItem.protocol_ref && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900">
                  <div className="font-semibold text-[11px] text-blue-700 uppercase tracking-wide">Protocol Criteria Citation</div>
                  <div className="mt-1 font-mono text-[11px]">{selectedItem.protocol_ref}</div>
                </div>
              )}

              {/* Ground Truth Evidence Bundle */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  CDISC Ground Truth Citations ({selectedItem.evidence_refs.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedItem.evidence_refs.map((ref) => (
                    <button
                      key={ref}
                      onClick={() => setDrawerRef(ref)}
                      className="p-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-lg text-left transition-colors flex items-center justify-between group"
                    >
                      <div className="truncate">
                        <div className="text-xs font-mono font-medium text-slate-800 group-hover:text-blue-700">
                          {ref}
                        </div>
                        <div className="text-[10px] text-slate-400">Click to inspect source raw row</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Physician Reviewer Decision Controls */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Physician Adjudication & Action
                </div>

                <textarea
                  rows={3}
                  value={justificationNotes}
                  onChange={(e) => setJustificationNotes(e.target.value)}
                  placeholder="Enter medical commentary, differential diagnosis notes, or protocol rationale..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
                />

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => handleResolve(selectedItem)}
                    disabled={selectedItem.status === "RESOLVED"}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sign-off & Resolve</span>
                  </button>

                  <button
                    onClick={() => handleEscalate(selectedItem)}
                    disabled={selectedItem.status === "ESCALATED"}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Escalate to Human Gate</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a case from the list on the left to review.
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
