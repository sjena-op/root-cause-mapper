import { useState, useEffect } from 'react';

export default function Sidebar({ nodes, edges, setNodes, setEdges, selectedNodes, selectedEdges }) {
  const [newNodeName, setNewNodeName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newNodeDiff, setNewNodeDiff] = useState(5);

  const [editNodeName, setEditNodeName] = useState('');
  const [editNodeDiff, setEditNodeDiff] = useState(5);

  const selectedNode = selectedNodes?.[0];
  const selectedEdge = selectedEdges?.[0];

  useEffect(() => {
    if (selectedNode) {
      setEditNodeName(selectedNode.data.label || '');
      setEditNodeDiff(selectedNode.data.difficulty || 5);
    }
  }, [selectedNode]);

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
    setNewNodeDiff(5);
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
      const diff = node.data.difficulty || 5;
      if (diff < minDiff) minDiff = diff;
      if (diff > maxDiff) maxDiff = diff;
    });

    const highlightedNodes = resetHighlight().map(node => {
      const diff = node.data.difficulty || 5;
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
      <h2 style={{ marginTop: 0 }}>Problem Network</h2>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search problems..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
        <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Manage Nodes</h3>

        {/* CREATE NODE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="New problem name..."
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px' }}>Diff:</span>
            <input
              type="number"
              min="1" max="10"
              value={newNodeDiff}
              onChange={(e) => setNewNodeDiff(parseInt(e.target.value) || 1)}
              style={{ ...inputStyle, width: '60px' }}
            />
            <button style={{ ...buttonStyle, flex: 1, padding: '8px' }} onClick={handleAddNode}>Add Node</button>
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
              style={{ ...inputStyle, marginBottom: '5px' }}
            />
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px' }}>Diff:</span>
              <input
                type="number"
                min="1" max="10"
                value={editNodeDiff}
                onChange={(e) => setEditNodeDiff(parseInt(e.target.value) || 1)}
                style={{ ...inputStyle, width: '60px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button style={{ ...buttonStyle, background: '#228B22', flex: 1, padding: '6px' }} onClick={handleUpdateNode}>Update</button>
              <button style={{ ...buttonStyle, background: '#cc0000', flex: 1, padding: '6px' }} onClick={handleDeleteNode}>Delete</button>
            </div>
          </div>
        )}

        {selectedEdge && !selectedNode && (
          <div style={{ background: '#e0e0e0', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold' }}>Edge Selected</p>
            <button style={{ ...buttonStyle, background: '#cc0000', width: '100%', padding: '6px' }} onClick={handleDeleteEdge}>Delete Edge</button>
          </div>
        )}
      </div>

      <h3 style={{ marginTop: 0, fontSize: '1rem', borderTop: '1px solid #ccc', paddingTop: '10px' }}>Analysis</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button style={buttonStyle} onClick={handleFindRoots}>
          Find Root Causes
        </button>
        <button style={buttonStyle} onClick={handleDetectCycles}>Detect Cycles</button>
        <button style={buttonStyle} onClick={handleLongestChain}>Longest Chain</button>
        <button style={buttonStyle} onClick={handleRankDifficulty}>Rank by Difficulty</button>
        <button style={{ ...buttonStyle, background: '#888' }} onClick={() => setNodes(resetHighlight())}>Clear Analysis</button>
      </div>
    </aside>
  );
}

// Styles remain the same
const sidebarStyle = { width: '250px', background: '#f4f4f4', borderRight: '1px solid #ddd', padding: '20px', display: 'flex', flexDirection: 'column' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
const buttonStyle = { padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
