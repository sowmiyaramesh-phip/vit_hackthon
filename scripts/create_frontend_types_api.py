from pathlib import Path

src_dir = Path("frontend/src")

# 1. types.ts
(src_dir / "types.ts").write_text("""export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface DemoUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  suggested_password: string;
}

export interface Study {
  id: number;
  org_id: number;
  study_id: string;
  name: string;
  sponsor: string;
  therapeutic_area: string;
  current_cut: number;
  current_protocol_version: string;
  status: string;
  subjects_count: number;
  sites_count: number;
  findings_count: number;
  open_queries_count: number;
  pending_escalations_count: number;
}

export interface Site {
  id: number;
  study_id: number;
  site_id: string;
  name: string;
  location: string;
  pi_name: string;
  status: string;
}

export interface SubjectSummary {
  id: number;
  study_id: number;
  site_id: string;
  site_name: string;
  usubjid: string;
  subjid: string;
  age: number | null;
  sex: string;
  arm: string;
  rfstdtc: string;
  rfendtc: string;
  screen_date: string;
  status: string;
  current_visit: string;
  open_findings_count: number;
  open_queries_count: number;
  total_aes: number;
  total_labs: number;
}

export interface EvidenceItem {
  record_type: string;
  record_id: string;
  field?: string;
  value?: string;
  rule?: string;
}

export interface Finding {
  id: number;
  finding_code: string;
  category: 'SAFETY' | 'DATA_QUALITY' | 'COMPLIANCE' | 'SITE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  subject_id: string;
  site_id: string;
  title: string;
  description: string;
  rationale: string;
  status: 'OPEN' | 'MONITORING' | 'RESOLVED' | 'ESCALATED';
  protocol_version: string;
  cut_number: number;
  evidence: EvidenceItem[];
  created_at: string;
}

export interface Escalation {
  id: number;
  escalation_code: string;
  finding_id: number;
  finding_code: string;
  finding_title: string;
  category: string;
  subject_id: string;
  site_id: string;
  severity: string;
  protocol_version: string;
  proposed_action: string;
  medical_review_summary: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLARIFY';
  evidence: EvidenceItem[];
  created_at: string;
  decisions: Array<{
    decision: string;
    reason: string;
    question?: string;
    answer?: string;
    date: string;
  }>;
}

export interface DataQuery {
  id: number;
  query_code: string;
  subject_id: string;
  site_id: string;
  domain: string;
  record_id: string;
  cut_number: number;
  problem_description: string;
  requested_action: string;
  status: 'OPEN' | 'CLOSED' | 'ANSWERED';
  created_at: string;
  responses: Array<{
    id: number;
    role: string;
    text: string;
    date: string;
  }>;
}

export interface ProtocolDeviation {
  id: number;
  deviation_code: string;
  subject_id: string;
  site_id: string;
  rule_code: string;
  protocol_version: string;
  type: string;
  severity: string;
  description: string;
  evidence_ref: string;
  status: string;
}

export interface SiteFlag {
  id: number;
  site_code: string;
  site_name: string;
  flag_code: string;
  reason: string;
  recurring_count: number;
  cut_number: number;
  status: string;
}

export interface TraceEntry {
  id: number;
  cycle_id: number | null;
  node_name: 'detect' | 'medical_review' | 'data_manager' | 'compliance' | 'human_gate' | 'execute';
  timestamp: string;
  action: string;
  decision: string;
  subject_id: string;
  finding_id: string;
  cut_number: number;
  protocol_version: string;
  message: string;
}

export interface AtlasAnswer {
  answer: string;
  question_type: 'COUNT' | 'LOOKUP' | 'FINDING' | 'TRAP';
  status: 'ANSWERED' | 'INSUFFICIENT_EVIDENCE' | 'OUTSIDE_STUDY_SCOPE' | 'AMBIGUOUS';
  evidence: Array<{
    record_type: string;
    record_id: string;
    subject_id?: string;
    field?: string;
    value?: string;
  }>;
  calculation_details?: string;
  protocol_rule?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  color: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  properties: Record<string, any>;
}

export interface VisualGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
}

export interface Subject360Data {
  usubjid: string;
  site: string;
  site_name: string;
  arm: string;
  age: number | null;
  sex: string;
  rfstdtc: string;
  screen_date: string;
  status: string;
  timeline: Array<{
    date: string;
    type: string;
    title: string;
    details: string;
    severity?: string;
    serious?: string;
    hospitalized?: string;
    record_id?: string;
  }>;
  lab_trends: Record<string, Array<{
    visit: string;
    date: string;
    raw_value: string;
    normalized_value: number;
    unit: string;
    uln: number | null;
    ratio: number | null;
    is_abnormal: boolean;
    record_id: string;
  }>>;
  adverse_events: Array<{
    record_id: string;
    term: string;
    severity: string;
    serious: string;
    hospitalized: string;
    start_date: string;
    end_date: string;
    causality: string;
    action_taken: string;
    is_sae_miscoded: boolean;
  }>;
  conmeds: Array<{
    record_id: string;
    treatment: string;
    indication: string;
    start_date: string;
    is_hepatotoxic: boolean;
  }>;
  findings: Array<{
    id: number;
    code: string;
    category: string;
    severity: string;
    title: string;
    status: string;
    evidence: any[];
  }>;
  queries: any[];
  deviations: any[];
}
""", encoding="utf-8")

