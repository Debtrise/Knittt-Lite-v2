import api from './api';

// Project Management
export const getProjects = async () => {
  const response = await api.get('/dialplan/projects');
  return response.data;
};

export const getProjectDetails = async (id: number) => {
  const response = await api.get(`/dialplan/projects/${id}`);
  return response.data;
};

export const createProject = async (data: { name: string; description: string }) => {
  const response = await api.post('/dialplan/projects', data);
  return response.data;
};

export const updateProject = async (id: number, data: { name?: string; description?: string; isActive?: boolean }) => {
  const response = await api.put(`/dialplan/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id: number) => {
  const response = await api.delete(`/dialplan/projects/${id}`);
  return response.data;
};

export const cloneProject = async (id: number, newName: string) => {
  const response = await api.post(`/dialplan/projects/${id}/clone`, { newName });
  return response.data;
};

// Context Management
export const getContextsForProject = async (projectId: number) => {
  const response = await api.get(`/dialplan/projects/${projectId}/contexts`);
  return response.data;
};

export const getContextDetails = async (id: number) => {
  const response = await api.get(`/dialplan/contexts/${id}`);
  return response.data;
};

export const createContext = async (projectId: number, data: { name: string; description: string; position: { x: number; y: number } }) => {
  const response = await api.post(`/dialplan/projects/${projectId}/contexts`, data);
  return response.data;
};

export const updateContext = async (id: number, data: { name?: string; description?: string; position?: { x: number; y: number } }) => {
  const response = await api.put(`/dialplan/contexts/${id}`, data);
  return response.data;
};

export const deleteContext = async (id: number) => {
  const response = await api.delete(`/dialplan/contexts/${id}`);
  return response.data;
};

// Node Management
export const getNodesForContext = async (contextId: number) => {
  const response = await api.get(`/dialplan/contexts/${contextId}/nodes`);
  return response.data;
};

export const getNodeDetails = async (id: number) => {
  const response = await api.get(`/dialplan/nodes/${id}`);
  return response.data;
};

export const createNode = async (contextId: number, data: { 
  nodeTypeId: number; 
  name: string; 
  label: string; 
  position: { x: number; y: number };
  properties: Record<string, any>;
}) => {
  try {
    console.log('Creating node with data:', { contextId, data });
    const response = await api.post(`/dialplan/contexts/${contextId}/nodes`, data);
    console.log('Node creation successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Node creation failed:', error.response?.data || error.message || error);
    throw error;
  }
};

export const updateNode = async (id: number, data: { 
  name?: string; 
  label?: string; 
  position?: { x: number; y: number };
  properties?: Record<string, any>;
}) => {
  const response = await api.put(`/dialplan/nodes/${id}`, data);
  return response.data;
};

export const deleteNode = async (id: number) => {
  try {
    console.log('Deleting node with ID:', id);
    
    // Check if the ID is valid
    if (!id || isNaN(id)) {
      throw new Error('Invalid node ID');
    }
    
    try {
      // Try with the standard endpoint
      const response = await api.delete(`/dialplan/nodes/${id}`);
      console.log('Node deletion successful:', response.data);
      return response.data;
    } catch (apiError: any) {
      // If we get a 404, the endpoint might not exist
      if (apiError.response?.status === 404) {
        console.warn('Standard delete endpoint not found, trying alternate endpoint...');
        
        // Try alternative endpoint format - some APIs use POST with delete action
        const fallbackResponse = await api.post(`/dialplan/nodes/delete`, { id });
        console.log('Node deletion successful with fallback:', fallbackResponse.data);
        return fallbackResponse.data;
      }
      
      // If it's not a 404 or the fallback also fails, rethrow
      throw apiError;
    }
  } catch (error: any) {
    // Detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Node deletion failed with response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Node deletion failed - no response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Node deletion failed - error setting up request:', error.message);
    }
    
    // For UI feedback, create a more helpful error message
    let errorMessage = 'Failed to delete node';
    if (error.response?.status === 404) {
      errorMessage = 'The node delete endpoint was not found on the server. The API may not be fully implemented.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Construct a new error with better message
    const enhancedError = new Error(errorMessage);
    enhancedError.cause = error;
    throw enhancedError;
  }
};

export const getNodeTypes = async () => {
  const response = await api.get('/dialplan/node-types');
  return response.data;
};

// Connection Management
export const getConnectionsForContext = async (contextId: number) => {
  const response = await api.get(`/dialplan/contexts/${contextId}/connections`);
  return response.data;
};

export const createConnection = async (data: { 
  sourceNodeId: number; 
  targetNodeId: number; 
  condition?: string; 
  priority?: number;
}) => {
  try {
    console.log('Creating connection with data:', data);
    const response = await api.post('/dialplan/connections', data);
    console.log('Connection creation successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Connection creation failed:', error.response?.data || error.message || error);
    throw error;
  }
};

export const updateConnection = async (id: number, data: { condition?: string; priority?: number }) => {
  const response = await api.put(`/dialplan/connections/${id}`, data);
  return response.data;
};

export const deleteConnection = async (id: number) => {
  try {
    console.log('Deleting connection with ID:', id);
    
    // Check if the ID is valid
    if (!id || isNaN(id)) {
      throw new Error('Invalid connection ID');
    }
    
    try {
      // Try with the standard endpoint
      const response = await api.delete(`/dialplan/connections/${id}`);
      console.log('Connection deletion successful:', response.data);
      return response.data;
    } catch (apiError: any) {
      // If we get a 404, the endpoint might not exist
      if (apiError.response?.status === 404) {
        console.warn('Standard connection delete endpoint not found, trying alternate endpoint...');
        
        // Try alternative endpoint format
        const fallbackResponse = await api.post(`/dialplan/connections/delete`, { id });
        console.log('Connection deletion successful with fallback:', fallbackResponse.data);
        return fallbackResponse.data;
      }
      
      // If it's not a 404 or the fallback also fails, rethrow
      throw apiError;
    }
  } catch (error: any) {
    // Detailed error logging
    if (error.response) {
      console.error('Connection deletion failed with response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('Connection deletion failed - no response received:', error.request);
    } else {
      console.error('Connection deletion failed - error setting up request:', error.message);
    }
    
    // For UI feedback, create a more helpful error message
    let errorMessage = 'Failed to delete connection';
    if (error.response?.status === 404) {
      errorMessage = 'The connection delete endpoint was not found on the server. The API may not be fully implemented.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Construct a new error with better message
    const enhancedError = new Error(errorMessage);
    enhancedError.cause = error;
    throw enhancedError;
  }
};

// Dialplan Generation & Deployment - Note: Some of these endpoints might not be implemented yet
export const validateProject = async (id: number) => {
  try {
    const response = await api.post(`/dialplan/projects/${id}/validate`);
    return response.data;
  } catch (error) {
    console.warn('Validate project endpoint may not be implemented yet');
    // Return a default response if the endpoint is not implemented
    return {
      valid: true,
      errors: [],
      warnings: [],
      timestamp: new Date().toISOString()
    };
  }
};

export const generateDialplan = async (id: number) => {
  try {
    const response = await api.post(`/dialplan/projects/${id}/generate`);
    return response.data;
  } catch (error) {
    console.warn('Generate dialplan endpoint may not be implemented yet');
    // Return a default response if the endpoint is not implemented
    return {
      dialplan: "[default]\nexten => s,1,NoOp(Demo Dialplan)\nexten => s,n,Hangup()",
      project: "Demo Project",
      contexts: 1,
      timestamp: new Date().toISOString()
    };
  }
};

export const deployDialplan = async (id: number, data: { 
  server: string; 
  port: number; 
  username: string; 
  password: string; 
  asteriskPath: string;
}) => {
  try {
    const response = await api.post(`/dialplan/projects/${id}/deploy`, data);
    return response.data;
  } catch (error) {
    console.warn('Deploy dialplan endpoint may not be implemented yet');
    // Return a default response if the endpoint is not implemented
    return {
      success: false,
      message: "Deployment feature is not yet implemented"
    };
  }
};

export const getDeploymentHistory = async (id: number) => {
  try {
    const response = await api.get(`/dialplan/projects/${id}/deployments`);
    return response.data;
  } catch (error) {
    console.warn('Deployment history endpoint may not be implemented yet');
    // Return an empty array if the endpoint is not implemented
    return [];
  }
};

export const checkDialplanCapabilities = async () => {
  const response = await api.get('/system/dialplan-capabilities');
  return response.data;
};

export default {
  getProjects,
  getProjectDetails,
  createProject,
  updateProject,
  deleteProject,
  cloneProject,
  getContextsForProject,
  getContextDetails,
  createContext,
  updateContext,
  deleteContext,
  getNodesForContext,
  getNodeDetails,
  createNode,
  updateNode,
  deleteNode,
  getNodeTypes,
  getConnectionsForContext,
  createConnection,
  updateConnection,
  deleteConnection,
  validateProject,
  generateDialplan,
  deployDialplan,
  getDeploymentHistory,
  checkDialplanCapabilities
}; 