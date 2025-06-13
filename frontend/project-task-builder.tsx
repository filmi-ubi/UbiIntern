import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, Users, FileText, Plus, Trash2, Save, Play, AlertCircle, CheckCircle, Clock, DollarSign, User, Mail, Phone, ChevronDown, ChevronUp, Copy, Zap, Target, Edit2, GripVertical, ArrowLeft, FolderOpen, Building } from 'lucide-react';

const ProjectTaskBuilder = () => {
  // This would normally come from props/navigation state
  const projectData = {
    customer: {
      legal_name: 'Acme Corporation',
      display_name: 'Acme Corp',
      organization_code: 'ACME_CORP',
      primary_contact: {
        given_name: 'Jane',
        family_name: 'Smith',
        email: 'jane@acme.com',
        phone: '+1-555-0123',
        title: 'VP of Technology'
      },
      email_domains: ['acme.com'],
      selected_automations: {
        welcome_sequence: true,
        document_templates: true,
        meeting_scheduler: false,
        quarterly_checkins: true
      }
    },
    project: {
      type: 'pilot',
      name: 'Q3 Platform Pilot',
      start_date: '2025-07-01',
      end_date: '2025-07-31',
      manager: 'sarah@company.com',
      budget: '0'
    }
  };

  const [project, setProject] = useState({
    ...projectData.project,
    project_code: `${projectData.customer.organization_code}_PILOT_Q3`,
    description: '',
    team_members: ['john@company.com'],
    customer_contacts: [
      {
        ...projectData.customer.primary_contact,
        role: 'primary',
        notifications: true
      }
    ],
    milestones: [
      { name: 'Project Kickoff', date: projectData.project.start_date, type: 'meeting' },
      { name: 'Environment Setup', date: '', type: 'task' },
      { name: 'Initial Training', date: '', type: 'meeting' },
      { name: 'Go/No-Go Decision', date: projectData.project.end_date, type: 'meeting' }
    ],
    tasks: [
      {
        id: 1,
        name: 'Create project folder structure',
        description: 'Set up Google Drive folders for pilot',
        assignee: 'system',
        category: 'setup',
        milestone: 'Project Kickoff',
        due_days_offset: 0,
        status: 'pending',
        automation: true
      },
      {
        id: 2,
        name: 'Send welcome email to customer',
        description: 'Automated welcome email with pilot information',
        assignee: 'system',
        category: 'communication',
        milestone: 'Project Kickoff',
        due_days_offset: 0,
        status: 'pending',
        automation: true
      },
      {
        id: 3,
        name: 'Schedule kickoff meeting',
        description: 'Initial meeting with all stakeholders',
        assignee: projectData.project.manager,
        category: 'meeting',
        milestone: 'Project Kickoff',
        due_days_offset: 1,
        status: 'pending',
        automation: false
      }
    ],
    automations: {
      folder_creation: true,
      welcome_email: true,
      meeting_scheduler: false,
      progress_updates: true,
      document_generation: true
    }
  });

  const [expandedSections, setExpandedSections] = useState({
    details: true,
    team: true,
    milestones: true,
    tasks: true,
    automations: true
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [launchMode, setLaunchMode] = useState('draft'); // 'draft' or 'launch'

  const taskCategories = [
    { value: 'setup', label: 'Setup & Configuration', color: 'bg-blue-100 text-blue-700' },
    { value: 'communication', label: 'Communication', color: 'bg-green-100 text-green-700' },
    { value: 'meeting', label: 'Meeting', color: 'bg-purple-100 text-purple-700' },
    { value: 'training', label: 'Training', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'documentation', label: 'Documentation', color: 'bg-gray-100 text-gray-700' },
    { value: 'testing', label: 'Testing & Validation', color: 'bg-red-100 text-red-700' }
  ];

  const teamMembers = [
    { email: 'john@company.com', name: 'John Williams', role: 'Account Manager' },
    { email: 'sarah@company.com', name: 'Sarah Chen', role: 'Technical Lead' },
    { email: 'mike@company.com', name: 'Mike Johnson', role: 'Legal Counsel' },
    { email: 'lisa@company.com', name: 'Lisa Wong', role: 'Customer Success' }
  ];

  const suggestedTasks = [
    { name: 'Configure user accounts', category: 'setup', assignee: 'sarah@company.com' },
    { name: 'Review security requirements', category: 'documentation', assignee: 'mike@company.com' },
    { name: 'Conduct user training session', category: 'training', assignee: 'lisa@company.com' },
    { name: 'Create pilot success metrics', category: 'documentation', assignee: projectData.project.manager },
    { name: 'Set up monitoring dashboard', category: 'setup', assignee: 'sarah@company.com' },
    { name: 'Weekly progress review', category: 'meeting', assignee: projectData.project.manager, recurring: true }
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addTask = () => {
    const newTask = {
      id: Math.max(...project.tasks.map(t => t.id)) + 1,
      name: '',
      description: '',
      assignee: '',
      category: 'setup',
      milestone: project.milestones[0].name,
      due_days_offset: 0,
      status: 'pending',
      automation: false
    };
    setProject(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const updateTask = (taskId, field, value) => {
    setProject(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === taskId ? { ...task, [field]: value } : task
      )
    }));
  };

  const deleteTask = (taskId) => {
    setProject(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }));
  };

  const addSuggestedTask = (suggestedTask) => {
    const newTask = {
      id: Math.max(...project.tasks.map(t => t.id)) + 1,
      ...suggestedTask,
      description: '',
      milestone: project.milestones[0].name,
      due_days_offset: 0,
      status: 'pending',
      automation: false
    };
    setProject(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const addCustomerContact = () => {
    setProject(prev => ({
      ...prev,
      customer_contacts: [...prev.customer_contacts, {
        given_name: '',
        family_name: '',
        email: '',
        phone: '',
        title: '',
        role: 'stakeholder',
        notifications: false
      }]
    }));
  };

  const updateMilestone = (index, field, value) => {
    setProject(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const calculateDueDate = (task) => {
    const startDate = new Date(project.start_date);
    startDate.setDate(startDate.getDate() + task.due_days_offset);
    return startDate.toISOString().split('T')[0];
  };

  const handleSaveDraft = () => {
    setLaunchMode('draft');
    setShowConfirmDialog(true);
  };

  const handleLaunchProject = () => {
    // Validate required fields
    const hasEmptyTasks = project.tasks.some(task => !task.name || !task.assignee);
    const hasMissingMilestoneDates = project.milestones.some(m => !m.date);
    
    if (hasEmptyTasks || hasMissingMilestoneDates) {
      alert('Please complete all task names, assignees, and milestone dates before launching');
      return;
    }
    
    setLaunchMode('launch');
    setShowConfirmDialog(true);
  };

  const confirmAction = () => {
    // This would submit the project data
    console.log('Project data:', project);
    console.log('Action:', launchMode);
    
    // In a real app, this would:
    // 1. Create the project record
    // 2. Create all tasks
    // 3. Set up automations
    // 4. Create calendar events for milestones
    // 5. Send notifications
    // 6. Return to the customer creation review page
    
    alert(`Project ${launchMode === 'draft' ? 'saved as draft' : 'launched'} successfully!`);
    setShowConfirmDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Project Task Builder</h1>
                <p className="text-sm text-gray-600">
                  Configure project for {projectData.customer.display_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Save Draft
              </button>
              <button
                onClick={handleLaunchProject}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Launch Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info Bar */}
      <div className="bg-blue-50 border-b">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{projectData.customer.legal_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>{projectData.customer.primary_contact.given_name} {projectData.customer.primary_contact.family_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>{projectData.customer.primary_contact.email}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="font-medium">
                {Object.values(projectData.customer.selected_automations).filter(v => v).length} automations enabled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Project Details */}
        <div className="bg-white rounded-lg shadow">
          <div
            className="p-4 border-b cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('details')}
          >
            <h2 className="text-lg font-semibold flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Project Details
            </h2>
            {expandedSections.details ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          
          {expandedSections.details && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Code
                  </label>
                  <input
                    type="text"
                    value={project.project_code}
                    onChange={(e) => setProject({ ...project, project_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={project.name}
                    onChange={(e) => setProject({ ...project, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={project.start_date}
                    onChange={(e) => setProject({ ...project, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={project.end_date}
                    onChange={(e) => setProject({ ...project, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Type
                  </label>
                  <select
                    value={project.type}
                    onChange={(e) => setProject({ ...project, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="pilot">Pilot</option>
                    <option value="implementation">Implementation</option>
                    <option value="migration">Migration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={project.budget}
                      onChange={(e) => setProject({ ...project, budget: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="0 for pilots"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={project.description}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Brief description of the project goals and scope..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Team & Contacts */}
        <div className="bg-white rounded-lg shadow">
          <div
            className="p-4 border-b cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('team')}
          >
            <h2 className="text-lg font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Team & Contacts
            </h2>
            {expandedSections.team ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          
          {expandedSections.team && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Internal Team */}
                <div>
                  <h3 className="font-medium mb-3">Internal Team</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Project Manager</label>
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {teamMembers.find(m => m.email === project.manager)?.name || project.manager}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Team Members</label>
                      <select
                        multiple
                        value={project.team_members}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          setProject({ ...project, team_members: selected });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        size={4}
                      >
                        {teamMembers.filter(m => m.email !== project.manager).map(member => (
                          <option key={member.email} value={member.email}>
                            {member.name} - {member.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Customer Contacts */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center justify-between">
                    Customer Contacts
                    <button
                      onClick={addCustomerContact}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Contact
                    </button>
                  </h3>
                  <div className="space-y-3">
                    {project.customer_contacts.map((contact, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {contact.given_name} {contact.family_name}
                            {contact.role === 'primary' && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                Primary
                              </span>
                            )}
                          </span>
                          {contact.role !== 'primary' && (
                            <button
                              onClick={() => {
                                setProject(prev => ({
                                  ...prev,
                                  customer_contacts: prev.customer_contacts.filter((_, i) => i !== index)
                                }));
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {contact.email} • {contact.title}
                        </div>
                        <label className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            checked={contact.notifications}
                            onChange={(e) => {
                              const updated = [...project.customer_contacts];
                              updated[index] = { ...contact, notifications: e.target.checked };
                              setProject({ ...project, customer_contacts: updated });
                            }}
                            className="rounded text-blue-600"
                          />
                          <span className="ml-2 text-sm">Receive project notifications</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="bg-white rounded-lg shadow">
          <div
            className="p-4 border-b cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('milestones')}
          >
            <h2 className="text-lg font-semibold flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Milestones
            </h2>
            {expandedSections.milestones ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          
          {expandedSections.milestones && (
            <div className="p-6">
              <div className="space-y-3">
                {project.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={milestone.name}
                      onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Milestone name"
                    />
                    <input
                      type="date"
                      value={milestone.date}
                      onChange={(e) => updateMilestone(index, 'date', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                      min={project.start_date}
                      max={project.end_date}
                    />
                    <select
                      value={milestone.type}
                      onChange={(e) => updateMilestone(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="deliverable">Deliverable</option>
                      <option value="task">Task</option>
                      <option value="review">Review</option>
                    </select>
                    {project.milestones.length > 1 && (
                      <button
                        onClick={() => {
                          setProject(prev => ({
                            ...prev,
                            milestones: prev.milestones.filter((_, i) => i !== index)
                          }));
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    setProject(prev => ({
                      ...prev,
                      milestones: [...prev.milestones, { name: '', date: '', type: 'task' }]
                    }));
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Milestone
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-lg shadow">
          <div
            className="p-4 border-b cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('tasks')}
          >
            <h2 className="text-lg font-semibold flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Tasks ({project.tasks.length})
            </h2>
            {expandedSections.tasks ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          
          {expandedSections.tasks && (
            <div className="p-6">
              {/* Suggested Tasks */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium mb-3">Suggested Tasks</h4>
                <div className="flex flex-wrap gap-2">
                  {suggestedTasks.map((task, index) => (
                    <button
                      key={index}
                      onClick={() => addSuggestedTask(task)}
                      className="px-3 py-1 bg-white border border-blue-300 rounded hover:bg-blue-100 text-sm flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{task.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {project.tasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="pt-2">
                        <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                      </div>
                      <div className="flex-1 grid grid-cols-4 gap-3">
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={task.name}
                            onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Task name *"
                          />
                          <textarea
                            value={task.description}
                            onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Description (optional)"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <select
                            value={task.assignee}
                            onChange={(e) => updateTask(task.id, 'assignee', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">Assign to *</option>
                            <option value="system">System (Automated)</option>
                            {teamMembers.map(member => (
                              <option key={member.email} value={member.email}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={task.category}
                            onChange={(e) => updateTask(task.id, 'category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            {taskCategories.map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <select
                            value={task.milestone}
                            onChange={(e) => updateTask(task.id, 'milestone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">Link to milestone</option>
                            {project.milestones.map(m => (
                              <option key={m.name} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={task.due_days_offset}
                              onChange={(e) => updateTask(task.id, 'due_days_offset', parseInt(e.target.value))}
                              className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                              placeholder="0"
                            />
                            <span className="text-sm text-gray-600">days from start</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          taskCategories.find(c => c.value === task.category)?.color || 'bg-gray-100'
                        }`}>
                          {taskCategories.find(c => c.value === task.category)?.label}
                        </span>
                        {task.automation && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center">
                            <Zap className="w-3 h-3 mr-1" />
                            Automated
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        Due: {calculateDueDate(task)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addTask}
                className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 flex items-center justify-center space-x-2 text-gray-600"
              >
                <Plus className="w-5 h-5" />
                <span>Add Task</span>
              </button>
            </div>
          )}
        </div>

        {/* Automations */}
        <div className="bg-white rounded-lg shadow">
          <div
            className="p-4 border-b cursor-pointer flex items-center justify-between"
            onClick={() => toggleSection('automations')}
          >
            <h2 className="text-lg font-semibold flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Project Automations
            </h2>
            {expandedSections.automations ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          
          {expandedSections.automations && (
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                These automations will be activated when the project launches
              </p>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={project.automations.folder_creation}
                    onChange={(e) => setProject({
                      ...project,
                      automations: { ...project.automations, folder_creation: e.target.checked }
                    })}
                    className="rounded text-blue-600 mt-1"
                  />
                  <div>
                    <div className="font-medium">Automatic Folder Creation</div>
                    <div className="text-sm text-gray-600">
                      Create project folder structure in customer's Drive folder
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={project.automations.welcome_email}
                    onChange={(e) => setProject({
                      ...project,
                      automations: { ...project.automations, welcome_email: e.target.checked }
                    })}
                    className="rounded text-blue-600 mt-1"
                  />
                  <div>
                    <div className="font-medium">Welcome Email Sequence</div>
                    <div className="text-sm text-gray-600">
                      Send project kickoff email to all customer contacts
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={project.automations.meeting_scheduler}
                    onChange={(e) => setProject({
                      ...project,
                      automations: { ...project.automations, meeting_scheduler: e.target.checked }
                    })}
                    className="rounded text-blue-600 mt-1"
                  />
                  <div>
                    <div className="font-medium">Meeting Auto-Scheduler</div>
                    <div className="text-sm text-gray-600">
                      Automatically create calendar events for milestone meetings
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={project.automations.progress_updates}
                    onChange={(e) => setProject({
                      ...project,
                      automations: { ...project.automations, progress_updates: e.target.checked }
                    })}
                    className="rounded text-blue-600 mt-1"
                  />
                  <div>
                    <div className="font-medium">Weekly Progress Updates</div>
                    <div className="text-sm text-gray-600">
                      Send automated progress emails to stakeholders
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={project.automations.document_generation}
                    onChange={(e) => setProject({
                      ...project,
                      automations: { ...project.automations, document_generation: e.target.checked }
                    })}
                    className="rounded text-blue-600 mt-1"
                  />
                  <div>
                    <div className="font-medium">Document Generation</div>
                    <div className="text-sm text-gray-600">
                      Auto-create project documents from templates
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Project Summary</h3>
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold">{project.tasks.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{project.milestones.length}</div>
              <div className="text-sm text-gray-600">Milestones</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {project.team_members.length + 1}
              </div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Object.values(project.automations).filter(v => v).length}
              </div>
              <div className="text-sm text-gray-600">Automations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {launchMode === 'draft' ? 'Save Project Draft' : 'Launch Project'}
            </h3>
            
            {launchMode === 'launch' ? (
              <>
                <div className="mb-6">
                  <div className="flex items-start space-x-3 text-amber-600 mb-4">
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Are you sure you want to launch this project?</p>
                      <p className="mt-1">This will:</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm ml-8">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Create the project and all {project.tasks.length} tasks</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Set up Google Drive folders</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Activate {Object.values(project.automations).filter(v => v).length} automations</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>Send notifications to team and customer</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600 mb-6">
                The project will be saved as a draft. You can edit and launch it later from the project management dashboard.
              </p>
            )}
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded-lg text-white ${
                  launchMode === 'launch'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {launchMode === 'launch' ? 'Yes, Launch Project' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTaskBuilder;