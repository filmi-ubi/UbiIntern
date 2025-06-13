import React, { useState } from 'react';
import { FileText, FolderOpen, Plus, Search, Filter, Copy, Edit2, Trash2, Download, Upload, Tag, Clock, Users, Building, Zap, ChevronRight, CheckCircle, AlertCircle, Code, Eye, Save, X, Settings, Share2, Lock, Unlock, Star, GitBranch } from 'lucide-react';

const TemplateManager = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVariableEditor, setShowVariableEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Mock template data
  const documentTemplates = [
    {
      id: 'tmpl-001',
      gid: 'TMPL_MSA_001',
      name: 'Master Service Agreement',
      code: '[TEMPLATE]_Contract_MSA',
      category: 'contracts',
      description: 'Standard master service agreement for enterprise customers',
      variables: [
        { name: 'customer_name', required: true, description: 'Legal company name' },
        { name: 'customer_address', required: true, description: 'Company address' },
        { name: 'contract_value', required: true, description: 'Total contract value' },
        { name: 'contract_term', required: true, description: 'Contract duration' },
        { name: 'start_date', required: true, description: 'Contract start date' }
      ],
      forCustomerTypes: ['enterprise', 'mid-market'],
      version: 3,
      lastModified: '2025-06-01',
      modifiedBy: 'legal@company.com',
      usage: 47,
      starred: true
    },
    {
      id: 'tmpl-002',
      gid: 'TMPL_PILOT_001',
      name: 'Pilot Agreement',
      code: '[TEMPLATE]_Contract_Pilot',
      category: 'contracts',
      description: 'Agreement template for pilot programs',
      variables: [
        { name: 'customer_name', required: true, description: 'Company name' },
        { name: 'pilot_duration', required: true, description: 'Pilot length in days' },
        { name: 'success_criteria', required: false, description: 'Success metrics' }
      ],
      forCustomerTypes: ['startup', 'pilot'],
      version: 2,
      lastModified: '2025-05-15',
      modifiedBy: 'sales@company.com',
      usage: 23,
      starred: false
    },
    {
      id: 'tmpl-003',
      gid: 'TMPL_WELCOME_001',
      name: 'Welcome Email',
      code: '[TEMPLATE]_Email_Welcome',
      category: 'emails',
      description: 'Welcome email for new customers',
      variables: [
        { name: 'customer_name', required: true, description: 'Customer name' },
        { name: 'contact_first_name', required: true, description: 'Contact first name' },
        { name: 'account_manager', required: true, description: 'Assigned AM name' },
        { name: 'onboarding_date', required: false, description: 'Scheduled date' }
      ],
      forCustomerTypes: ['all'],
      version: 5,
      lastModified: '2025-06-10',
      modifiedBy: 'success@company.com',
      usage: 156,
      starred: true
    }
  ];

  const folderTemplates = [
    {
      id: 'folder-001',
      name: 'Standard Customer Folders',
      code: 'standard_customer',
      description: 'Basic folder structure for all customers',
      structure: [
        { name: 'Contracts', subfolders: ['Signed', 'Drafts', 'Amendments'] },
        { name: 'Projects', subfolders: ['Active', 'Completed', 'Planning'] },
        { name: 'Communications', subfolders: ['Emails', 'Meeting Notes', 'Reports'] },
        { name: 'Training', subfolders: ['Materials', 'Recordings', 'Certificates'] },
        { name: 'Support', subfolders: ['Tickets', 'Documentation', 'FAQs'] }
      ],
      forCustomerTypes: ['all'],
      usage: 89
    },
    {
      id: 'folder-002',
      name: 'Pilot Structure',
      code: 'pilot_structure',
      description: 'Optimized folder structure for pilot programs',
      structure: [
        { name: 'Pilot Documents', subfolders: ['Agreement', 'Success Criteria', 'Reports'] },
        { name: 'Testing', subfolders: ['Test Plans', 'Results', 'Feedback'] },
        { name: 'Training', subfolders: ['Quick Start', 'Videos'] },
        { name: 'Communications', subfolders: ['Updates', 'Meetings'] }
      ],
      forCustomerTypes: ['pilot', 'startup'],
      usage: 34
    }
  ];

  const processTemplates = [
    {
      id: 'process-001',
      name: 'Customer Onboarding',
      code: 'customer_onboarding',
      category: 'onboarding',
      description: 'Complete onboarding workflow for new customers',
      steps: [
        { step: 1, name: 'Create folder structure', type: 'create_folders', automated: true },
        { step: 2, name: 'Send welcome email', type: 'send_email', automated: true },
        { step: 3, name: 'Schedule kickoff meeting', type: 'schedule_meeting', automated: false },
        { step: 4, name: 'Create project in system', type: 'create_project', automated: true },
        { step: 5, name: 'Assign team members', type: 'assign_team', automated: false }
      ],
      estimatedDays: 7,
      requiredVariables: ['customer_name', 'primary_contact_email', 'project_type'],
      usage: 67
    },
    {
      id: 'process-002',
      name: 'Contract Renewal',
      code: 'contract_renewal',
      category: 'renewal',
      description: 'Automated contract renewal process',
      steps: [
        { step: 1, name: 'Generate renewal proposal', type: 'create_document', automated: true },
        { step: 2, name: 'Send to legal review', type: 'assign_review', automated: true },
        { step: 3, name: 'Schedule renewal meeting', type: 'schedule_meeting', automated: false },
        { step: 4, name: 'Send contract', type: 'send_document', automated: true },
        { step: 5, name: 'Track signature', type: 'monitor_status', automated: true }
      ],
      estimatedDays: 30,
      requiredVariables: ['customer_name', 'contract_value', 'renewal_date'],
      usage: 28
    }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'contracts', label: 'Contracts' },
    { value: 'emails', label: 'Emails' },
    { value: 'proposals', label: 'Proposals' },
    { value: 'reports', label: 'Reports' },
    { value: 'training', label: 'Training' }
  ];

  const handleCreateTemplate = () => {
    setShowCreateModal(true);
  };

  const handleDuplicateTemplate = (template) => {
    console.log('Duplicating template:', template.name);
    // Create a copy with new version
  };

  const handleDeleteTemplate = (template) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      console.log('Deleting template:', template.id);
    }
  };

  const handleTestTemplate = (template) => {
    console.log('Testing template with sample data:', template.name);
    // Show preview with test data
  };

  const filteredDocuments = documentTemplates.filter(template => {
    if (filterCategory !== 'all' && template.category !== filterCategory) return false;
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !template.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Template Manager</h1>
            <p className="text-sm text-gray-600">Create and manage document, folder, and process templates</p>
          </div>
          <button
            onClick={handleCreateTemplate}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex space-x-6">
          {[
            { id: 'documents', label: 'Document Templates', icon: FileText },
            { id: 'folders', label: 'Folder Templates', icon: FolderOpen },
            { id: 'processes', label: 'Process Templates', icon: Zap }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'documents' && (
          <div>
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <button className="p-2 hover:bg-gray-100 rounded">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-3 gap-6">
              {filteredDocuments.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{template.name}</h3>
                          <p className="text-xs text-gray-500">{template.code}</p>
                        </div>
                      </div>
                      {template.starred && (
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Category:</span>
                        <span className="capitalize">{template.category}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Variables:</span>
                        <span>{template.variables.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Version:</span>
                        <span>v{template.version}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Usage:</span>
                        <span>{template.usage} times</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
                      <Clock className="w-3 h-3" />
                      <span>Modified {template.lastModified} by {template.modifiedBy}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedTemplate(template)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="p-2 border rounded hover:bg-gray-50"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTestTemplate(template)}
                        className="p-2 border rounded hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template)}
                        className="p-2 border border-red-200 text-red-600 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'folders' && (
          <div className="space-y-6">
            {folderTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {template.structure.map((folder, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{folder.name}</span>
                      </div>
                      {folder.subfolders.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {folder.subfolders.map((subfolder, subIndex) => (
                            <div key={subIndex} className="flex items-center space-x-2 text-sm text-gray-600">
                              <ChevronRight className="w-3 h-3" />
                              <FolderOpen className="w-3 h-3" />
                              <span>{subfolder}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4 text-gray-600">
                    <span>Code: <code className="bg-gray-100 px-2 py-1 rounded">{template.code}</code></span>
                    <span>Used {template.usage} times</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800">
                    Preview Structure →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'processes' && (
          <div className="space-y-6">
            {processTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Category: {template.category}</span>
                        <span>•</span>
                        <span>Estimated: {template.estimatedDays} days</span>
                        <span>•</span>
                        <span>Used {template.usage} times</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm">
                        Edit
                      </button>
                      <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h4 className="font-medium mb-3">Process Steps</h4>
                  <div className="space-y-3">
                    {template.steps.map((step) => (
                      <div key={step.step} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{step.name}</span>
                            {step.automated && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs flex items-center">
                                <Zap className="w-3 h-3 mr-1" />
                                Automated
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{step.type}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2 text-sm">Required Variables</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.requiredVariables.map((variable) => (
                        <span key={variable} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Template Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Edit Template: {selectedTemplate.name}</h2>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={selectedTemplate.name}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Code
                  </label>
                  <input
                    type="text"
                    value={selectedTemplate.code}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={selectedTemplate.description}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h