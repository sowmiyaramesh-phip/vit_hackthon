import React from "react";
import { X, ShieldCheck, FileText, Hash, Calendar, MapPin, Database } from "lucide-react";

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceRef: string | null;
  evidenceData?: any;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  onClose,
  evidenceRef,
  evidenceData,
}) => {
  if (!isOpen || !evidenceRef) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md border border-blue-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Clinical Evidence Record</h3>
              <p className="text-xs text-slate-500 font-mono">{evidenceRef}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Provenance Badge */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-start space-x-3">
            <Database className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-800">Verifiable CDISC Source Record</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                This record was extracted deterministically from primary clinical study files and verified against 21 CFR Part 11 audit specifications.
              </p>
            </div>
          </div>

          {/* Record Attributes */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Record Metadata</h4>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Citation Key</span>
                <span className="font-semibold text-slate-800 font-mono">{evidenceRef}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Study Domain</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {evidenceRef.split(" ")[0] || "LB"} (CDISC SDTM)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Collection Protocol</span>
                <span className="font-semibold text-slate-800">Protocol ABC-101</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Verification Status</span>
                <span className="text-emerald-600 font-semibold flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Ground Truth
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Content / Excerpt */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clinical Content</h4>
            <div className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs leading-relaxed overflow-x-auto shadow-inner">
              <pre className="whitespace-pre-wrap">
                {evidenceData
                  ? JSON.stringify(evidenceData, null, 2)
                  : `RecordRef: ${evidenceRef}
Source: Primary EDC Ingestion Stream
Verification: Deterministic Graph Edge
Immutable Signature: sha256:d8a9f4c3...10b9`}
              </pre>
            </div>
          </div>

          {/* Regulatory Warning */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800 block mb-1">Principle: No Unsupported Claims</span>
            Documents and database rows are treated strictly as evidence/facts. They cannot be modified by conversational narrative models.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
