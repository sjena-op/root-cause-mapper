import { Handle, Position } from 'reactflow';

export default function ProblemNode({ data }) {
  return (
    <div className="problem-node" style={nodeStyle}>
      {/* Target handle: where "causes" connect to this problem */}
      <Handle type="target" position={Position.Top} className="handle" />
      
      <div style={{ fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>
        {data.label}
      </div>

      {/* Source handle: where this problem connects to its "effects" */}
      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}

const nodeStyle = {
  padding: '15px 20px',
  borderRadius: '8px',
  background: '#ffffff',
  border: '2px solid #333',
  boxShadow: '4px 4px 0px #aaa',
  minWidth: '150px',
};
