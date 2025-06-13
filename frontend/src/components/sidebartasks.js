import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  Building2, 
  Mail, 
  FileText, 
  Calendar, 
  Phone, 
  AlertCircle,
  Filter,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  User,
  Flag,
  Trash2,
  Edit,
  ExternalLink,
  Play,
  Square,
  CheckSquare,
  ArrowUpDown,
  SlidersHorizontal,
  RotateCcw,
  X
} from 'lucide-react';

const TasksTab = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all', 
    assignee: 'all',
    taskType: 'all',
    dueDate: 'all',
    company: 'all',
    contact: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('due_date');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data based on your schema structure
  const mockTasks = [
    {
      id: 'task-001',
      title: 'Review contract proposal for Q2 implementation',
      description: 'Review and provide feedback on the technical implementation proposal',
      task_type: 'review',
      priority: 'high',
      status: 'in_progress',
      due_at: '2025-06-14T17:00:00Z',
      employee_email: 'john@company.com',
      assignee_name: 'John Williams',
      related_object_type: 'document',
      related_object_id: 'doc-123',
      organization: {
        id: 'org-001',
        display_name: 'TechCorp Solutions',
        customer_status: 'licensed'
      },
      contact_person: {
        name: 'Sarah Mitchell',
        email: 'sarah@techcorp.com',
        title: 'IT Director'
      },
      last_touchpoint: {
        type: 'email',
        date: '2025-06-12T14:30:00Z',
        description: 'Sent implementation timeline'
      },
      created_at: '2025-06-10T09:00:00Z'
    },
    {
      id: 'task-002',
      title: 'Follow up on pilot deployment status',
      description: 'Check on the progress of the pilot deployment and address any issues',
      task_type: 'follow_up',
      priority: 'urgent',
      status: 'pending',
      due_at: '2025-06-13T16:00:00Z',
      employee_email: 'lisa@company.com',
      assignee_name: 'Lisa Wong',
      related_object_type: 'project',
      related_object_id: 'proj-456',
      organization: {
        id: 'org-002',
        display_name: 'Global Manufacturing Inc',
        customer_status: 'pilot'
      },
      contact_person: {
        name: 'Michael Chen',
        email: 'mchen@globalmanuf.com',
        title: 'Operations Manager'
      },
      last_touchpoint: {
        type: 'meeting',
        date: '2025-06-11T10:00:00Z',
        description: 'Weekly status call'
      },
      created_at: '2025-06-09T11:15:00Z'
    },
    {
      id: 'task-003',
      title: 'Respond to technical integration questions',
      description: 'Customer has questions about API endpoints and authentication flow',
      task_type: 'respond',
      priority: 'normal',
      status: 'pending',
      due_at: '2025-06-15T12:00:00Z',
      employee_email: 'sarah@company.com',
      assignee_name: 'Sarah Chen',
      related_object_type: 'email',
      related_object_id: 'email-789',
      organization: {
        id: 'org-003',
        display_name: 'StartupXYZ',
        customer_status: 'prospect'
      },
      contact_person: {
        name: 'Alex Rodriguez',
        email: 'alex@startupxyz.com',
        title: 'CTO'
      },
      last_touchpoint: {
        type: 'email',
        date: '2025-06-12T09:15:00Z',
        description: 'Technical questions received'
      },
      created_at: '2025-06-12T09:20:00Z'
    },
    {
      id: 'task-004',
      title: 'Schedule go-live planning meeting',
      description: 'Coordinate with customer team to plan the production deployment',
      task_type: 'complete',
      priority: 'normal',
      status: 'pending',
      due_at: '2025-06-16T14:00:00Z',
      employee_email: 'john@company.com',
      assignee_name: 'John Williams',
      related_object_type: 'customer',
      related_object_id: 'org-001',
      organization: {
        id: 'org-001',
        display_name: 'TechCorp Solutions',
        customer_status: 'licensed'
      },
      contact_person: {
        name: 'Sarah Mitchell',
        email: 'sarah@techcorp.com',
        title: 'IT Director'
      },
      last_touchpoint: {
        type: 'document',
        date: '2025-06-12T16:45:00Z',
        description: 'Contract signed'
      },
      created_at: '2025-06-11T13:30:00Z'
    },
    {
      id: 'task-005',
      title: 'Review security compliance documentation',
      description: 'Customer needs SOC2 and security questionnaire completed',
      task_type: 'approve',
      priority: 'high',
      status: 'in_progress',
      due_at: '2025-06-14T10:00:00Z',
      employee_email: 'mike@company.com',
      assignee_name: 'Mike Johnson',
      related_object_type: 'document',
      related_object_id: 'doc-456',
      organization: {
        id: 'org-004',
        display_name: 'Enterprise Bank Ltd',
        customer_status: 'licensed'
      },
      contact_person: {
        name: 'Jennifer Davis',
        email: 'jdavis@enterprisebank.com',
        title: 'CISO'
      },
      last_touchpoint: {
        type: 'document',
        date: '2025-06-10T11:30:00Z',
        description: 'Security docs requested'
      },
      created_at: '2025-06-08T14:20:00Z'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTasks(mockTasks);
      setLoading(false);
    }, 1000);
  }, []);

  const getTaskTypeIcon = (taskType) => {
    const icons = {
      review: FileText,
      approve: CheckCircle,
      respond: Mail,
      follow_up: Phone,
      complete: Flag
    };
    return icons[taskType] || AlertCircle;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'text-red-600',
      high: 'text-orange-600',
      normal: 'text-blue-600',
      low: 'text-gray-600'
    };
    return colors[priority] || colors.normal;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-amber-600',
      in_progress: 'text-blue-600',
      completed: 'text-green-600'
    };
    return colors[status] || colors.pending;
  };

  const getTouchpointIcon = (type) => {
    const icons = {
      email: Mail,
      meeting: Calendar,
      document: FileText,
      phone: Phone
    };
    return icons[type] || Mail;
  };

  const formatDueDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)}d overdue`;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatLastTouchpoint = (touchpoint) => {
    const date = new Date(touchpoint.date);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return '1d ago';
    } else {
      return `${diffDays}d ago`;
    }
  };

  const markTaskComplete = async (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.organization.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.contact_person.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || task.status === filters.status;
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
    const matchesAssignee = filters.assignee === 'all' || task.assignee_name === filters.assignee;
    const matchesTaskType = filters.taskType === 'all' || task.task_type === filters.taskType;
    
    // Due date filter
    const matchesDueDate = (() => {
      if (filters.dueDate === 'all') return true;
      const taskDue = new Date(task.due_at);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(today.getDate() + 7);
      
      switch (filters.dueDate) {
        case 'overdue':
          return taskDue < today;
        case 'today':
          return taskDue.toDateString() === today.toDateString();
        case 'tomorrow':
          return taskDue.toDateString() === tomorrow.toDateString();
        case 'this_week':
          return taskDue >= today && taskDue <= weekFromNow;
        case 'next_week':
          const nextWeekStart = new Date(weekFromNow);
          const nextWeekEnd = new Date(weekFromNow);
          nextWeekEnd.setDate(weekFromNow.getDate() + 7);
          return taskDue >= nextWeekStart && taskDue <= nextWeekEnd;
        default:
          return true;
      }
    })();
    
    const matchesCompany = filters.company === 'all' || task.organization.display_name === filters.company;
    const matchesContact = filters.contact === 'all' || task.contact_person.name === filters.contact;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && 
           matchesTaskType && matchesDueDate && matchesCompany && matchesContact;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'due_date':
        comparison = new Date(a.due_at) - new Date(b.due_at);
        break;
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'company':
        comparison = a.organization.display_name.localeCompare(b.organization.display_name);
        break;
      case 'assignee':
        comparison = a.assignee_name.localeCompare(b.assignee_name);
        break;
      default:
        comparison = new Date(a.created_at) - new Date(b.created_at);
    }
    
    return comparison;
  });

  const uniqueAssignees = [...new Set(tasks.map(t => t.assignee_name))];
  const uniqueCompanies = [...new Set(tasks.map(t => t.organization.display_name))];
  const uniqueContacts = [...new Set(tasks.map(t => t.contact_person.name))];

  if (loading) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => {
              console.log('Navigate back to: MAIN NAVIGATION HERE');
              // Example: navigate('/dashboard') or goBack();
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Go back"
          >
            <ChevronDown className="w-4 h-4 text-gray-600 rotate-90" />
          </button>
          <h2 className="text-sm font-medium text-gray-900">Tasks</h2>
          <span className="text-xs text-gray-500">({filteredTasks.length})</span>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4 text-gray-600" />
          </button>
          <button 
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Create task"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button 
            onClick={() => {
              console.log('Close tasks sidebar');
              // Example: setShowTasksSidebar(false) or navigate('/');
            }}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Search Bar - Compact */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border-0 rounded text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Filters Panel - Compact */}
      {showFilters && (
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <div className="space-y-2">
            <select 
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
            </select>

            <select 
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>

            <select 
              value={filters.dueDate}
              onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All due dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due today</option>
              <option value="tomorrow">Due tomorrow</option>
              <option value="this_week">This week</option>
              <option value="next_week">Next week</option>
            </select>

            <select 
              value={filters.assignee}
              onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All assignees</option>
              {uniqueAssignees.map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>

            <select 
              value={filters.taskType}
              onChange={(e) => setFilters(prev => ({ ...prev, taskType: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All task types</option>
              <option value="review">Review</option>
              <option value="approve">Approve</option>
              <option value="respond">Respond</option>
              <option value="follow_up">Follow up</option>
              <option value="complete">Complete</option>
            </select>

            <select 
              value={filters.company}
              onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All companies</option>
              {uniqueCompanies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>

            <select 
              value={filters.contact}
              onChange={(e) => setFilters(prev => ({ ...prev, contact: e.target.value }))}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All contacts</option>
              {uniqueContacts.map(contact => (
                <option key={contact} value={contact}>{contact}</option>
              ))}
            </select>

            {/* Clear Filters Button */}
            <button
              onClick={() => setFilters({
                status: 'all',
                priority: 'all',
                assignee: 'all', 
                taskType: 'all',
                dueDate: 'all',
                company: 'all',
                contact: 'all'
              })}
              className="w-full px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Tasks List - Compact */}
      <div className="flex-1 overflow-auto">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 px-3">
            <CheckCircle className="w-8 h-8 mb-2 text-gray-300" />
            <p className="text-xs text-center">No tasks found</p>
          </div>
        ) : (
          <div>
            {filteredTasks.map((task) => {
              const TaskIcon = getTaskTypeIcon(task.task_type);
              const TouchpointIcon = getTouchpointIcon(task.last_touchpoint.type);
              const isOverdue = new Date(task.due_at) < new Date();
              
              return (
                <div 
                  key={task.id} 
                  className="group px-3 py-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-colors"
                >
                  {/* Task Header */}
                  <div className="flex items-start space-x-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TaskIcon className="w-3 h-3 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium text-gray-900 leading-tight line-clamp-2 mb-1">
                        {task.title}
                      </h3>
                      
                      {/* Priority & Status */}
                      <div className="flex items-center space-x-1 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority)}`} style={{backgroundColor: 'currentColor'}}></span>
                        <span className="text-xs text-gray-500 capitalize">
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs text-gray-600 font-medium">
                          {task.assignee_name}
                        </span>
                      </div>

                      {/* Company & Contact - Clickable */}
                      <div className="space-y-0.5 mb-1">
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Navigate to: COMPANY PAGE HERE');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors truncate"
                          >
                            {task.organization.display_name}
                          </button>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Navigate to: CONTACT PAGE HERE');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors truncate"
                          >
                            {task.contact_person.name}
                          </button>
                        </div>
                      </div>

                      {/* Due Date & Last Touch */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {formatDueDate(task.due_at)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TouchpointIcon className="w-3 h-3" />
                          <span>{formatLastTouchpoint(task.last_touchpoint)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Show on Hover */}
                  <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTaskStatus(task.id, 'in_progress');
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Start task"
                      >
                        <Play className="w-3 h-3 text-gray-600" />
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markTaskComplete(task.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Mark complete"
                    >
                      <CheckCircle className="w-3 h-3 text-gray-600" />
                    </button>
                    
                    <button 
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="More actions"
                    >
                      <MoreHorizontal className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{filteredTasks.filter(t => t.status === 'pending').length} pending</span>
          <span>{filteredTasks.filter(t => new Date(t.due_at) < new Date()).length} overdue</span>
        </div>
      </div>
    </div>
  );
};

export default TasksTab;
