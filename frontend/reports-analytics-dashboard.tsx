import React, { useState } from 'react';
import { BarChart2, TrendingUp, Users, DollarSign, Activity, Calendar, FileText, Download, Filter, RefreshCw, ChevronDown, ArrowUp, ArrowDown, Minus, PieChart, Clock, Zap, Building, CheckCircle, AlertTriangle, Target, Mail } from 'lucide-react';

const ReportsAnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('overview');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  
  // Mock analytics data
  const kpiMetrics = {
    revenue: {
      current: 547250,
      previous: 498500,
      change: 9.78,
      trend: 'up'
    },
    customers: {
      current: 47,
      previous: 43,
      change: 9.3,
      trend: 'up'
    },
    activeProjects: {
      current: 12,
      previous: 15,
      change: -20,
      trend: 'down'
    },
    automationSuccess: {
      current: 94.3,
      previous: 91.2,
      change: 3.4,
      trend: 'up'
    }
  };

  const customerMetrics = {
    byStatus: [
      { status: 'Active', count: 35, percentage: 74.5 },
      { status: 'Pilot', count: 8, percentage: 17 },
      { status: 'Onboarding', count: 4, percentage: 8.5 }
    ],
    byHealth: [
      { health: 'Healthy', count: 28, percentage: 59.6, color: 'bg-green-500' },
      { health: 'At Risk', count: 12, percentage: 25.5, color: 'bg-yellow-500' },
      { health: 'Critical', count: 7, percentage: 14.9, color: 'bg-red-500' }
    ],
    churnRisk: [
      { name: 'TechStart Inc', risk: 85, reasons: ['Low usage', 'Support tickets'] },
      { name: 'DataFlow Systems', risk: 72, reasons: ['Payment delays'] },
      { name: 'SmallBiz Co', risk: 68, reasons: ['No engagement'] }
    ]
  };

  const activityMetrics = {
    emailsProcessed: {
      total: 3847,
      automated: 2156,
      manual: 1691
    },
    documentsCreated: {
      total: 267,
      fromTemplates: 198,
      manual: 69
    },
    meetingsScheduled: {
      total: 89,
      customer: 67,
      internal: 22
    },
    tasksCompleted: {
      total: 456,
      onTime: 398,
      overdue: 58
    }
  };

  const automationMetrics = {
    totalExecutions: 1243,
    successRate: 94.3,
    averageTime: 3.2,
    byType: [
      { type: 'Email Response', count: 456, success: 98.2 },
      { type: 'Document Creation', count: 312, success: 95.5 },
      { type: 'Task Assignment', count: 234, success: 92.3 },
      { type: 'Meeting Scheduling', count: 187, success: 89.8 },
      { type: 'Folder Creation', count: 54, success: 100 }
    ],
    timeToValue: {
      emailResponse: '< 5 min',
      documentCreation: '< 2 min',
      taskAssignment: '< 1 min'
    }
  };

  const teamPerformance = [
    {
      name: 'John Williams',
      role: 'Account Manager',
      tasksCompleted: 87,
      avgResponseTime: '2.3h',
      customerSatisfaction: 4.8,
      utilization: 78
    },
    {
      name: 'Sarah Chen',
      role: 'Technical Lead',
      tasksCompleted: 124,
      avgResponseTime: '1.8h',
      customerSatisfaction: 4.9,
      utilization: 92
    },
    {
      name: 'Mike Johnson',
      role: 'Legal Counsel',
      tasksCompleted: 45,
      avgResponseTime: '4.2h',
      customerSatisfaction: 4.6,
      utilization: 95
    },
    {
      name: 'Lisa Wong',
      role: 'Customer Success',
      tasksCompleted: 156,
      avgResponseTime: '1.2h',
      customerSatisfaction: 4.9,
      utilization: 83
    }
  ];

  const revenueByCustomer = [
    { name: 'Acme Corporation', revenue: 125000, percentage: 22.8 },
    { name: 'Global Industries', revenue: 98000, percentage: 17.9 },
    { name: 'Enterprise Co', revenue: 87500, percentage: 16.0 },
    { name: 'MegaCorp', revenue: 76000, percentage: 13.9 },
    { name: 'Others (43)', revenue: 160750, percentage: 29.4 }
  ];

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <ArrowUp className="w-4 h-4" />;
    if (trend === 'down') return <ArrowDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = (trend, value) => {
    if (trend === 'up') return value > 0 ? 'text-green-600' : 'text-red-600';
    if (trend === 'down') return value < 0 ? 'text-red-600' : 'text-green-600';
    return 'text-gray-600';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics & Reports</h1>
            <p className="text-sm text-gray-600">Business metrics and performance insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="today">Today</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="year_to_date">Year to Date</option>
            </select>
            <button className="p-2 hover:bg-gray-100 rounded">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex space-x-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'customers', label: 'Customers' },
            { id: 'operations', label: 'Operations' },
            { id: 'automation', label: 'Automation' },
            { id: 'team', label: 'Team Performance' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                reportType === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {reportType === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className={`flex items-center space-x-1 ${getTrendColor(kpiMetrics.revenue.trend, kpiMetrics.revenue.change)}`}>
                    {getTrendIcon(kpiMetrics.revenue.trend)}
                    <span className="text-sm font-medium">{kpiMetrics.revenue.change}%</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(kpiMetrics.revenue.current)}</div>
                <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className={`flex items-center space-x-1 ${getTrendColor(kpiMetrics.customers.trend, kpiMetrics.customers.change)}`}>
                    {getTrendIcon(kpiMetrics.customers.trend)}
                    <span className="text-sm font-medium">{kpiMetrics.customers.change}%</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">{kpiMetrics.customers.current}</div>
                <div className="text-sm text-gray-600">Active Customers</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className={`flex items-center space-x-1 ${getTrendColor(kpiMetrics.activeProjects.trend, kpiMetrics.activeProjects.change)}`}>
                    {getTrendIcon(kpiMetrics.activeProjects.trend)}
                    <span className="text-sm font-medium">{Math.abs(kpiMetrics.activeProjects.change)}%</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">{kpiMetrics.activeProjects.current}</div>
                <div className="text-sm text-gray-600">Active Projects</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className={`flex items-center space-x-1 ${getTrendColor(kpiMetrics.automationSuccess.trend, kpiMetrics.automationSuccess.change)}`}>
                    {getTrendIcon(kpiMetrics.automationSuccess.trend)}
                    <span className="text-sm font-medium">{kpiMetrics.automationSuccess.change}%</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">{kpiMetrics.automationSuccess.current}%</div>
                <div className="text-sm text-gray-600">Automation Success Rate</div>
              </div>
            </div>

            {/* Revenue Trends Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              <div className="h-64 flex items-end space-x-2">
                {[65, 72, 68, 82, 79, 88, 92, 85, 94, 91, 98, 100].map((height, index) => (
                  <div key={index} className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group">
                    <div style={{ height: `${height * 2.5}px` }} />
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      ${(height * 5000).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Emails Processed</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{activityMetrics.emailsProcessed.total.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">
                        {Math.round(activityMetrics.emailsProcessed.automated / activityMetrics.emailsProcessed.total * 100)}% automated
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Documents Created</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{activityMetrics.documentsCreated.total}</div>
                      <div className="text-xs text-gray-500">
                        {activityMetrics.documentsCreated.fromTemplates} from templates
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Meetings Scheduled</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{activityMetrics.meetingsScheduled.total}</div>
                      <div className="text-xs text-gray-500">
                        {activityMetrics.meetingsScheduled.customer} with customers
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Tasks Completed</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{activityMetrics.tasksCompleted.total}</div>
                      <div className="text-xs text-gray-500">
                        {Math.round(activityMetrics.tasksCompleted.onTime / activityMetrics.tasksCompleted.total * 100)}% on time
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Top Revenue Customers</h3>
                <div className="space-y-3">
                  {revenueByCustomer.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.percentage}% of total</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{formatCurrency(customer.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'customers' && (
          <div className="space-y-6">
            {/* Customer Status Distribution */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Customer Status</h3>
                <div className="space-y-4">
                  {customerMetrics.byStatus.map((item) => (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.status}</span>
                        <span className="text-sm">{item.count} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Customer Health</h3>
                <div className="space-y-4">
                  {customerMetrics.byHealth.map((item) => (
                    <div key={item.health}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.health}</span>
                        <span className="text-sm">{item.count} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                  Churn Risk
                </h3>
                <div className="space-y-3">
                  {customerMetrics.churnRisk.map((customer) => (
                    <div key={customer.name} className="border-l-4 border-red-400 pl-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{customer.name}</div>
                        <div className="text-sm font-semibold text-red-600">{customer.risk}%</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {customer.reasons.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Lifecycle Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Lifecycle Metrics</h3>
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">14</div>
                  <div className="text-sm text-gray-600 mt-1">Avg Days to Close</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">87%</div>
                  <div className="text-sm text-gray-600 mt-1">Pilot Conversion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">$2,847</div>
                  <div className="text-sm text-gray-600 mt-1">Avg Customer Value</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">18.3</div>
                  <div className="text-sm text-gray-600 mt-1">Months Avg Lifetime</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'operations' && (
          <div className="space-y-6">
            {/* Operations Overview */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Document Processing</h3>
                <div className="h-64 flex items-end justify-center space-x-4">
                  {[
                    { label: 'Contracts', value: 45, color: 'bg-blue-500' },
                    { label: 'Proposals', value: 32, color: 'bg-green-500' },
                    { label: 'Reports', value: 28, color: 'bg-purple-500' },
                    { label: 'Agreements', value: 21, color: 'bg-yellow-500' },
                    { label: 'Other', value: 15, color: 'bg-gray-500' }
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center">
                      <div className={`w-16 ${item.color} rounded-t`} style={{ height: `${item.value * 4}px` }} />
                      <div className="text-xs mt-2 text-center">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-gray-500">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Response Times</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Email Response</span>
                      <span className="text-sm font-medium">2.3 hours avg</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                      </div>
                      <span className="text-xs text-green-600">Good</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Document Review</span>
                      <span className="text-sm font-medium">4.7 hours avg</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }} />
                      </div>
                      <span className="text-xs text-yellow-600">Fair</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Task Completion</span>
                      <span className="text-sm font-medium">1.8 days avg</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} />
                      </div>
                      <span className="text-xs text-green-600">Excellent</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Meeting Scheduling</span>
                      <span className="text-sm font-medium">3.1 days avg</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '45%' }} />
                      </div>
                      <span className="text-xs text-red-600">Needs Improvement</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Process Efficiency */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Process Efficiency Trends</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Customer Onboarding</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Average Time</span>
                      <span className="font-medium">7.2 days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Steps Automated</span>
                      <span className="font-medium">12 of 15</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Success Rate</span>
                      <span className="font-medium text-green-600">96%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Contract Processing</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Average Time</span>
                      <span className="font-medium">3.5 days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Auto-generated</span>
                      <span className="font-medium">78%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>First-pass Approval</span>
                      <span className="font-medium text-yellow-600">82%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Support Resolution</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>First Response</span>
                      <span className="font-medium">45 min</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Resolution Time</span>
                      <span className="font-medium">4.2 hours</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Customer Satisfaction</span>
                      <span className="font-medium text-green-600">4.7/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'automation' && (
          <div className="space-y-6">
            {/* Automation Overview */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Total Executions</h3>
                  <Zap className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold">{automationMetrics.totalExecutions.toLocaleString()}</div>
                <div className="text-sm text-gray-600 mt-2">This month</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Success Rate</h3>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-green-600">{automationMetrics.successRate}%</div>
                <div className="text-sm text-gray-600 mt-2">+3.1% from last month</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Avg Execution Time</h3>
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold">{automationMetrics.averageTime}s</div>
                <div className="text-sm text-gray-600 mt-2">-0.5s improvement</div>
              </div>
            </div>

            {/* Automation by Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Automation Performance by Type</h3>
              <div className="space-y-4">
                {automationMetrics.byType.map((type) => (
                  <div key={type.type} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{type.type}</span>
                        <span className="text-sm text-gray-600">{type.count} executions</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              type.success >= 95 ? 'bg-green-500' :
                              type.success >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${type.success}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{type.success}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time to Value */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Time to Value</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-medium">Email Response</div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {automationMetrics.timeToValue.emailResponse}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="font-medium">Document Creation</div>
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    {automationMetrics.timeToValue.documentCreation}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="font-medium">Task Assignment</div>
                  <div className="text-2xl font-bold text-purple-600 mt-2">
                    {automationMetrics.timeToValue.taskAssignment}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'team' && (
          <div className="space-y-6">
            {/* Team Performance Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Team Performance Metrics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tasks Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Response Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Satisfaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilization
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamPerformance.map((member) => (
                      <tr key={member.name}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-500" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.tasksCompleted}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.avgResponseTime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900 mr-2">{member.customerSatisfaction}</div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(member.customerSatisfaction)
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  member.utilization > 90 ? 'bg-red-500' :
                                  member.utilization > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${member.utilization}%` }}
                              />
                            </div>
                            <div className="text-sm text-gray-900">{member.utilization}%</div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workload Distribution */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Workload Distribution</h3>
                <div className="space-y-3">
                  {teamPerformance.map((member) => (
                    <div key={member.name} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{member.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              member.utilization > 90 ? 'bg-red-500' :
                              member.utilization > 80 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${member.utilization}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-12 text-right">{member.utilization}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Team Efficiency Score</h3>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="#10b981"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 80}`}
                        strokeDashoffset={`${2 * Math.PI * 80 * (1 - 0.87)}`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold">87%</div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Task Completion Rate</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">On-time Delivery</span>
                    <span className="font-medium">88%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Quality Score</span>
                    <span className="font-medium">94%</span>
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

export default ReportsAnalyticsDashboard;