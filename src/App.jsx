import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

import ProblemNode from './ProblemNode';
import Sidebar from './Sidebar';
import { Shuffle } from 'lucide-react';

const nodeTypes = { problemNode: ProblemNode };

// Initial Problems (Positions don't matter anymore, Dagre will handle them!)
const initialNodes = [
  { id: 'edu', type: 'problemNode', position: { x: 0, y: 0 }, data: { label: 'Lack of traffic rules education', difficulty: 2 } },
  { id: 'corrupt', type: 'problemNode', position: { x: 0, y: 0 }, data: { label: 'Corruption', difficulty: 5 } },
  { id: 'enforce', type: 'problemNode', position: { x: 0, y: 0 }, data: { label: 'Traffic rules not enforced', difficulty: 4 } },
  { id: 'rules', type: 'problemNode', position: { x: 0, y: 0 }, data: { label: 'No Traffic Rules followed', difficulty: 3 } },
  { id: 'traffic', type: 'problemNode', position: { x: 0, y: 0 }, data: { label: 'Bad traffic', difficulty: 4 } },
];

const initialEdges = [
  { id: 'e-edu-rules', source: 'edu', target: 'rules', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#000000' }, style: { stroke: '#000000' } },
  { id: 'e-corrupt-enforce', source: 'corrupt', target: 'enforce', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#000000' }, style: { stroke: '#000000' } },
  { id: 'e-enforce-rules', source: 'enforce', target: 'rules', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#000000' }, style: { stroke: '#000000' } },
  { id: 'e-rules-traffic', source: 'rules', target: 'traffic', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#000000' }, style: { stroke: '#000000' } },
];

// --- AUTO LAYOUT ENGINE SETUP ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Approximate width and height of your custom ProblemNode
const nodeWidth = 200;
const nodeHeight = 80;

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

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#000000' }, style: { stroke: '#000000' } }, eds)),
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

  // Load graph and auto-layout
  const onLoadGraph = useCallback((loadedNodes, loadedEdges) => {
    const nodesWithTypes = loadedNodes.map(n => ({
      ...n,
      type: 'problemNode',
      position: n.position || { x: 0, y: 0 }
    }));
    
    const edgesWithStyling = loadedEdges.map(e => ({
      ...e,
      animated: e.animated !== undefined ? e.animated : true,
      style: e.style || { stroke: '#000000' },
      markerEnd: e.markerEnd || { type: MarkerType.ArrowClosed, color: '#000000' }
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodesWithTypes,
      edgesWithStyling
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [setNodes, setEdges]);

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
        
        // Dragged node A is dropped over (above) B -> A is cause of B (A -> B)
        if (dragCenterY < targetCenterY) {
          relation = 'cause';
        } else {
          relation = 'effect'; // Dragged node A is dropped under B -> A is effect of B (B -> A)
        }
        break;
      }
    }

    setHoveredNodeId(foundOverlapId);
    setHoverRelation(relation);
  }, [nodes]);

  const onNodeDragStop = useCallback((event, node) => {
    if (hoveredNodeId && hoverRelation) {
      const sourceId = hoverRelation === 'cause' ? node.id : hoveredNodeId;
      const targetId = hoverRelation === 'cause' ? hoveredNodeId : node.id;

      const edgeExists = edges.some(e => e.source === sourceId && e.target === targetId);
      if (!edgeExists) {
        setEdges((eds) => addEdge({
          id: `edge-${Date.now()}`,
          source: sourceId,
          target: targetId,
          animated: true,
          style: { stroke: '#000000' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#000000' }
        }, eds));
      }
    }
    setActiveDragNodeId(null);
    setHoveredNodeId(null);
    setHoverRelation(null);
  }, [hoveredNodeId, hoverRelation, edges, setEdges]);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              ...newData,
            },
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  // Inject hover state and updateNodeData callback to nodes for custom visual cues
  const displayNodes = nodes.map(node => {
    const baseNode = {
      ...node,
      data: {
        ...node.data,
        updateNodeData,
      }
    };
    if (node.id === hoveredNodeId) {
      baseNode.data.isHoveredTarget = true;
      baseNode.data.hoverRelation = hoverRelation;
    }
    return baseNode;
  });

  // Inject preview edge while dragging over a target node
  const displayEdges = hoveredNodeId && hoverRelation && activeDragNodeId
    ? [
        ...edges,
        {
          id: 'preview-edge',
          source: hoverRelation === 'cause' ? activeDragNodeId : hoveredNodeId,
          target: hoverRelation === 'cause' ? hoveredNodeId : activeDragNodeId,
          animated: true,
          style: { stroke: '#ff5500', strokeDasharray: '5,5', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#ff5500' }
        }
      ]
    : edges;

  return (
    <div className="app-container">
      <Sidebar
        nodes={nodes}
        edges={edges}
        setNodes={setNodes}
        setEdges={setEdges}
        selectedNodes={selectedNodes}
        selectedEdges={selectedEdges}
        onLoadGraph={onLoadGraph}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className="main-content" style={{ flexGrow: 1, position: 'relative', background: 'linear-gradient(to bottom, #ffb0b0, #b0b0ff)', height: '100%' }}>
        {/* Fixed CAUSES / EFFECTS Background Labels */}
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '4rem',
          fontWeight: '900',
          color: 'rgba(255, 255, 255, 0.35)',
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: '0.3em',
          zIndex: 0
        }}>
          CAUSES
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '4rem',
          fontWeight: '900',
          color: 'rgba(255, 255, 255, 0.35)',
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: '0.3em',
          zIndex: 0
        }}>
          EFFECTS
        </div>

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
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
        >
          <Panel position="top-right">
            <button
              onClick={onLayout}
              className="btn btn-dark btn-sm d-flex align-items-center gap-2"
              style={{ borderRadius: '6px', padding: '6px 12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
              <Shuffle size={14} />
              <span className="d-none d-sm-inline">Organize Nodes</span>
            </button>
          </Panel>
          <Background color="#ccc" gap={16} />
          <Controls style={{ left: isCollapsed ? 80 : 290, transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          <MiniMap zoomable pannable />
        </ReactFlow>
      </div>
    </div>
  );
}
