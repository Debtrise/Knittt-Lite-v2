'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Button from '@/app/components/ui/button';
import { 
  getProjectDetails, 
  getContextsForProject, 
  getNodeTypes,
  createContext, 
  getNodesForContext,
  getConnectionsForContext,
  createNode,
  createConnection,
  updateNode,
  deleteNode,
  updateConnection,
  deleteConnection,
  validateProject
} from '@/app/utils/dialplanApi';
import { 
  DialplanProject, 
  DialplanContext, 
  DialplanNode, 
  DialplanConnection,
  NodeType
} from '@/app/types/dialplan';
import { WrappedDialplanCanvas } from '@/app/components/dialplan/DialplanCanvas';
import Link from 'next/link';

export default function DialPlanEditor() {
  const router = useRouter();
  const { id } = useParams();
  const projectId = Number(id);
  
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<DialplanProject | null>(null);
  const [contexts, setContexts] = useState<DialplanContext[]>([]);
  const [activeContextId, setActiveContextId] = useState<number | null>(null);
  const [nodeTypes, setNodeTypes] = useState<NodeType[]>([]);
  const [nodes, setNodes] = useState<DialplanNode[]>([]);
  const [connections, setConnections] = useState<DialplanConnection[]>([]);
  const [showNewContextForm, setShowNewContextForm] = useState(false);
  const [newContext, setNewContext] = useState({ 
    name: '', 
    description: '', 
    position: { x: 100, y: 100 } 
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    
    const fetchProjectData = async () => {
      setIsLoading(true);
      try {
        // Fetch project details
        const projectData = await getProjectDetails(projectId);
        setProject(projectData);
        
        // Fetch contexts for this project
        const contextsData = await getContextsForProject(projectId);
        setContexts(contextsData);
        
        // Set active context to the first one if available
        if (contextsData.length > 0) {
          setActiveContextId(contextsData[0].id);
        }
        
        // Fetch available node types
        const nodeTypesData = await getNodeTypes();
        setNodeTypes(nodeTypesData);
        
      } catch (error) {
        console.error('Error loading project data:', error);
        setError('Failed to load project data. Please try again later.');
        toast.error('Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  useEffect(() => {
    if (!activeContextId) return;
    
    const fetchContextData = async () => {
      try {
        // Fetch nodes for the active context
        const nodesData = await getNodesForContext(activeContextId);
        setNodes(nodesData);
        
        // Fetch connections for the active context
        try {
          const connectionsData = await getConnectionsForContext(activeContextId);
          setConnections(connectionsData);
        } catch (error) {
          console.warn('Error fetching connections, might not be implemented yet:', error);
          setConnections([]);
        }
        
      } catch (error) {
        console.error('Error loading context data:', error);
        toast.error('Failed to load context data');
      }
    };

    fetchContextData();
  }, [activeContextId]);

  const handleCreateContext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    
    try {
      const createdContext = await createContext(projectId, newContext);
      console.log('Created context:', createdContext);
      toast.success('Context created successfully');
      setNewContext({ name: '', description: '', position: { x: 100, y: 100 } });
      setShowNewContextForm(false);
      
      // Refresh contexts and set the new one as active
      const contextsData = await getContextsForProject(projectId);
      setContexts(contextsData);
      setActiveContextId(createdContext.id);
    } catch (error) {
      console.error('Error creating context:', error);
      toast.error('Failed to create context');
    }
  };

  const handleCreateNode = async (nodeTypeId: number, name: string, position: { x: number, y: number }) => {
    if (!activeContextId) return null;
    
    try {
      const nodeData = {
        nodeTypeId,
        name,
        label: name,
        position,
        properties: {}
      };
      
      const createdNode = await createNode(activeContextId, nodeData);
      console.log('Created node:', createdNode);
      
      // Add the new node to the state
      setNodes(prevNodes => [...prevNodes, createdNode]);
      
      return createdNode;
    } catch (error) {
      console.error('Error creating node:', error);
      toast.error('Failed to create node');
      return null;
    }
  };

  const handleUpdateNode = async (nodeId: number, data: { 
    name?: string; 
    label?: string; 
    position?: { x: number; y: number };
    properties?: Record<string, any>;
  }) => {
    try {
      const updatedNode = await updateNode(nodeId, data);
      console.log('Updated node:', updatedNode);
      
      // Update the node in state
      setNodes(prevNodes => 
        prevNodes.map(node => node.id === nodeId ? updatedNode : node)
      );
      
      return updatedNode;
    } catch (error) {
      console.error('Error updating node:', error);
      toast.error('Failed to update node');
      return null;
    }
  };

  const handleDeleteNode = async (nodeId: number) => {
    try {
      await deleteNode(nodeId);
      
      // Remove the node from state
      setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId));
      
      // Also remove any connections to/from this node
      setConnections(prevConnections => 
        prevConnections.filter(conn => 
          conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
        )
      );
      
      toast.success('Node deleted successfully');
    } catch (error) {
      console.error('Error deleting node:', error);
      toast.error('Failed to delete node');
    }
  };

  const handleCreateConnection = async (sourceNodeId: number, targetNodeId: number, condition?: string) => {
    try {
      const connectionData = {
        sourceNodeId,
        targetNodeId,
        condition: condition || undefined,
        priority: 1 // Default priority
      };
      
      const createdConnection = await createConnection(connectionData);
      console.log('Created connection:', createdConnection);
      
      // Add the new connection to the state
      setConnections(prevConnections => [...prevConnections, createdConnection]);
      
      return createdConnection;
    } catch (error) {
      console.error('Error creating connection:', error);
      toast.error('Failed to create connection');
      return null;
    }
  };

  const handleUpdateConnection = async (connectionId: number, data: { condition?: string; priority?: number }) => {
    try {
      const updatedConnection = await updateConnection(connectionId, data);
      console.log('Updated connection:', updatedConnection);
      
      // Update the connection in state
      setConnections(prevConnections => 
        prevConnections.map(conn => conn.id === connectionId ? updatedConnection : conn)
      );
      
      return updatedConnection;
    } catch (error) {
      console.error('Error updating connection:', error);
      toast.error('Failed to update connection');
      return null;
    }
  };

  const handleDeleteConnection = async (connectionId: number) => {
    try {
      await deleteConnection(connectionId);
      
      // Remove the connection from state
      setConnections(prevConnections => 
        prevConnections.filter(conn => conn.id !== connectionId)
      );
      
      toast.success('Connection deleted successfully');
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast.error('Failed to delete connection');
    }
  };

  const handleValidateProject = async () => {
    if (!projectId) return;
    
    try {
      const validation = await validateProject(projectId);
      console.log('Validation result:', validation);
      
      if (validation.valid) {
        toast.success('Project validation successful!');
      } else {
        toast.error(`Validation failed with ${validation.errors.length} errors`);
        // Display errors in console for now
        validation.errors.forEach((err: any) => console.error(err));
      }
    } catch (error) {
      console.error('Error validating project:', error);
      toast.error('Failed to validate project');
    }
  };

  const handleNodeDrop = async (nodeType: NodeType, position: { x: number, y: number }) => {
    if (!activeContextId) return;
    
    const name = `${nodeType.name}_${Date.now()}`;
    await handleCreateNode(nodeType.id, name, position);
  };

  const handleConnectionCreate = async (sourceId: number, targetId: number) => {
    await handleCreateConnection(sourceId, targetId);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="flex items-center mb-6">
            <Link href="/dialplan">
              <Button variant="outline" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">Loading Dial Plan...</h1>
          </div>
          <div className="bg-white shadow rounded-lg p-6 min-h-[300px] flex items-center justify-center">
            <div className="text-gray-500">Loading project data...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="flex items-center mb-6">
            <Link href="/dialplan">
              <Button variant="outline" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">Error Loading Dial Plan</h1>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex items-center mb-6">
          <Link href="/dialplan">
            <Button variant="outline" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">
            {project?.name || 'Dial Plan Editor'}
          </h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Contexts</h2>
            <Button
              onClick={() => setShowNewContextForm(!showNewContextForm)}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Context
            </Button>
          </div>

          {showNewContextForm && (
            <div className="mb-6 border border-gray-200 rounded-lg p-4">
              <h3 className="text-md font-medium text-gray-900 mb-4">Create New Context</h3>
              <form onSubmit={handleCreateContext}>
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="contextName" className="block text-sm font-medium text-gray-700">
                      Context Name
                    </label>
                    <input
                      id="contextName"
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
                      value={newContext.name}
                      onChange={e => setNewContext({...newContext, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <label htmlFor="contextDescription" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      id="contextDescription"
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
                      value={newContext.description}
                      onChange={e => setNewContext({...newContext, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowNewContextForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!newContext.name}
                  >
                    Create Context
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {contexts.length > 0 ? (
              contexts.map(context => (
                <button
                  key={context.id}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeContextId === context.id
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setActiveContextId(context.id)}
                >
                  {context.name}
                </button>
              ))
            ) : (
              <div className="text-gray-500 text-sm">No contexts available. Create one to start building your dial plan.</div>
            )}
          </div>
        </div>

        {activeContextId ? (
          <div className="bg-white shadow rounded-lg p-4 h-[700px]">
            <WrappedDialplanCanvas 
              nodes={nodes}
              edges={connections.map(conn => ({
                id: `e${conn.id}`,
                source: conn.sourceNodeId.toString(),
                target: conn.targetNodeId.toString(),
                label: conn.condition || undefined,
                type: 'default',
              }))}
              nodeTypes={nodeTypes}
              contextId={activeContextId}
              onNodesChange={(updatedNodes) => {
                console.log('Nodes changed:', updatedNodes);
                // Handle node changes
              }}
              onEdgesChange={(updatedEdges) => {
                console.log('Edges changed:', updatedEdges);
                // Handle edge changes
              }}
              onSave={handleValidateProject}
            />
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 min-h-[300px] flex items-center justify-center">
            <div className="text-gray-500">
              {contexts.length > 0 
                ? 'Select a context to edit its dial plan'
                : 'Create a context to start building your dial plan'}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 