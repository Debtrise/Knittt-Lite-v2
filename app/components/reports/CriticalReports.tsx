'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, DollarSign, BarChart3, PieChart, 
  Calendar, Download, Play, Eye, Settings, Filter
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { 
  generateExecutiveDashboardReport,
  generateLeadPerformanceReport,
  generateFinancialPerformanceReport,
  getCriticalReportsList,
  exportReportData
} from '@/app/utils/api';
import toast from 'react-hot-toast';

interface CriticalReport {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedTime: string;
  metrics: string[];
}

interface ReportResult {
  summary?: any;
  kpis?: any;
  funnel?: any[];
  sourceAnalysis?: any[];
  breakdown?: any[];
  dailyTrends?: any[];
}

export default function CriticalReports() {
  const [criticalReports, setCriticalReports] = useState<CriticalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchCriticalReports();
  }, []);

  const fetchCriticalReports = async () => {
    try {
      const reports = await getCriticalReportsList();
      setCriticalReports(reports);
    } catch (error) {
      console.error('Error fetching critical reports:', error);
      toast.error('Failed to load critical reports');
    }
  };

  const executeReport = async () => {
    if (!selectedReport) {
      toast.error('Please select a report');
      return;
    }

    setIsExecuting(true);
    try {
      let result;
      
      switch (selectedReport) {
        case 'executive-dashboard':
          result = await generateExecutiveDashboardReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            revenueTarget: filters.revenueTarget,
            csat: filters.csat
          });
          break;
          
        case 'lead-performance':
          result = await generateLeadPerformanceReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            sources: filters.sources,
            tags: filters.tags,
            groupBy: filters.groupBy
          });
          break;
          
        case 'financial-performance':
          result = await generateFinancialPerformanceReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            groupBy: filters.groupBy
          });
          break;
          
        default:
          toast.error('Unknown report type');
          return;
      }
      
      setReportResult(result);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error executing report:', error);
      toast.error('Failed to execute report');
    } finally {
      setIsExecuting(false);
    }
  };

  const exportReport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!reportResult) {
      toast.error('No report data to export');
      return;
    }

    try {
      const filename = `${selectedReport}_${dateRange.startDate}_${dateRange.endDate}`;
      await exportReportData({
        reportData: reportResult,
        format,
        filename
      });
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const renderReportSelector = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Critical Reports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {criticalReports.map((report) => (
          <div
            key={report.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              selectedReport === report.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedReport(report.id)}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                {report.category === 'executive' && <TrendingUp className="w-5 h-5 text-blue-600" />}
                {report.category === 'sales' && <DollarSign className="w-5 h-5 text-green-600" />}
                {report.category === 'operations' && <Users className="w-5 h-5 text-purple-600" />}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{report.name}</h4>
                <p className="text-sm text-gray-500">{report.estimatedTime}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{report.description}</p>
            <div className="flex flex-wrap gap-1">
              {report.metrics.slice(0, 3).map((metric, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                >
                  {metric}
                </span>
              ))}
              {report.metrics.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                  +{report.metrics.length - 3} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Parameters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
        
        {selectedReport === 'executive-dashboard' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revenue Target
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="100000"
                value={filters.revenueTarget || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, revenueTarget: parseFloat(e.target.value) || undefined }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Satisfaction
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="4.5"
                value={filters.csat || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, csat: parseFloat(e.target.value) || undefined }))}
              />
            </div>
          </>
        )}
        
        {selectedReport === 'lead-performance' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group By
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.groupBy || 'source'}
                onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value }))}
              >
                <option value="source">Source</option>
                <option value="campaign">Campaign</option>
                <option value="channel">Channel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sources (comma-separated)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Google Ads, Facebook"
                value={filters.sources?.join(', ') || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  sources: e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined 
                }))}
              />
            </div>
          </>
        )}
        
        {selectedReport === 'financial-performance' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group By
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.groupBy || 'source'}
              onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value }))}
            >
              <option value="source">Source</option>
              <option value="channel">Channel</option>
              <option value="campaign">Campaign</option>
            </select>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex space-x-2">
        <Button
          onClick={executeReport}
          disabled={isExecuting || !selectedReport}
          className="flex items-center space-x-2"
        >
          <Play className="w-4 h-4" />
          {isExecuting ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>
    </div>
  );

  const renderExecutiveDashboard = () => {
    if (!reportResult) return null;
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${reportResult.summary?.totalRevenue?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-green-600">
                  {reportResult.summary?.revenueTrend || 0}%
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportResult.summary?.totalLeads?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-green-600">
                  {reportResult.summary?.leadsTrend || 0}%
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportResult.summary?.conversionRate || 0}%
                </p>
                <p className="text-sm text-gray-600">
                  Avg: ${reportResult.summary?.avgLeadValue || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportResult.summary?.totalCalls?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600">
                  Avg: {reportResult.summary?.avgCallDuration || 0}s
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* KPIs */}
        {reportResult.kpis && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reportResult.kpis.revenue && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Revenue</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current:</span>
                      <span className="text-sm font-medium">${reportResult.kpis.revenue.current?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Target:</span>
                      <span className="text-sm font-medium">${reportResult.kpis.revenue.target?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Achievement:</span>
                      <span className="text-sm font-medium">{reportResult.kpis.revenue.achievement}%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {reportResult.kpis.leads && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Leads</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="text-sm font-medium">{reportResult.kpis.leads.current}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Qualified:</span>
                      <span className="text-sm font-medium">{reportResult.kpis.leads.qualified}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Converted:</span>
                      <span className="text-sm font-medium">{reportResult.kpis.leads.converted}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {reportResult.kpis.operations && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Operations</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Calls Handled:</span>
                      <span className="text-sm font-medium">{reportResult.kpis.operations.callsHandled}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Response:</span>
                      <span className="text-sm font-medium">{reportResult.kpis.operations.avgResponseTime}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">First Call Resolution:</span>
                      <span className="text-sm font-medium">{reportResult.kpis.operations.firstCallResolution}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Revenue by Source */}
        {reportResult.revenueBySource && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Source</h4>
            <div className="space-y-3">
              {Object.entries(reportResult.revenueBySource).map(([source, revenue]) => (
                <div key={source} className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{source}</span>
                  <span className="text-lg font-bold text-green-600">
                    ${(revenue as number).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLeadPerformance = () => {
    if (!reportResult) return null;
    
    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600">Total Leads</p>
            <p className="text-2xl font-bold text-gray-900">
              {reportResult.summary?.totalLeads?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600">Qualified Leads</p>
            <p className="text-2xl font-bold text-gray-900">
              {reportResult.summary?.qualifiedLeads?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600">Converted Leads</p>
            <p className="text-2xl font-bold text-gray-900">
              {reportResult.summary?.convertedLeads?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {reportResult.summary?.conversionRate || 0}%
            </p>
          </div>
        </div>

        {/* Funnel */}
        {reportResult.funnel && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Lead Funnel</h4>
            <div className="space-y-3">
              {reportResult.funnel.map((stage, index) => (
                <div key={stage.stage} className="flex items-center space-x-4">
                  <div className="w-24 text-sm font-medium text-gray-900 capitalize">
                    {stage.stage}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-right">
                    <div className="text-sm font-bold text-gray-900">{stage.count}</div>
                    <div className="text-xs text-gray-500">{stage.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Analysis */}
        {reportResult.sourceAnalysis && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Source Analysis</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Leads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qualified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Converted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ROI
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportResult.sourceAnalysis.map((source) => (
                    <tr key={source.source}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {source.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {source.totalLeads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {source.qualifiedLeads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {source.convertedLeads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {source.conversionRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {source.roi}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFinancialPerformance = () => {
    if (!reportResult) return null;
    
    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              ${reportResult.summary?.totalRevenue?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600">Total Cost</p>
            <p className="text-2xl font-bold text-gray-900">
              ${reportResult.summary?.totalCost?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600">Total Profit</p>
            <p className="text-2xl font-bold text-green-600">
              ${reportResult.summary?.totalProfit?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600">Overall ROI</p>
            <p className="text-2xl font-bold text-gray-900">
              {reportResult.summary?.overallROI || 0}%
            </p>
          </div>
        </div>

        {/* Breakdown */}
        {reportResult.breakdown && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ROI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportResult.breakdown.map((item) => (
                    <tr key={item.source}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.revenue?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.cost?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        ${item.profit?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.roi}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.conversionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReportResult = () => {
    if (!reportResult) return null;

    return (
      <div className="space-y-6">
        {/* Export Options */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Report Results</h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('excel')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('pdf')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {selectedReport === 'executive-dashboard' && renderExecutiveDashboard()}
        {selectedReport === 'lead-performance' && renderLeadPerformance()}
        {selectedReport === 'financial-performance' && renderFinancialPerformance()}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderReportSelector()}
      {selectedReport && renderFilters()}
      {renderReportResult()}
    </div>
  );
} 