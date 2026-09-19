import React, { useState, useEffect } from 'react';
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
