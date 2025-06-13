import React, { useState } from 'react';
import { Upload, Users, FileSpreadsheet, CheckCircle, AlertCircle, X, Download, RefreshCw, Database, Mail, Building, Phone, Globe, Tag, ArrowRight, Search, Filter, Plus, Edit2, Trash2, FolderOpen } from 'lucide-react';

const CustomerImportManager = () => {
  const [activeTab, setActiveTab] = useState('import');
  const [importStep, setImportStep] = useState(1);
  const [mappedFields, setMappedFields] = useState({});
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  
  // Mock import data
  const importPreview = [
    {
      row: 1,
      data: {
        company: 'Acme Corporation',
        contact: 'Jane Smith',
        email: 'jane@acme.com',
        phone: '+1-555-0123',
        type: 'Enterprise',
        status: 'Active'
      },
      validation: { valid: true, errors: [] }
    },
    {
      row: 2,
      data: {
        company: 'TechStart Inc',
        contact: 'Bob Johnson',
        email: 'bob@techstart',
        phone: '555-0456',
        type: 'Startup',
        status: 'Pilot'
      },
      validation: { valid: false, errors: ['Invalid email format'] }
    },
    {
      row: 3,
      data: {
        company: 'Global Industries',
        contact: 'Mike Wilson',
        email: 'mike@global.com',
        phone: '+1-555-0789',
        type: 'Enterprise',
        status: 'Prospect'
      },
      validation: { valid: true, errors: [] }
    }
  ];

  const existingCustomers = [
    {
      id: 'org-001',
      organization_code: 'ACME_CORP',
      legal_name: 'Acme Corporation',
      display_name: 'Acme Corp',
      org_type: 'customer',
      status: 'active',
      customer_status: 'licensed',
      mrr: 12500,
      email_domains: ['acme.com', 'acme.co.uk'],
      primary_contact: {
        name: 'Jane Smith',
        email: 'jane@acme.com',
        resourceName: 'people/c123456'
      },
      drive_root_folder_gid: '1A2B3C4D5E6F',
      tags: ['enterprise', 'priority', 'tech-sector'],
      created_at: '2023-03-15'
    },
    {
      id: 'org-002',
      organization_code: 'TECHSTART',
      legal_name: 'TechStart Inc',
      display_name: 'TechStart',
      org_type: 'customer',
      status: 'active',
      customer_status: 'piloting',
      mrr: 0,
      email_domains: ['techstart.com'],
      primary_contact: {
        name: 'Bob Johnson',
        email: 'bob@techstart.com',
        resourceName: 'people/c789012'
      },
      drive_root_folder_gid: '2B3C4D5E6F7G',
      tags: ['startup', 'pilot', 'saas'],
      created_at: '2025-05-01'
    }
  ];

  const fieldMappings = [
    { source: 'company', target: 'legal_name', mapped: true },
    { source: 'contact', target: 'primary_contact_name', mapped: true },
    { source: 'email', target: 'primary_email', mapped: true },
    { source: 'phone', target: 'primary_phone', mapped: true },
    { source: 'type', target: 'size_category', mapped: true },
    { source: 'status', target: 'customer_status', mapped: true }
  ];

  const importActions = [
    { id: 'create_folders', label: 'Create Drive folder structure', enabled: true },
    { id: 'send_welcome', label: 'Send welcome email', enabled: true },
    { id: 'create_contact', label: 'Create Google Contact', enabled: true },
    { id: 'schedule_kickoff', label: 'Schedule kickoff meeting', enabled: false },
    { id: 'assign_manager', label: 'Assign account manager', enabled: true }
  ];

  const handleSelectCustomer = (id) => {
    setSelectedCustomers(prev =>
      prev.includes(id)
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Customer Data Management</h2>
            <p className="text-sm text-gray-600">Import, manage, and enrich customer information</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 border rounded hover:bg-gray-50 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex space-x-6">
          {['import', 'manage', 'enrich'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'import' && 'Import Customers'}
              {tab === 'manage' && 'Manage Existing'}
              {tab === 'enrich' && 'Data Enrichment'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'import' && (
          <div className="max-w-4xl mx-auto">
            {/* Import Steps */}
            <div className="flex items-center justify-between mb-8">
              {[
                { step: 1, label: 'Upload File' },
                { step: 2, label: 'Map Fields' },
                { step: 3, label: 'Validate Data' },
                { step: 4, label: 'Configure Actions' },
                { step: 5, label: 'Import' }
              ].map((s, index) => (
                <div key={s.step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                      importStep >= s.step
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {importStep > s.step ? <CheckCircle className="w-5 h-5" /> : s.step}
                  </div>
                  <div className="ml-2 text-sm font-medium">{s.label}</div>
                  {index < 4 && (
                    <ArrowRight className="w-4 h-4 mx-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            {importStep === 1 && (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload Customer Data</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Drop your CSV, Excel file here, or click to browse
                  </p>
                  <input type="file" className="hidden" id="file-upload" />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
                  >
                    Select File
                  </label>
                  <div className="mt-6 text-xs text-gray-500">
                    Supported formats: CSV, XLSX, Google Sheets URL
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setImportStep(2)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Next: Map Fields
                  </button>
                </div>
              </div>
            )}

            {importStep === 2 && (
              <div className="bg-white rounded-lg shadow p-8">
                <h3 className="text-lg font-medium mb-4">Map Your Fields</h3>
                <div className="space-y-3">
                  {fieldMappings.map((mapping) => (
                    <div key={mapping.source} className="flex items-center space-x-4">
                      <div className="w-1/3">
                        <div className="px-3 py-2 bg-gray-100 rounded text-sm">
                          {mapping.source}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="w-1/3">
                        <select className="w-full px-3 py-2 border rounded text-sm">
                          <option value={mapping.target}>{mapping.target}</option>
                          <option value="">-- Skip this field --</option>
                          <option value="display_name">display_name</option>
                          <option value="industry">industry</option>
                          <option value="tags">tags</option>
                        </select>
                      </div>
                      <div className="w-1/3 text-sm text-gray-500">
                        Sample: "{importPreview[0].data[mapping.source]}"
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setImportStep(1)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setImportStep(3)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Next: Validate
                  </button>
                </div>
              </div>
            )}

            {importStep === 3 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-medium">Data Validation</h3>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>2 valid records</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span>1 record with issues</span>
                    </div>
                  </div>
                </div>
                <div className="divide-y">
                  {importPreview.map((record) => (
                    <div key={record.row} className={`p-4 ${!record.validation.valid ? 'bg-yellow-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            record.validation.valid ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            {record.validation.valid ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{record.data.company}</div>
                            <div className="text-sm text-gray-500">
                              {record.data.contact} • {record.data.email}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm">
                          {record.validation.errors.length > 0 && (
                            <span className="text-red-600">{record.validation.errors[0]}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t flex justify-between">
                  <button
                    onClick={() => setImportStep(2)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setImportStep(4)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Next: Configure Actions
                  </button>
                </div>
              </div>
            )}

            {importStep === 4 && (
              <div className="bg-white rounded-lg shadow p-8">
                <h3 className="text-lg font-medium mb-4">Configure Import Actions</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Select what should happen automatically when these customers are imported
                </p>
                <div className="space-y-3">
                  {importActions.map((action) => (
                    <label key={action.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={action.enabled}
                        className="rounded text-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-sm">{action.label}</div>
                        {action.id === 'create_folders' && (
                          <div className="text-xs text-gray-500 mt-1">
                            Creates standard folder structure in Google Drive
                          </div>
                        )}
                        {action.id === 'send_welcome' && (
                          <div className="text-xs text-gray-500 mt-1">
                            Sends welcome email to primary contact
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setImportStep(3)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setImportStep(5)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Start Import
                  </button>
                </div>
              </div>
            )}

            {importStep === 5 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Import Complete!</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Successfully imported 2 customers. 1 record skipped due to validation errors.
                </p>
                <div className="space-y-2 text-sm text-left max-w-md mx-auto">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>2 Drive folders created</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>2 welcome emails sent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>2 contacts created in Google</span>
                  </div>
                </div>
                <div className="mt-6">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    View Imported Customers
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div>
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select className="px-4 py-2 border rounded-lg">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Pilot</option>
                  <option>Prospect</option>
                  <option>Churned</option>
                </select>
                <select className="px-4 py-2 border rounded-lg">
                  <option>All Types</option>
                  <option>Enterprise</option>
                  <option>Mid-Market</option>
                  <option>Startup</option>
                </select>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>More Filters</span>
                </button>
              </div>
            </div>

            {/* Customer List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedCustomers.length} of {existingCustomers.length} selected
                  </span>
                  {selectedCustomers.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                        Bulk Edit
                      </button>
                      <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                        Export Selected
                      </button>
                      <button className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-4">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedCustomers.length === existingCustomers.length}
                        onChange={() => {
                          if (selectedCustomers.length === existingCustomers.length) {
                            setSelectedCustomers([]);
                          } else {
                            setSelectedCustomers(existingCustomers.map(c => c.id));
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-4 font-medium text-gray-700">Organization</th>
                    <th className="text-left p-4 font-medium text-gray-700">Primary Contact</th>
                    <th className="text-left p-4 font-medium text-gray-700">Status</th>
                    <th className="text-left p-4 font-medium text-gray-700">MRR</th>
                    <th className="text-left p-4 font-medium text-gray-700">Tags</th>
                    <th className="text-right p-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {existingCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{customer.display_name}</div>
                          <div className="text-sm text-gray-500">{customer.organization_code}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>{customer.primary_contact.name}</div>
                          <div className="text-gray-500">{customer.primary_contact.email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.customer_status === 'licensed' ? 'bg-green-100 text-green-700' :
                          customer.customer_status === 'piloting' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {customer.customer_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">${customer.mrr.toLocaleString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {customer.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {customer.tags.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              +{customer.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-1">
                          <button className="p-1 hover:bg-gray-200 rounded">
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-200 rounded">
                            <FolderOpen className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-200 rounded">
                            <Mail className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'enrich' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-lg font-medium mb-4">Data Enrichment Sources</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Database className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Google Contacts Sync</div>
                        <div className="text-sm text-gray-500">
                          Enrich with phone numbers, addresses, and social profiles
                        </div>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                      Sync Now
                    </button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Email History Analysis</div>
                        <div className="text-sm text-gray-500">
                          Extract contacts and engagement patterns from Gmail
                        </div>
                      </div>
                    </div>
                    <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm">
                      Configure
                    </button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Globe className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">Web Research</div>
                        <div className="text-sm text-gray-500">
                          Automatically research company size, industry, and news
                        </div>
                      </div>
                    </div>
                    <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerImportManager;