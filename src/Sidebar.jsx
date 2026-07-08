import { useState, useEffect } from 'react';
import { 
  Search, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Save, 
  FolderOpen, 
  Info, 
  RefreshCw, 
  GitBranch, 
  Sliders, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Network
} from 'lucide-react';

export default function Sidebar({ nodes, edges, setNodes, setEdges, selectedNodes, selectedEdges, onLoadGraph, isCollapsed, setIsCollapsed }) {
  const [newNodeName, setNewNodeName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newNodeDiff, setNewNodeDiff] = useState(3);

  const [editNodeName, setEditNodeName] = useState('');
  const [editNodeDiff, setEditNodeDiff] = useState(3);

  const selectedNode = selectedNodes?.[0];
  const selectedEdge = selectedEdges?.[0];

  useEffect(() => {
    if (selectedNode) {
      setEditNodeName(selectedNode.data.label || '');
      setEditNodeDiff(selectedNode.data.difficulty || 3);
    }
  }, [selectedNode, selectedNode?.data?.label, selectedNode?.data?.difficulty]);

  // --- CRUD FUNCTIONS ---
  const handleAddNode = () => {
    if (!newNodeName.trim()) return;
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'problemNode',
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: { label: newNodeName, difficulty: newNodeDiff },
    };
    setNodes((nds) => [...nds, newNode]);
    setNewNodeName('');
    setNewNodeDiff(3);
  };

  const handleUpdateNode = () => {
    if (!selectedNode || !editNodeName.trim()) return;
    setNodes((nds) =>
      nds.map(n => {
        if (n.id === selectedNode.id) {
          return {
            ...n,
            data: {
              ...n.data,
              label: editNodeName,
              difficulty: editNodeDiff
            }
          };
        }
        return n;
      })
    );
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter(n => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
  };

  const handleDeleteEdge = () => {
    if (!selectedEdge) return;
    setEdges((eds) => eds.filter(e => e.id !== selectedEdge.id));
  };

  // --- SAVE / LOAD HANDLERS ---
  const handleSaveGraph = () => {
    const graphData = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        style: n.style,
        data: {
          label: n.data.label,
          difficulty: n.data.difficulty
        }
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.animated,
        style: e.style,
        markerEnd: e.markerEnd
      }))
    };

    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'problem-network-graph.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadGraphClick = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          onLoadGraph(data.nodes, data.edges);
        } else {
          alert("Invalid graph file format. Make sure it contains 'nodes' and 'edges' arrays.");
        }
      } catch (err) {
        alert("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // --- ANALYSIS FUNCTIONS ---

  const resetHighlight = () => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        highlightBg: '#ffffff',
        highlightBorder: '#333'
      }
    }));
  };

  const handleFindRoots = () => {
    const targetNodeIds = new Set(edges.map((edge) => edge.target));
    const highlightedNodes = resetHighlight().map((node) => {
      const isRoot = !targetNodeIds.has(node.id);
      return {
        ...node,
        data: {
          ...node.data,
          highlightBg: isRoot ? '#ffcccc' : '#ffffff',
          highlightBorder: isRoot ? '#ff0000' : '#333'
        }
      };
    });
    setNodes(highlightedNodes);
  };

  const handleDetectCycles = () => {
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
      if (adj[e.source]) adj[e.source].push(e.target);
    });

    const visited = new Set();
    const stack = new Set();
    const cycleNodes = new Set();

    const dfs = (nodeId, path) => {
      visited.add(nodeId);
      stack.add(nodeId);

      for (const neighbor of (adj[nodeId] || [])) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, [...path, nodeId])) return true;
        } else if (stack.has(neighbor)) {
          const cycleStartIdx = path.indexOf(neighbor);
          const cycle = cycleStartIdx !== -1 ? [...path.slice(cycleStartIdx), nodeId] : [neighbor, nodeId];
          cycle.forEach(n => cycleNodes.add(n));
          return true;
        }
      }
      stack.delete(nodeId);
      return false;
    };

    let hasCycle = false;
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id, [])) {
          hasCycle = true;
          break;
        }
      }
    }

    const highlightedNodes = resetHighlight().map(node => {
      if (cycleNodes.has(node.id)) {
        return {
          ...node,
          data: {
            ...node.data,
            highlightBg: '#ffe5b4',
            highlightBorder: '#ff8c00'
          }
        };
      }
      return node;
    });

    setNodes(highlightedNodes);
    if (!hasCycle) alert("No cycles detected!");
  };

  const handleLongestChain = () => {
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
      if (adj[e.source]) adj[e.source].push(e.target);
    });

    let maxPath = [];

    const dfs = (nodeId, currentPath, visitedInPath) => {
      if (visitedInPath.has(nodeId)) return;

      visitedInPath.add(nodeId);
      currentPath.push(nodeId);

      if (currentPath.length > maxPath.length) {
        maxPath = [...currentPath];
      }

      for (const neighbor of (adj[nodeId] || [])) {
        dfs(neighbor, currentPath, visitedInPath);
      }

      currentPath.pop();
      visitedInPath.delete(nodeId);
    };

    for (const node of nodes) {
      dfs(node.id, [], new Set());
    }

    const pathNodes = new Set(maxPath);

    const highlightedNodes = resetHighlight().map(node => {
      if (pathNodes.has(node.id)) {
        return {
          ...node,
          data: {
            ...node.data,
            highlightBg: '#e6e6fa',
            highlightBorder: '#8a2be2'
          }
        };
      }
      return node;
    });

    setNodes(highlightedNodes);
  };

  const handleRankDifficulty = () => {
    if (nodes.length === 0) return;

    let minDiff = Infinity;
    let maxDiff = -Infinity;

    nodes.forEach(node => {
      const diff = node.data.difficulty || 3;
      if (diff < minDiff) minDiff = diff;
      if (diff > maxDiff) maxDiff = diff;
    });

    const highlightedNodes = resetHighlight().map(node => {
      const diff = node.data.difficulty || 3;
      if (diff === maxDiff) {
        return {
          ...node,
          data: {
            ...node.data,
            highlightBg: '#ffcccc',
            highlightBorder: '#cc0000'
          }
        };
      } else if (diff === minDiff) {
        return {
          ...node,
          data: {
            ...node.data,
            highlightBg: '#ccffcc',
            highlightBorder: '#00cc00'
          }
        };
      }
      return node;
    });

    setNodes(highlightedNodes);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val.trim()) {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            highlightBg: undefined,
            highlightBorder: undefined,
          },
        }))
      );
      return;
    }

    const query = val.toLowerCase();
    setNodes((nds) =>
      nds.map((n) => {
        const matches = n.data.label.toLowerCase().includes(query);
        return {
          ...n,
          data: {
            ...n.data,
            highlightBg: matches ? '#fef08a' : '#f3f4f6',
            highlightBorder: matches ? '#ca8a04' : '#e5e7eb',
          },
        };
      })
    );
  };

  const sidebarStyle = {
    width: isCollapsed ? '72px' : '280px',
    background: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    padding: isCollapsed ? '15px 10px' : '20px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    height: '100vh',
    overflowY: 'auto',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    zIndex: 100,
    position: 'relative'
  };

  return (
    <aside style={sidebarStyle} className={`sidebar-container ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'space-between', 
        marginBottom: '20px' 
      }}>
        {!isCollapsed && (
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={22} style={{ color: '#2563eb' }} />
            CauseMap
          </h2>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="btn btn-light btn-sm d-flex align-items-center justify-content-center toggle-sidebar-btn"
          style={{ 
            borderRadius: '50%', 
            width: '32px', 
            height: '32px', 
            padding: 0,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {isCollapsed ? (
        <div className="d-flex flex-column align-items-center gap-2 w-100">
          {/* SEARCH */}
          <button 
            className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
            onClick={() => setIsCollapsed(false)}
            title="Search Problems"
            style={{ height: '40px', borderRadius: '8px' }}
          >
            <Search size={18} />
          </button>

          <hr style={{ width: '100%', margin: '8px 0', borderColor: '#e5e7eb' }} />

          {/* ADD NODE */}
          <button 
            className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center"
            onClick={() => setIsCollapsed(false)}
            title="Add Problem Node"
            style={{ height: '40px', borderRadius: '8px' }}
          >
            <PlusCircle size={18} />
          </button>

          {/* SELECTED NODE EDIT/DELETE */}
          {selectedNode && (
            <>
              <button 
                className="btn btn-warning btn-sm w-100 d-flex align-items-center justify-content-center text-dark"
                onClick={() => setIsCollapsed(false)}
                title="Edit Selected Node"
                style={{ height: '40px', borderRadius: '8px' }}
              >
                <Edit3 size={18} />
              </button>
              <button 
                className="btn btn-danger btn-sm w-100 d-flex align-items-center justify-content-center"
                onClick={handleDeleteNode}
                title="Delete Selected Node"
                style={{ height: '40px', borderRadius: '8px' }}
              >
                <Trash2 size={18} />
              </button>
            </>
          )}

          {/* SELECTED EDGE DELETE */}
          {selectedEdge && !selectedNode && (
            <button 
              className="btn btn-danger btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={handleDeleteEdge}
              title="Delete Selected Edge"
              style={{ height: '40px', borderRadius: '8px' }}
            >
              <Trash2 size={18} />
            </button>
          )}

          <hr style={{ width: '100%', margin: '8px 0', borderColor: '#e5e7eb' }} />

          {/* SAVE/LOAD */}
          <button 
            className="btn btn-success btn-sm w-100 d-flex align-items-center justify-content-center"
            onClick={handleSaveGraph}
            title="Save Graph File"
            style={{ height: '40px', borderRadius: '8px' }}
          >
            <Save size={18} />
          </button>
          <label 
            className="btn btn-secondary btn-sm w-100 d-flex align-items-center justify-content-center" 
            style={{ cursor: 'pointer', height: '40px', margin: 0, borderRadius: '8px' }}
            title="Load Graph File"
          >
            <FolderOpen size={18} />
            <input
              type="file"
              accept=".json"
              onChange={handleLoadGraphClick}
              style={{ display: 'none' }}
            />
          </label>

          <hr style={{ width: '100%', margin: '8px 0', borderColor: '#e5e7eb' }} />

          {/* ANALYSIS */}
          <button 
            className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center"
            onClick={handleFindRoots}
            title="Find Root Causes"
            style={{ height: '40px', borderRadius: '8px' }}
          >
            <Info size={18} />
          </button>
          <button 
            className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center"
            onClick={handleDetectCycles}
            title="Detect Cycles"
            style={{ height: '40px', borderRadius: '8px' }}
          >
            <RefreshCw size={18} />
          </button>
          <button 
            className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center"
            onClick={handleLongestChain}
            title="Find Longest Chain"
            style={{ height: '40px', borderRadius: '8px' }}
          >
            <GitBranch size={18} />
          </button>
          <button 
            className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center"
            onClick={handleRankDifficulty}
            title="Rank by Difficulty"
            style={{ height: '40px', borderRadius: '8px' }}
          >
            <Sliders size={18} />
          </button>
          <button 
            className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center"
            onClick={() => setNodes(resetHighlight())}
            title="Clear Analysis Highlights"
            style={{ height: '40px', borderRadius: '8px' }}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* SEARCH */}
          <div style={{ marginBottom: '20px' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <Search size={16} className="text-muted" />
              </span>
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="form-control form-control-sm border-start-0 ps-0"
                style={{ boxShadow: 'none' }}
              />
            </div>
          </div>

          {/* MANAGE NODES */}
          <div style={{ marginBottom: '20px', borderTop: '1px solid #f3f4f6', paddingTop: '15px' }}>
            <h3 style={{ marginTop: 0, fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Manage Nodes
            </h3>

            {/* CREATE NODE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="New problem name..."
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                className="form-control form-control-sm"
                style={{ borderRadius: '6px' }}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '500' }}>Diff:</span>
                <input
                  type="number"
                  min="1" max="5"
                  value={newNodeDiff}
                  onChange={(e) => setNewNodeDiff(parseInt(e.target.value) || 1)}
                  className="form-control form-control-sm"
                  style={{ width: '55px', borderRadius: '6px' }}
                />
                <button className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1" onClick={handleAddNode} style={{ borderRadius: '6px' }}>
                  <PlusCircle size={14} /> Add Node
                </button>
              </div>
            </div>

            {/* EDIT/DELETE SELECTED ELEMENT */}
            {selectedNode && (
              <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Edit3 size={14} className="text-warning" /> Edit Selected Node
                </div>
                <input
                  type="text"
                  value={editNodeName}
                  onChange={(e) => setEditNodeName(e.target.value)}
                  className="form-control form-control-sm"
                  style={{ marginBottom: '8px', borderRadius: '6px' }}
                />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '500' }}>Diff:</span>
                  <input
                    type="number"
                    min="1" max="5"
                    value={editNodeDiff}
                    onChange={(e) => setEditNodeDiff(parseInt(e.target.value) || 1)}
                    className="form-control form-control-sm"
                    style={{ width: '55px', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-success btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1" onClick={handleUpdateNode} style={{ borderRadius: '6px' }}>
                    Update
                  </button>
                  <button className="btn btn-danger btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1" onClick={handleDeleteNode} style={{ borderRadius: '6px' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            )}

            {selectedEdge && !selectedNode && (
              <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #f3f4f6', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Edge Selected</p>
                <button className="btn btn-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-1" onClick={handleDeleteEdge} style={{ borderRadius: '6px' }}>
                  <Trash2 size={14} /> Delete Edge
                </button>
              </div>
            )}
          </div>

          {/* SAVE / LOAD GRAPH SECTION */}
          <div style={{ marginBottom: '20px', borderTop: '1px solid #f3f4f6', paddingTop: '15px' }}>
            <h3 style={{ marginTop: 0, fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Save / Load Graph
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-success btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1" onClick={handleSaveGraph} style={{ borderRadius: '6px' }}>
                <Save size={14} /> Save
              </button>
              <label className="btn btn-secondary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1" style={{ cursor: 'pointer', margin: 0, borderRadius: '6px' }}>
                <FolderOpen size={14} /> Load
                <input
                  type="file"
                  accept=".json"
                  onChange={handleLoadGraphClick}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* ANALYSIS */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '15px', flexGrow: 1 }}>
            <h3 style={{ marginTop: 0, fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Analysis Tools
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-outline-primary btn-sm w-100 text-start d-flex align-items-center gap-2" onClick={handleFindRoots} style={{ borderRadius: '6px', padding: '6px 12px' }}>
                <Info size={14} /> Find Root Causes
              </button>
              <button className="btn btn-outline-primary btn-sm w-100 text-start d-flex align-items-center gap-2" onClick={handleDetectCycles} style={{ borderRadius: '6px', padding: '6px 12px' }}>
                <RefreshCw size={14} /> Detect Cycles
              </button>
              <button className="btn btn-outline-primary btn-sm w-100 text-start d-flex align-items-center gap-2" onClick={handleLongestChain} style={{ borderRadius: '6px', padding: '6px 12px' }}>
                <GitBranch size={14} /> Longest Chain
              </button>
              <button className="btn btn-outline-primary btn-sm w-100 text-start d-flex align-items-center gap-2" onClick={handleRankDifficulty} style={{ borderRadius: '6px', padding: '6px 12px' }}>
                <Sliders size={14} /> Rank by Difficulty
              </button>
              <button className="btn btn-outline-danger btn-sm w-100 text-start d-flex align-items-center gap-2 mt-2" onClick={() => setNodes(resetHighlight())} style={{ borderRadius: '6px', padding: '6px 12px' }}>
                <X size={14} /> Clear Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
