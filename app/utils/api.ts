import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = 'http://34.122.156.88:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to add the auth token to all requests
api.interceptors.request.use(
  (config) => {
    // Get token from authStore instead of localStorage directly
    let token = null;
    
    // Check for localStorage in case we're in a browser environment
    if (typeof window !== 'undefined') {
      // Try to get from persisted storage first
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          token = parsed.state?.token;
        } catch (e) {
          console.error('Error parsing auth storage', e);
        }
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = async (username: string, password: string) => {
  const response = await api.post('/login', { username, password });
  return response.data;
};

export const register = async (userData: {
  username: string;
  password: string;
  email: string;
  tenantId: string;
  role: 'admin' | 'agent';
}) => {
  const response = await api.post('/register', userData);
  return response.data;
};

// Tenant APIs
export const createTenant = async (tenantData: any) => {
  const response = await api.post('/tenants', tenantData);
  return response.data;
};

export const getTenant = async (id: number) => {
  const response = await api.get(`/tenants/${id}`);
  return response.data;
};

export const updateTenant = async (id: number, tenantData: any) => {
  const response = await api.put(`/tenants/${id}`, tenantData);
  return response.data;
};

// Tenant Settings API
export const updateTenantSettings = async (tenantId: number, settings: {
  url: string;
  ingroup: string[];
  ingroups: string[];
}) => {
  // Get current tenant data first
  const currentTenant = await getTenant(tenantId);

  // Format the groups as a comma-separated string
  const ingroup = Array.isArray(settings.ingroup) && settings.ingroup.length > 0 ? settings.ingroup[0] : '';
  const ingroups = Array.isArray(settings.ingroups) ? settings.ingroups.join(',') : '';

  // Prepare the updated tenant data
  const updatedTenant = {
    ...currentTenant,
    apiConfig: {
      ...currentTenant.apiConfig,
      url: settings.url,
      ingroup,
      ingroups
    }
  };

  // Update the tenant with the new data
  const response = await api.put(`/tenants/${tenantId}`, updatedTenant);
  return response.data;
};

// Lead Management APIs
export const uploadLeads = async (fileContent: string, options: any) => {
  const response = await api.post('/leads/upload', { fileContent, options });
  return response.data;
};

export const getLeads = async (options?: {
  page?: number;
  limit?: number;
  status?: string;
  phone?: string;
  name?: string;
  email?: string;
}) => {
  const { page = 1, limit = 50, ...filters } = options || {};
  const params = { page, limit, ...filters };
  const response = await api.get('/leads', { params });
  return response.data;
};

// Get detailed lead information including call history
export const getLeadDetails = async (id: number) => {
  const response = await api.get(`/leads/${id}`);
  return response.data;
};

// Delete a specific lead
export const deleteLead = async (id: number) => {
  const response = await api.delete(`/leads/${id}`);
  return response.data;
};

// Bulk delete multiple leads
export const bulkDeleteLeads = async (ids: number[]) => {
  const response = await api.post('/leads/delete', { ids });
  return response.data;
};

type AgentStatus = {
  ingroup: string;
  agents_logged_in: number;
  agents_waiting: number;
  total_calls: number;
  calls_waiting: number;
  brand: string;
  source: string;
};

// Agent Status API
export const getAgentStatus = async (group: string): Promise<AgentStatus[]> => {
  try {
    // Get tenant ID from auth store
    const authStorage = localStorage.getItem('auth-storage');
    let tenantId = null;
    
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        tenantId = parsed.state?.user?.tenantId;
        console.log('Found tenant ID:', tenantId);
      } catch (e) {
        console.error('Error parsing auth storage', e);
      }
    }

    if (!tenantId) {
      throw new Error('No tenant ID found');
    }
    
    // Get the tenant data to access credentials - we need this to pass to the backend
    const tenantData = await getTenant(parseInt(tenantId, 10));
    console.log('Retrieved tenant data for API credentials');
    
    if (!tenantData?.apiConfig) {
      throw new Error('No API configuration found');
    }
    
    // Call the backend API endpoint for agent status instead of direct call to BTR
    console.log('Calling agent status API for group:', group);
    const response = await api.get(`/agent-status`, {
      params: { 
        url: tenantData.apiConfig.url,
        user: tenantData.apiConfig.user,
        pass: tenantData.apiConfig.password,
        ingroups: group
      }
    });
    
    console.log('Agent status response:', response.data);
    
    // Handle different response formats
    const data = response.data;
    if (data && Array.isArray(data.data)) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      // Try to find an array in the response
      for (const key in data) {
        if (Array.isArray(data[key])) {
          return data[key];
        }
      }
    }
    
    console.error('Invalid response format:', data);
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error fetching agent status:', error);
    throw error;
  }
};

// Call Management API

