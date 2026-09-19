import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Study } from '../types';
import { createSubject } from '../api';

interface AddSubjectScreenProps {
  study: Study;
  onSubjectCreated: (usubjid: string) => void;
}

export const AddSubjectScreen: React.FC<AddSubjectScreenProps> = ({ study, onSubjectCreated }) => {
  const [usubjid, setUsubjid] = useState('');
  const [siteId, setSiteId] = useState('S02');
  const [age, setAge] = useState<number>(55);
  const [sex, setSex] = useState('M');
  const [arm, setArm] = useState('Active Drug A 50mg');
  const [screenDate, setScreenDate] = useState('2026-02-01');
  const [rfstdtc, setRfstdtc] = useState('2026-02-10');

  const [labs, setLabs] = useState<Array<{ test_code: string; raw_value: string; raw_unit: string; visit_name: string }>>([
    { test_code: 'ALT', raw_value: '38', raw_unit: 'U/L', visit_name: 'Screening' }
  ]);
  const [aes, setAes] = useState<Array<{ aeterm: string; severity: string; is_serious: string; is_hospitalized: string; start_date: string }>>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addLabRow = () => {
    setLabs([...labs, { test_code: 'ALT', raw_value: '', raw_unit: 'U/L', visit_name: 'Visit 2' }]);
  };

  const removeLabRow = (idx: number) => {
    setLabs(labs.filter((_, i) => i !== idx));
  };

  const addAeRow = () => {
    setAes([...aes, { aeterm: '', severity: 'MILD', is_serious: 'N', is_hospitalized: 'N', start_date: '2026-02-15' }]);
  };

  const removeAeRow = (idx: number) => {
    setAes(aes.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      study_id: study.id,
      site_id: siteId,
      usubjid: usubjid.trim(),
      age: Number(age),
      sex,
      arm,
      screen_date: screenDate,
      rfstdtc,
      labs: labs.filter(l => l.raw_value.trim() !== ''),
      adverse_events: aes.filter(a => a.aeterm.trim() !== '')
    };

    try {
      const res = await createSubject(study.id, payload);
      if (res.success) {
        onSubjectCreated(payload.usubjid);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save subject.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Add Clinical Trial Subject</h1>
        <p className="text-sm text-slate-400">
          Entering a new subject automatically triggers validation, normalization, Knowledge Graph mapping, and MONITOR availability.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Demographics */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">1. Demographics & Protocol Enrollment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Subject ID (USUBJID) *</label>
              <input
                type="text"
                placeholder="e.g. 042-S02-010"
                value={usubjid}
                onChange={(e) => setUsubjid(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Investigation Site</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="S02">Site S02 (Chicago)</option>
                <option value="S07">Site S07 (Boston)</option>
                <option value="S11">Site S11 (San Francisco)</option>
                <option value="102">Site 102 (Geneva)</option>
                <option value="103">Site 103 (Stockholm)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Treatment Arm</label>
              <input
                type="text"
                value={arm}
                onChange={(e) => setArm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Sex</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">First Dose Date (RFSTDTC)</label>
              <input
                type="date"
                value={rfstdtc}
                onChange={(e) => setRfstdtc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Labs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">2. Laboratory Measurements</h3>
            <button
              type="button"
              onClick={addLabRow}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lab Result</span>
            </button>
          </div>

          <div className="space-y-2">
            {labs.map((lb, idx) => (
              <div key={idx} className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                <select
                  value={lb.test_code}
                  onChange={(e) => {
                    const copy = [...labs];
                    copy[idx].test_code = e.target.value;
                    setLabs(copy);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                >
                  <option value="ALT">ALT</option>
                  <option value="AST">AST</option>
                  <option value="BILI">Total Bilirubin (BILI)</option>
                  <option value="CREAT">Creatinine</option>
                  <option value="VL">Viral Load (VL)</option>
                </select>

                <input
                  type="text"
                  placeholder="Raw value (e.g. 31, 3.995, <5)"
                  value={lb.raw_value}
                  onChange={(e) => {
                    const copy = [...labs];
                    copy[idx].raw_value = e.target.value;
                    setLabs(copy);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 flex-1"
                />

                <input
                  type="text"
                  placeholder="Raw unit (e.g. U/L, µkat/L)"
                  value={lb.raw_unit}
                  onChange={(e) => {
                    const copy = [...labs];
                    copy[idx].raw_unit = e.target.value;
                    setLabs(copy);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 w-24"
                />

                <input
                  type="text"
                  placeholder="Visit (e.g. Screening, Visit 2)"
                  value={lb.visit_name}
                  onChange={(e) => {
                    const copy = [...labs];
                    copy[idx].visit_name = e.target.value;
                    setLabs(copy);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 w-28"
                />

                <button
                  type="button"
                  onClick={() => removeLabRow(idx)}
                  className="p-1 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Adverse Events */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">3. Adverse Events (AEs)</h3>
            <button
              type="button"
              onClick={addAeRow}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Adverse Event</span>
            </button>
          </div>

          <div className="space-y-2">
            {aes.length === 0 ? (
              <div className="text-xs text-slate-500 py-2">No adverse events recorded for this subject yet.</div>
            ) : (
              aes.map((ae, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                  <input
                    type="text"
                    placeholder="AE Term (e.g. Headache, Cellulitis)"
                    value={ae.aeterm}
                    onChange={(e) => {
                      const copy = [...aes];
                      copy[idx].aeterm = e.target.value;
                      setAes(copy);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 flex-1"
                  />

                  <select
                    value={ae.severity}
                    onChange={(e) => {
                      const copy = [...aes];
                      copy[idx].severity = e.target.value;
                      setAes(copy);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  >
                    <option value="MILD">MILD</option>
                    <option value="MODERATE">MODERATE</option>
                    <option value="SEVERE">SEVERE</option>
                  </select>

                  <select
                    value={ae.is_hospitalized}
                    onChange={(e) => {
                      const copy = [...aes];
                      copy[idx].is_hospitalized = e.target.value;
                      setAes(copy);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  >
                    <option value="N">Hosp: No</option>
                    <option value="Y">Hosp: Yes (Hospitalized)</option>
                  </select>

                  <select
                    value={ae.is_serious}
                    onChange={(e) => {
                      const copy = [...aes];
                      copy[idx].is_serious = e.target.value;
                      setAes(copy);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  >
                    <option value="N">Serious: No</option>
                    <option value="Y">Serious: Yes</option>
                  </select>

                  <input
                    type="date"
                    value={ae.start_date}
                    onChange={(e) => {
                      const copy = [...aes];
                      copy[idx].start_date = e.target.value;
                      setAes(copy);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() => removeAeRow(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Validating & Saving...' : 'Validate & Save Subject'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
