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

export type SmsContact = {
  id: number;
  campaignId: number;
  phone: string;
  name?: string;
  email?: string;
  customFields?: Record<string, string>;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  createdAt: string;
}; 