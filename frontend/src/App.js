import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [customers, setCustomers] = useState([]); // Always initialize as array
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    legal_name: '',
    display_name: '',
    organization_code: '',
    email_domains: ['example.com'], // Fixed: provide default domain
    primary_contact_email: ''
  });
  const [lastAutomation, setLastAutomation] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({
    email: 'admin@company.com',
    password: 'admin123'
  });

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
        body: JSON.stringify(loginForm)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Login failed');
        return;
      }
      
      const data = await response.json();
      if (data.access_token) {
        setToken(data.access_token);
        setIsLoggedIn(true);
        loadCustomers(data.access_token);
      }
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  };

  const loadCustomers = async (authToken) => {
    try {
      const response = await fetch('http://localhost:8000/api/customers', {
        headers: {'Authorization': `Bearer ${authToken}`}
      });
      
      if (!response.ok) {
        console.log('Failed to load customers:', response.status);
        setCustomers([]); // Set empty array on error
        return;
      }
      
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        console.log('Customers response is not an array:', data);
        setCustomers([]);
      }
    } catch (err) {
      console.log('Failed to load customers:', err);
      setCustomers([]); // Set empty array on error
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 0 && token) {
      try {
        const response = await fetch(`http://localhost:8000/api/search?q=${query}`, {
          headers: {'Authorization': `Bearer ${token}`}
        });
        const data = await response.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.log('Search failed');
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting customer:', newCustomer); // Debug log
    
    try {
      const response = await fetch('http://localhost:8000/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCustomer)
      });
      
      console.log('Response status:', response.status); // Debug log
      const result = await response.json();
      console.log('Response data:', result); // Debug log
      
      if (result.success) {
        setLastAutomation(result);
        loadCustomers(token);
        setNewCustomer({
          legal_name: '',
          display_name: '',
          organization_code: '',
          email_domains: ['example.com'],
          primary_contact_email: ''
        });
        setActiveView('automation');
      } else {
        alert('Error creating customer: ' + JSON.stringify(result));
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to create customer: ' + err.message);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="App">
        <header className="header">
          <div className="container">
            <h1>UbiIntern Automation Platform</h1>
            <p>Business Process Automation System</p>
          </div>
        </header>

        <main className="login-main">
          <div className="container">
            <div className="login-section">
              <div className="login-card">
                <h2>Employee Portal Access</h2>
                <form onSubmit={handleLogin} className="login-form">
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary">Sign In</button>
                </form>
                
                <div className="system-status">
                  <span className="status-label">System Status:</span>
                  {systemStatus ? (
                    <span className="status-online">Online</span>
                  ) : (
                    <span className="status-offline">Offline</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <h1>UbiIntern Automation Platform</h1>
            <nav className="nav">
              <button 
                className={activeView === 'dashboard' ? 'nav-item active' : 'nav-item'}
                onClick={() => setActiveView('dashboard')}
              >
                Dashboard
              </button>
              <button 
                className={activeView === 'customers' ? 'nav-item active' : 'nav-item'}
                onClick={() => setActiveView('customers')}
              >
                Customers
              </button>
              <button 
                className={activeView === 'automation' ? 'nav-item active' : 'nav-item'}
                onClick={() => setActiveView('automation')}
              >
                Automation
              </button>
            </nav>
            <div className="header-actions">
              <div className="search-bar">
                <input 
                  type="text" 
                  placeholder="Search customers, contacts, files..." 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((result, index) => (
                      <div key={index} className="search-result-item">
                        <span className="result-type">{result.type}</span>
                        <span className="result-title">{result.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="user-info">{loginForm.email}</span>
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  setToken(null);
                  setCustomers([]);
                }}
                className="btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {activeView === 'dashboard' && (
            <div className="dashboard-view">
              <div className="page-header">
                <h2>System Dashboard</h2>
                <p>Overview of automation platform status and recent activity</p>
              </div>
              
              <div className="dashboard-grid">
                <div className="stat-card">
                  <h3>Total Customers</h3>
                  <div className="stat-value">{customers.length}</div>
                </div>
                <div className="stat-card">
                  <h3>Active Automations</h3>
                  <div className="stat-value">5</div>
                </div>
                <div className="stat-card">
                  <h3>Folders Created</h3>
                  <div className="stat-value">{customers.length * 5}</div>
                </div>
                <div className="stat-card">
                  <h3>System Status</h3>
                  <div className="stat-value status-operational">Operational</div>
                </div>
              </div>

              <div className="dashboard-sections">
                <div className="section">
                  <h3>Recent Customers</h3>
                  <div className="customer-list">
                    {customers.length > 0 ? (
                      customers.slice(-3).map(customer => (
                        <div key={customer.id} className="customer-item">
                          <div className="customer-info">
                            <span className="customer-name">{customer.legal_name}</span>
                            <span className="customer-status">{customer.status}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No customers available</p>
                    )}
                  </div>
                </div>

                <div className="section">
                  <h3>System Architecture</h3>
                  <div className="architecture-list">
                    <div className="arch-item">
                      <span className="arch-component">Backend API</span>
                      <span className="arch-status operational">Operational</span>
                    </div>
                    <div className="arch-item">
                      <span className="arch-component">Database Layer</span>
                      <span className="arch-status ready">Ready</span>
                    </div>
                    <div className="arch-item">
                      <span className="arch-component">Google Integration</span>
                      <span className="arch-status mock">Mock Mode</span>
                    </div>
                    <div className="arch-item">
                      <span className="arch-component">Authentication</span>
                      <span className="arch-status operational">Operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'customers' && (
            <div className="customers-view">
              <div className="page-header">
                <h2>Customer Management</h2>
                <p>Add and manage customer accounts with automated folder creation</p>
              </div>

              <div className="customers-grid">
                <div className="customers-section">
                  <h3>Add New Customer</h3>
                  <form onSubmit={handleCustomerSubmit} className="customer-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Legal Company Name</label>
                        <input
                          type="text"
                          value={newCustomer.legal_name}
                          onChange={(e) => setNewCustomer({...newCustomer, legal_name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Display Name</label>
                        <input
                          type="text"
                          value={newCustomer.display_name}
                          onChange={(e) => setNewCustomer({...newCustomer, display_name: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Organization Code</label>
                        <input
                          type="text"
                          value={newCustomer.organization_code}
                          onChange={(e) => setNewCustomer({...newCustomer, organization_code: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email Domain</label>
                        <input
                          type="text"
                          placeholder="example.com"
                          value={newCustomer.email_domains[0] || ''}
                          onChange={(e) => setNewCustomer({...newCustomer, email_domains: [e.target.value]})}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Primary Contact Email</label>
                        <input
                          type="email"
                          value={newCustomer.primary_contact_email}
                          onChange={(e) => setNewCustomer({...newCustomer, primary_contact_email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary">Create Customer</button>
                  </form>
                </div>

                <div className="customers-section">
                  <h3>Current Customers ({customers.length})</h3>
                  <div className="customers-table">
                    <div className="table-header">
                      <span>Company</span>
                      <span>Code</span>
                      <span>Status</span>
                    </div>
                    {customers.length > 0 ? (
                      customers.map(customer => (
                        <div key={customer.id} className="table-row">
                          <span className="company-name">{customer.legal_name}</span>
                          <span className="company-code">{customer.id}</span>
                          <span className="company-status">{customer.status}</span>
                        </div>
                      ))
                    ) : (
                      <div className="table-row">
                        <span>No customers found</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'automation' && (
            <div className="automation-view">
              <div className="page-header">
                <h2>Automation Results</h2>
                <p>Real-time automation execution and folder creation status</p>
              </div>

              {lastAutomation && (
                <div className="automation-result">
                  <div className="result-header">
                    <h3>Latest Automation: {customers.find(c => c.id === lastAutomation.customer_id)?.legal_name}</h3>
                    <span className="automation-status success">Completed Successfully</span>
                  </div>
                  
                  <div className="automation-details">
                    <div className="detail-section">
                      <h4>Folder Creation</h4>
                      <div className="folder-info">
                        <p><strong>Folder ID:</strong> {lastAutomation.folder_id}</p>
                        <p><strong>Mode:</strong> {lastAutomation.mode === 'mock' ? 'Mock (Development)' : 'Production'}</p>
                        <p><strong>URL:</strong> <a href={lastAutomation.folder_url} target="_blank" rel="noopener noreferrer">{lastAutomation.folder_url}</a></p>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Subfolder Structure</h4>
                      <div className="subfolders-grid">
                        {lastAutomation.subfolders_created?.map(folder => (
                          <div key={folder} className="subfolder-item">{folder}</div>
                        ))}
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Automation Message</h4>
                      <p className="automation-message">{lastAutomation.message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="automation-info">
                <h3>Automation Capabilities</h3>
                <div className="capabilities-grid">
                  <div className="capability-item">
                    <h4>Folder Creation</h4>
                    <p>Automated Google Drive folder structure with standardized subfolder hierarchy</p>
                  </div>
                  <div className="capability-item">
                    <h4>Customer Onboarding</h4>
                    <p>Complete customer setup process with document organization and access control</p>
                  </div>
                  <div className="capability-item">
                    <h4>Process Automation</h4>
                    <p>Trigger-based workflow automation for common business processes</p>
                  </div>
                  <div className="capability-item">
                    <h4>Data Integration</h4>
                    <p>Seamless integration between customer data and document management systems</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;