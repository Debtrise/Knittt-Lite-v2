'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Search, 
  BarChart3, 
  Activity, 
  DollarSign, 
  Clock, 
  Users,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { useAuthStore } from '@/app/store/authStore';
import { useToast } from '@/app/components/ui/use-toast';
import api from '@/app/lib/api';
import {
  TracersServiceStatus,
  UsageStatsResponse,
  SearchHistoryResponse,
  TracersSearchHistory
} from '@/app/types/tracers';

export default function TracersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  
  const [serviceStatus, setServiceStatus] = useState<TracersServiceStatus | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStatsResponse | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, router]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadServiceStatus(),
        loadUsageStats(),
        loadSearchHistory()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadServiceStatus = async () => {
    try {
      const response = await api.tracers.getServiceStatus();
      setServiceStatus(response.data);
      setServiceUnavailable(false);
    } catch (error: any) {
      console.error('Failed to load service status:', error);
      setServiceUnavailable(true);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        // Service not found - show a helpful message
        toast({
          title: "TracersAPI Not Available",
          description: "TracersAPI endpoints are not configured on this server.",
          variant: "destructive",
        });
      } else if (error.response?.data?.error?.includes('ENOTFOUND') || 
                 error.response?.data?.error?.includes('getaddrinfo')) {
        toast({
          title: "TracersAPI Connection Failed",
          description: "Unable to connect to TracersAPI service. The service may be down or misconfigured.",
          variant: "destructive",
        });
      } else if (error.response?.status !== 404) {
        toast({
          title: "Failed to load service status",
          description: error.response?.data?.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await api.tracers.getUsageStats({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
      setUsageStats(response.data);
    } catch (error: any) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const response = await api.tracers.getSearchHistory({ limit: 10 });
      setSearchHistory(response.data);
    } catch (error: any) {
      console.error('Failed to load search history:', error);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
    toast({
      title: "Data refreshed",
      description: "TracersAPI dashboard data has been updated",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'no_results':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">TracersAPI Dashboard</h1>
            <p className="text-gray-600">Monitor lead enrichment usage and performance</p>
          </div>
          <Button onClick={refreshData} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading dashboard...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Service Unavailable Warning */}
            {serviceUnavailable && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    TracersAPI Service Unavailable
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-red-700">
                      The TracersAPI service is currently unavailable. This could be due to:
                    </p>
                    <ul className="list-disc list-inside text-red-700 space-y-1 ml-4">
                      <li>Network connectivity issues</li>
                      <li>TracersAPI service configuration problems</li>
                      <li>The TracersAPI service being down for maintenance</li>
                      <li>Incorrect service URL configuration (currently trying: api.tracersinfo.com)</li>
                    </ul>
                    <div className="flex items-center gap-2 mt-4">
                      <Button 
                        onClick={refreshData} 
                        disabled={isRefreshing}
                        variant="outline"
                        className="text-red-700 border-red-300 hover:bg-red-100"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Retry Connection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Status Card */}
            {serviceStatus && !serviceUnavailable && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Service Status
                    {serviceStatus.enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Status</div>
                      <Badge className={serviceStatus.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {serviceStatus.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Today's Usage</div>
                      <div className="text-lg font-semibold">
                        {serviceStatus.usage.today} / {serviceStatus.limits.daily}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Remaining Today</div>
                      <div className="text-lg font-semibold text-green-600">
                        {serviceStatus.usage.todayRemaining}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Cost per Search</div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(serviceStatus.costPerSearch)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Usage Statistics */}
            {usageStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Usage Statistics (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Total Searches</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {usageStats.totals.searchCount}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Successful</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {usageStats.totals.successfulSearches}
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-900">No Results</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-900">
                        {usageStats.totals.noResultSearches}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Total Cost</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">
                        {formatCurrency(usageStats.totals.totalCost)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Search Types</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Phone Searches</span>
                          <span className="font-medium">
                            {usageStats.usage.reduce((sum, day) => sum + day.searchTypes.phone, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Comprehensive Searches</span>
                          <span className="font-medium">
                            {usageStats.usage.reduce((sum, day) => sum + day.searchTypes.comprehensive, 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Cache Hit Rate</span>
                          <span className="font-medium">
                            {usageStats.totals.searchCount > 0 
                              ? Math.round((usageStats.totals.cacheHits / usageStats.totals.searchCount) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <span className="font-medium">
                            {usageStats.totals.searchCount > 0 
                              ? Math.round((usageStats.totals.successfulSearches / usageStats.totals.searchCount) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search History */}
            {searchHistory && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Search History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {searchHistory.searches.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No search history found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {searchHistory.searches.map((search) => (
                        <div key={search.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(search.status)}>
                                {search.status}
                              </Badge>
                              <Badge variant="outline">
                                {search.searchType}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {formatDate(search.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{search.resultCount} results</span>
                              <span>{formatCurrency(search.cost)}</span>
                              <span>{search.apiCallDuration}ms</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            {search.searchPhone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{search.searchPhone}</span>
                              </div>
                            )}
                            {search.lead && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>Lead #{search.lead.id}: {search.lead.name}</span>
                              </div>
                            )}
                            {search.cacheHit && (
                              <Badge variant="outline" className="text-xs">
                                Cache Hit
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {searchHistory.totalCount > searchHistory.searches.length && (
                        <div className="text-center pt-4">
                          <Button variant="outline" onClick={() => {
                            // TODO: Implement load more functionality
                            console.log('Load more search history');
                          }}>
                            Load More ({searchHistory.totalCount - searchHistory.searches.length} remaining)
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 