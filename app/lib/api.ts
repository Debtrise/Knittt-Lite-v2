import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/app/store/authStore';
import {
  ApiError,
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  PaginatedResponse,
  RequestConfig,
  Metadata,
  WebhookEvent,
  WebhookTestResponse
} from '@/app/types/api';
import {
  TracersPhoneSearchRequest,
  TracersComprehensiveSearchRequest,
  TracersSearchResponse,
  LeadEnrichmentRequest,
  LeadEnrichmentResponse,
  BulkEnrichmentRequest,
  BulkEnrichmentResponse,
  EnrichmentStatusResponse,
  SearchHistoryResponse,
  UsageStatsResponse,
  TracersServiceStatus,
  TracersTestConnectionResponse,
  TracersTenantAccessRequest,
  TracersErrorResponse
} from '@/app/types/tracers';
import { Template, TemplateCategory, CreateTemplateData, TemplateListResponse, TemplateCategoryListResponse, TemplateType } from '@/app/types/templates';
import {
  EmailProvider,
  EmailConfig,
  EmailMessage,
  EmailTestRequest,
  EmailTestResponse,
  EmailStats,
  EmailSendRequest,
  EmailSendResponse,
  EmailTemplate,
  EmailTemplateCategory,
  EmailTemplateUsage,
  EmailTemplateRenderRequest,
  EmailTemplateRenderResponse,
  EmailTemplateListResponse,
  EmailCategoryListResponse,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
  CreateEmailCategoryRequest
} from '@/app/types/email';

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
const addAuthToken = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Add the interceptor to the api instance
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
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    
    // Transform response to match expected format
    // The actual API returns: { accessToken, refreshToken, user: { id, username, tenantId, role, ... } }
    if (response.data.user) {
      const { accessToken, user } = response.data;
      return {
        ...response,
        data: {
          token: accessToken,
          userId: user.id,
          username: user.username,
          tenantId: user.tenantId,
          role: user.role,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName
        }
      };
    }
    
    return response;
  },
  register: (data: RegisterRequest) => 
    api.post<ApiResponse<LoginResponse>>('/auth/register', data),
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
  
  // Update user role and permissions - NEW API ENDPOINT
  updateRolePermissions: (id: string, data: {
    role?: 'admin' | 'agent';
    permissions?: Record<string, any>;
  }) => api.put(`/users/${id}/role-permissions`, data),
  
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

// New interfaces for the additional endpoints
// New interfaces matching actual API responses
export interface TenantContextsResponse {
  contexts: string[];
  amiConfig: {
    host: string;
    port: number;
    connected: boolean;
  };
}

export interface UpdateContextsRequest {
  contexts: string[];
}

export interface UpdateContextsResponse {
  message: string;
  contexts: string[];
  mappingsUpdated: boolean;
}

// Legacy interface - keeping for backward compatibility
export interface TenantContext {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LeadTransferStatus {
  leadId: number;
  inTransfer: boolean;
  status: string;
  lastTransferDate?: string;
}

export interface ActiveCall {
  uniqueId: string;
  tenantId: string;
  channel: string;
  callerIdNum: string;
  startTime: string;
  status: string;
  context: string;
  leadId?: number;
  dialedNumber: string;
  duration: number;
}

export interface ActiveCallsResponse {
  activeCalls: ActiveCall[];
}

export const tenants = {
  create: (data: TenantData) => api.post<ApiResponse<TenantData>>('/tenants', data),
  get: (id: string) => api.get<ApiResponse<TenantData>>(`/tenants/${id}`),
  update: (id: string, data: Partial<TenantData>) => api.put<ApiResponse<TenantData>>(`/tenants/${id}`, data),
  
  // New: Get tenant's AMI contexts
  getContexts: () => api.get<TenantContextsResponse>('/tenant/contexts'),
  
  // New: Update tenant contexts (admin only)
  updateContexts: (request: UpdateContextsRequest) => 
    api.put<UpdateContextsResponse>('/tenant/contexts', request),
  
  // New: Get active calls for tenant
  getActiveCalls: (params?: {
    page?: number;
    limit?: number;
    agentId?: string;
    status?: string;
    direction?: 'inbound' | 'outbound';
  }) => api.get<ActiveCallsResponse>('/tenant/active-calls', { params }),
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
  
  // New: Check if lead is in transfer
  getTransferStatus: (id: string) => api.get<ApiResponse<LeadTransferStatus>>(`/leads/${id}/transfer-status`),
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
  // List call logs with pagination and filters
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    from?: string;
    to?: string;
    ingroup?: string;
  }) => {
    const response = await api.get('http://34.122.156.88:3001/api/call-logs', { params });
    return {
      calls: response.data.data,
      totalPages: response.data.totalPages,
      totalCount: response.data.totalCount
    };
  },

  // Get single call log by ID
  get: (id: string) => api.get(`http://34.122.156.88:3001/api/call-logs/${id}`),

  // Get call statistics
  getStats: (params?: {
    period?: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
    dateFrom?: string;
    dateTo?: string;
  }) => api.get('http://34.122.156.88:3001/api/call-logs/stats', { params }),

  // Update call status
  updateStatus: (id: string, status: 'initiated' | 'answered' | 'transferred' | 'completed' | 'failed') =>
    api.put(`http://34.122.156.88:3001/api/call-logs/${id}/status`, { status }),

  // Make a new call
  make: (data: {
    to: string;
    from: string;
    message?: string;
    transferNumber?: string;
    ingroup?: string;
    skipAgentCheck?: boolean;
    amd?: boolean;
    playPosition?: boolean;
    skipPositionAnnouncement?: boolean;
    ivrFile?: string;
    recordingId?: string;
  }) => api.post('http://34.122.156.88:3001/api/calls', data),
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
  getConfig: () => api.get<ApiResponse<TwilioConfig>>('/sms/twilio/config'),
  saveConfig: (data: TwilioConfig) => api.post<ApiResponse<TwilioConfig>>('/sms/twilio/config', data),
  testConnection: () => api.post<ApiResponse<{ success: boolean }>>('/sms/twilio/test'),
  
  // Phone Numbers
  listNumbers: () => api.get<ApiResponse<string[]>>('/sms/twilio/numbers'),
  syncNumbers: () => api.post<ApiResponse<{ added: string[]; removed: string[] }>>('/sms/twilio/numbers/sync'),
  
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
    brand?: string;
    ingroup?: string;
    type: 'roundrobin' | 'simultaneous' | 'priority' | 'percentage';
    apiConfig?: {
      url: string;
      user: string;
      password: string;
      source: string;
    };
    context?: {
      type: 'default' | 'custom';
      dialerContext?: string;
      content?: string;
    };
    settings?: {
      ringTimeout: number;
      voicemailEnabled: boolean;
      callRecording: boolean;
    };
    isActive: boolean;
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
    
  // Get transfer group configuration for journey steps
  getConfig: (groupId: string) =>
    api.get(`/transfer-groups/${groupId}/config`),
};

