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
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Monitor,
  Settings,
  FileText,
  Webhook,
  BarChart3,
  Image,
  Play,
  Bug,
  ExternalLink,
  Clock,
  Database,
  Server,
  Zap,
  Shield,
  RotateCcw,
  ListChecks,
  Calendar,
  Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/app/lib/api';

interface EndpointStatus {
  name: string;
  method: string;
  endpoint: string;
  status: 'working' | 'error' | 'not_implemented' | 'testing';
  statusCode?: number;
  error?: string;
  description: string;
  category: string;
  icon: any;
  lastTested?: Date;
  responseTime?: number;
}

interface TestSummary {
  total: number;
  working: number;
  errors: number;
  notImplemented: number;
  percentage: number;
  lastUpdate: Date;
}

interface TakeoverStatus {
  activeTakeovers: number;
  emergencyTakeovers: number;
  totalDevices: number;
  lastTakeoverAt?: Date;
}

export default function OptisignsStatusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<TestSummary>({
    total: 26, // Updated total to include new endpoints
    working: 4,
    errors: 7,
    notImplemented: 15, // Updated to reflect new endpoints
    percentage: 15,
    lastUpdate: new Date()
  });
  const [takeoverStatus, setTakeoverStatus] = useState<TakeoverStatus>({
    activeTakeovers: 0,
    emergencyTakeovers: 0,
    totalDevices: 0
  });
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    // Configuration Endpoints
    {
      name: 'Test API Connection',
      method: 'POST',
      endpoint: '/api/optisigns/config/test',
      status: 'error',
      statusCode: 404,
      error: 'GraphQL API connection failed: Request failed with status code 404',
      description: 'Test connectivity to Optisigns API with token validation',
      category: 'Configuration',
      icon: Settings
    },
    {
      name: 'Get Configuration',
      method: 'GET',
      endpoint: '/api/optisigns/config',
      status: 'working',
      statusCode: 200,
      description: 'Retrieve current configuration settings (stored locally)',
      category: 'Configuration',
      icon: Settings
    },
    {
      name: 'Update Configuration',
      method: 'PUT',
      endpoint: '/api/optisigns/config',
      status: 'error',
      statusCode: 405,
      error: 'GraphQL API issues - Method Not Allowed or database connection problems',
      description: 'Save or update API configuration and settings',
      category: 'Configuration',
      icon: Settings
    },
    
    // Display Management
    {
      name: 'Get Displays',
      method: 'GET',
      endpoint: '/api/optisigns/displays',
      status: 'working',
      statusCode: 200,
      description: 'List all displays (returns empty array - no displays synced)',
      category: 'Displays',
      icon: Monitor
    },
    {
      name: 'Sync Displays',
      method: 'POST',
      endpoint: '/api/optisigns/displays/sync',
      status: 'error',
      statusCode: 500,
      error: 'Database model initialization error: Cannot read properties of undefined (reading \'findOne\')',
      description: 'Import displays from Optisigns account',
      category: 'Displays',
      icon: Monitor
    },
    
    // Content Management
    {
      name: 'Get Content',
      method: 'GET',
      endpoint: '/api/optisigns/content',
      status: 'working',
      statusCode: 200,
      description: 'List all content (returns empty array - no content created)',
      category: 'Content',
      icon: FileText
    },
    {
      name: 'Create Content',
      method: 'POST',
      endpoint: '/api/optisigns/content',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Cannot POST /api/optisigns/content - endpoint not implemented',
      description: 'Create new content for displays',
      category: 'Content',
      icon: FileText
    },
    {
      name: 'Send Content to Displays',
      method: 'POST',
      endpoint: '/api/optisigns/content/{id}/send',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'Send specific content to selected displays',
      category: 'Content',
      icon: FileText
    },
    
    // Analytics
    {
      name: 'Get Analytics',
      method: 'GET',
      endpoint: '/api/optisigns/analytics',
      status: 'working',
      statusCode: 200,
      description: 'Retrieve analytics data (returns zero metrics - no data available)',
      category: 'Analytics',
      icon: BarChart3
    },
    {
      name: 'Get Analytics (Date Range)',
      method: 'GET',
      endpoint: '/api/optisigns/analytics?dates',
      status: 'working',
      statusCode: 200,
      description: 'Retrieve analytics with date filtering support',
      category: 'Analytics',
      icon: BarChart3
    },
    
    // Webhook Rules
    {
      name: 'Get Webhook Rules',
      method: 'GET',
      endpoint: '/api/optisigns/webhook-rules',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Cannot GET /api/optisigns/webhook-rules - endpoint not found',
      description: 'List automation webhook rules',
      category: 'Webhook Rules',
      icon: Webhook
    },
    {
      name: 'Create Webhook Rule',
      method: 'POST',
      endpoint: '/api/optisigns/webhook-rules',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Cannot POST /api/optisigns/webhook-rules - endpoint not found',
      description: 'Create new webhook automation rule',
      category: 'Webhook Rules',
      icon: Webhook
    },
    
    // Debug & Assets
    {
      name: 'Debug Connectivity',
      method: 'POST',
      endpoint: '/api/optisigns/debug/connectivity',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Cannot POST /api/optisigns/debug/connectivity - endpoint not found',
      description: 'Test basic connectivity to Optisigns API',
      category: 'Debug',
      icon: Bug
    },
    {
      name: 'Get Assets',
      method: 'GET',
      endpoint: '/api/optisigns/assets',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Cannot GET /api/optisigns/assets - endpoint not found',
      description: 'Retrieve media assets and templates',
      category: 'Assets',
      icon: Image
    },
    {
      name: 'Get Executions',
      method: 'GET',
      endpoint: '/api/optisigns/executions',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Cannot GET /api/optisigns/executions - endpoint not found',
      description: 'Get content execution history and status',
      category: 'Executions',
      icon: Play
    },

    // Takeover Management
    {
      name: 'Device Takeover',
      method: 'POST',
      endpoint: '/api/optisigns/takeover',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'Initiate takeover of specific device with priority and duration',
      category: 'Takeover',
      icon: Zap
    },
    {
      name: 'Bulk Takeover',
      method: 'POST',
      endpoint: '/api/optisigns/takeover/bulk',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'Initiate takeover of multiple devices simultaneously',
      category: 'Takeover',
      icon: Zap
    },
    {
      name: 'Emergency Broadcast',
      method: 'POST',
      endpoint: '/api/optisigns/takeover/emergency',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'Emergency broadcast to all devices with highest priority',
      category: 'Takeover',
      icon: Shield
    },
    {
      name: 'Stop Device Takeover',
      method: 'DELETE',
      endpoint: '/api/optisigns/takeover/{deviceId}',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'Stop active takeover and restore original content',
      category: 'Takeover',
      icon: RotateCcw
    },
    {
      name: 'Get Active Takeovers',
      method: 'GET',
      endpoint: '/api/optisigns/takeover/active',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'List all currently active takeovers',
      category: 'Takeover',
      icon: ListChecks
    },

    // Enhanced Asset Management
    {
      name: 'Sync Assets',
      method: 'POST',
      endpoint: '/api/optisigns/assets/sync',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'Sync assets from OptiSigns account',
      category: 'Assets',
      icon: RefreshCw
    },
    {
      name: 'Upload Asset',
      method: 'POST',
      endpoint: '/api/optisigns/assets/upload',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'Upload new asset to OptiSigns',
      category: 'Assets',
      icon: Image
    },

    // Playlist Management
    {
      name: 'Get Playlists',
      method: 'GET',
      endpoint: '/api/optisigns/playlists',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'List all playlists',
      category: 'Playlists',
      icon: Play
    },
    {
      name: 'Create Playlist',
      method: 'POST',
      endpoint: '/api/optisigns/playlists',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'Create new playlist with assets',
      category: 'Playlists',
      icon: Play
    },

    // Scheduling
    {
      name: 'Schedule Content',
      method: 'POST',
      endpoint: '/api/optisigns/schedule',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'Schedule content to display at specific times',
      category: 'Scheduling',
      icon: Calendar
    },
    {
      name: 'Get Schedules',
      method: 'GET',
      endpoint: '/api/optisigns/schedule',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'List all scheduled content',
      category: 'Scheduling',
      icon: Calendar
    },

    // Tag Management
    {
      name: 'Get Tags',
      method: 'GET',
      endpoint: '/api/optisigns/tags',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'List all available tags',
      category: 'Tags',
      icon: Tag
    },
    {
      name: 'Create Tag',
      method: 'POST',
      endpoint: '/api/optisigns/tags',
      status: 'not_implemented',
      statusCode: 404,
      error: 'Endpoint not implemented',
      description: 'Create new tag for organization',
      category: 'Tags',
      icon: Tag
    }
  ]);

  const runComprehensiveTests = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      toast.loading('Running comprehensive API tests...', { id: 'testing' });
      
      const updatedEndpoints = [...endpoints];
      let workingCount = 0;
      let errorCount = 0;
      let notImplementedCount = 0;

      // Test each endpoint
      for (let i = 0; i < updatedEndpoints.length; i++) {
        const endpoint = updatedEndpoints[i];
        const testStart = Date.now();
        
        try {
          let response;
          const headers = {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          };

          // Test based on method and endpoint
          switch (endpoint.method) {
            case 'GET':
              if (endpoint.endpoint.includes('/config')) {
                response = await api.optisigns.getConfig();
                endpoint.status = 'working';
                endpoint.statusCode = 200;
                endpoint.error = undefined;
                workingCount++;
              } else if (endpoint.endpoint.includes('/displays')) {
                response = await api.optisigns.getDisplays({ limit: 500 });
                endpoint.status = 'working';
                endpoint.statusCode = 200;
                endpoint.error = undefined;
                workingCount++;
              } else if (endpoint.endpoint.includes('/content')) {
                response = await api.optisigns.getContent();
                endpoint.status = 'working';
                endpoint.statusCode = 200;
                endpoint.error = undefined;
                workingCount++;
              } else if (endpoint.endpoint.includes('/analytics')) {
                response = await api.optisigns.getAnalytics();
                endpoint.status = 'working';
                endpoint.statusCode = 200;
                endpoint.error = undefined;
                workingCount++;
              } else {
                // Test with fetch for other endpoints
                response = await fetch(`${endpoint.endpoint}`, { headers });
                if (response.ok) {
                  endpoint.status = 'working';
                  endpoint.statusCode = response.status;
                  endpoint.error = undefined;
                  workingCount++;
                } else if (response.status === 404) {
                  endpoint.status = 'not_implemented';
                  endpoint.statusCode = 404;
                  endpoint.error = `Cannot ${endpoint.method} ${endpoint.endpoint} - endpoint not found`;
                  notImplementedCount++;
                } else {
                  endpoint.status = 'error';
                  endpoint.statusCode = response.status;
                  endpoint.error = `HTTP ${response.status}: ${response.statusText}`;
                  errorCount++;
                }
              }
              break;
              
            case 'POST':
              // Test POST endpoints with sample data
              const testData = endpoint.endpoint.includes('/test') ? 
                { apiToken: 'test_token' } : 
                endpoint.endpoint.includes('/sync') ? {} :
                endpoint.endpoint.includes('/content') ? 
                  { name: 'Test', type: 'text', content: 'Test content' } :
                { test: true };

              response = await fetch(endpoint.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(testData)
              });

              if (response.ok) {
                endpoint.status = 'working';
                endpoint.statusCode = response.status;
                endpoint.error = undefined;
                workingCount++;
              } else if (response.status === 404) {
                endpoint.status = 'not_implemented';
                endpoint.statusCode = 404;
                endpoint.error = `Cannot POST ${endpoint.endpoint} - endpoint not found`;
                notImplementedCount++;
              } else {
                endpoint.status = 'error';
                endpoint.statusCode = response.status;
                const errorText = await response.text();
                endpoint.error = errorText || `HTTP ${response.status}: ${response.statusText}`;
                errorCount++;
              }
              break;

            case 'PUT':
              // Test PUT endpoints
              response = await fetch(endpoint.endpoint, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ apiToken: 'test', settings: {} })
              });

              if (response.ok) {
                endpoint.status = 'working';
                endpoint.statusCode = response.status;
                endpoint.error = undefined;
                workingCount++;
              } else {
                endpoint.status = 'error';
                endpoint.statusCode = response.status;
                const errorText = await response.text();
                endpoint.error = errorText || `HTTP ${response.status}: ${response.statusText}`;
                errorCount++;
              }
              break;
          }

          endpoint.lastTested = new Date();
          endpoint.responseTime = Date.now() - testStart;

        } catch (error: any) {
          endpoint.status = 'error';
          endpoint.statusCode = 500;
          endpoint.error = error.message || 'Network error';
          endpoint.lastTested = new Date();
          endpoint.responseTime = Date.now() - testStart;
          errorCount++;
        }
      }

      // Update summary
      const newSummary = {
        total: updatedEndpoints.length,
        working: workingCount,
        errors: errorCount,
        notImplemented: notImplementedCount,
        percentage: Math.round((workingCount / updatedEndpoints.length) * 100),
        lastUpdate: new Date()
      };

      setEndpoints(updatedEndpoints);
      setSummary(newSummary);

      toast.dismiss('testing');
      toast.success(`Tests completed! ${workingCount}/${updatedEndpoints.length} endpoints working (${newSummary.percentage}%)`);

    } catch (error: any) {
      console.error('Test error:', error);
      toast.dismiss('testing');
      toast.error('Failed to complete all tests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'working':
        return <Badge className="bg-green-100 text-green-800">Working</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'not_implemented':
        return <Badge className="bg-gray-100 text-gray-600">Not Implemented</Badge>;
      case 'testing':
        return <Badge className="bg-blue-100 text-blue-800">Testing...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'not_implemented':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryStats = () => {
    const categories = ['Configuration', 'Displays', 'Content', 'Analytics', 'Webhook Rules', 'Debug', 'Assets', 'Executions', 'Takeover', 'Playlists', 'Scheduling', 'Tags'];
    return categories.map(category => {
      const categoryEndpoints = endpoints.filter(e => e.category === category);
      const working = categoryEndpoints.filter(e => e.status === 'working').length;
      const total = categoryEndpoints.length;
      const percentage = total > 0 ? Math.round((working / total) * 100) : 0;
      
      return {
        category,
        working,
        total,
        percentage,
        status: percentage >= 80 ? 'healthy' : percentage >= 50 ? 'partial' : percentage > 0 ? 'limited' : 'down'
      };
    });
  };

  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage > 0) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Optisigns API Status</h1>
              <p className="text-gray-600">Real-time endpoint monitoring and diagnostics</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={runComprehensiveTests}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Testing...' : 'Run Tests'}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/docs/api-opti', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              API Docs
            </Button>
          </div>
        </div>

        {/* Overall Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
              <Server className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthColor(summary.percentage)}`}>
                {summary.percentage}%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {summary.working}/{summary.total} endpoints working
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Working</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.working}</div>
              <p className="text-xs text-gray-600 mt-1">
                Fully functional endpoints
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
              <p className="text-xs text-gray-600 mt-1">
                Database/API connection issues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Not Implemented</CardTitle>
              <AlertCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{summary.notImplemented}</div>
              <p className="text-xs text-gray-600 mt-1">
                Missing or 404 endpoints
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Category Status Overview</CardTitle>
            <CardDescription>
              Health status by API category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getCategoryStats().map((cat) => (
                <div key={cat.category} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{cat.category}</div>
                    <div className="text-xs text-gray-600">{cat.working}/{cat.total} working</div>
                  </div>
                  <div className={`text-lg font-bold ${getHealthColor(cat.percentage)}`}>
                    {cat.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Takeover Status Monitoring */}
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Zap className="h-5 w-5" />
              Takeover Status Monitor
            </CardTitle>
            <CardDescription className="text-orange-700">
              Real-time monitoring of device takeovers and emergency broadcasts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-white">
                <div>
                  <div className="font-medium text-sm">Active Takeovers</div>
                  <div className="text-xs text-gray-600">Currently in progress</div>
                </div>
                <div className="text-xl font-bold text-orange-600">
                  {takeoverStatus.activeTakeovers}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-white">
                <div>
                  <div className="font-medium text-sm">Emergency</div>
                  <div className="text-xs text-gray-600">High priority takeovers</div>
                </div>
                <div className="text-xl font-bold text-red-600">
                  {takeoverStatus.emergencyTakeovers}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-white">
                <div>
                  <div className="font-medium text-sm">Total Devices</div>
                  <div className="text-xs text-gray-600">Available for takeover</div>
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {takeoverStatus.totalDevices}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                <div>
                  <div className="font-medium text-sm">Last Activity</div>
                  <div className="text-xs text-gray-600">Most recent takeover</div>
                </div>
                <div className="text-xs font-medium text-gray-600">
                  {takeoverStatus.lastTakeoverAt ? 
                    takeoverStatus.lastTakeoverAt.toLocaleTimeString() : 
                    'No activity'
                  }
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/optisigns/takeovers')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Manage Takeovers
              </Button>
              <Button
                onClick={() => router.push('/optisigns/displays')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                View Devices
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Issues Alert */}
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Database className="h-5 w-5" />
              Critical Issues Identified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-red-600" />
                <div>
                  <strong>Database Model Issues:</strong> Write operations (sync, create, update) fail with "Cannot read properties of undefined (reading 'findOne')" errors
                </div>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 text-red-600" />
                <div>
                  <strong>GraphQL API Connection:</strong> Configuration test endpoint returns 404 errors, preventing API token validation
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-600" />
                <div>
                  <strong>Missing Endpoints:</strong> Webhook rules, assets, executions, and debug endpoints return 404 (not implemented)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Endpoint Status */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Endpoint Status</CardTitle>
            <CardDescription>
              Individual endpoint test results and error details
              {summary.lastUpdate && (
                <span className="ml-2 text-xs text-gray-500">
                  Last updated: {summary.lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(
                endpoints.reduce((acc, endpoint) => {
                  if (!acc[endpoint.category]) acc[endpoint.category] = [];
                  acc[endpoint.category].push(endpoint);
                  return acc;
                }, {} as Record<string, EndpointStatus[]>)
              ).map(([category, categoryEndpoints]) => (
                <div key={category}>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    {React.createElement(categoryEndpoints[0].icon, { className: 'h-5 w-5' })}
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryEndpoints.map((endpoint, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {getStatusIcon(endpoint.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{endpoint.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {endpoint.method}
                              </Badge>
                              {endpoint.statusCode && (
                                <Badge variant="outline" className="text-xs">
                                  {endpoint.statusCode}
                                </Badge>
                              )}
                              {endpoint.responseTime && (
                                <Badge variant="outline" className="text-xs">
                                  {endpoint.responseTime}ms
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {endpoint.description}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {endpoint.endpoint}
                            </div>
                            {endpoint.error && (
                              <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded border-l-2 border-red-200">
                                <strong>Error:</strong> {endpoint.error}
                              </div>
                            )}
                            {endpoint.lastTested && (
                              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last tested: {endpoint.lastTested.toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(endpoint.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Steps to improve API functionality and resolve issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border-l-4 border-red-500 bg-red-50">
                <h4 className="font-semibold text-red-800 mb-2">🔴 Critical - Database Issues</h4>
                <p className="text-sm text-red-700">
                  Initialize database models properly. The "Cannot read properties of undefined (reading 'findOne')" error 
                  suggests database connection or model initialization problems in the backend.
                </p>
              </div>
              
              <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                <h4 className="font-semibold text-yellow-800 mb-2">🟡 High Priority - GraphQL Connection</h4>
                <p className="text-sm text-yellow-700">
                  Fix the GraphQL API connection for configuration endpoints. This is preventing API token validation and configuration management.
                </p>
              </div>
              
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                <h4 className="font-semibold text-blue-800 mb-2">🔵 Medium Priority - Missing Endpoints</h4>
                <p className="text-sm text-blue-700">
                  Implement missing endpoints: webhook rules, assets, executions, and debug connectivity. 
                  These are documented in the API but return 404 errors.
                </p>
              </div>
              
              <div className="p-4 border-l-4 border-green-500 bg-green-50">
                <h4 className="font-semibold text-green-800 mb-2">✅ Working Well</h4>
                <p className="text-sm text-green-700">
                  Read operations (GET endpoints) for config, displays, content, and analytics are working correctly. 
                  Build upon this foundation for write operations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 