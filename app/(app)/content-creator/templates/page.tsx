'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { 
  FileImage, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Search, 
  Filter, 
  Eye,
  Download,
  Upload,
  Grid3X3,
  List,
  MoreVertical,
  Star,
  StarOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import api from '@/app/lib/api';

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  canvasSize: {
    width: number;
    height: number;
  };
  previewImage?: string;
  usageCount: number;
  isPublic: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  elements?: any[];
  variables?: Record<string, any>;
}

interface CreateTemplateData {
  name: string;
  description: string;
  category: string;
  canvasSize: {
    width: number;
    height: number;
  };
  isPublic: boolean;
  elements?: any[];
  variables?: Record<string, any>;
}

const CATEGORIES = [
  'welcome_screen',
  'announcement',
  'celebration',
  'promotion',
  'informational',
  'emergency',
  'seasonal',
  'custom'
];

const CANVAS_PRESETS = [
  { name: '1920x1080 (Full HD)', width: 1920, height: 1080 },
  { name: '1366x768 (HD)', width: 1366, height: 768 },
  { name: '1280x720 (HD Ready)', width: 1280, height: 720 },
  { name: '1080x1920 (Portrait)', width: 1080, height: 1920 },
  { name: 'Custom', width: 0, height: 0 }
];

export default function ContentTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState<string | null>(null);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateTemplateData>({
    name: '',
    description: '',
    category: 'custom',
    canvasSize: { width: 1920, height: 1080 },
    isPublic: false
  });
  const [duplicateName, setDuplicateName] = useState('');

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.content.templates.list({
        page: 1,
        limit: 100
      });
      
      const templatesData = response.data?.templates || response.templates || [];
      setTemplates(templatesData);
      setFilteredTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter templates
  useEffect(() => {
    let filtered = [...templates];

    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    if (showPublicOnly) {
      filtered = filtered.filter(template => template.isPublic);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(template => template.isFavorite);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, showPublicOnly, showFavoritesOnly]);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Create template
  const handleCreateTemplate = async () => {
    try {
      if (!createForm.name.trim()) {
        toast.error('Template name is required');
        return;
      }

      const response = await api.content.templates.create(createForm);
      
      toast.success('Template created successfully');
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        description: '',
        category: 'custom',
        canvasSize: { width: 1920, height: 1080 },
        isPublic: false
      });
      
      await loadTemplates();
      
      // Navigate to edit the new template
      if (response.data?.template?.id || response.template?.id) {
        const templateId = response.data?.template?.id || response.template?.id;
        handleUseTemplate(templateId);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await api.content.templates.delete(templateId);
      toast.success('Template deleted successfully');
      setShowDeleteModal(null);
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  // Duplicate template
  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      if (!duplicateName.trim()) {
        toast.error('Template name is required');
        return;
      }

      await api.content.templates.duplicate(templateId, {
        name: duplicateName
      });
      
      toast.success('Template duplicated successfully');
      setShowDuplicateModal(null);
      setDuplicateName('');
      await loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      // Update locally first for immediate feedback
      setTemplates(prev => prev.map(t => 
        t.id === templateId 
          ? { ...t, isFavorite: !t.isFavorite }
          : t
      ));

      // Then update on server
      await api.content.templates.update(templateId, {
        isFavorite: !template.isFavorite
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
      // Revert the local change
      setTemplates(prev => prev.map(t => 
        t.id === templateId 
          ? { ...t, isFavorite: !t.isFavorite }
          : t
      ));
    }
  };

  // Handle template usage with protection against multiple redirects
  const handleUseTemplate = (templateId: string) => {
    if (isUsingTemplate) {
      console.log('Template usage already in progress, ignoring duplicate request');
      return;
    }
    
    console.log('Using template from templates page:', templateId);
    setIsUsingTemplate(true);
    
    // Use replace instead of push to avoid creating multiple history entries
    router.replace(`/content-creator?template=${templateId}`);
    
    // Reset the flag after a delay to allow for navigation
    setTimeout(() => {
      setIsUsingTemplate(false);
    }, 2000);
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredTemplates.map((template) => (
        <Card key={template.id} className="group hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                <CardDescription className="text-sm mt-1 line-clamp-2">
                  {template.description || 'No description'}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleToggleFavorite(template.id)}
              >
                {template.isFavorite ? (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Preview Area */}
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center relative">
              {template.previewImage ? (
                <img 
                  src={template.previewImage} 
                  alt={template.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <FileImage className="h-8 w-8 mx-auto mb-2" />
                  <span className="text-xs">No preview</span>
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <Badge variant="secondary" className="capitalize">
                  {template.category.replace('_', ' ')}
                </Badge>
                <span className="text-gray-500">
                  {template.canvasSize.width}×{template.canvasSize.height}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{template.usageCount} uses</span>
                <div className="flex items-center space-x-1">
                  {template.isPublic && (
                    <Badge variant="outline" className="text-xs">Public</Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    onClick={() => handleUseTemplate(template.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Use
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push(`/content-creator/templates/${template.id}/edit`)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setDuplicateName(`${template.name} Copy`);
                      setShowDuplicateModal(template.id);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteModal(template.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTemplates.map((template) => (
              <tr key={template.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFavorite(template.id)}
                      className="h-6 w-6"
                    >
                      {template.isFavorite ? (
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-3 w-3 text-gray-400" />
                      )}
                    </Button>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {template.description || 'No description'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="secondary" className="capitalize">
                    {template.category.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {template.canvasSize.width}×{template.canvasSize.height}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {template.usageCount} uses
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(template.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Button 
                      size="sm" 
                      onClick={() => handleUseTemplate(template.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(`/content-creator/templates/${template.id}/edit`)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setDuplicateName(`${template.name} Copy`);
                        setShowDuplicateModal(template.id);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDeleteModal(template.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <FileImage className="w-7 h-7 mr-2 text-brand" />
              Content Templates
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage reusable content templates for digital displays
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public-only"
                  checked={showPublicOnly}
                  onCheckedChange={setShowPublicOnly}
                />
                <Label htmlFor="public-only" className="text-sm">Public only</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="favorites-only"
                  checked={showFavoritesOnly}
                  onCheckedChange={setShowFavoritesOnly}
                />
                <Label htmlFor="favorites-only" className="text-sm">Favorites only</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-500">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileImage className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {templates.length === 0 
                ? "Get started by creating your first template."
                : "Try adjusting your filters or search terms."
              }
            </p>
            {templates.length === 0 && (
              <div className="mt-6">
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              {filteredTemplates.length} of {templates.length} templates
            </div>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </>
        )}

        {/* Create Template Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a new content template that can be reused for multiple projects.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Name *</Label>
                  <Input
                    id="template-name"
                    placeholder="Template name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="template-category">Category</Label>
                  <Select 
                    value={createForm.category} 
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category} className="capitalize">
                          {category.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  placeholder="Template description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Canvas Size</Label>
                <Select 
                  value={`${createForm.canvasSize.width}x${createForm.canvasSize.height}`}
                  onValueChange={(value) => {
                    const preset = CANVAS_PRESETS.find(p => `${p.width}x${p.height}` === value);
                    if (preset && preset.width > 0) {
                      setCreateForm(prev => ({ 
                        ...prev, 
                        canvasSize: { width: preset.width, height: preset.height }
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANVAS_PRESETS.filter(p => p.width > 0).map((preset) => (
                      <SelectItem key={`${preset.width}x${preset.height}`} value={`${preset.width}x${preset.height}`}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="template-public"
                  checked={createForm.isPublic}
                  onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, isPublic: !!checked }))}
                />
                <Label htmlFor="template-public">Make this template public</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!showDeleteModal} onOpenChange={() => setShowDeleteModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this template? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => showDeleteModal && handleDeleteTemplate(showDeleteModal)}
              >
                Delete Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Duplicate Template Modal */}
        <Dialog open={!!showDuplicateModal} onOpenChange={() => setShowDuplicateModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Duplicate Template</DialogTitle>
              <DialogDescription>
                Create a copy of this template with a new name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="duplicate-name">New Template Name</Label>
                <Input
                  id="duplicate-name"
                  placeholder="Template name"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDuplicateModal(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => showDuplicateModal && handleDuplicateTemplate(showDuplicateModal)}
              >
                Duplicate Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 