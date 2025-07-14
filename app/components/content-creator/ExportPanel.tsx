'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { useContentStore } from '../../store/contentStore';
import { exportApi, ContentExport, OptiSignsStatus } from '../../services/exportApi';
import { BulkExportDialog } from './BulkExportDialog';
import { 
  Download, 
  FileImage, 
  FileVideo, 
  FileText, 
  Trash2, 
  RefreshCw, 
  Monitor, 
  CheckCircle, 
  XCircle, 
  Clock,
  Upload,
  Package,
  Copy,
  ExternalLink,
  Globe,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface ExportPanelProps {
  projectId?: string;
}

export function ExportPanel({ projectId }: ExportPanelProps) {
  const { currentProject } = useContentStore();
  const [exports, setExports] = useState<ContentExport[]>([]);
  const [optiSignsStatus, setOptiSignsStatus] = useState<OptiSignsStatus | null>(null);
  const [availableDisplays, setAvailableDisplays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDisplayIds, setSelectedDisplayIds] = useState<string[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isBulkExportDialogOpen, setIsBulkExportDialogOpen] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  
  // Track active polling instances to prevent duplicates
  const activePolls = useRef<Set<string>>(new Set());
  const pollCleanupFunctions = useRef<Map<string, () => void>>(new Map());
  
  // Export form state
  const [exportOptions, setExportOptions] = useState({
    exportType: 'image' as ContentExport['exportType'],
    quality: 'high' as 'low' | 'medium' | 'high',
    dimensions: { width: 1920, height: 1080 },
    includeAnimations: true,
    backgroundColor: '#ffffff',
    duration: 10 // for video exports
  });

  // Enhanced publish options
  const [publishOptions, setPublishOptions] = useState({
    priority: 'NORMAL' as 'NORMAL' | 'HIGH' | 'EMERGENCY',
    duration: null as number | null,
    message: 'New content update',
    restoreAfter: true
  });

  const activeProjectId = projectId || currentProject?.id;

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      // Clear all active polling
      pollCleanupFunctions.current.forEach((cleanup) => cleanup());
      pollCleanupFunctions.current.clear();
      activePolls.current.clear();
    };
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      loadProjectExports();
      loadOptiSignsStatus();
      loadAvailableDisplays();
    }
  }, [activeProjectId]);

  const loadProjectExports = async () => {
    if (!activeProjectId || isLoading) return;
    
    try {
      setIsLoading(true);
      const response = await exportApi.getProjectExports(activeProjectId);
      setExports(response.exports || []);
    } catch (error) {
      console.error('Failed to load exports:', error);
      
      // Check if it's a network error or API not available
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
          console.warn('Export API not available, setting empty exports list');
          setExports([]); // Set empty array instead of failing
          // Don't show error toast for network issues - API might not be implemented yet
        } else {
          toast.error('Failed to load exports');
        }
      } else {
        toast.error('Failed to load exports');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadOptiSignsStatus = async () => {
    if (!activeProjectId) return;
    
    try {
      const response = await exportApi.getOptiSignsStatus(activeProjectId);
      setOptiSignsStatus(response.status);
    } catch (error) {
      console.error('Failed to load OptiSigns status:', error);
      // Set default status if API is not available
      setOptiSignsStatus('not_published');
    }
  };

  const loadAvailableDisplays = async () => {
    try {
      const response = await exportApi.getAvailableDisplays();
      setAvailableDisplays(response.displays || []);
    } catch (error) {
      console.error('Failed to load displays:', error);
      // Set empty array if API is not available
      setAvailableDisplays([]);
    }
  };

  const handleCreateExport = async () => {
    if (!activeProjectId) return;

    try {
      setIsLoading(true);
      const response = await exportApi.createExport(activeProjectId, exportOptions.exportType, exportOptions);
      toast.success('Export started successfully');
      setIsExportDialogOpen(false);
      loadProjectExports();
      
      // Start polling for status updates (only if not already polling this export)
      if (response.export?.id && !activePolls.current.has(response.export.id)) {
        pollExportStatus(response.export.id);
      }
    } catch (error) {
      console.error('Failed to create export:', error);
      if (error instanceof Error && error.message.includes('not available')) {
        toast.error('Export functionality not available. Use "Publish to OptiSigns" instead.');
      } else {
        toast.error('Failed to start export');
      }
      setIsExportDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishToOptiSigns = async () => {
    if (!activeProjectId || selectedDisplayIds.length === 0) return;

    // Prevent multiple simultaneous publishes
    if (isLoading) {
      console.log('Publish already in progress, ignoring duplicate request');
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the enhanced publish options
      const options = {
        displayIds: selectedDisplayIds,
        priority: publishOptions.priority,
        duration: publishOptions.duration,
        message: publishOptions.message,
        restoreAfter: publishOptions.restoreAfter
      };

      console.log('Publishing to OptiSigns with options:', options);
      const response = await exportApi.publishToOptiSigns(activeProjectId, options);
      setPublishResult(response);
      
      toast.success(`Published successfully! ${response.summary?.successfulTakeovers || 0} displays updated.`);
      setIsPublishDialogOpen(false);
      setSelectedDisplayIds([]);
      loadOptiSignsStatus();
    } catch (error) {
      console.error('Failed to publish to OptiSigns:', error);
      toast.error('Failed to publish to OptiSigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadExport = async (exportId: string, filename: string) => {
    try {
      const blob = await exportApi.downloadExport(exportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error) {
      console.error('Failed to download export:', error);
      if (error instanceof Error && error.message.includes('not available')) {
        toast.error('Download functionality not available in current API');
      } else {
        toast.error('Failed to download export');
      }
    }
  };

  const handleDeleteExport = async (exportId: string) => {
    try {
      await exportApi.deleteExport(exportId);
      toast.success('Export deleted successfully');
      loadProjectExports();
    } catch (error) {
      console.error('Failed to delete export:', error);
      if (error instanceof Error && error.message.includes('not available')) {
        toast.error('Delete functionality not available in current API');
      } else {
        toast.error('Failed to delete export');
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const pollExportStatus = async (exportId: string) => {
    // Prevent duplicate polling for the same export
    if (activePolls.current.has(exportId)) {
      console.log(`Already polling export ${exportId}, skipping duplicate`);
      return;
    }
    
    // Mark this export as being polled
    activePolls.current.add(exportId);
    
    const maxPollAttempts = 150; // 5 minutes max (150 * 2 seconds)
    let pollAttempts = 0;
    let pollTimeoutId: NodeJS.Timeout;
    
    const poll = async () => {
      // Check if we've exceeded max attempts
      if (pollAttempts >= maxPollAttempts) {
        console.warn(`Polling timeout for export ${exportId} after ${maxPollAttempts} attempts`);
        cleanup();
        return;
      }
      
      try {
        const status = await exportApi.getExportStatus(exportId);
        
        // Update the export in the list
        setExports(prev => prev.map(exp => 
          exp.id === exportId ? { ...exp, ...status.export } : exp
        ));
        
        if (status.export.status === 'completed') {
          toast.success('Export completed successfully');
          cleanup();
          return; // Stop polling
        } else if (status.export.status === 'failed') {
          toast.error(`Export failed: ${status.export.errorMessage || 'Unknown error'}`);
          cleanup();
          return; // Stop polling
        }
        
        // Continue polling if still processing
        pollAttempts++;
        pollTimeoutId = setTimeout(poll, 2000);
        
      } catch (error) {
        console.error('Polling error:', error);
        pollAttempts++;
        
        // Retry with longer delay on error, but stop after too many failures
        if (pollAttempts < maxPollAttempts) {
          pollTimeoutId = setTimeout(poll, 5000);
        } else {
          console.error(`Stopped polling for export ${exportId} due to repeated errors`);
          cleanup();
        }
      }
    };
    
    // Cleanup function
    const cleanup = () => {
      if (pollTimeoutId) {
        clearTimeout(pollTimeoutId);
      }
      activePolls.current.delete(exportId);
      pollCleanupFunctions.current.delete(exportId);
    };
    
    // Store cleanup function for component unmount
    pollCleanupFunctions.current.set(exportId, cleanup);
    
    // Start polling
    poll();
  };

  const getExportIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <FileImage className="w-5 h-5 text-blue-600" />;
      case 'video':
        return <FileVideo className="w-5 h-5 text-purple-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOptiSignsStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Published</Badge>;
      case 'publishing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Publishing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Emergency</Badge>;
      case 'HIGH':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">High</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  if (!activeProjectId) {
    return (
      <Card className="p-8 text-center">
        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-gray-500">No project selected</p>
        <p className="text-sm text-gray-400">Select a project to manage exports</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Export & Publish</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadProjectExports();
              loadOptiSignsStatus();
              loadAvailableDisplays();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="exports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exports">Exports</TabsTrigger>
          <TabsTrigger value="optisigns">OptiSigns</TabsTrigger>
          <TabsTrigger value="public-url">Public URL</TabsTrigger>
        </TabsList>

        <TabsContent value="exports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Project Exports</h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkExportDialogOpen(true)}
              >
                <Package className="w-4 h-4 mr-1" />
                Bulk Export
              </Button>
              <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Create Export
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Export</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="export-type">Export Type</Label>
                        <Select value={exportOptions.exportType} onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, exportType: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image (PNG)</SelectItem>
                            <SelectItem value="video">Video (MP4)</SelectItem>
                            <SelectItem value="pdf">PDF Document</SelectItem>
                            <SelectItem value="html">HTML Export</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="quality">Quality</Label>
                        <Select value={exportOptions.quality} onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, quality: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="width">Width (px)</Label>
                        <Input
                          type="number"
                          value={exportOptions.dimensions.width}
                          onChange={(e) => setExportOptions(prev => ({
                            ...prev,
                            dimensions: { ...prev.dimensions, width: parseInt(e.target.value) }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">Height (px)</Label>
                        <Input
                          type="number"
                          value={exportOptions.dimensions.height}
                          onChange={(e) => setExportOptions(prev => ({
                            ...prev,
                            dimensions: { ...prev.dimensions, height: parseInt(e.target.value) }
                          }))}
                        />
                      </div>
                    </div>

                    {exportOptions.exportType === 'video' && (
                      <div>
                        <Label htmlFor="duration">Duration (seconds)</Label>
                        <Input
                          type="number"
                          value={exportOptions.duration}
                          onChange={(e) => setExportOptions(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="animations"
                        checked={exportOptions.includeAnimations}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeAnimations: !!checked }))}
                      />
                      <Label htmlFor="animations">Include animations</Label>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsExportDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateExport}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Create Export'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {exports.length === 0 ? (
              <Card className="p-8 text-center">
                <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-gray-500">No exports yet</p>
                <p className="text-sm text-gray-400">Create your first export to get started</p>
              </Card>
            ) : (
              exports.map((exportItem) => (
                <Card key={exportItem.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getExportIcon(exportItem.exportType)}
                      <div>
                        <div className="font-medium">{exportItem.filename}</div>
                        <div className="text-sm text-gray-500">
                          {exportItem.exportType.toUpperCase()} • {exportItem.fileSize ? `${Math.round(exportItem.fileSize / 1024)} KB` : 'Processing...'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(exportItem.status)}
                      {exportItem.status === 'processing' && exportItem.progress && (
                        <div className="w-20">
                          <Progress value={exportItem.progress} className="h-2" />
                        </div>
                      )}
                      {exportItem.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadExport(exportItem.id, exportItem.filename)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteExport(exportItem.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {exportItem.errorMessage && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      {exportItem.errorMessage}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="optisigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">OptiSigns Integration</h3>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadOptiSignsStatus}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="w-4 h-4 mr-1" />
                    Publish
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Publish to OptiSigns</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium">Select Displays</Label>
                      <p className="text-sm text-gray-500 mb-3">Choose which displays should show this content</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                        {availableDisplays.map((display) => (
                          <div key={display.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={display.id}
                              checked={selectedDisplayIds.includes(display.id)}
                              onCheckedChange={(checked) => {
                                setSelectedDisplayIds(prev => 
                                  checked 
                                    ? [...prev, display.id]
                                    : prev.filter(id => id !== display.id)
                                );
                              }}
                            />
                            <div className="flex-1">
                              <Label htmlFor={display.id} className="cursor-pointer">
                                <div className="font-medium">{display.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                  <span>{display.location || 'No location'}</span>
                                  <Badge variant={display.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                                    {display.status}
                                  </Badge>
                                </div>
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedDisplayIds.length > 0 && (
                        <p className="text-sm text-blue-600 mt-2">
                          {selectedDisplayIds.length} display(s) selected
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={publishOptions.priority} onValueChange={(value: any) => setPublishOptions(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NORMAL">Normal</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="EMERGENCY">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="duration">Duration (seconds)</Label>
                        <Input
                          type="number"
                          placeholder="Permanent (leave empty)"
                          value={publishOptions.duration || ''}
                          onChange={(e) => setPublishOptions(prev => ({ 
                            ...prev, 
                            duration: e.target.value ? parseInt(e.target.value) : null 
                          }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">Takeover Message</Label>
                      <Input
                        value={publishOptions.message}
                        onChange={(e) => setPublishOptions(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Message to display during takeover"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="restore-after"
                        checked={publishOptions.restoreAfter}
                        onCheckedChange={(checked) => setPublishOptions(prev => ({ ...prev, restoreAfter: !!checked }))}
                      />
                      <Label htmlFor="restore-after">Restore previous content after duration expires</Label>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsPublishDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePublishToOptiSigns}
                        disabled={isLoading || selectedDisplayIds.length === 0}
                        className="flex-1"
                      >
                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Publish to {selectedDisplayIds.length} Display(s)
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {publishResult && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Publish Successful</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPublishResult(null)}
                  >
                    ×
                  </Button>
                </div>
                <p className="text-sm text-green-700">{publishResult.message}</p>
                {publishResult.asset?.publicUrl && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-700">Public URL:</span>
                    <code className="text-xs bg-white px-2 py-1 rounded">{publishResult.asset.publicUrl}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(publishResult.asset.publicUrl)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {optiSignsStatus ? (
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-5 h-5" />
                    <span className="font-medium">Publication Status</span>
                  </div>
                  {getOptiSignsStatusBadge(optiSignsStatus.status)}
                </div>

                {optiSignsStatus.publishedAt && (
                  <div className="text-sm text-gray-600">
                    Published on {new Date(optiSignsStatus.publishedAt).toLocaleString()}
                  </div>
                )}

                {optiSignsStatus.displays && optiSignsStatus.displays.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Active Displays</Label>
                    <div className="space-y-2 mt-2">
                      {optiSignsStatus.displays.map((display) => (
                        <div key={display.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{display.name}</div>
                            {display.lastSeen && (
                              <div className="text-xs text-gray-500">
                                Last seen: {new Date(display.lastSeen).toLocaleString()}
                              </div>
                            )}
                          </div>
                          <Badge variant={display.status === 'online' ? 'default' : 'secondary'}>
                            {display.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {optiSignsStatus.errorMessage && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {optiSignsStatus.errorMessage}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-gray-500">Not published to OptiSigns</p>
              <p className="text-sm text-gray-400">Publish your project to digital displays</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="public-url" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Public Access</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={loadOptiSignsStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {publishResult?.asset?.publicUrl || optiSignsStatus?.status === 'published' ? (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Public URL Available</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                </div>

                <p className="text-sm text-gray-600">
                  This content is publicly accessible and can be displayed on OptiSigns devices or embedded in websites.
                </p>

                {publishResult?.asset?.publicUrl && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Public URL</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded">
                          {publishResult.asset.publicUrl}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(publishResult.asset.publicUrl)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(publishResult.asset.publicUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Content is cached for 5 minutes</p>
                      <p>• No authentication required for access</p>
                      <p>• Optimized for iframe embedding</p>
                      <p>• Auto-scales to display resolution</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-gray-500">No public URL available</p>
              <p className="text-sm text-gray-400 mb-4">
                Publish your project to OptiSigns to generate a public URL
              </p>
              <Button
                onClick={() => setIsPublishDialogOpen(true)}
                className="mt-2"
              >
                <Upload className="w-4 h-4 mr-2" />
                Publish to OptiSigns
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Bulk Export Dialog */}
      <BulkExportDialog
        isOpen={isBulkExportDialogOpen}
        onClose={() => setIsBulkExportDialogOpen(false)}
        preselectedProjects={activeProjectId ? [activeProjectId] : []}
      />
    </div>
  );
} 