import axios from 'axios';
import { useAuthStore } from '@/app/store/authStore';

const BASE_URL = 'http://34.122.156.88:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  login: (username: string, password: string) =>
    api.post('/login', { username, password }),
  register: (data: {
    username: string;
    password: string;
    email: string;
    tenantId: string;
    role: string;
  }) => api.post('/register', data),
};

// Tenant endpoints
export const tenants = {
  create: (data: any) => api.post('/tenants', data),
  get: (id: string) => api.get(`/tenants/${id}`),
  update: (id: string, data: any) => api.put(`/tenants/${id}`, data),
};

// Lead endpoints
export const leads = {
  upload: (fileContent: string, options: any) =>
    api.post('/leads/upload', { fileContent, options }),
  list: async (params: any) => {
    const response = await api.get('/leads', {
      params: {
        ...params,
        tenantId: useAuthStore.getState().tenantId
      }
    });
    return {
      leads: response.data.leads || [],
      totalPages: response.data.totalPages || 1,
      currentPage: response.data.currentPage || 1,
      totalCount: response.data.totalCount || 0
    };
  },
  get: (id: string) => api.get(`/leads/${id}`),
  delete: (id: string) => api.delete(`/leads/${id}`),
  bulkDelete: (ids: number[]) => api.post('/leads/delete', { ids })
};

// Call endpoints
export const calls = {
  make: (data: {
    to: string;
    transfer_number?: string;
    from?: string;
    leadId?: number;
    variables?: any;
  }) => api.post('/make-call', data),
  updateStatus: (id: string, status: string) =>
    api.put(`/calls/${id}/status`, { status }),
  get: (id: string) => api.get(`/calls/${id}`),
  list: (params: any) => api.get('/calls', { params }),
};

// DID endpoints
export const dids = {
  list: (params: any) => api.get('/dids', { params }),
  get: (id: string) => api.get(`/dids/${id}`),
  create: (data: any) => api.post('/dids', data),
  update: (id: string, data: any) => api.put(`/dids/${id}`, data),
  delete: (id: string) => api.delete(`/dids/${id}`),
};

// Journey endpoints
export const journeys = {
  list: () => api.get('/journeys'),
  get: (id: string) => api.get(`/journeys/${id}`),
  create: (data: any) => api.post('/journeys', data),
  update: (id: string, data: any) => api.put(`/journeys/${id}`, data),
  delete: (id: string, force: boolean = false) =>
    api.delete(`/journeys/${id}?force=${force}`),
  // Journey steps
  listSteps: (journeyId: string) => api.get(`/journeys/${journeyId}/steps`),
  createStep: (journeyId: string, data: any) =>
    api.post(`/journeys/${journeyId}/steps`, data),
  updateStep: (journeyId: string, stepId: string, data: any) =>
    api.put(`/journeys/${journeyId}/steps/${stepId}`, data),
  deleteStep: (journeyId: string, stepId: string, force: boolean = false) =>
    api.delete(`/journeys/${journeyId}/steps/${stepId}?force=${force}`),
  // Lead journey management
  getLeads: (journeyId: string, params: any) =>
    api.get(`/journeys/${journeyId}/leads`, { params }),
  enrollLeads: (journeyId: string, leadIds: number[], restart: boolean = false) =>
    api.post(`/journeys/${journeyId}/enroll`, { leadIds, restart }),
  getLeadJourneys: (leadId: string) => api.get(`/leads/${leadId}/journeys`),
  updateLeadJourneyStatus: (leadId: string, journeyId: string, status: string) =>
    api.put(`/leads/${leadId}/journeys/${journeyId}/status`, { status }),
  executeStep: (leadId: string, journeyId: string, stepId: number) =>
    api.post(`/leads/${leadId}/journeys/${journeyId}/execute`, { stepId }),
};

// Webhook endpoints
export const webhooks = {
  list: (params: any) => api.get('/webhooks', { params }),
  create: (data: any) => api.post('/webhooks', data),
  update: (id: string, data: any) => api.put(`/webhooks/${id}`, data),
  delete: (id: string) => api.delete(`/webhooks/${id}`),
  getEvents: (id: string, params: any) =>
    api.get(`/webhooks/${id}/events`, { params }),
  test: (id: string, data: any) => api.post(`/webhooks/${id}/test`, data),
};

// SMS/Twilio endpoints
export const sms = {
  getConfig: () => api.get('/twilio/config'),
  saveConfig: (data: any) => api.post('/twilio/config', data),
  testConnection: () => api.post('/twilio/test'),
  listNumbers: () => api.get('/twilio/numbers'),
  syncNumbers: () => api.post('/twilio/numbers/sync'),
  send: (data: {
    to: string;
    body: string;
    leadId?: number;
    from?: string;
  }) => api.post('/sms/send', data),
  sendTemplate: (data: {
    to: string;
    templateId: number;
    variables: any;
    leadId?: number;
  }) => api.post('/sms/send-template', data),
  sendBulk: (data: {
    recipients: Array<{
      phone: string;
      leadId?: number;
      variables?: any;
    }>;
    templateId: number;
    throttle?: number;
  }) => api.post('/sms/send-bulk', data),
  getConversation: (leadId: string, params: any) =>
    api.get(`/sms/conversation/${leadId}`, { params }),
  listConversations: (params: any) =>
    api.get('/sms/conversations', { params }),
  getMessages: (params: any) => api.get('/sms/messages', { params }),
  getMessage: (id: string) => api.get(`/sms/messages/${id}`),
};

