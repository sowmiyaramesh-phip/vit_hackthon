import React, { useState, useEffect } from 'react';
import { HelpCircle, Database, CheckCircle2, ShieldCheck, Filter, Search, User, RefreshCw, Layers } from 'lucide-react';
import { Study, DataQuery } from '../types';
import { getQueries } from '../api';

interface QueryHistoryScreenProps {
  study: Study;
  onSelectSubject?: (usubjid: string) => void;
}

export const QueryHistoryScreen: React.FC<QueryHistoryScreenProps> = ({
  study,
  onSelectSubject
}) => {
  const [queries, setQueries] = useState<DataQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const data = await getQueries(study.id, statusFilter === 'ALL' ? undefined : statusFilter);
      setQueries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [study.id, statusFilter]);

  const filteredQueries = queries.filter(q => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      q.query_code.toLowerCase().includes(s) ||
      (q.subject_id && q.subject_id.toLowerCase().includes(s)) ||
      (q.site_id && q.site_id.toLowerCase().includes(s)) ||
      q.domain.toLowerCase().includes(s) ||
      q.problem_description.toLowerCase().includes(s)
    );
  });

  const openCount = queries.filter(q => q.status === 'OPEN').length;
  const answeredCount = queries.filter(q => q.status === 'ANSWERED').length;
  const closedCount = queries.filter(q => q.status === 'CLOSED').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Query Audit Ledger & Persistent Memory</h1>
            <p className="text-sm text-slate-400">
              Cross-cycle query registry with zero-duplicate suppression across repeated cuts.
            </p>
          </div>
        </div>

        <button
          onClick={fetchQueries}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-sm transition-colors"
          title="Refresh queries"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Persistent Memory Highlight Banner */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <Database className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">Cross-Cycle Deduplication Guaranteed</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              MONITOR maintains a persistent hash key for every discrepancy rule + record ID combination. When a data cut is re-evaluated or a cumulative cut is processed, existing open or resolved queries are preserved with 0 duplicate query re-issues.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-emerald-400">0 DUPLICATES ON RERUN</span>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Queries Raised</span>
          <span className="text-2xl font-mono font-bold text-slate-100 mt-2 block">{queries.length}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">In persistent database</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Open / Action Required</span>
          <span className="text-2xl font-mono font-bold text-amber-400 mt-2 block">{openCount}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Pending CRA investigation</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Answered by Site</span>
          <span className="text-2xl font-mono font-bold text-cyan-400 mt-2 block">{answeredCount}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Awaiting DM closure</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Closed & Verified</span>
          <span className="text-2xl font-mono font-bold text-emerald-400 mt-2 block">{closedCount}</span>
          <span className="text-[11px] text-slate-500 mt-1 block">Data cleaned</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          {['ALL', 'OPEN', 'ANSWERED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search query code, domain, subject, issue..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 font-mono text-sm">Loading query ledger...</div>
        ) : filteredQueries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-sm">
            No queries matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Query Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Domain / Record</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Site</th>
                  <th className="py-3 px-4">Cut #</th>
                  <th className="py-3 px-4">Discrepancy Issue</th>
                  <th className="py-3 px-4">Requested Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-sans text-xs">
                {filteredQueries.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {q.query_code}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        q.status === 'OPEN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        q.status === 'ANSWERED' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 mr-1.5">{q.domain}</span>
                      {q.record_id}
                    </td>
                    <td className="py-3 px-4">
                      {q.subject_id ? (
                        <button
                          onClick={() => onSelectSubject && onSelectSubject(q.subject_id)}
                          className="font-mono text-blue-400 hover:underline"
                        >
                          {q.subject_id}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {q.site_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      Cut {q.cut_number}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-200">
                      {q.problem_description}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-400 text-[11px]">
                      {q.requested_action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
