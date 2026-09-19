import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Eye } from 'lucide-react';
import { Study, SubjectSummary } from '../types';
import { getSubjects } from '../api';

interface SubjectsScreenProps {
  study: Study;
  onSelectSubject: (usubjid: string) => void;
  onAddSubject: () => void;
}

export const SubjectsScreen: React.FC<SubjectsScreenProps> = ({
  study,
  onSelectSubject,
  onAddSubject
}) => {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSubjects(study.id, { q: search })
      .then(res => setSubjects(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [study.id, search]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Subjects Directory</h1>
          <p className="text-sm text-slate-400">Search, filter, and inspect longitudinal records for trial participants.</p>
        </div>
        <button
          onClick={onAddSubject}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Subject</span>
        </button>
      </div>

      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs">
        <Search className="w-4 h-4 text-slate-500 mr-2" />
        <input
          type="text"
          placeholder="Filter by Subject ID (e.g. 042-S02-004)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-slate-100 focus:outline-none w-full text-xs"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Subject ID</th>
                <th className="py-3 px-4">Site</th>
                <th className="py-3 px-4">Treatment Arm</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Current Visit</th>
                <th className="py-3 px-4">Open Findings</th>
                <th className="py-3 px-4">Open Queries</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    {loading ? 'Loading trial subjects...' : 'No subjects found matching your criteria.'}
                  </td>
                </tr>
              ) : (
                subjects.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                    onClick={() => onSelectSubject(s.usubjid)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                      {s.usubjid}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      Site {s.site_id}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {s.arm}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {s.current_visit}
                    </td>
                    <td className="py-3 px-4">
                      {s.open_findings_count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {s.open_findings_count} Finding(s)
                        </span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {s.open_queries_count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {s.open_queries_count} Query
                        </span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSubject(s.usubjid);
                        }}
                        className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View 360</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
