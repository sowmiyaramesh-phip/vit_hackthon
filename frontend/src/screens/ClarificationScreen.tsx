import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, XCircle, MessageSquare, RefreshCw, Send, User, Database } from 'lucide-react';
import { Study, Escalation } from '../types';
import { getEscalations, makeEscalationDecision } from '../api';

interface ClarificationScreenProps {
  study: Study;
  onViewEvidence: (evidence: any[]) => void;
  onSelectSubject?: (usubjid: string) => void;
}

export const ClarificationScreen: React.FC<ClarificationScreenProps> = ({
  study,
  onViewEvidence,
  onSelectSubject
}) => {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [selectedEsc, setSelectedEsc] = useState<Escalation | null>(null);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClarifications = async () => {
    setLoading(true);
    try {
      const data = await getEscalations(study.id);
      const withClarify = data.filter(e => e.status === 'CLARIFY' || (e.decisions && e.decisions.some(d => d.decision === 'CLARIFY')));
      setEscalations(withClarify.length > 0 ? withClarify : data);
      if (withClarify.length > 0 && !selectedEsc) {
        setSelectedEsc(withClarify[0]);
      } else if (data.length > 0 && !selectedEsc) {
        setSelectedEsc(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClarifications();
  }, [study.id]);

  const handleSendClarify = async () => {
    if (!selectedEsc || !newQuestion.trim()) return;
    setSubmitting(true);
    try {
      await makeEscalationDecision(selectedEsc.id, 'CLARIFY', 'Clarification requested via Clarification Desk', newQuestion);
      setNewQuestion('');
      await fetchClarifications();
    } catch (e: any) {
      alert(e.message || 'Failed to submit clarification question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedEsc) return;
    setSubmitting(true);
    try {
      await makeEscalationDecision(selectedEsc.id, decision, decisionReason || `Resolved following clarification review`);
      setDecisionReason('');
      await fetchClarifications();
    } catch (e: any) {
      alert(e.message || 'Failed to resolve escalation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Medical Monitor Clarification Desk</h1>
            <p className="text-sm text-slate-400">
              Human-in-the-loop clinical query resolution: probe the Trial Knowledge Graph to resolve edge-case ambiguities.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Escalation list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3 h-[750px] flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Clarification Cases ({escalations.length})
            </span>
            <button
              onClick={fetchClarifications}
              disabled={loading}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {escalations.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No active clarification threads.</p>
            ) : (
              escalations.map(esc => {
                const isSelected = selectedEsc?.id === esc.id;
                return (
                  <div
                    key={esc.id}
                    onClick={() => setSelectedEsc(esc)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-300">{esc.escalation_code}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        esc.status === 'CLARIFY' ? 'bg-indigo-500/20 text-indigo-300' :
                        esc.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                        esc.status === 'REJECTED' ? 'bg-red-500/20 text-red-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {esc.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-semibold truncate mt-1">{esc.finding_title}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                      <span>{esc.subject_id}</span>
                      <span>Site: {esc.site_id}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center/Right column: Clarification dialogue and resolution */}
        <div className="lg:col-span-2 space-y-4">
          {selectedEsc ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
              {/* Selected Escalation Details */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {selectedEsc.escalation_code}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{selectedEsc.finding_code}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 font-semibold border border-rose-800/40">
                      {selectedEsc.severity}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-100 mt-1.5">{selectedEsc.finding_title}</h2>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  {selectedEsc.subject_id && onSelectSubject && (
                    <button
                      onClick={() => onSelectSubject(selectedEsc.subject_id)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg flex items-center space-x-1.5 border border-slate-700 font-mono"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{selectedEsc.subject_id}</span>
                    </button>
                  )}
                  <button
                    onClick={() => onViewEvidence(selectedEsc.evidence)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-medium"
                  >
                    View Evidence
                  </button>
                </div>
              </div>

              {/* Proposed Action */}
              <div className="bg-slate-950/60 rounded-lg p-4 border border-slate-800/80 space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proposed Action:</span>
                <p className="text-xs text-amber-200/90 font-medium">{selectedEsc.proposed_action}</p>
                <p className="text-xs text-slate-400 mt-1">{selectedEsc.medical_review_summary}</p>
              </div>

              {/* Interactive Conversation / Clarification Threads */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>Clarification Exchange & Knowledge Graph Inferences</span>
                </h3>

                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
                  {selectedEsc.decisions && selectedEsc.decisions.some(d => d.question) ? (
                    selectedEsc.decisions.filter(d => d.question).map((d, i) => (
                      <div key={i} className="space-y-2">
                        {/* Question Bubble */}
                        <div className="bg-indigo-950/50 border border-indigo-900/60 rounded-xl p-4 ml-8 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-indigo-300 flex items-center space-x-1.5">
                              <User className="w-3.5 h-3.5" />
                              <span>Medical Monitor Clarification Inquiry</span>
                            </span>
                            <span className="text-indigo-400/60 font-mono text-[11px]">{new Date(d.date).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-indigo-100 font-medium">{d.question}</p>
                        </div>

                        {/* System Answer Bubble */}
                        <div className="bg-slate-950 border border-emerald-900/40 rounded-xl p-4 mr-8 space-y-2">
                          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold">
                            <Database className="w-4 h-4" />
                            <span>Trial Knowledge Graph Retrieval Output</span>
                          </div>
                          <p className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                            {d.answer || 'Query executed: No additional conflicting records detected for this subject in the active cut.'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                      No previous clarification questions on this escalation. You may ask one below to inspect baseline labs, concomitant medications, or adverse event timelines.
                    </div>
                  )}
                </div>
              </div>

              {/* Ask Follow-up Clarification Form */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-indigo-300 flex items-center space-x-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Submit Clinical Clarification Request:</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="e.g., What was the subject's baseline ALT, total bilirubin, and recent concomitant medications?"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSendClarify}
                    disabled={submitting || !newQuestion.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Query System</span>
                  </button>
                </div>
              </div>

              {/* Final Medical Monitor Resolution */}
              <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Final Decision Post-Clarification
                  </span>
                </div>
                <input
                  type="text"
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="Medical rationale for final resolution (e.g., Baseline ALT was normal, concomitant medication not hepatotoxic, approve escalation)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => handleResolve('REJECTED')}
                    disabled={submitting}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Escalation</span>
                  </button>
                  <button
                    onClick={() => handleResolve('APPROVED')}
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Escalation</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 font-mono text-xs">
              Select an escalation on the left to inspect clarification dialogue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
