export interface User {
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
