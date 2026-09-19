import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Search,
  Network,
  MessageSquare,
  AlertTriangle,
  BookOpen,
  Users2,
  FileCheck,
  HelpCircle,
  ShieldCheck,
  UserCheck,
  FileText,
  FileSpreadsheet,
  Activity,
  Clock,
  Layers,
  AlertOctagon,
  Hourglass,
  HelpCircle as ExplainIcon,
  Download,
  ScrollText,
  History,
  SearchCheck,
  Bell,
  User,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { GlobalSearchModal } from "../components/GlobalSearchModal";
import { Breadcrumbs } from "../components/Breadcrumbs";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface MainLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
  breadcrumbs?: Array<{ label: string; onClick?: () => void; active?: boolean }>;
  pendingEscalationsCount?: number;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
  breadcrumbs = [],
  pendingEscalationsCount = 2,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigation: NavSection[] = [
    {
      title: "OVERVIEW",
      items: [
        { id: "dashboard", label: "Study Dashboard", icon: LayoutDashboard, path: "/" },
      ],
    },
    {
      title: "ATLAS",
      items: [
        { id: "subjects", label: "Subjects", icon: Users, path: "/subjects" },
        { id: "disease-explorer", label: "Disease Explorer", icon: Search, path: "/disease-explorer" },
        { id: "knowledge-graph", label: "Knowledge Graph", icon: Network, path: "/graph" },
        { id: "ask-atlas", label: "Ask ATLAS", icon: MessageSquare, path: "/ask-atlas" },
        { id: "findings", label: "Findings", icon: AlertTriangle, path: "/findings", badge: "3", badgeColor: "bg-rose-100 text-rose-800" },
        { id: "protocol-rules", label: "Protocol & Rules", icon: BookOpen, path: "/protocol-rules" },
      ],
    },
    {
      title: "MONITOR",
      items: [
        { id: "review-crew", label: "Review Crew", icon: Users2, path: "/monitor/crew" },
        { id: "medical-review", label: "Medical Review", icon: FileCheck, path: "/monitor/medical-review" },
        { id: "data-queries", label: "Data Queries", icon: HelpCircle, path: "/monitor/queries", badge: "2", badgeColor: "bg-blue-100 text-blue-800" },
        { id: "compliance", label: "Compliance", icon: ShieldCheck, path: "/monitor/compliance" },
        {
          id: "human-gate",
          label: "Human Gate",
          icon: UserCheck,
          path: "/monitor/human-gate",
          badge: pendingEscalationsCount > 0 ? String(pendingEscalationsCount) : undefined,
          badgeColor: "bg-amber-100 text-amber-800",
        },
        { id: "decision-trace", label: "Decision Trace", icon: FileText, path: "/monitor/trace" },
        { id: "cycle-report", label: "Cycle Report", icon: FileSpreadsheet, path: "/monitor/cycle-report" },
      ],
    },
    {
      title: "WATCH",
      items: [
        { id: "watch-dashboard", label: "WATCH Dashboard", icon: Activity, path: "/watch" },
        { id: "cut-timeline", label: "12-Cut Timeline", icon: Clock, path: "/watch/timeline" },
        { id: "cut-details", label: "Cut Details", icon: Layers, path: "/watch/cut-details" },
        { id: "adversarial-events", label: "Adversarial Events", icon: AlertOctagon, path: "/watch/adversarial", badge: "1", badgeColor: "bg-purple-100 text-purple-800" },
        { id: "pending-decisions", label: "Pending Decisions", icon: Hourglass, path: "/watch/pending" },
        { id: "explain-decision", label: "Explain Decision", icon: ExplainIcon, path: "/watch/explain" },
        { id: "surveillance-report", label: "Surveillance Report", icon: Download, path: "/watch/surveillance-report" },
      ],
    },
    {
      title: "GOVERNANCE",
      items: [
        { id: "protocol-amendments", label: "Protocol & Amendments", icon: ScrollText, path: "/governance/protocols" },
        { id: "audit-trail", label: "Audit Trail", icon: History, path: "/governance/audit" },
        { id: "query-history", label: "Query History", icon: SearchCheck, path: "/governance/queries" },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Persistent Left Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none z-30">
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm">
              AMW
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wider">ATLAS MONITOR WATCH</div>
              <div className="text-[10px] text-slate-400 truncate">Explainable Intelligence</div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
          {navigation.map((section) => (
            <div key={section.title}>
              <div className="px-2.5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path));

                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.path)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                            isActive ? "bg-white/20 text-white" : item.badgeColor || "bg-slate-800 text-slate-300"
                          }`}
                        >
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

        {/* Sidebar Footer: Study Status */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
          <div>
            <div className="text-slate-200 font-semibold">ABC-101 (Phase II)</div>
            <div className="text-[10px] text-emerald-400 flex items-center mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
              Cut 8 of 12 Active
            </div>
          </div>
          <button
            onClick={() => onNavigate("/watch")}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
            title="Open WATCH HUD"
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Application Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-20 sticky top-0 shadow-xs">
          {/* Left: Study & Subtitle */}
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-xs font-bold text-slate-900 tracking-tight">ATLAS MONITOR WATCH</span>
              <span className="mx-2 text-slate-300">|</span>
              <span className="text-xs text-slate-600 font-medium">Study: <strong className="text-blue-700 font-semibold">ABC-101</strong></span>
            </div>
            <div className="hidden lg:block text-[11px] text-slate-400 italic">
              "Understand the data. Review the risk. Watch what changes. Explain every decision."
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-md mx-6">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 text-slate-500 rounded-lg text-xs transition-colors border border-slate-200"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search Subject / Disease / Medication / Finding / Record...</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded text-slate-400 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Notifications & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Notification Icon */}
            <button
              onClick={() => onNavigate("/monitor/human-gate")}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Escalations awaiting decision"
            >
              <Bell className="w-4 h-4" />
              {pendingEscalationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs border border-blue-200">
                  SC
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">Dr. Sarah Chen</div>
                  <div className="text-[10px] text-slate-500 leading-tight">Medical Monitor</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-xs z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900">Dr. Sarah Chen</p>
                    <p className="text-slate-500 text-[11px]">sarah.chen@trials-intel.org</p>
                    <p className="text-[10px] text-blue-600 font-medium mt-0.5">Role: Sovereign Medical Reviewer</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate("/monitor/human-gate");
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                  >
                    Human Gate Approvals
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate("/governance/audit");
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                  >
                    21 CFR Part 11 Audit Trail
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate("/login");
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Breadcrumbs */}
        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      {/* Categorized Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
