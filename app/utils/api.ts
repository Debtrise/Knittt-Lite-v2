import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// API URLs - ensure these are the correct endpoints
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';
const SMS_API_URL = process.env.NEXT_PUBLIC_SMS_API_URL || 'http://34.122.156.88:3100';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const smsApi = axios.create({
  baseURL: SMS_API_URL,
  timeout: 30000, // 30 seconds timeout
  maxContentLength: 10 * 1024 * 1024, // 10MB max content size
  maxBodyLength: 10 * 1024 * 1024, // 10MB max body size
  maxRedirects: 5, // Allow up to 5 redirects
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add a request interceptor to add the auth token to all requests
const addAuthToken = (config: any) => {
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
};

api.interceptors.request.use(addAuthToken);
smsApi.interceptors.request.use(addAuthToken);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Handle common error scenarios
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized - could trigger logout
          console.error('Unauthorized access');
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 409:
          console.error('Resource conflict');
          break;
        case 500:
          console.error('Internal server error');
          break;
      }
    }
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
export const createTenant = async (tenantData: {
  name: string;
  apiConfig: {
    source: string;
    endpoint: string;
    user: string;
    password: string;
    ingroup: string;
    url: string;
  };
  amiConfig: {
    host: string;
    port: number;
    username: string;
    password: string;
    trunk: string;
    context: string;
  };
  schedule: {
    monday: { enabled: boolean; start: string; end: string };
    tuesday: { enabled: boolean; start: string; end: string };
    wednesday: { enabled: boolean; start: string; end: string };
    thursday: { enabled: boolean; start: string; end: string };
    friday: { enabled: boolean; start: string; end: string };
    saturday: { enabled: boolean; start: string; end: string };
    sunday: { enabled: boolean; start: string; end: string };
  };
  dialerConfig: {
    speed: number;
    minAgentsAvailable: number;
    autoDelete: boolean;
    sortOrder: 'oldest' | 'newest' | 'priority';
    didDistribution: 'even' | 'sequential';
  };
  timezone: string;
}) => {
  const response = await api.post('/tenants', tenantData);
  return response.data;
};

export const getTenant = async (id: number) => {
  const response = await api.get(`/tenants/${id}`);
  return response.data;
};

export const updateTenant = async (id: number, tenantData: Partial<{
  name: string;
  apiConfig: {
    source?: string;
    endpoint?: string;
    user?: string;
    password?: string;
    ingroup?: string;
    url?: string;
  };
  amiConfig: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    trunk?: string;
    context?: string;
  };
  schedule: {
    monday?: { enabled: boolean; start: string; end: string };
    tuesday?: { enabled: boolean; start: string; end: string };
    wednesday?: { enabled: boolean; start: string; end: string };
    thursday?: { enabled: boolean; start: string; end: string };
    friday?: { enabled: boolean; start: string; end: string };
    saturday?: { enabled: boolean; start: string; end: string };
    sunday?: { enabled: boolean; start: string; end: string };
  };
  dialerConfig: {
    speed?: number;
    minAgentsAvailable?: number;
    autoDelete?: boolean;
    sortOrder?: 'oldest' | 'newest' | 'priority';
    didDistribution?: 'even' | 'sequential';
  };
  timezone?: string;
}>) => {
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
  status?: 'pending' | 'contacted' | 'transferred' | 'completed' | 'failed';
  phone?: string;
  name?: string;
  email?: string;
  brand?: string;
  source?: string;
}) => {
  const { page = 1, limit = 50, ...filters } = options || {};
  const params = { page, limit, ...filters };
  const response = await api.get('/leads', { params });
  return response.data;
};

export const getLeadDetails = async (id: number) => {
  const response = await api.get(`/leads/${id}`);
  return response.data;
};

export const createLead = async (leadData: {
  phone: string;
  name?: string;
  email?: string;
  brand?: string;
  source?: string;
  status?: 'pending' | 'contacted' | 'transferred' | 'completed' | 'failed';
  additionalData?: Record<string, any>;
}) => {
  const response = await api.post('/leads', leadData);
  return response.data;
};

export const updateLead = async (
  id: number,
  leadData: {
    phone?: string;
    name?: string;
    email?: string;
    brand?: string;
    source?: string;
    status?: 'pending' | 'contacted' | 'transferred' | 'completed' | 'failed';
    additionalData?: Record<string, any>;
  }
) => {
  const response = await api.put(`/leads/${id}`, leadData);
  return response.data;
};