// Initiate a call
export const makeCall = async (callData: {
  to: string;
  from: string;
  transfer_number: string;
  leadId: number;
  variables?: Record<string, string>;
}) => {
  const response = await api.post('/make-call', callData);
  return response.data;
};

// Get call list with optional filters
export const getCalls = async (options?: {
  page?: number;
  limit?: number;
  status?: string;
  leadId?: number;
}) => {
  const { page = 1, limit = 50, status, leadId } = options || {};
  const params = { 
    page, 
    limit, 
    ...(status ? { status } : {}),
    ...(leadId ? { leadId } : {})
  };
  
  const response = await api.get('/calls', { params });
  return response.data;
};

// Get details for a specific call
export const getCallDetails = async (id: number) => {
  const response = await api.get(`/calls/${id}`);
  return response.data;
};

// Update call status
export const updateCallStatus = async (id: number, status: string) => {
  const response = await api.put(`/calls/${id}/status`, { status });
  return response.data;
};

// DID Management APIs
export const getDIDs = async (options?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
  areaCode?: string;
  state?: string;
}) => {
  const { page = 1, limit = 50, ...filters } = options || {};
  const params = { page, limit, ...filters };
  const response = await api.get('/dids', { params });
  return response.data;
};

// Get detailed DID information including usage history
export const getDIDDetails = async (id: number) => {
  const response = await api.get(`/dids/${id}`);
  return response.data;
};

export const addDID = async (didData: any) => {
  const response = await api.post('/dids', didData);
  return response.data;
};

export const updateDID = async (id: number, didData: any) => {
  const response = await api.put(`/dids/${id}`, didData);
  return response.data;
};

// Delete a specific DID
export const deleteDID = async (id: number) => {
  const response = await api.delete(`/dids/${id}`);
  return response.data;
};

export const bulkDeleteDIDs = async (ids: number[]) => {
  const response = await api.post('/dids/bulk-delete', { ids });
  return response.data;
};

// Reporting API
export const getDailyReport = async (date?: string) => {
  const params = date ? { date } : {};
  const response = await api.get('/reports/daily', { params });
  return response.data;
};

// SMS Campaign APIs
export const createSmsCampaign = async (campaignData: {
  name: string;
  messageTemplate: string;
  rateLimit: number;
}) => {
  const response = await axios.post('http://34.122.156.88:3100/campaigns', campaignData);
  return response.data;
};

export const listSmsCampaigns = async () => {
  const response = await axios.get('http://34.122.156.88:3100/campaigns');
  // The API returns a paginated response with campaigns in a sub-property
  if (response.data && response.data.campaigns) {
    return response.data.campaigns;
  }
  // Fall back to the original response if structure changes
  return response.data;
};

export const getSmsCampaignDetails = async (campaignId: number) => {
  const response = await axios.get(`http://34.122.156.88:3100/campaigns/${campaignId}`);
  return response.data;
};

export const uploadSmsCampaignContacts = async (campaignId: number, formData: FormData) => {
  // Make sure the file field is named 'contacts' as expected by the API
  const response = await axios.post(
    `http://34.122.156.88:3100/campaigns/${campaignId}/upload`, 
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  // The API returns a message and updated campaign object
  if (response.data && response.data.campaign) {
    return response.data;
  }
  return response.data;
};

export const uploadSmsLeads = async (formData: FormData) => {
  try {
    // Create a temporary campaign first to upload the leads to
    const tempCampaign = await createSmsCampaign({
      name: `Leads Repository ${new Date().toLocaleDateString()}`,
      messageTemplate: 'Temporary campaign for lead storage',
      rateLimit: 60
    });
    
    // Then upload the contacts to this campaign
    const uploadResponse = await uploadSmsCampaignContacts(tempCampaign.id, formData);
    
    // Return the upload response which includes the updated campaign info
    return uploadResponse;
  } catch (error) {
    console.error('Error in uploadSmsLeads:', error);
    throw error;
  }
};

export const startSmsCampaign = async (campaignId: number) => {
  const response = await axios.post(`http://34.122.156.88:3100/campaigns/${campaignId}/start`);
  // Return the campaign from the response if it's in the documented format
  if (response.data && response.data.campaign) {
    return response.data.campaign;
  }
  return response.data;
};

export const pauseSmsCampaign = async (campaignId: number) => {
  const response = await axios.post(`http://34.122.156.88:3100/campaigns/${campaignId}/pause`);
  // Return the campaign from the response if it's in the documented format
  if (response.data && response.data.campaign) {
    return response.data.campaign;
  }
  return response.data;
};

export const updateSmsCampaignRateLimit = async (campaignId: number, rateLimit: number) => {
  const response = await axios.patch(`http://34.122.156.88:3100/campaigns/${campaignId}/rate-limit`, { rateLimit });
  // Return the campaign from the response if it's in the documented format
  if (response.data && response.data.campaign) {
    return response.data.campaign;
  }
  return response.data;
};

export default api; 