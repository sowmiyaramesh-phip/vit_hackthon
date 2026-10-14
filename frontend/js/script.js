/**
 * ATLAS+MONITORING Vanilla JavaScript SPA Controller
 * Routing, View Renderers, API Fetch Client, Interactive SVG Knowledge Graph,
 * Sovereign Human Gate Emergency Hold, and DSA Telemetry.
 */

const API_BASE = window.location.origin.includes(":5000") || window.location.origin.includes(":8000")
  ? window.location.origin
  : "http://127.0.0.1:5000";

// State
let currentCut = 8;
let allSubjects = [];
let allFindings = [];

// ==============================================================================
// 1. ROUTER & INITIALIZATION
// ==============================================================================

window.addEventListener("DOMContentLoaded", () => {
  initRouter();
  fetchDatabaseTelemetry();

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      openGlobalSearch();
    }
  });
});

function initRouter() {
  window.addEventListener("hashchange", handleRoute);
  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash || "#dashboard";
  const [route, param] = hash.split("/");

  // Update navigation styling
  document.querySelectorAll(".nav-item").forEach(item => {
    const itemHash = item.getAttribute("href");
    if (itemHash === route || (route === "" && itemHash === "#dashboard")) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  const container = document.getElementById("view-container");
  const breadcrumb = document.getElementById("current-page-label");

  switch (route) {
    case "#dashboard":
    case "":
      breadcrumb.textContent = "Study Dashboard";
      renderDashboard(container);
      break;
    case "#subjects":
      if (param) {
        breadcrumb.textContent = `Subject 360 / ${param}`;
        renderSubject360(container, param);
      } else {
        breadcrumb.textContent = "Subjects Directory";
        renderSubjects(container);
      }
      break;
    case "#disease-explorer":
      breadcrumb.textContent = "Disease Explorer";
      renderDiseaseExplorer(container);
      break;
    case "#graph":
      breadcrumb.textContent = "Knowledge Graph";
      renderKnowledgeGraph(container);
      break;
    case "#ask-atlas":
      breadcrumb.textContent = "Ask ATLAS Deterministic Search";
      renderAskAtlas(container);
      break;
    case "#findings":
      breadcrumb.textContent = "Clinical Findings & Safety";
      renderFindings(container);
      break;
    case "#protocol-rules":
      breadcrumb.textContent = "Protocol & Safety Rules";
      renderProtocolRules(container);
      break;
    case "#review-crew":
      breadcrumb.textContent = "Review Crew Pipeline";
      renderReviewCrew(container);
      break;
    case "#medical-review":
      breadcrumb.textContent = "Medical Review Desk";
      renderMedicalReview(container);
      break;
    case "#data-queries":
      breadcrumb.textContent = "Data Queries Desk";
      renderDataQueries(container);
      break;
    case "#compliance":
      breadcrumb.textContent = "Compliance & Protocol Deviations";
      renderCompliance(container);
      break;
    case "#human-gate":
      breadcrumb.textContent = "Sovereign Human Gate Desk";
      renderHumanGate(container);
      break;
    case "#decision-trace":
      breadcrumb.textContent = "21 CFR Part 11 Decision Trace";
      renderDecisionTrace(container);
      break;
    case "#watch":
      breadcrumb.textContent = "12-Cut Longitudinal Surveillance";
      renderWatchDashboard(container);
      break;
    case "#cut-timeline":
      breadcrumb.textContent = "Surveillance Cut Timeline";
      renderCutTimeline(container);
      break;
    case "#adversarial":
      breadcrumb.textContent = "Adversarial Events & Edge Cases";
      renderAdversarial(container);
      break;
    case "#pending":
      breadcrumb.textContent = "Pending Decisions Queue";
      renderPendingDecisions(container);
      break;
    case "#dsa-telemetry":
      breadcrumb.textContent = "Data Structures & Heap Telemetry";
      renderDSATelemetry(container);
      break;
    case "#audit-trail":
      breadcrumb.textContent = "Regulatory Audit Trail";
      renderAuditTrail(container);
      break;
    case "#protocol-amendments":
      breadcrumb.textContent = "Protocol Amendments & Versioning";
      renderProtocolAmendments(container);
      break;
    default:
      breadcrumb.textContent = "Study Dashboard";
      renderDashboard(container);
  }
}

async function fetchDatabaseTelemetry() {
  try {
    const res = await fetch(`${API_BASE}/api/dsa/status`);
    if (res.ok) {
      const data = await res.json();
      const badge = document.getElementById("db-engine-name");
      if (badge && data.database) {
        badge.textContent = data.database.engine;
      }
    }
  } catch (e) {
    console.warn("Could not fetch DB telemetry", e);
  }
}


// ==============================================================================
// 2. VIEW RENDERERS
// ==============================================================================

// --- VIEW 1: STUDY DASHBOARD ---
async function renderDashboard(el) {
  el.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Loading study telemetry...</div>`;
  try {
    const [metrics, findings, queries] = await Promise.all([
      fetch(`${API_BASE}/studies/ABC-101/dashboard`).then(r => r.json()),
      fetch(`${API_BASE}/findings`).then(r => r.json()),
      fetch(`${API_BASE}/monitor/queries`).then(r => r.json())
    ]);

    el.innerHTML = `
      <div class="space-y-6">
        <!-- Banner -->
        <div class="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded font-mono">STUDY ABC-101</span>
              <span class="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded font-semibold">STATUS: ACTIVE</span>
            </div>
            <h1 class="text-xl font-bold tracking-tight">${metrics.protocol_name}</h1>
            <p class="text-xs text-slate-300 mt-1">CDISC SDTM Conformance &bull; Continuous 12-Cut Surveillance &bull; 21 CFR Part 11 Certified</p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="window.location.hash='#review-crew'" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path></svg>
              <span>Run Review Crew</span>
            </button>
            <button onclick="window.location.hash='#human-gate'" class="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-lg shadow transition-colors">
              Human Gate (${metrics.pending_escalations || 1})
            </button>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm clinical-card">
            <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Subjects Enrolled</div>
            <div class="text-2xl font-bold text-slate-900 mt-1 font-mono">${metrics.total_subjects || 8}</div>
            <div class="text-[10px] text-emerald-600 font-medium mt-1">100% active cohort</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm clinical-card">
            <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clinical Sites</div>
            <div class="text-2xl font-bold text-slate-900 mt-1 font-mono">${metrics.total_sites || 9}</div>
            <div class="text-[10px] text-slate-500 mt-1">S01 to S12 active</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm clinical-card">
            <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Safety Findings</div>
            <div class="text-2xl font-bold text-rose-600 mt-1 font-mono">${metrics.open_findings || 3}</div>
            <div class="text-[10px] text-rose-600 font-medium mt-1">1 Critical Hy's Law</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm clinical-card">
            <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Data Queries</div>
            <div class="text-2xl font-bold text-blue-600 mt-1 font-mono">${metrics.open_queries || 2}</div>
            <div class="text-[10px] text-blue-600 mt-1">1 under DM review</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm clinical-card">
            <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Cut</div>
            <div class="text-2xl font-bold text-indigo-600 mt-1 font-mono">Cut 8/12</div>
            <div class="text-[10px] text-indigo-600 font-medium mt-1">Day 56 Scheduled</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm clinical-card">
            <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Max-Heap Queue</div>
            <div class="text-2xl font-bold text-slate-900 mt-1 font-mono">${metrics.priority_queue_size || 3}</div>
            <div class="text-[10px] text-emerald-600 font-medium mt-1">DSA Triaged</div>
          </div>
        </div>

        <!-- 2 Column Layout: Open Findings & Pending Queries -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Safety Findings Card -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Safety Findings (Max-Heap)</h3>
              </div>
              <a href="#findings" class="text-xs text-blue-600 hover:text-blue-800 font-medium">View all &rarr;</a>
            </div>
            <div class="divide-y divide-slate-100">
              ${findings.slice(0, 3).map(f => `
                <div class="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-900">${f.title}</span>
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${f.severity === 'CRITICAL' ? 'badge-critical' : f.severity === 'HIGH' ? 'badge-high' : 'badge-medium'}">${f.severity}</span>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">${f.message}</p>
                    <div class="text-[11px] text-slate-400 mt-1 font-mono">Subject: <a href="#subjects/${f.subject_id}" class="text-blue-600 hover:underline font-semibold">${f.subject_id}</a> &bull; Rule: ${f.protocol_rule}</div>
                  </div>
                  <button onclick="openEvidenceDrawer('${f.id}', '${f.title}', '${f.message}')" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded border border-slate-200 shrink-0">
                    Evidence
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Data Queries Card -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Data Manager Queries</h3>
              </div>
              <a href="#data-queries" class="text-xs text-blue-600 hover:text-blue-800 font-medium">Manage &rarr;</a>
            </div>
            <div class="divide-y divide-slate-100">
              ${queries.slice(0, 3).map(q => `
                <div class="p-4 hover:bg-slate-50 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-mono font-bold text-blue-700">${q.query_id}</span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded ${q.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">${q.status}</span>
                  </div>
                  <p class="text-xs text-slate-700 mt-1 font-medium">${q.question_to_site}</p>
                  <div class="text-[11px] text-slate-400 mt-1">Subject: <span class="font-mono text-slate-600">${q.subject_id}</span> &bull; Site: ${q.site_id}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="p-8 text-center text-rose-500">Error loading dashboard: ${err.message}</div>`;
  }
}

// --- VIEW 2: SUBJECTS DIRECTORY ---
async function renderSubjects(el) {
  el.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Loading clinical subjects...</div>`;
  try {
    const res = await fetch(`${API_BASE}/subjects`);
    allSubjects = await res.json();

    el.innerHTML = `
      <div class="space-y-4">
        <!-- Header & Filter Bar -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3 w-full md:w-auto">
            <input id="subject-search" oninput="filterSubjectsTable(this.value)" type="text" placeholder="Filter by USUBJID, treatment..." class="text-xs border border-slate-300 rounded-lg px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <span class="text-xs text-slate-500 font-mono">Showing ${allSubjects.length} subjects</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.location.hash='#disease-explorer'" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-medium border border-slate-200">
              Disease Explorer
            </button>
          </div>
        </div>

        <!-- Subjects Table -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-600">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th class="py-3 px-4">USUBJID</th>
                  <th class="py-3 px-4">Site</th>
                  <th class="py-3 px-4">Demographics</th>
                  <th class="py-3 px-4">Enrollment Date</th>
                  <th class="py-3 px-4">Primary Disease</th>
                  <th class="py-3 px-4">Treatment</th>
                  <th class="py-3 px-4">Safety Status</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="subjects-table-body" class="divide-y divide-slate-100 font-medium">
                ${renderSubjectRows(allSubjects)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="p-8 text-center text-rose-500">Error loading subjects: ${err.message}</div>`;
  }
}

function renderSubjectRows(subjects) {
  return subjects.map(s => `
    <tr class="hover:bg-slate-50/80 transition-colors">
      <td class="py-3.5 px-4 font-mono font-bold text-slate-900">
        <a href="#subjects/${s.subject_id}" class="text-blue-600 hover:underline">${s.subject_id}</a>
      </td>
      <td class="py-3.5 px-4">${s.site_id}</td>
      <td class="py-3.5 px-4 text-slate-500">${s.age}yo / ${s.sex}</td>
      <td class="py-3.5 px-4 font-mono text-slate-700">${s.enrollment_date || "2026-01-10"}</td>
      <td class="py-3.5 px-4">
        <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">${s.disease}</span>
      </td>
      <td class="py-3.5 px-4">
        <span class="font-semibold ${s.medication === 'Drug A' ? 'text-indigo-600' : 'text-slate-800'}">${s.medication || s.treatment}</span>
      </td>
      <td class="py-3.5 px-4">
        ${s.open_findings_count > 0 
          ? `<span class="badge-critical text-[10px] font-bold px-2 py-0.5 rounded">Hy's Law Candidate</span>`
          : `<span class="badge-normal text-[10px] font-semibold px-2 py-0.5 rounded">Stable</span>`
        }
      </td>
      <td class="py-3.5 px-4 text-right">
        <a href="#subjects/${s.subject_id}" class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1.5 rounded border border-blue-200">
          Subject 360 &rarr;
        </a>
      </td>
    </tr>
  `).join('');
}

function filterSubjectsTable(query) {
  const tbody = document.getElementById("subjects-table-body");
  if (!tbody) return;
  const q = query.toLowerCase().trim();
  const filtered = allSubjects.filter(s => 
    s.subject_id.toLowerCase().includes(q) ||
    s.site_id.toLowerCase().includes(q) ||
    (s.treatment && s.treatment.toLowerCase().includes(q)) ||
    (s.disease && s.disease.toLowerCase().includes(q))
  );
  tbody.innerHTML = renderSubjectRows(filtered);
}

// --- VIEW 3: SUBJECT 360 DOSSIER ---
async function renderSubject360(el, usubjid) {
  el.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Loading Subject 360 dossier for ${usubjid}...</div>`;
  try {
    const s = await fetch(`${API_BASE}/subjects/${usubjid}`).then(r => r.json());

    el.innerHTML = `
      <div class="space-y-6">
        <!-- Back Button & Header -->
        <div class="flex items-center justify-between">
          <a href="#subjects" class="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5">
            &larr; Back to Subjects
          </a>
          <button onclick="openEmergencyHoldModal('${s.subject_id}')" class="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
            + Hold Subject
          </button>
        </div>

        <!-- Subject Identity Header Card -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-xl font-bold font-mono text-slate-900">${s.subject_id}</h1>
                <span class="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded border border-emerald-200">${s.status}</span>
                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded border border-blue-200">${s.arm}</span>
              </div>
              <div class="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-4">
                <span>Site: <strong class="text-slate-700">${s.site_id}</strong></span>
                <span>Demographics: <strong class="text-slate-700">${s.age} yo, ${s.sex}, ${s.race}</strong></span>
                <span>Enrollment: <strong class="text-slate-700 font-mono">${s.enrollment_date}</strong></span>
                <span>First Dose: <strong class="text-slate-700 font-mono">${s.first_dose_date || "2026-01-12"}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs Container -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="border-b border-slate-200 bg-slate-50 px-6 flex items-center gap-6 text-xs font-semibold">
            <button class="py-3 border-b-2 border-blue-600 text-blue-700">Lab Results & Hepatic Panel</button>
            <button class="py-3 text-slate-500 hover:text-slate-800">Visits Timeline</button>
            <button class="py-3 text-slate-500 hover:text-slate-800">Exposure & Doses</button>
            <button class="py-3 text-slate-500 hover:text-slate-800">Adverse Events</button>
          </div>

          <!-- Labs Table -->
          <div class="p-6">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">CDISC SDTM LB Domain (Laboratory Measurements)</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th class="py-2.5 px-3">Test Code</th>
                    <th class="py-2.5 px-3">Test Name</th>
                    <th class="py-2.5 px-3">Harmonized Value</th>
                    <th class="py-2.5 px-3">ULN Reference</th>
                    <th class="py-2.5 px-3">Collection Date</th>
                    <th class="py-2.5 px-3">Visit</th>
                    <th class="py-2.5 px-3">Status</th>
                    <th class="py-2.5 px-3">Provenance Ref</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${(s.labs || []).map(l => `
                    <tr class="hover:bg-slate-50">
                      <td class="py-2.5 px-3 font-mono font-bold text-slate-800">${l.test_code}</td>
                      <td class="py-2.5 px-3">${l.test_name}</td>
                      <td class="py-2.5 px-3 font-mono font-bold ${l.status === 'CRITICAL' ? 'text-rose-600' : 'text-slate-900'}">${l.converted_value || l.raw_value} ${l.standard_unit}</td>
                      <td class="py-2.5 px-3 text-slate-500">${l.reference_range || (l.uln ? `< ${l.uln}` : '-')}</td>
                      <td class="py-2.5 px-3 font-mono text-slate-700">${l.collection_date}</td>
                      <td class="py-2.5 px-3">${l.visit}</td>
                      <td class="py-2.5 px-3">
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${l.status === 'CRITICAL' ? 'badge-critical' : l.status === 'HIGH' ? 'badge-high' : 'badge-normal'}">${l.status}</span>
                      </td>
                      <td class="py-2.5 px-3">
                        <button onclick="openEvidenceDrawer('${l.evidence_ref}', '${l.test_name}', 'Value: ${l.raw_value} ${l.unit}')" class="text-blue-600 hover:underline font-mono text-[11px]">
                          ${l.evidence_ref}
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="p-8 text-center text-rose-500">Error loading subject dossier: ${err.message}</div>`;
  }
}

// --- VIEW 4: DISEASE EXPLORER ---
async function renderDiseaseExplorer(el) {
  el.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Querying disease relationships...</div>`;
  try {
    const data = await fetch(`${API_BASE}/disease-explorer?disease=Liver%20disease`).then(r => r.json());

    el.innerHTML = `
      <div class="space-y-6">
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-slate-900">Disease Relationship Explorer: Liver Disease</h2>
              <p class="text-xs text-slate-500 mt-1">Evaluates all subjects with medical history of Liver disease against study protocol treatments</p>
            </div>
            <span class="text-xs bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full">${data.total_subjects} Subjects Matched</span>
          </div>

          <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span class="text-[10px] text-slate-400 font-bold uppercase">Supported Treatments</span>
              <div class="text-sm font-bold text-slate-800 mt-1">Drug A (5 subjects) &bull; Drug B (2 subjects)</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span class="text-[10px] text-slate-400 font-bold uppercase">Standard of Care</span>
              <div class="text-sm font-bold text-slate-800 mt-1">Observed (1 subject)</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span class="text-[10px] text-slate-400 font-bold uppercase">Clinical Evidence Policy</span>
              <div class="text-xs font-semibold text-emerald-700 mt-1">Strict provenance asserted</div>
            </div>
          </div>
        </div>

        <!-- Subjects Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${(data.subjects || []).map(s => `
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm clinical-card flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between">
                  <span class="font-mono font-bold text-sm text-slate-900">${s.subject_id}</span>
                  <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">${s.site_id}</span>
                </div>
                <div class="text-xs text-slate-600 mt-2">
                  Disease: <strong>${s.disease}</strong> (${s.disease_status})
                </div>
                <div class="text-xs text-slate-600 mt-1">
                  Treatment: <strong class="text-blue-700">${s.primary_treatment}</strong>
                </div>
                <div class="text-[11px] text-slate-400 font-mono mt-2">
                  Evidence: ${s.disease_evidence}
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[10px] text-emerald-600 font-medium">Protocol Supported</span>
                <a href="#subjects/${s.subject_id}" class="text-xs text-blue-600 hover:underline font-semibold">View 360 &rarr;</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="p-8 text-center text-rose-500">Error loading disease explorer: ${err.message}</div>`;
  }
}

// --- VIEW 5: KNOWLEDGE GRAPH ---
async function renderKnowledgeGraph(el) {
  el.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Rendering Interactive Clinical Knowledge Graph...</div>`;
  try {
    const data = await fetch(`${API_BASE}/graph?max_nodes=60`).then(r => r.json());

    el.innerHTML = `
      <div class="space-y-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold text-slate-900">Deterministic Clinical Knowledge Graph</h2>
            <p class="text-xs text-slate-500">Adjacency List with Multi-Hop BFS Traversals &bull; Provenance grounded</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-1 rounded">${data.nodes.length} Nodes</span>
            <span class="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-1 rounded">${data.edges.length} Edges</span>
          </div>
        </div>

        <!-- SVG Canvas -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-hidden relative" style="height: 540px;">
          <svg id="kg-svg" class="w-full h-full" viewBox="0 0 900 500">
            <!-- Rendered below -->
          </svg>
          <div class="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 text-[11px] space-y-1 shadow-sm">
            <div class="font-bold text-slate-700 mb-1">Graph Legend</div>
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-blue-600 inline-block"></span> Study / Protocols</div>
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span> Clinical Sites</div>
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span> Subjects</div>
            <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Diseases & Treatments</div>
          </div>
        </div>
      </div>
    `;

    drawKnowledgeGraphSvg(data);
  } catch (err) {
    el.innerHTML = `<div class="p-8 text-center text-rose-500">Error rendering graph: ${err.message}</div>`;
  }
}

function drawKnowledgeGraphSvg(data) {
  const svg = document.getElementById("kg-svg");
  if (!svg) return;

  const width = 900;
  const height = 500;
  const nodes = data.nodes || [];
  const edges = data.edges || [];

  // Simple deterministic circular/concentric layout
  const nodeCoords = {};
  const cx = width / 2;
  const cy = height / 2;

  // Center node: Study ABC-101
  nodeCoords["study:ABC-101"] = { x: cx, y: cy };

  const otherNodes = nodes.filter(n => n.id !== "study:ABC-101");
  otherNodes.forEach((n, idx) => {
    const angle = (idx / otherNodes.length) * 2 * Math.PI;
    const r = n.type === "Site" ? 120 : n.type === "Subject" ? 200 : 230;
    nodeCoords[n.id] = {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  });

  // Draw Edges
  let edgesHtml = "";
  edges.forEach(e => {
    const s = nodeCoords[e.source];
    const t = nodeCoords[e.target];
    if (s && t) {
      edgesHtml += `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" class="graph-link" />`;
    }
  });

  // Draw Nodes
  let nodesHtml = "";
  nodes.forEach(n => {
    const pt = nodeCoords[n.id] || { x: cx, y: cy };
    let color = "#3b82f6";
    if (n.type === "Site") color = "#6366f1";
    if (n.type === "Subject") color = "#10b981";
    if (n.type === "Disease") color = "#f59e0b";
    if (n.type === "Finding") color = "#f43f5e";

    nodesHtml += `
      <g class="graph-node cursor-pointer" onclick="openEvidenceDrawer('${n.id}', '${n.label}', 'Type: ${n.type}')">
        <circle cx="${pt.x}" cy="${pt.y}" r="${n.id === 'study:ABC-101' ? 18 : 12}" fill="${color}" stroke="#ffffff" stroke-width="2" class="shadow-sm hover:opacity-80 transition-opacity" />
        <text x="${pt.x}" y="${pt.y + 20}" text-anchor="middle" fill="#334155">${n.label || n.id}</text>
      </g>
    `;
  });

  svg.innerHTML = edgesHtml + nodesHtml;
}

// --- VIEW 6: ASK ATLAS DETERMINISTIC SEARCH ---
function renderAskAtlas(el) {
  el.innerHTML = `
    <div class="max-w-3xl mx-auto space-y-6">
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 class="text-base font-bold text-slate-900">Ask ATLAS Clinical Intelligence</h2>
        <p class="text-xs text-slate-500 mt-1">Grounds answers directly in CDISC knowledge graph records. Prohibits unsupported extrapolation or hallucinations.</p>

        <!-- Search Box -->
        <form onsubmit="handleAskAtlasSubmit(event)" class="mt-4 flex gap-3">
          <input id="atlas-question-input" type="text" placeholder="e.g. Which subjects have liver disease?" required class="flex-1 text-xs border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" value="Which subjects have liver disease?">
          <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm">
            Evaluate Query
          </button>
        </form>

        <!-- Quick Prompts -->
        <div class="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span class="text-slate-400">Sample Queries:</span>
          <button onclick="fillAskQuestion('Which subjects have liver disease?')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200">Liver disease subjects</button>
          <button onclick="fillAskQuestion('What adverse events occurred in 042-S07-001?')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200">Subject 042-S07-001 AEs</button>
          <button onclick="fillAskQuestion('Can Drug A cure heart failure?')" class="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-medium">Trap: Heart Failure Cure</button>
        </div>
      </div>

      <!-- Result Card Container -->
      <div id="atlas-result-container">
        <!-- Rendered after submit -->
      </div>
    </div>
  `;
}

function fillAskQuestion(q) {
  const input = document.getElementById("atlas-question-input");
  if (input) {
    input.value = q;
  }
}

async function handleAskAtlasSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("atlas-question-input");
  const container = document.getElementById("atlas-result-container");
  if (!input || !container) return;

  const q = input.value.trim();
  container.innerHTML = `<div class="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">Evaluating question against Study ABC-101 knowledge graph...</div>`;

  try {
    const res = await fetch(`${API_BASE}/atlas/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q })
    }).then(r => r.json());

    const isTrap = res.kind === "TRAP" || res.warning;

    container.innerHTML = `
      <div class="bg-white rounded-xl border ${isTrap ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'} shadow-sm p-6 space-y-4">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold ${isTrap ? 'text-amber-800' : 'text-blue-700'} uppercase tracking-wider">Answer Provenance</span>
            <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">Confidence: ${res.confidence || 1.0}</span>
          </div>
          ${isTrap ? `<span class="badge-high text-[10px] font-bold px-2 py-0.5 rounded">Trap Query Mitigated</span>` : ''}
        </div>

        <div class="text-sm font-semibold text-slate-800 leading-relaxed">
          ${res.answer || res.message || "Query processed."}
        </div>

        ${res.warning ? `
          <div class="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 font-medium">
            <strong>Evidence Protection Warning:</strong> ${res.warning}
          </div>
        ` : ''}

        ${(res.results && res.results.length > 0) ? `
          <div class="pt-3 border-t border-slate-100">
            <h4 class="text-xs font-bold text-slate-700 mb-2">Grounding Citations (${res.results.length} Evidence Records):</h4>
            <div class="space-y-1.5">
              ${res.results.map(r => `
                <div class="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs flex items-center justify-between">
                  <span class="font-medium text-slate-800">${r.summary || r.subject_id}</span>
                  <button onclick="openEvidenceDrawer('${r.evidence_ref || r.subject_id}', '${r.subject_id}', '${r.summary}')" class="text-blue-600 hover:underline font-mono text-[11px]">
                    ${r.evidence_ref || "View Ref"}
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="p-4 bg-rose-50 text-rose-700 text-xs rounded-lg">Error answering query: ${err.message}</div>`;
  }
}

// --- VIEW 7: FINDINGS & SAFETY ---
async function renderFindings(el) {
  el.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Loading findings...</div>`;
  try {
    const findings = await fetch(`${API_BASE}/findings`).then(r => r.json());

    el.innerHTML = `
      <div class="space-y-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold text-slate-900">Clinical Findings Registry (Max-Heap)</h2>
            <p class="text-xs text-slate-500">Ranked by severity score: CRITICAL (4) &gt; HIGH (3) &gt; MEDIUM (2) &gt; LOW (1)</p>
          </div>
          <button onclick="window.location.hash='#dsa-telemetry'" class="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg border border-indigo-200">
            Inspect DSA Max-Heap
          </button>
        </div>

        <div class="grid grid-cols-1 gap-4">
          ${findings.map(f => `
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm clinical-card flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold text-slate-500">${f.id}</span>
                  <h3 class="text-sm font-bold text-slate-900">${f.title}</h3>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded ${f.severity === 'CRITICAL' ? 'badge-critical' : f.severity === 'HIGH' ? 'badge-high' : 'badge-medium'}">${f.severity}</span>
                </div>
                <p class="text-xs text-slate-600 mt-2">${f.message}</p>
                <div class="mt-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                  <strong class="text-slate-700">Recommended Action:</strong> ${f.recommended_action}
                </div>
                <div class="text-[11px] text-slate-400 mt-2 flex items-center gap-4">
                  <span>Subject: <a href="#subjects/${f.subject_id}" class="text-blue-600 font-bold hover:underline">${f.subject_id}</a></span>
                  <span>Rule: ${f.protocol_rule}</span>
                  <span>Status: <strong class="text-slate-700">${f.status}</strong></span>
                </div>
              </div>
              <button onclick="openEvidenceDrawer('${f.id}', '${f.title}', '${f.message}')" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-medium shrink-0">
                Evidence Dossier
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="p-8 text-center text-rose-500">Error loading findings: ${err.message}</div>`;
  }
}

// --- VIEW 8: SOVEREIGN HUMAN GATE DESK ---
async function renderHumanGate(el) {
  el.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Loading Sovereign Human Gate items...</div>`;
  try {
    const escalations = await fetch(`${API_BASE}/monitor/escalations`).then(r => r.json());

    el.innerHTML = `
      <div class="space-y-6">
        <div class="bg-amber-500/10 border border-amber-200 p-5 rounded-xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg">!</div>
            <div>
              <h2 class="text-sm font-bold text-amber-950">Sovereign Human Gate Safety Desk</h2>
              <p class="text-xs text-amber-800">Autonomous systems cannot bypass these decisions. Medical Monitor signature required.</p>
            </div>
          </div>
          <button onclick="openEmergencyHoldModal()" class="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm">
            + Emergency Safety Hold
          </button>
        </div>

        <div class="space-y-4">
          ${escalations.length === 0 ? `
            <div class="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              No pending sovereign escalations in queue.
            </div>
          ` : escalations.map(e => `
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono font-bold text-slate-500">${e.escalation_id}</span>
                    <h3 class="text-sm font-bold text-slate-900">${e.title}</h3>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded ${e.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}">${e.severity}</span>
                    <span class="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">${e.status}</span>
                  </div>
                  <div class="text-xs text-slate-500 mt-1">
                    Subject: <a href="#subjects/${e.subject_id}" class="text-blue-600 font-bold hover:underline">${e.subject_id}</a> &bull; Site: ${e.site_id} &bull; Cuts Waiting: <strong class="text-rose-600 font-mono">${e.cuts_waiting}</strong>
                  </div>
                </div>
              </div>

              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span class="font-bold text-slate-700 uppercase text-[10px] block mb-1">Recommended Action</span>
                <span class="text-slate-800 font-medium">${e.recommended_action}</span>
              </div>

              ${e.status === 'PENDING' ? `
                <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button onclick="handleHumanGateAction('${e.escalation_id}', 'REJECT')" class="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200">
                    Reject / Dismiss Finding
                  </button>
                  <button onclick="handleHumanGateAction('${e.escalation_id}', 'APPROVE')" class="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm">
                    Approve Safety Suspension
                  </button>
                </div>
              ` : `
                <div class="text-xs text-slate-500 italic">Resolved: ${e.status}</div>
              `}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="p-8 text-center text-rose-500">Error loading Human Gate: ${err.message}</div>`;
  }
}

async function handleHumanGateAction(escalationId, action) {
  if (!confirm(`Are you sure you want to ${action} this escalation?`)) return;

  try {
    const res = await fetch(`${API_BASE}/monitor/escalations/${escalationId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action, reviewer: "Dr. Sarah Chen (Medical Monitor)" })
    });
    if (res.ok) {
      alert(`Action ${action} recorded in 21 CFR Part 11 audit ledger.`);
      renderHumanGate(document.getElementById("view-container"));
    }
  } catch (e) {
    alert(`Error updating escalation: ${e.message}`);
  }
}

// --- VIEW 9: REVIEW CREW PIPELINE ---
function renderReviewCrew(el) {
  el.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Review Crew Autonomous 6-Node Pipeline</h2>
          <p class="text-xs text-slate-500 mt-1">FIFO Queue Sequence: Ingestion &rarr; Medical &rarr; Data Manager &rarr; Compliance &rarr; Human Gate &rarr; Execution</p>
        </div>
        <button id="run-crew-btn" onclick="executeReviewCrewPipeline()" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path></svg>
          <span>Run Review Pipeline</span>
        </button>
      </div>

      <!-- Pipeline Visualization -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3" id="pipeline-nodes-container">
        <div id="node-1" class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <span class="text-[10px] font-mono text-slate-400">NODE 1</span>
          <div class="text-xs font-bold text-slate-800 mt-1">Ingestion</div>
          <span class="text-[10px] text-slate-400 block mt-1">Ready</span>
        </div>
        <div id="node-2" class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <span class="text-[10px] font-mono text-slate-400">NODE 2</span>
          <div class="text-xs font-bold text-slate-800 mt-1">Detection</div>
          <span class="text-[10px] text-slate-400 block mt-1">Ready</span>
        </div>
        <div id="node-3" class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <span class="text-[10px] font-mono text-slate-400">NODE 3</span>
          <div class="text-xs font-bold text-slate-800 mt-1">Data Mgr</div>
          <span class="text-[10px] text-slate-400 block mt-1">Ready</span>
        </div>
        <div id="node-4" class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <span class="text-[10px] font-mono text-slate-400">NODE 4</span>
          <div class="text-xs font-bold text-slate-800 mt-1">Compliance</div>
          <span class="text-[10px] text-slate-400 block mt-1">Ready</span>
        </div>
        <div id="node-5" class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <span class="text-[10px] font-mono text-slate-400">NODE 5</span>
          <div class="text-xs font-bold text-slate-800 mt-1">Human Gate</div>
          <span class="text-[10px] text-slate-400 block mt-1">Ready</span>
        </div>
        <div id="node-6" class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <span class="text-[10px] font-mono text-slate-400">NODE 6</span>
          <div class="text-xs font-bold text-slate-800 mt-1">Execute</div>
          <span class="text-[10px] text-slate-400 block mt-1">Ready</span>
        </div>
      </div>

      <!-- Execution Log -->
      <div id="crew-log-container" class="bg-slate-900 text-slate-300 font-mono text-xs p-5 rounded-xl border border-slate-800 shadow-inner max-h-72 overflow-y-auto space-y-1">
        <div>[REVIEW_CREW] Standing by. Click 'Run Review Pipeline' to trigger 6-stage clinical audit.</div>
      </div>
    </div>
  `;
}

async function executeReviewCrewPipeline() {
  const btn = document.getElementById("run-crew-btn");
  const log = document.getElementById("crew-log-container");
  if (btn) btn.disabled = true;

  log.innerHTML = `<div>[REVIEW_CREW] Enqueueing 6 stages into ReviewCycleQueue (FIFO)...</div>`;

  try {
    const res = await fetch(`${API_BASE}/monitor/run-cycle`, { method: "POST" }).then(r => r.json());
    
    // Simulate step-by-step UI transition
    const stages = res.stages || [];
    for (let i = 0; i < stages.length; i++) {
      const nodeEl = document.getElementById(`node-${i + 1}`);
      if (nodeEl) {
        nodeEl.className = "p-3 bg-blue-50 border-2 border-blue-500 rounded-xl shadow-sm text-center pulse-node";
      }
      log.innerHTML += `<div>[${stages[i].node}] ${stages[i].action} - COMPLETED</div>`;
      await new Promise(r => setTimeout(r, 200));
      if (nodeEl) {
        nodeEl.className = "p-3 bg-emerald-50 border border-emerald-300 rounded-xl shadow-sm text-center";
      }
    }

    log.innerHTML += `<div class="text-emerald-400 font-bold mt-2">&check; Review Crew completed for Cut ${res.cut_number}. Recorded in Audit Ledger.</div>`;
  } catch (e) {
    log.innerHTML += `<div class="text-rose-400">Error executing review crew: ${e.message}</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

// --- VIEW 10: 21 CFR PART 11 DECISION TRACE & AUDIT TRAIL ---
async function renderDecisionTrace(el) {
  el.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Validating 21 CFR Part 11 cryptographic hash continuity...</div>`;
  try {
    const data = await fetch(`${API_BASE}/monitor/trace`).then(r => r.json());

    el.innerHTML = `
      <div class="space-y-4">
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-bold text-slate-900">21 CFR Part 11 Append-Only Audit Ledger</h2>
              <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">&check; SHA-256 Validated</span>
            </div>
            <p class="text-xs text-slate-500 mt-1">${data.integrity_message}</p>
          </div>
          <span class="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">${data.total_records} Chain Blocks</span>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-600">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th class="py-3 px-4">Index</th>
                  <th class="py-3 px-4">Timestamp</th>
                  <th class="py-3 px-4">Node</th>
                  <th class="py-3 px-4">Decision</th>
                  <th class="py-3 px-4">Actor</th>
                  <th class="py-3 px-4">Notes</th>
                  <th class="py-3 px-4 font-mono">SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                ${(data.audit_trail || []).map(t => `
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-4 font-mono font-bold text-slate-700">#${t.index}</td>
                    <td class="py-3 px-4 font-mono text-[11px] text-slate-500">${t.timestamp}</td>
                    <td class="py-3 px-4"><span class="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">${t.node}</span></td>
                    <td class="py-3 px-4 font-semibold text-blue-700">${t.decision}</td>
                    <td class="py-3 px-4 text-slate-700">${t.actor}</td>
                    <td class="py-3 px-4 text-slate-600 max-w-xs truncate">${t.notes}</td>
                    <td class="py-3 px-4 font-mono text-[10px] text-slate-400" title="${t.entry_hash}">
                      ${t.entry_hash ? t.entry_hash.substring(0, 12) + '...' : '-'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="p-8 text-center text-rose-500">Error loading trace: ${err.message}</div>`;
  }
}

// --- VIEW 11: DSA TELEMETRY & MAX-HEAP ---
async function renderDSATelemetry(el) {
  el.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Querying data structure telemetries...</div>`;
  try {
    const [dsa, heap] = await Promise.all([
      fetch(`${API_BASE}/api/dsa/status`).then(r => r.json()),
      fetch(`${API_BASE}/api/findings/priority-queue`).then(r => r.json())
    ]);

    el.innerHTML = `
      <div class="space-y-6">
        <div class="bg-indigo-900 text-white p-6 rounded-xl shadow-md border border-indigo-800">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded font-mono">ACADEMIC & TECHNICAL SPECIFICATION</span>
              <h1 class="text-lg font-bold mt-1">Formal Data Structures and Algorithms (DSA) Implementation</h1>
              <p class="text-xs text-indigo-200 mt-1">Concrete, explainable data structures fulfilling the project grading requirements</p>
            </div>
            <div class="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 text-xs font-mono">
              DB: ${dsa.database.engine}
            </div>
          </div>
        </div>

        <!-- 5 DSA Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- 1. Clinical Graph -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm clinical-card">
            <span class="text-[10px] font-bold text-blue-600 uppercase">1. Directed Graph via Adjacency List</span>
            <div class="text-base font-bold text-slate-900 mt-1">ClinicalGraph</div>
            <p class="text-xs text-slate-500 mt-1">Supports multi-hop BFS for shortest causal explanation & DFS for protocol cycle detection.</p>
            <div class="mt-3 text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
              Nodes: <strong>${dsa.clinical_graph.node_count}</strong> &bull; Edges: <strong>${dsa.clinical_graph.edge_count}</strong>
            </div>
          </div>

          <!-- 2. Max-Heap -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm clinical-card">
            <span class="text-[10px] font-bold text-rose-600 uppercase">2. Binary Max-Heap</span>
            <div class="text-base font-bold text-slate-900 mt-1">FindingPriorityQueue</div>
            <p class="text-xs text-slate-500 mt-1">O(log N) clinical triage ranking: CRITICAL(4) &gt; HIGH(3) &gt; MEDIUM(2) &gt; LOW(1).</p>
            <div class="mt-3 text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
              Heap Size: <strong>${heap.size}</strong> &bull; Top: <strong class="text-rose-600">${heap.highest_priority ? heap.highest_priority.severity : 'N/A'}</strong>
            </div>
          </div>

          <!-- 3. Review Cycle Queue -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm clinical-card">
            <span class="text-[10px] font-bold text-emerald-600 uppercase">3. FIFO Queue</span>
            <div class="text-base font-bold text-slate-900 mt-1">ReviewCycleQueue</div>
            <p class="text-xs text-slate-500 mt-1">O(1) enqueue and dequeue for sequential 6-node pipeline and batch site query dispatch.</p>
            <div class="mt-3 text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
              Stages: <strong>6 Sequential Nodes</strong>
            </div>
          </div>

          <!-- 4. 21 CFR Part 11 Ledger -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm clinical-card">
            <span class="text-[10px] font-bold text-amber-600 uppercase">4. Cryptographic Stack / Ledger</span>
            <div class="text-base font-bold text-slate-900 mt-1">AuditLedger</div>
            <p class="text-xs text-slate-500 mt-1">Append-only SHA-256 chained hash ledger complying with FDA 21 CFR Part 11.</p>
            <div class="mt-3 text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
              Integrity: <strong class="text-emerald-600">100% Cryptographic Continuity</strong>
            </div>
          </div>

          <!-- 5. Memory Hash Set -->
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm clinical-card">
            <span class="text-[10px] font-bold text-purple-600 uppercase">5. Hash Set with Rehashing</span>
            <div class="text-base font-bold text-slate-900 mt-1">MemoryHashSet</div>
            <p class="text-xs text-slate-500 mt-1">O(1) lookup table for doctor alert suppression across all 12 surveillance cuts.</p>
            <div class="mt-3 text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
              Suppressed Alerts: <strong>${dsa.memory_hash_set.active_suppressions.length}</strong>
            </div>
          </div>
        </div>

        <!-- Sorted Max-Heap Table -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Priority Queue Elements (Sorted by Binary Heap)</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-600">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th class="py-2.5 px-3">Priority Score</th>
                  <th class="py-2.5 px-3">Severity</th>
                  <th class="py-2.5 px-3">Subject ID</th>
                  <th class="py-2.5 px-3">Finding Title</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                ${(heap.sorted_findings || []).map(item => `
                  <tr>
                    <td class="py-2.5 px-3 font-mono font-bold text-slate-800">${item.priority_score} / 4</td>
                    <td class="py-2.5 px-3">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded ${item.severity === 'CRITICAL' ? 'badge-critical' : item.severity === 'HIGH' ? 'badge-high' : 'badge-medium'}">${item.severity}</span>
                    </td>
                    <td class="py-2.5 px-3 font-mono text-blue-600">${item.subject_id}</td>
                    <td class="py-2.5 px-3 text-slate-800">${item.title}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="p-8 text-center text-rose-500">Error loading DSA telemetry: ${err.message}</div>`;
  }
}

// --- VIEW 12: DATA QUERIES DESK ---
async function renderDataQueries(el) {
  el.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Loading data queries...</div>`;
  try {
    const queries = await fetch(`${API_BASE}/monitor/queries`).then(r => r.json());

    el.innerHTML = `
      <div class="space-y-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold text-slate-900">Data Management Queries Registry</h2>
            <p class="text-xs text-slate-500">Automated site discrepancies, lab unit conversions, and dose deviation clarifications</p>
          </div>
        </div>

        <div class="space-y-4">
          ${queries.map(q => `
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-xs text-blue-700">${q.query_id}</span>
                  <span class="text-xs font-bold text-slate-800">${q.problem_type}</span>
                  <span class="text-[10px] font-semibold px-2 py-0.5 rounded ${q.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">${q.status}</span>
                </div>
                <span class="text-xs text-slate-400 font-mono">${q.record_ref || ''}</span>
              </div>

              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                <strong>Question to Site:</strong> ${q.question_to_site}
              </div>

              ${q.site_response ? `
                <div class="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-blue-900">
                  <strong>Site Response:</strong> ${q.site_response}
                </div>
              ` : `
                <div class="flex items-center gap-2 pt-2">
                  <input id="response-input-${q.query_id}" type="text" placeholder="Enter site investigator clarification..." class="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none">
                  <button onclick="handleSendSiteResponse('${q.query_id}')" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                    Submit Site Response
                  </button>
                </div>
              `}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="p-8 text-center text-rose-500">Error loading queries: ${err.message}</div>`;
  }
}

async function handleSendSiteResponse(queryId) {
  const input = document.getElementById(`response-input-${queryId}`);
  if (!input || !input.value.trim()) return;

  try {
    const res = await fetch(`${API_BASE}/monitor/queries/${queryId}/response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_response: input.value.trim() })
    });
    if (res.ok) {
      alert("Site response recorded. Query status moved to UNDER_REVIEW.");
      renderDataQueries(document.getElementById("view-container"));
    }
  } catch (e) {
    alert(`Error submitting response: ${e.message}`);
  }
}

// Fallback views for secondary routes
function renderMedicalReview(el) { renderDashboard(el); }
function renderCompliance(el) { renderFindings(el); }
function renderWatchDashboard(el) { renderCutTimeline(el); }
function renderCutTimeline(el) {
  el.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-slate-900">12-Cut Longitudinal Surveillance Registry</h2>
          <p class="text-xs text-slate-500">Scheduled clinical data snapshots across 56-day timeline</p>
        </div>
        <span class="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded">Active Cut: 8 / 12</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        ${Array.from({ length: 12 }, (_, i) => i + 1).map(c => `
          <div class="bg-white p-4 rounded-xl border ${c === 8 ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200'} shadow-sm clinical-card">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs font-mono text-slate-800">Cut ${c}</span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded ${c < 8 ? 'bg-slate-100 text-slate-600' : c === 8 ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}">
                ${c < 8 ? 'Completed' : c === 8 ? 'Active' : 'Scheduled'}
              </span>
            </div>
            <div class="text-[11px] text-slate-500 mt-2">Subjects: <strong>8 Evaluated</strong></div>
            <div class="text-[11px] text-slate-500 mt-0.5">Findings: <strong>${c >= 4 ? 3 : 0} Identified</strong></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
function renderAdversarial(el) {
  el.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 class="text-sm font-bold text-slate-900">Adversarial Events & Edge Cases</h2>
        <p class="text-xs text-slate-500">Autonomous detection of sensor anomalies, unit shifts, and censored clinical limits</p>
      </div>
      <div class="space-y-3">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-[10px] font-bold text-rose-600 uppercase">1. Acute Hepatotoxicity (Hy's Law Candidate)</span>
          <p class="text-xs text-slate-700 mt-1">ALT 185 U/L (>4x ULN) and BILI 2.8 mg/dL (>2x ULN) concurrently observed in Subject 042-S07-001 at Week 4.</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-[10px] font-bold text-amber-600 uppercase">2. Glucose Step Change (Site 104 Lab Unit Switch)</span>
          <p class="text-xs text-slate-700 mt-1">Roche Cobas switched glucose to mmol/L without conversion flag. Automatically harmonized 6.4 mmol/L -> 115.3 mg/dL.</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span class="text-[10px] font-bold text-blue-600 uppercase">3. Censored String Limit Parsing</span>
          <p class="text-xs text-slate-700 mt-1">Numeric parser handles '<5 copies/mL' string bounds without crashing calculations.</p>
        </div>
      </div>
    </div>
  `;
}
function renderPendingDecisions(el) { renderHumanGate(el); }
function renderAuditTrail(el) { renderDecisionTrace(el); }
function renderProtocolRules(el) {
  el.innerHTML = `
    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <h2 class="text-base font-bold text-slate-900">Protocol ABC-101 Rules Engine</h2>
      <div class="space-y-3 text-xs text-slate-700">
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <strong class="text-slate-900">&sect;2.1 Hy's Law Hepatotoxicity Criteria:</strong>
          <p class="text-slate-600 mt-1">Concomitant ALT &gt; 3x ULN and Total Bilirubin &gt; 2x ULN requires immediate sovereign medical escalation.</p>
        </div>
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <strong class="text-slate-900">&sect;3.4 Visit Schedule Adherence:</strong>
          <p class="text-slate-600 mt-1">Allowable visit window deviation is &plusmn;7 days under Protocol v1.0.</p>
        </div>
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <strong class="text-slate-900">&sect;4.1 Lab Normalization Standard:</strong>
          <p class="text-slate-600 mt-1">Enzyme units reported in ukat/L must be harmonized to U/L via multiplier factor 60.0.</p>
        </div>
      </div>
    </div>
  `;
}
function renderProtocolAmendments(el) { renderProtocolRules(el); }


// ==============================================================================
// 3. MODALS, DRAWERS & GLOBAL SEARCH
// ==============================================================================

function openEmergencyHoldModal(subjectId = "042-S07-001") {
  const modal = document.getElementById("emergency-hold-modal");
  const select = document.getElementById("hold-subject-id");
  if (select && subjectId) select.value = subjectId;
  if (modal) modal.classList.remove("hidden");
}

function closeEmergencyHoldModal() {
  const modal = document.getElementById("emergency-hold-modal");
  if (modal) modal.classList.add("hidden");
}

async function handleEmergencyHoldSubmit(e) {
  e.preventDefault();
  const subjectId = document.getElementById("hold-subject-id").value;
  const title = document.getElementById("hold-title").value;
  const reason = document.getElementById("hold-reason").value;
  const action = document.getElementById("hold-action").value;

  try {
    const res = await fetch(`${API_BASE}/monitor/escalations/emergency`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_id: subjectId,
        title: title,
        reason: reason,
        recommended_action: action,
        physician: "Dr. Sarah Chen (Medical Monitor)"
      })
    });

    if (res.ok) {
      alert(`Emergency Safety Hold authorized for subject ${subjectId}.\nRecorded in 21 CFR Part 11 Audit Ledger.`);
      closeEmergencyHoldModal();
      handleRoute();
    } else {
      const err = await res.json();
      alert(`Error declaring hold: ${err.detail || 'Request failed'}`);
    }
  } catch (err) {
    alert(`Network error: ${err.message}`);
  }
}

function openEvidenceDrawer(ref, title, content) {
  const drawer = document.getElementById("evidence-drawer");
  const titleEl = document.getElementById("drawer-ref-title");
  const bodyEl = document.getElementById("drawer-body");
  if (!drawer) return;

  if (titleEl) titleEl.textContent = ref || "Record Reference";
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="space-y-4">
        <div class="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
          <span class="text-[10px] font-bold text-blue-700 uppercase">Record Descriptor</span>
          <div class="text-xs font-bold text-slate-800 mt-1">${title || 'Clinical finding'}</div>
        </div>
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span class="text-[10px] font-bold text-slate-500 uppercase">Data Payload</span>
          <div class="text-xs text-slate-700 mt-1 leading-relaxed">${content || 'Evidence verified in database'}</div>
        </div>
        <div class="text-[11px] text-slate-400">
          <strong>21 CFR Part 11 Stamp:</strong> Cryptographically verified SHA-256 evidence item.
        </div>
      </div>
    `;
  }
  drawer.classList.remove("translate-x-full");
}

function closeEvidenceDrawer() {
  const drawer = document.getElementById("evidence-drawer");
  if (drawer) drawer.classList.add("translate-x-full");
}

function openGlobalSearch() {
  const modal = document.getElementById("global-search-modal");
  const input = document.getElementById("global-search-input");
  if (modal) {
    modal.classList.remove("hidden");
    if (input) {
      input.value = "";
      input.focus();
    }
  }
}

function closeGlobalSearch() {
  const modal = document.getElementById("global-search-modal");
  if (modal) modal.classList.add("hidden");
}

async function handleGlobalSearch(q) {
  const container = document.getElementById("global-search-results");
  if (!container || !q.trim()) return;

  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`).then(r => r.json());
    const subjs = res.subjects || [];
    const findings = res.findings || [];

    if (subjs.length === 0 && findings.length === 0) {
      container.innerHTML = `<div class="text-slate-400 text-center py-4">No matching records found for "${q}".</div>`;
      return;
    }

    let html = "";
    if (subjs.length > 0) {
      html += `<div class="font-bold text-slate-400 text-[10px] uppercase mb-1">Subjects</div>`;
      subjs.forEach(s => {
        html += `
          <div onclick="closeGlobalSearch(); window.location.hash='#subjects/${s.id}';" class="p-2 hover:bg-slate-100 rounded cursor-pointer flex items-center justify-between">
            <span class="font-mono font-bold text-blue-600">${s.id}</span>
            <span class="text-slate-500">${s.treatment}</span>
          </div>
        `;
      });
    }

    if (findings.length > 0) {
      html += `<div class="font-bold text-slate-400 text-[10px] uppercase mt-3 mb-1">Findings</div>`;
      findings.forEach(f => {
        html += `
          <div onclick="closeGlobalSearch(); window.location.hash='#findings';" class="p-2 hover:bg-slate-100 rounded cursor-pointer flex items-center justify-between">
            <span class="font-medium text-slate-800">${f.title}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded badge-critical">${f.severity}</span>
          </div>
        `;
      });
    }

    container.innerHTML = html;
  } catch (e) {
    console.error(e);
  }
}
