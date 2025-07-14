'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Plus, ListChecks, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  totalDuration: number;
  assetCount: number;
  createdAt: string;
  usageCount?: number;
}

export default function OptisignsPlaylistsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalDuration: 0
  });

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const response = await api.optisigns.getPlaylists();
      
      if (response?.data) {
        setPlaylists(response.data.playlists || []);
        setStatistics(response.data.statistics || {
          total: 0,
          active: 0,
          inactive: 0,
          totalDuration: 0
        });
      } else {
        setPlaylists([]);
        setStatistics({
          total: 0,
          active: 0,
          inactive: 0,
          totalDuration: 0
        });
      }
    } catch (error: any) {
      toast.error(`Failed to fetch playlists: ${error.message || 'Unknown error'}`);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = () => {
    router.push('/optisigns/playlists/create');
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  useEffect(() => {
    fetchPlaylists();
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
              <h1 className="text-3xl font-bold">Playlist Management</h1>
              <p className="text-gray-600 mt-1">
                Create and manage content playlists for your displays
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchPlaylists}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleCreatePlaylist}>
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">All playlist items</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Playlists</CardTitle>
              <ListChecks className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
              <p className="text-xs text-muted-foreground">Currently in use</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Playlists</CardTitle>
              <ListChecks className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{statistics.inactive}</div>
              <p className="text-xs text-muted-foreground">Not in use</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatDuration(statistics.totalDuration)}</div>
              <p className="text-xs text-muted-foreground">Combined runtime</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Playlists ({playlists.length})
            </CardTitle>
            <CardDescription>
              Manage your content playlists and scheduling
            </CardDescription>
          </CardHeader>
          <CardContent>
            {playlists.length === 0 ? (
              <div className="text-center py-12">
                <ListChecks className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No playlists found
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first playlist to organize content for your displays.
                </p>
                <Button onClick={handleCreatePlaylist}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Playlist
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlists.map((playlist) => (
                  <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{playlist.name}</CardTitle>
                          <div className="text-sm text-gray-500">
                            {playlist.assetCount} assets • {formatDuration(playlist.totalDuration)}
                          </div>
                        </div>
                        <Badge variant={playlist.status === 'active' ? 'default' : 'secondary'}>
                          {playlist.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        {playlist.description && (
                          <div className="text-gray-600 text-xs">
                            {playlist.description}
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assets:</span>
                          <span>{playlist.assetCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span>{formatDuration(playlist.totalDuration)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <ListChecks className="h-5 w-5" />
              Playlist Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-700 space-y-2">
              <p>• <strong>Content Organization:</strong> Group multiple assets into organized playlists</p>
              <p>• <strong>Scheduling:</strong> Schedule playlists to play at specific times</p>
              <p>• <strong>Emergency Broadcasting:</strong> Instantly broadcast any playlist to all displays</p>
              <p>• <strong>Looping Control:</strong> Configure automatic playlist looping</p>
              <p>• <strong>Asset Management:</strong> Add, remove, and reorder assets within playlists</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
