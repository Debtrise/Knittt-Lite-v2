import axios from 'axios';
import { useAuthStore } from '@/app/store/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';
const SMS_API_URL = process.env.NEXT_PUBLIC_SMS_API_URL || 'http://34.122.156.88:3100';

// Create axios instances with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate instance for local Next.js API routes (recordings)
const localApi = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const smsApi = axios.create({
  baseURL: SMS_API_URL,
  timeout: 30000,
  maxContentLength: 10 * 1024 * 1024,
  maxBodyLength: 10 * 1024 * 1024,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
const addAuthToken = (config: any) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(addAuthToken);
localApi.interceptors.request.use(addAuthToken);
smsApi.interceptors.request.use(addAuthToken);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

localApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
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
    role: 'admin' | 'agent';
  }) => api.post('/register', data),
};

// User Management endpoints
export const users = {
  // List all users (admin only) - WORKING
  list: (params?: {
    page?: number;
    limit?: number;
    role?: 'admin' | 'agent';
    search?: string;
  }) => api.get('/users', { params }),
  
  // Get user details - WORKING
  get: (id: string) => api.get(`/users/${id}`),
  
  // Create new user (admin only) - Use register endpoint
  create: (data: {
    username: string;
    password: string;
    email: string;
    role?: 'admin' | 'agent';
  }) => {
    // Get current user's tenant ID from auth store
    const currentUser = useAuthStore.getState().user;
    return api.post('/register', {
      ...data,
      tenantId: currentUser?.tenantId || '1', // Fallback to tenant 1
      role: data.role || 'agent'
    });
  },
  
  // Update user - May not be implemented, will try PUT endpoint
  update: (id: string, data: {
    username?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'agent';
  }) => api.put(`/users/${id}`, data),
  
  // Delete user (admin only) - May not be implemented
  delete: (id: string) => api.delete(`/users/${id}`),
  
  // Change password for current user - WORKING
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => api.post('/users/change-password', data),
  
  // Get current user profile - Fallback to getting user by ID
  me: () => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser?.userId) {
      return api.get(`/users/${currentUser.userId}`);
    }
    // Fallback: try the /users/me endpoint anyway (might be fixed)
    return api.get('/users/me');
  },
};

// Tenant endpoints
export const tenants = {
  create: (data: {
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
    timezone: string;
  }) => api.post('/tenants', data),
  get: (id: string) => api.get(`/tenants/${id}`),
  update: (id: string, data: any) => api.put(`/tenants/${id}`, data),
};

// Lead endpoints
export const leads = {
  upload: (fileContent: string, options: any) =>
    api.post('/leads/upload', { fileContent, options }),
  list: async (params: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'contacted' | 'transferred' | 'completed' | 'failed';
    phone?: string;
    name?: string;
    email?: string;
    brand?: string;
    source?: string;
  }) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },
  get: (id: string) => api.get(`/leads/${id}`),
  create: (data: {
    phone: string;
    name?: string;
    email?: string;
    brand?: string;
    source?: string;
    status?: 'pending' | 'contacted' | 'transferred' | 'completed' | 'failed';
    additionalData?: Record<string, any>;
  }) => api.post('/leads', data),
  update: (id: string, data: any) => api.put(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
  bulkDelete: (ids: number[]) => api.post('/leads/delete', { ids }),
};

// Call endpoints
export const calls = {
  make: (data: {
    to: string;
    transfer_number?: string;
    from?: string;
    leadId?: number;
    trunk?: string;
    context?: string;
    exten?: string;
    priority?: number;
    timeout?: number;
    async?: boolean;
    variables?: Record<string, string>;
  }) => api.post('/make-call', data),
  updateStatus: (id: string, status: 'initiated' | 'answered' | 'transferred' | 'completed' | 'failed') =>
    api.put(`/calls/${id}/status`, { status }),
  get: (id: string) => api.get(`/calls/${id}`),
  list: (params: {
    page?: number;
    limit?: number;
    status?: string;
    leadId?: number;
  }) => api.get('/calls', { params }),
};

