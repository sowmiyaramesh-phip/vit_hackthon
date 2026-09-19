import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, HelpCircle, FileText, User, RefreshCw, MessageSquare } from 'lucide-react';
import { Study, Escalation } from '../types';
import { getEscalations, makeEscalationDecision } from '../api';

interface HumanGateScreenProps {
  study: Study;
  onViewEvidence: (evidence: any[]) => void;
  onSelectSubject?: (usubjid: string) => void;
  onNavigateToClarification?: () => void;
}

export const HumanGateScreen: React.FC<HumanGateScreenProps> = ({
  study,
  onViewEvidence,
  onSelectSubject,
  onNavigateToClarification
}) => {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'ALL' | 'APPROVED' | 'REJECTED' | 'CLARIFY'>('PENDING');
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | 'CLARIFY' | null>(null);
  const [reason, setReason] = useState('');
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchEscalations = async () => {
    setLoading(true);
    try {
      const data = await getEscalations(study.id, filter === 'ALL' ? undefined : filter);
      setEscalations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, [study.id, filter]);

  const handleOpenAction = (id: number, type: 'APPROVED' | 'REJECTED' | 'CLARIFY') => {
    setActioningId(id);
    setActionType(type);
    setReason('');
    setClarificationQuestion(
      type === 'CLARIFY'
        ? "Please retrieve subject's baseline ALT, total bilirubin, and recent concomitant medications to evaluate drug-induced liver injury risk."
        : ''
    );
  };

  const handleCancelAction = () => {
    setActioningId(null);
    setActionType(null);
    setReason('');
    setClarificationQuestion('');
  };

  const handleExecuteDecision = async (id: number) => {
    if (!actionType) return;
    setSubmitting(true);
    setFeedbackMsg(null);
    try {
      const res = await makeEscalationDecision(id, actionType, reason, clarificationQuestion);
      setFeedbackMsg(res.message || 'Decision recorded successfully.');
      handleCancelAction();
      await fetchEscalations();
    } catch (e: any) {
      alert(e.message || 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Human Gate & Escalation Approval</h1>
            <p className="text-sm text-slate-400">
              Autonomous review pipeline safety gate: Medical Monitors retain definitive sign-off on safety actions.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onNavigateToClarification && (
            <button
              onClick={onNavigateToClarification}
              className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Clarification Desk</span>
            </button>
          )}
          <button
            onClick={fetchEscalations}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-sm transition-colors"
            title="Refresh escalations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        {(['PENDING', 'ALL', 'APPROVED', 'REJECTED', 'CLARIFY'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              filter === tab
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 font-mono text-sm">Loading escalations...</div>
      ) : escalations.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-200">No Escalations In Queue</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            There are currently no escalations matching filter '{filter}'. High-severity clinical findings will appear here for Medical Monitor review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {escalations.map(esc => {
            const isActioning = actioningId === esc.id;
            return (
              <div
                key={esc.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 transition-all hover:border-slate-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {esc.escalation_code}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        esc.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        esc.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        esc.status === 'CLARIFY' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      }`}>
                        {esc.status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {esc.finding_code}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 font-semibold border border-rose-800/40">
                        {esc.severity}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{esc.finding_title}</h3>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    {esc.subject_id && onSelectSubject && (
                      <button
                        onClick={() => onSelectSubject(esc.subject_id)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg flex items-center space-x-1.5 border border-slate-700 font-mono"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{esc.subject_id}</span>
                      </button>
                    )}
                    <span className="px-2.5 py-1 bg-slate-800/60 rounded text-slate-400 font-mono">
                      Site: {esc.site_id}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-800/60 rounded text-slate-400 font-mono">
                      Protocol: {esc.protocol_version}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 rounded-lg p-4 border border-slate-800/80 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Proposed Safety Action</h4>
                    <p className="text-sm text-amber-200/90 font-medium">{esc.proposed_action}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Medical Reviewer Clinical Summary</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{esc.medical_review_summary}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => onViewEvidence(esc.evidence)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-medium"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Provenance Evidence ({esc.evidence?.length || 0} items)</span>
                  </button>
                  <div className="text-xs text-slate-500 font-mono">
                    Created: {new Date(esc.created_at).toLocaleString()}
                  </div>
                </div>

                {esc.decisions && esc.decisions.length > 0 && (
                  <div className="bg-slate-950/80 rounded-lg p-3.5 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Decision Audit History ({esc.decisions.length})
                    </span>
                    <div className="space-y-2">
                      {esc.decisions.map((d, i) => (
                        <div key={i} className="text-xs border-l-2 border-slate-700 pl-3 py-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold ${
                              d.decision === 'APPROVED' ? 'text-emerald-400' :
                              d.decision === 'REJECTED' ? 'text-red-400' : 'text-indigo-400'
                            }`}>{d.decision}</span>
                            <span className="text-slate-500 font-mono text-[11px]">{new Date(d.date).toLocaleString()}</span>
                          </div>
                          {d.reason && <p className="text-slate-300">Rationale: {d.reason}</p>}
                          {d.question && (
                            <div className="bg-indigo-950/40 p-2.5 rounded border border-indigo-900/50 mt-1 space-y-1.5">
                              <p className="text-indigo-300 font-medium">Clarification Requested: {d.question}</p>
                              {d.answer && (
                                <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 space-y-1">
                                  <span className="text-emerald-400 font-bold text-[11px] block">Knowledge Graph Clinical Findings Retrieval:</span>
                                  <p className="text-slate-200 whitespace-pre-wrap font-sans text-xs leading-relaxed">{d.answer}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isActioning ? (
                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={() => handleOpenAction(esc.id, 'APPROVED')}
                      className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>APPROVE ACTION</span>
                    </button>
                    <button
                      onClick={() => handleOpenAction(esc.id, 'REJECTED')}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>REJECT ACTION</span>
                    </button>
                    <button
                      onClick={() => handleOpenAction(esc.id, 'CLARIFY')}
                      className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>REQUEST CLARIFICATION</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        actionType === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                        actionType === 'REJECTED' ? 'bg-red-500/20 text-red-300' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        Confirm {actionType}
                      </span>
                      <button onClick={handleCancelAction} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
                    </div>
                    <div className="space-y-2">
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Medical Monitor review comment / regulatory justification..."
                        className="w-full h-20 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      {actionType === 'CLARIFY' && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-indigo-400">Clarification Question for Knowledge Graph & Trial Database:</label>
                          <textarea
                            value={clarificationQuestion}
                            onChange={(e) => setClarificationQuestion(e.target.value)}
                            placeholder="Specific clinical question to resolve before action execution..."
                            className="w-full h-16 bg-slate-900 border border-indigo-900/50 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end space-x-3 pt-2">
                      <button onClick={handleCancelAction} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">Cancel</button>
                      <button
                        onClick={() => handleExecuteDecision(esc.id)}
                        disabled={submitting}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-2"
                      >
                        {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>Submit Decision to Review Crew</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
