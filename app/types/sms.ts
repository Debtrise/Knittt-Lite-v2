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

export type SmsMessage = {
  id: number;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'failed';
  sentAt: string;
  contactId: number;
}; 