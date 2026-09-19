from pathlib import Path

sc_dir = Path("frontend/src/screens")

(sc_dir / "QueriesScreen.tsx").write_text("""import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { Study, DataQuery } from '../types';
import { getQueries, createQuery, respondToQuery } from '../api';

interface QueriesScreenProps {
  study: Study;
}

export const QueriesScreen: React.FC<QueriesScreenProps> = ({ study }) => {
  const [queries, setQueries] = useState<DataQuery[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<DataQuery | null>(null);
  const [responseText, setResponseText] = useState('');

  // Form
  const [subjectId, setSubjectId] = useState('042-S11-005');
  const [domain, setDomain] = useState('AE');
  const [recordId, setRecordId] = useState('AE-0002');
  const [problemDesc, setProblemDesc] = useState('');
  const [reqAction, setReqAction] = useState('Please verify against source documents and correct or confirm.');

  const loadQueries = () => {
    getQueries(study.id, statusFilter).then(setQueries).catch(() => {});
  };

  useEffect(() => {
    loadQueries();
  }, [study.id, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemDesc) return;
    await createQuery(study.id, {
      subject_id: subjectId,
      domain,
      record_id: recordId,
      problem_description: problemDesc,
      requested_action: reqAction
    });
    setShowNewModal(false);
    setProblemDesc('');
    loadQueries();
  };

  const handleAnswer = async () => {
    if (!selectedQuery || !responseText) return;
    await respondToQuery(selectedQuery.id, responseText);
    setSelectedQuery(null);
    setResponseText('');
    loadQueries();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Data Manager Queries</h1>
          <p className="text-sm text-slate-400">
            Actionable discrepancy management workflow with automated duplicate query suppression across cycles.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Query</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 text-xs border-b border-slate-800 pb-2">
        {['ALL', 'OPEN', 'CLOSED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-bold border transition ${
              statusFilter === st
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {st} QUERIES
          </button>
        ))}
      </div>

      {/* Queries List */}
      <div className="space-y-3">
        {queries.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm bg-slate-900 rounded-xl border border-slate-800">
            No data queries found matching the filter.
          </div>
        ) : (
          queries.map((q) => (
            <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-300">{q.query_code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      q.status === 'OPEN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {q.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Subject: <span className="text-slate-200 font-bold font-mono">{q.subject_id}</span> ({q.site_id})
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Record: {q.record_id}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">{q.problem_description}</div>
                </div>

                {q.status === 'OPEN' && (
                  <button
                    onClick={() => setSelectedQuery(q)}
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-500/30 transition"
                  >
                    Respond as Site
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <span className="font-semibold text-slate-300">Requested Action: </span>
                {q.requested_action}
              </div>

              {q.responses && q.responses.length > 0 && (
                <div className="space-y-1 pt-1">
                  {q.responses.map((r, ri) => (
                    <div key={ri} className="bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg text-xs space-y-0.5">
                      <div className="flex justify-between text-[10px] text-emerald-400 font-bold">
                        <span>Response from {r.role}</span>
                        <span>{r.date.split('T')[0]}</span>
                      </div>
                      <p className="text-slate-300">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Answer Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Respond to Query {selectedQuery.query_code}</h3>
            <p className="text-xs text-slate-400">{selectedQuery.problem_description}</p>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Site Coordinator Response / Resolution</label>
              <textarea
                rows={4}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="e.g. Source document verification confirms start date entry typo. Date updated in site medical record."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedQuery(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAnswer}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Submit Response & Close Query
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Query Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">Post Actionable Data Query</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Subject ID</label>
                <input
                  type="text"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Domain</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white"
                >
                  <option value="AE">AE (Adverse Event)</option>
                  <option value="LB">LB (Laboratory)</option>
                  <option value="VS">VS (Vital Signs)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Record ID</label>
                <input
                  type="text"
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Specific Problem Description</label>
                <textarea
                  rows={2}
                  value={problemDesc}
                  onChange={(e) => setProblemDesc(e.target.value)}
                  placeholder="Exact description of data discrepancy..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Requested Action</label>
                <input
                  type="text"
                  value={reqAction}
                  onChange={(e) => setReqAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold"
                >
                  Post Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
""", encoding="utf-8")

(sc_dir / "ComplianceScreen.tsx").write_text("""import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Building2, FileText } from 'lucide-react';
import { Study, ProtocolDeviation, SiteFlag } from '../types';
import { getDeviations, getSiteFlags } from '../api';

interface ComplianceScreenProps {
  study: Study;
}

export const ComplianceScreen: React.FC<ComplianceScreenProps> = ({ study }) => {
  const [deviations, setDeviations] = useState<ProtocolDeviation[]>([]);
  const [siteFlags, setSiteFlags] = useState<SiteFlag[]>([]);

  useEffect(() => {
    getDeviations(study.id).then(setDeviations).catch(() => {});
    getSiteFlags(study.id).then(setSiteFlags).catch(() => {});
  }, [study.id]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Compliance & Protocol Deviations</h1>
        <p className="text-sm text-slate-400">
          Evaluation against active protocol version ({study.current_protocol_version}). Subject deviations and site-level recurring patterns.
        </p>
      </div>

      {/* Site Flags Alert Banner */}
      {siteFlags.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase text-amber-400 tracking-wider flex items-center space-x-1.5">
            <Building2 className="w-4 h-4" />
            <span>Site-Level Non-Adherence Flags ({siteFlags.length})</span>
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {siteFlags.map((sf) => (
              <div key={sf.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-300">Site {sf.site_code} ({sf.site_name})</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                    {sf.recurring_count} Accumulated Deviations
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">{sf.reason}</p>
                <div className="text-[10px] text-slate-500">Action: Site re-training notice & coordinator audit required.</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deviations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-200">Protocol Deviations Registry</span>
          <span className="text-slate-400">{deviations.length} Active Deviations</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Deviation Code</th>
                <th className="p-3">Subject ID</th>
                <th className="p-3">Site</th>
                <th className="p-3">Protocol Version</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Violation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {deviations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No protocol deviations recorded under active protocol version.
                  </td>
                </tr>
              ) : (
                deviations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3 font-mono font-bold text-indigo-300">{d.deviation_code}</td>
                    <td className="p-3 font-mono text-slate-200">{d.subject_id}</td>
                    <td className="p-3 text-slate-300">{d.site_id}</td>
                    <td className="p-3 font-mono text-emerald-400">{d.protocol_version}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.severity === 'MAJOR' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 max-w-md">{d.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
""", encoding="utf-8")

print("Pair 8 written successfully")
