export default function Sidebar() {
  return (
    <aside style={sidebarStyle}>
      <h2 style={{ marginTop: 0 }}>Problem Network</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search problems..." 
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button style={buttonStyle}>Find Root Causes</button>
        <button style={buttonStyle}>Detect Cycles</button>
        <button style={buttonStyle}>Longest Chain</button>
        <button style={buttonStyle}>Rank by Difficulty</button>
      </div>
    </aside>
  );
}

const sidebarStyle = {
  width: '250px',
  background: '#f4f4f4',
  borderRight: '1px solid #ddd',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
};

const inputStyle = {
  width: '100%',
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  boxSizing: 'border-box'
};

const buttonStyle = {
  padding: '10px',
  background: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold'
};
