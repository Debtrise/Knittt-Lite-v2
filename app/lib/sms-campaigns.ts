import api from './api';
import { 
  SendSmsRequest,
  SendTemplateRequest,
  SmsProvidersResponse,
  TwilioConfig,
  MeeraConfig,
  TwilioTestResponse,
  MeeraTestResponse,
  MeeraBalanceResponse
} from '@/types/sms';

export class SmsProviderService {
  static async getProviders(): Promise<SmsProvidersResponse> {
    try {
      const response = await api.smsProviders.getProviders();
      return response.data;
    } catch (error) {
      console.error('Failed to fetch SMS providers:', error);
      throw error;
    }
  }

  static async setDefaultProvider(provider: 'twilio' | 'meera'): Promise<void> {
    try {
      await api.smsProviders.setDefaultProvider(provider);
    } catch (error) {
      console.error('Failed to set default provider:', error);
      throw error;
    }
  }

  // Twilio Configuration
  static async getTwilioConfig(): Promise<TwilioConfig> {
    try {
      const response = await api.smsProviders.getTwilioConfig();
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Twilio config:', error);
      throw error;
    }
  }

  static async saveTwilioConfig(config: {
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
  }): Promise<void> {
    try {
      await api.smsProviders.saveTwilioConfig(config);
    } catch (error) {
      console.error('Failed to save Twilio config:', error);
      throw error;
    }
  }

  static async testTwilioConnection(): Promise<TwilioTestResponse> {
    try {
      const response = await api.smsProviders.testTwilioConnection();
      return response.data;
    } catch (error) {
      console.error('Failed to test Twilio connection:', error);
      throw error;
    }
  }

  // Meera Configuration
  static async getMeeraConfig(): Promise<MeeraConfig> {
    try {
      const response = await api.smsProviders.getMeeraConfig();
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Meera config:', error);
      throw error;
    }
  }

  static async saveMeeraConfig(config: {
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
  }): Promise<void> {
    try {
      await api.smsProviders.saveMeeraConfig(config);
    } catch (error) {
      console.error('Failed to save Meera config:', error);
      throw error;
    }
  }

  static async testMeeraConnection(): Promise<MeeraTestResponse> {
    try {
      const response = await api.smsProviders.testMeeraConnection();
      return response.data;
    } catch (error) {
      console.error('Failed to test Meera connection:', error);
      throw error;
    }
  }

  static async checkMeeraBalance(): Promise<MeeraBalanceResponse> {
    try {
      const response = await api.smsProviders.checkMeeraBalance();
      return response.data;
    } catch (error) {
      console.error('Failed to check Meera balance:', error);
      throw error;
    }
  }
}

export class SmsMessagingService {
  static async sendSms(data: SendSmsRequest): Promise<any> {
    try {
      const response = await api.smsMessaging.sendSms(data);
      return response.data;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  static async sendTemplate(data: SendTemplateRequest): Promise<any> {
    try {
      const response = await api.smsMessaging.sendTemplate(data);
      return response.data;
    } catch (error) {
      console.error('Failed to send templated SMS:', error);
      throw error;
    }
  }

  /**
   * Send SMS to a lead using their phone number
   */
  static async sendToLead(leadId: number, body: string, options?: {
    from?: string;
    provider?: 'twilio' | 'meera';
    metadata?: Record<string, any>;
  }): Promise<any> {
    try {
      // We'll need to get the lead's phone number first
      // For now, we'll throw an error indicating this needs to be implemented
      throw new Error('sendToLead requires lead phone number lookup - needs implementation');
    } catch (error) {
      console.error('Failed to send SMS to lead:', error);
      throw error;
    }
  }

  /**
   * Send bulk SMS messages
   */
  static async sendBulk(messages: Array<{
    to: string;
    body: string;
    from?: string;
    leadId?: number;
    metadata?: Record<string, any>;
  }>, options?: {
    provider?: 'twilio' | 'meera';
    batchSize?: number;
    delayBetweenBatches?: number;
  }): Promise<Array<{ success: boolean; messageId?: string; error?: string; to: string }>> {
    const results = [];
    const batchSize = options?.batchSize || 10;
    const delay = options?.delayBetweenBatches || 1000;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (message) => {
        try {
          const result = await this.sendSms({
            ...message,
            provider: options?.provider
          });
          return { success: true, messageId: result.id, to: message.to };
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error', 
            to: message.to 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches if not the last batch
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }
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

export type CreateCampaignData = {
  name: string;
  messageTemplate: string;
  rateLimit: number;
};

export type CampaignUploadResult = {
  added: number;
  failed: number;
  errors?: string[];
};

// Legacy SMS Campaign Service for backward compatibility
export class SmsCampaignService {
  static async getCampaigns(): Promise<SmsCampaign[]> {
    console.warn('SmsCampaignService.getCampaigns is deprecated. Use SmsMessagingService for individual SMS sends.');
    return [];
  }

  static async createCampaign(campaignData: CreateCampaignData): Promise<SmsCampaign> {
    console.warn('SmsCampaignService.createCampaign is deprecated. Use SmsMessagingService.sendBulk for bulk messaging.');
    throw new Error('SMS Campaigns are now handled through individual SMS sends. Use SmsMessagingService.sendBulk instead.');
  }

  static async startCampaign(campaignId: number): Promise<any> {
    console.warn('SmsCampaignService.startCampaign is deprecated.');
    throw new Error('SMS Campaigns are no longer available. Use SmsMessagingService instead.');
  }

  static async pauseCampaign(campaignId: number): Promise<any> {
    console.warn('SmsCampaignService.pauseCampaign is deprecated.');
    throw new Error('SMS Campaigns are no longer available.');
  }

  static async updateRateLimit(campaignId: number, rateLimit: number): Promise<any> {
    console.warn('SmsCampaignService.updateRateLimit is deprecated.');
    throw new Error('Rate limits are now configured per provider in SMS settings.');
  }

  static async uploadContacts(campaignId: number, file: File): Promise<CampaignUploadResult> {
    console.warn('SmsCampaignService.uploadContacts is deprecated.');
    throw new Error('Contact uploads are no longer available through campaigns. Use SmsMessagingService.sendBulk instead.');
  }

  static async getCampaign(campaignId: number): Promise<SmsCampaign> {
    console.warn('SmsCampaignService.getCampaign is deprecated.');
    throw new Error('SMS Campaign details are no longer available.');
  }

  static async testConnection(): Promise<boolean> {
    try {
      // Test the new provider endpoints instead
      await api.smsProviders.getProviders();
      return true;
    } catch (error) {
      console.error('Error testing SMS connection:', error);
      return false;
    }
  }

  static generateSampleCSV(): string {
    return 'phone,name,email\n+12345678901,John Doe,john@example.com\n+19876543210,Jane Smith,jane@example.com';
  }

  static downloadSampleCSV(): void {
    const csv = this.generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sms-contacts-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export default SmsCampaignService; 