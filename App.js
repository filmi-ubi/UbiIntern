import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    legal_name: '',
    display_name: '',
    organization_code: '',
    email_domains: [''],
    primary_contact_email: ''
  });
  const [lastAutomation, setLastAutomation] = useState(null);

  // Check system status on load
  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => console.log('Backend not available'));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: 'admin@company.com',
          password: 'admin123'
        })
      });
      const data = await response.json();
      if (data.access_token) {
        setToken(data.access_token);
        setIsLoggedIn(true);
        loadCustomers(data.access_token);
      }
    } catch (err) {
      alert('Login failed');
    }
  };

  const loadCustomers = async (authToken) => {
    try {
      const response = await fetch('http://localhost:8000/api/customers', {
        headers: {'Authorization': `Bearer ${authToken}`}
      });
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      console.log('Failed to load customers');
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCustomer)
      });
      const result = await response.json();
      if (result.success) {
        setLastAutomation(result);
        loadCustomers(token);
        setNewCustomer({
          legal_name: '',
          display_name: '',
          organization_code: '',
          email_domains: [''],
          primary_contact_email: ''
        });
      }
    } catch (err) {
      alert('Failed to create customer');
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1>🚀 UbiIntern Automation Platform</h1>
          <p>Complete Business Automation - Eric's Anniversary Hack Day</p>
          <div className="status">
            {systemStatus ? (
              <span className="status-online">✅ Backend Operational</span>
            ) : (
              <span className="status-offline">❌ Backend Offline</span>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h2>Built from Your Vision</h2>
            <p>Authentication • Automation • Google Integration • Search</p>
            <div className="features-grid">
              <div className="feature">
                <h3>🔐 Secure Authentication</h3>
                <p>JWT-based login system with 8-hour sessions</p>
              </div>
              <div className="feature">
                <h3>⚡ Smart Automation</h3>
                <p>Customer creation triggers folder structure automation</p>
              </div>
              <div className="feature">
                <h3>🔍 Universal Search</h3>
                <p>Find customers and documents instantly</p>
              </div>
              <div className="feature">
                <h3>📁 Google Integration</h3>
                <p>Automated Drive folder creation with standard structure</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Login Section */}
      {!isLoggedIn ? (
        <section className="login-section">
          <div className="container">
            <div className="login-card">
              <h3>Employee Portal Access</h3>
              <form onSubmit={handleLogin}>
                <input type="email" value="admin@company.com" readOnly className="readonly" />
                <input type="password" value="admin123" readOnly className="readonly" />
                <button type="submit" className="btn-primary">Sign In to Platform</button>
              </form>
              <p className="demo-note">Demo credentials - real system uses Google OAuth</p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Dashboard Section */}
          <section className="dashboard">
            <div className="container">
              <h3>🎛️ Business Operations Dashboard</h3>
              
              {/* Customer Creation */}
              <div className="dashboard-grid">
                <div className="card">
                  <h4>➕ Add New Customer</h4>
                  <form onSubmit={handleCustomerSubmit} className="customer-form">
                    <input
                      type="text"
                      placeholder="Company Legal Name"
                      value={newCustomer.legal_name}
                      onChange={(e) => setNewCustomer({...newCustomer, legal_name: e.target.value})}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Display Name"
                      value={newCustomer.display_name}
                      onChange={(e) => setNewCustomer({...newCustomer, display_name: e.target.value})}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Organization Code"
                      value={newCustomer.organization_code}
                      onChange={(e) => setNewCustomer({...newCustomer, organization_code: e.target.value})}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Primary Contact Email"
                      value={newCustomer.primary_contact_email}
                      onChange={(e) => setNewCustomer({...newCustomer, primary_contact_email: e.target.value})}
                      required
                    />
                    <button type="submit" className="btn-primary">Create Customer & Trigger Automation</button>
                  </form>
                </div>

                {/* Customer List */}
                <div className="card">
                  <h4>👥 Current Customers ({customers.length})</h4>
                  <div className="customer-list">
                    {customers.map(customer => (
                      <div key={customer.id} className="customer-item">
                        <strong>{customer.legal_name}</strong>
                        <span className="status-badge">{customer.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Automation Results */}
              {lastAutomation && (
                <div className="automation-results">
                  <h4>🎉 Latest Automation Success</h4>
                  <div className="automation-card">
                    <div className="automation-header">
                      <strong>Customer: {customers.find(c => c.id === lastAutomation.customer_id)?.legal_name}</strong>
                      <span className="success-badge">✅ Automation Complete</span>
                    </div>
                    <div className="automation-details">
                      <p><strong>📁 Folder Created:</strong> <a href={lastAutomation.folder_url} target="_blank" rel="noopener noreferrer">{lastAutomation.folder_id}</a></p>
                      <p><strong>📂 Subfolders:</strong></p>
                      <div className="subfolder-list">
                        {lastAutomation.subfolders_created?.map(folder => (
                          <span key={folder} className="folder-tag">{folder}</span>
                        ))}
                      </div>
                      <p><strong>Mode:</strong> {lastAutomation.mode === 'mock' ? '🔧 Mock (Ready for Google API)' : '🌐 Live Google Drive'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* System Information */}
          <section className="system-info">
            <div className="container">
              <h4>⚙️ System Architecture</h4>
              <div className="architecture-grid">
                <div className="arch-item">
                  <h5>Backend API</h5>
                  <p>FastAPI • JWT Auth • PostgreSQL Ready</p>
                  <span className="status-online">Operational</span>
                </div>
                <div className="arch-item">
                  <h5>Google Integration</h5>
                  <p>Drive API • Folder Automation • Mock Mode</p>
                  <span className="status-ready">Ready for Production</span>
                </div>
                <div className="arch-item">
                  <h5>Database Layer</h5>
                  <p>Eric's Schema • 70+ Tables • Mock Data</p>
                  <span className="status-pending">Schema Ready</span>
                </div>
                <div className="arch-item">
                  <h5>Frontend Interface</h5>
                  <p>React 18 • Modern UI • API Integration</p>
                  <span className="status-online">Live Demo</span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>Built for Eric's Anniversary Hackathon • Team UbiIntern • Competing for $6,000+ in prizes</p>
          <p><strong>Demo Ready:</strong> Authentication ✓ Automation ✓ Google Integration ✓ Search ✓</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
