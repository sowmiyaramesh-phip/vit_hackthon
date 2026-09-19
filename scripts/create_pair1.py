from pathlib import Path

sc_dir = Path("frontend/src/screens")

(sc_dir / "LoginScreen.tsx").write_text("""import React, { useState, useEffect } from 'react';
import { Activity, Lock, Mail, ArrowRight, Shield } from 'lucide-react';
import { getDemoUsers } from '../api';
import { DemoUser } from '../types';

interface LoginScreenProps {
  onLogin: (email: string, pass: string) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@atlas.clinical');
  const [password, setPassword] = useState('AdminPass123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);

  useEffect(() => {
    getDemoUsers().then(setDemoUsers).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoUser = (u: DemoUser) => {
    setEmail(u.email);
    setPassword(u.suggested_password);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/20 text-white mb-4">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          ATLAS + MONITOR
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          Clinical Trial Intelligence, Evidence, Review and Monitoring Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-800">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Clinical Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="name@atlas.clinical"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Study Portal'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>One-Click Demo Roles</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectDemoUser(u)}
                  className="text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 transition text-xs"
                >
                  <div className="font-semibold text-slate-200 truncate">{u.role}</div>
                  <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
""", encoding="utf-8")

(sc_dir / "StudySelectScreen.tsx").write_text("""import React, { useState, useEffect } from 'react';
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
""", encoding="utf-8")

print("Pair 1 written successfully")
