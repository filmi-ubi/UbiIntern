import React, { useState } from 'react';
import { Plus, Mail, FileText, Calendar, Folder, User, Zap, Settings, Play, Save, X, ChevronDown, AlertCircle, CheckCircle, Clock, ArrowRight, Code, Database, Copy } from 'lucide-react';

const AutomationBuilder = () => {
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [actions, setActions] = useState([]);
  const [isTestMode, setIsTestMode] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  
  const triggers = [
    {
      category: 'Email',
      icon: Mail,
      options: [
        { id: 'email_label', name: 'Email receives label', description: 'When an email gets labeled (e.g., "auto-respond")', color: 'bg-blue-500' },
        { id: 'email_from', name: 'Email from domain', description: 'When email arrives from specific domain', color: 'bg-blue-500' },
        { id: 'email_subject', name: 'Email subject contains', description: 'When subject matches pattern', color: 'bg-blue-500' }
      ]
    },
    {
      category: 'Drive',
      icon: FileText,
      options: [
        { id: 'file_status', name: 'File status changes', description: 'When filename prefix changes (e.g., [DRAFT] → [READY])', color: 'bg-green-500' },
        { id: 'file_created', name: 'File created in folder', description: 'When new file appears in specific folder', color: 'bg-green-500' },
        { id: 'file_permission', name: 'File shared', description: 'When file permissions change', color: 'bg-green-500' }
      ]
    },
    {
      category: 'Calendar',
      icon: Calendar,
      options: [
        { id: 'meeting_created', name: 'Meeting scheduled', description: 'When meeting created with customer', color: 'bg-purple-500' },
        { id: 'meeting_approaching', name: 'Meeting in X days', description: 'Before meeting date', color: 'bg-purple-500' }
      ]
    },
    {
      category: 'Time',
      icon: Clock,
      options: [
        { id: 'schedule', name: 'On schedule', description: 'Run at specific times/dates', color: 'bg-yellow-500' },
        { id: 'delay', name: 'After delay', description: 'Wait X hours/days after trigger', color: 'bg-yellow-500' }
      ]
    }
  ];

  const actionTypes = [
    {
      category: 'Drive Actions',
      actions: [
        { id: 'create_folder', name: 'Create folder structure', icon: Folder, description: 'Create folders from template' },
        { id: 'copy_file', name: 'Copy from template', icon: Copy, description: 'Create document from template' },
        { id: 'move_file', name: 'Move/rename file', icon: FileText, description: 'Move file or change status' },
        { id: 'set_permission', name: 'Share with users', icon: User, description: 'Grant access to specific people' }
      ]
    },
    {
      category: 'Email Actions',
      actions: [
        { id: 'send_email', name: 'Send email', icon: Mail, description: 'Send templated email' },
        { id: 'reply_email', name: 'Reply to thread', icon: Mail, description: 'Auto-reply in thread' },
        { id: 'add_label', name: 'Add email label', icon: Mail, description: 'Label for processing' }
      ]
    },
    {
      category: 'Calendar Actions',
      actions: [
        { id: 'create_event', name: 'Schedule meeting', icon: Calendar, description: 'Create calendar event' },
        { id: 'update_event', name: 'Update meeting', icon: Calendar, description: 'Modify existing event' }
      ]
    },
    {
      category: 'Data Actions',
      actions: [
        { id: 'update_db', name: 'Update database', icon: Database, description: 'Update customer record' },
        { id: 'create_task', name: 'Create task', icon: CheckCircle, description: 'Assign task to employee' },
        { id: 'webhook', name: 'Call webhook', icon: Code, description: 'Trigger external system' }
      ]
    }
  ];

  const templates = [
    {
      name: 'Customer Onboarding',
      description: 'Full onboarding flow when contract signed',
      trigger: 'file_status',
      actions: ['create_folder', 'copy_file', 'create_event', 'send_email']
    },
    {
      name: 'Document Review Process',
      description: 'Route documents for approval',
      trigger: 'file_status',
      actions: ['move_file', 'set_permission', 'send_email', 'create_task']
    },
    {
      name: 'Auto Email Response',
      description: 'Acknowledge customer emails',
      trigger: 'email_label',
      actions: ['reply_email', 'create_task', 'update_db']
    }
  ];

  const addAction = (actionId) => {
    const action = actionTypes.flatMap(cat => cat.actions).find(a => a.id === actionId);
    if (action) {
      setActions([...actions, { ...action, id: `${action.id}_${Date.now()}`, config: {} }]);
    }
  };

  const removeAction = (actionId) => {
    setActions(actions.filter(a => a.id !== actionId));
  };

  const loadTemplate = (template) => {
    const triggerOption = triggers.flatMap(cat => cat.options).find(opt => opt.id === template.trigger);
    setSelectedTrigger(triggerOption);
    const newActions = template.actions.map(actionId => {
      const action = actionTypes.flatMap(cat => cat.actions).find(a => a.id === actionId);
      return { ...action, id: `${action.id}_${Date.now()}`, config: {} };
    });
    setActions(newActions);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Automation Builder</h2>
            <p className="text-sm text-gray-600">Create powerful workflows to automate your business processes</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsTestMode(!isTestMode)}
              className={`px-4 py-2 rounded flex items-center space-x-2 ${
                isTestMode ? 'bg-yellow-100 text-yellow-700' : 'border hover:bg-gray-50'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>{isTestMode ? 'Testing...' : 'Test'}</span>
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Save Automation</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Templates Sidebar */}
        <div className="w-64 bg-white border-r p-4">
          <h3 className="font-semibold mb-4">Quick Start Templates</h3>
          <div className="space-y-2">
            {templates.map((template, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                onClick={() => loadTemplate(template)}
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-gray-500 mt-1">{template.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Builder Area */}
        <div className="flex-1 p-6">
          {/* Trigger Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              When this happens...
            </h3>
            
            {!selectedTrigger ? (
              <div className="grid grid-cols-2 gap-4">
                {triggers.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center space-x-2 mb-2">
                      <category.icon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">{category.category}</span>
                    </div>
                    <div className="space-y-2">
                      {category.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedTrigger(option)}
                          className="w-full p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-all"
                        >
                          <div className="font-medium text-sm">{option.name}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium">{selectedTrigger.name}</div>
                  <div className="text-sm text-gray-600">{selectedTrigger.description}</div>
                  {/* Trigger Configuration */}
                  <div className="mt-3 space-y-2">
                    {selectedTrigger.id === 'email_label' && (
                      <input
                        type="text"
                        placeholder="Label name (e.g., auto-respond)"
                        className="px-3 py-1 border rounded text-sm w-64"
                      />
                    )}
                    {selectedTrigger.id === 'file_status' && (
                      <div className="flex items-center space-x-2">
                        <select className="px-3 py-1 border rounded text-sm">
                          <option>[DRAFT]</option>
                          <option>[READY]</option>
                          <option>[REVIEW]</option>
                          <option>[SIGNED]</option>
                        </select>
                        <span className="text-sm">→</span>
                        <select className="px-3 py-1 border rounded text-sm">
                          <option>[READY]</option>
                          <option>[REVIEW]</option>
                          <option>[APPROVED]</option>
                          <option>[SENT]</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTrigger(null)}
                  className="p-2 hover:bg-blue-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Conditions */}
          {selectedTrigger && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <button
                onClick={() => setShowConditions(!showConditions)}
                className="flex items-center justify-between w-full"
              >
                <h3 className="text-lg font-semibold flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-gray-500" />
                  Only if... (Conditions)
                </h3>
                <ChevronDown className={`w-5 h-5 transition-transform ${showConditions ? 'rotate-180' : ''}`} />
              </button>
              
              {showConditions && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <select className="px-3 py-2 border rounded">
                      <option>Customer Type</option>
                      <option>Organization</option>
                      <option>Project Type</option>
                    </select>
                    <select className="px-3 py-2 border rounded">
                      <option>equals</option>
                      <option>contains</option>
                      <option>does not equal</option>
                    </select>
                    <input type="text" placeholder="Value" className="px-3 py-2 border rounded flex-1" />
                    <button className="p-2 text-red-500 hover:bg-red-50 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    + Add condition
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {selectedTrigger && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ArrowRight className="w-5 h-5 mr-2 text-green-500" />
                Do these actions...
              </h3>
              
              {/* Existing Actions */}
              <div className="space-y-3 mb-4">
                {actions.map((action, index) => (
                  <div key={action.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <action.icon className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium">{action.name}</div>
                          <div className="text-sm text-gray-500">{action.description}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAction(action.id)}
                        className="p-1 hover:bg-red-50 rounded text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Action Configuration */}
                    <div className="ml-11 space-y-2">
                      {action.id.startsWith('send_email') && (
                        <>
                          <input
                            type="text"
                            placeholder="Email template"
                            className="w-full px-3 py-2 border rounded text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Recipients (use variables like {{customer_email}})"
                            className="w-full px-3 py-2 border rounded text-sm"
                          />
                        </>
                      )}
                      {action.id.startsWith('create_folder') && (
                        <select className="w-full px-3 py-2 border rounded text-sm">
                          <option>Standard Customer Folders</option>
                          <option>Pilot Project Structure</option>
                          <option>Implementation Folders</option>
                        </select>
                      )}
                      {action.id.startsWith('copy_file') && (
                        <>
                          <input
                            type="text"
                            placeholder="Template GID or search..."
                            className="w-full px-3 py-2 border rounded text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Destination folder"
                            className="w-full px-3 py-2 border rounded text-sm"
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add Action */}
              <div className="border-2 border-dashed rounded-lg p-4">
                <div className="text-center text-sm text-gray-500 mb-3">Add an action</div>
                <div className="grid grid-cols-2 gap-2">
                  {actionTypes.map((category) => (
                    <div key={category.category}>
                      <div className="text-xs font-medium text-gray-500 mb-1">{category.category}</div>
                      {category.actions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => addAction(action.id)}
                          className="w-full p-2 text-left hover:bg-gray-50 rounded flex items-center space-x-2 text-sm"
                        >
                          <action.icon className="w-4 h-4 text-gray-400" />
                          <span>{action.name}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Test Mode Output */}
          {isTestMode && (
            <div className="mt-6 bg-yellow-50 rounded-lg p-6">
              <h4 className="font-semibold mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                Test Mode - Simulated Execution
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Trigger detected: Email labeled "auto-respond"</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Condition met: Customer type = "Active"</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Action 1: Creating folder structure...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Action 2: Email sent to customer</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomationBuilder;