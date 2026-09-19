import React, { useState, useEffect } from 'react';
import { Building2, Calendar, AlertCircle, MessageSquare, CheckCircle2, User, Send, RefreshCw, Clock } from 'lucide-react';
import { Study, DataQuery } from '../types';
import { getSiteOperations, respondToQuery, getQueries } from '../api';

interface SiteOperationsScreenProps {
  study: Study;
  onSelectSubject?: (usubjid: string) => void;
}

export const SiteOperationsScreen: React.FC<SiteOperationsScreenProps> = ({
  study,
  onSelectSubject
}) => {
  const [siteId, setSiteId] = useState<string>('042');
  const [data, setData] = useState<any | null>(null);
  const [siteQueries, setSiteQueries] = useState<DataQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingQueryId, setRespondingQueryId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchSiteData = async () => {
    setLoading(true);
    try {
      const [opData, allQueries] = await Promise.all([
        getSiteOperations(siteId, study.id).catch(() => null),
        getQueries(study.id).catch(() => [])
      ]);
      setData(opData);
      setSiteQueries(allQueries.filter((q: DataQuery) => q.site_id === siteId || q.site_id === `SITE-${siteId}`));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteData();
  }, [study.id, siteId]);

  const handleSendResponse = async (queryId: number) => {
    if (!responseText.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await respondToQuery(queryId, responseText);
      setFeedback('Query response dispatched to Data Management.');
      setRespondingQueryId(null);
      setResponseText('');
      await fetchSiteData();
    } catch (e: any) {
      alert(e.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Site Operations & CRA Desk</h1>
            <p className="text-sm text-slate-400">
              Site coordinator workstation: daily schedule, participant tracking, and query discrepancy resolution.
            </p>
          </div>
        </div>

        {/* Site Switcher */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {['042', '043', '044'].map((s) => (
              <button
                key={s}
                onClick={() => setSiteId(s)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-colors ${
                  siteId === s ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Site {s}
              </button>
            ))}
          </div>
          <button
            onClick={fetchSiteData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Enrolled Subjects</span>
            <User className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-slate-100 mt-2">{data?.active_subjects_count ?? 2}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Active on protocol</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Upcoming / Today's Visits</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-blue-400 mt-2">{data?.scheduled_visits?.length ?? 1}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Scheduled windows</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Site Action Queries</span>
            <MessageSquare className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-mono font-bold text-amber-400 mt-2">
            {siteQueries.filter(q => q.status === 'OPEN').length}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Requires CRA clarification</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Site Quality Status</span>
            <AlertCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-emerald-400 mt-3">GOOD STANDING</p>
          <span className="text-[11px] text-slate-500 mt-1 block">GCP Compliant</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's / Upcoming Visits */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Participant Visit Schedule & Protocol Milestones</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Site {siteId}</span>
          </div>

          <div className="space-y-3">
            {data?.scheduled_visits && data.scheduled_visits.length > 0 ? (
              data.scheduled_visits.map((v: any, i: number) => (
                <div key={i} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSelectSubject && onSelectSubject(v.usubjid)}
                        className="font-mono text-xs font-bold text-blue-400 hover:underline"
                      >
                        {v.usubjid}
                      </button>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {v.visit_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{v.target_date} (Tolerance: +/- 3 days)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {v.tests_due || 'Labs & ECG Due'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 bg-slate-950/40 rounded-lg text-center text-xs text-slate-500 font-mono">
                No immediate visits scheduled for today.
              </div>
            )}
          </div>
        </div>

        {/* Actionable Queries Requiring Site Response */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Open Queries Assigned to Site {siteId}</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">{siteQueries.length} total</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {siteQueries.length === 0 ? (
              <div className="p-8 bg-slate-950/40 rounded-lg text-center text-xs text-slate-500 font-mono">
                No active queries assigned to this site.
              </div>
            ) : (
              siteQueries.map((q) => (
                <div key={q.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{q.query_code}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        q.status === 'OPEN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {q.status}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{q.domain}</span>
                    </div>
                    {q.subject_id && onSelectSubject && (
                      <button
                        onClick={() => onSelectSubject(q.subject_id)}
                        className="text-xs font-mono text-blue-400 hover:underline"
                      >
                        {q.subject_id}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300">{q.problem_description}</p>
                  <p className="text-xs text-amber-200/80 bg-amber-950/20 p-2 rounded border border-amber-900/30">
                    <strong>Action:</strong> {q.requested_action}
                  </p>

                  {/* Prior Responses */}
                  {q.responses && q.responses.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                      {q.responses.map((r, ri) => (
                        <div key={ri} className="bg-slate-900 p-2 rounded border border-slate-800/80">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span className="font-bold text-slate-300">{r.role}</span>
                            <span className="font-mono">{new Date(r.date).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-200">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Respond form */}
                  {respondingQueryId === q.id ? (
                    <div className="pt-2 space-y-2">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Type CRA / Site Coordinator clarification or data correction details..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        rows={2}
                      />
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => { setRespondingQueryId(null); setResponseText(''); }}
                          className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendResponse(q.id)}
                          disabled={submitting}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded text-xs font-bold flex items-center space-x-1"
                        >
                          {submitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                          <span>Submit Answer</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => { setRespondingQueryId(q.id); setResponseText(''); }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Reply / Clarify Query</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
