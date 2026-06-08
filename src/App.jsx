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

  // Drag and drop node connection states
  const [activeDragNodeId, setActiveDragNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [hoverRelation, setHoverRelation] = useState(null); // 'cause' or 'effect'

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

  // Handle drag-and-drop linking
  const onNodeDragStart = useCallback((event, node) => {
    setActiveDragNodeId(node.id);
  }, []);

  const onNodeDrag = useCallback((event, node) => {
    const dragRect = {
      left: node.position.x,
      right: node.position.x + nodeWidth,
      top: node.position.y,
      bottom: node.position.y + nodeHeight,
    };

    let foundOverlapId = null;
    let relation = null;

    for (const otherNode of nodes) {
      if (otherNode.id === node.id) continue;

      const targetRect = {
        left: otherNode.position.x,
        right: otherNode.position.x + nodeWidth,
        top: otherNode.position.y,
        bottom: otherNode.position.y + nodeHeight,
      };

      const isOverlapping = !(
        dragRect.right < targetRect.left ||
        dragRect.left > targetRect.right ||
        dragRect.bottom < targetRect.top ||
        dragRect.top > targetRect.bottom
      );

      if (isOverlapping) {
        foundOverlapId = otherNode.id;
        const dragCenterY = node.position.y + nodeHeight / 2;
        const targetCenterY = otherNode.position.y + nodeHeight / 2;
        
        // Dragged node A is dropped over (above) B -> B is cause (B -> A)
        if (dragCenterY < targetCenterY) {
          relation = 'cause';
        } else {
          relation = 'effect'; // Dragged node A is dropped under B -> B is effect (A -> B)
        }
        break;
      }
    }

    setHoveredNodeId(foundOverlapId);
    setHoverRelation(relation);
  }, [nodes]);

  const onNodeDragStop = useCallback((event, node) => {
    if (hoveredNodeId && hoverRelation) {
      const sourceId = hoverRelation === 'cause' ? hoveredNodeId : node.id;
      const targetId = hoverRelation === 'cause' ? node.id : hoveredNodeId;

      const edgeExists = edges.some(e => e.source === sourceId && e.target === targetId);
      if (!edgeExists) {
        setEdges((eds) => addEdge({
          id: `edge-${Date.now()}`,
          source: sourceId,
          target: targetId,
          animated: true
        }, eds));
      }
    }
    setActiveDragNodeId(null);
    setHoveredNodeId(null);
    setHoverRelation(null);
  }, [hoveredNodeId, hoverRelation, edges, setEdges]);

  // Inject hover state to nodes for custom visual cues
  const displayNodes = nodes.map(node => {
    if (node.id === hoveredNodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          isHoveredTarget: true,
          hoverRelation: hoverRelation
        }
      };
    }
    return node;
  });

  // Inject preview edge while dragging over a target node
  const displayEdges = hoveredNodeId && hoverRelation && activeDragNodeId
    ? [
        ...edges,
        {
          id: 'preview-edge',
          source: hoverRelation === 'cause' ? hoveredNodeId : activeDragNodeId,
          target: hoverRelation === 'cause' ? activeDragNodeId : hoveredNodeId,
          animated: true,
          style: { stroke: '#ff5500', strokeDasharray: '5,5', strokeWidth: 2 }
        }
      ]
    : edges;

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
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={({ nodes, edges }) => {
            setSelectedNodes(nodes);
            setSelectedEdges(edges);
          }}
          onConnect={onConnect}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
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
