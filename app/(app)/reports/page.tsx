'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  BarChart, Calendar, PhoneCall, Phone, PhoneForwarded, Clock, Route, Users, CheckCircle, RefreshCw,
  MessageSquare, TrendingUp, FileText, Settings, Download, Play, Pause, Trash2, Edit, Plus,
  Filter, Search, ChevronDown, ChevronRight, Eye, Mail, Database, PieChart, Activity
} from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import getJourneyStatistics from "@/app/utils/api";
import getJourneyStatsByBrand from "@/app/utils/api";
import getJourneyStatsBySource from "@/app/utils/api";
import { 
  getDailyReport, 
  generateCallSummaryReport,
  generateSmsSummaryReport,
  generateAgentPerformanceReport,
  generateLeadConversionReport,
  generateJourneyAnalyticsReport,
  generateCustomReport,
  exportReport,
  createReportTemplate,
  getTodaysStats,
  getHourlyBreakdown,
  listReportTemplates,
  listReportExecutions
} from "@/app/utils/api";
import { useAuthStore } from '@/app/store/authStore';

type ReportType = 'dashboard' | 'call-summary' | 'sms-summary' | 'agent-performance' | 'lead-conversion' | 'journey-analytics' | 'custom' | 'templates';

interface ReportTemplate {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  schedule?: {
    enabled: boolean;
    frequency: string;
    time: string;
    timezone: string;
    format: string;
    recipients: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface ReportExecution {
  id: string;
  templateId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  error?: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>('call-summary');
  
  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [todaysStats, setTodaysStats] = useState<any>(null);
  const [hourlyBreakdown, setHourlyBreakdown] = useState<any>(null);
  
  // Report data
  const [reportData, setReportData] = useState<any>(null);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [reportExecutions, setReportExecutions] = useState<ReportExecution[]>([]);
  
  // Form states
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [groupBy, setGroupBy] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchInitialData();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (reportType === 'dashboard') {
      fetchDashboardData();
    } else if (reportType === 'templates') {
      fetchReportTemplates();
      fetchReportExecutions();
    }
  }, [reportType]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      await fetchDashboardData();
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [todayStats, hourlyStats] = await Promise.all([
        getTodaysStats(),
        getHourlyBreakdown()
      ]);
      
