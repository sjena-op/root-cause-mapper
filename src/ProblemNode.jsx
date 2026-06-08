import { Handle, Position } from 'reactflow';

export default function ProblemNode({ data, selected }) {
  // Use highlights if present, otherwise use defaults
  const currentBg = data.highlightBg || (selected ? '#e0f2fe' : '#ffffff');
  const currentBorder = data.highlightBorder || (selected ? '#0284c7' : '#333');
  const borderThickness = data.highlightBorder ? '3px' : (selected ? '3px' : '2px');

  return (
    <div
      className="problem-node"
      style={{
        ...baseNodeStyle,
        background: currentBg,
        borderColor: currentBorder,
        borderWidth: borderThickness
      }}
    >
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
  boxShadow: '4px 4px 0px #aaa',
  minWidth: '150px',
  transition: 'all 0.2s ease',
};
