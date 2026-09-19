// Typed API client for ATLAS MONITOR WATCH backend

import {
  StudyMetrics,
  SubjectSummary,
  DiseaseSearchResult,
  GraphData,
  AskAtlasResult,
  FindingItem,
  DataQueryItem,
  HumanEscalationItem,
  TraceItem,
  CutInfo,
  AdversarialEventItem,
  DecisionExplanationItem,
  BudgetStateItem,
} from "../types";

const API_BASE = "http://127.0.0.1:8000";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (e: any) {
    console.error(`API Error on ${endpoint}:`, e);
    throw e;
  }
}

export const api = {
  // --- Studies & Dashboard ---
  getStudies: () => request<any[]>("/studies"),
  getStudyDashboard: (studyId: string = "ABC-101") => request<StudyMetrics>(`/studies/${studyId}/dashboard`),

  // --- Subjects & 360 ---
  getSubjects: (filters?: { site?: string; status?: string; disease?: string; treatment?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.site) params.append("site", filters.site);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.disease) params.append("disease", filters.disease);
    if (filters?.treatment) params.append("treatment", filters.treatment);
    if (filters?.search) params.append("search", filters.search);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<SubjectSummary[]>(`/subjects${qs}`);
  },
  getSubject360: (usubjid: string) => request<any>(`/subjects/${usubjid}`),
  addSubject: (payload: any) => request<any>("/subjects", { method: "POST", body: JSON.stringify(payload) }),
  getSubjectCuts: (usubjid: string) => request<any[]>(`/subjects/${encodeURIComponent(usubjid)}/cuts`),
  getSubjectCutDetail: (usubjid: string, cutNumber: number) => request<any>(`/subjects/${encodeURIComponent(usubjid)}/cuts/${cutNumber}`),
  getSubjectTimeline: (usubjid: string) => request<any>(`/subjects/${encodeURIComponent(usubjid)}/timeline`),

  // --- ATLAS & Knowledge Graph Relationships ---
  getKnowledgeGraph: (maxNodes: number = 80) => request<GraphData>(`/graph?max_nodes=${maxNodes}`),
  getKGOverview: () => request<any>("/knowledge-graph/overview"),
  getKGByDisease: (disease: string) => request<any>(`/knowledge-graph/diseases/${encodeURIComponent(disease)}`),
  getKGByTreatment: (treatment: string) => request<any>(`/knowledge-graph/treatments/${encodeURIComponent(treatment)}`),
  getKGByMedication: (medication: string) => request<any>(`/knowledge-graph/medications/${encodeURIComponent(medication)}`),
  getSubjectSubgraph: (usubjid: string) => request<GraphData>(`/graph/subject/${usubjid}`),
  exploreDisease: (disease: string = "Liver disease") => request<DiseaseSearchResult>(`/disease-explorer?disease=${encodeURIComponent(disease)}`),
  askAtlas: (question: string) => request<AskAtlasResult>("/atlas/answer", { method: "POST", body: JSON.stringify({ question }) }),
  getFindings: (category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (status) params.append("status", status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<FindingItem[]>(`/findings${qs}`);
  },
  getFindingDetail: (findingId: string) => request<any>(`/findings/${findingId}`),
  getEvidenceRecord: (ref: string) => request<any>(`/evidence/${encodeURIComponent(ref)}`),

  // --- MONITOR ---
  runReviewCycle: () => request<any>("/monitor/run-cycle", { method: "POST" }),
  getQueries: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return request<DataQueryItem[]>(`/monitor/queries${qs}`);
  },
  submitQueryResponse: (queryId: string, siteResponse: string) =>
    request<any>(`/monitor/queries/${queryId}/response`, { method: "POST", body: JSON.stringify({ site_response: siteResponse }) }),
  reviewQuery: (queryId: string, decision: "ACCEPT" | "REJECT", dmNotes: string) =>
    request<any>(`/monitor/queries/${queryId}/review`, { method: "POST", body: JSON.stringify({ decision, dm_notes: dmNotes }) }),
  getEscalations: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return request<HumanEscalationItem[]>(`/monitor/escalations${qs}`);
  },
  createEmergencyEscalation: (payload: {
    subject_id: string;
    title: string;
    severity?: string;
    recommended_action: string;
    reason: string;
    physician?: string;
  }) =>
    request<any>("/monitor/escalations/emergency", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  processHumanGateAction: (escalationId: string, actionPayload: { action: string; reviewer?: string; rejection_reason?: string; clarification_question?: string; notes?: string }) =>
    request<any>(`/monitor/escalations/${escalationId}/action`, { method: "POST", body: JSON.stringify(actionPayload) }),
  getDecisionTrace: () => request<TraceItem[]>("/monitor/trace"),
  getCycleReport: () => request<any>("/monitor/cycle-report"),

  // --- WATCH ---
  getWatchDashboard: () => request<any>("/watch/dashboard"),
  getCutsTimeline: () => request<CutInfo[]>("/watch/cuts"),
  getCutDetails: (cutNumber: number) => request<any>(`/watch/cuts/${cutNumber}`),
  getCutSubjects: (cutNumber: number) => request<any>(`/watch/cuts/${cutNumber}/subjects`),
  getWatchSubject: (subjectId: string) => request<any>(`/watch/subjects/${encodeURIComponent(subjectId)}`),
  advanceCut: (targetCut?: number) => {
    const qs = targetCut !== undefined ? `?target_cut=${targetCut}` : "";
    return request<any>(`/watch/run-cut${qs}`, { method: "POST" });
  },
  runPeriod: (targetCut?: number) => {
    const qs = targetCut !== undefined ? `?target_cut=${targetCut}` : "";
    return request<any>(`/watch/run-period${qs}`, { method: "POST" });
  },
  getAdversarialEvents: () => request<AdversarialEventItem[]>("/watch/events"),
  getPendingDecisions: () => request<any[]>("/watch/pending-decisions"),
  explainDecision: (decisionId: string) => request<DecisionExplanationItem>(`/watch/decisions/${decisionId}/explain`),
  getSurveillanceReport: () => request<any>("/watch/surveillance-report"),
  updateBudget: (consumedUsd: number) => request<any>("/watch/budget", { method: "POST", body: JSON.stringify({ consumed_usd: consumedUsd }) }),

  // --- Governance & Global Search ---
  getProtocols: () => request<any[]>("/governance/protocols"),
  getAuditTrail: () => request<TraceItem[]>("/governance/audit-trail"),
  getQueryHistory: () => request<any[]>("/governance/query-history"),
  globalSearch: (query: string) => request<any>(`/search?q=${encodeURIComponent(query)}`),
};
