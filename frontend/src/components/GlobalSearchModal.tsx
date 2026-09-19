import React, { useState, useEffect } from "react";
import { Search, X, User, Activity, Pill, AlertTriangle, FileText, HelpCircle, CheckSquare, ArrowRight } from "lucide-react";
import { api } from "../services/api";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.globalSearch(query);
        setResults(res.results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Subject / Disease / Medication / Finding / Evidence / Query / Decision..."
            className="flex-1 bg-transparent border-0 text-sm font-medium text-slate-900 focus:outline-none placeholder-slate-400"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600 text-xs">
              Clear
            </button>
          )}
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categorized Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {loading && (
            <div className="text-center py-8 text-xs text-slate-400 animate-pulse">
              Querying clinical indices across study data...
            </div>
          )}

          {!loading && !results && !query && (
            <div className="text-center py-10 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">Type a search term to find study entities.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {["Liver disease", "042-S07-001", "Drug A", "ALT", "S04", "D-012"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && results && (
            <>
              {/* Subjects */}
              {results.subjects?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-blue-500" /> Subjects ({results.subjects.length})
                  </h4>
                  <div className="space-y-1">
                    {results.subjects.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onNavigate(`/subjects/${s.id}`);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-blue-50/50 flex items-center justify-between border border-transparent hover:border-blue-200 transition-all text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900 font-mono">{s.id}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600">{s.site}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500 font-medium">{s.treatment}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Diseases */}
              {results.diseases?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-1 text-purple-500" /> Diseases ({results.diseases.length})
                  </h4>
                  <div className="space-y-1">
                    {results.diseases.map((d: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onNavigate(`/disease-explorer?disease=${encodeURIComponent(d.condition)}`);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-purple-50/50 flex items-center justify-between border border-transparent hover:border-purple-200 transition-all text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{d.condition}</span>
                          <span className="text-slate-500 ml-2">Recorded for {d.subject_id}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {results.medications?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                    <Pill className="w-3.5 h-3.5 mr-1 text-teal-500" /> Medications ({results.medications.length})
                  </h4>
                  <div className="space-y-1">
                    {results.medications.map((m: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onNavigate(`/subjects/${m.subject_id}`);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-teal-50/50 flex items-center justify-between border border-transparent hover:border-teal-200 transition-all text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{m.medication}</span>
                          <span className="text-slate-500 ml-2 font-mono">({m.dose})</span>
                          <span className="text-slate-400 ml-2">Subject {m.subject_id}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Findings */}
              {results.findings?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" /> Findings ({results.findings.length})
                  </h4>
                  <div className="space-y-1">
                    {results.findings.map((f: any) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          onNavigate(`/findings/${f.id}`);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-amber-50/50 flex items-center justify-between border border-transparent hover:border-amber-200 transition-all text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{f.title}</span>
                          <span className="text-slate-400 ml-2">[{f.subject_id}]</span>
                        </div>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-100 text-amber-800">
                          {f.severity}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Decisions */}
              {results.decisions?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                    <CheckSquare className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Decisions ({results.decisions.length})
                  </h4>
                  <div className="space-y-1">
                    {results.decisions.map((dec: any) => (
                      <button
                        key={dec.decision_id}
                        onClick={() => {
                          onNavigate(`/watch/explain?decision=${dec.decision_id}`);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-emerald-50/50 flex items-center justify-between border border-transparent hover:border-emerald-200 transition-all text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 font-mono">{dec.decision_id}: </span>
                          <span className="text-slate-700">{dec.title}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence */}
              {results.evidence?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" /> Evidence Records
                  </h4>
                  <div className="space-y-1">
                    {results.evidence.map((ev: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 bg-slate-50 rounded border border-slate-200 text-xs font-mono text-slate-700"
                      >
                        {ev.summary}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex justify-between items-center">
          <span>Categorized by CDISC SDTM domain and study protocol</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
