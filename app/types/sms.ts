export type SmsCampaign = {
  id: number;
  name: string;
  messageTemplate: string;
  rateLimit: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  autoReplyEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SmsCampaignDetails = SmsCampaign & {
  contactStats: {
    pending: number;
    sent: number;
    failed: number;
    replied: number;
  };
};

export type CreateSmsCampaignData = {
  name: string;
  messageTemplate: string;
  rateLimit: number;
};

export type SmsContact = {
  id: number;
  campaignId: number;
  phone: string;
  name?: string;
  email?: string;
  customFields?: Record<string, string>;
  status: 'pending' | 'sent' | 'failed' | 'replied';
  sentAt?: string;
  createdAt: string;
};

export type TwilioNumber = {
  id: number;
  phoneNumber: string;
  accountSid: string;
  status: 'available' | 'in_use' | 'unavailable';
  messagesCount: number;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

export type DashboardStats = {
  activeCampaigns: number;
  totalContacts: number;
  sentToday: number;
  unrespondedMessages: number;
  availableNumbers: number;
};

export type CsvPreview = {
  fileName: string;
  headers: string[];
  previewRows: any[];
  rowCount: number;
  totalRowsEstimate: number;
  headerAnalysis: Array<{
    field: string;
    type: string;
    sampleValues: string[];
  }>;
  recommendedMappings: Record<string, string>;
};

export type PaginatedResponse<T> = {
  total: number;
  page: number;
  totalPages: number;
  data: T[];
};

// SMS Provider Types
export interface SmsProvider {
  configured: boolean;
  active: boolean;
  config: TwilioConfig | MeeraConfig | null;
}

export interface SmsProvidersResponse {
  providers: {
    twilio: SmsProvider;
    meera: SmsProvider;
  };
  defaultProvider: 'twilio' | 'meera';
}

// Twilio Configuration
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  defaultFromNumber: string;
  isActive: boolean;
  settings: {
    statusCallbackUrl?: string;
    enableDeliveryReports?: boolean;
  };
  rateLimits: {
    messagesPerMinute: number;
    messagesPerHour: number;
    messagesPerDay: number;
  };
}

export interface TwilioTestResponse {
  success: boolean;
  message: string;
  numberCount: number;
}

// Meera Configuration
export interface MeeraConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  defaultFromNumber: string;
  isActive: boolean;
  settings: {
    messageType?: string;
    enableUnicode?: boolean;
    maxSegments?: number;
  };
  rateLimits: {
    messagesPerSecond: number;
    messagesPerMinute: number;
    messagesPerHour: number;
    messagesPerDay: number;
  };
}

export interface MeeraTestResponse {
  success: boolean;
  message: string;
  balance: number;
  currency: string;
}

export interface MeeraBalanceResponse {
  balance: number;
  currency: string;
  lastChecked: string;
}

// SMS Sending Types
export interface SendSmsRequest {
  to: string;
  body: string;
  from?: string;
  leadId?: number;
  provider?: 'twilio' | 'meera';
  metadata?: Record<string, any>;
}

export interface SendTemplateRequest {
  to: string;
  templateId: number;
  variables: Record<string, any>;
  leadId?: number;
  provider?: 'twilio' | 'meera';
  from?: string;
}

export interface SmsMessage {
  id: string;
  to: string;
  from: string;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  direction: 'inbound' | 'outbound';
  leadId?: number;
  provider: 'twilio' | 'meera';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Legacy types for backward compatibility
export type SmsCampaign = {
  id: number;
  name: string;
  messageTemplate: string;
  rateLimit: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateSmsCampaignData = {
  name: string;
  messageTemplate: string;
  rateLimit: number;
};

export type SmsCampaignDetails = SmsCampaign & {
  contacts: Array<{
    id: number;
    phone: string;
    name?: string;
    status: 'pending' | 'sent' | 'failed' | 'replied';
    sentAt?: string;
    failedReason?: string;
  }>;
}; 