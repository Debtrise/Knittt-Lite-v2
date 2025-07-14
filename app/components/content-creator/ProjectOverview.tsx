'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useContentStore } from '../../store/contentStore';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Copy, 
  Trash2, 
  Eye, 
  Calendar, 
  User, 
  Layers,
  FileText,
  Monitor,
  Loader2,
  AlertCircle,
  Grid3X3,
  List,
  Star,
  StarOff,
  Layout,
  Play
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ContentProject } from '../../store/contentStore';

interface ProjectOverviewProps {
  onProjectSelect: (projectId: string) => void;
}

interface CreateProjectForm {
  name: string;
  description: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  templateId?: string;
}

const CANVAS_PRESETS = [
  { name: 'HD Landscape', width: 1920, height: 1080, description: 'Standard HD display' },
  { name: 'HD Portrait', width: 1080, height: 1920, description: 'Vertical HD display' },
  { name: '4K Landscape', width: 3840, height: 2160, description: 'Ultra HD display' },
  { name: 'Square', width: 1080, height: 1080, description: 'Social media format' },
  { name: 'Custom', width: 1920, height: 1080, description: 'Custom dimensions' }
];

export function ProjectOverview({ onProjectSelect }: ProjectOverviewProps) {
  const {
    projects,
    templates,
    isLoading,
    error,
    loadProjects,
    loadTemplates,
    createProject,
    deleteProject,
    duplicateProject,
    updateProject,
    deleteTemplate,
    updateTemplate
  } = useContentStore();

  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'projects' | 'templates'>('projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTemplateDeleteDialog, setShowTemplateDeleteDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ContentProject | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);

  const [createForm, setCreateForm] = useState<CreateProjectForm>({
    name: '',
    description: '',
    canvasWidth: 1920,
    canvasHeight: 1080,
    backgroundColor: '#ffffff',
    templateId: undefined
  });

  useEffect(() => {
    loadProjects();
    loadTemplates().catch(console.warn);
  }, [loadProjects, loadTemplates]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = templateCategoryFilter === 'all' || template.category === templateCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const templateCategories = [...new Set(templates.map(t => t.category))];

  const handleCreateProject = async () => {
    if (!createForm.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setIsCreating(true);
    try {
      const newProject = await createProject({
        name: createForm.name,
        description: createForm.description,
        canvasSize: { width: createForm.canvasWidth, height: createForm.canvasHeight },
        canvasBackground: { type: 'solid', color: createForm.backgroundColor },
        variables: {},
        templateId: createForm.templateId === 'scratch' ? undefined : createForm.templateId
      });

      toast.success('Project created successfully');
      setShowCreateDialog(false);
      setCreateForm({
        name: '',
        description: '',
        canvasWidth: 1920,
        canvasHeight: 1080,
        backgroundColor: '#ffffff',
        templateId: undefined
      });
      
      await loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    setIsDeleting(true);
    try {
      await deleteProject(selectedProject.id);
      toast.success('Project deleted successfully');
      setShowDeleteDialog(false);
      setSelectedProject(null);
      await loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateProject = async (project: ContentProject) => {
    try {
      const newName = `${project.name} (Copy)`;
      await duplicateProject(project.id, newName);
      toast.success('Project duplicated successfully');
      await loadProjects();
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      toast.error('Failed to duplicate project');
    }
  };

  // Template management methods
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    setIsDeleting(true);
    try {
      await deleteTemplate(selectedTemplate.id);
      toast.success('Template deleted successfully');
      setShowTemplateDeleteDialog(false);
      setSelectedTemplate(null);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleTemplateFavorite = async (template: any) => {
    try {
      await updateTemplate(template.id, {
        ...template,
        isFavorite: !template.isFavorite
      });
      await loadTemplates();
      toast.success(template.isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const handleUseTemplate = (templateId: string) => {
    if (isUsingTemplate) {
      console.log('Template usage already in progress, ignoring duplicate request');
      return;
    }
    
    console.log('Using template:', templateId);
    setIsUsingTemplate(true);
    
    // Use replace instead of push to avoid creating multiple history entries
    router.replace(`/content-creator?template=${templateId}`);
    
    // Reset the flag after a delay to allow for navigation
    setTimeout(() => {
      setIsUsingTemplate(false);
    }, 2000);
  };

  const handleEditTemplate = (templateId: string) => {
    router.push(`/content-creator/templates/${templateId}/edit`);
  };

  const handleDuplicateTemplate = async (template: any) => {
    try {
      // Use the API duplicate method
      const response = await fetch(`/api/content/templates/${template.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${template.name} Copy`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate template');
      }

      toast.success('Template duplicated successfully');
      await loadTemplates();
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleCanvasPresetChange = (preset: string) => {
    const presetData = CANVAS_PRESETS.find(p => p.name === preset);
    if (presetData) {
      setCreateForm(prev => ({
        ...prev,
        canvasWidth: presetData.width,
        canvasHeight: presetData.height
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96 p-6">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-900">Error Loading Projects</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <Button onClick={loadProjects}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fullscreen Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Exit to Dashboard Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              className="text-gray-600 hover:text-gray-900"
              title="Exit to Dashboard"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Dashboard
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-2xl font-bold">Content Creator</h1>
              <p className="text-sm text-muted-foreground">
                Create and manage your digital signage content projects and templates
              </p>
            </div>
          </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Set up a new content project with your preferred settings
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="name"
                  className="col-span-3"
                  placeholder="My awesome project"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  className="col-span-3"
                  placeholder="Describe your project..."
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="preset" className="text-right">
                  Canvas Size
                </Label>
                <div className="col-span-3 space-y-2">
                  <Select onValueChange={handleCanvasPresetChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a preset or choose custom" />
                    </SelectTrigger>
                    <SelectContent>
                      {CANVAS_PRESETS.map((preset) => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.name} - {preset.width}x{preset.height}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Width"
                      value={createForm.canvasWidth}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, canvasWidth: parseInt(e.target.value) || 1920 }))}
                    />
                    <span className="flex items-center">×</span>
                    <Input
                      type="number"
                      placeholder="Height"
                      value={createForm.canvasHeight}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, canvasHeight: parseInt(e.target.value) || 1080 }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="backgroundColor" className="text-right">
                  Background
                </Label>
                <Input
                  id="backgroundColor"
                  type="color"
                  className="col-span-3 h-10"
                  value={createForm.backgroundColor}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, backgroundColor: e.target.value }))}
                />
              </div>
              
              {templates && templates.length > 0 && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="template" className="text-right">
                    Template
                  </Label>
                  <Select onValueChange={(value) => setCreateForm(prev => ({ ...prev, templateId: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Start from scratch or choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scratch">Start from scratch</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'projects' | 'templates')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Projects ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Templates ({templates.length})
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
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

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first project'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                viewMode === 'list' ? 'flex flex-row items-center p-4' : ''
              }`}
              onClick={() => onProjectSelect(project.id)}
            >
              {viewMode === 'grid' ? (
                <>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                        <Badge className={`mt-2 ${getStatusColor(project.status)}`}>
                          {project.status}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onProjectSelect(project.id);
                          }}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateProject(project);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(project);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <CardDescription className="line-clamp-2 mb-4">
                      {project.description || 'No description'}
                    </CardDescription>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>{project.canvasSize.width}×{project.canvasSize.height}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        <span>{project.elements?.length || 0} elements</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Updated {formatDate(project.updatedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {project.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {project.canvasSize.width}×{project.canvasSize.height}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {project.elements?.length || 0} elements
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(project.updatedAt)}
                    </span>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onProjectSelect(project.id);
                        }}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateProject(project);
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(project);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            {/* Template Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={templateCategoryFilter} onValueChange={setTemplateCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {templateCategories.map((category) => (
                      <SelectItem key={category} value={category} className="capitalize">
                        {category.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push('/content-creator/templates')}
                  variant="outline"
                  size="sm"
                >
                  Manage Templates
                </Button>
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
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || templateCategoryFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first template'
                  }
                </p>
                {!searchTerm && templateCategoryFilter === 'all' && (
                  <Button onClick={() => router.push('/content-creator/templates')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Template
                  </Button>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
              }>
                {filteredTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      viewMode === 'list' ? 'flex flex-row items-center p-4' : ''
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                              <Badge className="mt-2 capitalize bg-blue-100 text-blue-800">
                                {template.category.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTemplateFavorite(template);
                                }}
                              >
                                {template.isFavorite ? (
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ) : (
                                  <StarOff className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleUseTemplate(template.id)}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Use Template
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => {
                                      setSelectedTemplate(template);
                                      setShowTemplateDeleteDialog(true);
                                    }}
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
                          <CardDescription className="line-clamp-2 mb-4">
                            {template.description || 'No description'}
                          </CardDescription>
                          
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              <span>{template.canvasSize.width}×{template.canvasSize.height}px</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4" />
                              <span>{template.templateData?.elements?.length || 0} elements</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              <span>{template.usageCount} uses</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" onClick={() => handleUseTemplate(template.id)} className="flex-1">
                              <Play className="h-3 w-3 mr-1" />
                              Use
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template.id)}>
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <h3 className="font-medium flex items-center gap-2">
                              {template.name}
                              {template.isFavorite && (
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {template.description || 'No description'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Badge className="capitalize bg-blue-100 text-blue-800">
                            {template.category.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {template.canvasSize.width}×{template.canvasSize.height}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {template.templateData?.elements?.length || 0} elements
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {template.usageCount} uses
                          </span>
                          
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleUseTemplate(template.id)}>
                              <Play className="h-3 w-3 mr-1" />
                              Use
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template.id)}>
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleTemplateFavorite(template)}>
                                  {template.isFavorite ? (
                                    <>
                                      <StarOff className="h-4 w-4 mr-2" />
                                      Remove from Favorites
                                    </>
                                  ) : (
                                    <>
                                      <Star className="h-4 w-4 mr-2" />
                                      Add to Favorites
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedTemplate(template);
                                    setShowTemplateDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Delete Confirmation Dialog */}
      <Dialog open={showTemplateDeleteDialog} onOpenChange={setShowTemplateDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone and will affect any projects using this template.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
