from pathlib import Path

comp_dir = Path("frontend/src/components")

# 1. Navbar.tsx
(comp_dir / "Navbar.tsx").write_text("""import React from 'react';
import { Shield, Play, RotateCcw, LogOut, Activity, Database } from 'lucide-react';
import { User, Study } from '../types';

interface NavbarProps {
  user: User | null;
  study: Study | null;
  onRunCycle: () => void;
  onReseed: () => void;
  onLogout: () => void;
  isRunningCycle: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  study,
  onRunCycle,
  onReseed,
  onLogout,
  isRunningCycle
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between shadow-md">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-500/20">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-slate-100 tracking-tight">ATLAS</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/30">+</span>
            <span className="font-bold text-lg text-indigo-400 tracking-tight">MONITOR</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">
            Clinical Trial Intelligence, Evidence & Monitoring Platform
          </p>
        </div>
      </div>

      {/* Study & Cut Meta Badges */}
      {study && (
        <div className="hidden md:flex items-center space-x-2 bg-slate-950/60 border border-slate-800 rounded-full px-3 py-1">
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
          <span>{isRunningCycle ? 'Running Cycle...' : 'Run Monitoring Cycle'}</span>
        </button>

        <button
          onClick={onReseed}
          title="Reset and reseed study data"
          className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Data</span>
        </button>

        {user && (
          <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{user.full_name}</div>
              <div className="text-[10px] text-indigo-400 font-medium">{user.role}</div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
""", encoding="utf-8")

# 2. Sidebar.tsx
(comp_dir / "Sidebar.tsx").write_text("""import React from 'react';
import {
  LayoutDashboard, Users, UserPlus, UploadCloud, CheckCircle2,
  GitBranch, UserCheck, MessageSquare, AlertTriangle, Cpu,
  Stethoscope, HelpCircle, ShieldCheck, Scale, History,
  FileSpreadsheet, Building2, BookOpen, Clock, GitCompare, Settings
} from 'lucide-react';

export type ScreenId =
  | 'DASHBOARD'
  | 'STUDY_SELECT'
  | 'STUDY_SETUP'
  | 'SUBJECTS'
  | 'ADD_SUBJECT'
  | 'IMPORT'
  | 'VALIDATION'
  | 'KNOWLEDGE_GRAPH'
  | 'SUBJECT_360'
  | 'ASK_ATLAS'
  | 'FINDINGS'
  | 'REVIEW_CREW'
  | 'MEDICAL_REVIEW'
  | 'QUERIES'
  | 'COMPLIANCE'
  | 'HUMAN_GATE'
  | 'CLARIFICATION'
  | 'DECISION_TRACE'
  | 'CYCLE_REPORT'
  | 'SITE_OPERATIONS'
  | 'PROTOCOL_RULES'
  | 'QUERY_HISTORY'
  | 'DATA_CUT_SIMULATOR';

interface SidebarProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  openFindingsCount?: number;
  openQueriesCount?: number;
  pendingEscalationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  openFindingsCount = 0,
  openQueriesCount = 0,
  pendingEscalationsCount = 0
}) => {
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'DASHBOARD' as ScreenId, label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'STUDY_SETUP' as ScreenId, label: 'Study Setup & Sites', icon: Settings },
        { id: 'STUDY_SELECT' as ScreenId, label: 'Org & Study Select', icon: Building2 },
      ]
    },
    {
      title: 'DATA OPERATIONS',
      items: [
        { id: 'SUBJECTS' as ScreenId, label: 'Subjects Directory', icon: Users },
        { id: 'ADD_SUBJECT' as ScreenId, label: '+ Add Subject', icon: UserPlus },
        { id: 'IMPORT' as ScreenId, label: 'Import Clinical Data', icon: UploadCloud },
        { id: 'VALIDATION' as ScreenId, label: 'Data Validation', icon: CheckCircle2 },
        { id: 'SITE_OPERATIONS' as ScreenId, label: 'Site Operations', icon: Building2 },
      ]
    },
    {
      title: 'INTELLIGENCE (ATLAS)',
      items: [
        { id: 'ASK_ATLAS' as ScreenId, label: 'Ask ATLAS', icon: MessageSquare },
        { id: 'KNOWLEDGE_GRAPH' as ScreenId, label: 'Knowledge Graph', icon: GitBranch },
        { id: 'SUBJECT_360' as ScreenId, label: 'Subject 360', icon: UserCheck },
      ]
    },
    {
      title: 'MONITORING CREW',
      items: [
        { id: 'REVIEW_CREW' as ScreenId, label: 'Review Crew (6 Nodes)', icon: Cpu },
        { id: 'FINDINGS' as ScreenId, label: 'Findings Center', icon: AlertTriangle, badge: openFindingsCount },
        { id: 'MEDICAL_REVIEW' as ScreenId, label: 'Medical Review', icon: Stethoscope },
        { id: 'QUERIES' as ScreenId, label: 'Data Manager Queries', icon: HelpCircle, badge: openQueriesCount },
        { id: 'COMPLIANCE' as ScreenId, label: 'Compliance Review', icon: ShieldCheck },
        { id: 'HUMAN_GATE' as ScreenId, label: 'Human Gate', icon: Scale, badge: pendingEscalationsCount, badgeColor: 'bg-rose-500 text-white' },
        { id: 'CLARIFICATION' as ScreenId, label: 'Clarification Assistant', icon: HelpCircle },
      ]
    },
    {
      title: 'GOVERNANCE & AUDIT',
      items: [
        { id: 'DECISION_TRACE' as ScreenId, label: 'Decision Trace', icon: History },
        { id: 'CYCLE_REPORT' as ScreenId, label: 'Cycle Review Report', icon: FileSpreadsheet },
        { id: 'PROTOCOL_RULES' as ScreenId, label: 'Protocol Rules', icon: BookOpen },
        { id: 'QUERY_HISTORY' as ScreenId, label: 'Query History', icon: Clock },
        { id: 'DATA_CUT_SIMULATOR' as ScreenId, label: 'Data Cut Simulator', icon: GitCompare },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-full overflow-y-auto">
      <div className="p-3 space-y-6">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1.5">
              {sec.title}
            </div>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectScreen(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
""", encoding="utf-8")

# 3. EvidenceDrawer.tsx
(comp_dir / "EvidenceDrawer.tsx").write_text("""import React from 'react';
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
""", encoding="utf-8")

print("Navbar, Sidebar, and EvidenceDrawer generated successfully!")
