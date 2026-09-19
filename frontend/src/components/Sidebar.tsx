import React from 'react';
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
