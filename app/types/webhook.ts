// Types for the Webhook API

export interface WebhookEndpoint {
  id: number;
  name: string;
  description: string;
  endpointKey: string;
  isActive: boolean;
  brand: string;
  source: string;
  fieldMapping: FieldMapping;
  validationRules: ValidationRules;
  autoTagRules?: AutoTagRule[];
  securityToken?: string;
  requiredHeaders?: Record<string, string>;
  autoEnrollJourneyId?: number;
  testPayload?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FieldMapping {
  phone: string;
  name: string;
  email: string;
  [key: string]: string;
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
  webhookEndpointId: number;
  status: 'success' | 'partial_success' | 'failed';
  payload: Record<string, any>;
  createdLeadIds: number[];
  errorMessage: string | null;
  receivedAt: string;
  ipAddress: string;
  processingTime: number;
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
  isActive: boolean;
  brand: string;
  source: string;
  fieldMapping: FieldMapping;
  validationRules: ValidationRules;
  autoTagRules?: AutoTagRule[];
  securityToken?: string;
  requiredHeaders?: Record<string, string>;
  autoEnrollJourneyId?: number;
}

export interface UpdateWebhookParams {
  name?: string;
  description?: string;
  isActive?: boolean;
  brand?: string;
  source?: string;
  fieldMapping?: FieldMapping;
  validationRules?: ValidationRules;
  autoTagRules?: AutoTagRule[];
  securityToken?: string;
  requiredHeaders?: Record<string, string>;
  autoEnrollJourneyId?: number;
}

export interface WebhookDeleteResponse {
  message: string;
  id: string;
} 