'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PhoneOutgoing, Users, Phone, Clock, Sliders, Upload, Route, MessageSquare, Send } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { PhoneCall, PhoneForwarded, PhoneOff } from 'lucide-react';
import { useToast } from '@/app/components/ui/use-toast';
import { getAgentStatus, getTodaysStats, generateCallSummaryReport, getDailyReport } from '@/app/utils/api';
import type { TenantApiConfig } from '@/app/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import SmsCampaignService, { SmsCampaign } from '@/app/lib/sms-campaigns';

type AgentStatus = {
  ingroup: string;
  agents_logged_in: number;
  agents_waiting: number;
  total_calls: number;
  calls_waiting: number;
  brand: string;
  source: string;
};

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

type TenantConfig = {
  dialerConfig: {
    speed: number;
    minAgentsAvailable: number;
    autoDelete: boolean;
    sortOrder: 'oldest' | 'fewest';
    didDistribution: 'even' | 'local';
  };
  apiConfig: TenantApiConfig;
};

// Add new types for the API responses
type DashboardMetrics = {
  leads: {
    total: number;
    new: number;
    contacted: number;
    converted: number;
  };
  calls: {
    total: number;
    today: number;
    answered: number;
    averageDuration: number;
  };
  performance: {
    conversionRate: number;
    contactRate: number;
    averageCallsPerLead: number;
  };
};