export const deleteLead = async (id: number) => {
  const response = await api.delete(`/leads/${id}`);
  return response.data;
};

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

// Agent Status APIs
export const getAgentStatus = async (params: {
  url: string;
  ingroup: string;
  user: string;
  pass: string;
}) => {
  const response = await api.get('/agent-status', { params });
  return response.data;
};

// Call Management APIs
export const makeCall = async (callData: {
  to: string;
  transfer_number: string;
  from: string;
  leadId?: number;
  trunk?: string;
  context?: string;
  exten?: string;
  priority?: number;
  timeout?: number;
  async?: string;
  variables?: Record<string, string>;
}) => {
  const response = await api.post('/make-call', callData);
  return response.data;
};

export const getCalls = async (options?: {
  page?: number;
  limit?: number;
  status?: 'initiated' | 'answered' | 'transferred' | 'completed' | 'failed';
  leadId?: number;
}) => {
  const { page = 1, limit = 50, ...filters } = options || {};
  const params = { page, limit, ...filters };
  const response = await api.get('/calls', { params });
  return response.data;
};

export const getCallDetails = async (id: number) => {
  const response = await api.get(`/calls/${id}`);
  return response.data;
};

export const updateCallStatus = async (id: number, status: 'initiated' | 'answered' | 'transferred' | 'completed' | 'failed') => {
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

export const getDIDDetails = async (id: number) => {
  const response = await api.get(`/dids/${id}`);
  return response.data;
};

export const createDID = async (didData: {
  phoneNumber: string;
  description: string;
  areaCode: string;
  state: string;
}) => {
  const response = await api.post('/dids', didData);
  return response.data;
};

export const updateDID = async (id: number, didData: {
  description?: string;
  isActive?: boolean;
  state?: string;
}) => {
  const response = await api.put(`/dids/${id}`, didData);
  return response.data;
};

export const deleteDID = async (id: number) => {
  const response = await api.delete(`/dids/${id}`);
  return response.data;
};

export const bulkDeleteDIDs = async (ids: number[]) => {
  const response = await api.post('/dids/bulk-delete', { ids });
  return response.data;
};

// Reports APIs
export const getDailyReport = async (date: string) => {
  try {
    const response = await api.get(`/reports/daily?date=${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching daily report:', error);
    // Return default data structure when endpoint is not available
    return {
      date,
      totalCalls: 0,
      answeredCalls: 0,
      transfers: 0,
      callsOver1Min: 0,
      callsOver5Min: 0,
      callsOver15Min: 0,
      connectionRate: "0.00",
      transferRate: "0.00"
    };
  }
};

// SMS Campaign APIs
export const createSmsCampaign = async (campaignData: {
  name: string;
  messageTemplate: string;
  rateLimit: number;
}) => {
  try {
    const response = await smsApi.post('/campaigns', campaignData);
    return response.data;
  } catch (error: any) {
    console.error('Create SMS Campaign Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const listSmsCampaigns = async (options?: {
  page?: number;
  limit?: number;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  search?: string;
}) => {
  try {
    const { page = 1, limit = 20, status, search } = options || {};
    const params = { page, limit, ...(status ? { status } : {}), ...(search ? { search } : {}) };
    const response = await smsApi.get('/campaigns', { params });
    return response.data;
  } catch (error: any) {
    console.error('List SMS Campaigns Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const getSmsCampaignDetails = async (campaignId: number) => {
  try {
    const response = await smsApi.get(`/campaigns/${campaignId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Get SMS Campaign Details Error for ID ${campaignId}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const startSmsCampaign = async (campaignId: number) => {
  try {
    const response = await smsApi.post(`/campaigns/${campaignId}/start`);
    return response.data;
  } catch (error: any) {
    console.error(`Start SMS Campaign Error for ID ${campaignId}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const pauseSmsCampaign = async (campaignId: number) => {
  try {
    const response = await smsApi.post(`/campaigns/${campaignId}/pause`);
    return response.data;
  } catch (error: any) {
    console.error(`Pause SMS Campaign Error for ID ${campaignId}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const updateSmsCampaignRateLimit = async (campaignId: number, rateLimit: number) => {
  // Configure the number of retries and the base delay between retries
  const maxRetries = 2;
  const baseRetryDelay = 1000; // 1 second initial delay
  
  // Keep track of our attempts
  let attempt = 0;
  let lastError = null;
  
  while (attempt <= maxRetries) {
    try {
      console.log(`Attempt ${attempt + 1}/${maxRetries + 1} to update rate limit for campaign ${campaignId}`);
      
      // Create a timeout promise that rejects after 15 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000);
      });
      
      // Create the actual API request promise
      const requestPromise = smsApi.patch(
        `/campaigns/${campaignId}/rate-limit`, 
        { rateLimit },
        { 
          timeout: 15000, // Also set axios timeout 
        }
      );
      
      // Race the timeout against the actual request
      const response = await Promise.race([requestPromise, timeoutPromise]) as any;
      
      console.log('Rate limit update successful');
      return response.data;
    } catch (error: any) {
      lastError = error;
      attempt++;
      
      console.error(`Attempt ${attempt}/${maxRetries + 1} failed:`, error.message || 'Unknown error');
      
      // If we get an actual server response (not a network error), 
      // don't retry as the problem is likely with our request
      if (error.response) {
        console.error('Server responded with error:', error.response.status);
        console.error('Error data:', error.response.data);
        throw error;
      }
      
      // Only retry on network errors or timeouts
      if (error.message !== 'Network Error' && error.message !== 'Request timeout') {
        throw error;
      }
      
      // If we've reached the max retries, throw the last error
      if (attempt > maxRetries) {
        console.error('All retry attempts failed');
        
        // Provide a user-friendly error message
        throw new Error(
          `Unable to connect to the server after ${maxRetries + 1} attempts. ` +
          `Please check your internet connection and try again later.`
        );
      }
      
      // Wait longer between each retry attempt (exponential backoff)
      const delay = baseRetryDelay * Math.pow(2, attempt - 1);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached because we either return or throw inside the loop
  throw lastError || new Error('Unknown error occurred during rate limit update');
};

export const configureAutoReply = async (campaignId: number, settings: {
  autoReplyEnabled: boolean;
  replyTemplate: string;
}) => {
  try {
    const response = await smsApi.patch(`/campaigns/${campaignId}/auto-reply`, settings);
    return response.data;
  } catch (error: any) {
    console.error(`Configure Auto Reply Error for ID ${campaignId}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const clearUnrespondedMessages = async (campaignId: number) => {
  try {
    const response = await smsApi.post(`/campaigns/${campaignId}/clear-unresponded`);
    return response.data;
  } catch (error: any) {
    console.error(`Clear Unresponded Messages Error for ID ${campaignId}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Contact Management APIs
export const uploadSmsCampaignContacts = async (campaignId: number, formData: FormData) => {
  try {
    // Make sure the file is named 'contacts' as per API docs
    // Extract the file if it has a different name
    const file = formData.get('file') as File;
    if (file) {
      // Create a new FormData with the correct field name
      const newFormData = new FormData();
      newFormData.append('contacts', file);
      
      const response = await smsApi.post(`/campaigns/${campaignId}/upload`, newFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      return response.data;
    } else {
      // If the form data already contains a 'contacts' field, use it as is
      const response = await smsApi.post(`/campaigns/${campaignId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      return response.data;
    }
  } catch (error: any) {
    console.error('Upload Campaign Contacts Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Connection timeout. The server took too long to respond.');
    } else if (error.message === 'Network Error') {
      throw new Error('Network connection failed. Please check your internet connection or the API server status.');
    }
    throw error;
  }
};

export const importContacts = async (formData: FormData, campaignId?: number) => {
  // Use the direct import endpoint as described in the API specification
  const url = campaignId ? `/contacts/import?campaignId=${campaignId}` : '/contacts/import';
  try {
    // Make sure the file is named 'contacts' as per API docs
    const file = formData.get('file') as File;
    if (file) {
      // Create a new FormData with the correct field name
      const newFormData = new FormData();
      newFormData.append('contacts', file);
      
      const response = await smsApi.post(url, newFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      return response.data;
    } else {
      // If the form data already contains a 'contacts' field, use it as is
      const response = await smsApi.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      return response.data;
    }
  } catch (error: any) {
    console.error('Import Contacts Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Connection timeout. The server took too long to respond.');
    } else if (error.message === 'Network Error') {
      throw new Error('Network connection failed. Please check your internet connection or the API server status.');
    }
    throw error;
  }
};

export const importContactsWithMapping = async (formData: FormData, mapping: {
  fieldMapping: Record<string, string>;
  campaignId?: number;
}) => {
  try {
    // Rename the file field from 'file' to 'contacts' as per API docs
    // First, extract the file
    const file = formData.get('file') as File;
    
    // Create a new FormData and append with the correct field name
    const newFormData = new FormData();
    newFormData.append('contacts', file);
    
    // According to the API docs, we need to send fieldMapping as a form field
    newFormData.append('fieldMapping', JSON.stringify(mapping.fieldMapping));
    
    // For campaignId, we need to include it in the body if provided
    let url = '/contacts/import-with-mapping';
    
    const response = await smsApi.post(url, newFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // If campaignId exists, include it in the params
      params: mapping.campaignId ? { campaignId: mapping.campaignId } : undefined,
      timeout: 30000, // 30 second timeout
    });
    return response.data;
  } catch (error: any) {
    console.error('Import Contacts With Mapping Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Connection timeout. The server took too long to respond.');
    } else if (error.message === 'Network Error') {
      throw new Error('Network connection failed. Please check your internet connection or the API server status.');
    }
    throw error;
  }
};

export const assignLeadsToCampaign = async (campaignId: number, leads: Array<{
  phone: string;
  name?: string;
  email?: string;
  [key: string]: any;
}>) => {
  try {
    const response = await smsApi.post(`/campaigns/${campaignId}/assign-leads`, { leads });
    return response.data;
  } catch (error: any) {
    console.error(`Assign Leads to Campaign Error for ID ${campaignId}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const assignSingleLead = async (campaignId: number, lead: {
  phone: string;
  name?: string;
  email?: string;
  [key: string]: any;
}) => {
  try {
    const response = await smsApi.post(`/campaigns/${campaignId}/lead`, lead);
    return response.data;
  } catch (error: any) {
    console.error(`Assign Single Lead to Campaign Error for ID ${campaignId}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const moveContactsBetweenCampaigns = async (contactIds: number[], targetCampaignId: number) => {
  try {
    const response = await smsApi.post('/contacts/move', { contactIds, targetCampaignId });
    return response.data;
  } catch (error: any) {
    console.error(`Move Contacts Between Campaigns Error:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const getCampaignLeads = async (campaignId: number, options?: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'sent' | 'failed' | 'replied';
  search?: string;
}) => {
  try {
    const { page = 1, limit = 100, status, search } = options || {};
    const params = { page, limit, ...(status ? { status } : {}), ...(search ? { search } : {}) };
    const response = await smsApi.get(`/campaigns/${campaignId}/leads`, { params });
    return response.data;
  } catch (error: any) {
    console.error(`Get Campaign Leads Error for ID ${campaignId}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

export const getContactConversation = async (contactId: number) => {
  const response = await smsApi.get(`/contacts/${contactId}/conversation`);
  return response.data;
};

export const sendReplyToContact = async (contactId: number, message: string) => {
  const response = await smsApi.post(`/contacts/${contactId}/reply`, { message });
  return response.data;
};

// Twilio Number Management APIs
export const addTwilioNumber = async (numberData: {
  phoneNumber: string;
  accountSid: string;
  authToken: string;
}) => {
  const response = await smsApi.post('/twilio-numbers', numberData);
  return response.data;
};

export const uploadTwilioNumbers = async (formData: FormData) => {
  const response = await smsApi.post('/twilio-numbers/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const listTwilioNumbers = async () => {
  const response = await smsApi.get('/twilio-numbers');
  return response.data;
};

export const deleteTwilioNumber = async (numberId: number, options?: {
  reassign?: boolean;
}) => {
  const response = await smsApi.delete(`/twilio-numbers/${numberId}`, {
    params: options,
  });
  return response.data;
};

export const bulkDeleteTwilioNumbers = async (numberIds: number[], options?: {
  reassign?: boolean;
  force?: boolean;
}) => {
  const response = await smsApi.post('/twilio-numbers/bulk-delete', { numberIds }, {
    params: options,
  });
  return response.data;
};

// Notification APIs
export const getNotifications = async (options?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}) => {
  const { page = 1, limit = 20, isRead, type } = options || {};
  const params = { page, limit, ...(isRead !== undefined ? { isRead } : {}), ...(type ? { type } : {}) };
  const response = await smsApi.get('/notifications', { params });
  return response.data;
};

export const createNotification = async (notification: {
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
}) => {
  const response = await smsApi.post('/notifications', notification);
  return response.data;
};

export const markNotificationsAsRead = async (notificationIds: number[]) => {
  const response = await smsApi.patch('/notifications/mark-read', { notificationIds });
  return response.data;
};

export const deleteNotification = async (notificationId: number) => {
  const response = await smsApi.delete(`/notifications/${notificationId}`);
  return response.data;
};

// CSV Operations
export const previewCsv = async (formData: FormData, options?: {
  rows?: number;
}) => {
  try {
    // Use the adjusted path to ensure we're hitting the right endpoint
    const response = await smsApi.post('/csv/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: options,
      timeout: 30000, // 30 second timeout
    });
    return response.data;
  } catch (error: any) {
    console.error('CSV Preview Error:', error);
    // Add more descriptive error message
    if (error.code === 'ECONNABORTED') {
      throw new Error('Connection timeout. The server took too long to respond.');
    } else if (error.message === 'Network Error') {
      throw new Error('Network connection failed. Please check your internet connection or the API server status.');
    }
    throw error;
  }
};

// API Connection Test
export const checkSmsApiConnection = async () => {
  try {
    // Use a known endpoint that already exists instead of /health
    // We'll just check if we can get the list of campaigns (even empty)
    // with a very short timeout
    await smsApi.get('/campaigns', { 
      params: { limit: 1 },  // Request only one record to minimize data
      timeout: 3000          // Short timeout
    });
    return { status: 'connected' };
  } catch (error: any) {
    console.error('SMS API Connection Test Error:', error);
    return { 
      status: 'disconnected', 
      error: error.message,
      url: SMS_API_URL
    };
  }
};

// Unresponded Messages APIs
export const getUnrespondedMessages = async (options?: {
  page?: number;
  limit?: number;
  campaignId?: number;
}) => {
  const { page = 1, limit = 50, campaignId } = options || {};
  const params = { page, limit, ...(campaignId ? { campaignId } : {}) };
  const response = await smsApi.get('/unresponded-messages', { params });
  return response.data;
};

export const markMessagesAsResolved = async (contactIds: number[]) => {
  const response = await smsApi.post('/unresponded-messages/mark-resolved', { contactIds });
  return response.data;
};

export const sendBulkReplies = async (data: {
  contactIds?: number[];
  campaignId?: number;
  message: string;
}) => {
  const response = await smsApi.post('/unresponded-messages/bulk-reply', data);
  return response.data;
};

// Dashboard APIs
export const getDashboardStats = async () => {
  const response = await smsApi.get('/dashboard/stats');
  return response.data;
};

// Try a simpler approach with direct endpoint
export const importContactsSimplified = async (formData: FormData, fieldMapping: Record<string, string>, campaignId?: number) => {
  try {
    // Create an endpoint URL
    let url = '/contacts/import';
    
    // Get the file from the formData
    const file = formData.get('file') as File;
    
    // Create a new FormData with the correct field name
    const newFormData = new FormData();
    newFormData.append('contacts', file);  // API expects 'contacts', not 'file'
    
    // Log what we're attempting to do
    console.log('Sending to endpoint:', url);
    console.log('With field mapping:', fieldMapping);
    
    // Add the field mapping directly to the form data with the correct name
    newFormData.append('fieldMapping', JSON.stringify(fieldMapping));
    
    const response = await smsApi.post(url, newFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Add campaignId as a URL parameter if provided
      params: campaignId ? { campaignId } : undefined,
      timeout: 30000, // 30 second timeout
    });
    return response.data;
  } catch (error: any) {
    console.error('Import Contacts Simplified Error:', error);
    // Give more detailed error information for debugging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Journey Management APIs
export const listJourneys = async (options?: {
  page?: number;
  limit?: number;
}) => {
  const { page = 1, limit = 50 } = options || {};
  const response = await api.get('/journeys', { params: { page, limit } });
  return response.data;
};

export const getJourneyDetails = async (id: number) => {
  const response = await api.get(`/journeys/${id}`);
  return response.data;
};

export const createJourney = async (journeyData: {
  name: string;
  description: string;
  isActive: boolean;
  triggerCriteria: {
    leadStatus?: string[];
    leadTags?: string[];
    leadAgeDays?: {
      min?: number;
      max?: number;
    };
    brands?: string[];
    sources?: string[];
    autoEnroll?: boolean;
  };
}) => {
  const response = await api.post('/journeys', journeyData);
  return response.data;
};

export const updateJourney = async (id: number, journeyData: {
  name?: string;
  description?: string;
  isActive?: boolean;
  triggerCriteria?: {
    leadStatus?: string[];
    leadTags?: string[];
    leadAgeDays?: {
      min?: number;
      max?: number;
    };
    brands?: string[];
    sources?: string[];
    autoEnroll?: boolean;
  };
}) => {
  const response = await api.put(`/journeys/${id}`, journeyData);
  return response.data;
};

export const deleteJourney = async (id: number, options?: { force?: boolean }) => {
  const params = options || {};
  const response = await api.delete(`/journeys/${id}`, { params });
  return response.data;
};

// Journey Steps APIs
export const listJourneySteps = async (journeyId: number) => {
  const response = await api.get(`/journeys/${journeyId}/steps`);
  return response.data;
};

export const createJourneyStep = async (journeyId: number, stepData: {
  name: string;
  description: string;
  stepOrder: number;
  actionType: string;
  actionConfig: Record<string, any>;
  delayType: string;
  delayConfig: Record<string, any>;
  conditions?: Record<string, any>;
  isActive: boolean;
  isExitPoint: boolean;
}) => {
  const response = await api.post(`/journeys/${journeyId}/steps`, stepData);
  return response.data;
};

export const updateJourneyStep = async (journeyId: number, stepId: number, stepData: {
  name?: string;
  description?: string;
  stepOrder?: number;
  actionConfig?: Record<string, any>;
  delayType?: string;
  delayConfig?: Record<string, any>;
  conditions?: Record<string, any>;
  isActive?: boolean;
  isExitPoint?: boolean;
}) => {
  const response = await api.put(`/journeys/${journeyId}/steps/${stepId}`, stepData);
  return response.data;
};

export const deleteJourneyStep = async (journeyId: number, stepId: number, options?: { force?: boolean }) => {
  const params = options || {};
  const response = await api.delete(`/journeys/${journeyId}/steps/${stepId}`, { params });
  return response.data;
};

// Lead Journey Management APIs
export const getJourneyLeads = async (journeyId: number, options?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { page = 1, limit = 50, ...filters } = options || {};
  const params = { page, limit, ...filters };
  const response = await api.get(`/journeys/${journeyId}/leads`, { params });
  return response.data;
};

export const enrollLeadsInJourney = async (journeyId: number, data: {
  leadIds: number[];
  restart?: boolean;
}) => {
  const response = await api.post(`/journeys/${journeyId}/enroll`, data);
  return response.data;
};

export const enrollLeadsByCriteria = async (journeyId: number, data: {
  criteria: {
    brands?: string[];
    sources?: string[];
    leadAgeDays?: {
      min?: number;
      max?: number;
    };
    leadStatus?: string[];
    leadTags?: string[];
  };
  restart?: boolean;
  limit?: number;
}) => {
  const response = await api.post(`/journeys/${journeyId}/enroll-by-criteria`, data);
  return response.data;
};

export const getLeadJourneys = async (leadId: number) => {
  const response = await api.get(`/leads/${leadId}/journeys`);
  return response.data;
};

export const updateLeadJourneyStatus = async (leadId: number, journeyId: number, data: {
  status: string;
}) => {
  const response = await api.put(`/leads/${leadId}/journeys/${journeyId}/status`, data);
  return response.data;
};

export const executeJourneyStep = async (leadId: number, journeyId: number, data: {
  stepId: number;
}) => {
  const response = await api.post(`/leads/${leadId}/journeys/${journeyId}/execute`, data);
  return response.data;
};

// New API endpoint to get matching statistics
export const getJourneyMatchingStats = async (journeyId: number) => {
  try {
    const response = await api.get(`/journeys/${journeyId}/matching-stats`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching matching stats for journey ${journeyId}:`, error);
    // Return default data
    return {
      totalLeads: 0,
      matchingLeads: 0,
      criteriaBreakdown: {
        leadStatus: 0,
        leadTags: 0,
        leadAgeDays: 0,
        brands: 0,
        sources: 0
      }
    };
  }
};

// Journey Statistics APIs
export const getJourneyStatistics = async () => {
  try {
    const response = await api.get('/journeys/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching journey statistics:', error);
    // Return default data structure when endpoint is not available
    return {
      activeJourneys: 0,
      activeLeadJourneys: 0,
      completedLeadJourneys: 0,
      pendingExecutions: 0,
      topJourneys: []
    };
  }
};

// New endpoints for brand and source statistics
export const getJourneyStatsByBrand = async () => {
  try {
    const response = await api.get('/stats/journeys/by-brand');
    return response.data;
  } catch (error) {
    console.error('Error fetching journey statistics by brand:', error);
    // Return default data structure with sample data
    return {
      brandBreakdown: [
        {
          name: "Tax Relief",
          activeJourneys: 0,
          totalLeads: 0,
          completionRate: 0
        }
      ]
    };
  }
};

export const getJourneyStatsBySource = async () => {
  try {
    const response = await api.get('/stats/journeys/by-source');
    return response.data;
  } catch (error) {
    console.error('Error fetching journey statistics by source:', error);
    // Return default data structure with sample data
    return {
      sourceBreakdown: [
        {
          name: "Facebook",
          activeJourneys: 0,
          totalLeads: 0,
          completionRate: 0
        }
      ]
    };
  }
};

export const getUpcomingExecutions = async (options?: { limit?: number }) => {
  const params = options || {};
  const response = await api.get('/executions/upcoming', { params });
  return response.data;
};

// Webhook Management APIs
export const listWebhooks = async (options?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}) => {
  const { page = 1, limit = 50, ...filters } = options || {};
  const params = { page, limit, ...filters };
  const response = await api.get('/webhooks', { params });
  return response.data;
};

export const getWebhookDetails = async (id: number) => {
  const response = await api.get(`/webhooks/${id}`);
  return response.data;
};

export const createWebhook = async (webhookData: {
  name: string;
  description: string;
  isActive: boolean;
  brand: string;
  source: string;
  fieldMapping: Record<string, string>;
  validationRules: {
    requirePhone: boolean;
    requireName: boolean;
    requireEmail: boolean;
    allowDuplicatePhone: boolean;
  };
  autoTagRules?: Array<{
    field: string;
    operator: string;
    value: string;
    tag: string;
  }>;
  securityToken?: string;
  autoEnrollJourneyId?: number;
}) => {
  const response = await api.post('/webhooks', webhookData);
  return response.data;
};

export const updateWebhook = async (id: number, webhookData: Partial<{
  name: string;
  description: string;
  isActive: boolean;
  brand: string;
  source: string;
  fieldMapping: Record<string, string>;
  validationRules: {
    requirePhone: boolean;
    requireName: boolean;
    requireEmail: boolean;
    allowDuplicatePhone: boolean;
  };
  autoTagRules?: Array<{
    field: string;
    operator: string;
    value: string;
    tag: string;
  }>;
  securityToken?: string;
  autoEnrollJourneyId?: number;
}>) => {
  const response = await api.put(`/webhooks/${id}`, webhookData);
  return response.data;
};

export const deleteWebhook = async (id: number) => {
  const response = await api.delete(`/webhooks/${id}`);
  return response.data;
};

export const getWebhookEvents = async (
  webhookId: number,
  options?: {
    page?: number;
    limit?: number;
    status?: 'success' | 'partial_success' | 'failed';
  }
) => {
  const { page = 1, limit = 50, ...filters } = options || {};
  const params = { page, limit, ...filters };
  const response = await api.get(`/webhooks/${webhookId}/events`, { params });
  return response.data;
};

export const testWebhook = async (id: number, payload: Record<string, any>) => {
  const response = await api.post(`/webhooks/${id}/test`, payload);
  return response.data;
};

// SMS Contact Reply API
export const sendContactReply = async (contactId: number, message: string) => {
  const response = await api.post(`/sms/contacts/${contactId}/reply`, { message });
  return response.data;
};

export default api; 