// Email endpoints - Comprehensive Mailgun Integration

export const email = {
  // Email Configuration Endpoints
  getProviders: () => api.get<ApiResponse<EmailProvider[]>>('/email/providers'),
  getConfig: () => api.get<ApiResponse<EmailConfig>>('/email/config'),
  saveConfig: (data: Omit<EmailConfig, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<EmailConfig>>('/email/config', data),
  test: (data: EmailTestRequest) => api.post<ApiResponse<EmailTestResponse>>('/email/test', data),
  getStats: (params?: { startDate?: string; endDate?: string }) => 
    api.get<ApiResponse<EmailStats>>('/email/stats', { params }),
  resetDailyLimit: () => api.post<ApiResponse<{ message: string }>>('/email/reset-daily-limit'),

  // Email Sending
  send: (data: EmailSendRequest) => api.post<ApiResponse<EmailSendResponse>>('/email/send', data),
};

// Email Template Management
export const emailTemplates = {
  // Template CRUD
  list: (params?: {
    type?: string;
    categoryId?: number;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<EmailTemplateListResponse>>('/templates', { params }),
  
  get: (id: number) => api.get<ApiResponse<EmailTemplate>>(`/templates/${id}`),
  
  create: (data: CreateEmailTemplateRequest) => 
    api.post<ApiResponse<EmailTemplate>>('/templates', data),
  
  update: (id: number, data: Partial<UpdateEmailTemplateRequest>) => 
    api.put<ApiResponse<EmailTemplate>>(`/templates/${id}`, data),
  
  delete: (id: number) => api.delete<ApiResponse<{ message: string }>>(`/templates/${id}`),
  
  // Template Operations
  render: (id: number, data: EmailTemplateRenderRequest) => 
    api.post<ApiResponse<EmailTemplateRenderResponse>>(`/templates/${id}/render`, data),
  
  clone: (id: number) => api.post<ApiResponse<EmailTemplate>>(`/templates/${id}/clone`),
  
  getUsage: (id: number, params?: { page?: number; limit?: number }) => 
    api.get<ApiResponse<{ usage: EmailTemplateUsage[]; totalCount: number; currentPage: number; totalPages: number }>>(`/templates/${id}/usage`, { params }),

  // Template Categories
  getCategories: (params?: { type?: string }) => 
    api.get<ApiResponse<EmailCategoryListResponse>>('/templates/categories', { params }),
  
  createCategory: (data: CreateEmailCategoryRequest) => 
    api.post<ApiResponse<EmailTemplateCategory>>('/templates/categories', data),
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
    } catch (error: any) {
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
    } catch (error: any) {
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
  // General Webhook Management
  list: (params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    webhookType?: 'go' | 'pause' | 'stop' | 'announcement' | 'call';
  }) => api.get<PaginatedResponse<Webhook>>('/webhooks', { params }),
  
  get: (id: string) => api.get<ApiResponse<Webhook>>(`/webhooks/${id}`),
  
  create: (data: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Webhook>>('/webhooks', data),
  
  update: (id: string, data: Partial<Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>>) => 
    api.put<ApiResponse<Webhook>>(`/webhooks/${id}`, data),
  
  delete: (id: string) => api.delete<ApiResponse<void>>(`/webhooks/${id}`),
  
  // Webhook Operations
  getEvents: (id: string, params: {
    page?: number;
    limit?: number;
    status?: 'success' | 'partial_success' | 'failed';
  }) => api.get<PaginatedResponse<WebhookEvent>>(`/webhooks/${id}/events`, { params }),
  
  test: (id: string, payload: Record<string, unknown>) => 
    api.post<ApiResponse<WebhookTestResponse>>(`/webhooks/${id}/test`, payload),
  
  regenerateKey: (id: string) => 
    api.post<ApiResponse<{ endpointKey: string; webhookUrl: string }>>(`/webhooks/${id}/regenerate-key`),
  
  regenerateToken: (id: string) => 
    api.post<ApiResponse<{ securityToken: string }>>(`/webhooks/${id}/regenerate-token`),
  
  // Webhook Configuration
  getConfigOptions: (webhookType?: 'go' | 'pause' | 'stop' | 'announcement' | 'call') => 
    api.get<ApiResponse<{ fields: string[]; operators: string[]; actions: string[] }>>('/webhooks/types/config-options', { params: { webhookType } }),

  getConditions: (id: string) => 
    api.get<ApiResponse<any>>(`/webhooks/${id}/conditions`),

  updateConditions: (id: string, conditions: any) => 
    api.put<ApiResponse<any>>(`/webhooks/${id}/conditions`, conditions),

  testConditions: (id: string, payload: Record<string, any>) => 
    api.post<ApiResponse<any>>(`/webhooks/${id}/test-conditions`, payload),

  getConditionOperators: () => 
    api.get<ApiResponse<Array<{ value: string; label: string; dataTypes: string[] }>>>('/webhooks/condition-operators'),

  getActionTypes: (webhookType?: 'go' | 'pause' | 'stop' | 'announcement') => 
    api.get<ApiResponse<Array<{ value: string; label: string; description: string }>>>('/webhooks/action-types', { params: { webhookType } }),

  // Announcement-Specific Endpoints
  announcement: {
    getTemplates: (params?: {
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => api.get<ApiResponse<any>>('/webhooks/announcement/templates', { params }),

    getDisplays: (params?: {
      status?: 'online' | 'offline' | 'any';
      location?: string;
      tags?: string;
      limit?: number;
    }) => api.get<ApiResponse<any>>('/webhooks/announcement/displays', { params }),

    getPresets: (params?: {
      category?: string;
      search?: string;
    }) => api.get<ApiResponse<any>>('/webhooks/announcement/presets', { params }),

    testAnnouncement: (id: string, testPayload: Record<string, any>) => 
      api.post<ApiResponse<any>>(`/webhooks/${id}/test-announcement`, { testPayload }),

    getMetrics: (id: string, params?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }) => api.get<ApiResponse<any>>(`/webhooks/${id}/announcement-metrics`, { params }),
  },

  // Pause/Resume Management
  pauseResume: {
    getPausedLeads: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      webhookId?: number;
    }) => api.get<ApiResponse<any>>('/webhooks/paused-leads', { params }),

    resumeLead: (pauseStateId: string, data?: any) => 
      api.post<ApiResponse<any>>(`/webhooks/paused-leads/${pauseStateId}/resume`, data),

    bulkResume: (pauseStateIds: string[]) => 
      api.post<ApiResponse<any>>('/webhooks/paused-leads/bulk-resume', { pauseStateIds }),

    getStats: (params?: {
      startDate?: string;
      endDate?: string;
    }) => api.get<ApiResponse<any>>('/webhooks/pause-resume-stats', { params }),
  },

  // Event & Execution Logs
  getExecutionLog: (eventId: string) => 
    api.get<ApiResponse<any>>(`/webhooks/events/${eventId}/execution-log`),
  
  // Public endpoints (no auth)
  health: (endpointKey: string) => 
    api.get<ApiResponse<{ status: 'healthy' | 'unhealthy'; lastCheck: string }>>(`/webhook-health/${endpointKey}`),
  
  capabilities: () => 
    api.get<ApiResponse<{ fields: string[]; operators: string[]; tags: string[] }>>('/system/webhook-capabilities'),
};

// SMS Provider and Messaging endpoints
export const smsProviders = {
  // Provider Management
  getProviders: () => api.get('/sms/providers'),
  setDefaultProvider: (provider: 'twilio' | 'meera') => 
    api.put('/sms/providers/default', { provider }),
  
  // Twilio Configuration
  getTwilioConfig: () => api.get('/sms/twilio/config'),
  saveTwilioConfig: (config: {
    accountSid: string;
    authToken: string;
    defaultFromNumber: string;
    settings?: {
      statusCallbackUrl?: string;
      enableDeliveryReports?: boolean;
    };
    rateLimits?: {
      messagesPerMinute?: number;
      messagesPerHour?: number;
      messagesPerDay?: number;
    };
  }) => api.post('/sms/twilio/config', config),
  testTwilioConnection: () => api.post('/sms/twilio/test'),
  
  // Meera Configuration
  getMeeraConfig: () => api.get('/sms/meera/config'),
  saveMeeraConfig: (config: {
    apiKey: string;
    apiSecret: string;
    baseUrl: string;
    defaultFromNumber: string;
    settings?: {
      messageType?: string;
      enableUnicode?: boolean;
      maxSegments?: number;
    };
    rateLimits?: {
      messagesPerSecond?: number;
      messagesPerMinute?: number;
      messagesPerHour?: number;
      messagesPerDay?: number;
    };
  }) => api.post('/sms/meera/config', config),
  testMeeraConnection: () => api.post('/sms/meera/test'),
  checkMeeraBalance: () => api.get('/sms/meera/balance'),
};

// SMS Messaging endpoints
export const smsMessaging = {
  // Send SMS (auto-detect provider)
  sendSms: (data: {
    to: string;
    body: string;
    from?: string;
    leadId?: number;
    provider?: 'twilio' | 'meera';
    metadata?: Record<string, any>;
  }) => api.post('/sms/send', data),
  
  // Send templated SMS
  sendTemplate: (data: {
    to: string;
    templateId: number;
    variables: Record<string, any>;
    leadId?: number;
    provider?: 'twilio' | 'meera';
    from?: string;
  }) => api.post('/sms/send-template', data),
};

// TracersAPI endpoints for lead enrichment
export const tracers = {
  // Search endpoints
  searchByPhone: (data: TracersPhoneSearchRequest) => 
    api.post<TracersSearchResponse>('/tracers/search/phone', data),
  
  searchComprehensive: (data: TracersComprehensiveSearchRequest) => 
    api.post<TracersSearchResponse>('/tracers/search', data),
  
  // Lead enrichment endpoints
  enrichLead: (leadId: number, data?: LeadEnrichmentRequest) => 
    api.post<LeadEnrichmentResponse>(`/tracers/enrich-lead/${leadId}`, data || {}),
  
  bulkEnrich: (data: BulkEnrichmentRequest) => 
    api.post<BulkEnrichmentResponse>('/tracers/bulk-enrich', data),
  
  getEnrichmentStatus: (leadId: number) => 
    api.get<EnrichmentStatusResponse>(`/tracers/enrichment/${leadId}`),
  
  // History and usage endpoints
  getSearchHistory: (params: {
    page?: number;
    limit?: number;
    leadId?: number;
    status?: 'success' | 'no_results' | 'error';
    startDate?: string;
    endDate?: string;
  }) => api.get<SearchHistoryResponse>('/tracers/search-history', { params }),
  
  getUsageStats: (params: {
    startDate?: string;
    endDate?: string;
  }) => api.get<UsageStatsResponse>('/tracers/usage', { params }),
  
  getServiceStatus: () => api.get<ApiResponse<TracersServiceStatus>>('/tracers/status'),
  
  // Admin endpoints
  testConnection: () => api.post<TracersTestConnectionResponse>('/tracers/test-connection'),
  
  manageTenantAccess: (tenantId: string, data: TracersTenantAccessRequest) => 
    api.put<ApiResponse<void>>(`/tracers/access/${tenantId}`, data),
};

// Content Creation API (using real backend endpoints from content-creator-api.md)
export const content = {
  // Templates - Real backend endpoints
  templates: {
    list: (params?: {
      category?: string;
      isPublic?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }) => api.get('/content/templates', { params }),
    
    get: (templateId: string) => api.get(`/content/templates/${templateId}`),
    
    create: (data: {
      name: string;
      description?: string;
      category: string;
      canvasSize: { width: number; height: number };
      elements?: any;
      variables?: any;
      tags?: string[];
      isPublic?: boolean;
      templateData?: any;
    }) => api.post('/content/templates', data),
    
    update: (templateId: string, data: any) => api.put(`/content/templates/${templateId}`, data),
    
    delete: (templateId: string) => api.delete(`/content/templates/${templateId}`),
    
    duplicate: (templateId: string, data: { name: string }) => 
      api.post(`/content/templates/${templateId}/duplicate`, data)
  },

  // Projects - Real backend endpoints
  getProjects: (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/content/projects', { params }),
  
  createProject: (data: {
    name: string;
    description?: string;
    templateId?: string;
    canvasSize: { width: number; height: number };
    canvasBackground?: any;
    variables?: any;
  }) => api.post('/content/projects', data),
  
  getProject: (projectId: string) => api.get(`/content/projects/${projectId}`),
  
  updateProject: (projectId: string, data: any) => api.put(`/content/projects/${projectId}`, data),
  
  deleteProject: (projectId: string) => api.delete(`/content/projects/${projectId}`),

  // Elements - Real backend endpoints
  createElement: (projectId: string, data: {
    elementType: string;
    position: { x: number; y: number; z: number };
    size: { width: number; height: number };
    properties: any;
    styles: any;
    animations?: any;
    layerOrder?: number;
    opacity?: number;
    assetId?: string;
    metadata?: any;
    isLocked?: boolean;
    isVisible?: boolean;
    groupId?: string;
    constraints?: any;
  }) => api.post(`/content/projects/${projectId}/elements`, data),
  
  updateElement: (projectId: string, elementId: string, data: any) => 
    api.put(`/content/projects/${projectId}/elements/${elementId}`, data),
  
  deleteElement: (projectId: string, elementId: string) => 
    api.delete(`/content/projects/${projectId}/elements/${elementId}`),
  
  reorderElements: (projectId: string, data: {
    elementOrders: Array<{ elementId: string; layerOrder: number }>;
  }) => api.put(`/content/projects/${projectId}/elements/reorder`, data),

  // Assets - Real backend endpoints
  getAssets: (params?: {
    assetType?: string;
    search?: string;
    tags?: string;
    page?: number;
    limit?: number;
  }) => api.get('/content/assets', { params }),
  
  uploadAsset: (formData: FormData) => api.post('/content/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  deleteAsset: (assetId: string) => api.delete(`/content/assets/${assetId}`),

  // Variables - Real backend endpoints
  getVariables: (params?: {
    category?: string;
    dataSource?: string;
  }) => api.get('/content/variables', { params }),
  
  createVariable: (data: {
    name: string;
    displayName: string;
    description?: string;
    dataType: 'string' | 'number' | 'date' | 'boolean' | 'image' | 'url';
    dataSource: 'lead' | 'call' | 'tenant' | 'system' | 'external_api' | 'static';
    sourceField?: string;
    defaultValue: any;
    formatTemplate?: string;
    category: string;
    isRequired?: boolean;
  }) => api.post('/content/variables', data),
  
  initializeSystemVariables: () => api.post('/content/variables/initialize-system'),

  // Preview & Export - Real backend endpoints
  generatePreview: (projectId: string, data?: {
    device?: string;
    contextData?: any;
  }) => api.post(`/content/projects/${projectId}/preview`, data),
  
  publishProject: (projectId: string, data: {
    displayIds: string[];
  }) => api.post(`/content/projects/${projectId}/publish`, data),
  
  getExportStatus: (exportId: string) => api.get(`/content/exports/${exportId}/status`),

  // OptiSync endpoints for public content access
  getOptiSyncProjects: () => api.get('/content/optisync/projects'),
  
  getOptiSyncProjectFeed: (projectId: string) => api.get(`/content/optisync/projects/${projectId}/feed`),
  
  notifyOptiSyncUpdate: (projectId: string, data: any) => 
    api.post(`/content/optisync/projects/${projectId}/webhook`, data),
  
  getPublicContent: (exportId: string) => api.get(`/content/public/${exportId}`),
  
  getOptiSyncStatus: () => api.get('/content/optisync/status'),

  // System
  getSystemStatus: () => api.get('/content/system/status'),
};

// Sales Rep Photos API Types
export interface SalesRepPhoto {
  id: string;
  repEmail: string;
  repName?: string;
  name?: string; // API returns 'name' field
  fileName?: string; // Keep for backward compatibility
  fileSize: number;
  mimeType?: string;
  photoUrl?: string; // Keep for backward compatibility
  url?: string; // API returns 'url' field
  thumbnailUrl?: string;
  previewUrls?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  dimensions?: {
    width: number;
    height: number;
  };
  uploadedAt: string;
  updatedAt?: string;
}

export interface SalesRepCsvRow {
  name: string;
  email: string;
  photoUrl: string;
}

export interface CsvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
  preview: SalesRepCsvRow[];
}

export interface BulkUploadResult {
  message: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  results?: {
    successful: Array<{
      email: string;
      photoId?: string;
      message: string;
    }>;
    failed: Array<{
      email: string;
      error: string;
    }>;
    skipped: Array<{
      email: string;
      reason: string;
    }>;
  };
}

// Sales Rep Photos API (using exact documented endpoints with enhanced authentication)
export const salesRepPhotos = {
  // Helper function to check user permissions
  checkPermissions: (requiredRole: 'admin' | 'agent' | 'any' = 'any') => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      throw new Error('Authentication required. Please log in.');
    }

    if (requiredRole !== 'any' && currentUser.role !== 'admin' && currentUser.role !== requiredRole) {
      throw new Error(`Access denied. ${requiredRole} role required.`);
    }

    return currentUser;
  },

  // Helper function to add user context to form data
  addUserContext: (formData: FormData) => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      formData.append('uploadedBy', currentUser.userId?.toString() || '');
      formData.append('tenantId', currentUser.tenantId?.toString() || '');
    }
    return formData;
  },

  // Upload single photo (requires authentication)
  uploadPhoto: (formData: FormData) => {
    // Check authentication and permissions
    const currentUser = salesRepPhotos.checkPermissions('any');
    
    // Validate required fields before sending
    const repEmail = formData.get('repEmail') as string;
    const photo = formData.get('photo') as File;
    
    if (!repEmail || !repEmail.trim()) {
      throw new Error('Sales rep email is required');
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(repEmail)) {
      throw new Error('Invalid email format');
    }
    
    if (!photo || photo.size === 0) {
      throw new Error('Photo file is required');
    }
    
    if (!photo.type.startsWith('image/')) {
      throw new Error('File must be an image (JPG, PNG, GIF, etc.)');
    }
    
    // Check file size (10MB limit)
    if (photo.size > 10 * 1024 * 1024) {
      throw new Error('Photo file size must be less than 10MB');
    }

    // Add user context for audit trail
    salesRepPhotos.addUserContext(formData);
    
    return api.post<ApiResponse<{ photo: SalesRepPhoto }>>('/sales-rep-photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Bulk upload multiple photos (requires authentication)
  bulkUpload: (formData: FormData) => {
    // Check authentication and permissions
    const currentUser = salesRepPhotos.checkPermissions('any');
    
    const photos = formData.getAll('photos') as File[];
    const mappings = formData.get('mappings') as string;
    
    if (!photos || photos.length === 0) {
      throw new Error('At least one photo file is required');
    }
    
    if (!mappings) {
      throw new Error('Photo mappings are required');
    }
    
    // Validate mappings JSON
    try {
      const mappingData = JSON.parse(mappings);
      if (!Array.isArray(mappingData)) {
        throw new Error('Mappings must be an array');
      }
    } catch (error) {
      throw new Error('Invalid mappings JSON format');
    }
    
    // Validate each photo
    photos.forEach((photo, index) => {
      if (!photo.type.startsWith('image/')) {
        throw new Error(`File ${index + 1} must be an image (JPG, PNG, GIF, etc.)`);
      }
      
      if (photo.size > 10 * 1024 * 1024) {
        throw new Error(`Photo file ${index + 1} size must be less than 10MB`);
      }
    });

    // Add user context for audit trail
    salesRepPhotos.addUserContext(formData);
    
    return api.post<ApiResponse<BulkUploadResult>>('/sales-rep-photos/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Bulk CSV upload - upload CSV with name, email, photoUrl columns (requires authentication)
  bulkCsvUpload: async (formData: FormData) => {
    // Check authentication and permissions
    const currentUser = salesRepPhotos.checkPermissions('any');
    
    const csvFile = formData.get('csv') as File;
    
    if (!csvFile || csvFile.size === 0) {
      throw new Error('CSV file is required');
    }
    
    // Check CSV file size (5MB limit for CSV files)
    if (csvFile.size > 5 * 1024 * 1024) {
      throw new Error('CSV file size must be less than 5MB');
    }
    
    // Validate CSV first
    const validation = await salesRepPhotos.validateCsv(csvFile);
    
    if (!validation.isValid) {
      throw new Error(`CSV validation failed: ${validation.errors.join(', ')}`);
    }
    
    if (validation.validRows === 0) {
      throw new Error('No valid rows found in CSV file');
    }
    
    // Add user context for audit trail
    salesRepPhotos.addUserContext(formData);
    
    return api.post<ApiResponse<BulkUploadResult>>('/sales-rep-photos/bulk-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Set fallback photo (admin only)
  setFallbackPhoto: (formData: FormData) => {
    // Check authentication and admin permissions
    const currentUser = salesRepPhotos.checkPermissions('admin');
    
    const photo = formData.get('photo') as File;
    
    if (!photo || photo.size === 0) {
      throw new Error('Photo file is required');
    }
    
    if (!photo.type.startsWith('image/')) {
      throw new Error('File must be an image (JPG, PNG, GIF, etc.)');
    }
    
    if (photo.size > 10 * 1024 * 1024) {
      throw new Error('Photo file size must be less than 10MB');
    }
    
    // Add user context for audit trail
    salesRepPhotos.addUserContext(formData);
    
    return api.post<ApiResponse<{ photo: SalesRepPhoto }>>('/sales-rep-photos/fallback', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Get fallback photo (public access)
  getFallbackPhoto: () => {
    // No auth check needed - fallback photos are public
    return api.get<ApiResponse<{ photo: SalesRepPhoto }>>('/sales-rep-photos/fallback');
  },
  
  // Get photo by email (requires authentication)
  getPhotoByEmail: (email: string) => {
    // Check authentication
    const currentUser = salesRepPhotos.checkPermissions('any');
    
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }
    
    return api.get<ApiResponse<{ photo: SalesRepPhoto }>>(`/sales-rep-photos/by-email/${encodeURIComponent(email)}`);
  },
  
  // Get all photos with pagination and search (requires authentication)
  getPhotos: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    // Check authentication
    const currentUser = salesRepPhotos.checkPermissions('any');
    
    // Add tenant context to params for multi-tenant filtering
    const enhancedParams = {
      ...params,
      tenantId: currentUser.tenantId
    };
    
    return api.get<{
      assets: SalesRepPhoto[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        limit: number;
      };
    }>('/sales-rep-photos', { params: enhancedParams });
  },

  // Alias for getPhotos to match component usage
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    return salesRepPhotos.getPhotos(params);
  },
  
  // Generate celebration video (requires authentication)
  generateVideo: (data: {
    repEmail: string;
    repName?: string;
    dealAmount?: number;
    companyName?: string;
  }) => {
    // Check authentication
    const currentUser = salesRepPhotos.checkPermissions('any');
    
    if (!data.repEmail || !data.repEmail.trim()) {
      throw new Error('Sales rep email is required');
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.repEmail)) {
      throw new Error('Invalid email format');
    }
    
    if (data.dealAmount !== undefined && (data.dealAmount < 0 || data.dealAmount > 10000000)) {
      throw new Error('Deal amount must be between 0 and 10,000,000');
    }

    // Add user context for audit trail
    const enhancedData = {
      ...data,
      requestedBy: currentUser.userId,
      tenantId: currentUser.tenantId
    };
    
    return api.post<ApiResponse<{
      videoUrl?: string;
      processingTimeMs?: number;
      message: string;
    }>>('/sales-rep-photos/generate-video', enhancedData);
  },
  
  // Delete photo by ID (admin only, or owner)
  deletePhoto: (id: string) => {
    // Check authentication (allow any authenticated user, backend will check ownership)
    const currentUser = salesRepPhotos.checkPermissions('any');
    
    if (!id || !id.trim()) {
      throw new Error('Photo ID is required');
    }
    
    return api.delete<ApiResponse<void>>(`/sales-rep-photos/${id}`, {
      data: {
        deletedBy: currentUser.userId,
        tenantId: currentUser.tenantId
      }
    });
  },

  // Helper function to validate CSV file (client-side, no auth needed)
  validateCsv: async (csvFile: File): Promise<{
    isValid: boolean;
    errors: string[];
    validRows: number;
    totalRows: number;
  }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const lines = csvContent.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            resolve({
              isValid: false,
              errors: ['CSV file is empty'],
              validRows: 0,
              totalRows: 0
            });
            return;
          }
          
          const headerLine = lines[0];
          const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
          
          // Check required columns
          const requiredColumns = ['name', 'email', 'photourl'];
          const missingColumns = requiredColumns.filter(col => !headers.includes(col));
          
          if (missingColumns.length > 0) {
            resolve({
              isValid: false,
              errors: [`Missing required columns: ${missingColumns.join(', ')}`],
              validRows: 0,
              totalRows: lines.length - 1
            });
            return;
          }
          
          // Validate data rows
          const dataLines = lines.slice(1);
          let validRows = 0;
          const errors: string[] = [];
          
          dataLines.forEach((line, index) => {
            const rowNum = index + 2; // +2 because index starts at 0 and we skip header
            const cells = line.split(',').map(c => c.trim().replace(/"/g, ''));
            
            if (cells.length !== headers.length) {
              errors.push(`Row ${rowNum}: Column count mismatch (expected ${headers.length}, got ${cells.length})`);
              return;
            }
            
            const emailIndex = headers.indexOf('email');
            const photoUrlIndex = headers.indexOf('photourl');
            
            const email = cells[emailIndex];
            const photoUrl = cells[photoUrlIndex];
            
            // Validate email
            if (!email || !email.trim()) {
              errors.push(`Row ${rowNum}: Email is required`);
              return;
            }
            
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              errors.push(`Row ${rowNum}: Invalid email format: ${email}`);
              return;
            }
            
            // Validate photo URL with more detailed error messages
            if (!photoUrl || !photoUrl.trim()) {
              errors.push(`Row ${rowNum}: Photo URL is required`);
              return;
            }
            
            const trimmedPhotoUrl = photoUrl.trim();
            
            // Check for valid URL protocols
            const isValidUrl = trimmedPhotoUrl.startsWith('http://') || 
                              trimmedPhotoUrl.startsWith('https://') || 
                              trimmedPhotoUrl.startsWith('data:');
            
            if (!isValidUrl) {
              // Provide specific guidance based on what was provided
              if (trimmedPhotoUrl.startsWith('ftp://')) {
                errors.push(`Row ${rowNum}: FTP URLs are not supported. Use HTTP/HTTPS: ${trimmedPhotoUrl}`);
              } else if (trimmedPhotoUrl.includes('://')) {
                errors.push(`Row ${rowNum}: Unsupported protocol. Use HTTP/HTTPS/data: ${trimmedPhotoUrl}`);
              } else if (trimmedPhotoUrl.includes('.')) {
                errors.push(`Row ${rowNum}: URL must include protocol (http:// or https://): ${trimmedPhotoUrl}`);
              } else {
                errors.push(`Row ${rowNum}: Invalid photo URL format. Must start with http://, https://, or data:: ${trimmedPhotoUrl}`);
              }
              return;
            }
            
            validRows++;
          });
          
          resolve({
            isValid: errors.length === 0 && validRows > 0,
            errors,
            validRows,
            totalRows: dataLines.length
          });
          
        } catch (error) {
          resolve({
            isValid: false,
            errors: ['Failed to parse CSV file'],
            validRows: 0,
            totalRows: 0
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          isValid: false,
          errors: ['Failed to read CSV file'],
          validRows: 0,
          totalRows: 0
        });
      };
      
      reader.readAsText(csvFile);
    });
  },

  // Get user's photo upload history (requires authentication)
  getUploadHistory: (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const currentUser = salesRepPhotos.checkPermissions('any');
    
    const enhancedParams = {
      ...params,
      userId: currentUser.userId,
      tenantId: currentUser.tenantId
    };
    
    return api.get<{
      uploads: Array<{
        id: string;
        repEmail: string;
        repName?: string;
        action: 'upload' | 'delete' | 'update';
        timestamp: string;
        result: 'success' | 'failed';
        details?: string;
      }>;
      pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        limit: number;
      };
    }>('/sales-rep-photos/history', { params: enhancedParams });
  },

  // Get photo usage statistics (admin only)
  getUsageStats: (params?: {
    period?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
  }) => {
    const currentUser = salesRepPhotos.checkPermissions('admin');
    
    return api.get<{
      stats: {
        totalPhotos: number;
        totalViews: number;
        totalDownloads: number;
        mostViewedPhotos: Array<{
          repEmail: string;
          repName?: string;
          views: number;
        }>;
        uploadsByPeriod: Array<{
          period: string;
          uploads: number;
        }>;
        usageByFeature: {
          contentCreator: number;
          celebrationVideos: number;
          emailSignatures: number;
          other: number;
        };
      };
    }>('/sales-rep-photos/stats', { params });
  }
};

