import { useState, useEffect } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

export default function ProblemNode({ id, data, selected }) {
  const isHovered = data.isHoveredTarget;
  const hoverRel = data.hoverRelation;

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label || '');

  // Keep local state in sync with prop changes
  useEffect(() => {
    setEditLabel(data.label || '');
  }, [data.label]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveLabel();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditLabel(data.label || '');
    }
  };

  const saveLabel = () => {
    if (editLabel.trim() && data.updateNodeData) {
      data.updateNodeData(id, { label: editLabel.trim() });
    }
    setIsEditing(false);
  };

  const handleRatingClick = (e, val) => {
    e.stopPropagation();
    if (data.updateNodeData) {
      data.updateNodeData(id, { difficulty: val });
    }
  };

  // Use highlights if present, otherwise use defaults
  let currentBg = data.highlightBg || (selected ? '#e0f2fe' : '#ffffff');
  let currentBorder = data.highlightBorder || (selected ? '#0284c7' : '#333');
  let borderThickness = data.highlightBorder ? '3px' : (selected ? '3px' : '2px');
  let shadow = '4px 4px 0px #aaa';
  let scale = 'scale(1)';

  if (isHovered) {
    currentBg = '#fff7ed'; // Light orange background for hover
    currentBorder = '#ea580c'; // Dark orange border
    borderThickness = '3px';
    shadow = '0 0 15px rgba(234, 88, 12, 0.4)';
    scale = 'scale(1.05)';
  }

  const difficulty = data.difficulty || 3;
  const filledCount = difficulty;

  // Get color for rating boxes
  const getRatingColor = (count) => {
    if (count <= 1) return '#198754'; // Green
    if (count === 2) return '#198754';
    if (count === 3) return '#ffc107'; // Yellow
    if (count === 4) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  const activeColor = getRatingColor(filledCount);

  return (
    <div
      className="problem-node"
      style={{
        ...baseNodeStyle,
        background: currentBg,
        borderColor: currentBorder,
        borderWidth: borderThickness,
        boxShadow: shadow,
        transform: scale
      }}
    >
      <NodeResizer minWidth={150} minHeight={80} isVisible={selected} />

      {/* Visual hover badge */}
      {isHovered && hoverRel && (
        <div style={{
          position: 'absolute',
          top: hoverRel === 'cause' ? '-25px' : 'auto',
          bottom: hoverRel === 'effect' ? '-25px' : 'auto',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ea580c',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {hoverRel === 'cause' ? 'Make Dragged Cause (Dragged → Target)' : 'Make Dragged Effect (Target → Dragged)'}
        </div>
      )}

      {/* Target handle: where "causes" connect to this problem */}
      <Handle type="target" position={Position.Top} className="handle" />

      {isEditing ? (
        <input
          type="text"
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={handleKeyDown}
          className="form-control form-control-sm nodrag"
          autoFocus
          style={{
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            width: '90%'
          }}
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          style={{
            fontWeight: 'bold',
            fontSize: '14px',
            textAlign: 'center',
            cursor: 'text',
            userSelect: 'none',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'normal',
            wordBreak: 'break-word'
          }}
          title="Double click to edit label"
        >
          {data.label}
        </div>
      )}

      {/* 5-box rating container */}
      <div style={{ marginTop: '8px', display: 'flex', gap: '3px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((val) => {
          const isFilled = val <= filledCount;
          return (
            <div
              key={val}
              onClick={(e) => handleRatingClick(e, val)}
              className="nodrag"
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                border: '1px solid #aaa',
                cursor: 'pointer',
                background: isFilled ? activeColor : '#e9ecef',
                transition: 'background-color 0.15s ease'
              }}
              title={`Set difficulty to ${val}/5`}
            />
          );
        })}
      </div>

      {/* Source handle: where this problem connects to its "effects" */}
      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}

const baseNodeStyle = {
  padding: '12px 15px',
  borderRadius: '8px',
  borderStyle: 'solid',
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  minWidth: '150px',
  minHeight: '80px',
  transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center'
};
