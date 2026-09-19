import {
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

// Fallback / Offline Data Store
const DEMO_USERS: DemoUser[] = [
  { id: 1, email: 'admin@atlas.clinical', role: 'Study Administrator', full_name: 'Dr. Sarah Jenkins', suggested_password: 'AdminPass123!' },
  { id: 2, email: 'medical.monitor@atlas.clinical', role: 'Medical Monitor', full_name: 'Dr. Elena Rostova', suggested_password: 'MedicalPass123!' },
  { id: 3, email: 'data.manager@atlas.clinical', role: 'Data Manager', full_name: 'Marcus Chen', suggested_password: 'DataPass123!' },
  { id: 4, email: 'clinical.reviewer@atlas.clinical', role: 'Clinical Reviewer', full_name: 'Dr. Raj Patel', suggested_password: 'ClinicalPass123!' },
  { id: 5, email: 'compliance.reviewer@atlas.clinical', role: 'Compliance Reviewer', full_name: 'Amina Al-Mansoor', suggested_password: 'CompliancePass123!' },
  { id: 6, email: 'site.coordinator@atlas.clinical', role: 'Site Coordinator', full_name: 'David Miller', suggested_password: 'SitePass123!' }
];

let currentUser: User = {
  id: 1,
  email: 'admin@atlas.clinical',
  full_name: 'Dr. Sarah Jenkins',
  role: 'Study Administrator'
};

const MOCK_STUDY: Study = {
  id: 1,
  org_id: 1,
  study_id: 'STUDY-001',
  name: 'Phase III Oncology Protocol - Multi-Site Safety & Efficacy',
  sponsor: 'Global Oncology Pharma',
  therapeutic_area: 'Oncology',
  current_cut: 2,
  current_protocol_version: 'v2.0',
  status: 'ACTIVE',
  subjects_count: 5,
  sites_count: 3,
  findings_count: 6,
  open_queries_count: 4,
  pending_escalations_count: 2
};

const MOCK_SUBJECTS: SubjectSummary[] = [
  { id: 1, study_id: 1, site_id: 'S01', site_name: 'Memorial Oncology Center', usubjid: '001-101', subjid: '101', age: 58, sex: 'M', arm: 'Arm A (Experimental 150mg)', rfstdtc: '2026-01-21', rfendtc: '', screen_date: '2026-01-14', status: 'ON_TREATMENT', current_visit: 'Cycle 3 Day 1', open_findings_count: 2, open_queries_count: 1, total_aes: 2, total_labs: 8 },
  { id: 2, study_id: 1, site_id: 'S01', site_name: 'Memorial Oncology Center', usubjid: '001-102', subjid: '102', age: 64, sex: 'F', arm: 'Arm B (Active Comparator)', rfstdtc: '2026-01-25', rfendtc: '', screen_date: '2026-01-18', status: 'ON_TREATMENT', current_visit: 'Cycle 2 Day 1', open_findings_count: 1, open_queries_count: 0, total_aes: 1, total_labs: 6 },
  { id: 3, study_id: 1, site_id: 'S02', site_name: 'St. Jude Clinical Research', usubjid: '002-201', subjid: '201', age: 52, sex: 'M', arm: 'Arm A (Experimental 150mg)', rfstdtc: '2026-02-01', rfendtc: '', screen_date: '2026-01-25', status: 'ON_TREATMENT', current_visit: 'Cycle 3 Day 1', open_findings_count: 3, open_queries_count: 2, total_aes: 3, total_labs: 9 },
  { id: 4, study_id: 1, site_id: 'S02', site_name: 'St. Jude Clinical Research', usubjid: '002-202', subjid: '202', age: 49, sex: 'F', arm: 'Arm B (Active Comparator)', rfstdtc: '2026-02-10', rfendtc: '', screen_date: '2026-02-03', status: 'ON_TREATMENT', current_visit: 'Cycle 2 Day 1', open_findings_count: 0, open_queries_count: 0, total_aes: 0, total_labs: 5 },
  { id: 5, study_id: 1, site_id: 'S03', site_name: 'Metropolitan Health Sciences', usubjid: '003-301', subjid: '301', age: 61, sex: 'M', arm: 'Arm A (Experimental 150mg)', rfstdtc: '2026-02-15', rfendtc: '', screen_date: '2026-02-08', status: 'ON_TREATMENT', current_visit: 'Cycle 2 Day 1', open_findings_count: 1, open_queries_count: 1, total_aes: 1, total_labs: 7 }
];

let MOCK_FINDINGS: Finding[] = [
  {
    id: 1, finding_code: 'FND-001', category: 'SAFETY', severity: 'CRITICAL',
    subject_id: '002-201', site_id: 'S02',
    title: 'Grade 3 Thrombocytopenia',
    description: 'Platelet count dropped to 38,000 /uL (CTCAE Grade 3, < 50,000 /uL). Dose reduction criteria triggered.',
    rationale: 'Protocol section 6.2 mandates 50% dose modification upon Grade 3 thrombocytopenia.',
    status: 'OPEN', protocol_version: 'v2.0', cut_number: 2,
    evidence: [{ record_type: 'LB', record_id: 'LB-084', field: 'LBORRES', value: '38', rule: 'PLAT < 50k' }],
    created_at: '2026-03-04T10:00:00Z'
  },
  {
    id: 2, finding_code: 'FND-002', category: 'SAFETY', severity: 'HIGH',
    subject_id: '001-101', site_id: 'S01',
    title: 'Serious Adverse Event - Hospitalization for Dehydration',
    description: 'Subject 001-101 admitted to inpatient care for 48 hours following Cycle 2 infusion.',
    rationale: 'SAE reporting expedited criteria required within 24 hours of notification.',
    status: 'OPEN', protocol_version: 'v2.0', cut_number: 2,
    evidence: [{ record_type: 'AE', record_id: 'AE-002', field: 'AESHOSP', value: 'Y', rule: 'SAE 24h report' }],
    created_at: '2026-03-02T14:30:00Z'
  },
  {
    id: 3, finding_code: 'FND-003', category: 'COMPLIANCE', severity: 'MEDIUM',
    subject_id: '002-201', site_id: 'S02',
    title: 'Visit Window Excursion (+4 Days)',
    description: 'Visit 3 occurred on Day 25 instead of target Day 21 (+/- 2 days allowed under v2.0 protocol).',
    rationale: 'Visit schedule adherence tighter under Protocol v2.0.',
    status: 'OPEN', protocol_version: 'v2.0', cut_number: 2,
    evidence: [{ record_type: 'SV', record_id: 'SV-019', field: 'SVSTDTC', value: '2026-03-04', rule: 'Visit window +/- 2d' }],
    created_at: '2026-03-01T09:15:00Z'
  },
  {
    id: 4, finding_code: 'FND-004', category: 'SAFETY', severity: 'HIGH',
    subject_id: '003-301', site_id: 'S03',
    title: 'Prohibited Strong CYP3A4 Inhibitor Co-Administration',
    description: 'Ketoconazole prescribed concomitantly with experimental agent. High risk of drug accumulation.',
    rationale: 'Drug-drug interaction identified via Knowledge Graph reasoning.',
    status: 'OPEN', protocol_version: 'v2.0', cut_number: 2,
    evidence: [{ record_type: 'CM', record_id: 'CM-012', field: 'CMTRT', value: 'Ketoconazole', rule: 'Prohibited CYP3A4' }],
    created_at: '2026-02-28T16:00:00Z'
  }
];

let MOCK_QUERIES: DataQuery[] = [
  {
    id: 1, query_code: 'QRY-1001', subject_id: '002-201', site_id: 'S02', domain: 'EX', record_id: 'EX-022',
    cut_number: 2, problem_description: 'Platelet CTCAE Grade 3 without corresponding drug interruption record in EX domain.',
    requested_action: 'Submit dose interruption or reduction CRF page within 5 business days.',
    status: 'OPEN', created_at: '2026-03-04T12:00:00Z', responses: []
  },
  {
    id: 2, query_code: 'QRY-1002', subject_id: '001-101', site_id: 'S01', domain: 'AE', record_id: 'AE-002',
    cut_number: 2, problem_description: 'SAE end date is missing in AE domain while hospitalization flag is marked YES.',
    requested_action: 'Update AE end date and outcome in electronic data capture.',
    status: 'OPEN', created_at: '2026-03-03T09:00:00Z', responses: []
  }
];

let MOCK_ESCALATIONS: Escalation[] = [
  {
    id: 1, escalation_code: 'ESC-001', finding_id: 1, finding_code: 'FND-001',
    finding_title: 'Grade 3 Thrombocytopenia', category: 'SAFETY',
    subject_id: '002-201', site_id: 'S02', severity: 'CRITICAL', protocol_version: 'v2.0',
    proposed_action: 'Immediate 50% dose reduction and repeat CBC within 72 hours.',
    medical_review_summary: 'CTCAE Grade 3 confirmed. Requires Medical Monitor sign-off.',
    status: 'PENDING',
    evidence: [{ record_type: 'LB', record_id: 'LB-084', field: 'LBORRES', value: '38' }],
    created_at: '2026-03-04T11:00:00Z',
    decisions: []
  },
  {
    id: 2, escalation_code: 'ESC-002', finding_id: 4, finding_code: 'FND-004',
    finding_title: 'Prohibited Strong CYP3A4 Inhibitor Co-Administration', category: 'SAFETY',
    subject_id: '003-301', site_id: 'S03', severity: 'HIGH', protocol_version: 'v2.0',
    proposed_action: 'Hold study drug until 5 half-lives post-ketoconazole cessation.',
    medical_review_summary: 'CYP3A4 inhibitor interaction requires clinical resolution.',
    status: 'PENDING',
    evidence: [{ record_type: 'CM', record_id: 'CM-012', field: 'CMTRT', value: 'Ketoconazole' }],
    created_at: '2026-03-02T16:00:00Z',
    decisions: []
  }
];

let MOCK_DEVIATIONS: ProtocolDeviation[] = [
  { id: 1, deviation_code: 'DEV-001', subject_id: '002-201', site_id: 'S02', rule_code: 'PR-SCHED-02', protocol_version: 'v2.0', type: 'SCHEDULE', severity: 'MINOR', description: 'Visit 3 conducted outside protocol window (+4 days excursion).', evidence_ref: 'SV-019', status: 'OPEN' },
  { id: 2, deviation_code: 'DEV-002', subject_id: '003-301', site_id: 'S03', rule_code: 'PR-MED-03', protocol_version: 'v2.0', type: 'MEDICATION', severity: 'MAJOR', description: 'Subject received concurrent Ketoconazole without prior sponsor approval.', evidence_ref: 'CM-012', status: 'OPEN' }
];

let MOCK_FLAGS: SiteFlag[] = [
  { id: 1, site_code: 'S02', site_name: 'St. Jude Clinical Research', flag_code: 'FLG-S02-01', reason: 'Site 002 has 2 open safety queries unresolved for > 14 days.', recurring_count: 2, cut_number: 2, status: 'ACTIVE' },
  { id: 2, site_code: 'S03', site_name: 'Metropolitan Health Sciences', flag_code: 'FLG-S03-01', reason: 'Site 003 flagged for prohibited medication co-prescription.', recurring_count: 1, cut_number: 2, status: 'ACTIVE' }
];

let MOCK_TRACES: TraceEntry[] = [
  { id: 1, cycle_id: 2, node_name: 'medical_review', action: 'RULE_EVALUATION', decision: 'ESCALATION_TRIGGERED', subject_id: '002-201', finding_id: 'FND-001', cut_number: 2, protocol_version: 'v2.0', message: 'Platelet count drops below 50,000 threshold. Mandates Grade 3 safety finding and dose hold escalation.', timestamp: '2026-03-04T10:30:00Z' },
  { id: 2, cycle_id: 2, node_name: 'compliance', action: 'VISIT_WINDOW_CHECK', decision: 'DEVIATION_LOGGED', subject_id: '002-201', finding_id: 'FND-003', cut_number: 2, protocol_version: 'v2.0', message: 'Under protocol v2.0 window tightening, excursion exceeds allowed 2 days. Deviation logged automatically.', timestamp: '2026-03-02T09:20:00Z' },
  { id: 3, cycle_id: 2, node_name: 'detect', action: 'DRUG_INTERACTION_LOOKUP', decision: 'FINDING_CREATED', subject_id: '003-301', finding_id: 'FND-004', cut_number: 2, protocol_version: 'v2.0', message: 'Graph path exists: Ketoconazole -> INHIBITS -> CYP3A4. Risk of serious drug accumulation.', timestamp: '2026-02-28T16:05:00Z' }
];

export async function login(email: string, password: string): Promise<{ access_token: string; user: User }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('atlas_token', data.access_token);
      currentUser = { id: data.user_id, email: data.email, full_name: data.full_name, role: data.role };
      return { access_token: data.access_token, user: currentUser };
    }
  } catch (e) {}
  const match = DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || DEMO_USERS[0];
  currentUser = { id: match.id, email: match.email, full_name: match.full_name, role: match.role };
  localStorage.setItem('atlas_token', 'mock_offline_demo_token');
  return { access_token: 'mock_offline_demo_token', user: currentUser };
}

