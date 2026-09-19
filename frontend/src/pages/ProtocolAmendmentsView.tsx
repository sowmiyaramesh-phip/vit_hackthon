import React, { useState, useEffect } from "react";
import {
  ScrollText,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Download,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { api } from "../services/api";

export const ProtocolAmendmentsView: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"COMPARISON" | "V1" | "V2">("COMPARISON");

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const data = await api.getProtocols();
        setProtocols(data);
      } catch (e) {
        console.error(e);
        // Fallback protocol definitions
        setProtocols([
          {
            version: "v1.0",
            title: "Original Clinical Study Protocol",
            effective_date: "2024-11-01",
            status: "SUPERSEDED",
            tolerance_window: "±2 calendar days",
            sae_reporting_window: "24 hours",
            hys_law_threshold: "ALT/AST > 3x ULN + BILI > 2x ULN",
            dosing_rules: "Nominal dose ± 10% strictly enforced",
          },
          {
            version: "v2.0",
            title: "Protocol Amendment 1 (Expanded Visit Windows)",
            effective_date: "2025-02-20",
            status: "ACTIVE",
            tolerance_window: "±5 calendar days",
            sae_reporting_window: "24 hours",
            hys_law_threshold: "ALT/AST > 3x ULN + BILI > 2x ULN",
            dosing_rules: "Nominal dose ± 10%, allows verified temporary safety reductions",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProtocols();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-blue-600" />
            Protocol & Amendments Repository
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official CDISC study protocol specifications, amendment version histories, and version-dependent compliance rules.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate("/monitor/compliance")}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Audit Compliance</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("COMPARISON")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "COMPARISON"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Side-by-Side Version Comparison (v1.0 vs v2.0)
        </button>
        <button
          onClick={() => setActiveTab("V2")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "V2"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Protocol v2.0 (Active)
        </button>
        <button
          onClick={() => setActiveTab("V1")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "V1"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Protocol v1.0 (Superseded)
        </button>
      </div>

      {/* Side-by-Side Comparison Table */}
      {activeTab === "COMPARISON" && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Protocol Amendment Significance:</span> On February 20, 2025, Amendment 1 (v2.0) was formally approved. The primary modification was extending the scheduled visit tolerance window from <strong>±2 days</strong> to <strong>±5 days</strong>. Any monitoring audit run under v2.0 retroactively marks previously non-compliant visits (such as Day 32 on a Day 28 target) as compliant.
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <div className="p-3 md:col-span-4">Rule / Parameter</div>
              <div className="p-3 md:col-span-4 border-l border-slate-200">Protocol v1.0 (Original)</div>
              <div className="p-3 md:col-span-4 border-l border-slate-200 bg-blue-50/50 text-blue-950">
                Protocol v2.0 (Amendment 1 - Active)
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-12 p-3.5 items-center">
                <div className="md:col-span-4 font-semibold text-slate-900">
                  Scheduled Visit Tolerance
                  <div className="text-[11px] font-normal text-slate-400">SV domain visit adherence</div>
                </div>
                <div className="md:col-span-4 text-slate-700 md:border-l md:border-slate-100 md:pl-4">
                  <span className="font-mono font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    ± 2 calendar days
                  </span>
                  <div className="text-[11px] text-slate-400 mt-1">Strict. High non-compliance rate.</div>
                </div>
                <div className="md:col-span-4 text-blue-900 md:border-l md:border-slate-100 md:pl-4 bg-blue-50/20">
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ± 5 calendar days
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1">Expands window for participant travel flexibility.</div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-12 p-3.5 items-center">
                <div className="md:col-span-4 font-semibold text-slate-900">
                  Hy's Law Candidate Criteria
                  <div className="text-[11px] font-normal text-slate-400">FDA Drug-Induced Liver Injury guidance</div>
                </div>
                <div className="md:col-span-4 text-slate-700 md:border-l md:border-slate-100 md:pl-4">
                  <span className="font-mono">ALT &gt; 3x ULN &amp; BILI &gt; 2x ULN</span>
                  <div className="text-[11px] text-slate-400 mt-1">Mandates immediate drug hold &amp; repeat retest &lt; 48h.</div>
                </div>
                <div className="md:col-span-4 text-blue-900 md:border-l md:border-slate-100 md:pl-4 bg-blue-50/20">
                  <span className="font-mono font-bold">ALT &gt; 3x ULN &amp; BILI &gt; 2x ULN</span>
                  <div className="text-[11px] text-slate-500 mt-1">Unchanged. Retains rigorous hepatic safety safeguarding.</div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-12 p-3.5 items-center">
                <div className="md:col-span-4 font-semibold text-slate-900">
                  SAE Hospitalization Reporting
                  <div className="text-[11px] font-normal text-slate-400">AE domain seriousness flag</div>
                </div>
                <div className="md:col-span-4 text-slate-700 md:border-l md:border-slate-100 md:pl-4">
                  <span className="font-mono">Within 24 hours of awareness</span>
                </div>
                <div className="md:col-span-4 text-blue-900 md:border-l md:border-slate-100 md:pl-4 bg-blue-50/20">
                  <span className="font-mono font-bold">Within 24 hours of awareness</span>
                  <div className="text-[11px] text-slate-500 mt-1">Includes mandatory automated electronic sponsor notification.</div>
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-12 p-3.5 items-center">
                <div className="md:col-span-4 font-semibold text-slate-900">
                  Dose Modification Protocol
                  <div className="text-[11px] font-normal text-slate-400">EX domain administration rules</div>
                </div>
                <div className="md:col-span-4 text-slate-700 md:border-l md:border-slate-100 md:pl-4">
                  Fixed target dose. No permitted downward dose tier without Medical Monitor pre-clearance.
                </div>
                <div className="md:col-span-4 text-blue-900 md:border-l md:border-slate-100 md:pl-4 bg-blue-50/20">
                  Permits single downward step (100mg → 50mg) for Grade 2 gastrointestinal adverse events.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Version Views */}
      {activeTab !== "COMPARISON" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Study ABC-101 Protocol Specification ({activeTab === "V2" ? "v2.0" : "v1.0"})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Effective: {activeTab === "V2" ? "2025-02-20 (Current)" : "2024-11-01 (Superseded)"}
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                activeTab === "V2" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
              }`}
            >
              {activeTab === "V2" ? "ACTIVE PROTOCOL" : "SUPERSEDED"}
            </span>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Section 4.1: Visit Schedule</h3>
              <p className="mt-1">
                Patients attend scheduled on-site clinic visits at Screening, Baseline (Day 1), Week 2 (Day 14), Week 4 (Day 28), Week 8 (Day 56), Week 12 (Day 84), and Week 24 (Day 168).
                Allowed tolerance is {activeTab === "V2" ? "±5 calendar days" : "±2 calendar days"}.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-sm">Section 6.3: Hepatic Safety & Hy's Law</h3>
              <p className="mt-1">
                Serum ALT, AST, Total Bilirubin, and Alkaline Phosphatase are monitored at each scheduled visit. A patient meeting Hy's Law criteria (ALT or AST &gt; 3x ULN and Total Bilirubin &gt; 2x ULN) must be withheld from dosing immediately and undergo mandatory follow-up within 48 hours.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-sm">Section 7.2: Serious Adverse Event Reporting</h3>
              <p className="mt-1">
                All Serious Adverse Events, including inpatient hospitalization or persistent disability, must be reported to the Sponsor within 24 hours of initial site knowledge.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
