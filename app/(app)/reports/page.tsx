'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { BarChart, Calendar, PhoneCall, Phone, PhoneForwarded, Clock, Route, Users, CheckCircle, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { getDailyReport, getJourneyStatistics, getJourneyStatsByBrand, getJourneyStatsBySource } from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';

type DailyReport = {
  date: string;
  totalCalls: number;
  answeredCalls: number;
  transfers: number;
  callsOver1Min: number;
  callsOver5Min: number;
  callsOver15Min: number;
  connectionRate: string;
  transferRate: string;
};

type ReportType = 'daily' | 'journey' | 'brand' | 'source';

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [report, setReport] = useState<DailyReport | null>(null);
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [journeyStats, setJourneyStats] = useState<any>(null);
  const [brandStats, setBrandStats] = useState<any>(null);
  const [sourceStats, setSourceStats] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchReport(selectedDate);
  }, [isAuthenticated, router, selectedDate]);

  const fetchReport = async (date: string) => {
    setIsLoading(true);
    try {
      switch (reportType) {
        case 'daily':
          const dailyData = await getDailyReport(date);
          setReport(dailyData);
          break;
        case 'journey':
          const journeyData = await getJourneyStatistics();
          setJourneyStats(journeyData);
          break;
        case 'brand':
          const brandData = await getJourneyStatsByBrand();
          setBrandStats(brandData);
          break;
        case 'source':
          const sourceData = await getJourneyStatsBySource();
          setSourceStats(sourceData);
          break;
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculatePercentage = (part: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((part / total) * 100)}%`;
  };

  const renderReportTypeSelector = () => (
    <div className="flex space-x-4 mb-6">
      <Button
        variant={reportType === 'daily' ? 'primary' : 'outline'}
        onClick={() => setReportType('daily')}
      >
        Daily Report
      </Button>
      <Button
        variant={reportType === 'journey' ? 'primary' : 'outline'}
        onClick={() => setReportType('journey')}
      >
        Journey Stats
      </Button>
      <Button
        variant={reportType === 'brand' ? 'primary' : 'outline'}
        onClick={() => setReportType('brand')}
      >
        Brand Analysis
      </Button>
      <Button
        variant={reportType === 'source' ? 'primary' : 'outline'}
        onClick={() => setReportType('source')}
      >
        Source Analysis
      </Button>
    </div>
  );

  const renderJourneyStats = () => (
    <div className="mt-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Journey Statistics
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Overview of journey performance and engagement.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-brand rounded-md p-3">
                    <Route className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Journeys</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{journeyStats?.activeJourneys || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-brand rounded-md p-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Lead Journeys</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{journeyStats?.activeLeadJourneys || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-brand rounded-md p-3">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed Journeys</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{journeyStats?.completedLeadJourneys || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-brand rounded-md p-3">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Executions</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{journeyStats?.pendingExecutions || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrandStats = () => (
    <div className="mt-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Brand Performance Analysis
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Journey performance breakdown by brand.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {brandStats?.brandBreakdown?.map((brand: any) => (
              <div key={brand.name} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900">{brand.name}</h4>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Active Journeys</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">{brand.activeJourneys}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Leads</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">{brand.totalLeads}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Completion Rate</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">{brand.completionRate}%</dd>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSourceStats = () => (
    <div className="mt-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Source Performance Analysis
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Journey performance breakdown by lead source.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {sourceStats?.sourceBreakdown?.map((source: any) => (
              <div key={source.name} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900">{source.name}</h4>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Active Journeys</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">{source.activeJourneys}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Leads</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">{source.totalLeads}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Completion Rate</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">{source.completionRate}%</dd>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const handleRefresh = () => {
    fetchReport(selectedDate);
  };

  const renderEmptyState = (type: string) => (
    <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-12 text-center sm:px-6">
        <BarChart className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No {type} data available</h3>
        <p className="mt-1 text-sm text-gray-500">
          {type === 'daily' 
            ? 'Try selecting a different date or check if there were any calls on this day.'
            : 'No data has been collected yet. Check back later.'}
        </p>
        <div className="mt-6">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="inline-flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <div className="flex items-center space-x-2">
            {reportType === 'daily' && (
              <>
                <input
                  type="date"
                  className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                <Button
                  onClick={() => fetchReport(selectedDate)}
                  variant="primary"
                  isLoading={isLoading}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Report
                </Button>
              </>
            )}
            <Button
              onClick={handleRefresh}
              variant="outline"
              isLoading={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {renderReportTypeSelector()}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : (
          <>
            {reportType === 'daily' && (
              report ? (
                <div className="mt-6">
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Daily Call Report - {formatDate(report.date)}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Detailed metrics for call performance and agent activity.
                      </p>
                    </div>
                    
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                          <div className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-brand rounded-md p-3">
                                <PhoneCall className="h-6 w-6 text-white" />
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-gray-500 truncate">Total Calls</dt>
                                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{report.totalCalls}</dd>
                                </dl>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-100 px-5 py-3">
                            <div className="text-sm">
                              <div className="font-medium text-brand">
                                Answered: {report.answeredCalls} ({calculatePercentage(report.answeredCalls, report.totalCalls)})
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                          <div className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-brand rounded-md p-3">
                                <Phone className="h-6 w-6 text-white" />
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-gray-500 truncate">Connection Rate</dt>
                                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{report.connectionRate}</dd>
                                </dl>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-100 px-5 py-3">
                            <div className="text-sm">
                              <div className="font-medium text-brand">
                                Answered: {report.answeredCalls} of {report.totalCalls}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                          <div className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-brand rounded-md p-3">
                                <PhoneForwarded className="h-6 w-6 text-white" />
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-gray-500 truncate">Transfers</dt>
                                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{report.transfers}</dd>
                                </dl>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-100 px-5 py-3">
                            <div className="text-sm">
                              <div className="font-medium text-brand">
                                Transfer Rate: {report.transferRate}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                          <div className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 bg-brand rounded-md p-3">
                                <Clock className="h-6 w-6 text-white" />
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-gray-500 truncate">Call Duration</dt>
                                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{report.callsOver5Min}</dd>
                                  <dd className="mt-1 text-sm text-gray-500">calls over 5 minutes</dd>
                                </dl>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-100 px-5 py-3">
                            <div className="text-sm">
                              <div className="font-medium text-brand">
                                Long Calls: {report.callsOver15Min} (over 15 min)
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Call Duration Breakdown</h3>
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-brand bg-opacity-10 text-brand text-shadow-light">
                              Under 1 Minute
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-brand text-shadow-light">
                              {calculatePercentage(report.answeredCalls - report.callsOver1Min, report.answeredCalls)}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-brand bg-opacity-10">
                          <div style={{ width: calculatePercentage(report.answeredCalls - report.callsOver1Min, report.answeredCalls) }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand"></div>
                        </div>
                      </div>
                      
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-brand bg-opacity-10 text-brand text-shadow-light">
                              1-5 Minutes
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-brand text-shadow-light">
                              {calculatePercentage(report.callsOver1Min - report.callsOver5Min, report.answeredCalls)}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-brand bg-opacity-10">
                          <div style={{ width: calculatePercentage(report.callsOver1Min - report.callsOver5Min, report.answeredCalls) }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand"></div>
                        </div>
                      </div>
                      
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-brand bg-opacity-10 text-brand text-shadow-light">
                              5-15 Minutes
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-brand text-shadow-light">
                              {calculatePercentage(report.callsOver5Min - report.callsOver15Min, report.answeredCalls)}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-brand bg-opacity-10">
                          <div style={{ width: calculatePercentage(report.callsOver5Min - report.callsOver15Min, report.answeredCalls) }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand"></div>
                        </div>
                      </div>
                      
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-brand bg-opacity-10 text-brand text-shadow-light">
                              Over 15 Minutes
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-brand text-shadow-light">
                              {calculatePercentage(report.callsOver15Min, report.answeredCalls)}
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-brand bg-opacity-10">
                          <div style={{ width: calculatePercentage(report.callsOver15Min, report.answeredCalls) }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Call Quality Summary</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Overview of daily call performance metrics.
                      </p>

                      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="bg-white overflow-hidden shadow sm:rounded-lg">
                          <div className="px-4 py-5 sm:p-6">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Connection Performance</dt>
                              <dd className="mt-1">
                                <div className="flex justify-between items-baseline">
                                  <div className="text-2xl font-semibold text-gray-900">{report.connectionRate}</div>
                                  <div className="bg-brand bg-opacity-10 text-brand inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium md:mt-2 lg:mt-0 text-shadow-light">
                                    Answered: {report.answeredCalls} of {report.totalCalls} calls connected
                                  </div>
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                        
                        <div className="bg-white overflow-hidden shadow sm:rounded-lg">
                          <div className="px-4 py-5 sm:p-6">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Transfer Rate</dt>
                              <dd className="mt-1">
                                <div className="flex justify-between items-baseline">
                                  <div className="text-2xl font-semibold text-gray-900">{report.transferRate}</div>
                                  <div className="bg-brand bg-opacity-10 text-brand inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium md:mt-2 lg:mt-0 text-shadow-light">
                                    Transfers: {report.transfers}
                                  </div>
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                renderEmptyState('daily')
              )
            )}
            {reportType === 'journey' && (
              journeyStats?.activeJourneys > 0 ? (
                renderJourneyStats()
              ) : (
                renderEmptyState('journey')
              )
            )}
            {reportType === 'brand' && (
              brandStats?.brandBreakdown?.length > 0 ? (
                renderBrandStats()
              ) : (
                renderEmptyState('brand')
              )
            )}
            {reportType === 'source' && (
              sourceStats?.sourceBreakdown?.length > 0 ? (
                renderSourceStats()
              ) : (
                renderEmptyState('source')
              )
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 