// Types for the Webhook API

export type WebhookType = 'go' | 'pause' | 'stop' | 'announcement';

export interface WebhookEndpoint {
  id: number;
  tenantId: string;
  name: string;
  description: string;
  endpointKey: string;
  webhookUrl?: string; // Only returned in detailed responses
  webhookType: WebhookType;
  isActive: boolean;
  brand: string;
  source: string;
  fieldMapping: FieldMapping;
  validationRules: ValidationRules;
  autoTagRules?: AutoTagRule[];
  securityToken?: string;
  requiredHeaders?: Record<string, string>;
  autoEnrollJourneyId?: number | null;
  testPayload?: Record<string, any>;
  conditionalRules?: ConditionalRules;
  pauseResumeConfig?: PauseResumeConfig;
  stopConfig?: StopConfig;
  announcementConfig?: AnnouncementConfig;
  createdAt: string;
  updatedAt: string;
}

export interface FieldMapping {
  phone?: string;
  name?: string;
  email?: string;
  [key: string]: string | undefined;
}

export interface ValidationRules {
  requirePhone: boolean;
  requireName: boolean;
  requireEmail: boolean;
  allowDuplicatePhone: boolean;
}

export interface AutoTagRule {
  field: string;
  operator: 'equals' | 'contains' | 'exists';
  value?: string;
  tag: string;
}

export interface WebhookEvent {
  id: number;
  webhookId: number;
  status: 'success' | 'failed' | 'partial_success';
  receivedAt: string;
  ipAddress: string;
  processingTime: number;
  createdLeadIds: number[];
  affectedLeadIds: number[];
  payload: Record<string, any>;
  errorMessage?: string;
  validationErrors?: string[];
  processedData?: Record<string, any>;
  headers?: Record<string, string>;
  responseData?: Record<string, any>;
  pauseResumeActions?: {
    leadsPaused: number;
    leadsResumed: number;
    journeysPaused: number;
    journeysResumed: number;
  };
  stopActions?: {
    leadsStopped: number;
    journeysExited: number;
    leadsMarkedDNC: number;
    leadsMarkedSold: number;
  };
  announcementActions?: {
    contentGenerated: boolean;
    contentId?: string;
    displaysTriggered: number;
    successfulDisplays: number;
    failedDisplays: number;
    totalDuration: number;
    variablesInjected: Record<string, any>;
    contentGenerationTime: number;
  };
}

