import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

import ProblemNode from './ProblemNode';
import Sidebar from './Sidebar';

const nodeTypes = { problemNode: ProblemNode };

// Initial Problems (Positions don't matter anymore, Dagre will handle them!)
const initialNodes = [
  { id: 'edu', type: 'problemNode', position: { x: 0, y: 0 }, data: { label: 'Lack of traffic rules education', difficulty: 4 } },
  { id: 'corrupt', type: 'problemNode', position: { x: 0, y: 0 }, data: { label: 'Corruption', difficulty: 9 } },
  { id: 'enforce', type: 'problemNode', position: { x: 0, y: 0 }, data: { label: 'Lack of traffic rule enforcement', difficulty: 7 } },
  { id: 'rules', type: 'problemNode', position: { x: 0, y: 0 }, data: { label: 'No Traffic Rules followed', difficulty: 5 } },
  { id: 'traffic', type: 'problemNode', position: { x: 0, y: 0 }, data: { label: 'Bad traffic', difficulty: 8 } },
];

const initialEdges = [
  { id: 'e-edu-rules', source: 'edu', target: 'rules', animated: true },
  { id: 'e-corrupt-enforce', source: 'corrupt', target: 'enforce', animated: true },
  { id: 'e-enforce-rules', source: 'enforce', target: 'rules', animated: true },
  { id: 'e-rules-traffic', source: 'rules', target: 'traffic', animated: true },
];

// --- AUTO LAYOUT ENGINE SETUP ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Approximate width and height of your custom ProblemNode
const nodeWidth = 200;
const nodeHeight = 60;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  // Add nodes to Dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges to Dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run the layout math
  dagre.layout(dagreGraph);

  // Apply the newly calculated X/Y coordinates back to React Flow nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    // We shift the node by half its width/height so it's centered on the coordinate
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function App() {
  // Initialize state with the auto-layouted nodes and edges
  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    initialNodes,
    initialEdges
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Track selection for Sidebar CRUD
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  // Function to re-trigger layout manually (e.g., after adding new nodes)
  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      <Sidebar
        nodes={nodes}
        edges={edges}
        setNodes={setNodes}
        setEdges={setEdges}
        selectedNodes={selectedNodes}
        selectedEdges={selectedEdges}
      />

      <div style={{ flexGrow: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={({ nodes, edges }) => {
            setSelectedNodes(nodes);
            setSelectedEdges(edges);
          }}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Panel position="top-right">
            <button
              onClick={onLayout}
              style={{ padding: '8px 12px', background: '#333', color: 'white', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
            >
              Organize Nodes
            </button>
          </Panel>
          <Background color="#ccc" gap={16} />
          <Controls />
          <MiniMap zoomable pannable />
        </ReactFlow>
      </div>
    </div>
  );
}