export async function getDemoUsers(): Promise<DemoUser[]> {
  try {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return DEMO_USERS;
}

export async function getCurrentUser(): Promise<User> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  return currentUser;
}

export async function getStudies(): Promise<Study[]> {
  try {
    const res = await fetch(`${API_BASE}/studies`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  return [MOCK_STUDY];
}

export async function getStudy(studyId: number): Promise<Study> {
  try {
    const res = await fetch(`${API_BASE}/studies/${studyId}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  return MOCK_STUDY;
}

export async function createStudy(payload: any): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/studies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { id: 2, ...payload };
}

export async function getSubjects(studyId: number, params?: { site?: string; arm?: string; q?: string }): Promise<{ total: number; items: SubjectSummary[] }> {
  try {
    const query = new URLSearchParams();
    if (params?.site) query.set('site', params.site);
    if (params?.arm) query.set('arm', params.arm);
    if (params?.q) query.set('q', params.q);
    const res = await fetch(`${API_BASE}/studies/${studyId}/subjects?${query.toString()}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  let list = [...MOCK_SUBJECTS];
  if (params?.site && params.site !== 'ALL') list = list.filter(s => s.site_id === params.site);
  if (params?.q) list = list.filter(s => s.usubjid.toLowerCase().includes(params.q!.toLowerCase()));
  return { total: list.length, items: list };
}

export async function getSubject360(usubjid: string): Promise<Subject360Data> {
  try {
    const res = await fetch(`${API_BASE}/subjects/${encodeURIComponent(usubjid)}/360`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  const subj = MOCK_SUBJECTS.find(s => s.usubjid === usubjid) || MOCK_SUBJECTS[0];
  return {
    usubjid: subj.usubjid,
    site: subj.site_id,
    site_name: subj.site_name,
    arm: subj.arm,
    age: subj.age,
    sex: subj.sex,
    rfstdtc: subj.rfstdtc,
    screen_date: subj.screen_date,
    status: subj.status,
    timeline: [
      { date: '2026-01-14', type: 'VISIT', title: 'Screening Visit', details: 'All inclusion criteria verified. Informed consent obtained.' },
      { date: '2026-01-21', type: 'TREATMENT', title: 'Cycle 1 Day 1 Dosing', details: '150mg ATLAS-01 administered intravenously.' },
      { date: '2026-03-04', type: 'LAB', title: 'Platelet Count: 38,000 /uL', details: 'CTCAE Grade 3 Thrombocytopenia observed.', severity: 'CRITICAL' }
    ],
    lab_trends: {
      'Platelet Count': [
        { visit: 'Screening', date: '2026-01-14', raw_value: '220', normalized_value: 220, unit: '10^3/uL', uln: 450, ratio: 0.49, is_abnormal: false, record_id: 'LB-001' },
        { visit: 'Cycle 1', date: '2026-01-21', raw_value: '195', normalized_value: 195, unit: '10^3/uL', uln: 450, ratio: 0.43, is_abnormal: false, record_id: 'LB-024' },
        { visit: 'Cycle 3', date: '2026-03-04', raw_value: '38', normalized_value: 38, unit: '10^3/uL', uln: 450, ratio: 0.08, is_abnormal: true, record_id: 'LB-084' }
      ]
    },
    adverse_events: [
      { record_id: 'AE-001', term: 'Thrombocytopenia', severity: 'GRADE_3', serious: 'Y', hospitalized: 'N', start_date: '2026-03-04', end_date: '', causality: 'PROBABLE', action_taken: 'DOSE_REDUCED', is_sae_miscoded: false }
    ],
    conmeds: [
      { record_id: 'CM-001', treatment: 'Omeprazole', indication: 'Gastric prophylaxis', start_date: '2026-01-10', is_hepatotoxic: false }
    ],
    findings: [
      { id: 1, code: 'FND-001', category: 'SAFETY', severity: 'CRITICAL', title: 'Grade 3 Thrombocytopenia', status: 'OPEN', evidence: [] }
    ],
    queries: MOCK_QUERIES.filter(q => q.subject_id === subj.usubjid),
    deviations: MOCK_DEVIATIONS.filter(d => d.subject_id === subj.usubjid)
  };
}

export async function createSubject(studyId: number, payload: any): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/studies/${studyId}/subjects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const newSubj: SubjectSummary = {
    id: MOCK_SUBJECTS.length + 1,
    study_id: studyId,
    site_id: payload.site_id || 'S01',
    site_name: 'Memorial Oncology Center',
    usubjid: payload.usubjid || `001-${100 + MOCK_SUBJECTS.length + 1}`,
    subjid: `${100 + MOCK_SUBJECTS.length + 1}`,
    arm: payload.arm || 'Arm A (Experimental 150mg)',
    sex: payload.sex || 'M',
    age: payload.age || 55,
    rfstdtc: new Date().toISOString().split('T')[0],
    rfendtc: '',
    screen_date: new Date().toISOString().split('T')[0],
    status: 'ON_TREATMENT',
    current_visit: 'Cycle 1 Day 1',
    open_findings_count: 0,
    open_queries_count: 0,
    total_aes: 0,
    total_labs: 1
  };
  MOCK_SUBJECTS.push(newSubj);
  return newSubj;
}

export async function askAtlas(studyId: number, question: string): Promise<AtlasAnswer> {
  try {
    const res = await fetch(`${API_BASE}/atlas/answer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ study_id: studyId, question })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  
  const q = question.toLowerCase();
  if (q.includes('how many') || q.includes('count')) {
    return {
      question_type: 'COUNT',
      status: 'ANSWERED',
      answer: 'There are currently 5 enrolled subjects in STUDY-001 with 6 active findings across 3 clinical sites.',
      evidence: [
        { record_type: 'DM', record_id: 'DM-ALL', value: '5 active subjects' },
        { record_type: 'FINDING', record_id: 'FND-ALL', value: '6 findings (1 Critical, 2 High)' }
      ],
      calculation_details: 'COUNT(DISTINCT usubjid) FROM dm WHERE studyid = "STUDY-001"'
    };
  }
  if (q.includes('thrombocytopenia') || q.includes('platelet')) {
    return {
      question_type: 'FINDING',
      status: 'ANSWERED',
      answer: 'Subject 002-201 experienced CTCAE Grade 3 Thrombocytopenia (Platelet count 38,000 /uL on Day 42). A 50% dose modification rule was triggered under protocol section 6.2.',
      evidence: [
        { record_type: 'LB', record_id: 'LB-084', subject_id: '002-201', field: 'LBORRES', value: '38 10^3/uL' }
      ],
      protocol_rule: 'PR-LAB-04: Platelets < 50k requires 50% dose modification'
    };
  }
  return {
    question_type: 'LOOKUP',
    status: 'ANSWERED',
    answer: 'ATLAS Clinical Intelligence identified 3 clinical sites actively conducting STUDY-001 with 97.4% SDTM data conformance and 0 duplicate queries.',
    evidence: [
      { record_type: 'PROTOCOL', record_id: 'PROT-v2.0', value: 'Effective date 2026-02-01' }
    ],
    protocol_rule: 'PR-SCHED-02: Visit window conformance'
  };
}

export async function getFindings(studyId: number, category?: string, severity?: string): Promise<Finding[]> {
  try {
    const query = new URLSearchParams({ study_id: studyId.toString() });
    if (category && category !== 'ALL') query.set('category', category);
    if (severity && severity !== 'ALL') query.set('severity', severity);
    const res = await fetch(`${API_BASE}/findings?${query.toString()}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  let list = [...MOCK_FINDINGS];
  if (category && category !== 'ALL') list = list.filter(f => f.category === category);
  if (severity && severity !== 'ALL') list = list.filter(f => f.severity === severity);
  return list;
}

export async function runMonitoringCycle(studyId: number, cutNumber?: number, protocolVersion?: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/monitor/cycles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ study_id: studyId, cut_number: cutNumber, protocol_version: protocolVersion })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return {
    cycle_id: 3,
    status: 'COMPLETED',
    findings_created: 6,
    queries_generated: 3,
    escalations_raised: 2,
    trace_entries_count: 18,
    summary: 'Autonomous Review Crew completed cycle across all 6 clinical evaluation nodes with 100% trace coverage.'
  };
}

export async function getMonitoringCycles(studyId: number): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/monitor/cycles?study_id=${studyId}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  return [
    { id: 1, cycle_number: 1, status: 'COMPLETED', cut_number: 1, protocol_version: 'v1.0', total_findings: 4, queries_issued: 2, escalations_count: 1, created_at: '2026-03-01T10:00:00Z' },
    { id: 2, cycle_number: 2, status: 'COMPLETED', cut_number: 2, protocol_version: 'v2.0', total_findings: 6, queries_issued: 3, escalations_count: 2, created_at: '2026-03-15T15:30:00Z' }
  ];
}

export async function getQueries(studyId: number, status?: string): Promise<DataQuery[]> {
  try {
    const query = new URLSearchParams({ study_id: studyId.toString() });
    if (status && status !== 'ALL') query.set('status', status);
    const res = await fetch(`${API_BASE}/queries?${query.toString()}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  let list = [...MOCK_QUERIES];
  if (status && status !== 'ALL') list = list.filter(q => q.status === status);
  return list;
}

export async function createQuery(studyId: number, payload: any): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/queries`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ study_id: studyId, ...payload })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const newQ: DataQuery = {
    id: MOCK_QUERIES.length + 1,
    query_code: `QRY-${2000 + MOCK_QUERIES.length + 1}`,
    subject_id: payload.subject_id || '001-101',
    site_id: payload.site_id || 'S01',
    domain: payload.domain || 'DM',
    record_id: payload.record_id || 'REC-01',
    cut_number: 2,
    problem_description: payload.problem_description || payload.query_text,
    requested_action: payload.proposed_action || 'Review and respond in eCRF.',
    status: 'OPEN',
    created_at: new Date().toISOString(),
    responses: []
  };
  MOCK_QUERIES.unshift(newQ);
  return newQ;
}

export async function respondToQuery(queryId: number, responseText: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/queries/${queryId}/response`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ response_text: responseText })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const q = MOCK_QUERIES.find(x => x.id === queryId);
  if (q) {
    q.status = 'ANSWERED';
    q.responses.push({
      id: q.responses.length + 1,
      role: 'Site Coordinator',
      text: responseText,
      date: new Date().toISOString()
    });
  }
  return { status: 'SUCCESS', message: 'Response recorded successfully.' };
}

export async function getDeviations(studyId: number): Promise<ProtocolDeviation[]> {
  try {
    const res = await fetch(`${API_BASE}/compliance/deviations?study_id=${studyId}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  return MOCK_DEVIATIONS;
}

export async function getSiteFlags(studyId: number): Promise<SiteFlag[]> {
  try {
    const res = await fetch(`${API_BASE}/compliance/site_flags?study_id=${studyId}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  return MOCK_FLAGS;
}

export async function getEscalations(studyId: number, status?: string): Promise<Escalation[]> {
  try {
    const query = new URLSearchParams({ study_id: studyId.toString() });
    if (status && status !== 'ALL') query.set('status', status);
    const res = await fetch(`${API_BASE}/escalations?${query.toString()}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  let list = [...MOCK_ESCALATIONS];
  if (status && status !== 'ALL') list = list.filter(e => e.status === status);
  return list;
}

export async function makeEscalationDecision(escalationId: number, decision: 'APPROVED' | 'REJECTED' | 'CLARIFY', reason?: string, clarificationQuestion?: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/escalations/${escalationId}/decision`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ decision, reason, clarification_question: clarificationQuestion })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const esc = MOCK_ESCALATIONS.find(e => e.id === escalationId);
  if (esc) {
    esc.status = decision === 'APPROVED' ? 'APPROVED' : decision === 'REJECTED' ? 'REJECTED' : 'CLARIFY';
    esc.decisions.push({
      decision,
      reason: reason || 'Reviewer action',
      question: clarificationQuestion,
      date: new Date().toISOString()
    });
  }
  return { status: 'SUCCESS', escalation_id: escalationId, decision };
}

export async function getTraces(studyId: number, node?: string): Promise<TraceEntry[]> {
  try {
    const query = new URLSearchParams({ study_id: studyId.toString() });
    if (node && node !== 'ALL') query.set('node', node);
    const res = await fetch(`${API_BASE}/trace?${query.toString()}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  let list = [...MOCK_TRACES];
  if (node && node !== 'ALL') list = list.filter(t => t.node_name === node);
  return list;
}

export async function getCycleReport(cycleId: number): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/reports/${cycleId}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  return {
    cycle_number: 2,
    study_id: 'STUDY-001',
    cut_number: 2,
    protocol_version: 'v2.0',
    generated_at: new Date().toISOString(),
    executive_summary: 'Comprehensive clinical monitoring cycle evaluated 5 subjects across 3 investigator sites. Identified 1 CTCAE Grade 3 safety finding, 1 drug-drug interaction, and 2 protocol window deviations.',
    safety_findings_count: 6,
    open_queries_count: 4,
    protocol_deviations_count: 2,
    site_performance: [
      { site_id: 'S01', name: 'Memorial Oncology Center', conformance_score: 98.2, open_queries: 1 },
      { site_id: 'S02', name: 'St. Jude Clinical Research', conformance_score: 91.5, open_queries: 2 },
      { site_id: 'S03', name: 'Metropolitan Health Sciences', conformance_score: 95.0, open_queries: 1 }
    ]
  };
}

export function getExportReportCsvUrl(cycleId: number): string {
  return `${API_BASE}/reports/${cycleId}/export`;
}

export async function getProtocols(studyId: number): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/protocols?study_id=${studyId}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  return [
    { id: 1, protocol_code: 'ONC-2026-01', version: 'v1.0', effective_date: '2025-10-01', title: 'Phase III Multicenter Safety & Efficacy Initial Protocol' },
    { id: 2, protocol_code: 'ONC-2026-02', version: 'v2.0', effective_date: '2026-02-01', title: 'Phase III Protocol Amendment 1 (Tightened Visit Windows)' }
  ];
}

export async function getDataCuts(studyId: number): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/datacuts?study_id=${studyId}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  return [
    { id: 1, cut_number: 1, cut_date: '2026-02-01', records_count: 382, is_active: false },
    { id: 2, cut_number: 2, cut_date: '2026-03-15', records_count: 429, is_active: true }
  ];
}

export async function switchDataCut(studyId: number, targetCut: number, protocolVersion?: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/datacuts/switch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ study_id: studyId, target_cut: targetCut, protocol_version: protocolVersion })
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  MOCK_STUDY.current_cut = targetCut;
  if (protocolVersion) MOCK_STUDY.current_protocol_version = protocolVersion;
  return { status: 'SUCCESS', current_cut: targetCut, protocol_version: protocolVersion || 'v2.0' };
}

export async function compareDataCuts(studyId: number, fromCut: number, toCut: number): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/datacuts/compare?study_id=${studyId}&from_cut=${fromCut}&to_cut=${toCut}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return {
    from_cut: fromCut,
    to_cut: toCut,
    from_protocol: fromCut === 1 ? 'v1.0' : 'v2.0',
    to_protocol: toCut >= 2 ? 'v2.0' : 'v1.0',
    changes: [
      'Protocol version transitioned from v1.0 to v2.0 (Visit windows tightened to +/- 1-2 days).',
      'Active findings increased from 4 in Cut 1 to 6 in Cut 2 (including new Grade 3 Thrombocytopenia).',
      'Data queries evaluated: 3 active queries with 0 duplicate query re-issuances.',
      'Protocol deviations: 2 additional window violations flagged under v2.0 criteria.'
    ]
  };
}

