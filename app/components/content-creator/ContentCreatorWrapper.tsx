'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ContentCreator } from './ContentCreator';
import { ProjectOverview } from './ProjectOverview';
import { useContentStore } from '../../store/contentStore';
import { Card } from '../ui/card';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface ContentCreatorWrapperProps {
  projectId?: string;
  templateId?: string;
}

export function ContentCreatorWrapper({ projectId, templateId }: ContentCreatorWrapperProps) {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectId || null);
  const initializingRef = useRef(false);
  
  const {
    currentProject,
    isLoading,
    error,
    loadProjects,
    loadProject,
    createProject,
    loadAssets,
    loadVariables,
    loadTemplates,
    setError,
    setCurrentProject
  } = useContentStore();

  // Handle prop changes (when URL parameters change)
  useEffect(() => {
    if (projectId !== selectedProjectId) {
      console.log('Project ID changed from', selectedProjectId, 'to', projectId);
      setSelectedProjectId(projectId || null);
      setIsInitialized(false);
      setInitError(null);
      initializingRef.current = false; // Reset the initialization flag
    }
  }, [projectId, selectedProjectId]);

  // Handle initialization
  useEffect(() => {
    const initializeContentCreator = async () => {
      console.log('Initializing ContentCreator with:', { selectedProjectId, templateId, isInitialized, initError, initializingInProgress: initializingRef.current });
      
      if (isInitialized || initError || initializingRef.current) {
        console.log('Skipping initialization - already initialized, has error, or in progress');
        return;
      }

      initializingRef.current = true;

      try {
        const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) => 
              setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
            )
          ]);
        };

        console.log('Loading initial data...');
        await withTimeout(Promise.all([
          loadAssets(),
          loadVariables(), 
          loadTemplates(),
          loadProjects()
        ]), 20000);

        // Handle project loading/creation with timeout only if a specific project is requested
        if (selectedProjectId) {
          console.log('Loading specific project:', selectedProjectId);
          await withTimeout(loadProject(selectedProjectId), 10000);
        } else if (templateId) {
          console.log('Creating project from template:', templateId);
          const newProject = await withTimeout(createProject({
            name: 'New Project from Template',
            description: 'Created from template',
            templateId: templateId,
            canvasSize: { width: 1920, height: 1080 },
            canvasBackground: { type: 'solid', color: '#ffffff' },
            variables: {}
          }), 15000);
          console.log('Project created from template:', newProject.id);
          setSelectedProjectId(newProject.id);
          await withTimeout(loadProject(newProject.id), 10000);
          console.log('Project loaded successfully:', newProject.id);
        }
        // If no projectId or templateId, just show the overview

        setIsInitialized(true);
        console.log('Content creator initialized successfully');
      } catch (error) {
        console.error('Failed to initialize content creator:', error);
        setInitError((error as Error).message);
      } finally {
        initializingRef.current = false;
      }
    };

    initializeContentCreator();
  }, [selectedProjectId, templateId, isInitialized, initError, loadAssets, loadVariables, loadTemplates, loadProjects, loadProject, createProject]);

  // Add a fallback timeout to prevent infinite loading
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (!isInitialized && !initError) {
        console.warn('Initialization taking too long, showing Content Creator anyway');
        setIsInitialized(true);
      }
    }, 30000); // 30 second fallback

    return () => clearTimeout(fallbackTimeout);
  }, [isInitialized, initError]);

  const handleRetry = () => {
    setInitError(null);
    setIsInitialized(false);
    setError(null);
  };

  const handleProjectSelect = (projectId: string) => {
    // Update state immediately for faster response
    setSelectedProjectId(projectId);
    setIsInitialized(false);
    setInitError(null);
    
    // Also update URL for bookmarking/refresh support
    router.push(`/content-creator?project=${projectId}`);
  };

  const handleBackToOverview = () => {
    // Clear project state immediately
    setSelectedProjectId(null);
    setCurrentProject(null);
    
    // Navigate back to content creator without project parameter
    router.push('/content-creator');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('ContentCreatorWrapper unmounting, resetting initialization flag');
      initializingRef.current = false;
    };
  }, []);

  if (!isInitialized) {
    if (initError) {
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
          <Card className="w-96 p-6">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-red-900">Initialization Failed</h3>
                <p className="text-sm text-red-600 mt-1">{initError}</p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleRetry}>
                  Retry
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('User chose to continue despite error');
                    setIsInitialized(true);
                  }}
                >
                  Continue Anyway
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
        <Card className="w-96 p-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="text-center">
              <h3 className="text-lg font-medium">Initializing Content Creator</h3>
              <p className="text-sm text-gray-600 mt-1">
                Loading assets, variables, and projects...
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('User chose to skip initialization');
                setIsInitialized(true);
              }}
              className="mt-4"
            >
              Skip & Continue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show project overview if no project is selected
  if (!selectedProjectId || !currentProject) {
    return <ProjectOverview onProjectSelect={handleProjectSelect} />;
  }

  // Show content creator with back button when project is selected
  return (
    <div className="relative h-screen w-screen">
      <div className="absolute top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleBackToOverview}
          className="flex items-center gap-2 bg-white shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </div>
      <ContentCreator />
    </div>
  );
} 