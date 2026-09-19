import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Calendar, Activity, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { Subject360Data } from '../types';
import { getSubject360 } from '../api';

interface Subject360ScreenProps {
  initialSubjectId?: string;
  onViewEvidence?: (evidence: any[]) => void;
}

export const Subject360Screen: React.FC<Subject360ScreenProps> = ({
  initialSubjectId = '042-S02-004',
  onViewEvidence
}) => {
  const [subjectIdInput, setSubjectIdInput] = useState(initialSubjectId);
  const [currentId, setCurrentId] = useState(initialSubjectId);
  const [data, setData] = useState<Subject360Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialSubjectId) {
      setSubjectIdInput(initialSubjectId);
      setCurrentId(initialSubjectId);
    }
  }, [initialSubjectId]);

  useEffect(() => {
    setLoading(true);
    setError('');
    getSubject360(currentId)
      .then(setData)
      .catch((err) => setError(err.message || 'Subject not found.'))
      .finally(() => setLoading(false));
  }, [currentId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectIdInput.trim()) {
      setCurrentId(subjectIdInput.trim());
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Subject 360 Explorer</h1>
          <p className="text-sm text-slate-400">
            Unified longitudinal clinical timeline, biomarker trends, adverse events, and verifiable record citations.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              value={subjectIdInput}
              onChange={(e) => setSubjectIdInput(e.target.value)}
              placeholder="Enter Subject ID (e.g. 042-S02-004)"
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 w-60 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Inspect 360
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">Loading longitudinal subject data...</div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-rose-400 text-xs">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Demographics Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold font-mono text-indigo-300">{data.usubjid}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {data.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {data.site_name} (Site {data.site}) • Arm: <span className="text-slate-200 font-semibold">{data.arm}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Age / Sex</span>
                  <p className="font-bold text-slate-200">{data.age ?? 'N/A'} yrs • {data.sex}</p>
                </div>
                <div>
                  <span className="text-slate-500">Screening Date</span>
                  <p className="font-bold text-slate-200">{data.screen_date || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">First Dose</span>
                  <p className="font-bold text-slate-200">{data.rfstdtc || 'Not dosed'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Safety Findings</span>
                  <p className="font-bold text-amber-400">{data.findings.length} detected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Biomarkers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Chronological Clinical Timeline</span>
              </h3>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
                {data.timeline.length === 0 ? (
                  <p className="text-xs text-slate-500">No chronological timeline entries recorded.</p>
                ) : (
                  data.timeline.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-xs border-l-2 border-slate-800 pl-3 py-1">
                      <div className="font-mono text-slate-500 text-[10px] shrink-0 w-20">{item.date}</div>
                      <div className="flex-1 space-y-0.5">
                        <div className="font-bold text-slate-200 flex items-center space-x-2">
                          <span>{item.title}</span>
                          {item.record_id && (
                            <span className="text-[10px] font-mono px-1.5 rounded bg-slate-800 text-slate-400">
                              {item.record_id}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-[11px]">{item.details}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Longitudinal Lab Biomarkers */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Longitudinal Lab Trajectories</span>
              </h3>
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                {Object.keys(data.lab_trends).length === 0 ? (
                  <p className="text-xs text-slate-500">No lab biomarkers available for this subject.</p>
                ) : (
                  Object.entries(data.lab_trends).map(([test, points]) => (
                    <div key={test} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 font-mono">{test} Trajectory</span>
                        <span className="text-[10px] text-slate-500">ULN: {points[0]?.uln || 'N/A'} {points[0]?.unit}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {points.map((pt, pIdx) => (
                          <div key={pIdx} className="bg-slate-900 p-2 rounded border border-slate-800/80 space-y-0.5">
                            <div className="text-[10px] text-slate-400 flex justify-between">
                              <span>{pt.visit}</span>
                              <span className="font-mono text-indigo-400">{pt.record_id}</span>
                            </div>
                            <div className={`font-mono font-bold ${pt.is_abnormal ? 'text-rose-400' : 'text-slate-200'}`}>
                              {pt.raw_value} {pt.unit}
                            </div>
                            {pt.ratio && (
                              <div className="text-[10px] text-slate-500">
                                {pt.ratio}x ULN
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Adverse Events & ConMeds */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AEs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-200">Adverse Events</h3>
              <div className="space-y-2 max-h-[260px] overflow-y-auto text-xs">
                {data.adverse_events.length === 0 ? (
                  <p className="text-slate-500">No adverse events recorded.</p>
                ) : (
                  data.adverse_events.map((ae) => (
                    <div key={ae.record_id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-200">{ae.term}</span>
                          <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">{ae.record_id}</span>
                          {ae.is_sae_miscoded && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">
                              SAE MISCODED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Severity: <span className="text-amber-400 font-semibold">{ae.severity}</span> • Serious: {ae.serious} • Hosp: {ae.hospitalized}
                        </div>
                        <div className="text-[10px] text-slate-500">Started: {ae.start_date}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ConMeds */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-200">Concomitant Medications</h3>
              <div className="space-y-2 max-h-[260px] overflow-y-auto text-xs">
                {data.conmeds.length === 0 ? (
                  <p className="text-slate-500">No concomitant medications prescribed.</p>
                ) : (
                  data.conmeds.map((cm) => (
                    <div key={cm.record_id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-200">{cm.treatment}</span>
                          <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">{cm.record_id}</span>
                          {cm.is_hepatotoxic && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                              HEPATOTOXIC
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">Indication: {cm.indication}</div>
                        <div className="text-[10px] text-slate-500">Started: {cm.start_date}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
