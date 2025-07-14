import React, { useState, useEffect } from 'react';
import { useContentStore } from '@/app/store/contentStore';
import { api } from '@/app/lib/api';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { RefreshCw, Activity, Monitor, Wifi, WifiOff } from 'lucide-react';

interface DeviceStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'syncing' | 'error';
  isActive?: boolean;
  lastSeen: string;
  location?: string;
  currentContent?: string;
  uptime?: number;
  connectionStrength?: number;
}

interface LiveStatusData {
  devices: DeviceStatus[];
  lastUpdated: string;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
}

export default function DeviceStatusExample() {
  const [liveStatus, setLiveStatus] = useState<LiveStatusData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { refreshDeviceStatuses, getLiveDeviceStatus } = useContentStore();

  // Function to refresh device statuses manually
  const handleRefreshStatuses = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      console.log('🔄 Refreshing device statuses...');
      const result = await refreshDeviceStatuses();
      console.log('✅ Device statuses refreshed:', result);
      
      // After refreshing, get the updated live status
      await fetchLiveStatus();
      
    } catch (error) {
      console.error('❌ Failed to refresh device statuses:', error);
      setError('Failed to refresh device statuses');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Function to get live device status
  const fetchLiveStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📡 Fetching live device status...');
      const result = await getLiveDeviceStatus();
      console.log('✅ Live device status received:', result);
      setLiveStatus(result);
      
    } catch (error) {
      console.error('❌ Failed to get live device status:', error);
      setError('Failed to get live device status');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh live status every 30 seconds
  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Direct API usage example (alternative approach)
  const handleDirectApiRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      console.log('🔄 Using direct API call...');
      const result = await api.optisigns.refreshDeviceStatuses();
      console.log('✅ Direct API refresh successful:', result);
      
      // Get updated status via direct API
      const statusResult = await api.optisigns.getLiveDeviceStatus();
      console.log('✅ Direct API status received:', statusResult);
      setLiveStatus(statusResult.data);
      
    } catch (error) {
      console.error('❌ Direct API call failed:', error);
      setError('Direct API call failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: string, isActive?: boolean) => {
    if (status === 'online' || isActive) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    }
    
    switch (status) {
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <Activity className="h-4 w-4 text-orange-500" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, isActive?: boolean) => {
    const effectiveStatus = (status === 'online' || isActive) ? 'online' : status;
    
    const variants = {
      online: 'bg-green-100 text-green-800',
      offline: 'bg-red-100 text-red-800',
      syncing: 'bg-blue-100 text-blue-800',
      error: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={variants[effectiveStatus as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {effectiveStatus}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Device Status Management</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleRefreshStatuses}
            disabled={isRefreshing}
            variant="outline"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Statuses
          </Button>
          
          <Button
            onClick={handleDirectApiRefresh}
            disabled={isRefreshing}
            variant="secondary"
          >
            Direct API Refresh
          </Button>
          
          <Button
            onClick={fetchLiveStatus}
            disabled={isLoading}
            variant="default"
          >
            {isLoading ? (
              <Activity className="h-4 w-4 mr-2 animate-pulse" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Get Live Status
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Status Overview */}
      {liveStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{liveStatus.totalDevices}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{liveStatus.onlineDevices}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline</CardTitle>
              <WifiOff className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{liveStatus.offlineDevices}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {new Date(liveStatus.lastUpdated).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Device List */}
      {liveStatus?.devices && (
        <Card>
          <CardHeader>
            <CardTitle>Device Details</CardTitle>
            <CardDescription>
              Real-time status of all connected devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveStatus.devices.map((device) => (
                <div 
                  key={device.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(device.status, device.isActive)}
                    <div>
                      <h4 className="font-medium">{device.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ID: {device.id}
                      </p>
                      {device.location && (
                        <p className="text-sm text-muted-foreground">
                          Location: {device.location}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {device.currentContent && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Content: </span>
                        <span className="font-medium">{device.currentContent}</span>
                      </div>
                    )}
                    
                    {device.connectionStrength && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Signal: </span>
                        <span className="font-medium">{device.connectionStrength}%</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      Last seen: {new Date(device.lastSeen).toLocaleString()}
                    </div>
                    
                    {getStatusBadge(device.status, device.isActive)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Example Code */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            How to use the new device status endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h5 className="font-medium mb-2">Using Content Store:</h5>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`// Get from store
const { refreshDeviceStatuses, getLiveDeviceStatus } = useContentStore();

// Refresh device statuses
const result = await refreshDeviceStatuses();

// Get live status
const status = await getLiveDeviceStatus();`}
              </pre>
            </div>
            
            <div>
              <h5 className="font-medium mb-2">Using Direct API:</h5>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`// Direct API calls
import { api } from '@/app/lib/api';

// Refresh statuses
const refreshResult = await api.optisigns.refreshDeviceStatuses();

// Get live status
const liveStatus = await api.optisigns.getLiveDeviceStatus();`}
              </pre>
            </div>
            
            <div>
              <h5 className="font-medium mb-2">API Endpoints:</h5>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`POST /api/optisigns/devices/refresh-status
GET /api/optisigns/devices/live-status`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 