import React, { useState, useEffect } from "react";
import { MainLayout } from "./layouts/MainLayout";
import { Login } from "./pages/Login";
import { StudyDashboard } from "./pages/StudyDashboard";
import { Subjects } from "./pages/Subjects";
import { AddSubjectWizard } from "./pages/AddSubjectWizard";
import { Subject360 } from "./pages/Subject360";
import { DiseaseExplorer } from "./pages/DiseaseExplorer";
import { DiseaseDetail } from "./pages/DiseaseDetail";
import { KnowledgeGraphView } from "./pages/KnowledgeGraphView";
import { AskAtlas } from "./pages/AskAtlas";
import { Findings } from "./pages/Findings";
import { FindingDetail } from "./pages/FindingDetail";
import { ReviewCrewView } from "./pages/ReviewCrewView";
import { MedicalReviewView } from "./pages/MedicalReviewView";
import { DataQueriesView } from "./pages/DataQueriesView";
import { ComplianceView } from "./pages/ComplianceView";
import { HumanGateView } from "./pages/HumanGateView";
import { DecisionTraceView } from "./pages/DecisionTraceView";
import { CycleReportView } from "./pages/CycleReportView";
import { WatchDashboard } from "./pages/WatchDashboard";
import { CutTimelineView } from "./pages/CutTimelineView";
import { CutDetailsView } from "./pages/CutDetailsView";
import { AdversarialEventsView } from "./pages/AdversarialEventsView";
import { PendingDecisionsView } from "./pages/PendingDecisionsView";
import { ExplainDecisionView } from "./pages/ExplainDecisionView";
import { SurveillanceReportView } from "./pages/SurveillanceReportView";
import { ProtocolAmendmentsView } from "./pages/ProtocolAmendmentsView";
import { AuditTrailView } from "./pages/AuditTrailView";
import { QueryHistoryView } from "./pages/QueryHistoryView";
import { api } from "./services/api";

