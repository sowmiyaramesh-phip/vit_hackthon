import React, { useState } from 'react';
import { Shield, Play, RotateCcw, LogOut, Activity, ChevronDown, UserCheck, Stethoscope, Database, Scale, Building2, Download } from 'lucide-react';
import { User, Study } from '../types';

interface NavbarProps {
  user: User | null;
  study: Study | null;
  onRunCycle: () => void;
  onReseed: () => void;
  onLogout: () => void;
  isRunningCycle: boolean;
  onSwitchUser?: (email: string, pass: string) => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  study,
  onRunCycle,
  onReseed,
  onLogout,
  isRunningCycle,
  onSwitchUser
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const demoRoles = [
    { email: 'admin@atlas.clinical', pwd: 'AdminPass123!', role: 'Study Administrator', name: 'Dr. Sarah Jenkins', icon: Shield },
    { email: 'medical.monitor@atlas.clinical', pwd: 'MedicalPass123!', role: 'Medical Monitor', name: 'Dr. Elena Rostova', icon: Stethoscope },
    { email: 'data.manager@atlas.clinical', pwd: 'DataPass123!', role: 'Data Manager', name: 'Marcus Chen', icon: Database },
    { email: 'clinical.reviewer@atlas.clinical', pwd: 'ClinicalPass123!', role: 'Clinical Reviewer', name: 'Dr. Raj Patel', icon: UserCheck },
    { email: 'compliance.reviewer@atlas.clinical', pwd: 'CompliancePass123!', role: 'Compliance Reviewer', name: 'Amina Al-Mansoor', icon: Scale },
    { email: 'site.coordinator@atlas.clinical', pwd: 'SitePass123!', role: 'Site Coordinator', name: 'David Miller', icon: Building2 }
  ];

  const handleSelectRole = async (email: string, pwd: string) => {
    setRoleMenuOpen(false);
    if (!onSwitchUser) return;
    setSwitching(true);
    try {
      await onSwitchUser(email, pwd);
    } catch (e) {
      console.error('Failed to switch role', e);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 py-2 flex items-center justify-between shadow-md">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-500/20 flex-shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-lg text-slate-100 tracking-tight">ATLAS</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">+</span>
            <span className="font-bold text-lg text-indigo-400 tracking-tight">MONITOR</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
            Clinical Trial Intelligence, Evidence & Monitoring Platform
          </p>
        </div>
      </div>

      {/* Study & Cut Meta Badges */}
      {study && (
        <div className="hidden lg:flex items-center space-x-2 bg-slate-950/60 border border-slate-800 rounded-full px-3 py-1">
          <span className="text-xs font-semibold text-slate-300">{study.study_id}</span>
          <span className="text-slate-600">•</span>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
            Cut {study.current_cut}
          </span>
          <span className="text-xs bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
            {study.current_protocol_version}
          </span>
        </div>
      )}

      {/* Actions & User */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onRunCycle}
          disabled={isRunningCycle}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition"
        >
          <Play className={`w-3.5 h-3.5 ${isRunningCycle ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRunningCycle ? 'Running Cycle...' : 'Run Monitoring Cycle'}</span>
          <span className="sm:hidden">Run Cycle</span>
        </button>

        <button
          onClick={onReseed}
          title="Reset and reseed study data"
          className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Data</span>
        </button>

        <a
          href="/api/download/source-code"
          download="atlas-monitor-complete-source-code.zip"
          title="Download complete source code bundle (.zip)"
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-500/50 shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download Code (.zip)</span>
          <span className="sm:hidden">ZIP</span>
        </a>

        {user && (
          <div className="relative border-l border-slate-800 pl-3">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-800 transition text-left"
            >
              <div className="hidden md:block text-right">
                <div className="text-xs font-semibold text-slate-200">{user.full_name}</div>
                <div className="text-[10px] text-indigo-400 font-medium">{user.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Quick Switch Role Dropdown */}
            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Clinical Role
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {demoRoles.map((r, idx) => {
                    const Icon = r.icon;
                    const isCurrent = user.email === r.email;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectRole(r.email, r.pwd)}
                        className={`w-full px-3 py-2 text-left flex items-start space-x-2.5 hover:bg-slate-800/80 transition text-xs ${
                          isCurrent ? 'bg-indigo-950/40 text-indigo-300' : 'text-slate-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isCurrent ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div className="overflow-hidden">
                          <div className="font-semibold truncate">{r.role}</div>
                          <div className="text-[10px] text-slate-400 truncate">{r.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-slate-800/80 pt-1 mt-1">
                  <button
                    onClick={() => { setRoleMenuOpen(false); onLogout(); }}
                    className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
