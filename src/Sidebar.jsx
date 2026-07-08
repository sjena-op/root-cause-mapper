import { useState, useEffect } from 'react';

export default function Sidebar({ nodes, edges, setNodes, setEdges, selectedNodes, selectedEdges, onLoadGraph }) {
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

  return (
    <aside style={sidebarStyle}>
      <h2 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Root Cause Map</h2>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search problems..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="form-control form-control-sm"
        />
      </div>

      <div style={{ marginBottom: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
        <h3 style={{ marginTop: 0, fontSize: '1rem', fontWeight: 'bold' }}>Manage Nodes</h3>

        {/* CREATE NODE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="New problem name..."
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            className="form-control form-control-sm"
          />
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px' }}>Diff:</span>
            <input
              type="number"
              min="1" max="5"
              value={newNodeDiff}
              onChange={(e) => setNewNodeDiff(parseInt(e.target.value) || 1)}
              className="form-control form-control-sm"
              style={{ width: '60px' }}
            />
            <button className="btn btn-primary btn-sm flex-grow-1" onClick={handleAddNode}>Add Node</button>
          </div>
        </div>

        {/* EDIT/DELETE SELECTED ELEMENT */}
        {selectedNode && (
          <div style={{ background: '#e0e0e0', padding: '10px', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Edit Selected Node</div>
            <input
              type="text"
              value={editNodeName}
              onChange={(e) => setEditNodeName(e.target.value)}
              className="form-control form-control-sm"
              style={{ marginBottom: '5px' }}
            />
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px' }}>Diff:</span>
              <input
                type="number"
                min="1" max="5"
                value={editNodeDiff}
                onChange={(e) => setEditNodeDiff(parseInt(e.target.value) || 1)}
                className="form-control form-control-sm"
                style={{ width: '60px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button className="btn btn-success btn-sm flex-grow-1" onClick={handleUpdateNode}>Update</button>
              <button className="btn btn-danger btn-sm flex-grow-1" onClick={handleDeleteNode}>Delete</button>
            </div>
          </div>
        )}

        {selectedEdge && !selectedNode && (
          <div style={{ background: '#e0e0e0', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold' }}>Edge Selected</p>
            <button className="btn btn-danger btn-sm w-100" onClick={handleDeleteEdge}>Delete Edge</button>
          </div>
        )}
      </div>

      {/* SAVE / LOAD GRAPH SECTION */}
      <div style={{ marginBottom: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
        <h3 style={{ marginTop: 0, fontSize: '1rem', fontWeight: 'bold' }}>Save / Load Graph</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn btn-success btn-sm w-100" onClick={handleSaveGraph}>
            Save Graph File
          </button>
          <label className="btn btn-secondary btn-sm w-100" style={{ cursor: 'pointer' }}>
            Load Graph File
            <input
              type="file"
              accept=".json"
              onChange={handleLoadGraphClick}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <h3 style={{ marginTop: 0, fontSize: '1rem', borderTop: '1px solid #ccc', paddingTop: '10px', fontWeight: 'bold' }}>Analysis</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button className="btn btn-primary btn-sm w-100" onClick={handleFindRoots}>
          Find Root Causes
        </button>
        <button className="btn btn-primary btn-sm w-100" onClick={handleDetectCycles}>Detect Cycles</button>
        <button className="btn btn-primary btn-sm w-100" onClick={handleLongestChain}>Longest Chain</button>
        <button className="btn btn-primary btn-sm w-100" onClick={handleRankDifficulty}>Rank by Difficulty</button>
        <button className="btn btn-secondary btn-sm w-100" onClick={() => setNodes(resetHighlight())}>Clear Analysis</button>
      </div>
    </aside>
  );
}

const sidebarStyle = { width: '250px', background: '#f4f4f4', borderRight: '1px solid #ddd', padding: '20px', display: 'flex', flexDirection: 'column' };
