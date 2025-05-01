const axios = require('axios');
const config = require('./dialplanApiConfig');

// Create API instance with configured base URL and timeout
const api = axios.create({
  baseURL: config.apiUrl,
  timeout: config.timeout
});

// Logger function
const log = (message, data) => {
  if (config.debug) {
    console.log(`[DialplanAPI] ${message}`, data ? data : '');
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (axiosConfig) => {
    // First try using the token from the config file
    if (config.authToken) {
      axiosConfig.headers.Authorization = `Bearer ${config.authToken}`;
      return axiosConfig;
    }
    
    // If no token in config, try to get from localStorage in a browser environment
    if (typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          const token = parsed.state?.token;
          if (token) {
            axiosConfig.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (e) {
        log('Error getting token from storage:', e.message);
      }
    }
    
    return axiosConfig;
  },
  (error) => {
    log('Request interceptor error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    log(`${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      log(`Error ${error.response.status} from ${error.config.url}:`, error.response.data);
    } else if (error.request) {
      log('No response received for request to:', error.config.url);
    } else {
      log('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Project Management
const getProjects = async () => {
  try {
    log('Getting projects');
    const response = await api.get('/dialplan/projects');
    return response.data;
  } catch (error) {
    log('Error getting projects:', error.message);
    throw error;
  }
};

const getProjectDetails = async (id) => {
  try {
    log(`Getting project details for ID: ${id}`);
    const response = await api.get(`/dialplan/projects/${id}`);
    return response.data;
  } catch (error) {
    log(`Error getting project details for ID ${id}:`, error.message);
    throw error;
  }
};

const createProject = async (data) => {
  try {
    log('Creating new project:', data);
    const response = await api.post('/dialplan/projects', data);
    return response.data;
  } catch (error) {
    log('Error creating project:', error.message);
    throw error;
  }
};

const updateProject = async (id, data) => {
  try {
    log(`Updating project ${id}:`, data);
    const response = await api.put(`/dialplan/projects/${id}`, data);
    return response.data;
  } catch (error) {
    log(`Error updating project ${id}:`, error.message);
    throw error;
  }
};

const deleteProject = async (id) => {
  try {
    log(`Deleting project ${id}`);
    const response = await api.delete(`/dialplan/projects/${id}`);
    return response.data;
  } catch (error) {
    log(`Error deleting project ${id}:`, error.message);
    throw error;
  }
};

const cloneProject = async (id, newName) => {
  try {
    log(`Cloning project ${id} with name: ${newName}`);
    const response = await api.post(`/dialplan/projects/${id}/clone`, { newName });
    return response.data;
  } catch (error) {
    log(`Error cloning project ${id}:`, error.message);
    throw error;
  }
};

// Context Management
const getContextsForProject = async (projectId) => {
  try {
    log(`Getting contexts for project ${projectId}`);
    const response = await api.get(`/dialplan/projects/${projectId}/contexts`);
    return response.data;
  } catch (error) {
    log(`Error getting contexts for project ${projectId}:`, error.message);
    throw error;
  }
};

const getContextDetails = async (id) => {
  try {
    log(`Getting context details for ID: ${id}`);
    const response = await api.get(`/dialplan/contexts/${id}`);
    return response.data;
  } catch (error) {
    log(`Error getting context details for ID ${id}:`, error.message);
    throw error;
  }
};

const createContext = async (projectId, data) => {
  try {
    log(`Creating new context for project ${projectId}:`, data);
    const response = await api.post(`/dialplan/projects/${projectId}/contexts`, data);
    return response.data;
  } catch (error) {
    log(`Error creating context for project ${projectId}:`, error.message);
    throw error;
  }
};

// Node Management
const getNodesForContext = async (contextId) => {
  try {
    log(`Getting nodes for context ${contextId}`);
    const response = await api.get(`/dialplan/contexts/${contextId}/nodes`);
    return response.data;
  } catch (error) {
    log(`Error getting nodes for context ${contextId}:`, error.message);
    throw error;
  }
};

const getNodeDetails = async (id) => {
  try {
    log(`Getting node details for ID: ${id}`);
    const response = await api.get(`/dialplan/nodes/${id}`);
    return response.data;
  } catch (error) {
    log(`Error getting node details for ID ${id}:`, error.message);
    throw error;
  }
};

const createNode = async (contextId, data) => {
  try {
    log(`Creating new node for context ${contextId}:`, data);
    const response = await api.post(`/dialplan/contexts/${contextId}/nodes`, data);
    return response.data;
  } catch (error) {
    log(`Error creating node for context ${contextId}:`, error.message);
    throw error;
  }
};

const getNodeTypes = async () => {
  try {
    log('Getting node types');
    const response = await api.get('/dialplan/node-types');
    return response.data;
  } catch (error) {
    log('Error getting node types:', error.message);
    throw error;
  }
};

// Connection Management
const getConnectionsForContext = async (contextId) => {
  try {
    log(`Getting connections for context ${contextId}`);
    const response = await api.get(`/dialplan/contexts/${contextId}/connections`);
    return response.data;
  } catch (error) {
    log(`Error getting connections for context ${contextId}:`, error.message);
    throw error;
  }
};

const createConnection = async (data) => {
  try {
    log('Creating new connection:', data);
    const response = await api.post('/dialplan/connections', data);
    return response.data;
  } catch (error) {
    log('Error creating connection:', error.message);
    throw error;
  }
};

// Dialplan Generation & Deployment
const validateProject = async (id) => {
  try {
    log(`Validating project ${id}`);
    const response = await api.post(`/dialplan/projects/${id}/validate`);
    return response.data;
  } catch (error) {
    log(`Error validating project ${id}:`, error.message);
    throw error;
  }
};

const generateDialplan = async (id) => {
  try {
    log(`Generating dialplan for project ${id}`);
    const response = await api.post(`/dialplan/projects/${id}/generate`);
    return response.data;
  } catch (error) {
    log(`Error generating dialplan for project ${id}:`, error.message);
    throw error;
  }
};

const deployDialplan = async (id, data) => {
  try {
    log(`Deploying dialplan for project ${id}:`, data);
    const response = await api.post(`/dialplan/projects/${id}/deploy`, data);
    return response.data;
  } catch (error) {
    log(`Error deploying dialplan for project ${id}:`, error.message);
    throw error;
  }
};

const checkDialplanCapabilities = async () => {
  try {
    log('Checking dialplan capabilities');
    const response = await api.get('/system/dialplan-capabilities');
    return response.data;
  } catch (error) {
    log('Error checking dialplan capabilities:', error.message);
    throw error;
  }
};

module.exports = {
  getProjects,
  getProjectDetails,
  createProject,
  updateProject,
  deleteProject,
  cloneProject,
  getContextsForProject,
  getContextDetails,
  createContext,
  getNodesForContext,
  getNodeDetails,
  createNode,
  getNodeTypes,
  getConnectionsForContext,
  createConnection,
  validateProject,
  generateDialplan,
  deployDialplan,
  checkDialplanCapabilities
}; 