import axios, { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/app/store/authStore';
import {
  ApiError,
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  PaginatedResponse,
  RequestConfig,
  Metadata
} from '@/app/types/api';
import { Template, TemplateCategory, CreateTemplateData, TemplateListResponse, TemplateCategoryListResponse } from '@/app/types/templates';

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

// Add request interceptor to add auth token and tenant ID
const addAuthToken = (config: AxiosRequestConfig): AxiosRequestConfig => {
  const token = useAuthStore.getState().token;
  const user = useAuthStore.getState().user;
  
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add tenant ID to headers for all requests
  if (user?.tenantId) {
    config.headers = config.headers || {};
    config.headers['X-Tenant-ID'] = user.tenantId;
    
    // For FreePBX related endpoints, also add as query parameter
    if (config.url && (config.url.includes('freepbx') || config.url.includes('upload-to-freepbx'))) {
      const separator = config.url.includes('?') ? '&' : '?';
      config.url += `${separator}tenantId=${user.tenantId}`;
    }
  }
  
  return config;
};

api.interceptors.request.use(addAuthToken);
localApi.interceptors.request.use(addAuthToken);
smsApi.interceptors.request.use(addAuthToken);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  (error: ApiError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

localApi.interceptors.response.use(
  response => response,
  (error: ApiError) => {
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
    api.post<ApiResponse<LoginResponse>>('/login', { username, password }),
  register: (data: RegisterRequest) => 
    api.post<ApiResponse<LoginResponse>>('/register', data),
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
export interface TenantApiConfig {
  source: string;
  endpoint: string;
  user: string;
  password: string;
  ingroup: string;
  url: string;
  ingroups?: string;
}

export interface TenantAmiConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  trunk: string;
  context: string;
}

export interface TenantSchedule {
  enabled: boolean;
  start: string;
  end: string;
}

export interface TenantData {
  name: string;
  apiConfig: TenantApiConfig;
  amiConfig: TenantAmiConfig;
  schedule: {
    monday: TenantSchedule;
    tuesday: TenantSchedule;
    wednesday: TenantSchedule;
    thursday: TenantSchedule;
    friday: TenantSchedule;
    saturday: TenantSchedule;
    sunday: TenantSchedule;
  };
  timezone: string;
  dialerConfig?: {
    speed: number;
    minAgentsAvailable: number;
    autoDelete: boolean;
    sortOrder: 'oldest' | 'fewest';
    didDistribution: 'even' | 'local';
  };
}

export const tenants = {
  create: (data: TenantData) => api.post<ApiResponse<TenantData>>('/tenants', data),
  get: (id: string) => api.get<ApiResponse<TenantData>>(`/tenants/${id}`),
  update: (id: string, data: Partial<TenantData>) => api.put<ApiResponse<TenantData>>(`/tenants/${id}`, data),
};

// Lead endpoints
export interface Lead {
  id: number;
  phone: string;
  name?: string;
  email?: string;
  brand?: string;
  source?: string;
  status: 'pending' | 'contacted' | 'transferred' | 'completed' | 'failed';
  additionalData?: Record<string, unknown>;
}

export const leads = {
  upload: (fileContent: string, options: Record<string, unknown>) =>
    api.post<ApiResponse<{ count: number }>>('/leads/upload', { fileContent, options }),
  
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
    const response = await api.get<PaginatedResponse<Lead>>('/leads', { params });
    return response.data;
  },
  
  get: (id: string) => api.get<ApiResponse<Lead>>(`/leads/${id}`),
  
  create: (data: Omit<Lead, 'id'>) => api.post<ApiResponse<Lead>>('/leads', data),
  
  update: (id: string, data: Partial<Omit<Lead, 'id'>>) => 
    api.put<ApiResponse<Lead>>(`/leads/${id}`, data),
  
  delete: (id: string) => api.delete<ApiResponse<void>>(`/leads/${id}`),
  
  bulkDelete: (ids: number[]) => api.post<ApiResponse<void>>('/leads/delete', { ids }),
};

// Call endpoints
export interface Call {
  id: string;
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
  status: 'initiated' | 'answered' | 'transferred' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  duration?: number;
}

export const calls = {
  make: (data: Omit<Call, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Call>>('/make-call', data),
  
  updateStatus: (id: string, status: Call['status']) =>
    api.put<ApiResponse<Call>>(`/calls/${id}/status`, { status }),
  
  get: (id: string) => api.get<ApiResponse<Call>>(`/calls/${id}`),
  
  list: (params: {
    page?: number;
    limit?: number;
    status?: string;
    leadId?: number;
  }) => api.get<PaginatedResponse<Call>>('/calls', { params }),
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
  bulkUpload: (fileContent: string) => api.post('/dids/bulk-upload', { fileContent }),
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

// SMS/Twilio endpoints
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  defaultFromNumber: string;
  settings: Record<string, unknown>;
  rateLimits: Record<string, unknown>;
}

export interface SmsMessage {
  id: string;
  to: string;
  from: string;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  direction: 'inbound' | 'outbound';
  leadId?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const sms = {
  // Configuration
  getConfig: () => api.get<ApiResponse<TwilioConfig>>('/twilio/config'),
  saveConfig: (data: TwilioConfig) => api.post<ApiResponse<TwilioConfig>>('/twilio/config', data),
  testConnection: () => api.post<ApiResponse<{ success: boolean }>>('/twilio/test'),
  
  // Phone Numbers
  listNumbers: () => api.get<ApiResponse<string[]>>('/twilio/numbers'),
  syncNumbers: () => api.post<ApiResponse<{ added: string[]; removed: string[] }>>('/twilio/numbers/sync'),
  
  // Messaging
  send: (data: {
    to: string;
    body: string;
    from?: string;
    leadId?: number;
    metadata?: Record<string, unknown>;
  }) => api.post<ApiResponse<SmsMessage>>('/sms/send', data),
  
  sendTemplate: (data: {
    to: string;
    templateId: number;
    variables: Record<string, unknown>;
    leadId?: number;
    from?: string;
    metadata?: Record<string, unknown>;
  }) => api.post<ApiResponse<SmsMessage>>('/sms/send-template', data),
  
  sendBulk: (data: {
    recipients: Array<{
      phone: string;
      leadId?: number;
      variables?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }>;
    body?: string;
    templateId?: number;
    from?: string;
    throttle?: number;
  }) => api.post<ApiResponse<{ messages: SmsMessage[] }>>('/sms/send-bulk', data),
  
  // Conversations
  getConversation: (leadId: string, params: {
    page?: number;
    limit?: number;
    markAsRead?: boolean;
  }) => api.get<PaginatedResponse<SmsMessage>>(`/sms/conversation/${leadId}`, { params }),
  
  listConversations: (params: {
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get<PaginatedResponse<{
    leadId: number;
    lastMessage: SmsMessage;
    unreadCount: number;
  }>>('/sms/conversations', { params }),
  
  // Messages
  getMessages: (params: {
    page?: number;
    limit?: number;
    direction?: 'inbound' | 'outbound';
    status?: string;
    leadId?: number;
    startDate?: string;
    endDate?: string;
  }) => api.get<PaginatedResponse<SmsMessage>>('/sms/messages', { params }),
  
  getMessage: (id: string) => api.get<ApiResponse<SmsMessage>>(`/sms/messages/${id}`),
};

// Template endpoints
export const templates = {
  list: (params: {
    type: TemplateType;
    isActive?: boolean;
    categoryId?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get<TemplateListResponse>('/templates', { params }),

  get: (id: number) => api.get<ApiResponse<Template>>(`/templates/${id}`),

  create: (data: CreateTemplateData) => 
    api.post<ApiResponse<Template>>('/templates', data),

  update: (id: number, data: Partial<CreateTemplateData>) => 
    api.put<ApiResponse<Template>>(`/templates/${id}`, data),

  delete: (id: number) => api.delete<ApiResponse<void>>(`/templates/${id}`),

  listCategories: (type: TemplateType) => 
    api.get<TemplateCategoryListResponse>('/templates/categories', { params: { type } }),

  createCategory: (data: Omit<TemplateCategory, 'id'>) => 
    api.post<ApiResponse<TemplateCategory>>('/templates/categories', data),

  updateCategory: (id: number, data: Partial<Omit<TemplateCategory, 'id'>>) => 
    api.put<ApiResponse<TemplateCategory>>(`/templates/categories/${id}`, data),

  deleteCategory: (id: number) => 
    api.delete<ApiResponse<void>>(`/templates/categories/${id}`),

  renderPreview: (id: string, data: {
    variables: Record<string, string>;
    context?: Record<string, unknown>;
  }) => api.post<ApiResponse<{ content: string }>>(`/templates/${id}/render`, data),
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
export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  settings: Record<string, unknown>;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  dailyLimit: number;
}

export interface EmailMessage {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const email = {
  getConfig: () => api.get<ApiResponse<EmailConfig>>('/email/config'),
  saveConfig: (data: EmailConfig) => api.post<ApiResponse<EmailConfig>>('/email/config', data),
  test: (to: string) => api.post<ApiResponse<{ success: boolean }>>('/email/test', { to }),
  send: (data: {
    to: string;
    templateId: number;
    variables: Record<string, unknown>;
    attachments?: Array<{
      filename: string;
      content: string;
      contentType: string;
    }>;
  }) => api.post<ApiResponse<EmailMessage>>('/email/send', data),
};

// Report endpoints
export interface ReportData {
  startDate: string;
  endDate: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  filters?: Record<string, unknown>;
}

export interface ReportSummary {
  data: Array<{
    timestamp: string;
    count: number;
    [key: string]: unknown;
  }>;
  totals: Record<string, number>;
  metadata: Record<string, unknown>;
}

export const reports = {
  generateCallSummary: (data: ReportData & {
    groupBy: 'hour' | 'day' | 'week' | 'month';
    filters?: {
      status?: string;
      agentId?: number;
      didId?: number;
    };
  }) => api.post<ApiResponse<ReportSummary>>('/reports/call-summary', data),

  generateSmsSummary: (data: ReportData & {
    groupBy: 'hour' | 'day' | 'month';
    filters?: {
      direction?: 'outbound' | 'inbound';
      status?: string;
      fromNumber?: string;
    };
  }) => api.post<ApiResponse<ReportSummary>>('/reports/sms-summary', data),

  generateAgentPerformance: (data: {
    startDate: string;
    endDate: string;
    agentIds?: number[];
  }) => api.post<ApiResponse<Array<{
    agentId: number;
    agentName: string;
    totalCalls: number;
    answeredCalls: number;
    averageDuration: number;
    totalTransfers: number;
    conversionRate: number;
  }>>>('/reports/agent-performance', data),

  generateLeadConversion: (data: {
    startDate: string;
    endDate: string;
    sources?: string[];
    brands?: string[];
  }) => api.post<ApiResponse<Array<{
    source: string;
    brand: string;
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    averageConversionTime: number;
  }>>>('/reports/lead-conversion', data),

  generateJourneyAnalytics: (data: {
    startDate: string;
    endDate: string;
    journeyIds?: number[];
  }) => api.post<ApiResponse<Array<{
    journeyId: number;
    journeyName: string;
    totalEnrollments: number;
    completedEnrollments: number;
    averageCompletionTime: number;
    stepAnalytics: Array<{
      stepId: number;
      stepName: string;
      totalExecutions: number;
      successRate: number;
      averageExecutionTime: number;
    }>;
  }>>>('/reports/journey-analytics', data),

  generateCustom: (data: {
    query: string;
    parameters: Record<string, unknown>;
  }) => api.post<ApiResponse<unknown>>('/reports/custom', data),

  export: (data: {
    reportData: Record<string, unknown>;
    format: 'csv' | 'excel' | 'pdf';
    filename: string;
  }) => api.post<ApiResponse<{ url: string }>>('/reports/export', data),
};

// Report template endpoints
export interface ReportTemplate {
  id: string;
  name: string;
  type: 'call_summary' | 'sms_summary' | 'agent_performance' | 'lead_conversion' | 'journey_analytics' | 'custom';
  config: Record<string, unknown>;
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    timezone: string;
    format: 'pdf' | 'csv' | 'excel';
    recipients: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export const reportTemplates = {
  list: () => api.get<ApiResponse<ReportTemplate[]>>('/report-templates'),
  get: (id: string) => api.get<ApiResponse<ReportTemplate>>(`/report-templates/${id}`),
  create: (data: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<ReportTemplate>>('/report-templates', data),
  update: (id: string, data: Partial<Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>>) => 
    api.put<ApiResponse<ReportTemplate>>(`/report-templates/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<void>>(`/report-templates/${id}`),
  execute: (id: string, data: {
    exportFormat: 'csv' | 'excel' | 'pdf';
  }) => api.post<ApiResponse<{ url: string }>>(`/report-templates/${id}/execute`, data),
  schedule: (id: string, data: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  }) => api.post<ApiResponse<ReportTemplate>>(`/report-templates/${id}/schedule`, data),
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
export interface ElevenLabsConfig {
  apiKey: string;
}

export interface ElevenLabsVoice {
  id: string;
  name: string;
  category: string;
  previewUrl: string;
  settings?: {
    stability: number;
    similarityBoost: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
}

export interface Recording {
  id: string;
  name: string;
  description: string;
  type: 'ivr' | 'voicemail' | 'prompt' | 'announcement';
  scriptText: string;
  templateId?: number;
  templateVariables?: Record<string, unknown>;
  elevenLabsVoiceId: string;
  elevenLabsSettings?: {
    stability: number;
    similarityBoost: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
  audioUrl?: string;
  duration?: number;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecordingAnalytics {
  totalPlays: number;
  uniqueLeads: number;
  averagePlayDuration: number;
  completionRate: number;
  usageByJourney: Array<{
    journeyId: number;
    journeyName: string;
    plays: number;
  }>;
  usageByDay: Array<{
    date: string;
    plays: number;
  }>;
}

export const recordings = {
  getConfig: () => api.get<ApiResponse<ElevenLabsConfig>>('/elevenlabs/config'),
  configure: (data: { apiKey: string }) => 
    api.post<ApiResponse<ElevenLabsConfig>>('/elevenlabs/config', data),
  getVoices: () => api.get<ApiResponse<ElevenLabsVoice[]>>('/elevenlabs/voices'),
  getUsage: () => api.get<ApiResponse<{
    character_count: number;
    character_limit: number;
    voice_limit: number;
    can_extend_character_limit: boolean;
  }>>('/elevenlabs/usage'),
  
  list: (params: {
    type?: 'ivr' | 'voicemail' | 'prompt' | 'announcement';
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => api.get<PaginatedResponse<Recording>>('/recordings', { params }),
  
  get: (id: string) => api.get<ApiResponse<Recording>>(`/recordings/${id}`),
  
  create: (data: Omit<Recording, 'id' | 'status' | 'audioUrl' | 'duration' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Recording>>('/recordings', data),
  
  update: (id: string, data: Partial<Omit<Recording, 'id' | 'status' | 'audioUrl' | 'duration' | 'createdAt' | 'updatedAt'>>) => 
    api.put<ApiResponse<Recording>>(`/recordings/${id}`, data),
  
  delete: (id: string) => api.delete<ApiResponse<void>>(`/recordings/${id}`),
  
  generateAudio: (id: string) => 
    api.post<ApiResponse<{ status: string }>>(`/recordings/${id}/generate`),
  
  uploadAudio: (formData: FormData) => {
    const user = useAuthStore.getState().user;
    if (user?.tenantId) {
      formData.append('tenantId', user.tenantId);
    }
    return api.post<ApiResponse<Recording>>('/recordings/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  stream: (id: string) => 
    api.get<Blob>(`/recordings/${id}/stream`, {
      responseType: 'blob',
      headers: { 'Accept': 'audio/*' },
    }),
  
  getMetadata: (id: string) => api.get<ApiResponse<{
    duration: number;
    format: string;
    bitrate: number;
    size: number;
  }>>(`/recordings/${id}/metadata`),
  
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
  }) => api.post<ApiResponse<{ previewId: string }>>('/recordings/preview', data),
  
  streamPreview: (previewId: string) => 
    api.get<Blob>(`/recordings/preview/${previewId}/stream`, {
      responseType: 'blob',
      headers: { 'Accept': 'audio/*' },
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
  }) => api.post<ApiResponse<Array<{
    voiceId: string;
    previewId: string;
  }>>>('/recordings/preview/batch', data),
  
  getVoicePresets: () => api.get<ApiResponse<Array<{
    name: string;
    settings: {
      stability: number;
      similarityBoost: number;
      style?: number;
      useSpeakerBoost?: boolean;
    };
  }>>>('/recordings/voice-presets'),
  
  getAnalytics: (id: string, params: {
    startDate: string;
    endDate: string;
  }) => api.get<ApiResponse<RecordingAnalytics>>(`/recordings/${id}/analytics`, { params }),
  
  getUsageHistory: (id: string, params: {
    page?: number;
    limit?: number;
  }) => api.get<PaginatedResponse<{
    timestamp: string;
    usedIn: 'journey' | 'manual_call' | 'campaign' | 'test';
    entityType: string;
    entityId: number;
    leadId?: number;
    playDuration: number;
    userAction: string;
  }>>(`/recordings/${id}/usage`, { params }),
  
  trackUsage: (id: string, data: {
    usedIn: 'journey' | 'manual_call' | 'campaign' | 'test';
    entityType: string;
    entityId: number;
    leadId?: number;
    playDuration: number;
    userAction: string;
  }) => api.post<ApiResponse<void>>(`/recordings/${id}/track-usage`, data),
};

// FreePBX Integration
export interface FreePBXConfig {
  serverUrl: string;
  username: string;
  password: string;
}

export const freepbx = {
  test: (data: FreePBXConfig) => {
    const user = useAuthStore.getState().user;
    return api.post<ApiResponse<{ success: boolean }>>('/recordings/test-freepbx', {
      ...data,
      tenantId: user?.tenantId || '1'
    });
  },
  
  syncRecording: async (recordingId: string) => {
    try {
      const user = useAuthStore.getState().user;
      const tenantId = user?.tenantId || '1';
      
      return await api.post<ApiResponse<{ status: string }>>(
        `/recordings/${recordingId}/sync-freepbx?tenantId=${tenantId}`,
        { tenantId }
      );
    } catch (error: ApiError) {
      console.error('FreePBX sync error:', error);
      throw error;
    }
  },

  uploadRecording: async (recordingId: string) => {
    try {
      const user = useAuthStore.getState().user;
      const tenantId = user?.tenantId || '1';
      
      return await api.post<ApiResponse<{ status: string }>>(
        `/recordings/${recordingId}/upload-to-freepbx?tenantId=${tenantId}`,
        { tenantId }
      );
    } catch (error: ApiError) {
      if (error.response?.status === 404) {
        throw new Error('FreePBX upload functionality is not yet implemented on the backend. Please contact your system administrator.');
      }
      if (error.response?.data?.error?.includes('Upload failed')) {
        throw new Error('FreePBX upload failed. Please check your FreePBX server connection and credentials.');
      }
      throw error;
    }
  },
};

// Webhook endpoints
export interface Webhook {
  id: number;
  name: string;
  description: string;
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
  requiredHeaders?: Record<string, string>;
  autoEnrollJourneyId?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const webhooks = {
  list: (params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }) => api.get<PaginatedResponse<Webhook>>('/webhooks', { params }),
  
  get: (id: string) => api.get<ApiResponse<Webhook>>(`/webhooks/${id}`),
  
  create: (data: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Webhook>>('/webhooks', data),
  
  update: (id: string, data: Partial<Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>>) => 
    api.put<ApiResponse<Webhook>>(`/webhooks/${id}`, data),
  
  delete: (id: string) => api.delete<ApiResponse<void>>(`/webhooks/${id}`),
  
  getEvents: (id: string, params: {
    page?: number;
    limit?: number;
    status?: 'success' | 'partial_success' | 'failed';
  }) => api.get<PaginatedResponse<WebhookEvent>>(`/webhooks/${id}/events`, { params }),
  
  test: (id: string, payload: Record<string, unknown>) => 
    api.post<ApiResponse<WebhookTestResponse>>(`/webhooks/${id}/test`, payload),
  
  regenerateKey: (id: string) => 
    api.post<ApiResponse<{ key: string }>>(`/webhooks/${id}/regenerate-key`),
  
  regenerateToken: (id: string) => 
    api.post<ApiResponse<{ token: string }>>(`/webhooks/${id}/regenerate-token`),
  
  health: (endpointKey: string) => 
    api.get<ApiResponse<{ status: 'healthy' | 'unhealthy'; lastCheck: string }>>(`/webhook-health/${endpointKey}`),
  
  capabilities: () => 
    api.get<ApiResponse<{ fields: string[]; operators: string[]; tags: string[] }>>('/system/webhook-capabilities'),
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
  freepbx,
}; 