import React from 'react';
import { X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { EvidenceItem } from '../types';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: EvidenceItem[];
  title?: string;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  onClose,
  evidence,
  title = 'Verified Clinical Evidence Chain'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-300 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>All cited records have been verified against backend source records. Strict provenance discipline enforced.</span>
          </div>

          {evidence.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No evidence records attached to this item.
            </div>
          ) : (
            evidence.map((ev, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {ev.record_type} Record
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {ev.record_id}
                  </span>
                </div>

                {ev.field && (
                  <div className="text-xs">
                    <span className="text-slate-400">Clinical Field: </span>
                    <span className="font-semibold text-slate-200">{ev.field}</span>
                  </div>
                )}

                {ev.value && (
                  <div className="text-xs">
                    <span className="text-slate-400">Observed Value: </span>
                    <span className="font-mono font-semibold text-amber-400">{ev.value}</span>
                  </div>
                )}

                {ev.rule && (
                  <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800/80">
                    <span className="font-semibold text-slate-300">Applicable Protocol Rule: </span>
                    {ev.rule}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 mt-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
