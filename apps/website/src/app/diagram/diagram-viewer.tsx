"use client";

import {
  Background,
  type Connection,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useState } from "react";
import "@xyflow/react/dist/style.css";
import { allDiagrams, diagramDescriptions } from "./diagrams";

type DiagramKey = keyof typeof allDiagrams;

export function DiagramViewer() {
  const [selectedDiagram, setSelectedDiagram] =
    useState<DiagramKey>("coreIdentity");
  const diagram = allDiagrams[selectedDiagram];

  const [nodes, setNodes, onNodesChange] = useNodesState(diagram.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagram.edges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleDiagramChange = (key: DiagramKey) => {
    setSelectedDiagram(key);
    const newDiagram = allDiagrams[key];
    setNodes(newDiagram.nodes);
    setEdges(newDiagram.edges);
  };

  return (
    <div className="flex flex-col min-h-screen pt-24">
      {/* Header */}
      <div className="flex items-center gap-6 flex-wrap py-8 border-b border-border">
        <h1 className="text-2xl font-medium tracking-tight">
          Product Diagrams
        </h1>

        <select
          value={selectedDiagram}
          onChange={(e) => handleDiagramChange(e.target.value as DiagramKey)}
          className="px-3 py-2 text-sm rounded-md border border-border bg-background cursor-pointer min-w-[300px] focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {Object.keys(allDiagrams).map((key) => (
            <option key={key} value={key}>
              {diagramDescriptions[key as DiagramKey] || key}
            </option>
          ))}
        </select>

        <span className="text-muted-foreground text-sm">
          {diagram.nodes.length} nodes · {diagram.edges.length} edges
        </span>
      </div>

      {/* React Flow Canvas */}
      <div
        className="rounded-lg border border-border mt-6 flex-1"
        style={{ minHeight: "500px", background: "#ffffff" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{ type: "smoothstep" }}
          className="rounded-lg"
          style={{ background: "#ffffff" }}
        >
          <Background color="#e2e8f0" gap={16} />
          <Controls className="!bg-white !border-gray-200 !shadow-sm" />
          <MiniMap
            nodeStrokeColor="#0ea5e9"
            nodeColor="#f8fafc"
            nodeBorderRadius={4}
            className="!bg-white !border-gray-200"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