export interface WebhookListResponse {
  webhooks: WebhookEndpoint[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface WebhookEventListResponse {
  events: WebhookEvent[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface WebhookTestResponse {
  success: boolean;
  processedLeads: {
    phone: string;
    name: string;
    email?: string;
    brand: string;
    source: string;
    additionalData?: Record<string, any>;
  }[];
  errors: string[];
  validCount: number;
  errorCount: number;
}

export interface CreateWebhookParams {
  name: string;
  description: string;
  webhookType: WebhookType;
  brand: string;
  source: string;
  fieldMapping: FieldMapping;
  validationRules: ValidationRules;
  autoTagRules?: AutoTagRule[];
  requiredHeaders?: Record<string, string>;
  autoEnrollJourneyId?: number | null;
  conditionalRules?: ConditionalRules | null;
  pauseResumeConfig?: PauseResumeConfig;
  stopConfig?: StopConfig;
  announcementConfig?: AnnouncementConfig;
}

export interface UpdateWebhookParams {
  name?: string;
  description?: string;
  webhookType?: WebhookType;
  brand?: string;
  source?: string;
  fieldMapping?: FieldMapping;
  validationRules?: ValidationRules;
  autoTagRules?: AutoTagRule[];
  requiredHeaders?: Record<string, string>;
  autoEnrollJourneyId?: number | null;
  conditionalRules?: ConditionalRules | null;
  pauseResumeConfig?: PauseResumeConfig;
  stopConfig?: StopConfig;
  announcementConfig?: AnnouncementConfig;
}

export interface WebhookDeleteResponse {
  message: string;
  id: number;
}

export interface WebhookCreateResponse {
  id: number;
  tenantId: string;
  name: string;
  endpointKey: string;
  webhookUrl: string;
  securityToken: string;
  isActive: boolean;
  // ... other fields
}

export interface WebhookRegenerateKeyResponse {
  message: string;
  endpointKey: string;
  webhookUrl: string;
}

export interface WebhookRegenerateTokenResponse {
  message: string;
  securityToken: string;
}

export interface WebhookHealthResponse {
  message: string;
  name: string;
  endpointKey: string;
  isActive: boolean;
}

export interface WebhookCapabilitiesResponse {
  message: string;
  capabilities: {
    endpoints: boolean;
    events: boolean;
    leadCreation: boolean;
    fieldMapping: boolean;
    security: boolean;
    journeyIntegration: boolean;
  };
}

export interface ConditionalRules {
  enabled: boolean;
  logicOperator: 'AND' | 'OR';
  conditionSets: ConditionSet[];
}

export interface ConditionSet {
  name: string;
  conditions: Condition[];
  actions: Action[];
}

export interface Condition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 
           'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 
           'exists' | 'not_exists' | 'is_empty' | 'is_not_empty' | 'regex_match';
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

export interface Action {
  type: 'create_lead' | 'update_lead' | 'delete_lead' | 'send_notification' | 'enroll_journey' | 'call_webhook' | 'set_tags' | 'create_task' | 'set_dialer_assignment';
  config: Record<string, any>;
}

export interface PauseResumeConfig {
  enabled: boolean;
  resumeConditions: {
    timerResume?: {
      enabled: boolean;
      delayMinutes?: number;
      delayHours?: number;
      delayDays?: number;
    };
    statusResume?: {
      enabled: boolean;
      targetStatuses: string[];
      checkInterval: number;
    };
    tagResume?: {
      enabled: boolean;
      requiredTags: string[];
      forbiddenTags: string[];
      checkInterval: number;
    };
    externalResume?: {
      enabled: boolean;
    };
  };
  pauseActions: {
    pauseJourneys: boolean;
    addPauseTag: boolean;
    pauseTagName: string;
    sendNotification: boolean;
    notificationTemplate?: string;
  };
  resumeActions: {
    resumeJourneys: boolean;
    removePauseTag: boolean;
    addResumeTag: boolean;
    resumeTagName: string;
    sendNotification: boolean;
    notificationTemplate?: string;
  };
}

export interface StopConfig {
  enabled: boolean;
  stopActions: {
    exitJourneys: boolean;
    addStopTag: boolean;
    stopTagName: string;
    markAsDNC: boolean;
    dncReason?: string;
    markAsSold: boolean;
    soldReason?: string;
    preventFutureEnrollment: boolean;
  };
  stopMetadata: {
    trackStopReason: boolean;
    trackStopSource: boolean;
    trackStopTimestamp: boolean;
  };
}

// New interfaces for announcement functionality
export interface AnnouncementConfig {
  enabled: boolean;
  announcementType?: 'template' | 'video' | 'image'; // Type of announcement to generate
  contentCreator: {
    templateId: string;
    variableMapping: Record<string, string>;
    autoGenerate?: boolean;
    templateName?: string;
  };
  optisigns: {
    displaySelection: {
      mode: 'all' | 'specific' | 'group';
      displayIds?: string[];
      groupIds?: string[];
      criteria?: {
        location?: string[];
        status?: 'online' | 'offline' | 'any';
        tags?: string[];
      };
    };
    takeover: {
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      duration: number; // seconds
      restoreAfter: boolean;
      overrideCurrent?: boolean;
    };
    scheduling?: {
      immediate: boolean;
      delay?: number; // seconds
      specificTime?: string; // ISO datetime
      businessHoursOnly?: boolean;
    };
  };
  conditions?: {
    enabled: boolean;
    rules: Array<{
      field: string;
      operator: string;
      value: any;
      required: boolean;
    }>;
  };
}

// Updated interface for projects instead of templates
export interface AnnouncementProject {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  canvasSize: { width: number; height: number };
  variables: Record<string, any>;
  elements?: any[];
  thumbnail?: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Keep the old interface for backward compatibility but mark as deprecated
/** @deprecated Use AnnouncementProject instead */
export interface AnnouncementTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  variables: string[];
  thumbnail?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementDisplay {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  isOnline: boolean;
  isActive?: boolean;
  resolution: {
    width: number;
    height: number;
  };
  tags?: string[];
  groupIds?: string[];
  lastSeen: string;
}

export interface AnnouncementMetric {
  id: string;
  webhookEventId: number;
  announcementStartTime: string;
  totalDuration: number;
  successfulDisplays: number;
  failedDisplays: number;
  displayIds: string[];
  variablesInjected: Record<string, any>;
  contentGenerationTime: number;
  processingTime: number;
  contentId?: string;
  errors?: string[];
  createdAt: string;
}

export interface AnnouncementTestResponse {
  configurationValid: boolean;
  errors: string[];
  warnings: string[];
  simulationResults: {
    triggerConditions: 'would_pass' | 'would_fail' | 'not_applicable';
    variableExtraction: {
      variablesFound: number;
      variables: Record<string, any>;
      missingVariables?: string[];
    };
    contentGeneration: {
      templateExists: boolean;
      estimatedGenerationTime: string;
      previewAvailable?: boolean;
    };
    displaySelection: {
      mode: string;
      estimatedDisplayCount: string | number;
      selectedDisplays?: AnnouncementDisplay[];
    };
  };
}

export interface AnnouncementPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  announcementConfig: AnnouncementConfig;
  fieldMapping: FieldMapping;
  validationRules: ValidationRules;
  createdAt: string;
} 