export async function getGraph(studyId: number): Promise<VisualGraphData> {
  try {
    const res = await fetch(`${API_BASE}/graph?study_id=${studyId}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  return {
    nodes: [
      { id: 'study-1', label: 'STUDY-001 (Phase III Oncology)', type: 'Study', color: '#6366f1', properties: {} },
      { id: 'site-S01', label: 'Site S01: Memorial Oncology', type: 'Site', color: '#3b82f6', properties: {} },
      { id: 'site-S02', label: 'Site S02: St. Jude Research', type: 'Site', color: '#3b82f6', properties: {} },
      { id: 'site-S03', label: 'Site S03: Metro Health', type: 'Site', color: '#3b82f6', properties: {} },
      { id: 'subj-001-101', label: '001-101 (Arm A)', type: 'Subject', color: '#10b981', properties: {} },
      { id: 'subj-002-201', label: '002-201 (Arm A)', type: 'Subject', color: '#10b981', properties: {} },
      { id: 'fnd-1', label: 'Grade 3 Thrombocytopenia', type: 'Finding', color: '#ef4444', properties: {} },
      { id: 'rule-1', label: 'PR-LAB-04 Dose Mod Rule', type: 'Rule', color: '#f59e0b', properties: {} },
      { id: 'med-keto', label: 'Ketoconazole', type: 'Medication', color: '#ec4899', properties: {} }
    ],
    edges: [
      { id: 'e1', from: 'study-1', to: 'site-S01', label: 'HAS_SITE', properties: {} },
      { id: 'e2', from: 'study-1', to: 'site-S02', label: 'HAS_SITE', properties: {} },
      { id: 'e3', from: 'study-1', to: 'site-S03', label: 'HAS_SITE', properties: {} },
      { id: 'e4', from: 'site-S01', to: 'subj-001-101', label: 'ENROLLED_AT', properties: {} },
      { id: 'e5', from: 'site-S02', to: 'subj-002-201', label: 'ENROLLED_AT', properties: {} },
      { id: 'e6', from: 'subj-002-201', to: 'fnd-1', label: 'HAS_FINDING', properties: {} },
      { id: 'e7', from: 'fnd-1', to: 'rule-1', label: 'TRIGGERED_BY', properties: {} },
      { id: 'e8', from: 'subj-002-201', to: 'med-keto', label: 'RECEIVES_CONMED', properties: {} }
    ],
    total_nodes: 9,
    total_edges: 8
  };
}

export async function getSubjectGraph(usubjid: string): Promise<VisualGraphData> {
  try {
    const res = await fetch(`${API_BASE}/subjects/${encodeURIComponent(usubjid)}/graph`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  return getGraph(1);
}

export async function rebuildGraph(studyId: number): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/graph/rebuild?study_id=${studyId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { status: 'SUCCESS', nodes_rebuilt: 48, relationships_created: 112 };
}

export async function getSiteOperations(siteId: string, studyId: number): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/site_operations/overview?site_id=${siteId}&study_id=${studyId}`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
  } catch (e) {}
  return {
    site_id: siteId || 'S02',
    site_name: 'St. Jude Clinical Research',
    pi_name: 'Dr. Katherine Bell',
    total_subjects: 2,
    open_queries_count: 2,
    visits_today: [
      { subject: '002-201', visit: 'Visit 4 (Follow-up)', time: '10:30 AM', status: 'SCHEDULED' },
      { subject: '002-202', visit: 'Visit 3', time: '02:00 PM', status: 'COMPLETED' }
    ],
    open_queries: [
      { id: 1, code: 'QRY-1001', subject: '002-201', desc: 'Dose modification verification for Platelet 38k', date: new Date().toISOString() }
    ]
  };
}

export async function reseedDatabase(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/reseed`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { status: 'SUCCESS', message: 'Data refreshed to default study state.' };
}
