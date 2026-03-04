import { useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState, 
  useEdgesState, 
  addEdge 
} from 'reactflow';
import 'reactflow/dist/style.css';

import ProblemNode from './ProblemNode';
import Sidebar from './Sidebar';

// Register custom node types
const nodeTypes = { problemNode: ProblemNode };

// 1. Define initial problems (Nodes)
const initialNodes = [
  { id: 'edu', type: 'problemNode', position: { x: 100, y: 50 }, data: { label: 'Lack of traffic rules education' } },
  { id: 'corrupt', type: 'problemNode', position: { x: 400, y: 50 }, data: { label: 'Corruption' } },
  { id: 'enforce', type: 'problemNode', position: { x: 400, y: 150 }, data: { label: 'Lack of traffic rule enforcement' } },
  { id: 'rules', type: 'problemNode', position: { x: 250, y: 250 }, data: { label: 'No Traffic Rules followed' } },
  { id: 'traffic', type: 'problemNode', position: { x: 250, y: 350 }, data: { label: 'Bad traffic' } },
];

// 2. Define causal links (Edges) -> Source causes Target
const initialEdges = [
  { id: 'e-edu-rules', source: 'edu', target: 'rules', animated: true },
  { id: 'e-corrupt-enforce', source: 'corrupt', target: 'enforce', animated: true },
  { id: 'e-enforce-rules', source: 'enforce', target: 'rules', animated: true },
  { id: 'e-rules-traffic', source: 'rules', target: 'traffic', animated: true },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle connecting nodes by dragging handles
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      <Sidebar />
      
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#ccc" gap={16} />
          <Controls />
          <MiniMap zoomable pannable />
        </ReactFlow>
      </div>
    </div>
  );
}
