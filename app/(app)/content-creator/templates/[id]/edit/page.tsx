'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { ContentCreator } from '@/app/components/content-creator/ContentCreator';
import { useContentStore } from '@/app/store/contentStore';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { ArrowLeft, Loader2, Save, Settings, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TemplateEditProps {
  template: any;
  onSave: (templateData: any) => void;
  onCancel: () => void;
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

function TemplateEditorWithSettings({ 
  template, 
  onSave, 
  onCancel 
}: TemplateEditProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [templateSettings, setTemplateSettings] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'custom',
    isPublic: template?.isPublic || false
  });

  const {
    currentProject,
    elements,
    canvasSize,
    canvasBackground,
    variables,
    updateTemplate,
    isLoading
  } = useContentStore();

  const handleSaveTemplate = async () => {
    try {
      if (!currentProject) {
        toast.error('No project loaded');
        return;
      }

      const templateData = {
        ...templateSettings,
        canvasSize,
        templateData: {
          elements: elements.map(element => ({
            elementType: element.elementType,
            position: element.position,
            size: element.size,
            properties: element.properties,
            styles: element.styles,
            animations: element.animations || [],
            layerOrder: element.layerOrder,
            opacity: element.opacity || 1,
            assetId: element.assetId,
            metadata: element.metadata,
            isLocked: element.isLocked,
            isVisible: element.isVisible,
            groupId: element.groupId,
            constraints: element.constraints
          })),
          canvasBackground: canvasBackground
        },
        variables: variables || {},
        updatedAt: new Date().toISOString()
      };

      await updateTemplate(template.id, templateData);
      onSave(templateData);
      toast.success('Template updated successfully');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  return (
    <div className="relative h-full">
      {/* Custom toolbar for template editing */}
      <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-center bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <span className="text-sm text-gray-600">Editing Template: {templateSettings.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button 
            size="sm" 
            onClick={handleSaveTemplate}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Template
          </Button>
        </div>
      </div>
      
      {/* Content Creator */}
      <ContentCreator />

      {/* Template Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Name *</Label>
                <Input
                  id="template-name"
                  placeholder="Template name"
                  value={templateSettings.name}
                  onChange={(e) => setTemplateSettings(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Select 
                  value={templateSettings.category} 
                  onValueChange={(value) => setTemplateSettings(prev => ({ ...prev, category: value }))}
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
                value={templateSettings.description}
                onChange={(e) => setTemplateSettings(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="template-public"
                checked={templateSettings.isPublic}
                onCheckedChange={(checked) => setTemplateSettings(prev => ({ ...prev, isPublic: !!checked }))}
              />
              <Label htmlFor="template-public">Make this template public</Label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Template Information:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Canvas Size: {canvasSize.width}×{canvasSize.height}</li>
                <li>• Elements: {elements.length}</li>
                <li>• Variables: {Object.keys(variables).length}</li>
                <li>• Last Modified: {new Date().toLocaleDateString()}</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowSettings(false)}>
              Apply Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { loadTemplate, createProject, loadProject, createElement } = useContentStore();

  useEffect(() => {
    const initializeTemplateEditor = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load the template
        const templateData = await loadTemplate(templateId);
        setTemplate(templateData);

        // Create a temporary project from the template for editing
        const tempProject = await createProject({
          name: `Editing: ${templateData.name}`,
          description: `Temporary project for editing template: ${templateData.name}`,
          canvasSize: templateData.canvasSize,
          canvasBackground: templateData.templateData?.canvasBackground || { type: 'solid', color: '#ffffff' },
          variables: templateData.variables || {},
          templateId: templateId
        });

        await loadProject(tempProject.id);

        // Load template elements into the project
        if (templateData.templateData?.elements) {
          for (const templateElement of templateData.templateData.elements) {
            await createElement({
              elementType: templateElement.elementType,
              position: templateElement.position,
              size: templateElement.size,
              properties: templateElement.properties,
              styles: templateElement.styles,
              animations: templateElement.animations,
              layerOrder: templateElement.layerOrder,
              opacity: templateElement.opacity,
              assetId: templateElement.assetId,
              metadata: templateElement.metadata,
              isLocked: templateElement.isLocked,
              isVisible: templateElement.isVisible,
              groupId: templateElement.groupId,
              constraints: templateElement.constraints
            });
          }
        }

        toast.success(`Template "${templateData.name}" loaded for editing`);
      } catch (error) {
        console.error('Failed to load template for editing:', error);
        setError('Failed to load template');
        toast.error('Failed to load template for editing');
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      initializeTemplateEditor();
    }
      }, [templateId, loadTemplate, createProject, loadProject, createElement]);

  const handleSaveTemplate = (templateData: any) => {
    toast.success('Template saved successfully');
    router.push('/content-creator/templates');
  };

  const handleCancel = () => {
    router.push('/content-creator/templates');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading template for editing...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !template) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load template</h3>
            <p className="text-gray-600 mb-4">{error || 'Template not found'}</p>
            <Button onClick={() => router.push('/content-creator/templates')}>
              Back to Templates
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Templates
              </Button>
              <div>
                <h1 className="text-xl font-bold">Edit Template</h1>
                <p className="text-sm text-gray-600">{template.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Template Editor */}
        <div className="h-[calc(100vh-120px)]">
          <TemplateEditorWithSettings 
            template={template}
            onSave={handleSaveTemplate}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </DashboardLayout>
  );
} 