'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  BarChart, Calendar, PhoneCall, Phone, PhoneForwarded, Clock, Route, Users, CheckCircle, RefreshCw,
  MessageSquare, TrendingUp, FileText, Settings, Download, Play, Pause, Trash2, Edit, Plus,
  Filter, Search, ChevronDown, ChevronRight, Eye, Mail, Database, PieChart, Activity, BarChart3,
  Grid, Palette, Target, DollarSign
} from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
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
import {
  getLiveDashboardStats,
  getHistoricalDashboardData,
  saveDashboardConfig,
  getJourneyOverview,
  getJourneyFunnel,
  compareJourneys,
  getLeadSourcePerformance,
  getLeadQualityReport,
  getLeadFunnelAnalysis,
  listCustomReports,
  getCustomReport,
  createCustomReport,
  updateCustomReport,
  deleteCustomReport,
  addWidgetToReport,
  updateWidget,
  deleteWidget,
  reorderWidgets,
  executeWidgetQuery,
  cloneReport,
  getAvailableDataSources,
  createCustomDataSource,
  getPublicReport,
  executePublicWidget,
  getAvailableLeadSources,
  getAvailableLeadTags,
  generateLeadSourcePerformanceReport,
  generateLeadSourceComparisonReport,
  getLeadSummaryMetrics,
  exportLeadSourceReport,
  getRealTimeLeadMetrics
} from "@/app/utils/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

// Import new reporting components
import CriticalReports from '@/app/components/reports/CriticalReports';
import CustomReportsManager from '@/app/components/reports/CustomReportsManager';
import FinancialTracker from '@/app/components/reports/FinancialTracker';
import CustomReportBuilder from '@/app/components/reports/CustomReportBuilder';

type ReportType = 'critical-reports' | 'custom-reports' | 'financial-tracker' | 'call-summary' | 'agent-performance' | 'journey-analytics' | 'lead-source-performance' | 'lead-source-comparison' | 'lead-source-realtime' | 'templates';

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

type DashboardWidget = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  widget: string;
  config: Record<string, any>;
};

