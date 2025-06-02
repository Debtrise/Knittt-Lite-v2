'use client';

import { useState } from 'react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Button from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { 
  getProjects, 
  createProject, 
  getNodeTypes, 
  checkDialplanCapabilities,
  getContextsForProject,
  generateDialplan,
  validateProject
} from '@/app/utils/dialplanApi';
import { DialplanCapabilities, NodeType, DialplanProject } from '@/app/types/dialplan';

export default function ApiTestPage() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [projectId, setProjectId] = useState<string>("");

  // Helper to set loading state
  const setLoadingState = (key: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [key]: isLoading }));
  };

  // Helper to set result
  const setResult = (key: string, data: any) => {
    setResults(prev => ({ ...prev, [key]: data }));
  };

  // Helper to set error
  const setErrorState = (key: string, errorMsg: string) => {
    setError(prev => ({ ...prev, [key]: errorMsg }));
  };

  // Test dialplan capabilities
  const testCapabilities = async () => {
    const key = 'capabilities';
    setLoadingState(key, true);
    setErrorState(key, '');
    
    try {
      const data = await checkDialplanCapabilities();
      setResult(key, data);
    } catch (err: any) {
      setErrorState(key, err?.response?.data?.message || err?.message || 'Unknown error');
    } finally {
      setLoadingState(key, false);
    }
  };

  // Test get projects
  const testGetProjects = async () => {
    const key = 'projects';
    setLoadingState(key, true);
    setErrorState(key, '');
    
    try {
      const data = await getProjects();
      setResult(key, data);
      
      // If we have projects, set the first project ID for other tests
      if (Array.isArray(data) && data.length > 0) {
        setProjectId(data[0].id.toString());
      }
    } catch (err: any) {
      setErrorState(key, err?.response?.data?.message || err?.message || 'Unknown error');
    } finally {
      setLoadingState(key, false);
    }
  };

  // Test create project
  const testCreateProject = async () => {
    const key = 'createProject';
    setLoadingState(key, true);
    setErrorState(key, '');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
      const data = await createProject({
        name: `Test Project ${timestamp}`,
        description: 'Created via API test page'
      });
      setResult(key, data);
      
      // Update project ID for other tests
      if (data?.id) {
        setProjectId(data.id.toString());
      }
    } catch (err: any) {
      setErrorState(key, err?.response?.data?.message || err?.message || 'Unknown error');
    } finally {
      setLoadingState(key, false);
    }
  };

  // Test get node types
  const testNodeTypes = async () => {
    const key = 'nodeTypes';
    setLoadingState(key, true);
    setErrorState(key, '');
    
    try {
      const data = await getNodeTypes();
      setResult(key, data);
    } catch (err: any) {
      setErrorState(key, err?.response?.data?.message || err?.message || 'Unknown error');
    } finally {
      setLoadingState(key, false);
    }
  };

  // Test get contexts for a project
  const testGetContexts = async () => {
    const key = 'contexts';
    setLoadingState(key, true);
    setErrorState(key, '');
    
    if (!projectId) {
      setErrorState(key, 'Please get or create a project first');
      setLoadingState(key, false);
      return;
    }
    
    try {
      const data = await getContextsForProject(parseInt(projectId));
      setResult(key, data);
    } catch (err: any) {
      setErrorState(key, err?.response?.data?.message || err?.message || 'Unknown error');
    } finally {
      setLoadingState(key, false);
    }
  };

  // Test generate dialplan
  const testGenerateDialplan = async () => {
    const key = 'generateDialplan';
    setLoadingState(key, true);
    setErrorState(key, '');
    
    if (!projectId) {
      setErrorState(key, 'Please get or create a project first');
      setLoadingState(key, false);
      return;
    }
    
    try {
      const data = await generateDialplan(parseInt(projectId));
      setResult(key, data);
    } catch (err: any) {
      setErrorState(key, err?.response?.data?.message || err?.message || 'Unknown error');
    } finally {
      setLoadingState(key, false);
    }
  };

  // Test validate project
  const testValidateProject = async () => {
    const key = 'validateProject';
    setLoadingState(key, true);
    setErrorState(key, '');
    
    if (!projectId) {
      setErrorState(key, 'Please get or create a project first');
      setLoadingState(key, false);
      return;
    }
    
    try {
      const data = await validateProject(parseInt(projectId));
      setResult(key, data);
    } catch (err: any) {
      setErrorState(key, err?.response?.data?.message || err?.message || 'Unknown error');
    } finally {
      setLoadingState(key, false);
    }
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <h1 className="text-2xl font-semibold mb-6">Dialplan API Test Page</h1>
        
        {projectId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">Current project ID: <strong>{projectId}</strong></p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Dialplan Capabilities</CardTitle>
              <CardDescription>
                Test the dialplan capabilities endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.capabilities && (
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
                  {JSON.stringify(results.capabilities, null, 2)}
                </pre>
              )}
              {error.capabilities && (
                <div className="text-red-500 mt-2">{error.capabilities}</div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={testCapabilities} disabled={loading.capabilities}>
                {loading.capabilities ? 'Loading...' : 'Test Capabilities'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Test Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Get Projects</CardTitle>
              <CardDescription>
                List all dialplan projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.projects && (
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
                  {JSON.stringify(results.projects, null, 2)}
                </pre>
              )}
              {error.projects && (
                <div className="text-red-500 mt-2">{error.projects}</div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={testGetProjects} disabled={loading.projects}>
                {loading.projects ? 'Loading...' : 'Get Projects'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Create Project */}
          <Card>
            <CardHeader>
              <CardTitle>Create Project</CardTitle>
              <CardDescription>
                Create a new dialplan project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.createProject && (
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
                  {JSON.stringify(results.createProject, null, 2)}
                </pre>
              )}
              {error.createProject && (
                <div className="text-red-500 mt-2">{error.createProject}</div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={testCreateProject} disabled={loading.createProject}>
                {loading.createProject ? 'Creating...' : 'Create Project'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Node Types */}
          <Card>
            <CardHeader>
              <CardTitle>Node Types</CardTitle>
              <CardDescription>
                Get available node types
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.nodeTypes && (
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
                  {JSON.stringify(results.nodeTypes, null, 2)}
                </pre>
              )}
              {error.nodeTypes && (
                <div className="text-red-500 mt-2">{error.nodeTypes}</div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={testNodeTypes} disabled={loading.nodeTypes}>
                {loading.nodeTypes ? 'Loading...' : 'Get Node Types'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Get Contexts */}
          <Card>
            <CardHeader>
              <CardTitle>Get Contexts</CardTitle>
              <CardDescription>
                Get contexts for the current project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.contexts && (
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
                  {JSON.stringify(results.contexts, null, 2)}
                </pre>
              )}
              {error.contexts && (
                <div className="text-red-500 mt-2">{error.contexts}</div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={testGetContexts} disabled={loading.contexts}>
                {loading.contexts ? 'Loading...' : 'Get Contexts'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Generate Dialplan */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Dialplan</CardTitle>
              <CardDescription>
                Generate Asterisk dialplan config
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.generateDialplan && (
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
                  {JSON.stringify(results.generateDialplan, null, 2)}
                </pre>
              )}
              {error.generateDialplan && (
                <div className="text-red-500 mt-2">{error.generateDialplan}</div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={testGenerateDialplan} disabled={loading.generateDialplan}>
                {loading.generateDialplan ? 'Generating...' : 'Generate Dialplan'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Validate Project */}
          <Card>
            <CardHeader>
              <CardTitle>Validate Project</CardTitle>
              <CardDescription>
                Check for errors in dialplan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.validateProject && (
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
                  {JSON.stringify(results.validateProject, null, 2)}
                </pre>
              )}
              {error.validateProject && (
                <div className="text-red-500 mt-2">{error.validateProject}</div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={testValidateProject} disabled={loading.validateProject}>
                {loading.validateProject ? 'Validating...' : 'Validate Project'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 