type LeadPerformanceMetrics = {
  summary: {
    totalLeads: number;
    averageAttempts: number;
    conversionRate: number;
    averageTimeToConversion: number;
  };
  byStatus: {
    pending: number;
    contacted: number;
    transferred: number;
    completed: number;
    failed: number;
  };
  bySource: Record<string, number>;
  byBrand: Record<string, number>;
  performanceByDay: Array<{
    date: string;
    newLeads: number;
    contacted: number;
    converted: number;
  }>;
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [agentStatus, setAgentStatus] = useState<AgentStatus[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [dialerSpeed, setDialerSpeed] = useState<number>(0);
  const [updatingSpeed, setUpdatingSpeed] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // New state for CSV upload
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [leadSource, setLeadSource] = useState('');
  const [hasHeaders, setHasHeaders] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import journey statistics
  const [stats, setStats] = useState({
    leads: { total: 0, new: 0, contacted: 0, converted: 0 },
    calls: { total: 0, connected: 0, failed: 0 },
    sms: { campaigns: 0, sent: 0, responses: 0 },
    journeys: { active: 0, totalLeads: 0, completed: 0 }
  });

  // Data for charts (to be populated with real data from API)
  const [callChartData, setCallChartData] = useState([]);
  const [leadChartData, setLeadChartData] = useState([]);
  const [agentChartData, setAgentChartData] = useState([]);

  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [leadPerformance, setLeadPerformance] = useState<LeadPerformanceMetrics | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // SMS campaign state
  const [smsCampaigns, setSmsCampaigns] = useState<SmsCampaign[]>([]);
  const [smsMetrics, setSmsMetrics] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalMessages: 0,
    totalContacts: 0
  });

  const fetchAgentStatus = async () => {
    console.log('Fetching agent status for group:', currentGroup);
    if (!currentGroup) {
      console.log('No group configured');
      return;
    }

    setIsRefreshing(true);
    try {
      console.log('Making API call with group:', currentGroup);
      const response = await api.system.getAgentStatus({
        url: tenantConfig?.apiConfig?.url || '',
        ingroup: currentGroup,
        user: tenantConfig?.apiConfig?.user || user?.username || '',
        pass: tenantConfig?.apiConfig?.password || ''
      });
      console.log('API response:', response.data);
      setAgentStatus(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching agent status:', error);
      toast.error('Failed to fetch agent status');
      setAgentStatus([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchDailyReport = async () => {
    try {
      const reportResponse = await Promise.race([
        api.system.getDailyReport(new Date().toISOString().split('T')[0]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      setDailyReport({
        date: reportResponse.data.date || '',
        totalCalls: reportResponse.data.totalCalls || 0,
        answeredCalls: reportResponse.data.answeredCalls || 0,
        transfers: reportResponse.data.transfers || 0,
        callsOver1Min: reportResponse.data.callsOver1Min || 0,
        callsOver5Min: reportResponse.data.callsOver5Min || 0,
        callsOver15Min: reportResponse.data.callsOver15Min || 0,
        connectionRate: reportResponse.data.connectionRate || '0',
        transferRate: reportResponse.data.transferRate || '0'
      });
    } catch (reportError) {
      console.error('Error fetching daily report:', reportError);
      toast.error('Failed to fetch daily report');
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      // Use working endpoint: /reports/daily
      const response = await getDailyReport(new Date().toISOString().split('T')[0]);
      
      setDashboardMetrics({
        leads: {
          total: response.totalLeads || 0,
          new: response.newLeads || 0,
          contacted: response.contactedLeads || 0,
          converted: response.convertedLeads || 0
        },
        calls: {
          total: response.totalCalls || 0,
          today: response.totalCalls || 0,
          answered: response.answeredCalls || 0,
          averageDuration: response.averageCallDuration || 0
        },
        performance: {
          conversionRate: parseFloat(response.connectionRate) || 0,
          contactRate: parseFloat(response.connectionRate) || 0,
          averageCallsPerLead: response.averageCallsPerLead || 0
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      setDashboardMetrics({
        leads: { total: 0, new: 0, contacted: 0, converted: 0 },
        calls: { total: 0, today: 0, answered: 0, averageDuration: 0 },
        performance: { conversionRate: 0, contactRate: 0, averageCallsPerLead: 0 }
      });
      toast.error('Failed to fetch dashboard metrics');
    }
  };

  const fetchLeadPerformance = async () => {
    if (!tenantConfig?.id) {
      console.log('Skipping lead performance fetch - no tenant ID');
      return;
    }

    try {
      const response = await generateCallSummaryReport({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy: 'day',
        filters: {}
      });

      const performanceByDay = response.data.map((item: any) => ({
        date: item.date,
        newLeads: item.newLeads || 0,
        contacted: item.contacted || 0,
        converted: item.converted || 0
      }));

      setLeadPerformance({
        summary: {
          totalLeads: response.totalLeads || 0,
          averageAttempts: response.averageAttempts || 0,
          conversionRate: response.conversionRate || 0,
          averageTimeToConversion: response.averageTimeToConversion || 0
        },
        byStatus: {
          pending: response.byStatus?.pending || 0,
          contacted: response.byStatus?.contacted || 0,
          transferred: response.byStatus?.transferred || 0,
          completed: response.byStatus?.completed || 0,
          failed: response.byStatus?.failed || 0
        },
        bySource: response.bySource || {},
        byBrand: response.byBrand || {},
        performanceByDay: performanceByDay
      });
    } catch (error) {
      console.error('Error fetching lead performance:', error);
      setLeadPerformance({
        summary: {
          totalLeads: 0,
          averageAttempts: 0,
          conversionRate: 0,
          averageTimeToConversion: 0
        },
        byStatus: {
          pending: 0,
          contacted: 0,
          transferred: 0,
          completed: 0,
          failed: 0
        },
        bySource: {},
        byBrand: {},
        performanceByDay: []
      });
      toast.error('Failed to fetch lead performance metrics');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (!tenantConfig?.id) {
          console.log('Waiting for tenant configuration...');
          return;
        }

        await Promise.all([
          fetchAgentStatus(),
          fetchDailyReport(),
          fetchDashboardMetrics(),
          fetchLeadPerformance(),
          fetchSmsCampaigns()
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tenantConfig?.id, dateRange]);

  const handleDateChange = (newDateRange: { startDate: string; endDate: string }) => {
    setDateRange(newDateRange);
  };

  const fetchSmsCampaigns = async () => {
    try {
      const campaigns = await SmsCampaignService.getCampaigns();
      setSmsCampaigns(campaigns);
      
      // Calculate metrics
      const metrics = {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalMessages: campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0),
        totalContacts: campaigns.reduce((sum, c) => sum + (c.totalContacts || 0), 0)
      };
      setSmsMetrics(metrics);
    } catch (error) {
      console.error('Error fetching SMS campaigns for dashboard:', error);
      // Don't show toast error for dashboard as it's not critical
    }
  };

  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={handleDateChange}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics?.leads.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{dashboardMetrics?.leads.new || 0} new today
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics?.calls.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardMetrics?.calls.today || 0} calls today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <Sliders className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics?.performance.conversionRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardMetrics?.performance.contactRate || 0}% contact rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Call Duration</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.floor((dashboardMetrics?.calls.averageDuration || 0) / 60)}m {Math.floor((dashboardMetrics?.calls.averageDuration || 0) % 60)}s
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardMetrics?.performance.averageCallsPerLead || 0} calls per lead
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">SMS Campaigns</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{smsMetrics.totalCampaigns}</div>
                  <p className="text-xs text-muted-foreground">
                    {smsMetrics.activeCampaigns} active campaigns
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* SMS Campaign Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{smsMetrics.totalMessages}</div>
                  <p className="text-xs text-muted-foreground">
                    Total SMS messages sent
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{smsMetrics.totalContacts}</div>
                  <p className="text-xs text-muted-foreground">
                    Contacts in all campaigns
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Campaigns</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {smsCampaigns.slice(0, 3).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {campaign.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {campaign.status} • {campaign.sentCount || 0}/{campaign.totalContacts || 0} sent
                          </p>
                        </div>
                        <Link 
                          href="/sms/campaigns" 
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                    {smsCampaigns.length === 0 && (
                      <div className="text-sm text-gray-500">
                        No campaigns yet
                      </div>
                    )}
                    {smsCampaigns.length > 0 && (
                      <Link 
                        href="/sms/campaigns" 
                        className="text-sm text-blue-600 hover:text-blue-800 block mt-2"
                      >
                        View all campaigns →
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Lead Performance Chart */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Lead Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={leadPerformance?.performanceByDay || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="newLeads" stroke="#8884d8" name="New Leads" />
                        <Line type="monotone" dataKey="contacted" stroke="#82ca9d" name="Contacted" />
                        <Line type="monotone" dataKey="converted" stroke="#ffc658" name="Converted" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Status Distribution */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Lead Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Pending', value: leadPerformance?.byStatus.pending || 0 },
                        { name: 'Contacted', value: leadPerformance?.byStatus.contacted || 0 },
                        { name: 'Transferred', value: leadPerformance?.byStatus.transferred || 0 },
                        { name: 'Completed', value: leadPerformance?.byStatus.completed || 0 },
                        { name: 'Failed', value: leadPerformance?.byStatus.failed || 0 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Leads" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Source Distribution */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(leadPerformance?.bySource || {}).map(([name, value]) => ({
                        name,
                        value
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#82ca9d" name="Leads" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Brand Distribution */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Brand Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(leadPerformance?.byBrand || {}).map(([name, value]) => ({
                        name,
                        value
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#ffc658" name="Leads" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Lead Metrics</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm">Total Leads:</div>
                      <div className="text-sm font-medium">{leadPerformance?.summary.totalLeads || 0}</div>
                      <div className="text-sm">Avg. Attempts:</div>
                      <div className="text-sm font-medium">{leadPerformance?.summary.averageAttempts || 0}</div>
                      <div className="text-sm">Conversion Rate:</div>
                      <div className="text-sm font-medium">{leadPerformance?.summary.conversionRate || 0}%</div>
                      <div className="text-sm">Avg. Time to Convert:</div>
                      <div className="text-sm font-medium">{leadPerformance?.summary.averageTimeToConversion || 0} days</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 