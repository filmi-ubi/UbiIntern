import React, { useState } from 'react';
import { Building, User, Mail, Phone, Globe, Tag, FolderPlus, Calendar, DollarSign, AlertCircle, CheckCircle, Save, X, Plus, Trash2, Search, Zap, FileText, Users, Briefcase, Shield, ArrowRight, Info } from 'lucide-react';

const AddCustomerPage = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    // Organization Details
    organization_code: '',
    legal_name: '',
    display_name: '',
    org_type: 'customer',
    customer_status: 'prospect',
    industry: '',
    size_category: '',
    email_domains: [''],
    tags: [],
    
    // Primary Contact
    primary_contact: {
      given_name: '',
      family_name: '',
      email: '',
      phone: '',
      title: '',
      department: '',
      create_google_contact: true
    },
    
    // Additional Contacts
    additional_contacts: [],
    
    // Google Workspace Setup
    create_drive_folder: true,
    folder_template: 'standard_customer',
    initial_permissions: {
      view_only: [],
      can_edit: []
    },
    
    // Automation Settings
    enable_automations: true,
    selected_automations: {
      welcome_sequence: true,
      document_templates: true,
      meeting_scheduler: false,
      quarterly_checkins: true
    },
    
    // Initial Project/Pilot
    create_initial_project: false,
    initial_project: {
      type: 'pilot',
      name: '',
      start_date: '',
      end_date: '',
      manager: '',
      budget: '',
      description: ''
    }
  });

  const [validation, setValidation] = useState({});
  const [isSearchingContact, setIsSearchingContact] = useState(false);
  const [suggestedContacts, setSuggestedContacts] = useState([]);

  const steps = [
    { number: 1, name: 'Organization Details', icon: Building },
    { number: 2, name: 'Contact Information', icon: Users },
    { number: 3, name: 'Google Workspace', icon: FolderPlus },
    { number: 4, name: 'Automation Setup', icon: Zap },
    { number: 5, name: 'Review & Create', icon: CheckCircle }
  ];

  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
    'Education', 'Government', 'Non-profit', 'Media', 'Other'
  ];

  const sizeCategories = [
    { value: 'startup', label: 'Startup (1-50 employees)' },
    { value: 'small', label: 'Small (51-200 employees)' },
    { value: 'medium', label: 'Medium (201-1000 employees)' },
    { value: 'enterprise', label: 'Enterprise (1000+ employees)' }
  ];

  const folderTemplates = [
    { 
      value: 'standard_customer', 
      label: 'Standard Customer Folders',
      description: 'Contracts, Projects, Communications, Training',
      folders: ['Contracts', 'Projects', 'Communications', 'Training', 'Reports']
    },
    { 
      value: 'pilot_structure', 
      label: 'Pilot Structure',
      description: 'Optimized for pilot programs',
      folders: ['Pilot Docs', 'Testing', 'Feedback', 'Results']
    },
    { 
      value: 'enterprise_complete', 
      label: 'Enterprise Complete',
      description: 'Full structure for large deployments',
      folders: ['Contracts', 'Projects', 'Architecture', 'Security', 'Training', 'Support', 'Billing']
    }
  ];

  const automationOptions = [
    {
      id: 'welcome_sequence',
      name: 'Welcome Sequence',
      description: 'Automated welcome emails and initial setup tasks',
      triggers: ['Customer status → Active']
    },
    {
      id: 'document_templates',
      name: 'Document Templates',
      description: 'Auto-populate contracts and agreements',
      triggers: ['Project created', 'Status changes']
    },
    {
      id: 'meeting_scheduler',
      name: 'Meeting Scheduler',
      description: 'Automatic kickoff and check-in meetings',
      triggers: ['Project start', 'Milestone reached']
    },
    {
      id: 'quarterly_checkins',
      name: 'Quarterly Check-ins',
      description: 'Scheduled business reviews and health checks',
      triggers: ['Every 3 months']
    }
  ];

  const generateOrgCode = (legalName) => {
    return legalName
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.slice(0, 4))
      .join('_')
      .slice(0, 20);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newData[parent] = { ...newData[parent], [child]: value };
      } else {
        newData[field] = value;
      }
      
      // Auto-generate organization code
      if (field === 'legal_name' && !prev.organization_code) {
        newData.organization_code = generateOrgCode(value);
      }
      
      // Auto-fill display name
      if (field === 'legal_name' && !prev.display_name) {
        newData.display_name = value;
      }
      
      return newData;
    });
  };

  const addEmailDomain = () => {
    setFormData(prev => ({
      ...prev,
      email_domains: [...prev.email_domains, '']
    }));
  };

  const removeEmailDomain = (index) => {
    setFormData(prev => ({
      ...prev,
      email_domains: prev.email_domains.filter((_, i) => i !== index)
    }));
  };

  const updateEmailDomain = (index, value) => {
    setFormData(prev => ({
      ...prev,
      email_domains: prev.email_domains.map((domain, i) => 
        i === index ? value : domain
      )
    }));
  };

  const searchGoogleContacts = async (email) => {
    setIsSearchingContact(true);
    // Simulate API call to Google People API
    setTimeout(() => {
      setSuggestedContacts([
        {
          resourceName: 'people/c' + Math.random().toString(36).substr(2, 9),
          email: email,
          name: 'John Doe',
          organization: 'Suggested Company',
          exists: true
        }
      ]);
      setIsSearchingContact(false);
    }, 1000);
  };

  const addAdditionalContact = () => {
    setFormData(prev => ({
      ...prev,
      additional_contacts: [...prev.additional_contacts, {
        given_name: '',
        family_name: '',
        email: '',
        phone: '',
        title: '',
        role: 'technical'
      }]
    }));
  };

  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 1:
        if (!formData.legal_name) errors.legal_name = 'Legal name is required';
        if (!formData.organization_code) errors.organization_code = 'Organization code is required';
        if (formData.email_domains.filter(d => d).length === 0) {
          errors.email_domains = 'At least one email domain is required';
        }
        break;
      case 2:
        if (!formData.primary_contact.email) errors.primary_email = 'Primary contact email is required';
        if (!formData.primary_contact.given_name) errors.primary_name = 'Primary contact name is required';
        break;
      case 3:
        if (formData.create_drive_folder && !formData.folder_template) {
          errors.folder_template = 'Please select a folder template';
        }
        break;
    }
    
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // This would submit to your API
    console.log('Submitting customer data:', formData);
    // Show success message and redirect
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Add New Customer</h1>
            <p className="text-sm text-gray-600">Set up a new customer organization with automated workflows</p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center cursor-pointer ${
                    activeStep === step.number ? 'text-blue-600' : 
                    activeStep > step.number ? 'text-green-600' : 'text-gray-400'
                  }`}
                  onClick={() => activeStep > step.number && setActiveStep(step.number)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    activeStep === step.number ? 'border-blue-600 bg-blue-50' :
                    activeStep > step.number ? 'border-green-600 bg-green-50' :
                    'border-gray-300 bg-white'
                  }`}>
                    {activeStep > step.number ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="ml-2 font-medium hidden sm:inline">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    activeStep > step.number ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Step 1: Organization Details */}
        {activeStep === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6">Organization Details</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Name *
                </label>
                <input
                  type="text"
                  value={formData.legal_name}
                  onChange={(e) => handleInputChange('legal_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    validation.legal_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Acme Corporation"
                />
                {validation.legal_name && (
                  <p className="text-red-500 text-xs mt-1">{validation.legal_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Code *
                </label>
                <input
                  type="text"
                  value={formData.organization_code}
                  onChange={(e) => handleInputChange('organization_code', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    validation.organization_code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ACME_CORP"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated or customize</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Acme Corp"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Status
                </label>
                <select
                  value={formData.customer_status}
                  onChange={(e) => handleInputChange('customer_status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="prospect">Prospect</option>
                  <option value="piloting">Piloting</option>
                  <option value="licensed">Licensed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Industry</option>
                  {industryOptions.map(ind => (
                    <option key={ind} value={ind.toLowerCase()}>{ind}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Size
                </label>
                <select
                  value={formData.size_category}
                  onChange={(e) => handleInputChange('size_category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Size</option>
                  {sizeCategories.map(size => (
                    <option key={size.value} value={size.value}>{size.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email Domains */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Domains *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Emails from these domains will be automatically associated with this customer
              </p>
              {formData.email_domains.map((domain, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => updateEmailDomain(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="example.com"
                  />
                  {formData.email_domains.length > 1 && (
                    <button
                      onClick={() => removeEmailDomain(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {validation.email_domains && (
                <p className="text-red-500 text-xs mb-2">{validation.email_domains}</p>
              )}
              <button
                onClick={addEmailDomain}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add another domain
              </button>
            </div>

            {/* Tags */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                placeholder="Enter tags separated by commas"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                    setFormData(prev => ({ ...prev, tags: [...prev.tags, ...tags] }));
                    e.target.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center">
                    {tag}
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        tags: prev.tags.filter((_, i) => i !== index)
                      }))}
                      className="ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact Information */}
        {activeStep === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6">Contact Information</h2>
            
            {/* Primary Contact */}
            <div className="mb-8">
              <h3 className="font-medium mb-4 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Primary Contact
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.primary_contact.given_name}
                    onChange={(e) => handleInputChange('primary_contact.given_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      validation.primary_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.primary_contact.family_name}
                    onChange={(e) => handleInputChange('primary_contact.family_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.primary_contact.email}
                      onChange={(e) => {
                        handleInputChange('primary_contact.email', e.target.value);
                        if (e.target.value.includes('@')) {
                          searchGoogleContacts(e.target.value);
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        validation.primary_email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {isSearchingContact && (
                      <div className="absolute right-2 top-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.primary_contact.phone}
                    onChange={(e) => handleInputChange('primary_contact.phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.primary_contact.title}
                    onChange={(e) => handleInputChange('primary_contact.title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="CEO, CTO, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.primary_contact.department}
                    onChange={(e) => handleInputChange('primary_contact.department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Google Contact Integration */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.primary_contact.create_google_contact}
                    onChange={(e) => handleInputChange('primary_contact.create_google_contact', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="ml-2 text-sm">Create/Update Google Contact</span>
                </label>
                {suggestedContacts.length > 0 && (
                  <div className="mt-2 text-xs text-blue-700">
                    <Info className="w-3 h-3 inline mr-1" />
                    Found existing contact in Google Contacts - will update instead of creating new
                  </div>
                )}
              </div>
            </div>

            {/* Additional Contacts */}
            <div>
              <h3 className="font-medium mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Additional Contacts
                </span>
                <button
                  onClick={addAdditionalContact}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Contact
                </button>
              </h3>
              
              {formData.additional_contacts.map((contact, index) => (
                <div key={index} className="p-4 border rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Contact {index + 2}</span>
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        additional_contacts: prev.additional_contacts.filter((_, i) => i !== index)
                      }))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="First Name"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="technical">Technical Contact</option>
                      <option value="billing">Billing Contact</option>
                      <option value="executive">Executive Sponsor</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Google Workspace Setup */}
        {activeStep === 3 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6">Google Workspace Setup</h2>
            
            {/* Drive Folder Creation */}
            <div className="mb-8">
              <h3 className="font-medium mb-4 flex items-center">
                <FolderPlus className="w-4 h-4 mr-2" />
                Drive Folder Structure
              </h3>
              
              <label className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={formData.create_drive_folder}
                  onChange={(e) => handleInputChange('create_drive_folder', e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="ml-2">Create Google Drive folder structure</span>
              </label>
              
              {formData.create_drive_folder && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Folder Template
                  </label>
                  <div className="space-y-3">
                    {folderTemplates.map((template) => (
                      <label
                        key={template.value}
                        className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                          formData.folder_template === template.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="folder_template"
                          value={template.value}
                          checked={formData.folder_template === template.value}
                          onChange={(e) => handleInputChange('folder_template', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-start">
                          <div className="flex-1">
                            <div className="font-medium">{template.label}</div>
                            <div className="text-sm text-gray-600 mt-1">{template.description}</div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {template.folders.map((folder) => (
                                <span key={folder} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {folder}
                                </span>
                              ))}
                            </div>
                          </div>
                          {formData.folder_template === template.value && (
                            <CheckCircle className="w-5 h-5 text-blue-600 ml-3" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  {validation.folder_template && (
                    <p className="text-red-500 text-xs mt-2">{validation.folder_template}</p>
                  )}
                </div>
              )}
            </div>

            {/* Initial Permissions */}
            <div>
              <h3 className="font-medium mb-4 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Initial Permissions
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    View-only Access
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="email"
                      placeholder="Enter email addresses"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value) {
                          e.preventDefault();
                          setFormData(prev => ({
                            ...prev,
                            initial_permissions: {
                              ...prev.initial_permissions,
                              view_only: [...prev.initial_permissions.view_only, e.target.value]
                            }
                          }));
                          e.target.value = '';
                        }
                      }}
                    />
                    <button className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.initial_permissions.view_only.map((email, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs flex items-center">
                        {email}
                        <X className="w-3 h-3 ml-1 cursor-pointer" />
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edit Access
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Customer contacts will automatically get view access to their folders
                  </p>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Select team members</option>
                    <option>John Williams (Account Manager)</option>
                    <option>Sarah Chen (Technical Lead)</option>
                    <option>Mike Johnson (Legal)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Automation Setup */}
        {activeStep === 4 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6">Automation Setup</h2>
            
            <label className="flex items-center mb-6">
              <input
                type="checkbox"
                checked={formData.enable_automations}
                onChange={(e) => handleInputChange('enable_automations', e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="ml-2 font-medium">Enable automated workflows for this customer</span>
            </label>
            
            {formData.enable_automations && (
              <>
                <div className="space-y-4 mb-8">
                  {automationOptions.map((automation) => (
                    <label
                      key={automation.id}
                      className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.selected_automations[automation.id]
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={formData.selected_automations[automation.id] || false}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            selected_automations: {
                              ...prev.selected_automations,
                              [automation.id]: e.target.checked
                            }
                          }))}
                          className="rounded text-blue-600 mt-1"
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-medium">{automation.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{automation.description}</div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              Triggers:
                            </span>
                            {automation.triggers.map((trigger, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 rounded">
                                {trigger}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Initial Project/Pilot */}
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4 flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Initial Project or Pilot
                  </h3>
                  
                  <label className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      checked={formData.create_initial_project}
                      onChange={(e) => handleInputChange('create_initial_project', e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="ml-2">Create initial project</span>
                  </label>
                  
                  {formData.create_initial_project && (
                    <div className="space-y-4 ml-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Type *
                          </label>
                          <select
                            value={formData.initial_project.type}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              initial_project: { ...prev.initial_project, type: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="pilot">Pilot</option>
                            <option value="implementation">Implementation</option>
                            <option value="migration">Migration</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Name *
                          </label>
                          <input
                            type="text"
                            value={formData.initial_project.name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              initial_project: { ...prev.initial_project, name: e.target.value }
                            }))}
                            placeholder="Q3 Platform Pilot"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            value={formData.initial_project.start_date}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              initial_project: { ...prev.initial_project, start_date: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date *
                          </label>
                          <input
                            type="date"
                            value={formData.initial_project.end_date}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              initial_project: { ...prev.initial_project, end_date: e.target.value }
                            }))}
                            min={formData.initial_project.start_date}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Manager *
                          </label>
                          <select
                            value={formData.initial_project.manager}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              initial_project: { ...prev.initial_project, manager: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">Select Manager</option>
                            <option value="john@company.com">John Williams</option>
                            <option value="sarah@company.com">Sarah Chen</option>
                            <option value="mike@company.com">Mike Johnson</option>
                            <option value="lisa@company.com">Lisa Wong</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Budget (Optional)
                          </label>
                          <input
                            type="number"
                            value={formData.initial_project.budget}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              initial_project: { ...prev.initial_project, budget: e.target.value }
                            }))}
                            placeholder="0 for pilots"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            // Validate project fields
                            if (!formData.initial_project.name || !formData.initial_project.start_date || 
                                !formData.initial_project.end_date || !formData.initial_project.manager) {
                              alert('Please fill in all required project fields');
                              return;
                            }
                            // This will open the Project Task Builder
                            window.projectBuilderData = {
                              customer: formData,
                              project: formData.initial_project,
                              automations: Object.entries(formData.selected_automations)
                                .filter(([_, enabled]) => enabled)
                                .map(([id]) => id)
                            };
                            // In a real app, this would navigate to the Project Task Builder
                            alert('Opening Project Task Builder...');
                          }}
                          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                        >
                          Create Project →
                        </button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          This will open the Project Task Builder where you can add tasks and customize the project
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 5: Review & Create */}
        {activeStep === 5 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6">Review & Create</h2>
            
            <div className="space-y-6">
              {/* Organization Summary */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Organization Details
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Legal Name:</dt>
                    <dd className="font-medium">{formData.legal_name}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Organization Code:</dt>
                    <dd className="font-medium">{formData.organization_code}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Status:</dt>
                    <dd className="font-medium capitalize">{formData.customer_status}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Industry:</dt>
                    <dd className="font-medium">{formData.industry || 'Not specified'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-gray-500">Email Domains:</dt>
                    <dd className="font-medium">{formData.email_domains.filter(d => d).join(', ')}</dd>
                  </div>
                </dl>
              </div>

              {/* Contact Summary */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Primary Contact
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Name:</dt>
                    <dd className="font-medium">
                      {formData.primary_contact.given_name} {formData.primary_contact.family_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Email:</dt>
                    <dd className="font-medium">{formData.primary_contact.email}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Title:</dt>
                    <dd className="font-medium">{formData.primary_contact.title || 'Not specified'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Google Contact:</dt>
                    <dd className="font-medium">
                      {formData.primary_contact.create_google_contact ? 'Will be created' : 'Skip'}
                    </dd>
                  </div>
                </dl>
                {formData.additional_contacts.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    + {formData.additional_contacts.length} additional contact(s)
                  </p>
                )}
              </div>

              {/* Actions Summary */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  What Will Happen
                </h3>
                <div className="space-y-2 text-sm">
                  {formData.create_drive_folder && (
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <div>Create Google Drive folder structure</div>
                        <div className="text-gray-500">
                          Template: {folderTemplates.find(t => t.value === formData.folder_template)?.label}
                        </div>
                      </div>
                    </div>
                  )}
                  {formData.primary_contact.create_google_contact && (
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>Create/Update Google Contact for primary contact</div>
                    </div>
                  )}
                  {formData.enable_automations && Object.entries(formData.selected_automations)
                    .filter(([_, enabled]) => enabled)
                    .map(([id, _]) => {
                      const automation = automationOptions.find(a => a.id === id);
                      return (
                        <div key={id} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <div>Enable {automation?.name}</div>
                        </div>
                      );
                    })
                  }
                  {formData.create_initial_project && (
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        Create {formData.initial_project.type} project
                        {formData.initial_project.name && `: ${formData.initial_project.name}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmation */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Ready to create customer</p>
                    <p className="text-blue-700 mt-1">
                      This will create the customer record, set up Google Drive folders, create contacts,
                      and activate selected automations. You can modify these settings later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={activeStep === 1}
            className={`px-4 py-2 border rounded-lg ${
              activeStep === 1
                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Back
          </button>
          
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 text-gray-700 hover:text-gray-900">
              Save as Draft
            </button>
            {activeStep < 5 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Create Customer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCustomerPage;