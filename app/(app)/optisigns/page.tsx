'use client';

import React, { useEffect, useState } from 'react';
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
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import {
  Monitor,
  FileText,
  Settings,
  BarChart3,
  Image,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  RefreshCw,
  Database,
  Activity,
  Users,
  TrendingUp,
  AlertTriangle,
  Bell,
  Calendar,
  Tag,
  Play,
  Pause,
  FastForward,
  Send,
  Loader2,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Edit,
  Copy,
  Trash2,
  Plus,
  MoreVertical,
  Clock,
  MapPin,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/app/lib/api';
import { useContentStore } from '@/app/store/contentStore';
import { usePublishWorkflow } from '@/app/hooks/usePublishWorkflow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { isDisplayAvailable, getDisplayStatistics } from '@/app/lib/displayUtils';

// Interfaces
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

interface TakeoverOptions {
  priority: 'EMERGENCY' | 'HIGH' | 'NORMAL';
  duration: number;
  message: string;
  restoreAfter: boolean;
}

interface OptisignsStats {
  displays: {
    total: number;
    online: number;
    offline: number;
    lastSync: string | null;
  };
  content: {
    total: number;
    local: number;
    remote: number;
  };
  projects: {
    total: number;
    published: number;
    draft: number;
  };
}

export default function OptisignsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OptisignsStats | null>(null);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [selectedDisplays, setSelectedDisplays] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showTakeoverDialog, setShowTakeoverDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [takeoverOptions, setTakeoverOptions] = useState<TakeoverOptions>({
    priority: 'NORMAL',
    duration: 30,
    message: '',
    restoreAfter: true
  });

  // Content store integration
  const {
    projects,
    loadProjects,
    isLoading: projectsLoading
  } = useContentStore();

  // Publish workflow integration
  const {
    publishToDisplays,
    publishWithTakeover,
    isPublishing,
    progress
  } = usePublishWorkflow();

  // Load data on mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchDisplays(),
          loadProjects(),
          fetchStats()
        ]);
      } catch (error) {
        console.error('Failed to initialize data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [loadProjects]);

  const fetchDisplays = async () => {
    try {
      const response = await api.optisigns.getDisplays({ limit: 500 });
      const displaysData = response.data?.items || response.data?.displays || response.data || [];
      setDisplays(Array.isArray(displaysData) ? displaysData : []);
    } catch (error) {
      console.error('Failed to fetch displays:', error);
      setDisplays([]);
    }
  };

  const fetchStats = async () => {
    try {
      const [displaysRes, statusRes] = await Promise.allSettled([
        api.optisigns.getDisplays({ limit: 500 }),
        api.optisigns.getIntegrationStatus()
      ]);

      let displayStats = { total: 0, online: 0, offline: 0, lastSync: null };
      if (displaysRes.status === 'fulfilled') {
        const displaysData = displaysRes.value.data?.items || displaysRes.value.data?.displays || displaysRes.value.data || [];
        if (Array.isArray(displaysData)) {
          displayStats = {
            total: displaysData.length,
            online: displaysData.filter((d: any) => d.isOnline || d.status === 'online').length,
            offline: displaysData.filter((d: any) => !d.isOnline || d.status === 'offline').length,
            lastSync: new Date().toISOString()
          };
        }
      }

      // Content stats - using projects data since content API is different now
      const contentStats = {
        total: projects.length,
        local: projects.filter(p => !p.publishedAt).length,
        remote: projects.filter(p => p.publishedAt).length
      };

      const projectStats = {
        total: projects.length,
        published: projects.filter(p => p.status === 'published').length,
        draft: projects.filter(p => p.status === 'draft').length
      };

      setStats({
        displays: displayStats,
        content: contentStats,
        projects: projectStats
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDisplayToggle = (displayId: string) => {
    setSelectedDisplays(prev => 
      prev.includes(displayId)
        ? prev.filter(id => id !== displayId)
        : [...prev, displayId]
    );
  };

  const handleSelectAllDisplays = () => {
    setSelectedDisplays(filteredDisplays.map(d => d.id));
  };

  const handleDeselectAllDisplays = () => {
    setSelectedDisplays([]);
  };

  const handleQuickTakeover = async (projectId: string, displayIds: string[]) => {
    if (displayIds.length === 0) {
      toast.error('Please select at least one display');
      return;
    }

    try {
      await api.content.publishToOptiSigns(projectId, { displayIds });
      toast.success(`Published to ${displayIds.length} display(s)`);
      setSelectedDisplays([]);
    } catch (error) {
      console.error('Quick takeover failed:', error);
      toast.error('Failed to publish to displays');
    }
  };

  const handleEmergencyTakeover = async () => {
    if (!selectedProject || selectedDisplays.length === 0) {
      toast.error('Please select a project and displays');
      return;
    }

    try {
      // First publish the content
      await api.content.publishToOptiSigns(selectedProject, { displayIds: selectedDisplays });
      
      // Then initiate takeover on each display if needed
      if (takeoverOptions.priority === 'EMERGENCY') {
        for (const displayId of selectedDisplays) {
          try {
            await api.optisigns.initiateDeviceTakeover(displayId, {
              contentType: 'ASSET',
              contentId: selectedProject,
              priority: takeoverOptions.priority,
              duration: takeoverOptions.duration,
              message: takeoverOptions.message,
              restoreAfter: takeoverOptions.restoreAfter
            });
          } catch (error) {
            console.warn(`Failed to initiate takeover on display ${displayId}:`, error);
          }
        }
      }
      
      toast.success(`Content published and takeover initiated on ${selectedDisplays.length} display(s)`);
      setShowTakeoverDialog(false);
      setSelectedDisplays([]);
      setSelectedProject(null);
    } catch (error) {
      console.error('Emergency takeover failed:', error);
      toast.error('Failed to initiate emergency takeover');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDisplays(),
        loadProjects(),
        fetchStats()
      ]);
      toast.success('Data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Filter displays
  const filteredDisplays = displays.filter(display => {
    const matchesSearch = display.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         display.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || display.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusBadge = (status: string, isOnline?: boolean, isActive?: boolean) => {
    const display = { status, isOnline, isActive };
    if (isDisplayAvailable(display)) {
      return <Badge className="bg-green-100 text-green-800">Available</Badge>;
    } else if (status === 'offline' || (isOnline === false && isActive === false)) {
      return <Badge variant="secondary">Offline</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getProjectStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && projects.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading OptSigns Management...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">OptSigns Management</h1>
            <p className="text-gray-600 mt-1">
              Manage projects, displays, and content distribution
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => router.push('/optisigns/config')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.projects.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.projects.published || 0} published, {stats?.projects.draft || 0} draft
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Displays</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.displays.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.displays.online || 0} online, {stats?.displays.offline || 0} offline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OptiSigns Content</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.content.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.content.local || 0} local, {stats?.content.remote || 0} remote
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Selected Displays Actions */}
        {selectedDisplays.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {selectedDisplays.length} display(s) selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllDisplays}
                  >
                    Clear Selection
                  </Button>
                  <Dialog open={showTakeoverDialog} onOpenChange={setShowTakeoverDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        <Zap className="h-4 w-4 mr-2" />
                        Emergency Takeover
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Emergency Takeover</DialogTitle>
                        <DialogDescription>
                          Configure emergency takeover for {selectedDisplays.length} selected display(s)
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Select Project</Label>
                          <Select value={selectedProject || ''} onValueChange={setSelectedProject}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a project to publish" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Priority Level</Label>
                          <Select 
                            value={takeoverOptions.priority} 
                            onValueChange={(value: any) => setTakeoverOptions(prev => ({ ...prev, priority: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EMERGENCY">Emergency (Immediate)</SelectItem>
                              <SelectItem value="HIGH">High Priority</SelectItem>
                              <SelectItem value="NORMAL">Normal Priority</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Duration (seconds)</Label>
                          <Input
                            type="number"
                            value={takeoverOptions.duration}
                            onChange={(e) => setTakeoverOptions(prev => ({ 
                              ...prev, 
                              duration: parseInt(e.target.value) || 30 
                            }))}
                            min="10"
                            max="3600"
                          />
                        </div>

                        <div>
                          <Label>Message (optional)</Label>
                          <Input
                            value={takeoverOptions.message}
                            onChange={(e) => setTakeoverOptions(prev => ({ 
                              ...prev, 
                              message: e.target.value 
                            }))}
                            placeholder="Emergency broadcast message"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="restore"
                            checked={takeoverOptions.restoreAfter}
                            onCheckedChange={(checked) => setTakeoverOptions(prev => ({ 
                              ...prev, 
                              restoreAfter: checked as boolean 
                            }))}
                          />
                          <Label htmlFor="restore">Restore previous content after takeover</Label>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTakeoverDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleEmergencyTakeover}
                          disabled={!selectedProject || isPublishing}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isPublishing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Initiating...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Start Takeover
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress indicator */}
        {isPublishing && progress && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Publishing Progress</span>
                  <span className="text-sm text-blue-600">{progress.percentage}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700">
                  Stage: {progress.stage} - {progress.message}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects">Content Projects ({filteredProjects.length})</TabsTrigger>
            <TabsTrigger value="displays">Displays ({filteredDisplays.length})</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Content Projects</CardTitle>
                    <CardDescription>
                      Manage and publish your content creator projects to displays
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                      {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                    </Button>
                    <Button onClick={() => router.push('/content-creator')}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {projectsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-500 mb-4">
                      {projects.length === 0 ? 'Create your first content project' : 'No projects match your search'}
                    </p>
                    <Button onClick={() => router.push('/content-creator')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                    : "space-y-4"
                  }>
                    {filteredProjects.map((project) => (
                      <Card key={project.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">{project.name}</h3>
                              {getProjectStatusBadge(project.status)}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/content-creator?project=${project.id}`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Project
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/content-creator?project=${project.id}&tab=export`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleQuickTakeover(project.id, selectedDisplays)}
                                  disabled={selectedDisplays.length === 0}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Quick Publish ({selectedDisplays.length})
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {project.description && (
                            <p className="text-sm text-gray-500 truncate">{project.description}</p>
                          )}
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Canvas:</span>
                              <span>{project.canvasSize.width}×{project.canvasSize.height}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Elements:</span>
                              <span>{project.elements?.length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Modified:</span>
                              <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => router.push(`/content-creator?project=${project.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleQuickTakeover(project.id, selectedDisplays)}
                              disabled={selectedDisplays.length === 0}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Publish
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Displays Tab */}
          <TabsContent value="displays" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Display Management</CardTitle>
                    <CardDescription>
                      Select displays and publish content instantly
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                      {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSelectAllDisplays}
                      disabled={filteredDisplays.length === 0}
                    >
                      Select All
                    </Button>
                    <Button onClick={() => router.push('/optisigns/displays')}>
                      <Monitor className="h-4 w-4 mr-2" />
                      Advanced
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search displays..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredDisplays.length === 0 ? (
                  <div className="text-center py-8">
                    <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No displays found</h3>
                    <p className="text-gray-500 mb-4">
                      {displays.length === 0 ? 'No displays available' : 'No displays match your search'}
                    </p>
                    <Button onClick={() => router.push('/optisigns/displays')}>
                      <Database className="h-4 w-4 mr-2" />
                      Sync Displays
                    </Button>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                    : "space-y-4"
                  }>
                    {filteredDisplays.map((display) => (
                      <Card 
                        key={display.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedDisplays.includes(display.id) 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : ''
                        }`}
                        onClick={() => handleDisplayToggle(display.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedDisplays.includes(display.id)}
                                onChange={() => handleDisplayToggle(display.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <h3 className="font-medium truncate">{display.name}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(display.status, display.isOnline, display.isActive)}
                              {isDisplayAvailable(display) ? (
                                <Wifi className="h-4 w-4 text-green-600" />
                              ) : (
                                <WifiOff className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                          {display.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{display.location}</span>
                            </div>
                          )}
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">OptiSigns ID:</span>
                              <span className="font-mono text-xs">{display.optisignsId}</span>
                            </div>
                            {display.metadata?.resolution && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Resolution:</span>
                                <span>{display.metadata.resolution}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Last Seen:</span>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span>{formatLastSeen(display.lastSeen)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Access additional OptSigns management features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/optisigns/content')}
              >
                <FileText className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">OptiSigns Content</div>
                  <div className="text-xs text-gray-500">Remote content</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/optisigns/analytics')}
              >
                <BarChart3 className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Analytics</div>
                  <div className="text-xs text-gray-500">Performance metrics</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/optisigns/assets')}
              >
                <Image className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Assets</div>
                  <div className="text-xs text-gray-500">{stats?.content.total || 0} assets</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/optisigns/config')}
              >
                <Settings className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">Settings</div>
                  <div className="text-xs text-gray-500">Configure integration</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 