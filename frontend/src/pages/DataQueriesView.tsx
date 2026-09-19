import React, { useEffect, useState } from "react";
import { HelpCircle, CheckCircle, MessageSquare, Send, ArrowRight, ShieldCheck } from "lucide-react";
import { api } from "../services/api";
import { DataQueryItem } from "../types";
import { StatusBadge } from "../components/StatusBadge";

interface DataQueriesViewProps {
  onNavigate: (path: string) => void;
}

export const DataQueriesView: React.FC<DataQueriesViewProps> = ({ onNavigate }) => {
  const [queries, setQueries] = useState<DataQueryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuery, setActiveQuery] = useState<DataQueryItem | null>(null);
  const [siteReplyText, setSiteReplyText] = useState("");
  const [dmNotesText, setDmNotesText] = useState("");

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const data = await api.getQueries();
      setQueries(data);
      if (data.length > 0 && !activeQuery) {
        setActiveQuery(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSiteResponse = async () => {
    if (!activeQuery || !siteReplyText.trim()) return;
    try {
      await api.submitQueryResponse(activeQuery.query_id, siteReplyText);
      setSiteReplyText("");
      await fetchQueries();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDmReview = async (decision: "ACCEPT" | "REJECT") => {
    if (!activeQuery) return;
    try {
      await api.reviewQuery(activeQuery.query_id, decision, dmNotesText || "Verified by Data Management Lead.");
      setDmNotesText("");
      await fetchQueries();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600">
            <HelpCircle className="w-5 h-5" />
            <h1 className="text-xl font-bold text-slate-900">Data Manager: Actionable Queries Desk</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full query lifecycle management: OPEN → SITE RESPONSE → UNDER REVIEW → CLOSED.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Rule: Site response moves query to UNDER_REVIEW. Never auto-closed without DM validation.</span>
        </div>
      </div>

      {/* 2-Column Split: Query List & Detailed Lifecycle Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Query List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Active Queries ({queries.length})
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
            {queries.map((q) => {
              const isSelected = activeQuery?.query_id === q.query_id;
              return (
                <button
                  key={q.query_id}
                  onClick={() => setActiveQuery(q)}
                  className={`w-full text-left p-4 transition-colors flex flex-col space-y-1.5 ${
                    isSelected ? "bg-blue-50/70 border-l-4 border-blue-600" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">{q.query_id}</span>
                    <StatusBadge status={q.status} />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{q.problem_type}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Subject {q.subject_id} · {q.record_ref}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Lifecycle Desk */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-6">
          {activeQuery ? (
            <div className="space-y-5">
              {/* Top Meta */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-blue-700 text-sm">{activeQuery.query_id}</span>
                    <StatusBadge status={activeQuery.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{activeQuery.problem_type}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Subject: <strong className="font-mono">{activeQuery.subject_id}</strong> | Site: {activeQuery.site_id} | Record: <strong className="font-mono">{activeQuery.record_ref}</strong>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(`/subjects/${activeQuery.subject_id}`)}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center"
                >
                  Subject 360 <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>

              {/* Question dispatched to Site */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Question Dispatched to Investigative Site:
                </span>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed font-medium">
                  {activeQuery.question_to_site}
                </div>
              </div>

              {/* Site Response Section */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Site Response Status:
                </span>
                {activeQuery.site_response ? (
                  <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-950 leading-relaxed font-medium">
                    {activeQuery.site_response}
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2 text-xs">
                    <span className="text-amber-800 font-semibold block">Simulate Site Response:</span>
                    <input
                      type="text"
                      value={siteReplyText}
                      onChange={(e) => setSiteReplyText(e.target.value)}
                      placeholder="Enter site coordinator response..."
                      className="w-full p-2 bg-white border border-amber-200 rounded text-xs text-slate-900"
                    />
                    <button
                      onClick={handleSiteResponse}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition-colors flex items-center"
                    >
                      <Send className="w-3 h-3 mr-1" /> Submit Site Response
                    </button>
                  </div>
                )}
              </div>

              {/* DM Review & Formal Closure */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Data Manager Audit & Closure:
                </span>
                {activeQuery.status === "CLOSED" ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                    <div className="font-bold flex items-center mb-0.5">
                      <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Query Formally Closed
                    </div>
                    <p>{activeQuery.dm_review_notes || "Verified by Data Management Lead."}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={dmNotesText}
                      onChange={(e) => setDmNotesText(e.target.value)}
                      placeholder="Data Manager resolution notes..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 font-medium"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDmReview("ACCEPT")}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors flex items-center"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept & Close Query
                      </button>
                      <button
                        onClick={() => handleDmReview("REJECT")}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded text-xs font-semibold transition-colors"
                      >
                        Reject Response (Keep Open)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-xs text-slate-400">
              Select a query from the left list to review its lifecycle.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
