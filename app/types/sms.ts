export interface SmsCampaign {
  id: number;
  name: string;
  description?: string;
  messageTemplate: string;
  rateLimit: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  deliveredCount?: number;
  autoReplyEnabled: boolean;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface SmsContact {
  id: number;
  phone: string;
  name?: string;
  email?: string;
  status: 'active' | 'inactive' | 'blocked';
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface SmsMessage {
  id: number;
  contactId: number;
  direction: 'inbound' | 'outbound';
  content: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sentAt: string;
  deliveredAt?: string;
  error?: string;
}

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

export interface SmsTemplate {
  id: number;
  name: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
} 