import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Building2, FileText, User } from 'lucide-react';
import { Study, ProtocolDeviation, SiteFlag } from '../types';
import { getDeviations, getSiteFlags } from '../api';

interface ComplianceScreenProps {
  study: Study;
  onViewEvidence?: (evidence: any[]) => void;
  onSelectSubject?: (usubjid: string) => void;
}

export const ComplianceScreen: React.FC<ComplianceScreenProps> = ({
  study,
  onViewEvidence,
  onSelectSubject
}) => {
  const [deviations, setDeviations] = useState<ProtocolDeviation[]>([]);
  const [siteFlags, setSiteFlags] = useState<SiteFlag[]>([]);

  useEffect(() => {
    getDeviations(study.id).then(setDeviations).catch(() => {});
    getSiteFlags(study.id).then(setSiteFlags).catch(() => {});
  }, [study.id]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Compliance & Protocol Deviations</h1>
        <p className="text-sm text-slate-400">
          Evaluation against active protocol version ({study.current_protocol_version}). Subject deviations and site-level recurring patterns.
        </p>
      </div>

      {/* Site Flags Alert Banner */}
      {siteFlags.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase text-amber-400 tracking-wider flex items-center space-x-1.5">
            <Building2 className="w-4 h-4" />
            <span>Site-Level Non-Adherence Flags ({siteFlags.length})</span>
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {siteFlags.map((sf) => (
              <div key={sf.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-300">Site {sf.site_code} ({sf.site_name})</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                    {sf.recurring_count} Accumulated Deviations
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">{sf.reason}</p>
                <div className="text-[10px] text-slate-500">Action: Site re-training notice & coordinator audit required.</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deviations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-200">Protocol Deviations Registry</span>
          <span className="text-slate-400">{deviations.length} Active Deviations</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Deviation Code</th>
                <th className="p-3">Subject ID</th>
                <th className="p-3">Site</th>
                <th className="p-3">Protocol Version</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Violation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {deviations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No protocol deviations recorded under active protocol version.
                  </td>
                </tr>
              ) : (
                deviations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3 font-mono font-bold text-indigo-300">{d.deviation_code}</td>
                    <td className="p-3 font-mono text-slate-200">
                      {d.subject_id ? (
                        <button
                          onClick={() => onSelectSubject && onSelectSubject(d.subject_id)}
                          className="text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1"
                        >
                          <User className="w-3 h-3" />
                          <span>{d.subject_id}</span>
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 text-slate-300">{d.site_id}</td>
                    <td className="p-3 font-mono text-emerald-400">{d.protocol_version}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.severity === 'MAJOR' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 max-w-md">{d.description}</td>
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