// OptiSigns API (matching documented endpoints exactly from optisigns-service-api.md)
export const optisigns = {
  // Configuration
  testConnection: (data: { apiToken: string }) => api.post('/optisigns/config/test', data),
  updateConfig: (data: { apiToken: string; settings?: any }) => api.put('/optisigns/config', data),
  getConfig: () => api.get('/optisigns/config'),
  getStatus: () => api.get('/optisigns/status'),

  // Displays
  syncDisplays: () => api.post('/optisigns/displays/sync'),
  getDisplays: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    isOnline?: boolean;
    location?: string;
  }) => api.get('/optisigns/displays', { params }),
  
  getDisplay: (id: string) => api.get(`/optisigns/displays/${id}`),
  
  updateDisplay: (id: string, data: {
    name?: string;
    location?: string;
  }) => api.put(`/optisigns/displays/${id}`, data),

  // Tags
  addTagsToDisplay: (id: string, data: { tags: string[] }) => 
    api.post(`/optisigns/displays/${id}/tags`, data),
  
  removeTagsFromDisplay: (id: string, data: { tags: string[] }) => 
    api.delete(`/optisigns/displays/${id}/tags`, { data }),

  // Takeover
  initiateDeviceTakeover: (id: string, data: {
    contentType: 'ASSET' | 'PLAYLIST';
    contentId: string;
    priority?: 'EMERGENCY' | 'HIGH' | 'NORMAL';
    duration?: number;
    message?: string;
    restoreAfter?: boolean;
    teamId?: string;
  }) => api.post(`/optisigns/displays/${id}/takeover`, data),
  
  stopTakeover: (id: string, data?: {
    restoreContent?: boolean;
    reason?: string;
  }) => api.post(`/optisigns/displays/${id}/stop-takeover`, data),
  
  getTakeoverStatus: (id: string) => api.get(`/optisigns/displays/${id}/takeover-status`),
  
  listTakeovers: (params?: {
    page?: number;
    limit?: number;
    priority?: string;
    status?: string;
    displayId?: string;
  }) => api.get('/optisigns/takeovers', { params }),

  // Assets
  uploadAsset: (formData: FormData) => api.post('/optisigns/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  createWebsiteAsset: (data: {
    url: string;
    name: string;
    teamId?: string;
  }) => api.post('/optisigns/assets/website', data),
  
  syncAssets: () => api.post('/optisigns/assets/sync'),
  
  getAssets: (params?: {
    page?: number;
    limit?: number;
    type?: string;
  }) => api.get('/optisigns/assets', { params }),

  // Content Push
  pushContentToDisplay: (id: string, data: {
    contentId: string;
    schedule?: string;
    teamId?: string;
  }) => api.post(`/optisigns/displays/${id}/push`, data),

  // Status and Analytics
  getIntegrationStatus: () => api.get('/optisigns/status'),
};

