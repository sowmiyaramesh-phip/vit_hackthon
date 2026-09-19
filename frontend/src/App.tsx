import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ScreenId } from './components/Sidebar';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { User, Study, EvidenceItem } from './types';
import {
  getCurrentUser, login, getStudies, getStudy,
  runMonitoringCycle, reseedDatabase
} from './api';

// Screen imports (24 screens)
import { LoginScreen } from './screens/LoginScreen';
import { StudySelectScreen } from './screens/StudySelectScreen';
import { StudySetupScreen } from './screens/StudySetupScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SubjectsScreen } from './screens/SubjectsScreen';
import { AddSubjectScreen } from './screens/AddSubjectScreen';
import { ImportScreen } from './screens/ImportScreen';
import { ValidationScreen } from './screens/ValidationScreen';
import { KnowledgeGraphScreen } from './screens/KnowledgeGraphScreen';
import { Subject360Screen } from './screens/Subject360Screen';
import { AskAtlasScreen } from './screens/AskAtlasScreen';
import { FindingsScreen } from './screens/FindingsScreen';
import { ReviewCrewScreen } from './screens/ReviewCrewScreen';
import { MedicalReviewScreen } from './screens/MedicalReviewScreen';
import { QueriesScreen } from './screens/QueriesScreen';
import { ComplianceScreen } from './screens/ComplianceScreen';
import { HumanGateScreen } from './screens/HumanGateScreen';
import { ClarificationScreen } from './screens/ClarificationScreen';
import { DecisionTraceScreen } from './screens/DecisionTraceScreen';
import { CycleReportScreen } from './screens/CycleReportScreen';
import { SiteOperationsScreen } from './screens/SiteOperationsScreen';
import { ProtocolRulesScreen } from './screens/ProtocolRulesScreen';
import { QueryHistoryScreen } from './screens/QueryHistoryScreen';
import { DataCutSimulatorScreen } from './screens/DataCutSimulatorScreen';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [studies, setStudies] = useState<Study[]>([]);
  const [currentStudy, setCurrentStudy] = useState<Study | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('DASHBOARD');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('042-S02-004');
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [cycleNotification, setCycleNotification] = useState<string | null>(null);

  // Evidence Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerEvidence, setDrawerEvidence] = useState<EvidenceItem[]>([]);
  const [drawerTitle, setDrawerTitle] = useState('Verified Clinical Evidence Chain');

  // Load initial user & studies
  useEffect(() => {
    const token = localStorage.getItem('atlas_token');
    if (token) {
      getCurrentUser()
        .then((u) => {
          setUser(u);
          return getStudies();
        })
        .then((studyList) => {
          setStudies(studyList);
          if (studyList && studyList.length > 0) {
            setCurrentStudy(studyList[0]);
          }
        })
        .catch(() => {
          localStorage.removeItem('atlas_token');
          setUser(null);
        });
    }
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    const res = await login(email, pass);
    setUser(res.user);
    const studyList = await getStudies();
    setStudies(studyList);
    if (studyList && studyList.length > 0) {
      setCurrentStudy(studyList[0]);
    }
    setCurrentScreen('DASHBOARD');
  };

  const handleLogout = () => {
    localStorage.removeItem('atlas_token');
    setUser(null);
    setCurrentStudy(null);
    setCurrentScreen('DASHBOARD');
  };

  const refreshActiveStudy = async () => {
    if (!currentStudy) return;
    try {
      const refreshed = await getStudy(currentStudy.id);
      setCurrentStudy(refreshed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunCycle = async () => {
    if (!currentStudy || isRunningCycle) return;
    setIsRunningCycle(true);
    setCycleNotification(null);
    try {
      const res = await runMonitoringCycle(currentStudy.id);
      setCycleNotification(res.message || 'Monitoring cycle completed successfully.');
      await refreshActiveStudy();
    } catch (e: any) {
      alert(e.message || 'Failed to execute monitoring cycle');
    } finally {
      setIsRunningCycle(false);
    }
  };

  const handleReseed = async () => {
    if (!window.confirm('Reset database to clean CDISC demonstration state?')) return;
    try {
      await reseedDatabase();
      const studyList = await getStudies();
      setStudies(studyList);
      if (studyList && studyList.length > 0) {
        setCurrentStudy(studyList[0]);
      }
      alert('Database reseeded successfully with CDISC scenarios.');
    } catch (e: any) {
      alert(e.message || 'Failed to reseed database');
    }
  };

  const handleSelectSubject = (usubjid: string) => {
    setSelectedSubjectId(usubjid);
    setCurrentScreen('SUBJECT_360');
  };

  const handleViewEvidence = (evidence: EvidenceItem[], title?: string) => {
    setDrawerEvidence(evidence || []);
    if (title) setDrawerTitle(title);
    setDrawerOpen(true);
  };

  // If not logged in, render LoginScreen
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // If no study chosen, render StudySelectScreen
  if (!currentStudy) {
    return (
      <StudySelectScreen
        onSelectStudy={(s) => {
          setCurrentStudy(s);
          setCurrentScreen('DASHBOARD');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 antialiased overflow-hidden">
      {/* Top Navigation */}
      <Navbar
        user={user}
        study={currentStudy}
        onRunCycle={handleRunCycle}
        onReseed={handleReseed}
        onLogout={handleLogout}
        isRunningCycle={isRunningCycle}
        onSwitchUser={handleLogin}
      />

      {/* Cycle notification banner if present */}
      {cycleNotification && (
        <div className="bg-emerald-600/90 text-white px-4 py-2 text-xs flex items-center justify-between shadow z-20">
          <span>{cycleNotification}</span>
          <button
            onClick={() => setCycleNotification(null)}
            className="text-white/80 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentScreen={currentScreen}
          onSelectScreen={(s) => setCurrentScreen(s)}
          openFindingsCount={currentStudy.findings_count}
          openQueriesCount={currentStudy.open_queries_count}
          pendingEscalationsCount={currentStudy.pending_escalations_count}
        />

        <main className="flex-1 overflow-y-auto bg-slate-950">
          {currentScreen === 'DASHBOARD' && (
            <DashboardScreen
              study={currentStudy}
              onNavigate={(s) => setCurrentScreen(s)}
              onRunCycle={handleRunCycle}
              isRunningCycle={isRunningCycle}
            />
          )}

          {currentScreen === 'STUDY_SELECT' && (
            <StudySelectScreen
              onSelectStudy={(s) => {
                setCurrentStudy(s);
                setCurrentScreen('DASHBOARD');
              }}
            />
          )}

          {currentScreen === 'STUDY_SETUP' && (
            <StudySetupScreen study={currentStudy} />
          )}

          {currentScreen === 'SUBJECTS' && (
            <SubjectsScreen
              study={currentStudy}
              onSelectSubject={handleSelectSubject}
              onAddSubject={() => setCurrentScreen('ADD_SUBJECT')}
            />
          )}

          {currentScreen === 'ADD_SUBJECT' && (
            <AddSubjectScreen
              study={currentStudy}
              onSubjectCreated={(usubjid) => {
                handleSelectSubject(usubjid);
                refreshActiveStudy();
              }}
            />
          )}

          {currentScreen === 'IMPORT' && (
            <ImportScreen
              study={currentStudy}
              onImportComplete={() => {
                refreshActiveStudy();
                setCurrentScreen('VALIDATION');
              }}
            />
          )}

          {currentScreen === 'VALIDATION' && <ValidationScreen />}

          {currentScreen === 'SITE_OPERATIONS' && (
            <SiteOperationsScreen
              study={currentStudy}
              onSelectSubject={handleSelectSubject}
            />
          )}

          {currentScreen === 'ASK_ATLAS' && (
            <AskAtlasScreen
              study={currentStudy}
              onViewEvidence={handleViewEvidence}
            />
          )}

          {currentScreen === 'KNOWLEDGE_GRAPH' && (
            <KnowledgeGraphScreen
              study={currentStudy}
              onSelectSubject={handleSelectSubject}
            />
          )}

          {currentScreen === 'SUBJECT_360' && (
            <Subject360Screen
              initialSubjectId={selectedSubjectId}
              onViewEvidence={handleViewEvidence}
            />
          )}

          {currentScreen === 'REVIEW_CREW' && (
            <ReviewCrewScreen
              study={currentStudy}
              onRunCycle={handleRunCycle}
              isRunningCycle={isRunningCycle}
            />
          )}

          {currentScreen === 'FINDINGS' && (
            <FindingsScreen
              study={currentStudy}
              onViewEvidence={handleViewEvidence}
              onSelectSubject={handleSelectSubject}
            />
          )}

          {currentScreen === 'MEDICAL_REVIEW' && (
            <MedicalReviewScreen
              study={currentStudy}
              onViewEvidence={handleViewEvidence}
              onSelectSubject={handleSelectSubject}
            />
          )}

          {currentScreen === 'QUERIES' && (
            <QueriesScreen study={currentStudy} />
          )}

          {currentScreen === 'COMPLIANCE' && (
            <ComplianceScreen
              study={currentStudy}
              onViewEvidence={handleViewEvidence}
              onSelectSubject={handleSelectSubject}
            />
          )}

          {currentScreen === 'HUMAN_GATE' && (
            <HumanGateScreen
              study={currentStudy}
              onViewEvidence={handleViewEvidence}
              onSelectSubject={handleSelectSubject}
              onNavigateToClarification={() => setCurrentScreen('CLARIFICATION')}
            />
          )}

          {currentScreen === 'CLARIFICATION' && (
            <ClarificationScreen
              study={currentStudy}
              onViewEvidence={handleViewEvidence}
              onSelectSubject={handleSelectSubject}
            />
          )}

          {currentScreen === 'DECISION_TRACE' && (
            <DecisionTraceScreen
              study={currentStudy}
              onSelectSubject={handleSelectSubject}
            />
          )}

          {currentScreen === 'CYCLE_REPORT' && (
            <CycleReportScreen
              study={currentStudy}
              onSelectSubject={handleSelectSubject}
            />
          )}

          {currentScreen === 'PROTOCOL_RULES' && (
            <ProtocolRulesScreen study={currentStudy} />
          )}

          {currentScreen === 'QUERY_HISTORY' && (
            <QueryHistoryScreen
              study={currentStudy}
              onSelectSubject={handleSelectSubject}
            />
          )}

          {currentScreen === 'DATA_CUT_SIMULATOR' && (
            <DataCutSimulatorScreen
              study={currentStudy}
              onRefreshStudy={refreshActiveStudy}
              onNavigateToCrew={() => setCurrentScreen('REVIEW_CREW')}
            />
          )}
        </main>
      </div>

      {/* Global Clinical Evidence Provenance Slide-over */}
      <EvidenceDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        evidence={drawerEvidence}
        title={drawerTitle}
      />
    </div>
  );
};
