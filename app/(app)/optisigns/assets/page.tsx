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
  Image,
  Video,
  FileText,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Eye,
  MoreVertical,
  Database,
  HardDrive,
  Filter,
  Search,
  Plus,
  ListChecks,
  Tag,
  Calendar,
  Zap,
  Sparkles,
  Megaphone,
  Radio
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Input } from '@/app/components/ui/Input';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { toast } from 'react-hot-toast';
import api from '@/app/lib/api';

interface Asset {
  id: string;
  tenantId: string;
  optisignsId: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'audio';
  fileType: string;
  fileSize: number;
  url: string;
  webLink: string;
  status: 'created' | 'active' | 'inactive' | 'error';
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isAnnouncementReady?: boolean;
  announcementUsage?: {
    totalUses: number;
    lastUsed?: string;
    averageDuration: number;
  };
}

interface AssetsResponse {
  assets: Asset[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
  statistics: {
    total: number;
    byType: Record<string, number>;
    totalSize: number;
    configured: boolean;
  };
}

export default function OptisignsAssetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    byType: {},
    totalSize: 0,
    configured: false
  });
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementAsset, setAnnouncementAsset] = useState<Asset | null>(null);
  const [announcementConfig, setAnnouncementConfig] = useState({
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    duration: 30,
    displaySelection: 'all' as 'all' | 'specific' | 'group',
    selectedDisplays: [] as string[],
    restoreAfter: true,
    message: ''
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await api.optisigns.getAssets();
      const data = response.data;
      
      setAssets(data.assets || []);
      setStatistics(data.statistics || {
        total: 0,
        byType: {},
        totalSize: 0,
        configured: false
      });
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      toast.error('Failed to load assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAssets = async () => {
    setSyncing(true);
    try {
      toast.loading('Syncing assets from OptiSigns...', { id: 'sync' });
      
      const response = await api.optisigns.syncAssets();
      const data = response.data;

      toast.dismiss('sync');
      toast.success(`Successfully synced ${data.summary?.totalSynced || 0} assets`);
      fetchAssets();
    } catch (error: any) {
      toast.dismiss('sync');
      toast.error(`Failed to sync assets: ${error.message || 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleUploadAsset = async (file: File) => {
    setUploading(true);
    try {
      toast.loading(`Uploading "${file.name}"...`, { id: 'upload' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('type', file.type.startsWith('image/') ? 'image' : 
                            file.type.startsWith('video/') ? 'video' : 'document');

      const response = await api.optisigns.uploadAsset(formData);

      toast.dismiss('upload');
      toast.success(`Asset "${file.name}" uploaded successfully`);
      fetchAssets();
    } catch (error: any) {
      toast.dismiss('upload');
      toast.error(`Failed to upload asset: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string, assetName: string) => {
    try {
      toast.loading(`Deleting "${assetName}"...`);
      
      await api.optisigns.deleteAsset(assetId);

      toast.dismiss();
      toast.success(`Asset "${assetName}" deleted successfully`);
      fetchAssets();
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to delete asset: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDownloadAsset = async (assetId: string, assetName: string) => {
    try {
      toast.loading(`Downloading "${assetName}"...`);
      
      const response = await api.optisigns.downloadAsset(assetId);
      
      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = assetName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success(`Asset "${assetName}" downloaded`);
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to download asset: ${error.message || 'Unknown error'}`);
    }
  };

  const applyFilter = (filter: string, search: string = searchTerm) => {
    let filtered = assets;
    
    // Apply type filter
    switch (filter) {
      case 'images':
        filtered = assets.filter(a => a.type === 'image');
        break;
      case 'videos':
        filtered = assets.filter(a => a.type === 'video');
        break;
      case 'documents':
        filtered = assets.filter(a => a.type === 'document');
        break;
      case 'recent':
        // Show assets from last 7 days
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = assets.filter(a => new Date(a.createdAt) > oneWeekAgo);
        break;
      default:
        filtered = assets;
    }
    
    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.fileType.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredAssets(filtered);
  };

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    applyFilter(value);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    applyFilter(activeFilter, value);
  };

  const getAssetIcon = (asset: Asset) => {
    switch (asset.type) {
      case 'image':
        return <Image className="h-4 w-4 text-blue-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colorMap: Record<string, string> = {
      image: 'bg-blue-100 text-blue-800',
      video: 'bg-purple-100 text-purple-800',
      document: 'bg-green-100 text-green-800',
      audio: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge variant="outline" className={colorMap[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUploadAsset(file);
    }
  };

  const handleAssetSelection = (assetId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssets(prev => [...prev, assetId]);
    } else {
      setSelectedAssets(prev => prev.filter(id => id !== assetId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(filteredAssets.map(asset => asset.id));
    } else {
      setSelectedAssets([]);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim() || selectedAssets.length === 0) {
      toast.error('Please enter a playlist name and select at least one asset');
      return;
    }

    try {
      toast.loading('Creating playlist...', { id: 'playlist' });
      
      await api.optisigns.createPlaylist({
        name: playlistName,
        assetIds: selectedAssets,
        description: `Playlist created with ${selectedAssets.length} assets`
      });

      toast.dismiss('playlist');
      toast.success(`Playlist "${playlistName}" created successfully`);
      setShowPlaylistModal(false);
      setPlaylistName('');
      setSelectedAssets([]);
    } catch (error: any) {
      toast.dismiss('playlist');
      toast.error(`Failed to create playlist: ${error.message || 'Unknown error'}`);
    }
  };

  const handleTagAssets = async (tagName: string) => {
    if (selectedAssets.length === 0) {
      toast.error('Please select assets to tag');
      return;
    }

    try {
      toast.loading(`Applying tag "${tagName}"...`, { id: 'tag' });
      
      // First create or get the tag
      const tagResponse = await api.optisigns.createTag({
        name: tagName,
        description: `Applied to ${selectedAssets.length} assets`
      });

      // Then apply the tag to selected assets
      for (const assetId of selectedAssets) {
        await api.optisigns.applyTag(assetId, tagResponse.data.id);
      }

      toast.dismiss('tag');
      toast.success(`Tag "${tagName}" applied to ${selectedAssets.length} assets`);
      setSelectedAssets([]);
    } catch (error: any) {
      toast.dismiss('tag');
      toast.error(`Failed to apply tag: ${error.message || 'Unknown error'}`);
    }
  };

  const handleScheduleAssets = async () => {
    if (selectedAssets.length === 0) {
      toast.error('Please select assets to schedule');
      return;
    }

    try {
      // Navigate to scheduling page with selected assets
      router.push(`/optisigns/schedule?assets=${selectedAssets.join(',')}`);
    } catch (error: any) {
      toast.error('Failed to navigate to scheduling');
    }
  };

  const handleTriggerAnnouncement = (asset: Asset) => {
    setAnnouncementAsset(asset);
    setShowAnnouncementModal(true);
  };

  const handleExecuteAnnouncement = async () => {
    if (!announcementAsset) return;

    try {
      toast.loading(`Triggering announcement with "${announcementAsset.name}"...`, { id: 'announcement' });

      const response = await api.optisigns.bulkTakeover({
        contentType: 'ASSET',
        contentId: announcementAsset.id,
        priority: announcementConfig.priority,
        duration: announcementConfig.duration,
        message: announcementConfig.message,
        restoreAfter: announcementConfig.restoreAfter,
        ...(announcementConfig.displaySelection === 'specific' && {
          deviceIds: announcementConfig.selectedDisplays
        })
      });

      toast.dismiss('announcement');
      toast.success(`Announcement triggered successfully on ${response.data?.devicesAffected || 'all'} displays`);
      setShowAnnouncementModal(false);
      setAnnouncementAsset(null);
      fetchAssets(); // Refresh to update usage stats
    } catch (error: any) {
      toast.dismiss('announcement');
      toast.error(`Failed to trigger announcement: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEmergencyBroadcast = async (asset: Asset) => {
    if (!confirm(`Are you sure you want to trigger an EMERGENCY BROADCAST with "${asset.name}"? This will override all current content on all displays.`)) {
      return;
    }

    try {
      toast.loading(`Triggering emergency broadcast...`, { id: 'emergency' });

      const response = await api.optisigns.emergencyBroadcast({
        contentType: 'ASSET',
        contentId: asset.id,
        duration: 60, // Default 1 minute for emergency
        message: 'EMERGENCY BROADCAST',
        criteria: {
          excludeOffline: true
        },
        override: {
          scheduledContent: true,
          activeTakeovers: true
        }
      });

      toast.dismiss('emergency');
      toast.success(`Emergency broadcast activated on ${response.data?.devicesAffected || 'all'} displays`);
      fetchAssets();
    } catch (error: any) {
      toast.dismiss('emergency');
      toast.error(`Failed to trigger emergency broadcast: ${error.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    applyFilter(activeFilter, searchTerm);
  }, [assets, activeFilter, searchTerm]);

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
              <h1 className="text-3xl font-bold">Asset Management</h1>
              <p className="text-gray-600 mt-1">
                Manage your OptiSigns media assets
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchAssets}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleSyncAssets}
              disabled={syncing}
            >
              <Database className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Assets'}
            </Button>
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
              />
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className={`h-4 w-4 mr-2 ${uploading ? 'animate-spin' : ''}`} />
                {uploading ? 'Uploading...' : 'Upload Asset'}
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">
                Media files available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Images</CardTitle>
              <Image className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.byType.image || 0}</div>
              <p className="text-xs text-muted-foreground">
                Image files
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Videos</CardTitle>
              <Video className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{statistics.byType.video || 0}</div>
              <p className="text-xs text-muted-foreground">
                Video files
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatFileSize(statistics.totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                Storage used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Assets ({filteredAssets.length})
            </CardTitle>
            <CardDescription>
              Browse and manage your media assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assets by name or file type..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedAssets.length > 0 && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-700">
                    {selectedAssets.length} asset{selectedAssets.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPlaylistModal(true)}
                    className="flex items-center gap-2"
                  >
                    <ListChecks className="h-4 w-4" />
                    Create Playlist
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Add Tag
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleTagAssets('Important')}>
                        Important
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTagAssets('Marketing')}>
                        Marketing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTagAssets('Emergency')}>
                        Emergency
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTagAssets('Seasonal')}>
                        Seasonal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleScheduleAssets}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAssets([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}

            <Tabs value={activeFilter} onValueChange={handleFilterChange} className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All ({assets.length})</TabsTrigger>
                <TabsTrigger value="images">Images ({statistics.byType.image || 0})</TabsTrigger>
                <TabsTrigger value="videos">Videos ({statistics.byType.video || 0})</TabsTrigger>
                <TabsTrigger value="documents">Documents ({statistics.byType.document || 0})</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
              </TabsList>

              <TabsContent value={activeFilter} className="space-y-4">
                {filteredAssets.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <Checkbox
                      id="select-all"
                      checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Select all {filteredAssets.length} asset{filteredAssets.length > 1 ? 's' : ''}
                    </label>
                  </div>
                )}
                
                {filteredAssets.length === 0 ? (
                  <div className="text-center py-12">
                    <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {assets.length === 0 ? 'No assets found' : 'No assets match your search'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {assets.length === 0 
                        ? 'Upload assets or sync from OptiSigns to get started.'
                        : 'Try adjusting your search or filter criteria.'
                      }
                    </p>
                    {assets.length === 0 && (
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => document.getElementById('file-upload')?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Asset
                        </Button>
                        <Button variant="outline" onClick={handleSyncAssets}>
                          <Database className="h-4 w-4 mr-2" />
                          Sync from OptiSigns
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAssets.map((asset) => (
                      <Card key={asset.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedAssets.includes(asset.id)}
                                onCheckedChange={(checked) => handleAssetSelection(asset.id, checked as boolean)}
                              />
                              {getAssetIcon(asset)}
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-base truncate">{asset.name}</CardTitle>
                                <div className="text-sm text-gray-500">
                                  {asset.fileType.toUpperCase()} • {formatFileSize(asset.fileSize)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getTypeBadge(asset.type)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => window.open(asset.webLink, '_blank')}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Asset
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownloadAsset(asset.id, asset.name)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleTriggerAnnouncement(asset)}
                                    className="text-blue-600 focus:text-blue-600"
                                  >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Trigger Announcement
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleEmergencyBroadcast(asset)}
                                    className="text-orange-600 focus:text-orange-600"
                                  >
                                    <Radio className="h-4 w-4 mr-2" />
                                    Emergency Broadcast
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteAsset(asset.id, asset.name)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">OptiSigns ID:</span>
                              <span className="font-mono text-xs">{asset.optisignsId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <Badge variant="outline" className="text-xs">
                                {asset.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Created:</span>
                              <span>{formatDate(asset.createdAt)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Upload Instructions */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Upload className="h-5 w-5" />
              Asset Upload Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-700 space-y-2">
              <p>• <strong>Supported Formats:</strong> Images (PNG, JPG, GIF), Videos (MP4, MOV, AVI), Documents (PDF, DOC, DOCX)</p>
              <p>• <strong>File Size Limit:</strong> 100MB per file for optimal performance</p>
              <p>• <strong>Sync Feature:</strong> Pull existing assets from your OptiSigns account</p>
              <p>• <strong>Asset Management:</strong> Preview, download, and organize your media library</p>
              <p>• <strong>Usage:</strong> Assets can be used in playlists and content schedules</p>
            </div>
          </CardContent>
        </Card>

        {/* Playlist Creation Modal */}
        <Dialog open={showPlaylistModal} onOpenChange={setShowPlaylistModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Playlist</DialogTitle>
              <DialogDescription>
                Create a new playlist with {selectedAssets.length} selected asset{selectedAssets.length > 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="playlist-name" className="text-sm font-medium">
                  Playlist Name
                </label>
                <Input
                  id="playlist-name"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Enter playlist name..."
                  className="mt-1"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Selected assets will be added to this playlist in the order they appear.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPlaylistModal(false);
                  setPlaylistName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePlaylist}
                disabled={!playlistName.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Playlist
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Announcement Configuration Modal */}
        <Dialog open={showAnnouncementModal} onOpenChange={setShowAnnouncementModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Trigger Announcement
              </DialogTitle>
              <DialogDescription>
                Configure and trigger an announcement with "{announcementAsset?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority Level</label>
                  <select
                    value={announcementConfig.priority}
                    onChange={(e) => setAnnouncementConfig(prev => ({
                      ...prev,
                      priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Priority</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (seconds)</label>
                  <Input
                    type="number"
                    value={announcementConfig.duration}
                    onChange={(e) => setAnnouncementConfig(prev => ({
                      ...prev,
                      duration: parseInt(e.target.value) || 30
                    }))}
                    min="5"
                    max="300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Display Selection</label>
                <select
                  value={announcementConfig.displaySelection}
                  onChange={(e) => setAnnouncementConfig(prev => ({
                    ...prev,
                    displaySelection: e.target.value as 'all' | 'specific' | 'group'
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Displays</option>
                  <option value="specific">Specific Displays</option>
                  <option value="group">Display Groups</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Announcement Message (Optional)</label>
                <Input
                  value={announcementConfig.message}
                  onChange={(e) => setAnnouncementConfig(prev => ({
                    ...prev,
                    message: e.target.value
                  }))}
                  placeholder="Enter announcement message..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="restore-after"
                  checked={announcementConfig.restoreAfter}
                  onChange={(e) => setAnnouncementConfig(prev => ({
                    ...prev,
                    restoreAfter: e.target.checked
                  }))}
                />
                <label htmlFor="restore-after" className="text-sm">
                  Restore previous content after announcement
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Megaphone className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Announcement Preview</h4>
                    <div className="text-sm text-blue-700 mt-1 space-y-1">
                      <p><strong>Asset:</strong> {announcementAsset?.name}</p>
                      <p><strong>Priority:</strong> {announcementConfig.priority}</p>
                      <p><strong>Duration:</strong> {announcementConfig.duration} seconds</p>
                      <p><strong>Target:</strong> {announcementConfig.displaySelection === 'all' ? 'All displays' : 'Selected displays'}</p>
                      {announcementConfig.message && (
                        <p><strong>Message:</strong> {announcementConfig.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAnnouncementModal(false);
                  setAnnouncementAsset(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteAnnouncement}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Trigger Announcement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 