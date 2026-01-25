import { useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { allDiagrams, diagramDescriptions } from './diagrams';

type DiagramKey = keyof typeof allDiagrams;

function App() {
  const [selectedDiagram, setSelectedDiagram] = useState<DiagramKey>('coreIdentity');
  const diagram = allDiagrams[selectedDiagram];

  const [nodes, setNodes, onNodesChange] = useNodesState(diagram.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagram.edges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleDiagramChange = (key: DiagramKey) => {
    setSelectedDiagram(key);
    const newDiagram = allDiagrams[key];
    setNodes(newDiagram.nodes);
    setEdges(newDiagram.edges);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '24px'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
          Abacus Diagram Viewer
        </h1>

        <select
          value={selectedDiagram}
          onChange={(e) => handleDiagramChange(e.target.value as DiagramKey)}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: '#f8fafc',
            cursor: 'pointer',
            minWidth: '280px'
          }}
        >
          {Object.keys(allDiagrams).map((key) => (
            <option key={key} value={key}>
              {diagramDescriptions[key as DiagramKey] || key}
            </option>
          ))}
        </select>

        <span style={{ color: '#64748b', fontSize: '14px' }}>
          {diagram.nodes.length} nodes · {diagram.edges.length} edges
        </span>
      </div>

      {/* React Flow Canvas */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background color="#e2e8f0" gap={16} />
          <Controls />
          <MiniMap
            nodeStrokeColor="#0ea5e9"
            nodeColor="#f8fafc"
            nodeBorderRadius={4}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default App;
