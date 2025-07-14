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
  Radio,
  ArrowLeft,
  Eye,
  StopCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Bell,
  Monitor,
  Activity,
  FastForward,
  Users,
  Zap,
  Shield,
  Calendar,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import api from '@/app/lib/api';

interface Takeover {
  id: string;
  deviceId: string;
  deviceName: string;
  contentType: 'ASSET' | 'PLAYLIST';
  contentId: string;
  contentName: string;
  priority: 'EMERGENCY' | 'HIGH' | 'NORMAL';
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startTime: string;
  endTime: string;
  timeRemaining: number;
  message: string;
  initiatedBy: string;
  createdAt: string;
}

interface TakeoversResponse {
  takeovers: Takeover[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
  summary: {
    totalActive: number;
    emergencyTakeovers: number;
    highPriorityTakeovers: number;
    devicesUnderTakeover: number;
  };
}

export default function OptisignsTakeoversPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [takeovers, setTakeovers] = useState<Takeover[]>([]);
  const [summary, setSummary] = useState<TakeoversResponse['summary'] | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredTakeovers, setFilteredTakeovers] = useState<Takeover[]>([]);

  const fetchTakeovers = async () => {
    setLoading(true);
    try {
      const response = await api.optisigns.getActiveTakeovers();
      const data = response.data;
      
      setTakeovers(data.takeovers || []);
      setSummary(data.summary || {
        totalActive: 0,
        emergencyTakeovers: 0,
        highPriorityTakeovers: 0,
        devicesUnderTakeover: 0
      });
    } catch (error) {
      console.error('Failed to fetch takeovers:', error);
      toast.error('Failed to load takeovers');
      setTakeovers([]);
      setSummary({
        totalActive: 0,
        emergencyTakeovers: 0,
        highPriorityTakeovers: 0,
        devicesUnderTakeover: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTakeover = async (takeoverId: string, deviceName: string) => {
    try {
      toast.loading(`Cancelling takeover on "${deviceName}"...`);
      
      await api.optisigns.cancelTakeover(takeoverId, {
        reason: 'Manually cancelled by user',
        restoreContent: true
      });

      toast.dismiss();
      toast.success(`Takeover cancelled on "${deviceName}"`);
      fetchTakeovers();
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to cancel takeover: ${error.message || 'Unknown error'}`);
    }
  };

  const handleExtendTakeover = async (takeoverId: string, deviceName: string, additionalMinutes: number = 5) => {
    try {
      toast.loading(`Extending takeover on "${deviceName}" by ${additionalMinutes} minutes...`);
      
      await api.optisigns.extendTakeover(takeoverId, {
        additionalSeconds: additionalMinutes * 60,
        reason: `Extended by user for ${additionalMinutes} more minutes`
      });

      toast.dismiss();
      toast.success(`Takeover extended on "${deviceName}" by ${additionalMinutes} minutes`);
      fetchTakeovers();
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to extend takeover: ${error.message || 'Unknown error'}`);
    }
  };

  const handleViewDetails = (takeoverId: string) => {
    router.push(`/optisigns/takeovers/${takeoverId}`);
  };

  const applyFilter = (filter: string) => {
    let filtered = takeovers;
    
    switch (filter) {
      case 'emergency':
        filtered = takeovers.filter(t => t.priority === 'EMERGENCY');
        break;
      case 'high':
        filtered = takeovers.filter(t => t.priority === 'HIGH');
        break;
      case 'active':
        filtered = takeovers.filter(t => t.status === 'ACTIVE');
        break;
      case 'recent':
        // Show takeovers from last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        filtered = takeovers.filter(t => new Date(t.createdAt) > oneDayAgo);
        break;
      default:
        filtered = takeovers;
    }
    
    setFilteredTakeovers(filtered);
  };

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    applyFilter(value);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return <Badge variant="destructive">Emergency</Badge>;
      case 'HIGH':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">High</Badge>;
      case 'NORMAL':
        return <Badge variant="outline">Normal</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Expired';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  useEffect(() => {
    fetchTakeovers();
  }, []);

  useEffect(() => {
    applyFilter(activeFilter);
  }, [takeovers, activeFilter]);

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
              <h1 className="text-3xl font-bold">Takeover Management</h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage active device takeovers
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchTakeovers}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => router.push('/optisigns/takeover')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Bell className="h-4 w-4 mr-2" />
              Emergency Broadcast
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Takeovers</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary?.totalActive || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary?.emergencyTakeovers || 0}</div>
              <p className="text-xs text-muted-foreground">
                High priority alerts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <Zap className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary?.highPriorityTakeovers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Important messages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{summary?.devicesUnderTakeover || 0}</div>
              <p className="text-xs text-muted-foreground">
                Under takeover
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Message */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <TrendingUp className="h-5 w-5" />
              Takeover Features Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-700 space-y-2">
              <p>• <strong>Device Takeover:</strong> Available from Displays page - right-click any display</p>
              <p>• <strong>Emergency Broadcast:</strong> Quickly broadcast to all displays simultaneously</p>
              <p>• <strong>Priority Levels:</strong> Emergency, High Priority, and Normal takeovers supported</p>
              <p>• <strong>Auto-Restore:</strong> Previous content automatically restores when takeover ends</p>
              <p>• <strong>Real-time Management:</strong> Extend, cancel, or monitor active takeovers</p>
              <p className="pt-2 text-blue-600 font-medium">Note: This page will show active takeovers once API endpoints are implemented</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 