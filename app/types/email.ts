// Email API Types for Mailgun Integration

export interface EmailProvider {
  id: string;
  name: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'password' | 'select' | 'boolean';
    required: boolean;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    defaultValue?: string | boolean;
  }>;
}

export interface EmailConfig {
  id?: number;
  tenantId?: string;
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  isActive?: boolean;
  dailyLimit: number;
  sentToday?: number;
  lastResetDate?: string;
  settings: MailgunSettings | SmtpSettings | SendGridSettings | SesSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface MailgunSettings {
  apiKey: string;
  domain: string;
  host?: 'api.mailgun.net' | 'api.eu.mailgun.net';
  tracking?: boolean;
  trackingClicks?: 'yes' | 'no' | 'htmlonly';
  trackingOpens?: boolean;
  tags?: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface SendGridSettings {
  apiKey: string;
  tracking?: boolean;
}

export interface SesSettings {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface EmailMessage {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  htmlContent?: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
  provider?: string;
  messageId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  leadId?: number;
  templateId?: number;
  tags?: string[];
  campaignId?: string;
}

export interface EmailTestRequest {
  to: string;
  testType: 'basic' | 'verify';
}

export interface EmailTestResponse {
  success: boolean;
  message: string;
  messageId?: string;
  provider?: string;
  sentTo?: string;
  verification?: {
    provider: string;
    domain: string;
    domainInfo?: {
      state: string;
      created: string;
      smtp_login: string;
    };
  };
}

export interface EmailStats {
  provider: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
    unsubscribed: number;
  };
  dailyLimit: number;
  sentToday: number;
  lastResetDate: string;
}

export interface EmailSendRequest {
  to: string;
  templateId: number;
  variables: Record<string, unknown>;
  tags?: string[];
  campaignId?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  subject?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}

export interface EmailSendResponse {
  success: boolean;
  messageId: string;
  provider: string;
  response: {
    id: string;
    message: string;
  };
}

export interface EmailTemplate {
  id: number;
  tenantId: string;
  categoryId?: number;
  name: string;
  description?: string;
  type: 'email';
  subject: string;
  content: string;
  htmlContent?: string;
  variables: Array<{
    name: string;
    description: string;
    defaultValue: string;
  }>;
  isActive: boolean;
  usageCount?: number;
  lastUsed?: string;
  category?: {
    id: number;
    name: string;
    type: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailTemplateCategory {
  id: number;
  tenantId: string;
  name: string;
  description?: string;
  type: 'email';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailTemplateUsage {
  id: number;
  templateId: number;
  usedFor: string;
  entityType: string;
  entityId: number;
  variables: Record<string, unknown>;
  metadata?: {
    messageId?: string;
    provider?: string;
    tags?: string[];
  };
  createdAt: string;
}

export interface EmailTemplateRenderRequest {
  variables: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface EmailTemplateRenderResponse {
  content: string;
  htmlContent?: string;
  subject: string;
  template: {
    id: number;
    name: string;
    type: string;
  };
}

export interface EmailTemplateListResponse {
  templates: EmailTemplate[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface EmailCategoryListResponse {
  categories: EmailTemplateCategory[];
  totalCount: number;
}

export interface CreateEmailTemplateRequest {
  name: string;
  description?: string;
  type: 'email';
  categoryId?: number;
  subject: string;
  content: string;
  htmlContent?: string;
  isActive?: boolean;
}

export interface UpdateEmailTemplateRequest extends Partial<CreateEmailTemplateRequest> {
  id: number;
}

export interface CreateEmailCategoryRequest {
  name: string;
  description?: string;
  type: 'email';
} 