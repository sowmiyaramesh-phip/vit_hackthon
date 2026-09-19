import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const ValidationScreen: React.FC = () => {
  const normalizationRules = [
    {
      rule: 'Unit Harmonization (µkat/L → U/L)',
      formula: 'Value × 60',
      example: '3.995 µkat/L × 60 = 239.7 U/L',
      status: 'ACTIVE & ENFORCED'
    },
    {
      rule: 'Total Bilirubin Harmonization (SI → US)',
      formula: 'Value ÷ 17.1',
      example: '34.2 µmol/L ÷ 17.1 = 2.0 mg/dL',
      status: 'ACTIVE & ENFORCED'
    },
    {
      rule: 'Creatinine Harmonization (SI → US)',
      formula: 'Value ÷ 88.4',
      example: '176.8 µmol/L ÷ 88.4 = 2.0 mg/dL',
      status: 'ACTIVE & ENFORCED'
    },
    {
      rule: 'Censored Values Representation (<5, ND)',
      formula: 'Structured Dict: {value, operator: "<", is_censored: true}',
      example: "'<5' preserved as below detection limit; never compared as zero",
      status: 'ACTIVE & ENFORCED'
    },
    {
      rule: 'European Comma Decimals',
      formula: "Replace ',' with '.' and parse float",
      example: "'14,2' parsed to 14.2",
      status: 'ACTIVE & ENFORCED'
    },
    {
      rule: 'Canonical Date Parsing',
      formula: 'Multi-format parser (ISO, DD-MM-YYYY, DD/MM/YYYY) → YYYY-MM-DD',
      example: "'15-01-2026' → '2026-01-15'",
      status: 'ACTIVE & ENFORCED'
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Data Validation & Normalization Service</h1>
        <p className="text-sm text-slate-400">
          Deterministic mathematical rules ensure clinical trial biomarkers and temporal data are harmonized before entering the Knowledge Graph.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Active Clinical Normalization Pipelines</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            6 of 6 Deterministic Rules Active
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 text-xs">
          {normalizationRules.map((r, i) => (
            <div key={i} className="p-4 hover:bg-slate-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-semibold text-slate-200">{r.rule}</div>
                <div className="font-mono text-indigo-400 text-[11px]">{r.formula}</div>
                <div className="text-slate-400 text-[11px]">Worked example: {r.example}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap self-start sm:self-auto">
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