type DashboardConfig = {
  layout: DashboardWidget[];
  theme: {
    mode: 'light' | 'dark';
    primaryColor: string;
  };
  refreshInterval: number;
};

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('critical-reports');
  const [journeys, setJourneys] = useState<any[]>([]);
  
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
  
  // Add new state for dashboard
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    layout: [],
    theme: {
      mode: 'light',
      primaryColor: '#3B82F6'
    },
    refreshInterval: 30
  });
  
  // Add new state for custom reports
  const [customReports, setCustomReports] = useState<any[]>([]);
  const [availableDataSources, setAvailableDataSources] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  
  // Lead source reporting state
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [leadTags, setLeadTags] = useState<any[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [closedTag, setClosedTag] = useState<string>('closed');
  const [contactedStatuses, setContactedStatuses] = useState<string[]>(['contacted', 'transferred']);
  const [compareDateRange, setCompareDateRange] = useState({
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!isAuthenticated || !user?.tenantId) {
      router.push('/login');
      return;
    }
    fetchInitialData();
  }, [isAuthenticated, user?.tenantId, router]);

  useEffect(() => {
    if (user?.tenantId) {
      const ws = new WebSocket(`wss://api.knittt.com/ws/dashboard?tenantId=${user.tenantId}`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'dashboard_update') {
          setDashboardStats(data.data);
        }
      };
      
      return () => {
        ws.close();
      };
    }
  }, [user?.tenantId]);

  useEffect(() => {
    if (reportType === 'templates') {
      fetchReportTemplates();
      fetchReportExecutions();
    }
  }, [reportType]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchLeadSourceData()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeadSourceData = async () => {
    try {
      const [sources, tags] = await Promise.all([
        getAvailableLeadSources(),
        getAvailableLeadTags()
      ]);
      setLeadSources(sources);
      setLeadTags(tags);
    } catch (error) {
      console.error('Error fetching lead source data:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Use working endpoints only: /stats/today and /stats/hourly
      const [todayStats, hourlyStats] = await Promise.all([
        getTodaysStats(),
        getHourlyBreakdown()
      ]);
      
      setTodaysStats(todayStats);
      setHourlyBreakdown(hourlyStats);
      
      // Mock dashboard structure with working data
      setDashboardStats({
        today: todayStats,
        hourly: hourlyStats,
        // Remove broken historical data call
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
      // Note: /report-executions endpoint is not working (404)
      // Using empty array for now until backend is fixed
      setReportExecutions([]);
    } catch (error) {
      console.error('Error fetching report executions:', error);
      setReportExecutions([]);
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    try {
      let data;
      
      switch (reportType) {
        case 'call-summary':
          // ✅ Working endpoint
          data = await generateCallSummaryReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            groupBy,
            filters
          });
          break;
        case 'agent-performance':
          // ✅ Working endpoint
          data = await generateAgentPerformanceReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            agentIds: filters.agentIds
          });
          break;
        case 'journey-analytics':
          data = await generateJourneyAnalyticsReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            journeyIds: filters.journeyIds
          });
          if (data?.journeys) {
            // Ensure each journey has the required nested objects with default values
            const processedJourneys = data.journeys.map((journey: any) => ({
              journey: journey.journey || {},
              enrollments: {
                totalEnrollments: journey.enrollments?.totalEnrollments || 0,
                activeEnrollments: journey.enrollments?.activeEnrollments || 0,
                completedEnrollments: journey.enrollments?.completedEnrollments || 0,
                exitedEnrollments: journey.enrollments?.exitedEnrollments || 0
              },
              conversionRate: journey.conversionRate || '0',
              conversionFunnel: {
                uniqueLeads: journey.conversionFunnel?.uniqueLeads || 0,
                reachedFirstStep: journey.conversionFunnel?.reachedFirstStep || 0,
                reachedLastStep: journey.conversionFunnel?.reachedLastStep || 0,
                completed: journey.conversionFunnel?.completed || 0
              },
              stepPerformance: journey.stepPerformance || {}
            }));
            setJourneys(processedJourneys);
          } else {
            setJourneys([]);
          }
          break;
        case 'lead-source-performance':
          // ⚠️ Known Issue: PostgreSQL date_format compatibility problem
          try {
            data = await generateLeadSourcePerformanceReport({
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
              sources: selectedSources.length > 0 ? selectedSources : undefined,
              groupBy: groupBy === 'hour' ? 'day' : groupBy, // Convert 'hour' to 'day' for API compatibility
              closedTag,
              contactedStatuses
            });
          } catch (error: any) {
            console.warn('Lead source performance report failed (expected - backend fixing PostgreSQL compatibility):', error);
            // Use fallback data structure that matches the API response format
            data = {
              summary: {
                totalNewLeads: 0,
                totalContactedLeads: 0,
                totalClosedLeads: 0,
                overallContactRate: 0,
                overallCloseRate: 0
              },
              sourcePerformance: leadSources.map(source => ({
                source: source.source,
                newLeads: source.leadCount || 0,
                contactedLeads: 0,
                closedLeads: 0,
                contactRate: 0,
                closeRate: 0,
                contactToCloseRate: 0,
                avgDaysToClose: "0"
              })),
              conversionFunnel: {
                stages: [
                  { name: "New Leads", count: 0, percentage: 100, dropoffFromPrevious: 0 },
                  { name: "Contacted", count: 0, percentage: 0, dropoffFromPrevious: 0 },
                  { name: "Closed", count: 0, percentage: 0, dropoffFromPrevious: 0 }
                ],
                conversionRates: { leadToContact: 0, leadToClose: 0, contactToClose: 0 }
              },
              parameters: {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                sources: selectedSources,
                groupBy,
                closedTag,
                contactedStatuses
              },
              _fallbackData: true,
              _note: "Backend team is fixing PostgreSQL date_format compatibility issue"
            };
            toast.error('Using fallback data - Backend team is fixing database compatibility issues');
          }
          break;
        case 'lead-source-comparison':
          // ✅ Working endpoint - Lead source comparison report
          data = await generateLeadSourceComparisonReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            compareStartDate: compareDateRange.startDate,
            compareEndDate: compareDateRange.endDate,
            sources: selectedSources.length > 0 ? selectedSources : undefined,
            closedTag,
            contactedStatuses
          });
          break;
        case 'lead-source-realtime':
          // ✅ Working endpoint - Real-time lead metrics
          try {
            data = await getRealTimeLeadMetrics();
          } catch (error: any) {
            console.error('Real-time metrics failed:', error);
            toast.error('Failed to fetch real-time metrics');
            return;
          }
          break;

        case 'templates':
          // Templates are handled separately
          return;
        default:
          toast.error('Report type not supported yet');
          return;
      }
      
      setReportData(data);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
      setJourneys([]); // Reset journeys on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!reportData) {
      toast.error('No report data to export');
      return;
    }

    // Note: Export endpoint is not working yet, using JSON download as fallback
    try {
      const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
      const jsonData = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Report exported as JSON (backend export will be available soon)');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const handleReportTypeChange = (newType: ReportType) => {
    setReportType(newType);
    setReportData(null); // Clear previous report data
    setFilters({}); // Reset filters
    
    // Auto-generate real-time report since it doesn't need configuration
    if (newType === 'lead-source-realtime') {
      // Use setTimeout to ensure state update happens first
      setTimeout(() => generateReport(), 100);
    }
  };

  const renderReportTypeSelector = () => (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-brand hover:bg-brand-dark text-white w-full md:w-auto">
              {getReportTypeLabel(reportType)}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Report Types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleReportTypeChange('critical-reports')}>
              <Target className="mr-2 h-4 w-4 text-brand" />
              <span>Critical Reports</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleReportTypeChange('custom-reports')}>
              <Grid className="mr-2 h-4 w-4 text-brand" />
              <span>Custom Reports</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleReportTypeChange('financial-tracker')}>
              <DollarSign className="mr-2 h-4 w-4 text-brand" />
              <span>Financial Tracker</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleReportTypeChange('call-summary')}>
              <PhoneCall className="mr-2 h-4 w-4 text-brand" />
              <span>Call Summary</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleReportTypeChange('journey-analytics')}>
              <Route className="mr-2 h-4 w-4 text-brand" />
              <span>Journey Analytics</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleReportTypeChange('lead-source-performance')}>
              <TrendingUp className="mr-2 h-4 w-4 text-brand" />
              <span>Lead Source Performance</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleReportTypeChange('lead-source-comparison')}>
              <BarChart3 className="mr-2 h-4 w-4 text-brand" />
              <span>Lead Source Comparison</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleReportTypeChange('lead-source-realtime')}>
              <Activity className="mr-2 h-4 w-4 text-brand" />
              <span>Lead Real-time</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleReportTypeChange('templates')}>
              <FileText className="mr-2 h-4 w-4 text-brand" />
              <span>Templates</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {reportType !== 'templates' && reportType !== 'lead-source-realtime' && reportType !== 'critical-reports' && reportType !== 'custom-reports' && reportType !== 'financial-tracker' && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="w-4 h-4 mr-2 text-brand" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <Button
              onClick={generateReport}
              isLoading={isLoading}
              className="bg-brand hover:bg-brand-dark text-white"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        )}
        
        {reportType === 'lead-source-realtime' && (
          <Button
            onClick={generateReport}
            isLoading={isLoading}
            className="bg-brand hover:bg-brand-dark text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </>
            )}
          </Button>
        )}
      </div>
      
      {reportType === 'lead-source-realtime' && (
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand bg-opacity-10 text-brand">
            ✅ Live Data
          </span>
          <span className="text-sm text-gray-500">
            Real-time metrics are automatically updated
          </span>
        </div>
      )}
    </div>
  );

  // Helper function to get the label for the selected report type
  const getReportTypeLabel = (type: ReportType): string => {
    switch (type) {
      case 'critical-reports': return 'Critical Reports';
      case 'custom-reports': return 'Custom Reports';
      case 'financial-tracker': return 'Financial Tracker';
      case 'call-summary': return 'Call Summary';
      case 'agent-performance': return 'Agent Performance';
      case 'journey-analytics': return 'Journey Analytics';
      case 'lead-source-performance': return 'Lead Source Performance';
      case 'lead-source-comparison': return 'Lead Source Comparison';
      case 'lead-source-realtime': return 'Lead Real-time Metrics';
      case 'templates': return 'Report Templates';
      default: return 'Select Report Type';
    }
  };

  const renderDateRangeSelector = () => (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-md font-medium text-gray-700 mb-3">Report Parameters</h3>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">From:</label>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">To:</label>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Group by:</label>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
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
    </div>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowFilters(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
        </div>
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
          
          {false && (
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

          {(reportType === 'lead-source-performance' || reportType === 'lead-source-comparison') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead Sources</label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {leadSources.map(source => (
                    <label key={source.source} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedSources.includes(source.source)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSources(prev => [...prev, source.source]);
                          } else {
                            setSelectedSources(prev => prev.filter(s => s !== source.source));
                          }
                        }}
                      />
                      <span className="text-sm">{source.source} ({source.leadCount} leads)</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closed Tag</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={closedTag}
                  onChange={(e) => setClosedTag(e.target.value)}
                >
                  {leadTags.map(tag => (
                    <option key={tag.tag} value={tag.tag}>
                      {tag.tag} ({tag.count})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contacted Statuses</label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {['contacted', 'transferred', 'qualified', 'hot'].map(status => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={contactedStatuses.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setContactedStatuses(prev => [...prev, status]);
                          } else {
                            setContactedStatuses(prev => prev.filter(s => s !== status));
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {reportType === 'lead-source-comparison' && (
            <div className="col-span-full">
              <h4 className="text-md font-medium text-gray-700 mb-3">Comparison Period</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compare From:</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={compareDateRange.startDate}
                    onChange={(e) => setCompareDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compare To:</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={compareDateRange.endDate}
                    onChange={(e) => setCompareDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {false && (
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex space-x-4">
          <Button onClick={handleSaveDashboardConfig}>
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
          <Button onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Today's Stats Section */}
      {todaysStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Calls Today</h3>
            <p className="text-2xl font-bold">{todaysStats.calls?.total || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Answered: {todaysStats.calls?.answered || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">SMS Messages</h3>
            <p className="text-2xl font-bold">{todaysStats.sms?.total || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Sent: {todaysStats.sms?.sent || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Leads</h3>
            <p className="text-2xl font-bold">{todaysStats.leads?.total || 0}</p>
            <p className="text-xs text-gray-500 mt-1">New: {todaysStats.leads?.new || 0}</p>
          </div>
        </div>
      )}
      
      {/* Hourly Breakdown Section */}
      {hourlyBreakdown && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Hourly Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Calls by Hour</h4>
              <div className="space-y-2">
                {hourlyBreakdown.calls && Object.entries(hourlyBreakdown.calls).map(([hour, count]) => (
                  <div key={hour} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{hour}:00</span>
                    <span className="text-sm font-medium">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">SMS by Hour</h4>
              <div className="space-y-2">
                {hourlyBreakdown.sms && Object.entries(hourlyBreakdown.sms).map(([hour, count]) => (
                  <div key={hour} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{hour}:00</span>
                    <span className="text-sm font-medium">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {!todaysStats && !hourlyBreakdown && (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 text-brand mx-auto mb-2 animate-spin" />
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      )}
    </div>
  );

  const renderCustomReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Custom Reports</h2>
        <Button onClick={() => setShowReportBuilder(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Report
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customReports.map(report => (
          <div key={report.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium">{report.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{report.description}</p>
            <div className="mt-4 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReport(report);
                  setShowReportBuilder(true);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteCustomReport(report.id)}
                isLoading={isDeleting}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add report builder modal here */}
    </div>
  );

  const handleSaveDashboardConfig = async () => {
    try {
      await saveDashboardConfig(dashboardConfig);
      toast.success('Dashboard configuration saved');
    } catch (error) {
      console.error('Error saving dashboard configuration:', error);
      toast.error('Failed to save dashboard configuration');
    }
  };

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

    // Special handling for lead source performance reports
    if (reportType === 'lead-source-performance' && reportData.summary) {
      return renderLeadSourcePerformanceVisualization();
    }

    // Special handling for lead source comparison reports
    if (reportType === 'lead-source-comparison' && reportData.comparison) {
      return renderLeadSourceComparisonVisualization();
    }

    // Special handling for real-time lead metrics
    if (reportType === 'lead-source-realtime' && reportData.today) {
      return renderLeadSourceRealtimeVisualization();
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
    if (!reportData) return null;
    
    const { summary, data, topDIDs, hourlyDistribution } = reportData;
    
    return (
      <div className="space-y-6">
        {/* Export Controls */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Call Summary Report</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Download className="w-4 h-4 mr-2 text-brand" />
                    Export
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportReport('csv')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportReport('excel')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Excel</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportReport('pdf')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>PDF</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <PhoneCall className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Calls</p>
                <p className="text-2xl font-semibold text-gray-900">{(summary.totalCalls || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <Phone className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Answered Calls</p>
                <p className="text-2xl font-semibold text-gray-900">{(summary.answeredCalls || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <PhoneForwarded className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Transferred</p>
                <p className="text-2xl font-semibold text-gray-900">{(summary.transferredCalls || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <Clock className="h-6 w-6 text-brand" />
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
              <div className="text-3xl font-bold text-brand">{summary.connectionRate || 0}%</div>
              <div className="text-sm text-gray-600 mt-1">Connection Rate</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-brand h-2 rounded-full" 
                  style={{ width: `${Math.min(parseFloat(summary.connectionRate || '0'), 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand">{summary.transferRate || 0}%</div>
              <div className="text-sm text-gray-600 mt-1">Transfer Rate</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-brand h-2 rounded-full" 
                  style={{ width: `${Math.min(summary.transferRate || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand">{(summary.uniqueLeads || 0).toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-1">Unique Leads</div>
              <div className="text-sm text-gray-500 mt-2">
                {summary.totalCalls > 0 ? ((summary.uniqueLeads || 0) / summary.totalCalls * 100).toFixed(1) : 0}% of total calls
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
              <div className="text-center p-4 bg-brand bg-opacity-10 rounded-lg">
                <div className="text-2xl font-bold text-brand">{summary.answeredCalls || 0}</div>
                <div className="text-sm text-brand">Answered</div>
                <div className="text-xs text-gray-500 mt-1">
                  {summary.totalCalls > 0 ? (((summary.answeredCalls || 0) / summary.totalCalls) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="text-center p-4 bg-brand bg-opacity-10 rounded-lg">
                <div className="text-2xl font-bold text-brand">{summary.failedCalls || 0}</div>
                <div className="text-sm text-brand">Failed</div>
                <div className="text-xs text-gray-500 mt-1">
                  {summary.totalCalls > 0 ? (((summary.failedCalls || 0) / summary.totalCalls) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="text-center p-4 bg-brand bg-opacity-10 rounded-lg">
                <div className="text-2xl font-bold text-brand">{summary.transferredCalls || 0}</div>
                <div className="text-sm text-brand">Transferred</div>
                <div className="text-xs text-gray-500 mt-1">
                  {summary.totalCalls > 0 ? (((summary.transferredCalls || 0) / summary.totalCalls) * 100).toFixed(1) : 0}%
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
                        className="bg-brand rounded-t w-full min-w-8"
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
                        <div className="w-8 h-8 bg-brand bg-opacity-10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-brand">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{did.from}</div>
                          <div className="text-sm text-gray-500">{did.callCount} calls</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-brand h-2 rounded-full" 
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
    
    // Ensure each journey has the expected structure with default values
    const processedJourneys = journeys.map((journey: any) => ({
      journey: {
        id: journey?.journey?.id || 'unknown',
        name: journey?.journey?.name || 'Untitled Journey',
        description: journey?.journey?.description || '',
        stepCount: journey?.journey?.stepCount || 0
      },
      enrollments: {
        totalEnrollments: journey?.enrollments?.totalEnrollments || 0,
        activeEnrollments: journey?.enrollments?.activeEnrollments || 0,
        completedEnrollments: journey?.enrollments?.completedEnrollments || 0,
        exitedEnrollments: journey?.enrollments?.exitedEnrollments || 0
      },
      conversionRate: journey?.conversionRate || '0',
      conversionFunnel: {
        uniqueLeads: journey?.conversionFunnel?.uniqueLeads || 0,
        reachedFirstStep: journey?.conversionFunnel?.reachedFirstStep || 0,
        reachedLastStep: journey?.conversionFunnel?.reachedLastStep || 0,
        completed: journey?.conversionFunnel?.completed || 0
      },
      stepPerformance: journey?.stepPerformance || {}
    }));
    
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
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <Route className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Journeys</p>
                <p className="text-2xl font-semibold text-gray-900">{processedJourneys.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <Users className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {processedJourneys.reduce((sum: number, j: any) => sum + j.enrollments.totalEnrollments, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <CheckCircle className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {processedJourneys.reduce((sum: number, j: any) => sum + j.enrollments.completedEnrollments, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <TrendingUp className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Conversion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {processedJourneys.length > 0 
                    ? (processedJourneys.reduce((sum: number, j: any) => sum + parseFloat(j.conversionRate), 0) / processedJourneys.length).toFixed(1)
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
                  {processedJourneys.map((journey: any, index: number) => (
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
                          parseFloat(journey.conversionRate) >= 80 ? 'bg-brand bg-opacity-10 text-brand' :
                          parseFloat(journey.conversionRate) >= 60 ? 'bg-brand-light bg-opacity-10 text-brand-light' :
                          'bg-brand-dark bg-opacity-10 text-brand-dark'
                        }`}>
                          {journey.conversionRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-brand h-2 rounded-full" 
                            style={{ width: `${Math.min(parseFloat(journey.conversionRate), 100)}%` }}
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
        {processedJourneys.map((journey: any) => (
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
                <div className="text-center p-4 bg-brand bg-opacity-10 rounded-lg">
                  <div className="text-2xl font-bold text-brand">{journey.enrollments.totalEnrollments}</div>
                  <div className="text-sm text-brand">Total Enrollments</div>
                </div>
                <div className="text-center p-4 bg-brand bg-opacity-10 rounded-lg">
                  <div className="text-2xl font-bold text-brand">{journey.enrollments.activeEnrollments}</div>
                  <div className="text-sm text-brand">Active</div>
                </div>
                <div className="text-center p-4 bg-brand bg-opacity-10 rounded-lg">
                  <div className="text-2xl font-bold text-brand">{journey.enrollments.completedEnrollments}</div>
                  <div className="text-sm text-brand">Completed</div>
                </div>
                <div className="text-center p-4 bg-brand bg-opacity-10 rounded-lg">
                  <div className="text-2xl font-bold text-brand">{journey.enrollments.exitedEnrollments}</div>
                  <div className="text-sm text-brand">Exited</div>
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
                      <div className="bg-brand h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{journey.conversionFunnel.reachedFirstStep}</div>
                    <div className="text-sm text-gray-600">First Step</div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-brand-light h-2 rounded-full" 
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
                        className="bg-brand-dark h-2 rounded-full" 
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
                    const successRate = parseFloat(step?.successRate?.toString() || '0');
                    return (
                      <div key={stepId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{step?.stepName || 'Unknown Step'}</div>
                          <div className="text-sm text-gray-600">
                            {step?.completedExecutions || 0} / {step?.totalExecutions || 0} executions
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                successRate >= 90 ? 'bg-brand' :
                                successRate >= 70 ? 'bg-brand-light' :
                                'bg-brand-dark'
                              }`}
                              style={{ width: `${Math.min(successRate, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${
                            successRate >= 90 ? 'text-brand' :
                            successRate >= 70 ? 'text-brand-light' :
                            'text-brand-dark'
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

  const renderLeadSourcePerformanceVisualization = () => {
    const { summary, sourcePerformance, conversionFunnel, timeSeries, _fallbackData, _note } = reportData;
    
    return (
      <div className="space-y-6">
        {/* Status Banner for Fallback Data */}
        {_fallbackData && (
          <div className="bg-brand bg-opacity-10 border border-brand border-opacity-20 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-brand mr-2" />
              <div>
                <span className="text-brand font-medium">
                  ⚠️ Using Fallback Data - {_note}
                </span>
                <p className="text-gray-700 text-sm mt-1">
                  The backend team is fixing PostgreSQL compatibility issues. This report shows basic structure with available data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Export Controls */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Lead Source Performance Report {_fallbackData ? '⚠️' : ''}
              </h3>
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
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <Users className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total New Leads</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.totalNewLeads.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <PhoneCall className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Contacted Leads</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.totalContactedLeads.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <CheckCircle className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Closed Leads</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.totalClosedLeads.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <TrendingUp className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overall Close Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.overallCloseRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Conversion Funnel</h4>
          <div className="space-y-4">
            {conversionFunnel.stages.map((stage: any, index: number) => (
              <div key={stage.name} className="flex items-center">
                <div className="w-32 text-sm font-medium text-gray-700">{stage.name}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full ${
                        index === 0 ? 'bg-brand' :
                        index === 1 ? 'bg-brand-light' :
                        'bg-brand-dark'
                      }`}
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <div className="text-lg font-semibold text-gray-900">{stage.count.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{stage.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Performance Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Source Performance</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Leads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Days to Close</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sourcePerformance.map((source: any) => (
                  <tr key={source.source}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {source.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {source.newLeads.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {source.contactedLeads.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {source.closedLeads.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          source.contactRate >= 80 ? 'bg-brand bg-opacity-10 text-brand' :
                          source.contactRate >= 60 ? 'bg-brand-light bg-opacity-10 text-brand-light' :
                          'bg-brand-dark bg-opacity-10 text-brand-dark'
                        }`}>
                          {source.contactRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          source.closeRate >= 25 ? 'bg-brand bg-opacity-10 text-brand' :
                          source.closeRate >= 15 ? 'bg-brand-light bg-opacity-10 text-brand-light' :
                          'bg-brand-dark bg-opacity-10 text-brand-dark'
                        }`}>
                          {source.closeRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {source.avgDaysToClose} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderLeadSourceComparisonVisualization = () => {
    const { comparison, summary } = reportData;
    
    return (
      <div className="space-y-6">
        {/* Export Controls */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Lead Source Comparison Report</h3>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand">{summary.totalSources}</div>
              <div className="text-sm text-gray-600 mt-1">Total Sources Compared</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand">{summary.improvingSources}</div>
              <div className="text-sm text-gray-600 mt-1">Improving Sources</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-dark">{summary.decliningSourcees}</div>
              <div className="text-sm text-gray-600 mt-1">Declining Sources</div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Period Comparison</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparison.map((source: any) => (
                  <React.Fragment key={source.source}>
                    <tr className="bg-gray-50">
                      <td rowSpan={5} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize border-r">
                        {source.source}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-xs font-medium text-gray-700">New Leads</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{source.current.newLeads.toLocaleString()}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{source.previous.newLeads.toLocaleString()}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm">
                        <span className={`${source.changes.newLeads >= 0 ? 'text-brand' : 'text-brand-dark'}`}>
                          {source.changes.newLeads >= 0 ? '+' : ''}{source.changes.newLeads}
                        </span>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm">
                        <span className={`${source.percentageChanges.newLeads >= 0 ? 'text-brand' : 'text-brand-dark'}`}>
                          {source.percentageChanges.newLeads >= 0 ? '+' : ''}{source.percentageChanges.newLeads.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-2 whitespace-nowrap text-xs font-medium text-gray-700">Contacted</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{source.current.contactedLeads.toLocaleString()}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{source.previous.contactedLeads.toLocaleString()}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm">
                        <span className={`${source.changes.contactedLeads >= 0 ? 'text-brand' : 'text-brand-dark'}`}>
                          {source.changes.contactedLeads >= 0 ? '+' : ''}{source.changes.contactedLeads}
                        </span>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm">
                        <span className={`${source.percentageChanges.contactedLeads >= 0 ? 'text-brand' : 'text-brand-dark'}`}>
                          {source.percentageChanges.contactedLeads >= 0 ? '+' : ''}{source.percentageChanges.contactedLeads.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-2 whitespace-nowrap text-xs font-medium text-gray-700">Closed</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{source.current.closedLeads.toLocaleString()}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{source.previous.closedLeads.toLocaleString()}</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm">
                        <span className={`${source.changes.closedLeads >= 0 ? 'text-brand' : 'text-brand-dark'}`}>
                          {source.changes.closedLeads >= 0 ? '+' : ''}{source.changes.closedLeads}
                        </span>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm">
                        <span className={`${source.percentageChanges.closedLeads >= 0 ? 'text-brand' : 'text-brand-dark'}`}>
                          {source.percentageChanges.closedLeads >= 0 ? '+' : ''}{source.percentageChanges.closedLeads.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-2 whitespace-nowrap text-xs font-medium text-gray-700">Contact Rate</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{source.current.contactRate.toFixed(1)}%</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{source.previous.contactRate.toFixed(1)}%</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm">
                        <span className={`${source.changes.contactRate >= 0 ? 'text-brand' : 'text-brand-dark'}`}>
                          {source.changes.contactRate >= 0 ? '+' : ''}{source.changes.contactRate.toFixed(1)}pp
                        </span>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm">
                        <span className={`${source.percentageChanges.contactRate >= 0 ? 'text-brand' : 'text-brand-dark'}`}>
                          {source.percentageChanges.contactRate >= 0 ? '+' : ''}{source.percentageChanges.contactRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-2 whitespace-nowrap text-xs font-medium text-gray-700 border-b">Close Rate</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 border-b">{source.current.closeRate.toFixed(1)}%</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 border-b">{source.previous.closeRate.toFixed(1)}%</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm border-b">
                        <span className={`${source.changes.closeRate >= 0 ? 'text-brand' : 'text-brand-dark'}`}>
                          {source.changes.closeRate >= 0 ? '+' : ''}{source.changes.closeRate.toFixed(1)}pp
                        </span>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm border-b">
                        <span className={`${source.percentageChanges.closeRate >= 0 ? 'text-brand' : 'text-brand-dark'}`}>
                          {source.percentageChanges.closeRate >= 0 ? '+' : ''}{source.percentageChanges.closeRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderLeadSourceRealtimeVisualization = () => {
    const { today, trends, lastUpdated } = reportData;
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Real-time Lead Metrics
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <Users className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">New Leads Today</p>
                <p className="text-2xl font-semibold text-gray-900">{today.newLeads.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <PhoneCall className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Contacted Leads</p>
                <p className="text-2xl font-semibold text-gray-900">{today.contactedLeads.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <CheckCircle className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Closed Leads</p>
                <p className="text-2xl font-semibold text-gray-900">{today.closedLeads.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <TrendingUp className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Contact Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{Number(today.contactRate || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-brand bg-opacity-10">
                <Activity className="h-6 w-6 text-brand" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Close Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{Number(today.closeRate || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Indicators */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Trend Indicators</h4>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-brand">{trends.newLeads}</div>
                <div className="text-sm text-gray-600 mt-1">New Leads Trend</div>
                <div className="mt-2">
                  {trends.newLeads > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand bg-opacity-10 text-brand">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Increasing
                    </span>
                  ) : trends.newLeads < 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-dark bg-opacity-10 text-brand-dark">
                      <TrendingUp className="w-3 h-3 mr-1 transform rotate-180" />
                      Decreasing
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Stable
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-brand">{trends.contactedLeads}</div>
                <div className="text-sm text-gray-600 mt-1">Contacted Leads Trend</div>
                <div className="mt-2">
                  {trends.contactedLeads > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand bg-opacity-10 text-brand">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Increasing
                    </span>
                  ) : trends.contactedLeads < 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-dark bg-opacity-10 text-brand-dark">
                      <TrendingUp className="w-3 h-3 mr-1 transform rotate-180" />
                      Decreasing
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Stable
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-brand">{trends.closedLeads}</div>
                <div className="text-sm text-gray-600 mt-1">Closed Leads Trend</div>
                <div className="mt-2">
                  {trends.closedLeads > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand bg-opacity-10 text-brand">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Increasing
                    </span>
                  ) : trends.closedLeads < 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-dark bg-opacity-10 text-brand-dark">
                      <TrendingUp className="w-3 h-3 mr-1 transform rotate-180" />
                      Decreasing
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Stable
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (showReportBuilder) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-gray-100/90 to-blue-100/80 backdrop-blur-xl animate-fade-in">
        <div className="flex items-center justify-between px-8 py-6 bg-white/80 shadow-lg rounded-b-2xl border-b border-blue-200">
          <h1 className="text-2xl font-bold text-blue-900 drop-shadow-sm tracking-tight">Custom Report Builder</h1>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all"
            onClick={() => setShowReportBuilder(false)}
          >
            Exit Builder
          </button>
        </div>
        <div className="flex-1 flex min-h-0">
          <CustomReportBuilder
            isOpen={true}
            onClose={() => setShowReportBuilder(false)}
            report={selectedReport}
            onSave={() => {
              setShowReportBuilder(false);
              // Optionally refresh custom reports list here
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Reports</h1>
          
          {reportData && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Download className="w-4 h-4 mr-2 text-brand" />
                  Export
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportReport('csv')}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportReport('excel')}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Excel</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportReport('pdf')}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {renderReportTypeSelector()}
        
        {reportType !== 'templates' && reportType !== 'lead-source-realtime' && reportType !== 'critical-reports' && reportType !== 'custom-reports' && reportType !== 'financial-tracker' && (
          renderDateRangeSelector()
        )}
        
        {renderFilters()}
        
        {/* New Reporting System */}
        {reportType === 'critical-reports' && (
          <CriticalReports />
        )}
        
        {reportType === 'custom-reports' && (
          <CustomReportsManager onRefresh={() => {
            // Refresh any necessary data
          }} />
        )}
        
        {reportType === 'financial-tracker' && (
          <FinancialTracker onTransactionAdded={() => {
            // Refresh financial data if needed
          }} />
        )}
        
        {/* Legacy Report Results or Empty State */}
        {(reportType === 'call-summary' || reportType === 'agent-performance' || reportType === 'journey-analytics' || reportType === 'lead-source-performance' || reportType === 'lead-source-comparison' || reportType === 'lead-source-realtime') && (
          <>
            {reportData ? (
              renderReportData()
            ) : isLoading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <RefreshCw className="w-12 h-12 text-brand mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Report...</h3>
                <p className="text-gray-600">
                  Please wait while we process your data and generate the report.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <BarChart className="w-12 h-12 text-brand mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated Yet</h3>
                <p className="text-gray-600 mb-4">
                  Select your date range, configure any filters you need, and click "Generate Report" to view your data.
                </p>
                <Button onClick={generateReport} className="bg-brand hover:bg-brand-dark text-white">
                  <BarChart className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            )}
          </>
        )}
        
        {reportType === 'templates' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Report Templates</h2>
              <Button 
                onClick={() => setShowTemplateModal(true)}
                className="bg-brand hover:bg-brand-dark text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
            
            {reportTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTemplates.map(template => (
                  <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 capitalize mt-1">{template.type.replace('_', ' ')}</p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs text-gray-500">
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowTemplateModal(true);
                          }}
                          className="text-brand hover:text-brand-dark"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first report template to save report configurations for future use.
                </p>
                <Button 
                  onClick={() => setShowTemplateModal(true)}
                  className="bg-brand hover:bg-brand-dark text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}