'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  FileImage, Search, Star, StarOff, Eye, Play, Grid3X3, List,
  Calendar, Globe, Users, Tag, Filter, SortAsc
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useContentStore } from '../../store/contentStore';

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  canvasSize: { width: number; height: number };
  previewImage?: string;
  usageCount: number;
  isPublic: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

interface TemplateBrowserProps {
  onTemplateSelect?: (template: ContentTemplate) => void;
  onTemplatePreview?: (template: ContentTemplate) => void;
  mode?: 'panel' | 'modal';
  showFavorites?: boolean;
  compact?: boolean;
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

export function TemplateBrowser({ 
  onTemplateSelect,
  onTemplatePreview,
  mode = 'panel',
  showFavorites = false,
  compact = false
}: TemplateBrowserProps) {
  const { templates, loadTemplates, isLoading } = useContentStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'usage' | 'name'>('updated');
  const [filteredTemplates, setFilteredTemplates] = useState<ContentTemplate[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ContentTemplate | null>(null);

  // Load templates on mount
  useEffect(() => {
    loadTemplates().catch(console.error);
  }, [loadTemplates]);

  // Filter and sort templates
  useEffect(() => {
    let filtered = [...templates];

    // Apply favorites filter if enabled
    if (showFavorites) {
      filtered = filtered.filter(template => template.isFavorite);
    }

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
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, sortBy, showFavorites]);

  const handleTemplateSelect = (template: ContentTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
    toast.success(`Selected template: ${template.name}`);
  };

  const handleTemplatePreview = (template: ContentTemplate) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
    if (onTemplatePreview) {
      onTemplatePreview(template);
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

      await loadTemplates();
      toast.success(template.isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update favorite status');
    }
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

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredTemplates.slice(0, 5).map((template) => (
            <Card 
              key={template.id} 
              className="p-2 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-5 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  <FileImage className="w-3 h-3 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate">{template.name}</p>
                  <p className="text-xs text-gray-500 truncate">{template.category}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <FileImage className="w-6 h-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">No templates found</p>
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
          <h3 className="font-medium">
            {showFavorites ? 'Favorite Templates' : 'Template Browser'}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {filteredTemplates.length}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid3X3 className="h-3 w-3" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 w-8 p-0"
          >
            <List className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8 text-sm"
          />
        </div>
        
        <div className="flex space-x-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category} className="capitalize text-sm">
                  {category.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="created">Recently Created</SelectItem>
              <SelectItem value="usage">Most Used</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-500">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileImage className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No templates found</p>
          {searchQuery && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'} max-h-96 overflow-y-auto`}>
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className={`${viewMode === 'grid' ? 'overflow-hidden' : 'p-3'} hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => handleTemplateSelect(template)}
            >
              {viewMode === 'grid' ? (
                <>
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {template.name}
                        </CardTitle>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {template.description}
                        </p>
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
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplatePreview(template);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-3 pt-0">
                    {/* Preview Image */}
                    <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center">
                      {template.previewImage ? (
                        <img 
                          src={template.previewImage} 
                          alt={template.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <FileImage className="h-4 w-4 mx-auto mb-1" />
                          <span className="text-xs">No preview</span>
                        </div>
                      )}
                    </div>

                    {/* Template Info */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="secondary" className="capitalize text-xs">
                          {template.category.replace('_', ' ')}
                        </Badge>
                        <span className="text-gray-500">
                          {template.canvasSize.width}×{template.canvasSize.height}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{template.usageCount}</span>
                          {template.isPublic && <Globe className="h-3 w-3" />}
                        </div>
                        <span>{formatDate(template.updatedAt)}</span>
                      </div>

                      {/* Action Button */}
                      <Button 
                        size="sm" 
                        className="w-full h-6 text-xs mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateSelect(template);
                        }}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <FileImage className="h-3 w-3 text-gray-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{template.name}</h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Badge variant="secondary" className="text-xs">
                          {template.category.replace('_', ' ')}
                        </Badge>
                        <span>{template.usageCount} uses</span>
                        {template.isPublic && <Globe className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 flex-shrink-0">
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
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplatePreview(template);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    
                    <Button 
                      size="sm" 
                      className="h-6 text-xs px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplateSelect(template);
                      }}
                    >
                      Use
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Template Preview: {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-4">
              {/* Template Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-medium">{previewTemplate.name}</h3>
                  <p className="text-sm text-gray-600">{previewTemplate.description}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Badge variant="secondary" className="text-xs">
                      {previewTemplate.category.replace('_', ' ')}
                    </Badge>
                    <span>{previewTemplate.canvasSize.width}×{previewTemplate.canvasSize.height}</span>
                    <span>{previewTemplate.usageCount} uses</span>
                    {previewTemplate.isPublic && (
                      <div className="flex items-center space-x-1">
                        <Globe className="h-3 w-3" />
                        <span>Public</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(previewTemplate)}
                  >
                    {previewTemplate.isFavorite ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button onClick={() => {
                    handleTemplateSelect(previewTemplate);
                    setShowPreviewModal(false);
                  }}>
                    <Play className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </div>
              </div>

              {/* Preview Image */}
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-64">
                {previewTemplate.previewImage ? (
                  <img 
                    src={previewTemplate.previewImage} 
                    alt={previewTemplate.name}
                    className="max-w-full max-h-96 object-contain rounded"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <FileImage className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-sm">No preview available</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {previewTemplate.tags && previewTemplate.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {previewTemplate.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 