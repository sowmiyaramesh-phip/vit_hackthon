import React, { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RefreshCw, Filter, Info, ShieldCheck } from "lucide-react";
import { GraphData } from "../types";

interface InteractiveGraphProps {
  data: GraphData;
  onSelectNode?: (node: any) => void;
  height?: string;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Study: { bg: "#1e293b", border: "#0f172a", text: "#ffffff" },
  Site: { bg: "#3b82f6", border: "#2563eb", text: "#ffffff" },
  Subject: { bg: "#0284c7", border: "#0369a1", text: "#ffffff" },
  Disease: { bg: "#9333ea", border: "#7e22ce", text: "#ffffff" },
  Treatment: { bg: "#0d9488", border: "#0f766e", text: "#ffffff" },
  Medication: { bg: "#059669", border: "#047857", text: "#ffffff" },
  Visit: { bg: "#64748b", border: "#475569", text: "#ffffff" },
  Lab: { bg: "#ea580c", border: "#c2410c", text: "#ffffff" },
  Dose: { bg: "#ca8a04", border: "#a16207", text: "#ffffff" },
  AdverseEvent: { bg: "#e11d48", border: "#be123c", text: "#ffffff" },
  Finding: { bg: "#dc2626", border: "#b91c1c", text: "#ffffff" },
  Protocol: { bg: "#4f46e5", border: "#4338ca", text: "#ffffff" },
  Evidence: { bg: "#15803d", border: "#166534", text: "#ffffff" },
};

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
  data,
  onSelectNode,
  height = "560px",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Computed layout positions for nodes
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (!data.nodes || data.nodes.length === 0) return;

    // Force-directed / tiered layout simulation
    const positions: Record<string, { x: number; y: number }> = {};
    const width = 900;
    const heightCalc = 550;
    const centerX = width / 2;
    const centerY = heightCalc / 2;

    // Group by type for layered radial positioning
    const typeRanks: Record<string, number> = {
      Study: 0,
      Site: 1,
      Subject: 2,
      Disease: 3,
      Medication: 3,
      Visit: 3,
      Treatment: 4,
      Lab: 4,
      Dose: 4,
      AdverseEvent: 4,
      Finding: 4,
      Protocol: 1,
      Evidence: 5,
    };

    const typeBuckets: Record<string, any[]> = {};
    data.nodes.forEach((n) => {
      typeBuckets[n.type] = typeBuckets[n.type] || [];
      typeBuckets[n.type].push(n);
    });

    // Root study in center
    positions["study:ABC-101"] = { x: centerX, y: centerY };

    Object.entries(typeBuckets).forEach(([t, nodes]) => {
      if (t === "Study") return;
      const rank = typeRanks[t] || 2;
      const radius = rank * 85;
      const angleStep = (2 * Math.PI) / nodes.length;

      nodes.forEach((n, idx) => {
        // distribute circularly with rank-based radius
        const angle = idx * angleStep + rank * 0.4;
        positions[n.id] = {
          x: centerX + Math.cos(angle) * radius + (Math.sin(idx) * 20),
          y: centerY + Math.sin(angle) * radius + (Math.cos(idx) * 15),
        };
      });
    });

    setNodePositions(positions);
  }, [data]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const filteredNodes =
    activeFilter === "ALL"
      ? data.nodes
      : data.nodes.filter((n) => n.type.toUpperCase() === activeFilter.toUpperCase());

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = data.edges.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  const nodeTypes = ["ALL", ...Array.from(new Set(data.nodes.map((n) => n.type)))];

  return (
    <div className="relative border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-sm flex flex-col">
      {/* Controls Header */}
      <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> Filter Node Type:
          </span>
          <div className="flex flex-wrap gap-1">
            {nodeTypes.map((t) => (
              <button
                key={t}
                onClick={() => setActiveFilter(t)}
                className={`px-2 py-0.5 text-[11px] rounded font-medium border transition-colors ${
                  activeFilter === t
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
            title="Reset View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"
        style={{ height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="0 0 900 550"
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {filteredEdges.map((e) => {
              const p1 = nodePositions[e.source];
              const p2 = nodePositions[e.target];
              if (!p1 || !p2) return null;
              const isHighlighted =
                selectedNode && (selectedNode.id === e.source || selectedNode.id === e.target);

              return (
                <g key={e.id}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isHighlighted ? "#2563eb" : "#cbd5e1"}
                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                    strokeDasharray={e.type.includes("SUPPORTED") ? "4" : undefined}
                  />
                  {zoom >= 0.9 && (
                    <text
                      x={(p1.x + p2.x) / 2}
                      y={(p1.y + p2.y) / 2 - 4}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="Inter, sans-serif"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((n) => {
              const pos = nodePositions[n.id] || { x: 450, y: 275 };
              const colors = TYPE_COLORS[n.type] || { bg: "#475569", border: "#334155", text: "#ffffff" };
              const isSelected = selectedNode?.id === n.id;
              const radius = n.type === "Study" ? 30 : n.type === "Subject" ? 22 : 18;

              return (
                <g
                  key={n.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(n);
                    onSelectNode?.(n);
                  }}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  <circle
                    r={radius}
                    fill={colors.bg}
                    stroke={isSelected ? "#000000" : colors.border}
                    strokeWidth={isSelected ? 3 : 1.5}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  />
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill={colors.text}
                    fontSize={radius <= 18 ? "9" : "11"}
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                    className="pointer-events-none"
                  >
                    {n.type.substring(0, 3)}
                  </text>
                  <text
                    textAnchor="middle"
                    dy={radius + 14}
                    fill="#334155"
                    fontSize="10"
                    fontWeight="500"
                    fontFamily="Inter, sans-serif"
                    className="pointer-events-none"
                  >
                    {n.label.length > 20 ? n.label.substring(0, 18) + "..." : n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Node Inspector Flyout */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 max-w-sm bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-slate-200 z-20 text-xs">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[selectedNode.type]?.bg || "#3b82f6" }}
                />
                <span className="font-semibold text-slate-900">{selectedNode.label}</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 text-[11px] mb-2 font-mono">
              <div>Type: {selectedNode.type}</div>
              <div>ID: {selectedNode.id}</div>
              {selectedNode.properties && (
                <div className="text-slate-600 break-all whitespace-pre-wrap">
                  {JSON.stringify(selectedNode.properties, null, 1)}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Interactive relationship traversal: Click adjacent nodes to inspect CDISC records and protocol compliance.
            </p>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="p-2 border-t border-slate-200 bg-white flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
        <span className="font-semibold text-slate-700">Legend:</span>
        {Object.entries(TYPE_COLORS).slice(0, 8).map(([type, colors]) => (
          <div key={type} className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.bg }} />
            <span>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