// Template endpoints
export const templates = {
  listCategories: (type: string) =>
    api.get('/templates/categories', { params: { type } }),
  createCategory: (data: {
    name: string;
    description: string;
    type: string;
  }) => api.post('/templates/categories', data),
  updateCategory: (id: string, data: {
    name: string;
    description: string;
    type: string;
  }) => api.put(`/templates/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/templates/categories/${id}`),
  list: (params: any) => api.get('/templates', { params }),
  get: (id: string) => api.get(`/templates/${id}`),
  create: (data: any) => api.post('/templates', data),
  update: (id: string, data: any) => api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  renderPreview: (id: string, variables: any) =>
    api.post(`/templates/${id}/render`, { variables }),
  clone: (id: string) => api.post(`/templates/${id}/clone`),
  getUsage: (id: string, params: any) =>
    api.get(`/templates/${id}/usage`, { params }),
};

// Transfer group endpoints
export const transferGroups = {
  list: (params: any) => api.get('/transfer-groups', { params }),
  get: (id: string) => api.get(`/transfer-groups/${id}`),
  create: (data: any) => api.post('/transfer-groups', data),
  update: (id: string, data: any) => api.put(`/transfer-groups/${id}`, data),
  delete: (id: string) => api.delete(`/transfer-groups/${id}`),
  // Transfer numbers
  addNumber: (groupId: string, data: any) =>
    api.post(`/transfer-groups/${groupId}/numbers`, data),
  updateNumber: (groupId: string, numberId: string, data: any) =>
    api.put(`/transfer-groups/${groupId}/numbers/${numberId}`, data),
  removeNumber: (groupId: string, numberId: string) =>
    api.delete(`/transfer-groups/${groupId}/numbers/${numberId}`),
  getNextNumber: (groupId: string) =>
    api.get(`/transfer-groups/${groupId}/next-number`),
};

// Email endpoints
export const email = {
  getConfig: () => api.get('/email/config'),
  saveConfig: (data: any) => api.post('/email/config', data),
  test: (to: string) => api.post('/email/test', { to }),
  send: (data: {
    to: string;
    templateId: number;
    variables: any;
    attachments?: any[];
  }) => api.post('/email/send', data),
};

// Report endpoints
export const reports = {
  generateCallSummary: (data: any) =>
    api.post('/reports/call-summary', data),
  generateSmsSummary: (data: any) =>
    api.post('/reports/sms-summary', data),
  generateAgentPerformance: (data: any) =>
    api.post('/reports/agent-performance', data),
  generateLeadConversion: (data: any) =>
    api.post('/reports/lead-conversion', data),
  generateJourneyAnalytics: (data: any) =>
    api.post('/reports/journey-analytics', data),
  generateCustom: (data: any) => api.post('/reports/custom', data),
  export: (data: any) => api.post('/reports/export', data),
};

// Report template endpoints
export const reportTemplates = {
  list: () => api.get('/report-templates'),
  get: (id: string) => api.get(`/report-templates/${id}`),
  create: (data: any) => api.post('/report-templates', data),
  update: (id: string, data: any) => api.put(`/report-templates/${id}`, data),
  delete: (id: string) => api.delete(`/report-templates/${id}`),
  execute: (id: string) => api.post(`/report-templates/${id}/execute`),
  schedule: (id: string) => api.post(`/report-templates/${id}/schedule`),
};

// Dashboard endpoints
export const dashboard = {
  getStats: () => api.get('/dashboard/stats'),
  getHistory: (hours: number) =>
    api.get('/dashboard/history', { params: { hours } }),
  getTodayStats: () => api.get('/stats/today'),
  getHourlyBreakdown: () => api.get('/stats/hourly'),
};

// System endpoints
export const system = {
  getAgentStatus: (params: any) => {
    const { url, ingroup, user, pass } = params;
    return api.get('/agent-status', {
      params: {
        url: encodeURIComponent(url),
        ingroup: encodeURIComponent(ingroup),
        user: encodeURIComponent(user),
        pass: encodeURIComponent(pass)
      }
    });
  },
  getDailyReport: (date: string) =>
    api.get('/reports/daily', { params: { date } }),
  getModuleStatus: () => api.get('/system/module-status'),
  getDialplanCapabilities: () => api.get('/system/dialplan-capabilities'),
};

export default {
  auth,
  tenants,
  leads,
  calls,
  dids,
  journeys,
  webhooks,
  sms,
  templates,
  transferGroups,
  email,
  reports,
  reportTemplates,
  dashboard,
  system,
}; 