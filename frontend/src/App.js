import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>UbiIntern Automation Platform</h1>
      
      {/* Login Section */}
      <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '20px' }}>
        <h2>Sign In</h2>
        <input type="email" placeholder="Email" style={{ marginRight: '10px', padding: '5px' }} />
        <button>Employee Login</button>
      </div>
      
      {/* Customer Section */}
      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px' }}>
        <h2>Add Customer</h2>
        <input type="text" placeholder="Company Name" style={{ marginRight: '10px', padding: '5px' }} />
        <button>Add Customer</button>
      </div>
      
    </div>
  );
}

export default App;