// Marketplace endpoints
export const marketplace = {
  // Providers
  getProviders: (params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) => api.get('/marketplace/providers', { params }),
  
  createProvider: (data: {
    name: string;
    description: string;
    contact: {
      email: string;
      phone?: string;
      website?: string;
    };
  }) => api.post('/marketplace/providers', data),
  
  // Listings
  getListings: (params?: {
    limit?: number;
    offset?: number;
    search?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    leadQuality?: string;
    deliveryMethod?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/marketplace/listings', { params }),
  
  createListing: (data: {
    providerId: number;
    name: string;
    description?: string;
    pricePerLead: number;
    deliveryMethod: 'csv' | 'api' | 'email';
    availableLeads: number;
    category?: string;
    tags?: string[];
    geography?: string[];
    leadQuality?: 'basic' | 'premium' | 'enterprise';
    dataFields?: string[];
  }) => api.post('/marketplace/listings', data),
  
  purchaseListing: (listingId: number, data: {
    quantity: number;
    paymentMethod?: string;
  }) => api.post(`/marketplace/listings/${listingId}/purchase`, data),
  
  // Orders
  getOrders: (params?: {
    limit?: number;
    offset?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/marketplace/orders', { params }),
  
  // Stats
  getStats: () => api.get('/marketplace/stats'),
};

// Call logs API endpoints
export const callLogs = {
  // Get overview with statistics
  getOverview: (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    leadId?: string;
    didId?: string;
    ingroup?: string;
    context?: string;
    callDirection?: 'inbound' | 'outbound';
    page?: number;
    limit?: number;
  }) => api.get('http://34.122.156.88:3001/api/call-logs/overview', { params }),

  // Get call statistics
  getStats: (params?: {
    period?: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
    dateFrom?: string;
    dateTo?: string;
  }) => api.get('http://34.122.156.88:3001/api/call-logs/stats', { params }),

  // Get time-series statistics
  getStatisticsByPeriod: (params?: {
    period: 'hour' | 'day' | 'week' | 'month';
    startDate?: string;
    endDate?: string;
  }) => api.get('http://34.122.156.88:3001/api/call-logs/statistics', { params }),

  // Export call logs as CSV
  exportLogs: (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => api.get('http://34.122.156.88:3001/api/call-logs/export', { 
    params,
    responseType: 'blob'
  }),

  // Get agent performance
  getAgentPerformance: (params?: {
    agentId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get('http://34.122.156.88:3001/api/call-logs/agent-performance', { params }),

  // Get DID performance
  getDidPerformance: (params?: {
    didId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get('http://34.122.156.88:3001/api/call-logs/did-performance', { params }),

  // Get active calls
  getActiveCalls: () => api.get('http://34.122.156.88:3001/api/call-logs/active'),

  // Get all call logs (paginated)
  list: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    leadId?: string;
    didId?: string;
    search?: string;
  }) => api.get('http://34.122.156.88:3001/api/call-logs', { params }),

  // Get single call log details
  get: (id: string) => api.get(`http://34.122.156.88:3001/api/call-logs/${id}`),

  // Update call log
  update: (id: string, data: {
    disposition?: string;
    notes?: string;
    metadata?: Record<string, any>;
  }) => api.put(`http://34.122.156.88:3001/api/call-logs/${id}`, data),

  // Get call logs for specific lead
  getLeadCallLogs: (leadId: string, params?: {
    page?: number;
    limit?: number;
  }) => api.get(`http://34.122.156.88:3001/api/leads/${leadId}/call-logs`, { params }),

  // Search call logs by phone number
  searchByPhone: (phoneNumber: string) => 
    api.get(`http://34.122.156.88:3001/api/call-logs/search/${phoneNumber}`)
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
  smsProviders,
  smsMessaging,
  templates,
  transferGroups,
  email,
  reports,
  reportTemplates,
  dashboard,
  system,
  recordings,
  freepbx,
  tracers,
  content,
  optisigns,
  salesRepPhotos,
  marketplace,
  callLogs,
}; 