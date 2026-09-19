// Complete TypeScript definitions for ATLAS MONITOR WATCH

export interface StudyMetrics {
  study_id: string;
  protocol_name: string;
  current_protocol_version: string;
  total_subjects: number;
  active_sites: number;
  open_findings: number;
  open_data_queries: number;
  pending_human_decisions: number;
  current_watch_cut: number;
  safety: {
    serious_adverse_events_count: number;
    new_safety_findings_count: number;
    escalations_awaiting_decision_count: number;
    recent_findings: string[];
  };
  data_quality: {
    open_queries_count: number;
    missing_records_count: number;
    unit_inconsistencies_count: number;
    duplicate_records_count: number;
  };
  compliance: {
    protocol_deviations_count: number;
    site_level_issues_count: number;
  };
  watch: {
    current_cut: number;
    total_cuts: number;
    last_completed_cut: number;
    pending_decisions: number;
    adversarial_events: number;
  };
}

export interface SubjectSummary {
  subject_id: string;
  site_id: string;
  age: number;
  sex: string;
  status: string;
  enrollment_date: string;
  first_dose_date?: string;
  treatment: string;
  treatment_status: string;
  diseases: string[];
  disease?: string;
  medication?: string;
  current_cut?: number;
  latest_finding?: string;
  open_findings_count: number;
  open_queries_count: number;
}

export interface DiseaseSearchResult {
  disease: string;
  matched: boolean;
  total_subjects: number;
  subjects: Array<{
    subject_id: string;
    site_id: string;
    disease: string;
    disease_status: string;
    disease_evidence: string;
    treatments: Array<{
      medication: string;
      dose: string;
      start_date: string;
      end_date?: string;
      status: string;
      is_supported: boolean;
      evidence_note: string;
      evidence_ref: string;
    }>;
    primary_treatment: string;
    treatment_status: string;
    open_findings_count: number;
    findings: any[];
  }>;
  treatments_observed: Record<string, number>;
  message?: string;
}

export interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    properties?: any;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    label: string;
  }>;
}

export interface AskAtlasResult {
  question: string;
  kind: "COUNT" | "LOOKUP" | "FINDING" | "TRAP";
  answer: string;
  total_count: number;
  results: any;
  evidence: Array<{
    summary: string;
    domain?: string;
    evidence_ref?: string;
    subject_id?: string;
  }>;
  grounded: boolean;
  confidence: number;
  warning?: string;
}

export interface FindingItem {
  id: string;
  subject_id: string;
  site_id: string;
  title: string;
  category: "SAFETY" | "DATA_QUALITY" | "COMPLIANCE" | "SITE";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  recommended_action: string;
  protocol_rule: string;
  status: string;
  created_at?: string;
  evidence_bundle?: any;
}

export interface DataQueryItem {
  query_id: string;
  subject_id: string;
  site_id: string;
  problem_type: string;
  record_ref: string;
  question_to_site: string;
  status: "OPEN" | "SITE_RESPONSE" | "UNDER_REVIEW" | "CLOSED";
  site_response?: string;
  dm_review_notes?: string;
  created_at?: string;
}

export interface HumanEscalationItem {
  escalation_id: string;
  subject_id: string;
  site_id: string;
  finding_id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CLARIFIED";
  recommended_action: string;
  clinical_evidence: any[];
  protocol_evidence: any[];
  clarification_history: Array<{
    id: string;
    question: string;
    answer: string;
    retrieved_evidence: any[];
    timestamp: string;
    reviewer: string;
  }>;
  rejection_reason?: string;
  cuts_waiting: number;
  created_at?: string;
  updated_at?: string;
}

export interface TraceItem {
  id: string;
  node: string;
  decision: string;
  subject_id?: string;
  finding_id?: string;
  protocol_version: string;
  evidence_refs: any[];
  timestamp: string;
  actor: string;
  notes: string;
  result_payload: any;
}

export interface CutInfo {
  cut_number: number;
  cut_name: string;
  cut_date: string;
  status: "COMPLETED" | "ACTIVE" | "PENDING";
  new_records: number;
  corrections: number;
  new_findings: number;
  resolved_findings: number;
  safety_signals: number;
  data_integrity_events: number;
  pending_human_decisions: number;
  summary: string;
}

export interface AdversarialEventItem {
  event_id: string;
  site_id: string;
  domain: string;
  test_code: string;
  anomaly_type: string;
  classification: string;
  severity: string;
  description: string;
  evidence_metrics: any;
  remediation_action: string;
  is_untrusted: boolean;
  created_at?: string;
}

export interface DecisionExplanationItem {
  decision_id: string;
  what: string;
  evidence: string[];
  alternatives: Array<{ option: string; reason_rejected: string }>;
  why: string;
  trace_consistency: {
    verified: boolean;
    matching_trace_records: any[];
    hash_matches_original: boolean;
  };
}

export interface BudgetStateItem {
  total_budget_usd: number;
  consumed_budget_usd: number;
  remaining_budget_usd: number;
  percentage_used: number;
  tier: "NORMAL" | "CAUTION" | "CONSTRAINED" | "CRITICAL";
  narrative_generation_enabled: boolean;
  deterministic_checks_enabled: boolean;
  disabled_tasks: string[];
}
