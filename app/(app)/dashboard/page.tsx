'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PhoneOutgoing, Users, Phone, Clock, Sliders, Route, MessageSquare, PhoneForwarded } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { useAuthStore } from '@/app/store/authStore';
import { getLiveDashboardStats, getTenant, generateLeadSourcePerformanceReport } from '@/app/utils/api';
import type { TenantApiConfig } from '@/app/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TenantConfig = {
  id: number;
  dialerConfig: {
    speed: number;
    minAgentsAvailable: number;
    autoDelete: boolean;
    sortOrder: 'oldest' | 'fewest';
    didDistribution: 'even' | 'local';
  };
  apiConfig: TenantApiConfig;
};

type LiveStats = {
  realtime: {
    activeCalls: number;
    waitingCalls: number;
    availableAgents: number;
    busyAgents: number;
  };
  today: {
    calls: number;
    sms: number;
    leads: number;
    transfers: number;
    conversions: number;
    activeJourneys: number;
  };
  metrics: {
    avgCallDuration: number;
    avgResponseTime: number;
    transferRate: string;
    conversionRate: string;
  };
  trends: {
    calls: string;
    sms: string;
    leads: string;
    conversions: string;
  };
  lastUpdated: string;
};

type LeadSourcePerformance = {
  source: string;
  newLeads: number;
  contactedLeads: number;
  closedLeads: number;
  contactRate: number;
  closeRate: number;
  contactToCloseRate: number;
  avgDaysToClose: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [leadSourceData, setLeadSourceData] = useState<LeadSourcePerformance[]>([]);
  const [isLoadingLeadSource, setIsLoadingLeadSource] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.tenantId) {
      return;
    }

    const fetchTenantConfig = async () => {
      try {
        const tenantId = parseInt(user.tenantId, 10);
        const data = await getTenant(tenantId);
        setTenantConfig(data);
      } catch (error) {
        console.error('Error fetching tenant configuration:', error);
        toast.error('Failed to load tenant configuration');
      }
    };

    fetchTenantConfig();
  }, [isAuthenticated, user?.tenantId]);

  const fetchLiveStats = async () => {
    try {
      setIsRefreshing(true);
      const response = await getLiveDashboardStats();
      setLiveStats(response);
    } catch (error) {
      console.error('Error fetching live stats:', error);
      toast.error('Failed to fetch live stats');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchLeadSourceData = async () => {
    try {
      setIsLoadingLeadSource(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await generateLeadSourcePerformanceReport({
        startDate: today,
        endDate: today,
        groupBy: 'day'
      });
      setLeadSourceData(response.sourcePerformance || []);
    } catch (error) {
      console.error('Error fetching lead source data:', error);
      toast.error('Failed to fetch lead source performance data');
    } finally {
      setIsLoadingLeadSource(false);
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
          fetchLiveStats(),
          fetchLeadSourceData()
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLiveStats();
      fetchLeadSourceData();
    }, 30000);
    return () => clearInterval(interval);
  }, [tenantConfig?.id]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Live Dashboard</h1>
            {tenantConfig?.apiConfig?.ingroup && (
              <p className="text-sm text-gray-500 mt-1">
                Ingroup: {tenantConfig.apiConfig.ingroup}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Last updated: {liveStats?.lastUpdated ? new Date(liveStats.lastUpdated).toLocaleTimeString() : 'Never'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLiveStats}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Real-time Stats */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
                <Phone className="h-4 w-4 text-brand" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{liveStats?.realtime.activeCalls || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {liveStats?.realtime.waitingCalls || 0} waiting
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Agents</CardTitle>
                <Users className="h-4 w-4 text-brand" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{liveStats?.realtime.availableAgents || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {liveStats?.realtime.busyAgents || 0} busy
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Calls</CardTitle>
                <PhoneOutgoing className="h-4 w-4 text-brand" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{liveStats?.today.calls || 0}</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's SMS</CardTitle>
                <MessageSquare className="h-4 w-4 text-brand" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{liveStats?.today.sms || 0}</div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Call Duration</CardTitle>
                <Clock className="h-4 w-4 text-brand" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.floor((liveStats?.metrics.avgCallDuration || 0) / 60)}m {Math.floor((liveStats?.metrics.avgCallDuration || 0) % 60)}s
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Avg. Response: {liveStats?.metrics.avgResponseTime || 0}s
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transfer Rate</CardTitle>
                <PhoneForwarded className="h-4 w-4 text-brand" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{liveStats?.metrics.transferRate || '0'}%</div>
                <p className="text-xs text-gray-500 mt-1">
                  {liveStats?.today.transfers || 0} transfers today
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Sliders className="h-4 w-4 text-brand" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{liveStats?.metrics.conversionRate || '0'}%</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fresh Leads</CardTitle>
                <Users className="h-4 w-4 text-brand" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{liveStats?.today.leads || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lead Source Performance Chart */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Source Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLeadSource ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
              </div>
            ) : leadSourceData.length === 0 ? (
              <div className="flex justify-center items-center h-64 text-gray-500">
                No lead source data available
              </div>
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={leadSourceData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newLeads" name="New Leads" fill="#579dca" />
                    <Bar dataKey="contactedLeads" name="Contacted" fill="#8cbddf" />
                    <Bar dataKey="closedLeads" name="Closed" fill="#3a7ca5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 