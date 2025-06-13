import React, { useState } from 'react';
import { Mail, Inbox, Send, Archive, Trash2, Tag, Clock, Users, Building, Zap, Filter, Search, ChevronDown, Star, Paperclip, Reply, ReplyAll, Forward, ExternalLink, CheckCircle, XCircle, AlertCircle, MessageSquare, RefreshCw, MoreVertical, Eye, EyeOff } from 'lucide-react';

const EmailProcessingHub = () => {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [showAutomationPanel, setShowAutomationPanel] = useState(false);

  // Mock email data with full schema fields
  const emails = [
    {
      id: '001',
      message_id: '<CADXLpi=abc123@mail.gmail.com>',
      gmail_message_id: '18d5a2b7c9e',
      thread_id: 'thread_001',
      subject: 'Re: Q3 Renewal Terms - Ready for Review',
      from_email: 'jane@acme.com',
      from_name: 'Jane Smith',
      from_resource_name: 'people/c123456',
      to_emails: ['john@company.com'],
      cc_emails: ['legal@company.com'],
      snippet: 'Hi John, I\'ve reviewed the renewal terms and have a few questions about the pricing structure...',
      date_sent: new Date(Date.now() - 2 * 60 * 60 * 1000),
      is_unread: true,
      is_starred: true,
      has_attachments: true,
      attachment_count: 2,
      gmail_labels: ['INBOX', 'IMPORTANT'],
      automation_labels: ['contract-review'],
      automation_status: 'pending',
      organization: {
        id: 'org-001',
        name: 'Acme Corporation',
        status: 'active'
      },
      suggested_actions: [
        { label: 'Review Contract', action: 'open_document', params: { gid: 'CONTRACT_123' } },
        { label: 'Schedule Meeting', action: 'calendar', params: {} }
      ]
    },
    {
      id: '002',
      message_id: '<CADXLpi=def456@mail.gmail.com>',
      gmail_message_id: '18d5a2b7c9f',
      thread_id: 'thread_002',
      subject: 'Pilot Update - Week 2 Results',
      from_email: 'bob@techstart.com',
      from_name: 'Bob Johnson',
      from_resource_name: 'people/c789012',
      to_emails: ['sarah@company.com', 'john@company.com'],
      cc_emails: [],
      snippet: 'Team, Happy to report that week 2 of the pilot is going well. We\'ve successfully onboarded 15 users...',
      date_sent: new Date(Date.now() - 4 * 60 * 60 * 1000),
      is_unread: false,
      is_starred: false,
      has_attachments: true,
      attachment_count: 1,
      gmail_labels: ['INBOX', 'Pilot Updates'],
      automation_labels: [],
      automation_status: null,
      organization: {
        id: 'org-002',
        name: 'TechStart Inc',
        status: 'pilot'
      },
      suggested_actions: [
        { label: 'Update Pilot Tracker', action: 'update_sheet', params: { gid: 'PILOT_TRACKER' } }
      ]
    },
    {
      id: '003',
      message_id: '<CADXLpi=ghi789@mail.gmail.com>',
      gmail_message_id: '18d5a2b7ca0',
      thread_id: 'thread_003',
      subject: 'Technical Issue - API Rate Limiting',
      from_email: 'support@globalind.com',
      from_name: 'Global Industries Support',
      from_resource_name: null,
      to_emails: ['support@company.com'],
      cc_emails: ['sarah@company.com'],
      snippet: 'We\'re experiencing rate limiting errors when calling your API. Error code: 429. Can you please...',
      date_sent: new Date(Date.now() - 6 * 60 * 60 * 1000),
      is_unread: true,
      is_starred: false,
      has_attachments: false,
      attachment_count: 0,
      gmail_labels: ['INBOX', 'Support'],
      automation_labels: ['tech-support'],
      automation_status: 'processing',
      organization: {
        id: 'org-003',
        name: 'Global Industries',
        status: 'active'
      },
      suggested_actions: [
        { label: 'Create Support Ticket', action: 'create_ticket', params: {} },
        { label: 'Assign to Tech', action: 'assign', params: { to: 'sarah@company.com' } }
      ]
    }
  ];

  const folders = [
    { id: 'inbox', name: 'Inbox', icon: Inbox, count: 23 },
    { id: 'starred', name: 'Starred', icon: Star, count: 5 },
    { id: 'sent', name: 'Sent', icon: Send, count: 0 },
    { id: 'drafts', name: 'Drafts', icon: Mail, count: 3 },
    { id: 'archived', name: 'Archived', icon: Archive, count: 156 }
  ];

  const automationRules = [
    {
      id: 'rule-001',
      name: 'Contract Review',
      trigger: 'Label: contract-review',
      actions: ['Create task for legal', 'Update document status'],
      enabled: true
    },
    {
      id: 'rule-002',
      name: 'Pilot Updates',
      trigger: 'From: *@pilot-customer.com',
      actions: ['Update pilot tracker', 'Notify project manager'],
      enabled: true
    },
    {
      id: 'rule-003',
      name: 'Support Tickets',
      trigger: 'Label: tech-support',
      actions: ['Create support ticket', 'Auto-acknowledge'],
      enabled: false
    }
  ];

  const customers = [
    { id: 'all', name: 'All Customers' },
    { id: 'org-001', name: 'Acme Corporation' },
    { id: 'org-002', name: 'TechStart Inc' },
    { id: 'org-003', name: 'Global Industries' }
  ];

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
    if (email.is_unread) {
      // Mark as read
      email.is_unread = false;
    }
  };

  const handleBulkAction = (action) => {
    switch (action) {
      case 'archive':
        alert(`Archiving ${selectedEmails.length} emails`);
        break;
      case 'delete':
        alert(`Deleting ${selectedEmails.length} emails`);
        break;
      case 'mark_read':
        alert(`Marking ${selectedEmails.length} emails as read`);
        break;
      case 'add_label':
        alert('Opening label selector...');
        break;
    }
  };

  const handleQuickAction = (email, action) => {
    console.log('Quick action:', action, 'for email:', email.id);
    // Handle the action based on type
  };

  const filteredEmails = emails.filter(email => {
    if (showUnreadOnly && !email.is_unread) return false;
    if (filterCustomer !== 'all' && email.organization?.id !== filterCustomer) return false;
    if (searchQuery && !email.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !email.from_email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedFolder === 'starred' && !email.is_starred) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Email Hub</h2>
          
          {/* Compose Button */}
          <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2 mb-6">
            <Mail className="w-4 h-4" />
            <span>Compose</span>
          </button>
          
          {/* Folders */}
          <div className="space-y-1">
            {folders.map((folder) => {
              const Icon = folder.icon;
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full px-3 py-2 rounded-lg flex items-center justify-between hover:bg-gray-100 ${
                    selectedFolder === folder.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{folder.name}</span>
                  </div>
                  {folder.count > 0 && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                      {folder.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Labels */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Labels</h3>
            <div className="space-y-1">
              <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-lg flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Urgent</span>
              </button>
              <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-lg flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Contracts</span>
              </button>
              <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-lg flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Pilot Updates</span>
              </button>
              <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 rounded-lg flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Support</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 flex">
        <div className="w-96 bg-white border-r flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="flex-1 px-3 py-1 border rounded text-sm"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`px-3 py-1 rounded text-sm ${
                  showUnreadOnly ? 'bg-blue-100 text-blue-700' : 'border'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setShowAutomationPanel(!showAutomationPanel)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedEmails.length > 0 && (
            <div className="p-3 bg-blue-50 border-b flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedEmails.length} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="p-1 hover:bg-blue-100 rounded"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="p-1 hover:bg-blue-100 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleBulkAction('mark_read')}
                  className="p-1 hover:bg-blue-100 rounded"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleBulkAction('add_label')}
                  className="p-1 hover:bg-blue-100 rounded"
                >
                  <Tag className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => handleSelectEmail(email)}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                  selectedEmail?.id === email.id ? 'bg-blue-50' : ''
                } ${email.is_unread ? 'bg-white' : 'bg-gray-50'}`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(email.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setSelectedEmails([...selectedEmails, email.id]);
                      } else {
                        setSelectedEmails(selectedEmails.filter(id => id !== email.id));
                      }
                    }}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${email.is_unread ? 'font-semibold' : ''}`}>
                            {email.from_name || email.from_email}
                          </span>
                          {email.organization && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {email.organization.name}
                            </span>
                          )}
                        </div>
                        <div className={`text-sm mt-1 ${email.is_unread ? 'font-medium' : ''}`}>
                          {email.subject}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 truncate">
                          {email.snippet}
                        </div>
                        <div className="flex items-center space-x-3 mt-2">
                          {email.has_attachments && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Paperclip className="w-3 h-3 mr-1" />
                              {email.attachment_count}
                            </div>
                          )}
                          {email.automation_status && (
                            <div className={`flex items-center text-xs ${
                              email.automation_status === 'pending' ? 'text-yellow-600' :
                              email.automation_status === 'processing' ? 'text-blue-600' :
                              'text-green-600'
                            }`}>
                              <Zap className="w-3 h-3 mr-1" />
                              {email.automation_status}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className="text-xs text-gray-500">
                          {new Date(email.date_sent).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {email.is_starred && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Detail */}
        {selectedEmail ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Email Header */}
            <div className="p-4 border-b">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <Star className={`w-5 h-5 ${selectedEmail.is_starred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <Archive className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <Trash2 className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* From/To Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 w-12">From:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{selectedEmail.from_name}</span>
                    <span className="text-gray-500">&lt;{selectedEmail.from_email}&gt;</span>
                    {selectedEmail.organization && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {selectedEmail.organization.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 w-12">To:</span>
                  <span>{selectedEmail.to_emails.join(', ')}</span>
                </div>
                {selectedEmail.cc_emails.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 w-12">Cc:</span>
                    <span>{selectedEmail.cc_emails.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 w-12">Date:</span>
                  <span>{new Date(selectedEmail.date_sent).toLocaleString()}</span>
                </div>
              </div>

              {/* Labels and Actions */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  {selectedEmail.gmail_labels.map((label) => (
                    <span key={label} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {label}
                    </span>
                  ))}
                  {selectedEmail.automation_labels.map((label) => (
                    <span key={label} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      {label}
                    </span>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 border rounded hover:bg-gray-50 flex items-center space-x-1 text-sm">
                    <Reply className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                  <button className="px-3 py-1 border rounded hover:bg-gray-50 flex items-center space-x-1 text-sm">
                    <ReplyAll className="w-4 h-4" />
                    <span>Reply All</span>
                  </button>
                  <button className="px-3 py-1 border rounded hover:bg-gray-50 flex items-center space-x-1 text-sm">
                    <Forward className="w-4 h-4" />
                    <span>Forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Suggested Actions */}
            {selectedEmail.suggested_actions.length > 0 && (
              <div className="p-4 bg-blue-50 border-b">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-1 text-blue-600" />
                  Suggested Actions
                </h3>
                <div className="flex items-center space-x-2">
                  {selectedEmail.suggested_actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(selectedEmail, action)}
                      className="px-3 py-1 bg-white border border-blue-300 rounded hover:bg-blue-100 text-sm flex items-center space-x-1"
                    >
                      <span>{action.label}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose max-w-none">
                <p>Hi John,</p>
                <p>I've reviewed the renewal terms and have a few questions about the pricing structure. Specifically:</p>
                <ul>
                  <li>The enterprise tier pricing seems to have increased by 15% - can you help me understand what additional value we're getting?</li>
                  <li>Are there any discounts available for multi-year commitments?</li>
                  <li>Can we discuss the new API rate limits mentioned in section 3.2?</li>
                </ul>
                <p>I'd like to schedule a call to discuss these points before we proceed with the renewal. Are you available this week?</p>
                <p>Best regards,<br />Jane Smith<br />VP of Technology<br />Acme Corporation</p>
              </div>
              
              {/* Attachments */}
              {selectedEmail.has_attachments && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Attachments ({selectedEmail.attachment_count})</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Q3_Renewal_Terms.pdf</span>
                        <span className="text-xs text-gray-500">2.4 MB</span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Save to Drive
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Pricing_Comparison.xlsx</span>
                        <span className="text-xs text-gray-500">156 KB</span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Save to Drive
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Thread History */}
            <div className="p-4 border-t bg-gray-50">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Show {Math.floor(Math.random() * 5) + 2} previous messages in this thread
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select an email to view</p>
            </div>
          </div>
        )}
      </div>

      {/* Automation Rules Panel */}
      {showAutomationPanel && (
        <div className="w-80 bg-white border-l p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Automation Rules</h3>
            <button
              onClick={() => setShowAutomationPanel(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {automationRules.map((rule) => (
              <div key={rule.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{rule.name}</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      className="sr-only peer"
                      onChange={() => {}}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-600 mb-2">{rule.trigger}</p>
                <div className="space-y-1">
                  {rule.actions.map((action, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-700">
                      <ChevronRight className="w-3 h-3 mr-1" />
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
            Create New Rule
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailProcessingHub;