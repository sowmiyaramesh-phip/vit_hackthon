import React, { useEffect, useState } from "react";
import { AlertOctagon, ShieldAlert, ArrowRight, ShieldCheck, Database, FileText } from "lucide-react";
import { api } from "../services/api";
import { AdversarialEventItem } from "../types";
import { StatusBadge } from "../components/StatusBadge";

interface AdversarialEventsViewProps {
  onNavigate: (path: string) => void;
}

export const AdversarialEventsView: React.FC<AdversarialEventsViewProps> = ({ onNavigate }) => {
  const [events, setEvents] = useState<AdversarialEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getAdversarialEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-700">
            <AlertOctagon className="w-5 h-5" />
            <h1 className="text-xl font-bold text-slate-900">Adversarial & Data Integrity Surveillance</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous scanning for site reporting irregularities, sudden unit step-changes, and document tampering.
          </p>
        </div>

        <button
          onClick={() => onNavigate("/watch/explain?decision=D-012")}
          className="flex items-center px-3.5 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold hover:bg-purple-100 transition-colors"
        >
          View Decision D-012 Explanation <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      {/* Critical Principle Notice */}
      <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="block text-purple-950 font-bold mb-0.5">Classification Rule: Data Integrity vs Clinical Crisis</strong>
          When a site-wide metric experiences a step change whose ratio matches canonical unit conversion constants (e.g. <code>mmol/L</code> vs <code>mg/dL</code> factor <code>18.0182</code>), the system strictly classifies it as a <strong>DATA INTEGRITY ISSUE</strong>.
          Values are marked UNTRUSTED and quarantined, avoiding false patient emergency alarms.
        </div>
      </div>

      {/* Detected Events List */}
      <div className="space-y-4">
        {events.map((ev) => (
          <div
            key={ev.event_id}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <span className="font-mono font-bold text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  {ev.event_id}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {ev.anomaly_type.replace(/_/g, " ")}: Site {ev.site_id} ({ev.test_code})
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-100 text-purple-900 border border-purple-300">
                  {ev.classification}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-100 text-rose-800 border border-rose-300">
                  UNTRUSTED / QUARANTINED
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">{ev.description}</p>

            {/* Quantitative Evidence Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Baseline Median</span>
                <span className="font-bold text-slate-800">{ev.evidence_metrics.baseline_median} mg/dL</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Current Median</span>
                <span className="font-bold text-rose-600">{ev.evidence_metrics.current_median}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Observed Ratio</span>
                <span className="font-bold text-purple-700">{ev.evidence_metrics.ratio}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Expected Conversion Ratio</span>
                <span className="font-bold text-emerald-600">{ev.evidence_metrics.expected_conversion_ratio}</span>
              </div>
            </div>

            {/* Remediation Action */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
              <strong className="text-slate-900 block mb-1">Automated Governance Remediation:</strong>
              {ev.remediation_action}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onNavigate("/watch/explain?decision=D-012")}
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center"
              >
                Explain Decision D-012 <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