# 2. api.ts
(src_dir / "api.ts").write_text("""import {
  User, DemoUser, Study, SubjectSummary, Finding, Escalation,
  DataQuery, ProtocolDeviation, SiteFlag, TraceEntry, AtlasAnswer,
  VisualGraphData, Subject360Data
} from './types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('atlas_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function login(email: string, password: string): Promise<{ access_token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  const data = await res.json();
  localStorage.setItem('atlas_token', data.access_token);
  return {
    access_token: data.access_token,
    user: {
      id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role
    }
  };
}

export async function getDemoUsers(): Promise<DemoUser[]> {
  const res = await fetch(`${API_BASE}/auth/demo-users`);
  return res.json();
}

export async function getCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
  return res.json();
}

export async function getStudies(): Promise<Study[]> {
  const res = await fetch(`${API_BASE}/studies`, { headers: getAuthHeaders() });
  return res.json();
}

export async function getStudy(studyId: number): Promise<Study> {
  const res = await fetch(`${API_BASE}/studies/${studyId}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function createStudy(payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/studies`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function getSubjects(studyId: number, params?: { site?: string; arm?: string; q?: string }): Promise<{ total: number; items: SubjectSummary[] }> {
  const query = new URLSearchParams();
  if (params?.site) query.set('site', params.site);
  if (params?.arm) query.set('arm', params.arm);
  if (params?.q) query.set('q', params.q);
  const res = await fetch(`${API_BASE}/studies/${studyId}/subjects?${query.toString()}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function getSubject360(usubjid: string): Promise<Subject360Data> {
  const res = await fetch(`${API_BASE}/subjects/${encodeURIComponent(usubjid)}/360`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Subject not found');
  return res.json();
}

export async function createSubject(studyId: number, payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/studies/${studyId}/subjects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create subject' }));
    throw new Error(err.detail ? (Array.isArray(err.detail) ? err.detail.join(', ') : err.detail) : 'Validation failed');
  }
  return res.json();
}

export async function askAtlas(studyId: number, question: string): Promise<AtlasAnswer> {
  const res = await fetch(`${API_BASE}/atlas/answer`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ study_id: studyId, question })
  });
  return res.json();
}

export async function getFindings(studyId: number, category?: string, severity?: string): Promise<Finding[]> {
  const query = new URLSearchParams({ study_id: studyId.toString() });
  if (category && category !== 'ALL') query.set('category', category);
  if (severity && severity !== 'ALL') query.set('severity', severity);
  const res = await fetch(`${API_BASE}/findings?${query.toString()}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function runMonitoringCycle(studyId: number, cutNumber?: number, protocolVersion?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/monitor/cycles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ study_id: studyId, cut_number: cutNumber, protocol_version: protocolVersion })
  });
  return res.json();
}

export async function getMonitoringCycles(studyId: number): Promise<any[]> {
  const res = await fetch(`${API_BASE}/monitor/cycles?study_id=${studyId}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function getQueries(studyId: number, status?: string): Promise<DataQuery[]> {
  const query = new URLSearchParams({ study_id: studyId.toString() });
  if (status && status !== 'ALL') query.set('status', status);
  const res = await fetch(`${API_BASE}/queries?${query.toString()}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function createQuery(studyId: number, payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/queries`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ study_id: studyId, ...payload })
  });
  return res.json();
}

export async function respondToQuery(queryId: number, responseText: string): Promise<any> {
  const res = await fetch(`${API_BASE}/queries/${queryId}/response`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ response_text: responseText })
  });
  return res.json();
}

export async function getDeviations(studyId: number): Promise<ProtocolDeviation[]> {
  const res = await fetch(`${API_BASE}/compliance/deviations?study_id=${studyId}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function getSiteFlags(studyId: number): Promise<SiteFlag[]> {
  const res = await fetch(`${API_BASE}/compliance/site_flags?study_id=${studyId}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function getEscalations(studyId: number, status?: string): Promise<Escalation[]> {
  const query = new URLSearchParams({ study_id: studyId.toString() });
  if (status && status !== 'ALL') query.set('status', status);
  const res = await fetch(`${API_BASE}/escalations?${query.toString()}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function makeEscalationDecision(escalationId: number, decision: 'APPROVED' | 'REJECTED' | 'CLARIFY', reason?: string, clarificationQuestion?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/escalations/${escalationId}/decision`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      decision,
      reason,
      clarification_question: clarificationQuestion
    })
  });
  return res.json();
}

export async function getTraces(studyId: number, node?: string): Promise<TraceEntry[]> {
  const query = new URLSearchParams({ study_id: studyId.toString() });
  if (node && node !== 'ALL') query.set('node', node);
  const res = await fetch(`${API_BASE}/trace?${query.toString()}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function getCycleReport(cycleId: number): Promise<any> {
  const res = await fetch(`${API_BASE}/reports/${cycleId}`, { headers: getAuthHeaders() });
  return res.json();
}

export function getExportReportCsvUrl(cycleId: number): string {
  return `${API_BASE}/reports/${cycleId}/export`;
}

export async function getProtocols(studyId: number): Promise<any[]> {
  const res = await fetch(`${API_BASE}/protocols?study_id=${studyId}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function getDataCuts(studyId: number): Promise<any[]> {
  const res = await fetch(`${API_BASE}/datacuts?study_id=${studyId}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function switchDataCut(studyId: number, targetCut: number, protocolVersion?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/datacuts/switch`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ study_id: studyId, target_cut: targetCut, protocol_version: protocolVersion })
  });
  return res.json();
}

export async function compareDataCuts(studyId: number, fromCut: number, toCut: number): Promise<any> {
  const res = await fetch(`${API_BASE}/datacuts/compare?study_id=${studyId}&from_cut=${fromCut}&to_cut=${toCut}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return res.json();
}

export async function getGraph(studyId: number): Promise<VisualGraphData> {
  const res = await fetch(`${API_BASE}/graph?study_id=${studyId}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function getSubjectGraph(usubjid: string): Promise<VisualGraphData> {
  const res = await fetch(`${API_BASE}/subjects/${encodeURIComponent(usubjid)}/graph`, { headers: getAuthHeaders() });
  return res.json();
}

export async function rebuildGraph(studyId: number): Promise<any> {
  const res = await fetch(`${API_BASE}/graph/rebuild?study_id=${studyId}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return res.json();
}

export async function getSiteOperations(siteId: string, studyId: number): Promise<any> {
  const res = await fetch(`${API_BASE}/site_operations/overview?site_id=${siteId}&study_id=${studyId}`, { headers: getAuthHeaders() });
  return res.json();
}

export async function reseedDatabase(): Promise<any> {
  const res = await fetch(`${API_BASE}/reseed`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return res.json();
}
""", encoding="utf-8")

print("types.ts and api.ts created successfully!")
