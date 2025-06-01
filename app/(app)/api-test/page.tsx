'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import DashboardLayout from '@/app/components/layout/Dashboard';
import {
  getProjects, 
  createProject, 
  getNodeTypes, 
  checkDialplanCapabilities
} from '@/app/utils/dialplanApi';
import { 
  DialplanCapabilities, 
  NodeType, 
  DialplanProject 
} from '@/app/types/dialplan';

export default function ApiTestPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    projects?: DialplanProject[];
    newProject?: DialplanProject;
    nodeTypes?: NodeType[];
    capabilities?: DialplanCapabilities;
  } | null>(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test getting projects
      const projects = await getProjects();
      console.log('Projects:', projects);

      // Test creating a project
      const newProject = await createProject({
        name: 'Test Project',
        description: 'A test project created via API'
      });
      console.log('New project:', newProject);

      // Test getting node types
      const nodeTypes = await getNodeTypes();
      console.log('Node types:', nodeTypes);

      // Test getting capabilities
      const capabilities = await checkDialplanCapabilities();
      console.log('Capabilities:', capabilities);

      setResult({
        projects,
        newProject,
        nodeTypes,
        capabilities
      });
    } catch (err) {
      console.error('API test failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>API Test</CardTitle>
            <CardDescription>Test the Dialplan API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testApi}
              disabled={loading}
            >
              {loading ? 'Testing...' : 'Run API Test'}
            </Button>

            {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Test Results:</h3>
                <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 