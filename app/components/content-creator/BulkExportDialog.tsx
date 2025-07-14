'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useContentStore } from '../../store/contentStore';
import { exportApi, ContentExport } from '../../services/exportApi';
import { Download, RefreshCw, Package, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BulkExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProjects?: string[];
}

export function BulkExportDialog({ isOpen, onClose, preselectedProjects = [] }: BulkExportDialogProps) {
  const { projects, loadProjects } = useContentStore();
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(preselectedProjects);
  const [isLoading, setIsLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    exportType: 'image' as ContentExport['exportType'],
    quality: 'high' as 'low' | 'medium' | 'high',
    dimensions: { width: 1920, height: 1080 },
    includeAnimations: true,
    backgroundColor: '#ffffff',
    duration: 10,
    zipName: 'bulk-export'
  });

  useEffect(() => {
    if (isOpen && projects.length === 0) {
      loadProjects();
    }
  }, [isOpen, projects.length, loadProjects]);

  useEffect(() => {
    setSelectedProjectIds(preselectedProjects);
  }, [preselectedProjects]);

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProjectIds(projects.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedProjectIds([]);
  };

  const handleBulkExport = async () => {
    if (selectedProjectIds.length === 0) {
      toast.error('Please select at least one project');
      return;
    }

    try {
      setIsLoading(true);
      const response = await exportApi.bulkExport(
        selectedProjectIds,
        exportOptions.exportType,
        {
          ...exportOptions,
          zipName: exportOptions.zipName || 'bulk-export'
        }
      );
      
      toast.success(`Bulk export started for ${selectedProjectIds.length} projects`);
      onClose();
      
      // Show download when ready
      if (response.downloadUrl) {
        const a = document.createElement('a');
        a.href = response.downloadUrl;
        a.download = `${exportOptions.zipName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to start bulk export:', error);
      toast.error('Failed to start bulk export');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));
  const estimatedFileSize = selectedProjectIds.length * 2; // Rough estimate in MB

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Bulk Export Projects
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-6">
          {/* Project Selection */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium">Select Projects ({selectedProjectIds.length} selected)</Label>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 border rounded p-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`flex items-center space-x-3 p-3 rounded border cursor-pointer transition-colors ${
                    selectedProjectIds.includes(project.id)
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleProjectToggle(project.id)}
                >
                  <Checkbox
                    checked={selectedProjectIds.includes(project.id)}
                    onChange={() => {}} // Handled by parent click
                  />
                  <div className="flex-1">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-gray-500">{project.description}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{project.status}</Badge>
                      <span className="text-xs text-gray-400">
                        {project.elements?.length || 0} elements
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {projects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No projects available</p>
                </div>
              )}
            </div>
          </div>

          {/* Export Options */}
          <div className="w-80 flex flex-col space-y-4">
            <Label className="text-sm font-medium">Export Options</Label>
            
            <div>
              <Label>Export Type</Label>
              <Select
                value={exportOptions.exportType}
                onValueChange={(value) => setExportOptions(prev => ({ 
                  ...prev, 
                  exportType: value as ContentExport['exportType'] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Images (PNG/JPG)</SelectItem>
                  <SelectItem value="video">Videos (MP4)</SelectItem>
                  <SelectItem value="pdf">PDF Documents</SelectItem>
                  <SelectItem value="html">HTML Packages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quality</Label>
              <Select
                value={exportOptions.quality}
                onValueChange={(value) => setExportOptions(prev => ({ 
                  ...prev, 
                  quality: value as 'low' | 'medium' | 'high' 
                }))}
              >
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Width</Label>
                <Input
                  type="number"
                  value={exportOptions.dimensions.width}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dimensions: { ...prev.dimensions, width: parseInt(e.target.value) || 1920 }
                  }))}
                />
              </div>
              <div>
                <Label>Height</Label>
                <Input
                  type="number"
                  value={exportOptions.dimensions.height}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dimensions: { ...prev.dimensions, height: parseInt(e.target.value) || 1080 }
                  }))}
                />
              </div>
            </div>

            {exportOptions.exportType === 'video' && (
              <div>
                <Label>Duration (seconds)</Label>
                <Input
                  type="number"
                  value={exportOptions.duration}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    duration: parseInt(e.target.value) || 10 
                  }))}
                />
              </div>
            )}

            <div>
              <Label>Archive Name</Label>
              <Input
                value={exportOptions.zipName}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  zipName: e.target.value 
                }))}
                placeholder="bulk-export"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bulk-animations"
                checked={exportOptions.includeAnimations}
                onCheckedChange={(checked) => setExportOptions(prev => ({ 
                  ...prev, 
                  includeAnimations: !!checked 
                }))}
              />
              <Label htmlFor="bulk-animations">Include Animations</Label>
            </div>

            {/* Export Summary */}
            <Card className="p-4 bg-gray-50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Projects:</span>
                  <span className="font-medium">{selectedProjectIds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="font-medium">{exportOptions.exportType.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quality:</span>
                  <span className="font-medium">{exportOptions.quality}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Size:</span>
                  <span className="font-medium">~{estimatedFileSize}MB</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {selectedProjectIds.length > 0 && (
              <>Selected: {selectedProjects.map(p => p.name).join(', ')}</>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkExport}
              disabled={isLoading || selectedProjectIds.length === 0}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export {selectedProjectIds.length} Projects
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 