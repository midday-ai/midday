import { type Edge, type Node, ReactFlow } from "@xyflow/react";
import type { FlowNode as FlowNodeType } from "@/core/types";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { useCallback, useMemo } from "react";
import { type FlowNodeData, FlowNodeMemo } from "./flow-node";

interface FlowGraphProps {
  flow: FlowNodeType;
  onNodeClick?: (node: FlowNodeType) => void;
}

const nodeTypes = {
  flowNode: FlowNodeMemo,
} as const;

const nodeWidth = 200;
const nodeHeight = 80;

/**
 * Convert a FlowNode tree to React Flow nodes and edges using dagre layout
 */
function flowToGraph(
  flow: FlowNodeType,
  onNodeClick?: (node: FlowNodeType) => void,
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];

  // Create dagre graph for layout
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  // Recursively process the flow tree
  function processNode(node: FlowNodeType, parentId?: string) {
    const nodeId = `${node.queueName}:${node.job.id}`;

    // Add node to dagre
    g.setNode(nodeId, { width: nodeWidth, height: nodeHeight });

    // Add edge from parent
    if (parentId) {
      g.setEdge(parentId, nodeId);
      edges.push({
        id: `${parentId}->${nodeId}`,
        source: parentId,
        target: nodeId,
        type: "smoothstep",
        animated: node.job.status === "active",
        style: {
          stroke: "hsl(var(--border))",
          strokeWidth: 2,
        },
      });
    }

    // Create React Flow node
    nodes.push({
      id: nodeId,
      type: "flowNode",
      position: { x: 0, y: 0 }, // Will be set by dagre
      data: {
        flowNode: node,
        onClick: onNodeClick,
      },
    });

    // Process children
    if (node.children) {
      for (const child of node.children) {
        processNode(child, nodeId);
      }
    }
  }

  processNode(flow);

  // Run dagre layout
  dagre.layout(g);

  // Apply positions from dagre
  for (const node of nodes) {
    const nodeWithPosition = g.node(node.id);
    if (nodeWithPosition) {
      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      };
    }
  }

  return { nodes, edges };
}

export function FlowGraph({ flow, onNodeClick }: FlowGraphProps) {
  const { nodes, edges } = useMemo(
    () => flowToGraph(flow, onNodeClick),
    [flow, onNodeClick],
  );

  // Handle node click via React Flow's native handler
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<FlowNodeData>) => {
      if (node.data.onClick && node.data.flowNode) {
        node.data.onClick(node.data.flowNode);
      }
    },
    [],
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnScroll
        zoomOnScroll
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent" }}
      />
    </div>
  );
}
