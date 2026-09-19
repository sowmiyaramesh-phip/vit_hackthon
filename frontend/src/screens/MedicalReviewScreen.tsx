import React, { useState, useEffect } from 'react';
import { Stethoscope, ShieldCheck, AlertTriangle, FileText } from 'lucide-react';
import { Study, Finding } from '../types';
import { getFindings } from '../api';

interface MedicalReviewScreenProps {
  study: Study;
  onViewEvidence: (evidence: any[]) => void;
  onSelectSubject?: (usubjid: string) => void;
}

export const MedicalReviewScreen: React.FC<MedicalReviewScreenProps> = ({
  study,
  onViewEvidence,
  onSelectSubject
}) => {
  const [safetyFindings, setSafetyFindings] = useState<Finding[]>([]);

  useEffect(() => {
    getFindings(study.id, 'SAFETY').then(setSafetyFindings).catch(() => {});
  }, [study.id]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Medical Review Workstation</h1>
        <p className="text-sm text-slate-400">
          Clinical assessment of adverse event seriousness, transaminase trajectories, and safety escalation triage.
        </p>
      </div>

      <div className="space-y-4">
        {safetyFindings.map((f) => (
          <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-400">{f.finding_code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    f.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {f.severity}
                  </span>
                  <span className="text-xs text-slate-400">Subject: <span className="text-indigo-300 font-bold font-mono">{f.subject_id}</span></span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">{f.title}</h3>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                {f.evidence && f.evidence.length > 0 && (
                  <button
                    onClick={() => onViewEvidence(f.evidence)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-medium"
                  >
                    View Evidence ({f.evidence.length})
                  </button>
                )}
                {f.subject_id && onSelectSubject && (
                  <button
                    onClick={() => onSelectSubject(f.subject_id)}
                    className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg border border-indigo-500/30 font-semibold"
                  >
                    Patient 360
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Medical Review Rationale</span>
              <p className="text-slate-300 leading-relaxed">{f.rationale}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
