import React, { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, ArrowRight, ArrowLeft, History, FileText } from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { EvidenceDrawer } from "../components/EvidenceDrawer";

interface FindingDetailProps {
  findingId: string;
  onNavigate: (path: string) => void;
}

export const FindingDetail: React.FC<FindingDetailProps> = ({ findingId, onNavigate }) => {
  const [finding, setFinding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [findingId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.getFindingDetail(findingId);
      setFinding(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !finding) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-400">
        Loading finding details for {findingId}...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate("/findings")}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Findings
          </button>
          <StatusBadge status={finding.severity} />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">{finding.title}</h1>
            <span className="text-xs font-mono text-slate-400">[{finding.finding_id}]</span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
            <span>Subject: <strong className="font-mono text-blue-700">{finding.subject_id}</strong></span>
            <span>Site: <strong>{finding.site_id}</strong></span>
            <span>Category: <strong>{finding.category}</strong></span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedEvidence(`Finding: ${finding.finding_id}`)}
            className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> View Ground-Truth Evidence
          </button>
          <button
            onClick={() => onNavigate("/monitor/medical-review")}
            className="flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5 mr-1" /> Send to Medical Review
          </button>
          <button
            onClick={() => onNavigate("/monitor/trace")}
            className="flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <History className="w-3.5 h-3.5 mr-1" /> View Decision Trace
          </button>
        </div>
      </div>

      {/* Why Detected Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Why Detected (Deterministic Clinical Criteria)
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
          {finding.why_detected}
        </p>

        <div>
          <span className="text-xs font-bold text-slate-700">Governing Protocol Rule:</span>
          <p className="text-xs text-blue-800 bg-blue-50/70 p-3 rounded-lg border border-blue-200 mt-1 font-mono">
            {finding.protocol_rule}
          </p>
        </div>
      </div>

      {/* Review History */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Audit & Review Lifecycle History
        </h3>
        <div className="space-y-2">
          {finding.review_history?.map((h: any, idx: number) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900">{h.node} Node</span>
                <p className="text-slate-600 text-[11px]">{h.action}</p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{h.timestamp}</span>
            </div>
          ))}
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
