import { Handle, Position } from 'reactflow';

export default function ProblemNode({ data, selected }) {
  const isHovered = data.isHoveredTarget;
  const hoverRel = data.hoverRelation;

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

      <div style={{ fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>
        {data.label}
      </div>
      <div style={{ fontSize: '11px', textAlign: 'center', color: '#666', marginTop: '4px' }}>
        Difficulty: {data.difficulty || 5}/10
      </div>

      {/* Source handle: where this problem connects to its "effects" */}
      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}

const baseNodeStyle = {
  padding: '15px 20px',
  borderRadius: '8px',
  borderStyle: 'solid',
  minWidth: '150px',
  transition: 'all 0.2s ease',
  position: 'relative'
};
