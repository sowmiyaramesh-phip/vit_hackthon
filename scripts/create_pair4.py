from pathlib import Path

sc_dir = Path("frontend/src/screens")

(sc_dir / "ImportScreen.tsx").write_text("""import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Study } from '../types';

interface ImportScreenProps {
  study: Study;
  onImportComplete: () => void;
}

export const ImportScreen: React.FC<ImportScreenProps> = ({ study, onImportComplete }) => {
  const [fileType, setFileType] = useState('CSV');
  const [domain, setDomain] = useState('LB');
  const [fileName, setFileName] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'IDLE' | 'PARSING' | 'VALIDATING' | 'SUCCESS'>('IDLE');
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  const sampleCsv = `USUBJID,VISIT,LBTESTCD,LBORRES,LBORRESU,LBDTC
042-S02-011,Screening,ALT,34,U/L,2026-02-01
042-S02-011,Visit 2,ALT,3.85,µkat/L,2026-02-15
042-S02-011,Visit 2,VL,<5,copies/mL,2026-02-15`;

  const handleSimulatedUpload = () => {
    setFileName(`batch_clinical_import_${domain.toLowerCase()}.csv`);
    setUploadStatus('PARSING');
    setTimeout(() => {
      setPreviewRows([
        { USUBJID: '042-S02-011', VISIT: 'Screening', LBTESTCD: 'ALT', LBORRES: '34', LBORRESU: 'U/L', LBDTC: '2026-02-01' },
        { USUBJID: '042-S02-011', VISIT: 'Visit 2', LBTESTCD: 'ALT', LBORRES: '3.85', LBORRESU: 'µkat/L', LBDTC: '2026-02-15' },
        { USUBJID: '042-S02-011', VISIT: 'Visit 2', LBTESTCD: 'VL', LBORRES: '<5', LBORRESU: 'copies/mL', LBDTC: '2026-02-15' }
      ]);
      setUploadStatus('VALIDATING');
    }, 600);
  };

  const handleCommit = () => {
    setUploadStatus('SUCCESS');
    setTimeout(() => {
      onImportComplete();
    }, 1200);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Clinical Trial Data Ingestion</h1>
        <p className="text-sm text-slate-400">
          Upload SDTM domains (DM, LB, AE, VS, CM, EX, SV). Automatic parsing, normalization, and duplicate suppression.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Source Format</label>
            <div className="flex space-x-2">
              {['CSV', 'XLSX', 'JSON'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFileType(fmt)}
                  className={`px-4 py-2 rounded-lg font-bold border transition ${
                    fileType === fmt ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Clinical Domain</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
            >
              <option value="LB">LB (Laboratory Biomarkers)</option>
              <option value="AE">AE (Adverse Events)</option>
              <option value="VS">VS (Vital Signs)</option>
              <option value="CM">CM (Concomitant Medications)</option>
              <option value="EX">EX (Exposure / Dosing)</option>
            </select>
          </div>
        </div>

        {/* Dropzone */}
        <div
          onClick={handleSimulatedUpload}
          className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition space-y-3"
        >
          <div className="inline-flex p-3 rounded-full bg-indigo-500/10 text-indigo-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {fileName ? fileName : `Click to select or drop ${fileType} file`}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Supports CDISC SDTM compliant files up to 50MB</p>
          </div>
        </div>

        {/* Preview & Validation Report */}
        {previewRows.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Parsed Records Preview ({previewRows.length} rows)</span>
              <span className="text-xs text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validation Passed: 0 Errors, 1 Censored Limit Detected</span>
              </span>
            </div>

            <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto text-xs">
              <table className="w-full text-left font-mono">
                <thead className="bg-slate-900 text-slate-400 text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">USUBJID</th>
                    <th className="p-2.5">VISIT</th>
                    <th className="p-2.5">TEST</th>
                    <th className="p-2.5">RAW VAL</th>
                    <th className="p-2.5">NORMALIZED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {previewRows.map((r, i) => (
                    <tr key={i}>
                      <td className="p-2.5 text-indigo-300">{r.USUBJID}</td>
                      <td className="p-2.5">{r.VISIT}</td>
                      <td className="p-2.5">{r.LBTESTCD}</td>
                      <td className="p-2.5">{r.LBORRES} {r.LBORRESU}</td>
                      <td className="p-2.5 text-emerald-400">
                        {r.LBORRES === '<5' ? '<5 (Censored)' : `${(parseFloat(r.LBORRES) * (r.LBORRESU === 'µkat/L' ? 60 : 1)).toFixed(1)} U/L`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCommit}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-lg transition"
              >
                <span>Commit {previewRows.length} Normalized Records</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {uploadStatus === 'SUCCESS' && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Records committed successfully to study database and Knowledge Graph synchronized!</span>
          </div>
        )}
      </div>
    </div>
  );
};
""", encoding="utf-8")

(sc_dir / "ValidationScreen.tsx").write_text("""import React from 'react';
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
""", encoding="utf-8")

print("Pair 4 written successfully")
