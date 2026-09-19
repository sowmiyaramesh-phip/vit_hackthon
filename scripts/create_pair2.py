from pathlib import Path

sc_dir = Path("frontend/src/screens")

(sc_dir / "StudySetupScreen.tsx").write_text("""import React, { useState, useEffect } from 'react';
import { Settings, FileText, Plus, MapPin } from 'lucide-react';
import { Study } from '../types';
import { getProtocols, getDataCuts } from '../api';

interface StudySetupScreenProps {
  study: Study;
}

export const StudySetupScreen: React.FC<StudySetupScreenProps> = ({ study }) => {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [dataCuts, setDataCuts] = useState<any[]>([]);

  useEffect(() => {
    getProtocols(study.id).then(setProtocols).catch(() => {});
    getDataCuts(study.id).then(setDataCuts).catch(() => {});
  }, [study.id]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Study Setup & Protocol Configuration</h1>
        <p className="text-sm text-slate-400">Configure study parameters, active protocol amendments, and investigational sites.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Metadata */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>Trial Metadata</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Protocol Code</span>
              <span className="font-mono font-bold text-slate-200">{study.study_id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Trial Name</span>
              <span className="text-slate-200 text-right max-w-xs">{study.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Sponsor</span>
              <span className="text-slate-200">{study.sponsor}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Therapeutic Area</span>
              <span className="text-slate-200">{study.therapeutic_area}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Current Protocol Version</span>
              <span className="font-mono font-bold text-emerald-400">{study.current_protocol_version}</span>
            </div>
          </div>
        </div>

        {/* Protocol Versions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Configured Protocol Versions</span>
          </h3>
          <div className="space-y-3">
            {protocols.map((p) => (
              <div key={p.id} className="space-y-2">
                {p.versions.map((v: any) => (
                  <div key={v.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 font-mono">{v.version_str}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.version_str === study.current_protocol_version ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                        {v.version_str === study.current_protocol_version ? 'ACTIVE IN STUDY' : 'AMENDMENT'}
                      </span>
                    </div>
                    <p className="text-slate-400">{v.amendment_summary}</p>
                    <div className="text-[10px] text-slate-500">Effective: {v.effective_date}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
""", encoding="utf-8")

(sc_dir / "DashboardScreen.tsx").write_text("""import React, { useState, useEffect } from 'react';
import {
  Users, MapPin, AlertTriangle, HelpCircle, ShieldAlert,
  Play
} from 'lucide-react';
import { Study, Finding, DataQuery, Escalation } from '../types';
import { getFindings, getQueries, getEscalations, getDeviations } from '../api';

interface DashboardScreenProps {
  study: Study;
  onNavigate: (screenId: any) => void;
  onRunCycle: () => void;
  isRunningCycle: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  study,
  onNavigate,
  onRunCycle,
  isRunningCycle
}) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [queries, setQueries] = useState<DataQuery[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [devCount, setDevCount] = useState(0);

  useEffect(() => {
    getFindings(study.id).then(setFindings).catch(() => {});
    getQueries(study.id).then(setQueries).catch(() => {});
    getEscalations(study.id).then(setEscalations).catch(() => {});
    getDeviations(study.id).then(d => setDevCount(d.length)).catch(() => {});
  }, [study.id]);

  const safetyFindings = findings.filter(f => f.category === 'SAFETY');
  const dataFindings = findings.filter(f => f.category === 'DATA_QUALITY');
  const complianceFindings = findings.filter(f => f.category === 'COMPLIANCE');
  const siteFindings = findings.filter(f => f.category === 'SITE');

  const pendingEscalations = escalations.filter(e => e.status === 'PENDING');
  const openQueries = queries.filter(q => q.status === 'OPEN');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
              {study.study_id}
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              ATLAS — Clinical Trial Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Connect fragmented clinical-trial data, detect meaningful findings, and trace every answer back to its evidence.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right text-xs">
            <div className="text-slate-400">Data Cut: <span className="font-bold text-emerald-400 font-mono">Cut {study.current_cut}</span></div>
            <div className="text-slate-400">Protocol: <span className="font-bold text-sky-400 font-mono">{study.current_protocol_version}</span></div>
          </div>
          <button
            onClick={onRunCycle}
            disabled={isRunningCycle}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isRunningCycle ? 'animate-spin' : ''}`} />
            <span>{isRunningCycle ? 'Monitoring in Progress...' : 'Run Monitoring Cycle'}</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div onClick={() => onNavigate('SUBJECTS')} className="bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-indigo-500/50 transition shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Subjects</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{study.subjects_count}</div>
          <div className="text-[10px] text-slate-400 mt-1">Enrolled trial cohort</div>
        </div>

        <div onClick={() => onNavigate('STUDY_SETUP')} className="bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-indigo-500/50 transition shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Sites</span>
            <MapPin className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">{study.sites_count}</div>
          <div className="text-[10px] text-slate-400 mt-1">Active research centers</div>
        </div>

        <div onClick={() => onNavigate('FINDINGS')} className="bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-amber-500/50 transition shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Findings</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{findings.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Safety & quality signals</div>
        </div>

        <div onClick={() => onNavigate('QUERIES')} className="bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-indigo-500/50 transition shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Open Queries</span>
            <HelpCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{openQueries.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Awaiting site resolution</div>
        </div>

        <div onClick={() => onNavigate('COMPLIANCE')} className="bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-purple-500/50 transition shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Deviations</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{devCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Protocol window flags</div>
        </div>

        <div onClick={() => onNavigate('HUMAN_GATE')} className="bg-slate-900 border border-slate-800 p-4 rounded-xl cursor-pointer hover:border-rose-500/50 transition shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Escalations</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{pendingEscalations.length}</div>
          <div className="text-[10px] text-rose-400/80 mt-1">Pending Human Gate</div>
        </div>
      </div>

      {/* Breakdown by Finding Categories */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div onClick={() => onNavigate('FINDINGS')} className="bg-slate-900 border border-slate-800 p-5 rounded-xl cursor-pointer hover:bg-slate-900/80 transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Safety Findings</span>
            <span className="text-lg font-bold text-white">{safetyFindings.length}</span>
          </div>
          <p className="text-xs text-slate-400">SAE miscoding, Hy's Law liver candidates, severe treatment toxicity.</p>
        </div>

        <div onClick={() => onNavigate('FINDINGS')} className="bg-slate-900 border border-slate-800 p-5 rounded-xl cursor-pointer hover:bg-slate-900/80 transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Data Quality</span>
            <span className="text-lg font-bold text-white">{dataFindings.length}</span>
          </div>
          <p className="text-xs text-slate-400">Pre-dose adverse events, non-numeric lab formats, censored limits.</p>
        </div>

        <div onClick={() => onNavigate('COMPLIANCE')} className="bg-slate-900 border border-slate-800 p-5 rounded-xl cursor-pointer hover:bg-slate-900/80 transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Compliance</span>
            <span className="text-lg font-bold text-white">{complianceFindings.length + devCount}</span>
          </div>
          <p className="text-xs text-slate-400">Visit window violations, dose adjustments under active protocol.</p>
        </div>

        <div onClick={() => onNavigate('SITE_OPERATIONS')} className="bg-slate-900 border border-slate-800 p-5 rounded-xl cursor-pointer hover:bg-slate-900/80 transition space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Site Monitoring</span>
            <span className="text-lg font-bold text-white">{siteFindings.length}</span>
          </div>
          <p className="text-xs text-slate-400">Site-level recurrence, systemic non-adherence across subjects.</p>
        </div>
      </div>
    </div>
  );
};
""", encoding="utf-8")

print("Pair 2 written successfully")
