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
  Monitor,
  RefreshCw,
  ArrowLeft,
  Eye,
  Settings,
  Play,
  Wifi,
  WifiOff,
  MoreVertical,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  Clock,
  Activity,
  Radio,
  StopCircle,
  Bell,
  Zap,
  Shield
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

interface Display {
  id: string;
  tenantId: string;
  optisignsId: string;
  name: string;
  status: 'online' | 'offline' | 'unknown';
  location?: string;
  isOnline: boolean;
  isActive: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    deviceType?: string;
    version?: string;
    resolution?: string;
    orientation?: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}

interface DisplaysResponse {
  displays: Display[];
  pagination: PaginationInfo;
  statistics: {
    total: number;
    online: number;
    offline: number;
    lastSync: string | null;
  };
  filters?: {
    status?: string;
    isOnline?: string;
    location?: string;
    searchTerm?: string;
  };
}

interface SyncResponse {
  message: string;
  summary: {
    totalSynced: number;
    newDisplays: number;
    updatedDisplays: number;
    errors: number;
  };
  displays: Display[];
}

export default function OptisignsDisplaysPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    limit: 50
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    online: 0,
    offline: 0,
    lastSync: null as string | null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');

  const fetchDisplays = async (page = 1, filters?: {
    search?: string;
    status?: string;
    location?: string;
  }) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 500, // Higher limit to handle large display collections
      };

      // Add filters if provided
      if (filters?.search) params.search = filters.search;
      if (filters?.status) params.status = filters.status;
      if (filters?.location) params.location = filters.location;

      const response = await api.optisigns.getDisplays(params);
      const responseData: DisplaysResponse = response.data;

      if (responseData.displays && responseData.displays.length > 0) {
        setDisplays(responseData.displays);
        setPagination(responseData.pagination || {
          currentPage: page,
          totalPages: 1,
          totalCount: responseData.displays.length,
          hasNextPage: false,
          hasPreviousPage: false,
          limit: responseData.displays.length
        });
        setStatistics(responseData.statistics || {
          total: responseData.displays.length,
          online: responseData.displays.filter(d => d.isOnline || d.isActive).length,
          offline: responseData.displays.filter(d => !d.isOnline && !d.isActive).length,
          lastSync: new Date().toISOString()
        });
        toast.success(`Loaded ${responseData.displays.length} displays from backend`);
      } else {
        setDisplays([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          limit: 50
        });
        setStatistics({ total: 0, online: 0, offline: 0, lastSync: null });
        toast.info('No displays found. Try syncing from OptiSigns first.');
      }
    } catch (error: any) {
      console.error('Error fetching displays from backend:', error);
      setDisplays([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        limit: 50
      });
      setStatistics({ total: 0, online: 0, offline: 0, lastSync: null });
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please check your credentials.');
      } else {
        toast.error(`Failed to load displays from backend: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDisplays = async () => {
    setSyncing(true);
    try {
      toast.loading('Syncing displays from OptiSigns via backend...', { id: 'sync' });
      
      const response = await api.optisigns.syncDisplays();
      
      if (response?.data) {
        toast.dismiss('sync');
        const syncData = response.data;
        toast.success(`Successfully synced ${syncData.displayCount || syncData.displays?.length || 0} displays from backend!`);
        
        // Refresh the display list
        await fetchDisplays();
      } else {
        toast.dismiss('sync');
        toast.error('No response from sync operation');
      }
    } catch (error: any) {
      console.error('Error syncing displays via backend:', error);
      toast.dismiss('sync');
      toast.error(`Backend sync failed: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchDisplays(1, { search: term, status: statusFilter, location: locationFilter });
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    fetchDisplays(1, { search: searchTerm, status: status, location: locationFilter });
  };

  const handleLocationFilter = (location: string) => {
    setLocationFilter(location);
    fetchDisplays(1, { search: searchTerm, status: statusFilter, location: location });
  };

  const handlePageChange = (page: number) => {
    fetchDisplays(page, { search: searchTerm, status: statusFilter, location: locationFilter });
  };

  const handleRebootDisplay = async (displayId: string, displayName: string) => {
    try {
      toast.loading(`Rebooting ${displayName} via backend...`, { id: 'reboot' });
      
      // Use the API client to make the request to the external backend
      const response = await fetch(`http://34.122.156.88:3001/api/optisigns/displays/${displayId}/reboot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.dismiss('reboot');
        toast.success(`${displayName} reboot initiated via backend`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.dismiss('reboot');
        toast.error(`Backend reboot failed: ${errorData.error || 'Display not found'}`);
      }
    } catch (error) {
      toast.dismiss('reboot');
      toast.error('Failed to reboot display via backend');
    }
  };

  const handleAssignContent = async (displayId: string, displayName: string) => {
    try {
      toast.loading(`Assigning content to ${displayName} via backend...`, { id: 'assign' });
      
      // This would call the backend API for content assignment
      toast.dismiss('assign');
      toast.info('Content assignment will be handled by backend API when implemented');
      
    } catch (error) {
      toast.dismiss('assign');
      toast.error('Failed to assign content via backend');
    }
  };

  const handleTakeoverDevice = async (displayId: string, displayName: string, priority: 'EMERGENCY' | 'HIGH' | 'NORMAL' = 'HIGH') => {
    try {
      toast.loading(`Initiating ${priority.toLowerCase()} takeover on "${displayName}" via backend...`);
      
      // Use the API client for takeover operations
      const response = await api.optisigns.initiateDeviceTakeover(displayId, {
        contentType: 'ASSET',
        contentId: 'default-emergency-content', // This would be selected from available content
        priority: priority,
        duration: priority === 'EMERGENCY' ? 300 : 120,
        message: priority === 'EMERGENCY' ? 'Emergency broadcast initiated' : 'High priority content takeover',
        restoreAfter: true
      });

      toast.dismiss();
      if (response) {
        toast.success(`${priority} takeover initiated on "${displayName}" via backend`);
        fetchDisplays(); // Refresh to show updated status
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Backend takeover failed: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }
  };

  const handleStopTakeover = async (displayId: string, displayName: string) => {
    try {
      toast.loading(`Stopping takeover on "${displayName}" via backend...`);
      
      const response = await api.optisigns.stopTakeover(displayId, {
        restoreContent: true,
        reason: 'Manual stop requested by user'
      });

      toast.dismiss();
      if (response) {
        toast.success(`Takeover stopped on "${displayName}" via backend`);
        fetchDisplays(); // Refresh to show updated status
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Backend stop takeover failed: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }
  };

  const handleCheckTakeoverStatus = async (displayId: string, displayName: string) => {
    try {
      toast.loading(`Checking takeover status for "${displayName}" via backend...`);
      
      const response = await api.optisigns.getTakeoverStatus(displayId);
      
      toast.dismiss();
      if (response?.data?.takeover?.isActive) {
        const takeover = response.data.takeover;
        toast.success(
          `Active ${takeover.priority} takeover: ${takeover.message}. Time remaining: ${takeover.timeRemaining}s`,
          { duration: 5000 }
        );
      } else {
        toast.info(`No active takeover on "${displayName}"`);
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Backend takeover status check failed: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    fetchDisplays();
  }, []);

  const getStatusIcon = (display: Display) => {
    if (display.isOnline || display.isActive) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (display: Display) => {
    if (display.isOnline || display.isActive) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>;
    } else {
      return <Badge variant="destructive">Offline</Badge>;
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
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

  const getDisplayMetadata = (display: Display) => {
    const metadata = display.metadata || {};
    return {
      deviceType: metadata.deviceType || 'Unknown',
      version: metadata.version || 'Unknown',
      resolution: metadata.resolution || 'Unknown',
      orientation: metadata.orientation || 'Unknown'
    };
  };

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
              <h1 className="text-3xl font-bold">Display Management</h1>
              <p className="text-gray-600 mt-1">
                Manage and monitor your OptiSigns displays via backend (34.122.156.88:3001)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchDisplays()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleSyncDisplays}
              disabled={syncing}
            >
              <Database className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Displays'}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Displays</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">
                From backend API
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.online}</div>
              <p className="text-xs text-muted-foreground">
                Active displays
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.offline}</div>
              <p className="text-xs text-muted-foreground">
                Inactive displays
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {statistics.lastSync ? formatLastSeen(statistics.lastSync) : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground">
                Backend sync
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Filter displays by status, location, or search term (handled by backend)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search displays..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
              <input
                type="text"
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => handleLocationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pagination Info */}
        {pagination.totalCount > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {displays.length} of {pagination.totalCount} displays (Page {pagination.currentPage} of {pagination.totalPages})
            </p>
            {pagination.totalPages > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Displays Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displays.map((display) => {
            const metadata = getDisplayMetadata(display);
            return (
              <Card key={display.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">
                        {display.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {display.location || 'Unknown Location'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(display)}
                      {getStatusBadge(display)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Device:</span>
                      <p className="text-gray-600">{metadata.deviceType}</p>
                    </div>
                    <div>
                      <span className="font-medium">Resolution:</span>
                      <p className="text-gray-600">{metadata.resolution}</p>
                    </div>
                    <div>
                      <span className="font-medium">Version:</span>
                      <p className="text-gray-600">{metadata.version}</p>
                    </div>
                    <div>
                      <span className="font-medium">Last Seen:</span>
                      <p className="text-gray-600">{formatLastSeen(display.lastSeen)}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="text-xs text-gray-500">
                      ID: {display.optisignsId}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleRebootDisplay(display.id, display.name)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reboot Display
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleAssignContent(display.id, display.name)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Assign Content
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleTakeoverDevice(display.id, display.name, 'HIGH')}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          High Priority Takeover
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleTakeoverDevice(display.id, display.name, 'EMERGENCY')}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Emergency Takeover
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStopTakeover(display.id, display.name)}
                        >
                          <StopCircle className="h-4 w-4 mr-2" />
                          Stop Takeover
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleCheckTakeoverStatus(display.id, display.name)}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Check Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {displays.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Monitor className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No displays found</h3>
              <p className="text-gray-500 mb-4 text-center">
                No displays match your current filters, or no displays have been synced from the backend yet.
              </p>
              <Button onClick={handleSyncDisplays} disabled={syncing}>
                <Database className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync from Backend'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Backend Integration Notice */}
        {displays.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Shield className="h-5 w-5" />
                Backend Integration Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-blue-700 space-y-2">
                <p>• <strong>External Backend:</strong> All display data is fetched from backend at 34.122.156.88:3001</p>
                <p>• <strong>No Client-Side Logic:</strong> All filtering, pagination, and operations are handled server-side</p>
                <p>• <strong>Real-time Sync:</strong> Display information is synchronized directly from OptiSigns API via backend</p>
                <p>• <strong>Pagination Support:</strong> Backend handles pagination for large display collections (50+ displays)</p>
                <p>• <strong>Total Displays:</strong> Currently showing {displays.length} displays from backend</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 