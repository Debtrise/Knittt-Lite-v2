'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { ContentCreatorWrapper } from '@/app/components/content-creator/ContentCreatorWrapper';
import { ContentCreator } from '@/app/components/content-creator/ContentCreator';
import { useContentStore } from '@/app/store/contentStore';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft, Loader2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/app/lib/api';

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  contentType: string;
  isTemplate: boolean;
  templateCategory: string;
  template: {
    background: {
      type: string;
      value: string;
    };
    elements: Array<{
      type: string;
      content: string;
      position: { x: number; y: number };
      size?: { width: number; height: number };
      style?: Record<string, any>;
    }>;
    animations?: Array<{
      element: number;
      type: string;
      duration: number;
      delay?: number;
      easing?: string;
    }>;
    duration: number;
  };
  variables: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  usageCount?: number;
}

// Component that integrates OptSigns content with the ContentCreator
function ContentCreatorWithOptSignsIntegration({ 
  contentId, 
  content, 
  onSave, 
  onCancel 
}: { 
  contentId: string; 
  content: ContentTemplate; 
  onSave: (data: any) => void; 
  onCancel: () => void; 
}) {
  const {
    currentProject,
    setCurrentProject,
    loadAssets,
    loadVariables,
    isLoading,
    error
  } = useContentStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeWithContent = async () => {
      try {
        setInitError(null);
        
        // Load necessary data
        await Promise.allSettled([
          loadAssets().catch(err => console.warn('Assets loading failed:', err)),
          loadVariables().catch(err => console.warn('Variables loading failed:', err))
        ]);

        // Convert OptSigns content to ContentCreator project format
        const projectData = {
          id: contentId,
          name: content.name,
          description: content.description,
          status: 'draft' as const,
          version: 1,
          canvasSize: { width: 1920, height: 1080 },
          canvasBackground: content.template.background.type === 'solid' 
            ? { type: 'solid' as const, color: content.template.background.value }
            : { type: 'solid' as const, color: '#ffffff' },
          elements: content.template.elements.map((element, index) => ({
            id: `element-${index}`,
            elementType: mapOptSignsTypeToContentCreator(element.type),
            position: { ...element.position, z: index },
            size: element.size || { width: 200, height: 100 },
            properties: {
              text: element.content,
              content: element.content,
              ...element.style
            },
            styles: element.style || {},
            layerOrder: index,
            opacity: 1,
            isVisible: true,
            isLocked: false
          })),
          variables: content.variables,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt || content.createdAt,
          lastEditedBy: 1 // Default user ID
        };

        setCurrentProject(projectData);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize content creator with OptSigns content:', error);
        setInitError((error as Error).message);
      }
    };

    if (!isInitialized && !initError) {
      initializeWithContent();
    }
  }, [contentId, content, setCurrentProject, loadAssets, loadVariables, isInitialized, initError]);

  const mapOptSignsTypeToContentCreator = (type: string) => {
    const typeMap: Record<string, string> = {
      'text': 'text',
      'image': 'image',
      'video': 'video',
      'button': 'button',
      'shape': 'shape'
    };
    return typeMap[type] || 'text';
  };

  if (!isInitialized) {
    if (initError) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center p-8">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">Initialization Failed</h2>
            <p className="text-red-600 mb-4">{initError}</p>
            <div className="space-x-2">
              <Button onClick={() => { setInitError(null); setIsInitialized(false); }}>
                Retry
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Content Editor</h2>
          <p className="text-gray-600">Preparing your content for editing...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-8">
          <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Content Not Available</h2>
          <p className="text-gray-600 mb-4">Unable to load the content for editing.</p>
          <Button onClick={onCancel}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Custom toolbar for OptSigns content editing */}
      <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <span className="text-sm text-gray-600">Editing: {content.name}</span>
        </div>
        <Button 
          size="sm" 
          onClick={() => {
            if (currentProject) {
              onSave(currentProject);
            }
          }}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
      
      {/* Content Creator */}
      <ContentCreator />
    </div>
  );
}

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;
  
  const [content, setContent] = useState<ContentTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contentId) {
      fetchContent();
    }
  }, [contentId]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/optisigns/content/${contentId}`);
      
      if (response.success) {
        setContent(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch content');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError((error as Error).message);
      toast.error('Failed to load content for editing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToContent = () => {
    router.push(`/optisigns/content/${contentId}`);
  };

  const handleBackToList = () => {
    router.push('/optisigns/content');
  };

  const handleSaveContent = async (projectData: any) => {
    try {
      // Convert ContentCreator project data back to OptSigns format
      const updatedContent = {
        ...content,
        name: projectData.name,
        description: projectData.description,
        template: {
          background: projectData.canvasBackground,
          elements: projectData.elements.map((element: any) => ({
            type: element.elementType,
            content: element.properties.text || element.properties.content || '',
            position: element.position,
            size: element.size,
            style: element.styles
          })),
          duration: projectData.duration || 30
        },
        variables: projectData.variables
      };

      const response = await api.put(`/optisigns/content/${contentId}`, updatedContent);
      
      if (response.success) {
        toast.success('Content updated successfully!');
        router.push(`/optisigns/content/${contentId}`);
      } else {
        throw new Error(response.error || 'Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content: ' + (error as Error).message);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading content for editing...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !content) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Content
            </Button>
            <h1 className="text-2xl font-bold">Edit Content</h1>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Content</h2>
            <p className="text-red-600 mb-4">
              {error || 'Content not found or failed to load'}
            </p>
            <div className="space-x-2">
              <Button 
                variant="outline"
                onClick={fetchContent}
              >
                Try Again
              </Button>
              <Button 
                variant="ghost"
                onClick={handleBackToList}
              >
                Back to Content List
              </Button>
            </div>
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
                onClick={handleBackToContent}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Details
              </Button>
              <div>
                <h1 className="text-xl font-bold">Edit Content</h1>
                <p className="text-sm text-gray-600">{content.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleBackToList}
              >
                Content List
              </Button>
            </div>
          </div>
        </div>

        {/* Content Creator */}
        <div className="h-[calc(100vh-120px)]">
          <ContentCreatorWithOptSignsIntegration 
            contentId={contentId}
            content={content}
            onSave={handleSaveContent}
            onCancel={handleBackToContent}
          />
        </div>
      </div>
    </DashboardLayout>
  );
} 