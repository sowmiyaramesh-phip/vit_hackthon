import React, { useState, useEffect } from 'react';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import { getStudies, createStudy } from '../api';
import { Study } from '../types';

interface StudySelectScreenProps {
  onSelectStudy: (study: Study) => void;
}

export const StudySelectScreen: React.FC<StudySelectScreenProps> = ({ onSelectStudy }) => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [name, setName] = useState('');
  const [studyId, setStudyId] = useState('');
  const [sponsor, setSponsor] = useState('');

  useEffect(() => {
    getStudies().then(setStudies).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !studyId) return;
    await createStudy({ name, study_id: studyId, sponsor });
    const updated = await getStudies();
    setStudies(updated);
    setShowNewModal(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Clinical Studies Registry</h1>
          <p className="text-sm text-slate-400">Select an active trial workspace or register a new protocol study.</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Study</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {studies.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelectStudy(s)}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-xl cursor-pointer transition shadow-lg space-y-4 hover:bg-slate-900/80 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {s.study_id}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-2 group-hover:text-indigo-300 transition">
                  {s.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{s.sponsor} • {s.therapeutic_area}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition" />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500">Subjects</span>
                <p className="font-bold text-slate-200">{s.subjects_count}</p>
              </div>
              <div>
                <span className="text-slate-500">Sites</span>
                <p className="font-bold text-slate-200">{s.sites_count}</p>
              </div>
              <div>
                <span className="text-slate-500">Cut & Version</span>
                <p className="font-bold text-slate-200">Cut {s.current_cut} ({s.current_protocol_version})</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Create New Clinical Study</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Study Protocol ID</label>
                <input
                  type="text"
                  placeholder="e.g. ATLAS-002"
                  value={studyId}
                  onChange={(e) => setStudyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Study Official Title</label>
                <input
                  type="text"
                  placeholder="e.g. Phase III Trial in NSCLC"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Sponsor Organization</label>
                <input
                  type="text"
                  placeholder="e.g. BioPharma Research Inc."
                  value={sponsor}
                  onChange={(e) => setSponsor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Create Study
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
