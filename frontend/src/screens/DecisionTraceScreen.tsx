import React, { useState, useEffect } from 'react';
import { History, Filter, Search, User, RefreshCw, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Study, TraceEntry } from '../types';
import { getTraces } from '../api';

interface DecisionTraceScreenProps {
  study: Study;
  onSelectSubject?: (usubjid: string) => void;
}

export const DecisionTraceScreen: React.FC<DecisionTraceScreenProps> = ({
  study,
  onSelectSubject
}) => {
  const [traces, setTraces] = useState<TraceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodeFilter, setNodeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTraces = async () => {
    setLoading(true);
    try {
      const data = await getTraces(study.id, nodeFilter === 'ALL' ? undefined : nodeFilter);
      setTraces(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraces();
  }, [study.id, nodeFilter]);

  const filteredTraces = traces.filter(t => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (t.subject_id && t.subject_id.toLowerCase().includes(q)) ||
      (t.finding_id && t.finding_id.toLowerCase().includes(q)) ||
      (t.action && t.action.toLowerCase().includes(q)) ||
      (t.decision && t.decision.toLowerCase().includes(q)) ||
      (t.message && t.message.toLowerCase().includes(q)) ||
      (t.node_name && t.node_name.toLowerCase().includes(q))
    );
  });

  const getNodeBadgeClass = (node: string) => {
    switch (node) {
      case 'detect':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'medical_review':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'data_manager':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'compliance':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'human_gate':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'execute':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Review Crew Decision Trace</h1>
            <p className="text-sm text-slate-400">
              Immutable 21 CFR Part 11 compliant audit ledger: sequential execution trace across all 6 agent nodes.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchTraces}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-sm transition-colors"
            title="Refresh traces"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Node:</span>
          </span>
          {['ALL', 'detect', 'medical_review', 'data_manager', 'compliance', 'human_gate', 'execute'].map(n => (
            <button
              key={n}
              onClick={() => setNodeFilter(n)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                nodeFilter === n
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search trace actions, subjects, reasons..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Trace Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredTraces.length} recorded audit events</span>
          <span className="font-mono">Active Protocol: {study.current_protocol_version} | Cut: {study.current_cut}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 font-mono text-sm">Loading audit traces...</div>
        ) : filteredTraces.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-sm">
            No trace entries found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Agent Node</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Decision / Status</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Finding / Ref</th>
                  <th className="py-3 px-4">Message / Clinical Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[12px]">
                {filteredTraces.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getNodeBadgeClass(t.node_name)}`}>
                        {t.node_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-200">
                      {t.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        t.decision.includes('APPROV') ? 'bg-emerald-500/20 text-emerald-300' :
                        t.decision.includes('REJECT') ? 'bg-red-500/20 text-red-300' :
                        t.decision.includes('FLAG') || t.decision.includes('ESCALAT') ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {t.decision}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {t.subject_id ? (
                        <button
                          onClick={() => onSelectSubject && onSelectSubject(t.subject_id)}
                          className="text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1"
                        >
                          <User className="w-3 h-3" />
                          <span>{t.subject_id}</span>
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                      {t.finding_id || '—'}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-md break-words">
                      {t.message}
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
