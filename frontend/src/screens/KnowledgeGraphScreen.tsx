import React, { useState, useEffect } from 'react';
import { GitBranch, RefreshCw, Eye, Filter, Info } from 'lucide-react';
import { Study, VisualGraphData, GraphNode } from '../types';
import { getGraph, rebuildGraph } from '../api';

interface KnowledgeGraphScreenProps {
  study: Study;
  onSelectSubject?: (usubjid: string) => void;
}

export const KnowledgeGraphScreen: React.FC<KnowledgeGraphScreenProps> = ({ study, onSelectSubject }) => {
  const [graphData, setGraphData] = useState<VisualGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState('ALL');

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await getGraph(study.id);
      setGraphData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [study.id]);

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      await rebuildGraph(study.id);
      await loadGraph();
    } finally {
      setRebuilding(false);
    }
  };

  const filteredNodes = graphData?.nodes.filter(n => {
    if (filterType === 'ALL') return true;
    return n.type.toUpperCase() === filterType;
  }) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Study Knowledge Graph</h1>
          <p className="text-sm text-slate-400">
            Relational and semantic ontology connecting Study, Sites, Subjects, Visits, Labs, AEs, ConMeds, and Findings.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rebuilding ? 'animate-spin' : ''}`} />
            <span>{rebuilding ? 'Syncing...' : 'Rebuild Knowledge Graph'}</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 text-[11px] uppercase font-bold mr-1">Filter Nodes:</span>
        {['ALL', 'SUBJECT', 'LAB', 'ADVERSEEVENT', 'CONCOMITANTMEDICATION', 'FINDING'].map((ft) => (
          <button
            key={ft}
            onClick={() => setFilterType(ft)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              filterType === ft
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {ft}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Visual Graph Canvas */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[500px] flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span>Knowledge Graph Explorer</span>
            <span>{filteredNodes.length} Nodes Displayed</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Loading knowledge graph network...
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-3 overflow-y-auto max-h-[480px]">
              {filteredNodes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNode(n)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition flex flex-col justify-between space-y-1.5 ${
                    selectedNode?.id === n.id
                      ? 'bg-indigo-950/80 border-indigo-400 shadow-md ring-1 ring-indigo-400'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: n.color }}
                    >
                      {n.type}
                    </span>
                    {n.type === 'Subject' && onSelectSubject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSubject(n.id.replace('SUBJ:', ''));
                        }}
                        title="View Patient 360"
                        className="text-slate-400 hover:text-indigo-400"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="font-semibold text-slate-200 truncate text-[11px]">{n.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">{n.id}</div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Click any node to inspect connected relationships and clinical attributes.</span>
            <span>Backed by explicit DB Graph Abstraction</span>
          </div>
        </div>

        {/* Node Inspector Drawer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Info className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Node Property Inspector</h3>
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Node ID / Key</span>
                <p className="font-mono font-bold text-indigo-300 break-all">{selectedNode.id}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Label</span>
                <p className="font-semibold text-slate-200">{selectedNode.label}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Entity Category</span>
                <p className="font-medium text-slate-300">{selectedNode.type}</p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500">Clinical Attributes</span>
                <pre className="p-3 bg-slate-950 rounded-lg text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800/80">
                  {JSON.stringify(selectedNode.properties, null, 2)}
                </pre>
              </div>

              {selectedNode.type === 'Subject' && onSelectSubject && (
                <button
                  onClick={() => onSelectSubject(selectedNode.id.replace('SUBJ:', ''))}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition"
                >
                  Open Subject 360
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select any graph entity node on the canvas to inspect clinical provenance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