      setDashboardStats(todayStats); // Use today's stats as dashboard stats
      setTodaysStats(todayStats);
      setHourlyBreakdown(hourlyStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchReportTemplates = async () => {
    try {
      const templates = await listReportTemplates();
      setReportTemplates(templates);
    } catch (error) {
      console.error('Error fetching report templates:', error);
    }
  };

  const fetchReportExecutions = async () => {
    try {
      const executions = await listReportExecutions({ limit: 20 });
      setReportExecutions(executions.data || []);
    } catch (error) {
      console.error('Error fetching report executions:', error);
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    try {
      let data;
      
      switch (reportType) {
        case 'call-summary':
          data = await generateCallSummaryReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            groupBy,
            filters
          });
          break;
        case 'sms-summary':
          data = await generateSmsSummaryReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            groupBy: groupBy as 'hour' | 'day' | 'month',
            filters
          });
          break;
        case 'agent-performance':
          data = await generateAgentPerformanceReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            agentIds: filters.agentIds
          });
          break;
        case 'lead-conversion':
          data = await generateLeadConversionReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            sources: filters.sources,
            brands: filters.brands
          });
          break;
        case 'journey-analytics':
          data = await generateJourneyAnalyticsReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            journeyIds: filters.journeyIds
          });
          break;
        case 'custom':
          if (!filters.query) {
            toast.error('Please enter a SQL query');
            return;
          }
          data = await generateCustomReport({
            query: filters.query,
            parameters: filters.parameters || {}
          });
          break;
        default:
          return;
      }
      
      setReportData(data);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!reportData) {
      toast.error('No report data to export');
      return;
    }

    try {
      const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      const blob = await exportReport({
        reportData,
        format,
        filename
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const renderReportTypeSelector = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      {[
        { key: 'call-summary', label: 'Call Summary', icon: PhoneCall },
        { key: 'journey-analytics', label: 'Journey Analytics', icon: Route },
      ].map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          variant={reportType === key ? 'default' : 'outline'}
          onClick={() => setReportType(key as ReportType)}
          className="flex items-center gap-2"
        >
          <Icon className="w-4 h-4" />
          {label}
        </Button>
      ))}
    </div>
  );

  const renderDateRangeSelector = () => (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">From:</label>
        <input
          type="date"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={dateRange.startDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">To:</label>
        <input
          type="date"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={dateRange.endDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Group by:</label>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as any)}
        >
          <option value="hour">Hour</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>
    </div>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-medium mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportType === 'call-summary' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Call status"
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent ID</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Agent ID"
                  value={filters.agentId || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, agentId: parseInt(e.target.value) || undefined }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DID ID</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="DID ID"
                  value={filters.didId || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, didId: parseInt(e.target.value) || undefined }))}
                />
              </div>
            </>
          )}
          
          {reportType === 'sms-summary' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.direction || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, direction: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="outbound">Outbound</option>
                  <option value="inbound">Inbound</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Number</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="From number"
                  value={filters.fromNumber || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromNumber: e.target.value }))}
                />
              </div>
            </>
          )}

          {reportType === 'custom' && (
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">SQL Query</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Enter your SQL query here..."
                value={filters.query || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <PhoneCall className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Calls</p>
              <p className="text-2xl font-semibold text-gray-900">{todaysStats?.totalCalls || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">SMS Sent</p>
              <p className="text-2xl font-semibold text-gray-900">{todaysStats?.smsSent || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Agents</p>
              <p className="text-2xl font-semibold text-gray-900">{todaysStats?.activeAgents || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conversions</p>
              <p className="text-2xl font-semibold text-gray-900">{todaysStats?.conversions || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Breakdown Chart */}
      {hourlyBreakdown && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hourly Activity</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {Array.from({ length: 24 }, (_, i) => {
              const hour = i.toString().padStart(2, '0');
              const value = hourlyBreakdown[hour] || 0;
              const maxValue = Math.max(...Object.values(hourlyBreakdown || {}).map(Number));
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
              
              return (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="bg-blue-500 rounded-t w-6"
                    style={{ height: `${height}%` }}
                    title={`${hour}:00 - ${value} activities`}
                  />
                  <span className="text-xs text-gray-500 mt-1">{hour}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderReportData = () => {
    if (!reportData) return null;

    // Special handling for journey analytics reports
    if (reportType === 'journey-analytics' && reportData.journeys) {
      return renderJourneyAnalyticsVisualization();
    }

    // Special handling for call summary reports
    if (reportType === 'call-summary' && reportData.summary) {
      return renderCallSummaryVisualization();
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Report Results</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleExportReport('csv')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportReport('excel')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportReport('pdf')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(reportData, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  const renderCallSummaryVisualization = () => {
    const { summary, data, topDIDs, hourlyDistribution } = reportData;
    
    return (
      <div className="space-y-6">
        {/* Export Controls */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Call Summary Report</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('csv')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('excel')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('pdf')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <PhoneCall className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Calls</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.totalCalls.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Answered Calls</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.answeredCalls.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <PhoneForwarded className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Transferred</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.transferredCalls.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Duration</p>
                <p className="text-2xl font-semibold text-gray-900">{Math.round(summary.avgDuration)}s</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{summary.connectionRate}%</div>
              <div className="text-sm text-gray-600 mt-1">Connection Rate</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(parseFloat(summary.connectionRate), 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{summary.transferRate}%</div>
              <div className="text-sm text-gray-600 mt-1">Transfer Rate</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(summary.transferRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{summary.uniqueLeads.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-1">Unique Leads</div>
              <div className="text-sm text-gray-500 mt-2">
                {summary.totalCalls > 0 ? (summary.uniqueLeads / summary.totalCalls * 100).toFixed(1) : 0}% of total calls
              </div>
            </div>
          </div>
        </div>

        {/* Call Status Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Call Status Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.answeredCalls}</div>
                <div className="text-sm text-green-600">Answered</div>
                <div className="text-xs text-gray-500 mt-1">
                  {summary.totalCalls > 0 ? ((summary.answeredCalls / summary.totalCalls) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary.failedCalls}</div>
                <div className="text-sm text-red-600">Failed</div>
                <div className="text-xs text-gray-500 mt-1">
                  {summary.totalCalls > 0 ? ((summary.failedCalls / summary.totalCalls) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{summary.transferredCalls}</div>
                <div className="text-sm text-purple-600">Transferred</div>
                <div className="text-xs text-gray-500 mt-1">
                  {summary.totalCalls > 0 ? ((summary.transferredCalls / summary.totalCalls) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Distribution Chart */}
        {hourlyDistribution && hourlyDistribution.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Hourly Call Distribution</h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-end justify-between space-x-2">
                {hourlyDistribution.map((item: { hour: string; calls: string }) => {
                  const maxCalls = Math.max(...hourlyDistribution.map((h: { hour: string; calls: string }) => parseInt(h.calls)));
                  const height = maxCalls > 0 ? (parseInt(item.calls) / maxCalls) * 100 : 0;
                  
                  return (
                    <div key={item.hour} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-blue-500 rounded-t w-full min-w-8"
                        style={{ height: `${height}%` }}
                        title={`Hour ${item.hour}: ${item.calls} calls`}
                      />
                      <span className="text-xs text-gray-500 mt-1">{item.hour}:00</span>
                      <span className="text-xs text-gray-400">{item.calls}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Top DIDs Performance */}
        {topDIDs && topDIDs.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Performing DIDs</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {topDIDs.map((did: { from: string; callCount: string }, index: number) => {
                  const maxCalls = Math.max(...topDIDs.map((d: { from: string; callCount: string }) => parseInt(d.callCount)));
                  const percentage = maxCalls > 0 ? (parseInt(did.callCount) / maxCalls) * 100 : 0;
                  
                  return (
                    <div key={did.from} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{did.from}</div>
                          <div className="text-sm text-gray-500">{did.callCount} calls</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-16 text-right">
                          {((parseInt(did.callCount) / summary.totalCalls) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Daily Breakdown Table */}
        {data && data.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Daily Breakdown</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Total Calls</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Answered</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Failed</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Transferred</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Avg Duration</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Total Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((day: { date: string; totalCalls: string; answeredCalls: string; failedCalls: string; transferredCalls: string; avgDuration: string; totalDuration: string }, index: number) => (
                      <tr key={day.date} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-gray-900">{parseInt(day.totalCalls).toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-900">{parseInt(day.answeredCalls).toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-900">{parseInt(day.failedCalls).toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-900">{parseInt(day.transferredCalls).toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-900">{parseFloat(day.avgDuration).toFixed(1)}s</td>
                        <td className="py-3 px-4 text-gray-900">
                          {Math.floor(parseInt(day.totalDuration) / 60)}m {parseInt(day.totalDuration) % 60}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderJourneyAnalyticsVisualization = () => {
    const journeys = reportData.journeys || [];
    
    return (
      <div className="space-y-6">
        {/* Export Controls */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Journey Analytics Report</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('csv')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('excel')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportReport('pdf')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Route className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Journeys</p>
                <p className="text-2xl font-semibold text-gray-900">{journeys.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {journeys.reduce((sum: number, j: any) => sum + j.enrollments.totalEnrollments, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {journeys.reduce((sum: number, j: any) => sum + j.enrollments.completedEnrollments, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Conversion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {journeys.length > 0 
                    ? (journeys.reduce((sum: number, j: any) => sum + parseFloat(j.conversionRate || '0'), 0) / journeys.length).toFixed(1)
                    : '0'
                  }%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Journey Performance Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Journey Performance Overview</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Journey</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Steps</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Enrollments</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Active</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Completed</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Conversion Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {journeys.map((journey: any, index: number) => (
                    <tr key={journey.journey.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{journey.journey.name}</div>
                          {journey.journey.description && (
                            <div className="text-sm text-gray-500">{journey.journey.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{journey.journey.stepCount}</td>
                      <td className="py-3 px-4 text-gray-900">{journey.enrollments.totalEnrollments}</td>
                      <td className="py-3 px-4 text-gray-900">{journey.enrollments.activeEnrollments}</td>
                      <td className="py-3 px-4 text-gray-900">{journey.enrollments.completedEnrollments}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          parseFloat(journey.conversionRate || '0') >= 80 ? 'bg-green-100 text-green-800' :
                          parseFloat(journey.conversionRate || '0') >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {journey.conversionRate || '0'}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(parseFloat(journey.conversionRate || '0'), 100)}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Individual Journey Details */}
        {journeys.map((journey: any) => (
          <div key={journey.journey.id} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">{journey.journey.name}</h3>
                <span className="text-sm text-gray-500">ID: {journey.journey.id}</span>
              </div>
              {journey.journey.description && (
                <p className="text-sm text-gray-600 mt-1">{journey.journey.description}</p>
              )}
            </div>
            
            <div className="p-6">
              {/* Enrollment Status */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{journey.enrollments.totalEnrollments}</div>
                  <div className="text-sm text-blue-600">Total Enrollments</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{journey.enrollments.activeEnrollments}</div>
                  <div className="text-sm text-green-600">Active</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{journey.enrollments.completedEnrollments}</div>
                  <div className="text-sm text-purple-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{journey.enrollments.exitedEnrollments}</div>
                  <div className="text-sm text-orange-600">Exited</div>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Conversion Funnel</h4>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{journey.conversionFunnel.uniqueLeads}</div>
                    <div className="text-sm text-gray-600">Unique Leads</div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{journey.conversionFunnel.reachedFirstStep}</div>
                    <div className="text-sm text-gray-600">First Step</div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${journey.conversionFunnel.uniqueLeads > 0 
                            ? (parseInt(journey.conversionFunnel.reachedFirstStep) / parseInt(journey.conversionFunnel.uniqueLeads)) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{journey.conversionFunnel.reachedLastStep}</div>
                    <div className="text-sm text-gray-600">Last Step</div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ 
                          width: `${journey.conversionFunnel.uniqueLeads > 0 
                            ? (parseInt(journey.conversionFunnel.reachedLastStep) / parseInt(journey.conversionFunnel.uniqueLeads)) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{journey.conversionFunnel.completed}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
              </div>

              {/* Step Performance */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Step Performance</h4>
                <div className="space-y-3">
                  {Object.entries(journey.stepPerformance).map(([stepId, step]: [string, any]) => {
                    const successRate = parseFloat(step.successRate?.toString() || '0');
                    return (
                      <div key={stepId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{step.stepName}</div>
                          <div className="text-sm text-gray-600">
                            {step.completedExecutions} / {step.totalExecutions} executions
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                successRate >= 90 ? 'bg-green-500' :
                                successRate >= 70 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(successRate, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${
                            successRate >= 90 ? 'text-green-600' :
                            successRate >= 70 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {successRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
}