export const App: React.FC = () => {
  const getInitialPath = () => {
    const hash = window.location.hash.replace(/^#/, "");
    return hash || "/";
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [pendingEscalationsCount, setPendingEscalationsCount] = useState<number>(2);

  // Sync with browser hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, "");
      setCurrentPath(hash || "/");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Poll or fetch pending escalations count
  useEffect(() => {
    const fetchEscalations = async () => {
      try {
        const escalations = await api.getEscalations("PENDING");
        setPendingEscalationsCount(escalations.length);
      } catch (e) {
        // keep current count
      }
    };
    fetchEscalations();
  }, [currentPath]);

  const navigateTo = (path: string) => {
    if (path === "/login") {
      setIsAuthenticated(false);
    }
    window.location.hash = path;
    setCurrentPath(path);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    navigateTo("/");
  };

  // If user signed out, show Login page
  if (!isAuthenticated || currentPath === "/login") {
    return <Login onLogin={handleLogin} />;
  }

  // Generate dynamic breadcrumbs
  const getBreadcrumbs = () => {
    const crumbs: Array<{ label: string; onClick?: () => void; active?: boolean }> = [
      { label: "Study ABC-101", onClick: () => navigateTo("/") },
    ];

    if (currentPath === "/") {
      crumbs[0].active = true;
      return crumbs;
    }

    if (currentPath === "/subjects") {
      crumbs.push({ label: "Subjects", active: true });
    } else if (currentPath === "/subjects/new" || currentPath === "/subjects/add") {
      crumbs.push({ label: "Subjects", onClick: () => navigateTo("/subjects") });
      crumbs.push({ label: "Add Subject Wizard", active: true });
    } else if (currentPath.startsWith("/subjects/")) {
      const subjId = currentPath.split("/")[2];
      if (subjId === "add" || subjId === "new") {
        crumbs.push({ label: "Subjects", onClick: () => navigateTo("/subjects") });
        crumbs.push({ label: "Add Subject Wizard", active: true });
      } else {
        crumbs.push({ label: "Subjects", onClick: () => navigateTo("/subjects") });
        crumbs.push({ label: decodeURIComponent(subjId), active: true });
      }
    } else if (currentPath === "/disease-explorer") {
      crumbs.push({ label: "Disease Explorer", active: true });
    } else if (currentPath.startsWith("/disease/")) {
      const diseaseName = currentPath.split("/")[2];
      crumbs.push({ label: "Disease Explorer", onClick: () => navigateTo("/disease-explorer") });
      crumbs.push({ label: decodeURIComponent(diseaseName), active: true });
    } else if (currentPath === "/graph") {
      crumbs.push({ label: "Knowledge Graph", active: true });
    } else if (currentPath === "/ask-atlas") {
      crumbs.push({ label: "Ask ATLAS", active: true });
    } else if (currentPath === "/findings") {
      crumbs.push({ label: "Findings", active: true });
    } else if (currentPath.startsWith("/findings/")) {
      const findingId = currentPath.split("/")[2];
      crumbs.push({ label: "Findings", onClick: () => navigateTo("/findings") });
      crumbs.push({ label: decodeURIComponent(findingId), active: true });
    } else if (currentPath === "/protocol-rules") {
      crumbs.push({ label: "Protocol & Rules", active: true });
    } else if (currentPath.startsWith("/monitor/")) {
      crumbs.push({ label: "MONITOR", onClick: () => navigateTo("/monitor/crew") });
      const sub = currentPath.replace("/monitor/", "");
      const labels: Record<string, string> = {
        crew: "Review Crew",
        "medical-review": "Medical Review",
        queries: "Data Queries",
        compliance: "Protocol Compliance",
        "human-gate": "Human Gate",
        trace: "Decision Trace",
        "cycle-report": "Cycle Report",
      };
      crumbs.push({ label: labels[sub] || sub, active: true });
    } else if (currentPath.startsWith("/watch")) {
      crumbs.push({ label: "WATCH", onClick: () => navigateTo("/watch") });
      if (currentPath !== "/watch") {
        const sub = currentPath.replace("/watch/", "");
        const labels: Record<string, string> = {
          timeline: "12-Cut Timeline",
          "cut-details": "Cut Details",
          adversarial: "Adversarial Events",
          pending: "Pending Decisions",
          explain: "Explain Decision",
          "surveillance-report": "Surveillance Report",
        };
        crumbs.push({ label: labels[sub] || sub, active: true });
      }
    } else if (currentPath.startsWith("/governance/")) {
      crumbs.push({ label: "Governance" });
      const sub = currentPath.replace("/governance/", "");
      const labels: Record<string, string> = {
        protocols: "Protocol Amendments",
        audit: "21 CFR Part 11 Audit Trail",
        queries: "Query History",
      };
      crumbs.push({ label: labels[sub] || sub, active: true });
    }

    return crumbs;
  };

  // Render view corresponding to currentPath
  const renderContent = () => {
    // 1. Root & Study Dashboard
    if (currentPath === "/" || currentPath === "") {
      return <StudyDashboard onNavigate={navigateTo} />;
    }

    // 2. ATLAS: Subjects
    if (currentPath === "/subjects") {
      return <Subjects onNavigate={navigateTo} />;
    }
    if (currentPath === "/subjects/new" || currentPath === "/subjects/add") {
      return <AddSubjectWizard onNavigate={navigateTo} />;
    }
    if (currentPath.startsWith("/subjects/")) {
      const subjectId = decodeURIComponent(currentPath.split("/")[2]);
      if (subjectId === "add" || subjectId === "new") {
        return <AddSubjectWizard onNavigate={navigateTo} />;
      }
      return <Subject360 subjectId={subjectId} onNavigate={navigateTo} />;
    }

    // 3. ATLAS: Disease Explorer & Details
    if (currentPath === "/disease-explorer") {
      return <DiseaseExplorer onNavigate={navigateTo} />;
    }
    if (currentPath.startsWith("/disease/")) {
      const diseaseName = decodeURIComponent(currentPath.split("/")[2]);
      return <DiseaseDetail diseaseName={diseaseName} onNavigate={navigateTo} />;
    }

    // 4. ATLAS: Graph, Q&A, Findings
    if (currentPath === "/graph") {
      return <KnowledgeGraphView onNavigate={navigateTo} />;
    }
    if (currentPath === "/ask-atlas") {
      return <AskAtlas onNavigate={navigateTo} />;
    }
    if (currentPath === "/findings") {
      return <Findings onNavigate={navigateTo} />;
    }
    if (currentPath.startsWith("/findings/")) {
      const findingId = decodeURIComponent(currentPath.split("/")[2]);
      return <FindingDetail findingId={findingId} onNavigate={navigateTo} />;
    }
    if (currentPath === "/protocol-rules") {
      return <ProtocolAmendmentsView onNavigate={navigateTo} />;
    }

    // 5. MONITOR Stage
    if (currentPath === "/monitor/crew") {
      return <ReviewCrewView onNavigate={navigateTo} />;
    }
    if (currentPath === "/monitor/medical-review") {
      return <MedicalReviewView onNavigate={navigateTo} />;
    }
    if (currentPath === "/monitor/queries") {
      return <DataQueriesView onNavigate={navigateTo} />;
    }
    if (currentPath === "/monitor/compliance") {
      return <ComplianceView onNavigate={navigateTo} />;
    }
    if (currentPath === "/monitor/human-gate") {
      return <HumanGateView onNavigate={navigateTo} />;
    }
    if (currentPath === "/monitor/trace") {
      return <DecisionTraceView onNavigate={navigateTo} />;
    }
    if (currentPath === "/monitor/cycle-report") {
      return <CycleReportView onNavigate={navigateTo} />;
    }

    // 6. WATCH Stage
    if (currentPath === "/watch") {
      return <WatchDashboard onNavigate={navigateTo} />;
    }
    if (currentPath === "/watch/timeline") {
      return <CutTimelineView onNavigate={navigateTo} />;
    }
    if (currentPath.startsWith("/watch/cut-details")) {
      const parts = currentPath.split("/");
      const cutNum = parts[3] ? parseInt(parts[3], 10) : 5;
      return <CutDetailsView initialCut={cutNum || 5} onNavigate={navigateTo} />;
    }
    if (currentPath === "/watch/adversarial") {
      return <AdversarialEventsView onNavigate={navigateTo} />;
    }
    if (currentPath === "/watch/pending") {
      return <PendingDecisionsView onNavigate={navigateTo} />;
    }
    if (currentPath.startsWith("/watch/explain")) {
      const parts = currentPath.split("/");
      const decisionId = parts[3] ? decodeURIComponent(parts[3]) : "D-012";
      return <ExplainDecisionView initialDecisionId={decisionId} onNavigate={navigateTo} />;
    }
    if (currentPath === "/watch/surveillance-report") {
      return <SurveillanceReportView onNavigate={navigateTo} />;
    }

    // 7. GOVERNANCE Stage
    if (currentPath === "/governance/protocols") {
      return <ProtocolAmendmentsView onNavigate={navigateTo} />;
    }
    if (currentPath === "/governance/audit") {
      return <AuditTrailView onNavigate={navigateTo} />;
    }
    if (currentPath === "/governance/queries") {
      return <QueryHistoryView onNavigate={navigateTo} />;
    }

    // Default 404 fallback
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900">Page Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested URL `{currentPath}` does not exist.</p>
        <button
          onClick={() => navigateTo("/")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
        >
          Return to Study Dashboard
        </button>
      </div>
    );
  };

  return (
    <MainLayout
      currentPath={currentPath}
      onNavigate={navigateTo}
      breadcrumbs={getBreadcrumbs()}
      pendingEscalationsCount={pendingEscalationsCount}
    >
      {renderContent()}
    </MainLayout>
  );
};
