// Types for the Webhook API

export interface WebhookEndpoint {
  id: number;
  tenantId: string;
  name: string;
  description: string;
  endpointKey: string;
  webhookUrl?: string; // Only returned in detailed responses
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
  payload: Record<string, any>;
  errorMessage?: string;
  validationErrors?: string[];
  processedData?: Record<string, any>;
  headers?: Record<string, string>;
  responseData?: Record<string, any>;
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
  brand: string;
  source: string;
  fieldMapping: FieldMapping;
  validationRules: ValidationRules;
  autoTagRules?: AutoTagRule[];
  requiredHeaders?: Record<string, string>;
  autoEnrollJourneyId?: number | null;
  conditionalRules?: ConditionalRules | null;
}

export interface UpdateWebhookParams {
  name?: string;
  description?: string;
  brand?: string;
  source?: string;
  fieldMapping?: FieldMapping;
  validationRules?: ValidationRules;
  autoTagRules?: AutoTagRule[];
  requiredHeaders?: Record<string, string>;
  autoEnrollJourneyId?: number | null;
  conditionalRules?: ConditionalRules | null;
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
  type: 'create_lead' | 'update_lead' | 'delete_lead' | 'send_notification' | 'enroll_journey' | 'call_webhook' | 'set_tags' | 'create_task';
  config: Record<string, any>;
} 