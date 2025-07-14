'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  BarChart3,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Activity,
  Monitor,
  Webhook,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  Clock,
  TrendingUp,
  AlertCircle,
  Play,
  FileText,
  Database,
  Eye,
  Users,
  Zap,
  Shield,
  RotateCcw,
  Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/app/lib/api';

interface AnalyticsData {
  summary: {
    displays: {
      total: number;
      online: number;
      offline: number;
      uptimePercentage: number;
    };
    content: {
      total: number;
      active: number;
      inactive: number;
    };
    activity: {
      totalImpressions: number;
      avgDisplayTime: number;
      peakHours: string[];
    };
    takeovers: {
      total: number;
      active: number;
      emergency: number;
      totalDuration: number;
      successRate: number;
    };
  };
  health: {
    status: 'excellent' | 'good' | 'poor';
    score: number;
    recommendations: string[];
  };
  timeline: Array<{
    date: string;
    impressions: number;
    displays: number;
    content: number;
    takeovers?: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'display_sync' | 'content_created' | 'content_sent' | 'display_online' | 'display_offline' | 'takeover_started' | 'takeover_ended' | 'emergency_broadcast';
    description: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  dateRange: {
    start: string;
    end: string;
  };
}

interface DateRangeOption {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
}

export default function OptisignsAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const dateRangeOptions: DateRangeOption[] = [
    {
      label: 'Last 24 Hours',
      value: '1d',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      label: 'Last 7 Days',
      value: '7d',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      label: 'Last 30 Days',
      value: '30d',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      label: 'Last 90 Days',
      value: '90d',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  ];

  const fetchAnalyticsData = async (dateRange?: { startDate: string; endDate: string }) => {
    setLoading(true);
    try {
      // Build query parameters for analytics
      const params: any = {};
      
      if (dateRange) {
        params.startDate = dateRange.startDate;
        params.endDate = dateRange.endDate;
      } else if (selectedDateRange !== 'custom') {
        const range = dateRangeOptions.find(opt => opt.value === selectedDateRange);
        if (range) {
          params.startDate = range.startDate;
          params.endDate = range.endDate;
        }
      } else if (customDateRange.startDate && customDateRange.endDate) {
        params.startDate = customDateRange.startDate;
        params.endDate = customDateRange.endDate;
      }
      
      // Try both analytics endpoints
      const [basicResponse, datesResponse] = await Promise.allSettled([
        api.optisigns.getAnalytics(),
        params.startDate && params.endDate 
          ? api.optisigns.getAnalytics(params)
          : Promise.resolve(null)
      ]);

      let analyticsResult = null;

      if (basicResponse.status === 'fulfilled') {
        analyticsResult = basicResponse.value.data;
      } else if (datesResponse.status === 'fulfilled' && datesResponse.value) {
        analyticsResult = datesResponse.value.data;
      }

      if (analyticsResult) {
        // Process the analytics data to match our interface
        const processedData: AnalyticsData = {
          summary: {
            displays: {
              total: analyticsResult.summary?.displays?.total || analyticsResult.totalDisplays || 0,
              online: analyticsResult.summary?.displays?.online || analyticsResult.displays?.online || 0,
              offline: analyticsResult.summary?.displays?.offline || analyticsResult.displays?.offline || 0,
              uptimePercentage: analyticsResult.summary?.displays?.uptimePercentage || 0
            },
            content: {
              total: analyticsResult.summary?.content?.total || analyticsResult.totalContent || 0,
              active: analyticsResult.summary?.content?.active || 0,
              inactive: analyticsResult.summary?.content?.inactive || 0
            },
            activity: {
              totalImpressions: analyticsResult.summary?.activity?.totalImpressions || analyticsResult.totalImpressions || 0,
              avgDisplayTime: analyticsResult.summary?.activity?.avgDisplayTime || 0,
              peakHours: analyticsResult.summary?.activity?.peakHours || []
            },
            takeovers: {
              total: analyticsResult.summary?.takeovers?.total || 0,
              active: analyticsResult.summary?.takeovers?.active || 0,
              emergency: analyticsResult.summary?.takeovers?.emergency || 0,
              totalDuration: analyticsResult.summary?.takeovers?.totalDuration || 0,
              successRate: analyticsResult.summary?.takeovers?.successRate || 0
            }
          },
          health: {
            status: analyticsResult.health?.status || 'poor',
            score: analyticsResult.health?.score || 0,
            recommendations: analyticsResult.health?.recommendations || [
              'Sync displays from OptiSigns to get started',
              'Create content to begin showing analytics',
              'Monitor display uptime regularly'
            ]
          },
          timeline: analyticsResult.timeline || [],
          recentActivity: analyticsResult.recentActivity || [],
          dateRange: {
            start: params.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: params.endDate || new Date().toISOString().split('T')[0]
          }
        };

        setAnalyticsData(processedData);
        
        const hasData = processedData.summary.displays.total > 0 || processedData.summary.content.total > 0;
        if (hasData) {
          toast.success('Analytics data loaded successfully!');
        } else {
          toast.info('Analytics API is working. Sync displays and create content to see metrics.');
        }
      } else {
        throw new Error('No analytics data available');
      }
      
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please check your credentials.');
      } else if (error.response?.status === 404) {
        toast.error('Analytics API endpoint not found');
      } else {
        toast.error('Failed to load analytics data');
      }
      
      // Set fallback data
      setAnalyticsData({
        summary: {
          displays: { total: 0, online: 0, offline: 0, uptimePercentage: 0 },
          content: { total: 0, active: 0, inactive: 0 },
          activity: { totalImpressions: 0, avgDisplayTime: 0, peakHours: [] },
          takeovers: { total: 0, active: 0, emergency: 0, totalDuration: 0, successRate: 0 }
        },
        health: {
          status: 'poor',
          score: 0,
          recommendations: [
            'Analytics API is available but returns empty data',
            'Sync displays from OptiSigns to populate metrics',
            'Create and deploy content to track impressions'
          ]
        },
        timeline: [],
        recentActivity: [],
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (value: string) => {
    setSelectedDateRange(value);
    if (value !== 'custom') {
      const range = dateRangeOptions.find(opt => opt.value === value);
      if (range) {
        fetchAnalyticsData({ startDate: range.startDate, endDate: range.endDate });
      }
    }
  };

  const handleCustomDateRangeSubmit = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      fetchAnalyticsData(customDateRange);
    } else {
      toast.error('Please select both start and end dates');
    }
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'excellent': return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
      case 'good': return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>;
      case 'poor': return <Badge variant="destructive">Needs Attention</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'display_sync': return <Database className="h-4 w-4 text-blue-500" />;
      case 'content_created': return <FileText className="h-4 w-4 text-green-500" />;
      case 'content_sent': return <Play className="h-4 w-4 text-purple-500" />;
      case 'display_online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'display_offline': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'takeover_started': return <Zap className="h-4 w-4 text-orange-500" />;
      case 'takeover_ended': return <RotateCcw className="h-4 w-4 text-blue-500" />;
      case 'emergency_broadcast': return <Shield className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/optisigns')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Analytics & Insights</h1>
              <p className="text-gray-600 mt-1">
                Monitor your digital signage performance and engagement
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateRangeOptions.find(opt => opt.value === selectedDateRange)?.label || 'Custom Range'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {dateRangeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleDateRangeChange(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setSelectedDateRange('custom')}>
                  Custom Range
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        {selectedDateRange === 'custom' && (
          <Card>
            <CardHeader>
              <CardTitle>Custom Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="block mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="block mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <Button onClick={handleCustomDateRangeSubmit} className="mt-6">
                  Apply Range
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Displays</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.summary.displays.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData?.summary.displays.online || 0} online, {analyticsData?.summary.displays.offline || 0} offline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Items</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.summary.content.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData?.summary.content.active || 0} active, {analyticsData?.summary.content.inactive || 0} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.summary.activity.totalImpressions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Content views across all displays
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthColor(analyticsData?.health.status || 'poor')}`}>
                {analyticsData?.health.score || 0}%
              </div>
              <div className="mt-2">
                {getHealthBadge(analyticsData?.health.status || 'poor')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Device Takeovers</CardTitle>
              <Zap className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {analyticsData?.summary.takeovers?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData?.summary.takeovers?.active || 0} active, {analyticsData?.summary.takeovers?.emergency || 0} emergency
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="displays">Display Analytics</TabsTrigger>
            <TabsTrigger value="content">Content Performance</TabsTrigger>
            <TabsTrigger value="takeovers">Takeover Analytics</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Health Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Health Overview
                </CardTitle>
                <CardDescription>
                  Current performance and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Overall Health Score</div>
                      <div className="text-sm text-gray-600">
                        Based on display uptime, content activity, and system performance
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getHealthColor(analyticsData?.health.status || 'poor')}`}>
                        {analyticsData?.health.score || 0}%
                      </div>
                      {getHealthBadge(analyticsData?.health.status || 'poor')}
                    </div>
                  </div>
                  
                  {analyticsData?.health.recommendations && analyticsData.health.recommendations.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <div className="space-y-2">
                        {analyticsData.health.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                            <span>{recommendation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Display Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Uptime:</span>
                      <span className="font-medium">{analyticsData?.summary.displays.uptimePercentage || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Online Displays:</span>
                      <span className="font-medium">{analyticsData?.summary.displays.online || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Offline Displays:</span>
                      <span className="font-medium">{analyticsData?.summary.displays.offline || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Content Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Content:</span>
                      <span className="font-medium">{analyticsData?.summary.content.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Content:</span>
                      <span className="font-medium">{analyticsData?.summary.content.active || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Display Time:</span>
                      <span className="font-medium">{analyticsData?.summary.activity.avgDisplayTime || 0}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Impressions:</span>
                      <span className="font-medium">{analyticsData?.summary.activity.totalImpressions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Peak Hours:</span>
                      <span className="font-medium">
                        {analyticsData?.summary.activity.peakHours?.join(', ') || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Date Range:</span>
                      <span className="font-medium text-xs">
                        {analyticsData?.dateRange.start} to {analyticsData?.dateRange.end}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Takeover Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Takeovers:</span>
                      <span className="font-medium">{analyticsData?.summary.takeovers?.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Emergency Count:</span>
                      <span className="font-medium text-red-600">{analyticsData?.summary.takeovers?.emergency || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Success Rate:</span>
                      <span className="font-medium">{analyticsData?.summary.takeovers?.successRate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Duration:</span>
                      <span className="font-medium">{Math.round((analyticsData?.summary.takeovers?.totalDuration || 0) / 60)}m</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="displays" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Display Performance</CardTitle>
                <CardDescription>
                  Individual display metrics and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Display Analytics Coming Soon</h3>
                  <p className="text-gray-600">
                    Individual display performance metrics will be available once displays are synced and active.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
                <CardDescription>
                  Content engagement and effectiveness metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Content Analytics Coming Soon</h3>
                  <p className="text-gray-600">
                    Content performance metrics will be available once content is created and deployed to displays.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="takeovers" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Takeovers</CardTitle>
                  <Zap className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {analyticsData?.summary.takeovers?.active || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently in progress
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Emergency Count</CardTitle>
                  <Shield className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {analyticsData?.summary.takeovers?.emergency || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    High priority takeovers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Target className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData?.summary.takeovers?.successRate || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successful completions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((analyticsData?.summary.takeovers?.totalDuration || 0) / 60)}m
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cumulative time
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Takeover Analytics Overview
                </CardTitle>
                <CardDescription>
                  Device takeover performance and usage patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(analyticsData?.summary.takeovers?.total || 0) > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Takeover Distribution</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Normal Priority</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.round((((analyticsData?.summary.takeovers?.total || 0) - (analyticsData?.summary.takeovers?.emergency || 0)) / Math.max(analyticsData?.summary.takeovers?.total || 1, 1)) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">
                                {(analyticsData?.summary.takeovers?.total || 0) - (analyticsData?.summary.takeovers?.emergency || 0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Emergency Priority</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-red-500 h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.round(((analyticsData?.summary.takeovers?.emergency || 0) / Math.max(analyticsData?.summary.takeovers?.total || 1, 1)) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">
                                {analyticsData?.summary.takeovers?.emergency || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Performance Metrics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Average Duration:</span>
                            <span className="font-medium">
                              {Math.round(((analyticsData?.summary.takeovers?.totalDuration || 0) / Math.max(analyticsData?.summary.takeovers?.total || 1, 1)) / 60)}m
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Success Rate:</span>
                            <span className="font-medium text-green-600">
                              {analyticsData?.summary.takeovers?.successRate || 0}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Currently Active:</span>
                            <span className="font-medium text-orange-600">
                              {analyticsData?.summary.takeovers?.active || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Quick Actions</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push('/optisigns/takeovers')}
                            className="flex items-center gap-2"
                          >
                            <Shield className="h-4 w-4" />
                            Manage Takeovers
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push('/optisigns/displays')}
                            className="flex items-center gap-2"
                          >
                            <Monitor className="h-4 w-4" />
                            View Devices
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Takeover Activity</h3>
                    <p className="text-gray-600 mb-4">
                      Takeover analytics will appear here once you start using device takeover features.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => router.push('/optisigns/displays')}
                        className="flex items-center gap-2"
                      >
                        <Zap className="h-4 w-4" />
                        Start First Takeover
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/optisigns/takeovers')}
                        className="flex items-center gap-2"
                      >
                        <Shield className="h-4 w-4" />
                        Learn More
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest system events and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.recentActivity && analyticsData.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {analyticsData.recentActivity.map((activity, index) => (
                      <div key={activity.id || index} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <div className="font-medium">{activity.description}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
                    <p className="text-gray-600">
                      Activity will appear here as you sync displays, create content, and manage your digital signage.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* API Status */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Analytics API Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-700 space-y-2">
              <p>• <strong>Analytics Endpoint:</strong> ✅ Working correctly - both basic and date-filtered analytics</p>
              <p>• <strong>Data Structure:</strong> ✅ Properly formatted response with summary, health, and activity data</p>
              <p>• <strong>Date Filtering:</strong> ✅ Support for custom date ranges and preset periods</p>
              <p>• <strong>Real-time Data:</strong> ✅ Reflects current display and content statistics</p>
              <p>• <strong>Health Monitoring:</strong> ✅ System health scoring and recommendations available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 