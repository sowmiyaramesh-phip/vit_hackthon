import React, { useState, useEffect } from 'react';
import { AlertTriangle, Filter, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Study, Finding } from '../types';
import { getFindings } from '../api';

interface FindingsScreenProps {
  study: Study;
  onViewEvidence: (evidence: any[]) => void;
  onSelectSubject?: (usubjid: string) => void;
}

export const FindingsScreen: React.FC<FindingsScreenProps> = ({ study, onViewEvidence, onSelectSubject }) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [category, setCategory] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFindings(study.id, category, severity)
      .then(setFindings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [study.id, category, severity]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Findings Center</h1>
        <p className="text-sm text-slate-400">
          Clinical signals, data quality exceptions, and protocol deviations detected across monitoring cycles.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs border-b border-slate-800 pb-3">
        {['ALL', 'SAFETY', 'DATA_QUALITY', 'COMPLIANCE', 'SITE'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-bold border transition ${
              category === cat
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}

        <div className="ml-auto flex items-center space-x-2">
          <span className="text-slate-500 text-[11px] font-semibold">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverity(sev)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                severity === sev
                  ? 'bg-slate-700 text-white border-slate-600'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {findings.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm bg-slate-900 rounded-xl border border-slate-800">
            {loading ? 'Scanning trial records...' : 'No findings found matching active filters.'}
          </div>
        ) : (
          findings.map((f) => (
            <div key={f.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{f.finding_code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      f.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                      f.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {f.severity}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {f.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Cut {f.cut_number} ({f.protocol_version})
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">{f.title}</h3>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  {f.evidence && f.evidence.length > 0 && (
                    <button
                      onClick={() => onViewEvidence(f.evidence)}
                      className="flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition font-medium"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Evidence ({f.evidence.length})</span>
                    </button>
                  )}
                  {f.subject_id && f.subject_id !== 'Study-level' && onSelectSubject && (
                    <button
                      onClick={() => onSelectSubject(f.subject_id)}
                      className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg border border-indigo-500/30 font-semibold"
                    >
                      Subject 360
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{f.rationale || f.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
