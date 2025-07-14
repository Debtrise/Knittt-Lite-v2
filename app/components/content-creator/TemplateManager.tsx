'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { 
  FileImage, Plus, Edit, Trash2, Copy, Search, Filter, Eye,
  Download, Upload, Grid3X3, List, MoreVertical, Star, StarOff,
  Calendar, User, Tag, Share2, Lock, Unlock, Settings,
  ArrowUpRight, CheckCircle, Clock, Globe, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useContentStore } from '../../store/contentStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  canvasSize: {
    width: number;
    height: number;
  };
  templateData?: {
    elements: any[];
    canvasBackground: any;
  };
  variables?: Record<string, any>;
  previewImage?: string;
  usageCount: number;
  isPublic: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  author?: string;
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
  tags?: string[];
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

const SORT_OPTIONS = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'created', label: 'Recently Created' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'usage', label: 'Most Used' },
  { value: 'favorite', label: 'Favorites First' }
];

export interface TemplateManagerProps {
  compact?: boolean;
  onTemplateSelect?: (template: ContentTemplate) => void;
  showCreateButton?: boolean;
}

export function TemplateManager({ 
  compact = false, 
  onTemplateSelect,
  showCreateButton = true 
}: TemplateManagerProps) {
  const router = useRouter();
  const { templates, loadTemplates, isLoading } = useContentStore();
  
  const [filteredTemplates, setFilteredTemplates] = useState<ContentTemplate[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated');
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateTemplateData>({
    name: '',
    description: '',
    category: 'custom',
    canvasSize: { width: 1920, height: 1080 },
    isPublic: false,
    tags: []
  });
  const [duplicateName, setDuplicateName] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Load templates
  const loadTemplateData = useCallback(async () => {
    try {
      await loadTemplates();
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    }
  }, [loadTemplates]);

  // Filter and sort templates
  useEffect(() => {
    let filtered = [...templates];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query) ||
        template.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply visibility filters
    if (showPublicOnly) {
      filtered = filtered.filter(template => template.isPublic);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(template => template.isFavorite);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'favorite':
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, sortBy, showPublicOnly, showFavoritesOnly]);

  // Load templates on mount
  useEffect(() => {
    loadTemplateData();
  }, [loadTemplateData]);

  // Template operations
  const handleCreateTemplate = async () => {
    try {
      if (!createForm.name.trim()) {
        toast.error('Template name is required');
        return;
      }

      const response = await fetch('/api/content/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          tags: createForm.tags || []
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      const result = await response.json();
      
      toast.success('Template created successfully');
      setShowCreateModal(false);
      resetCreateForm();
      
      await loadTemplateData();
      
      // Navigate to edit the new template
      if (result.template?.id) {
        router.push(`/content-creator/templates/${result.template.id}/edit`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/content/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      toast.success('Template deleted successfully');
      setShowDeleteModal(null);
      await loadTemplateData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      if (!duplicateName.trim()) {
        toast.error('Template name is required');
        return;
      }

      const response = await fetch(`/api/content/templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: duplicateName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate template');
      }

      toast.success('Template duplicated successfully');
      setShowDuplicateModal(null);
      setDuplicateName('');
      await loadTemplateData();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleToggleFavorite = async (template: ContentTemplate) => {
    try {
      const response = await fetch(`/api/content/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...template,
          isFavorite: !template.isFavorite
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      await loadTemplateData();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleUseTemplate = (template: ContentTemplate) => {
    if (isUsingTemplate) {
      console.log('Template usage already in progress, ignoring duplicate request');
      return;
    }
    
    console.log('Using template:', template.id, template.name);
    setIsUsingTemplate(true);
    
    if (onTemplateSelect) {
      onTemplateSelect(template);
    } else {
      // Use replace instead of push to avoid creating multiple history entries
      router.replace(`/content-creator?template=${template.id}`);
    }
    
    // Reset the flag after a delay to allow for navigation
    setTimeout(() => {
      setIsUsingTemplate(false);
    }, 2000);
  };

  const handleEditTemplate = (templateId: string) => {
    router.push(`/content-creator/templates/${templateId}/edit`);
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      category: 'custom',
      canvasSize: { width: 1920, height: 1080 },
      isPublic: false,
      tags: []
    });
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !createForm.tags?.includes(tagInput.trim())) {
      setCreateForm(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCreateForm(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Templates</h3>
          <Badge variant="secondary" className="text-xs">
            {filteredTemplates.length}
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="p-3 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleUseTemplate(template)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  <FileImage className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{template.name}</p>
                  <p className="text-xs text-gray-500 truncate">{template.category}</p>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {template.usageCount}
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <FileImage className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No templates found</p>
            {showCreateButton && (
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Create Template
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileImage className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Template Manager</h2>
          <Badge variant="secondary">{filteredTemplates.length} templates</Badge>
        </div>
        {showCreateButton && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Category" />
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

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="public-only"
              checked={showPublicOnly}
              onCheckedChange={setShowPublicOnly}
            />
            <Label htmlFor="public-only" className="text-sm">Public</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="favorites-only"
              checked={showFavoritesOnly}
              onCheckedChange={setShowFavoritesOnly}
            />
            <Label htmlFor="favorites-only" className="text-sm">Favorites</Label>
          </div>

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

      {/* Templates Grid/List */}
      {isLoading ? (
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
          {templates.length === 0 && showCreateButton && (
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
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500 line-clamp-2">
                          {template.description}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(template);
                          }}
                        >
                          {template.isFavorite ? (
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-3 w-3 text-gray-400" />
                          )}
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                              <ArrowUpRight className="h-4 w-4 mr-2" />
                              Use Template
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setDuplicateName(`${template.name} Copy`);
                              setShowDuplicateModal(template.id);
                            }}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setShowShareModal(template.id)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setShowDeleteModal(template.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-2">
                    {/* Preview Area */}
                    <div 
                      className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-3 cursor-pointer"
                      onClick={() => handleUseTemplate(template)}
                    >
                      {template.previewImage ? (
                        <img 
                          src={template.previewImage} 
                          alt={template.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <FileImage className="h-6 w-6 mx-auto mb-1" />
                          <span className="text-xs">No preview</span>
                        </div>
                      )}
                    </div>

                    {/* Template Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="secondary" className="capitalize text-xs">
                          {template.category.replace('_', ' ')}
                        </Badge>
                        <span className="text-gray-500">
                          {template.canvasSize.width}×{template.canvasSize.height}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span>{template.usageCount} uses</span>
                          {template.isPublic && (
                            <Globe className="h-3 w-3" title="Public template" />
                          )}
                        </div>
                        <span>{formatDate(template.updatedAt)}</span>
                      </div>

                      {/* Tags */}
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-1 pt-1">
                        <Button 
                          size="sm" 
                          onClick={() => handleUseTemplate(template)}
                          className="flex-1 h-7 text-xs"
                        >
                          Use Template
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditTemplate(template.id)}
                          className="h-7 px-2"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        <FileImage className="h-4 w-4 text-gray-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{template.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{template.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {template.category.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {template.canvasSize.width}×{template.canvasSize.height}
                          </span>
                          <span className="text-xs text-gray-500">
                            {template.usageCount} uses
                          </span>
                          {template.isPublic && (
                            <Globe className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-xs text-gray-500 hidden sm:block">
                        {formatDate(template.updatedAt)}
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(template)}
                      >
                        {template.isFavorite ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      
                      <Button 
                        size="sm" 
                        onClick={() => handleUseTemplate(template)}
                      >
                        Use Template
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setDuplicateName(`${template.name} Copy`);
                            setShowDuplicateModal(template.id);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setShowShareModal(template.id)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setShowDeleteModal(template.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Template Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for your content projects.
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

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              {createForm.tags && createForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {createForm.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              resetCreateForm();
            }}>
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
                placeholder="Enter template name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDuplicateModal(null);
              setDuplicateName('');
            }}>
              Cancel
            </Button>
            <Button onClick={() => showDuplicateModal && handleDuplicateTemplate(showDuplicateModal)}>
              Duplicate Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Template Modal */}
      <Dialog open={!!showShareModal} onOpenChange={() => setShowShareModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Template</DialogTitle>
            <DialogDescription>
              Share this template with others or make it public.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Sharing features will be available soon!
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowShareModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 