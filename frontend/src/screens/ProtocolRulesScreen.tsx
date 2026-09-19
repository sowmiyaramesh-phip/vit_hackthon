import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Layers, RefreshCw } from 'lucide-react';
import { Study } from '../types';
import { getProtocols } from '../api';

interface ProtocolRulesScreenProps {
  study: Study;
}

export const ProtocolRulesScreen: React.FC<ProtocolRulesScreenProps> = ({ study }) => {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string>(study.current_protocol_version || 'v2.0');

  const fetchProtocols = async () => {
    setLoading(true);
    try {
      const data = await getProtocols(study.id);
      setProtocols(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocols();
  }, [study.id]);

  const activeProtocol = protocols.find(p => p.version === selectedVersion) || protocols[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Protocol Rules & Version Management</h1>
            <p className="text-sm text-slate-400">
              Protocol amendments, tolerance thresholds, and automated rule engines for GCP clinical monitoring.
            </p>
          </div>
        </div>

        {/* Version Switcher */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {['v1.0', 'v2.0'].map((ver) => (
            <button
              key={ver}
              onClick={() => setSelectedVersion(ver)}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-colors ${
                selectedVersion === ver
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Protocol {ver}
              {ver === study.current_protocol_version && ' (Active)'}
            </button>
          ))}
        </div>
      </div>

      {/* Protocol Version Comparison Card */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-800/40 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>Protocol Amendment Comparator: v1.0 (Baseline) vs v2.0 (Tightened Amendment)</span>
          </span>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/50">
            Amendment Effective: Cycle Cut 2+
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Protocol v1.0 (Initial Protocol)</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Legacy</span>
            </div>
            <ul className="space-y-1.5 text-slate-400 list-disc list-inside leading-relaxed">
              <li>Visit Window Tolerance: <strong className="text-slate-200">+/- 7 days</strong> from scheduled target date.</li>
              <li>Dose Compliance Threshold: <strong className="text-slate-200">&gt;= 75%</strong> of expected doses taken.</li>
              <li>Hy's Law Candidate: ALT &gt;= 3x ULN and Total Bilirubin &gt;= 2x ULN.</li>
              <li>SAE Notification Window: 48 hours from initial site awareness.</li>
            </ul>
          </div>

          <div className="bg-slate-950/80 border border-purple-500/40 rounded-xl p-4 space-y-2 shadow-lg shadow-purple-950/30">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300">Protocol v2.0 (FDA/EMA Amendment)</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono font-bold">Tightened</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed">
              <li>Visit Window Tolerance: <strong className="text-purple-300">+/- 3 days</strong> (Flagged deviations increase for off-schedule visits).</li>
              <li>Dose Compliance Threshold: <strong className="text-purple-300">&gt;= 80%</strong> (Detects missed doses earlier).</li>
              <li>Hy's Law Candidate: ALT &gt;= 3x ULN and Total Bilirubin &gt;= 2x ULN, with ALP &lt; 2x ULN.</li>
              <li>SAE Notification Window: <strong className="text-purple-300">24 hours</strong> from site awareness (Stricter escalation trigger).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Rules Registry for Selected Protocol */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Active Automated Rule Engines for Protocol {selectedVersion}</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {activeProtocol?.rules?.length || 4} Rules Configured
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  RULE-DILI-HY-LAW
                </span>
                <span className="text-xs font-bold text-slate-200">Drug-Induced Liver Injury (Hy's Law)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-900/30 text-rose-300 border border-rose-800/30 font-semibold">
                  CRITICAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Triggered when subject serum ALT is &gt;= 3x upper limit of normal (ULN) simultaneously with total bilirubin &gt;= 2x ULN. Flags immediate safety escalation to Human Gate.
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                ACTIVE
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  RULE-SAE-MISCODE
                </span>
                <span className="text-xs font-bold text-slate-200">Serious Adverse Event Miscoding Audit</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-800/30 font-semibold">
                  HIGH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Detects discrepancy where AESER is coded as 'N' but AEACN indicates hospitalization (AESHOSP = 'Y') or permanent disability. Proposes expedited SAE reclassification.
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                ACTIVE
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  RULE-VISIT-TOLERANCE
                </span>
                <span className="text-xs font-bold text-slate-200">Protocol Visit Window Tolerance Check</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-800/30 font-semibold">
                  MEDIUM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Compares actual visit date (SV.SVDTC) against target schedule. Allowed window: {selectedVersion === 'v1.0' ? '+/- 7 days' : '+/- 3 days'}. Discrepancies logged as protocol deviations.
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                ACTIVE
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  RULE-DOSE-COMPLIANCE
                </span>
                <span className="text-xs font-bold text-slate-200">Investigational Product Exposure & Compliance</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-800/30 font-semibold">
                  MEDIUM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audits EX domain dosing logs. Flags subjects who received &lt; {selectedVersion === 'v1.0' ? '75%' : '80%'} of scheduled investigational product.
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