// DID endpoints
export const dids = {
  list: (params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    areaCode?: string;
    state?: string;
  }) => api.get('/dids', { params }),
  get: (id: string) => api.get(`/dids/${id}`),
  create: (data: {
    phoneNumber: string;
    description: string;
    areaCode: string;
    state: string;
  }) => api.post('/dids', data),
  update: (id: string, data: {
    description?: string;
    isActive?: boolean;
    state?: string;
  }) => api.put(`/dids/${id}`, data),
  delete: (id: string) => api.delete(`/dids/${id}`),
  bulkDelete: (ids: number[]) => api.post('/dids/bulk-delete', { ids }),
};

// Journey endpoints
export const journeys = {
  list: (params?: { page?: number; limit?: number }) => 
    api.get('/journeys', { params }),
  get: (id: string) => api.get(`/journeys/${id}`),
  create: (data: {
    name: string;
    description: string;
    isActive: boolean;
    triggerCriteria: {
      leadStatus?: string[];
      leadTags?: string[];
      leadAgeDays?: { min?: number; max?: number };
      brands?: string[];
      sources?: string[];
      autoEnroll?: boolean;
    };
  }) => api.post('/journeys', data),
  update: (id: string, data: any) => api.put(`/journeys/${id}`, data),
  delete: (id: string, force: boolean = false) =>
    api.delete(`/journeys/${id}?force=${force}`),
  // Journey steps
  listSteps: (journeyId: string) => api.get(`/journeys/${journeyId}/steps`),
  createStep: (journeyId: string, data: {
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
  }) => api.post(`/journeys/${journeyId}/steps`, data),
  updateStep: (journeyId: string, stepId: string, data: any) =>
    api.put(`/journeys/${journeyId}/steps/${stepId}`, data),
  deleteStep: (journeyId: string, stepId: string, force: boolean = false) =>
    api.delete(`/journeys/${journeyId}/steps/${stepId}?force=${force}`),
  // Lead journey management
  getLeads: (journeyId: string, params: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/journeys/${journeyId}/leads`, { params }),
  enrollLeads: (journeyId: string, data: {
    leadIds: number[];
    restart?: boolean;
  }) => api.post(`/journeys/${journeyId}/enroll`, data),
  enrollLeadsByCriteria: (journeyId: string, data: {
    criteria: {
      brands?: string[];
      sources?: string[];
      leadAgeDays?: { min?: number; max?: number };
      leadStatus?: string[];
      leadTags?: string[];
    };
    restart?: boolean;
    limit?: number;
  }) => api.post(`/journeys/${journeyId}/enroll-by-criteria`, data),
  getLeadJourneys: (leadId: string) => api.get(`/leads/${leadId}/journeys`),
  updateLeadJourneyStatus: (leadId: string, journeyId: string, data: {
    status: string;
  }) => api.put(`/leads/${leadId}/journeys/${journeyId}/status`, data),
  executeStep: (leadId: string, journeyId: string, data: {
    stepId: number;
  }) => api.post(`/leads/${leadId}/journeys/${journeyId}/execute`, data),
  getMatchingStats: (journeyId: string) => 
    api.get(`/journeys/${journeyId}/matching-stats`),
  getStatistics: () => api.get('/journeys/stats'),
  getStatsByBrand: () => api.get('/stats/journeys/by-brand'),
  getStatsBySource: () => api.get('/stats/journeys/by-source'),
  getUpcomingExecutions: (options?: { limit?: number }) =>
    api.get('/executions/upcoming', { params: options }),
};

// Webhook endpoints
export const webhooks = {
  list: (params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }) => api.get('/webhooks', { params }),
  get: (id: string) => api.get(`/webhooks/${id}`),
  create: (data: {
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
  }) => api.post('/webhooks', data),
  update: (id: string, data: any) => api.put(`/webhooks/${id}`, data),
  delete: (id: string) => api.delete(`/webhooks/${id}`),
  getEvents: (id: string, params: {
    page?: number;
    limit?: number;
    status?: 'success' | 'partial_success' | 'failed';
  }) => api.get(`/webhooks/${id}/events`, { params }),
  test: (id: string, payload: Record<string, any>) => 
    api.post(`/webhooks/${id}/test`, payload),
};

// SMS/Twilio endpoints
export const sms = {
  // Configuration
  getConfig: () => api.get('/twilio/config'),
  saveConfig: (data: {
    accountSid: string;
    authToken: string;
    defaultFromNumber: string;
    settings: Record<string, any>;
    rateLimits: Record<string, any>;
  }) => api.post('/twilio/config', data),
  testConnection: () => api.post('/twilio/test'),
  
  // Phone Numbers
  listNumbers: () => api.get('/twilio/numbers'),
  syncNumbers: () => api.post('/twilio/numbers/sync'),
  
  // Messaging
  send: (data: {
    to: string;
    body: string;
    from?: string;
    leadId?: number;
    metadata?: Record<string, any>;
  }) => api.post('/sms/send', data),
  sendTemplate: (data: {
    to: string;
    templateId: number;
    variables: Record<string, any>;
    leadId?: number;
    from?: string;
    metadata?: Record<string, any>;
  }) => api.post('/sms/send-template', data),
  sendBulk: (data: {
    recipients: Array<{
      phone: string;
      leadId?: number;
      variables?: Record<string, any>;
      metadata?: Record<string, any>;
    }>;
    body?: string;
    templateId?: number;
    from?: string;
    throttle?: number;
  }) => api.post('/sms/send-bulk', data),
  
  // Conversations
  getConversation: (leadId: string, params: {
    page?: number;
    limit?: number;
    markAsRead?: boolean;
  }) => api.get(`/sms/conversation/${leadId}`, { params }),
  listConversations: (params: {
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get('/sms/conversations', { params }),
  
  // Messages
  getMessages: (params: {
    page?: number;
    limit?: number;
    direction?: 'inbound' | 'outbound';
    status?: string;
    leadId?: number;
    startDate?: string;
    endDate?: string;
  }) => api.get('/sms/messages', { params }),
  getMessage: (id: string) => api.get(`/sms/messages/${id}`),
};

// Template endpoints
export const templates = {
  listCategories: (type: 'sms' | 'email' | 'transfer' | 'script' | 'voicemail') =>
    api.get('/templates/categories', { params: { type } }),
  createCategory: (data: {
    name: string;
    description: string;
    type: 'sms' | 'email' | 'transfer' | 'script' | 'voicemail';
  }) => api.post('/templates/categories', data),
  list: (params: {
    type?: 'sms' | 'email' | 'transfer' | 'script' | 'voicemail';
    categoryId?: number;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => api.get('/templates', { params }),
  get: (id: string) => api.get(`/templates/${id}`),
  create: (data: {
    name: string;
    description: string;
    type: 'sms' | 'email' | 'transfer' | 'script' | 'voicemail';
    categoryId: number;
    subject?: string;
    content: string;
    htmlContent?: string;
    isActive: boolean;
  }) => api.post('/templates', data),
  update: (id: string, data: any) => api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  renderPreview: (id: string, data: {
    variables: Record<string, any>;
    context?: Record<string, any>;
  }) => api.post(`/templates/${id}/render`, data),
  clone: (id: string) => api.post(`/templates/${id}/clone`),
  getUsage: (id: string, params: {
    page?: number;
    limit?: number;
  }) => api.get(`/templates/${id}/usage`, { params }),
};

// Transfer group endpoints
export const transferGroups = {
  list: (params: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => api.get('/transfer-groups', { params }),
  get: (id: string) => api.get(`/transfer-groups/${id}`),
  create: (data: {
    name: string;
    description: string;
    type: 'roundrobin' | 'simultaneous' | 'priority' | 'percentage';
    brand: string;
    ingroup: string;
    isActive: boolean;
    settings: {
      ringTimeout: number;
      voicemailEnabled: boolean;
      callRecording: boolean;
    };
  }) => api.post('/transfer-groups', data),
  update: (id: string, data: any) => api.put(`/transfer-groups/${id}`, data),
  delete: (id: string) => api.delete(`/transfer-groups/${id}`),
  // Transfer numbers
  addNumber: (groupId: string, data: {
    phoneNumber: string;
    name: string;
    priority?: number;
    weight?: number;
    isActive: boolean;
    businessHours?: Record<string, any>;
    metadata?: Record<string, any>;
  }) => api.post(`/transfer-groups/${groupId}/numbers`, data),
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
  saveConfig: (data: {
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
    settings: Record<string, any>;
    fromEmail: string;
    fromName: string;
    replyToEmail: string;
    dailyLimit: number;
  }) => api.post('/email/config', data),
  test: (to: string) => api.post('/email/test', { to }),
  send: (data: {
    to: string;
    templateId: number;
    variables: Record<string, any>;
    attachments?: any[];
  }) => api.post('/email/send', data),
};

// Report endpoints
export const reports = {
  generateCallSummary: (data: {
    startDate: string;
    endDate: string;
    groupBy: 'hour' | 'day' | 'week' | 'month';
    filters?: {
      status?: string;
      agentId?: number;
      didId?: number;
    };
  }) => api.post('/reports/call-summary', data),
  generateSmsSummary: (data: {
    startDate: string;
    endDate: string;
    groupBy: 'hour' | 'day' | 'month';
    filters?: {
      direction?: 'outbound' | 'inbound';
      status?: string;
      fromNumber?: string;
    };
  }) => api.post('/reports/sms-summary', data),
  generateAgentPerformance: (data: {
    startDate: string;
    endDate: string;
    agentIds?: number[];
  }) => api.post('/reports/agent-performance', data),
  generateLeadConversion: (data: {
    startDate: string;
    endDate: string;
    sources?: string[];
    brands?: string[];
  }) => api.post('/reports/lead-conversion', data),
  generateJourneyAnalytics: (data: {
    startDate: string;
    endDate: string;
    journeyIds?: number[];
  }) => api.post('/reports/journey-analytics', data),
  generateCustom: (data: {
    query: string;
    parameters: Record<string, any>;
  }) => api.post('/reports/custom', data),
  export: (data: {
    reportData: Record<string, any>;
    format: 'csv' | 'excel' | 'pdf';
    filename: string;
  }) => api.post('/reports/export', data),
};

// Report template endpoints
export const reportTemplates = {
  list: () => api.get('/report-templates'),
  get: (id: string) => api.get(`/report-templates/${id}`),
  create: (data: {
    name: string;
    type: 'call_summary' | 'sms_summary' | 'agent_performance' | 'lead_conversion' | 'journey_analytics' | 'custom';
    config: Record<string, any>;
    schedule?: {
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      timezone: string;
      format: 'pdf' | 'csv' | 'excel';
      recipients: string[];
    };
  }) => api.post('/report-templates', data),
  update: (id: string, data: any) => api.put(`/report-templates/${id}`, data),
  delete: (id: string) => api.delete(`/report-templates/${id}`),
  execute: (id: string, data: {
    exportFormat: 'csv' | 'excel' | 'pdf';
  }) => api.post(`/report-templates/${id}/execute`, data),
  schedule: (id: string, data: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  }) => api.post(`/report-templates/${id}/schedule`, data),
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
  getAgentStatus: (params: {
    url: string;
    ingroup: string;
    user: string;
    pass: string;
  }) => {
    // Transform parameters to match backend expectations
    const backendParams = {
      url: params.url,
      user: params.user,
      pass: params.pass,
      ingroups: params.ingroup  // Backend expects 'ingroups' not 'ingroup'
    };
    return api.get('/agent-status', { params: backendParams });
  },
  getDailyReport: (date: string) =>
    api.get('/reports/daily', { params: { date } }),
  getModuleStatus: () => api.get('/system/module-status'),
  getDialplanCapabilities: () => api.get('/system/dialplan-capabilities'),
};

// Recording Management (Eleven Labs)
export const recordings = {
  getConfig: () => api.get('/elevenlabs/config'),
  configure: (data: { apiKey: string }) => 
    api.post('/elevenlabs/config', data),
  getVoices: () => api.get('/elevenlabs/voices'),
  getUsage: () => api.get('/elevenlabs/usage'),
  list: (params: {
    type?: 'ivr' | 'voicemail' | 'prompt' | 'announcement';
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => api.get('/recordings', { params }),
  get: (id: string) => api.get(`/recordings/${id}`),
  create: (data: {
    name: string;
    description: string;
    type: 'ivr' | 'voicemail' | 'prompt' | 'announcement';
    scriptText: string;
    templateId?: number;
    templateVariables?: Record<string, any>;
    elevenLabsVoiceId: string;
    elevenLabsSettings?: Record<string, any>;
  }) => api.post('/recordings', data),
  update: (id: string, data: any) => api.put(`/recordings/${id}`, data),
  delete: (id: string) => api.delete(`/recordings/${id}`),
  generateAudio: (id: string) => 
    api.post(`/recordings/${id}/generate`),
  uploadAudio: (formData: FormData) => 
    api.post('/recordings/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // New streaming endpoints
  stream: (id: string) => 
    api.get(`/recordings/${id}/stream`, {
      responseType: 'blob',
      headers: {
        'Accept': 'audio/*',
      },
    }),
  getMetadata: (id: string) => api.get(`/recordings/${id}/metadata`),
  // Enhanced preview endpoints
  preview: (data: {
    text: string;
    voiceId?: string;
    voiceSettings?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      useSpeakerBoost?: boolean;
    };
    modelId?: string;
  }) => api.post('/recordings/preview', data),
  streamPreview: (previewId: string) => 
    api.get(`/recordings/preview/${previewId}/stream`, {
      responseType: 'blob',
      headers: {
        'Accept': 'audio/*',
      },
    }),
  batchPreview: (data: {
    text: string;
    voiceIds: string[];
    voiceSettings?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      useSpeakerBoost?: boolean;
    };
  }) => api.post('/recordings/preview/batch', data),
  getVoicePresets: () => api.get('/recordings/voice-presets'),
  getAnalytics: (id: string, params: {
    startDate: string;
    endDate: string;
  }) => api.get(`/recordings/${id}/analytics`, { params }),
  getUsageHistory: (id: string, params: {
    page?: number;
    limit?: number;
  }) => api.get(`/recordings/${id}/usage`, { params }),
  trackUsage: (id: string, data: {
    usedIn: 'journey' | 'manual_call' | 'campaign' | 'test';
    entityType: string;
    entityId: number;
    leadId?: number;
    playDuration: number;
    userAction: string;
  }) => api.post(`/recordings/${id}/track-usage`, data),
};

// Recording Templates
export const recordingTemplates = {
  list: (params: {
    category?: string;
    page?: number;
    limit?: number;
  }) => api.get('/recording-templates', { params }),
  get: (id: string) => api.get(`/recording-templates/${id}`),
  create: (data: {
    name: string;
    description: string;
    category: string;
    scriptTemplate: string;
    suggestedVoiceId: string;
  }) => api.post('/recording-templates', data),
  update: (id: string, data: any) => api.put(`/recording-templates/${id}`, data),
  delete: (id: string) => api.delete(`/recording-templates/${id}`),
  createRecording: (id: string, data: {
    name: string;
    description: string;
    type: 'ivr' | 'voicemail' | 'prompt' | 'announcement';
    variables: Record<string, any>;
    voiceId: string;
  }) => api.post(`/recording-templates/${id}/create-recording`, data),
};

export default {
  auth,
  users,
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
  recordings,
  recordingTemplates,
}; 