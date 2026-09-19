import React, { useEffect, useState } from "react";
import { UserCheck, ShieldAlert, Check, X, HelpCircle, ArrowRight, ShieldCheck, History, FileText, AlertOctagon, PlusCircle } from "lucide-react";
import { api } from "../services/api";
import { HumanEscalationItem } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { EvidenceDrawer } from "../components/EvidenceDrawer";

interface HumanGateViewProps {
  onNavigate: (path: string) => void;
}

export const HumanGateView: React.FC<HumanGateViewProps> = ({ onNavigate }) => {
  const [escalations, setEscalations] = useState<HumanEscalationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  // Rejection modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Clarification modal state
  const [clarifyingId, setClarifyingId] = useState<string | null>(null);
  const [clarificationQuestion, setClarificationQuestion] = useState(
    "Was elevated ALT present at screening?"
  );

  // Emergency Escalation modal state
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencySubjectId, setEmergencySubjectId] = useState("SUBJ-101");
  const [emergencyTitle, setEmergencyTitle] = useState("Acute Grade 4 Hepatotoxicity - Emergency IP Hold");
  const [emergencySeverity, setEmergencySeverity] = useState("CRITICAL");
  const [emergencyAction, setEmergencyAction] = useState("Immediately suspend Investigational Product dosing; schedule urgent hepatic ultrasound & ICU consult");
  const [emergencyReason, setEmergencyReason] = useState("Site PI reported acute jaundice with ALT > 12x ULN and Total Bilirubin > 3x ULN post-dose 3. Emergency hold mandated per Protocol §4.3.");
  const [emergencyPhysician, setEmergencyPhysician] = useState("Dr. Sarah Chen, MD (Lead Medical Monitor)");
  const [isSubmittingEmergency, setIsSubmittingEmergency] = useState(false);
  const [emergencyNotice, setEmergencyNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchEscalations();
  }, []);

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      const data = await api.getEscalations();
      setEscalations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.processHumanGateAction(id, {
        action: "APPROVE",
        reviewer: "Dr. Sarah Chen (Medical Monitor)",
        notes: "Clinically confirmed via laboratory panel review.",
      });
      await fetchEscalations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectionReason.trim()) return;
    try {
      await api.processHumanGateAction(rejectingId, {
        action: "REJECT",
        reviewer: "Dr. Sarah Chen (Medical Monitor)",
        rejection_reason: rejectionReason,
      });
      setRejectingId(null);
      setRejectionReason("");
      await fetchEscalations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClarify = async () => {
    if (!clarifyingId || !clarificationQuestion.trim()) return;
    try {
      await api.processHumanGateAction(clarifyingId, {
        action: "CLARIFY",
        reviewer: "Dr. Sarah Chen (Medical Monitor)",
        clarification_question: clarificationQuestion,
      });
      setClarifyingId(null);
      await fetchEscalations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmergencyEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencySubjectId || !emergencyTitle.trim() || !emergencyAction.trim()) return;
    try {
      setIsSubmittingEmergency(true);
      const res = await api.createEmergencyEscalation({
        subject_id: emergencySubjectId,
        title: emergencyTitle.trim(),
        severity: emergencySeverity,
        recommended_action: emergencyAction.trim(),
        reason: emergencyReason.trim(),
        physician: emergencyPhysician,
      });
      setEmergencyNotice(res.message || "Emergency safety hold committed to Human Gate.");
      setEmergencyModalOpen(false);
      await fetchEscalations();
      setTimeout(() => setEmergencyNotice(null), 7000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to submit emergency escalation: " + (err?.message || "Internal server error"));
    } finally {
      setIsSubmittingEmergency(false);
    }
  };

  const pendingList = escalations.filter((e) => e.status === "PENDING");
  const historyList = escalations.filter((e) => e.status !== "PENDING");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-600">
            <UserCheck className="w-5 h-5" />
            <h1 className="text-xl font-bold text-slate-900">Human Gate: Sovereign Reviewer Desk</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mandatory checkpoint for Medical Monitor authorization. Actions committed here create immutable 21 CFR Part 11 decision traces.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setEmergencyModalOpen(true)}
            className="flex items-center px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <AlertOctagon className="w-3.5 h-3.5 mr-1" />
            + Emergency Safety Hold
          </button>
          <button
            onClick={() => onNavigate("/monitor/trace")}
            className="flex items-center px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <History className="w-3.5 h-3.5 mr-1 text-slate-500" /> View Decision Trace
          </button>
        </div>
      </div>

      {emergencyNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{emergencyNotice}</span>
          </div>
          <button onClick={() => setEmergencyNotice(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pending Escalations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Pending Escalations ({pendingList.length})
          </h2>
          <span className="text-xs text-slate-500">Silence is never interpreted as approval</span>
        </div>

        {loading ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            Loading pending human escalations...
          </div>
        ) : pendingList.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            No pending escalations awaiting human review.
          </div>
        ) : (
          pendingList.map((esc) => (
            <div
              key={esc.escalation_id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4"
            >
              {/* Card Top */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800">
                    {esc.escalation_id}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{esc.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">
                    Subject: <strong className="text-blue-700 font-mono">{esc.subject_id}</strong>
                  </span>
                  <StatusBadge status={esc.severity} />
                  {esc.cuts_waiting > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-900">
                      {esc.cuts_waiting} CUTS WAITING
                    </span>
                  )}
                </div>
              </div>

              {/* Recommendation & Clinical Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <span className="font-semibold text-slate-600 uppercase tracking-wider text-[10px] block">
                    Review Recommendation:
                  </span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                    {esc.recommended_action}
                  </div>

                  <span className="font-semibold text-slate-600 uppercase tracking-wider text-[10px] block pt-1">
                    Governing Protocol Rules:
                  </span>
                  <div className="space-y-1">
                    {esc.protocol_evidence?.map((pe, idx) => (
                      <div key={idx} className="p-2 bg-blue-50/50 rounded border border-blue-100 text-blue-900 font-mono text-[11px]">
                        {pe.section}: {pe.title}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-semibold text-slate-600 uppercase tracking-wider text-[10px] block">
                    Supporting Clinical Evidence:
                  </span>
                  <div className="space-y-1">
                    {esc.clinical_evidence?.map((ce, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedEvidence(ce.summary)}
                        className="w-full text-left p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 font-mono text-[11px] text-slate-700 flex items-center justify-between"
                      >
                        <span>{ce.summary}</span>
                        <span className="text-blue-600 text-[10px] font-sans font-semibold">Inspect</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clarification History (if any) */}
              {esc.clarification_history?.length > 0 && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2 text-xs">
                  <span className="font-bold text-blue-950 uppercase tracking-wider text-[10px] flex items-center">
                    <HelpCircle className="w-3.5 h-3.5 mr-1 text-blue-600" /> Evidence Clarification Retrieved:
                  </span>
                  {esc.clarification_history.map((clr, idx) => (
                    <div key={idx} className="space-y-1 bg-white p-2.5 rounded border border-blue-100">
                      <div className="font-semibold text-blue-900">Q: {clr.question}</div>
                      <p className="text-slate-700 leading-relaxed text-[11px]">{clr.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Sovereign Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                  <span>Reviewer: <strong>Dr. Sarah Chen</strong></span>
                  <span>·</span>
                  <button
                    onClick={() => onNavigate(`/subjects/${esc.subject_id}`)}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Open Subject 360
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setClarifyingId(esc.escalation_id);
                      setClarificationQuestion("Was elevated ALT present at screening?");
                    }}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold flex items-center transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 mr-1" /> CLARIFY
                  </button>
                  <button
                    onClick={() => {
                      setRejectingId(esc.escalation_id);
                      setRejectionReason("Clinically deemed monitoring-only observation; risk acceptable.");
                    }}
                    className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold flex items-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> REJECT
                  </button>
                  <button
                    onClick={() => handleApprove(esc.escalation_id)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> APPROVE
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-900">Downgrade Escalation to Monitoring</h3>
            <p className="text-xs text-slate-600">
              Please provide a clinical justification for rejecting this escalation. This justification will be preserved in persistent memory and the item will not automatically re-escalate in the next cycle.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      {clarifyingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-fade-in">
            <div className="flex items-center space-x-2 text-blue-600">
              <HelpCircle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Request Evidence Clarification</h3>
            </div>
            <p className="text-xs text-slate-600">
              Pose a clinical inquiry to the ATLAS knowledge graph. The engine will retrieve ground-truth records and formulate an evidence-grounded answer before resubmitting to the Human Gate.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Inquiry Question:</label>
              <input
                type="text"
                value={clarificationQuestion}
                onChange={(e) => setClarificationQuestion(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setClarifyingId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleClarify}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
              >
                Retrieve Evidence & Clarify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Safety Hold Modal */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-lg w-full p-6 space-y-4 animate-fade-in my-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Direct Medical Monitor Safety Hold</h3>
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                    Protocol §4.3: Emergency Sovereign Intervention (21 CFR Part 11)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Medical Monitors maintain statutory authority to bypass routine batch cuts and directly mandate immediate safety holds for acute toxicity, unblinded safety signals, or adverse events.
            </p>

            <form onSubmit={handleEmergencyEscalate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Target Subject ID *
                  </label>
                  <select
                    value={emergencySubjectId}
                    onChange={(e) => setEmergencySubjectId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                  >
                    <option value="SUBJ-101">SUBJ-101 (Site S01)</option>
                    <option value="SUBJ-102">SUBJ-102 (Site S01)</option>
                    <option value="SUBJ-103">SUBJ-103 (Site S02)</option>
                    <option value="SUBJ-104">SUBJ-104 (Site S03)</option>
                    <option value="SUBJ-201">SUBJ-201 (Site S04)</option>
                    <option value="SUBJ-202">SUBJ-202 (Site S04)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Severity Level *
                  </label>
                  <select
                    value={emergencySeverity}
                    onChange={(e) => setEmergencySeverity(e.target.value)}
                    className="w-full p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-800"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Hold)</option>
                    <option value="HIGH">HIGH (Urgent Review)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Escalation Title *
                </label>
                <input
                  type="text"
                  required
                  value={emergencyTitle}
                  onChange={(e) => setEmergencyTitle(e.target.value)}
                  placeholder="e.g. Acute Grade 4 Hepatotoxicity - Emergency IP Hold"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mandated Intervention / Action *
                </label>
                <textarea
                  required
                  rows={2}
                  value={emergencyAction}
                  onChange={(e) => setEmergencyAction(e.target.value)}
                  placeholder="e.g. Immediately suspend Investigational Product dosing; schedule urgent hepatic imaging..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Physician Clinical Rationale & Findings *
                </label>
                <textarea
                  required
                  rows={2}
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  placeholder="Clinical observations, investigator communications, or laboratory rationale..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Authorized Medical Monitor
                </label>
                <input
                  type="text"
                  value={emergencyPhysician}
                  onChange={(e) => setEmergencyPhysician(e.target.value)}
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Creates unalterable Part 11 audit entry</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setEmergencyModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEmergency}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center space-x-1 disabled:opacity-50"
                  >
                    <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                    {isSubmittingEmergency ? "Authorizing..." : "Commit Safety Hold"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={Boolean(selectedEvidence)}
        onClose={() => setSelectedEvidence(null)}
        evidenceRef={selectedEvidence}
      />
    </div>
  );
};
