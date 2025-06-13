import React, { useState } from 'react';
import { Calendar, Clock, Users, Video, MapPin, FileText, Plus, ChevronLeft, ChevronRight, Bell, Repeat, Edit2, Trash2, ExternalLink, Building, User, Mail, Phone, CheckCircle, XCircle, AlertCircle, Filter, Search, Download, Zap } from 'lucide-react';

const CalendarIntegrationView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, customer, internal, automated
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock events data matching your schema
  const events = [
    {
      event_id: 'evt_001',
      calendar_id: 'john@company.com',
      summary: 'Acme Corp Quarterly Review',
      description: 'Q3 business review and renewal discussion',
      location: 'Google Meet',
      meet_link: 'https://meet.google.com/abc-defg-hij',
      start_time: new Date(2025, 5, 15, 10, 0),
      end_time: new Date(2025, 5, 15, 11, 0),
      organizer_email: 'john@company.com',
      organizer_name: 'John Williams',
      attendee_emails: ['jane@acme.com', 'tom@acme.com', 'sarah@company.com'],
      attendee_responses: {
        'jane@acme.com': 'accepted',
        'tom@acme.com': 'tentative',
        'sarah@company.com': 'accepted'
      },
      organization: {
        id: 'org-001',
        name: 'Acme Corporation'
      },
      is_customer_meeting: true,
      meeting_type: 'review',
      agenda_gid: 'AGENDA_123',
      notes_gid: null,
      event_chain_id: null,
      status: 'confirmed'
    },
    {
      event_id: 'evt_002',
      calendar_id: 'sarah@company.com',
      summary: 'TechStart Pilot Kickoff',
      description: 'Initial setup and training for pilot program',
      location: 'TechStart Office',
      meet_link: null,
      start_time: new Date(2025, 5, 16, 14, 0),
      end_time: new Date(2025, 5, 16, 16, 0),
      organizer_email: 'sarah@company.com',
      organizer_name: 'Sarah Chen',
      attendee_emails: ['bob@techstart.com', 'alice@techstart.com', 'mike@company.com'],
      attendee_responses: {
        'bob@techstart.com': 'accepted',
        'alice@techstart.com': 'accepted',
        'mike@company.com': 'accepted'
      },
      organization: {
        id: 'org-002',
        name: 'TechStart Inc'
      },
      is_customer_meeting: true,
      meeting_type: 'kickoff',
      project_id: 'proj_002',
      agenda_gid: 'AGENDA_456',
      notes_gid: 'NOTES_456',
      event_chain_id: 'chain_001',
      chain_position: 1,
      status: 'confirmed'
    },
    {
      event_id: 'evt_003',
      calendar_id: 'team@company.com',
      summary: 'Weekly Team Standup',
      description: 'Regular team sync',
      location: 'Google Meet',
      meet_link: 'https://meet.google.com/xyz-uvwx-yz',
      start_time: new Date(2025, 5, 17, 9, 0),
      end_time: new Date(2025, 5, 17, 9, 30),
      organizer_email: 'john@company.com',
      organizer_name: 'John Williams',
      attendee_emails: ['sarah@company.com', 'mike@company.com', 'lisa@company.com'],
      is_customer_meeting: false,
      meeting_type: 'internal',
      recurring_event_id: 'rec_001',
      status: 'confirmed'
    }
  ];

  const eventChains = [
    {
      id: 'chain_001',
      name: 'TechStart Pilot Onboarding',
      type: 'onboarding',
      organization: 'TechStart Inc',
      anchor_date: new Date(2025, 5, 16),
      status: 'active',
      events: [
        { name: 'Kickoff Meeting', offset_days: 0, completed: true },
        { name: 'Technical Setup', offset_days: 3, completed: false },
        { name: 'Training Session 1', offset_days: 7, completed: false },
        { name: 'Progress Review', offset_days: 14, completed: false },
        { name: 'Go/No-Go Decision', offset_days: 30, completed: false }
      ]
    }
  ];

  const customers = [
    { id: 'all', name: 'All Customers' },
    { id: 'org-001', name: 'Acme Corporation' },
    { id: 'org-002', name: 'TechStart Inc' },
    { id: 'org-003', name: 'Global Industries' }
  ];

  const meetingTypes = [
    { value: 'kickoff', label: 'Kickoff Meeting', color: 'bg-green-100 text-green-700' },
    { value: 'review', label: 'Business Review', color: 'bg-blue-100 text-blue-700' },
    { value: 'training', label: 'Training Session', color: 'bg-purple-100 text-purple-700' },
    { value: 'support', label: 'Support Call', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'internal', label: 'Internal Meeting', color: 'bg-gray-100 text-gray-700' }
  ];

  // Calendar navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }
    
    // Next month's days to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    return days;
  };

  const getEventsForDay = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    }).filter(event => {
      if (filterType === 'all') return true;
      if (filterType === 'customer' && event.is_customer_meeting) return true;
      if (filterType === 'internal' && !event.is_customer_meeting) return true;
      if (filterType === 'automated' && event.event_chain_id) return true;
      return false;
    }).filter(event => {
      if (selectedCustomer === 'all') return true;
      return event.organization?.id === selectedCustomer;
    });
  };

  const getAttendeeStatus = (responses) => {
    const counts = { accepted: 0, tentative: 0, declined: 0, pending: 0 };
    Object.values(responses || {}).forEach(response => {
      if (response === 'accepted') counts.accepted++;
      else if (response === 'tentative') counts.tentative++;
      else if (response === 'declined') counts.declined++;
      else counts.pending++;
    });
    return counts;
  };

  const handleQuickAction = (action, event) => {
    switch (action) {
      case 'join':
        window.open(event.meet_link, '_blank');
        break;
      case 'agenda':
        alert(`Opening agenda document: ${event.agenda_gid}`);
        break;
      case 'notes':
        alert(`Creating/opening notes document`);
        break;
      case 'cancel':
        alert(`Cancelling event: ${event.summary}`);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-sm text-gray-600">Manage customer meetings and events</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Events</option>
              <option value="customer">Customer Meetings</option>
              <option value="internal">Internal Meetings</option>
              <option value="automated">Automated Events</option>
            </select>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 border rounded hover:bg-gray-50 text-sm"
            >
              Today
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold min-w-[150px] text-center">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded text-sm ${view === 'day' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded text-sm ${view === 'week' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded text-sm ${view === 'month' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Calendar Grid */}
        <div className="flex-1 p-6">
          {view === 'month' && (
            <div className="bg-white rounded-lg shadow">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {getDaysInMonth(currentDate).map((day, index) => {
                  const dayEvents = getEventsForDay(day.date);
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border-r border-b ${
                        !day.isCurrentMonth ? 'bg-gray-50' : ''
                      } ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        !day.isCurrentMonth ? 'text-gray-400' : ''
                      } ${isToday ? 'text-blue-600' : ''}`}>
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.event_id}
                            onClick={() => setSelectedEvent(event)}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${
                              event.is_customer_meeting
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center space-x-1">
                              {event.meet_link && <Video className="w-3 h-3" />}
                              <span className="truncate">
                                {event.start_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="truncate font-medium">{event.summary}</div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Event Chains */}
        <div className="w-80 bg-white border-l p-4">
          <h3 className="font-semibold mb-4">Active Event Chains</h3>
          <div className="space-y-4">
            {eventChains.map((chain) => (
              <div key={chain.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-sm">{chain.name}</h4>
                    <p className="text-xs text-gray-500">{chain.organization}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    chain.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {chain.status}
                  </span>
                </div>
                <div className="space-y-2">
                  {chain.events.map((event, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        event.completed ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {event.completed ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <span className={event.completed ? 'line-through text-gray-400' : ''}>
                        {event.name}
                      </span>
                      <span className="text-gray-400">Day {event.offset_days}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Started {chain.anchor_date.toLocaleDateString()}</span>
                    <button className="text-blue-600 hover:text-blue-800">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-sm text-gray-600">
            + Create Event Chain
          </button>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedEvent.summary}</h2>
                  <div className="flex items-center space-x-3 mt-2">
                    {selectedEvent.is_customer_meeting && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        Customer Meeting
                      </span>
                    )}
                    {selectedEvent.meeting_type && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        meetingTypes.find(t => t.value === selectedEvent.meeting_type)?.color
                      }`}>
                        {meetingTypes.find(t => t.value === selectedEvent.meeting_type)?.label}
                      </span>
                    )}
                    {selectedEvent.event_chain_id && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center">
                        <Zap className="w-3 h-3 mr-1" />
                        Automated
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Event Details</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <dt className="w-20 text-gray-500">When:</dt>
                      <dd>
                        {selectedEvent.start_time.toLocaleDateString()}<br />
                        {selectedEvent.start_time.toLocaleTimeString()} - {selectedEvent.end_time.toLocaleTimeString()}
                      </dd>
                    </div>
                    <div className="flex items-start">
                      <dt className="w-20 text-gray-500">Where:</dt>
                      <dd>
                        {selectedEvent.location}
                        {selectedEvent.meet_link && (
                          <button
                            onClick={() => handleQuickAction('join', selectedEvent)}
                            className="ml-2 text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <Video className="w-4 h-4 mr-1" />
                            Join Meeting
                          </button>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-start">
                      <dt className="w-20 text-gray-500">Organizer:</dt>
                      <dd>{selectedEvent.organizer_name}</dd>
                    </div>
                    {selectedEvent.organization && (
                      <div className="flex items-start">
                        <dt className="w-20 text-gray-500">Customer:</dt>
                        <dd className="font-medium">{selectedEvent.organization.name}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Attendees ({selectedEvent.attendee_emails.length})</h3>
                  <div className="space-y-2">
                    {selectedEvent.attendee_emails.map((email) => {
                      const response = selectedEvent.attendee_responses?.[email];
                      return (
                        <div key={email} className="flex items-center justify-between text-sm">
                          <span>{email}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            response === 'accepted' ? 'bg-green-100 text-green-700' :
                            response === 'tentative' ? 'bg-yellow-100 text-yellow-700' :
                            response === 'declined' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {response || 'pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Response Summary */}
                  <div className="mt-3 pt-3 border-t">
                    {(() => {
                      const status = getAttendeeStatus(selectedEvent.attendee_responses);
                      return (
                        <div className="flex items-center space-x-3 text-xs">
                          <span className="flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                            {status.accepted}
                          </span>
                          <span className="flex items-center">
                            <AlertCircle className="w-3 h-3 text-yellow-600 mr-1" />
                            {status.tentative}
                          </span>
                          <span className="flex items-center">
                            <XCircle className="w-3 h-3 text-red-600 mr-1" />
                            {status.declined}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {selectedEvent.description && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-gray-700">{selectedEvent.description}</p>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="flex items-center space-x-3">
                  {selectedEvent.agenda_gid ? (
                    <button
                      onClick={() => handleQuickAction('agenda', selectedEvent)}
                      className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center text-sm"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View Agenda
                    </button>
                  ) : (
                    <button className="px-3 py-2 border rounded hover:bg-gray-50 flex items-center text-sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Create Agenda
                    </button>
                  )}
                  
                  {selectedEvent.notes_gid ? (
                    <button
                      onClick={() => handleQuickAction('notes', selectedEvent)}
                      className="px-3 py-2 border rounded hover:bg-gray-50 flex items-center text-sm"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View Notes
                    </button>
                  ) : (
                    <button className="px-3 py-2 border rounded hover:bg-gray-50 flex items-center text-sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Create Notes
                    </button>
                  )}
                  
                  <button className="px-3 py-2 border rounded hover:bg-gray-50 flex items-center text-sm">
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit Event
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('cancel', selectedEvent)}
                    className="px-3 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 flex items-center text-sm"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarIntegrationView;