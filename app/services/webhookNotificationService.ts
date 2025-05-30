import { addWebhookLeadNotification, addWebhookErrorNotification } from '@/app/store/notificationStore';
import api from '@/app/lib/api';

interface WebhookEvent {
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
  // New enhanced fields
  executionLog?: {
    conditionsEvaluated: boolean;
    conditionResults: Array<{
      conditionSetName: string;
      matched: boolean;
      evaluatedConditions: Array<{
        field: string;
        operator: string;
        expected: any;
        actual: any;
        result: boolean;
      }>;
    }>;
    actionsExecuted: Array<{
      type: string;
      config: Record<string, any>;
      status: 'success' | 'failed' | 'skipped';
      result?: any;
      error?: string;
      executedAt: string;
    }>;
    totalExecutionTime: number;
  };
  conditionalRulesApplied?: boolean;
  actionResults?: Record<string, any>;
}

interface Webhook {
  id: number;
  name: string;
  brand?: string;
  source?: string;
  conditionalRules?: {
    enabled: boolean;
    logicOperator: 'AND' | 'OR';
    conditionSets: Array<{
      name: string;
      conditions: any[];
      actions: Array<{
        type: 'create_lead' | 'update_lead' | 'send_notification' | 'enroll_journey' | 'call_webhook' | 'set_tags' | 'create_task';
        config: Record<string, any>;
      }>;
    }>;
  };
}

class WebhookNotificationService {
  private lastCheckedTimestamp: Date | null = null;
  private isPolling = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private pollingIntervalMs = 30000; // 30 seconds
  private webhookCache: Map<number, Webhook> = new Map();

  start() {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.lastCheckedTimestamp = new Date();
    
    // Initial check
    this.checkForNewEvents();
    
    // Set up polling
    this.pollingInterval = setInterval(() => {
      this.checkForNewEvents();
    }, this.pollingIntervalMs);
    
    console.log('🔔 Enhanced webhook notification service started');
  }

  stop() {
    if (!this.isPolling) return;
    
    this.isPolling = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    console.log('🔔 Enhanced webhook notification service stopped');
  }

  private async checkForNewEvents() {
    try {
      // Get all webhooks first to build our cache
      await this.loadWebhooks();
      
      // Get recent webhook events
      const events = await this.getRecentWebhookEvents();
      
      // Process new events
      for (const event of events) {
        await this.processWebhookEvent(event);
      }
      
      // Update last checked timestamp
      this.lastCheckedTimestamp = new Date();
      
    } catch (error) {
      console.error('Error checking for webhook events:', error);
    }
  }

  private async loadWebhooks() {
    try {
      const response = await api.webhooks.list({ page: 1, limit: 100 });
      
      // Handle different response structures
      const data = response.data || response;
      const webhooks = data.webhooks || data || [];
      
      // Clear cache and rebuild
      this.webhookCache.clear();
      for (const webhook of webhooks) {
        this.webhookCache.set(webhook.id, webhook);
      }
    } catch (error) {
      console.error('Error loading webhooks:', error);
    }
  }

  private async getRecentWebhookEvents(): Promise<WebhookEvent[]> {
    try {
      const allEvents: WebhookEvent[] = [];
      
      // Get events from all webhooks
      for (const [webhookId] of this.webhookCache) {
        try {
          const response = await api.webhooks.getEvents(webhookId.toString(), {
            page: 1,
            limit: 10, // Only check recent events
          });
          
          // Handle different response structures
          const data = response.data || response;
          const events = data.events || data || [];
          allEvents.push(...events);
        } catch (error) {
          // Continue checking other webhooks even if one fails
          console.error(`Error getting events for webhook ${webhookId}:`, error);
        }
      }
      
      // Filter to only new events since last check
      return allEvents.filter(event => {
        const eventDate = new Date(event.receivedAt);
        return !this.lastCheckedTimestamp || eventDate > this.lastCheckedTimestamp;
      }).sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
      
    } catch (error) {
      console.error('Error getting recent webhook events:', error);
      return [];
    }
  }

  private async processWebhookEvent(event: WebhookEvent) {
    const webhook = this.webhookCache.get(event.webhookId);
    if (!webhook) return;

    // Enhanced processing for conditional rules
    if (event.conditionalRulesApplied && event.executionLog) {
      await this.processConditionalWebhookEvent(event, webhook);
    } else {
      // Fallback to basic processing
      await this.processBasicWebhookEvent(event, webhook);
    }
  }

  private async processConditionalWebhookEvent(event: WebhookEvent, webhook: Webhook) {
    const executionLog = event.executionLog!;
    
    // Analyze executed actions for notification content
    const createLeadActions = executionLog.actionsExecuted.filter(action => 
      action.type === 'create_lead' && action.status === 'success'
    );
    
    const journeyActions = executionLog.actionsExecuted.filter(action => 
      action.type === 'enroll_journey' && action.status === 'success'
    );
    
    const notificationActions = executionLog.actionsExecuted.filter(action => 
      action.type === 'send_notification' && action.status === 'success'
    );

    // Check for lead creation
    if (event.status === 'success' && event.createdLeadIds.length > 0) {
      // Enhanced notification with conditional rule info
      const conditionSetNames = executionLog.conditionResults
        .filter(result => result.matched)
        .map(result => result.conditionSetName);
      
      addWebhookLeadNotification({
        webhookName: webhook.name,
        leadCount: event.createdLeadIds.length,
        leadIds: event.createdLeadIds,
        brand: webhook.brand,
        source: webhook.source,
        // Enhanced details
        message: this.buildEnhancedMessage(webhook, event, {
          conditionSets: conditionSetNames,
          actionsExecuted: executionLog.actionsExecuted.length,
          journeyEnrollments: journeyActions.length,
          processingTime: executionLog.totalExecutionTime
        })
      });
    } else if (event.status === 'failed') {
      // Enhanced error notification with execution details
      const failedActions = executionLog.actionsExecuted.filter(action => action.status === 'failed');
      const errorDetails = failedActions.length > 0 
        ? `Failed actions: ${failedActions.map(a => a.type).join(', ')}`
        : event.errorMessage || 'Unknown error occurred';
      
      addWebhookErrorNotification(webhook.name, errorDetails);
    }
  }

  private async processBasicWebhookEvent(event: WebhookEvent, webhook: Webhook) {
    if (event.status === 'success' && event.createdLeadIds.length > 0) {
      // Success: New leads created
      addWebhookLeadNotification({
        webhookName: webhook.name,
        leadCount: event.createdLeadIds.length,
        leadIds: event.createdLeadIds,
        brand: webhook.brand,
        source: webhook.source,
      });
    } else if (event.status === 'partial_success' && event.createdLeadIds.length > 0) {
      // Partial success: Some leads created but with warnings
      addWebhookLeadNotification({
        webhookName: webhook.name,
        leadCount: event.createdLeadIds.length,
        leadIds: event.createdLeadIds,
        brand: webhook.brand,
        source: webhook.source,
      });
    } else if (event.status === 'failed') {
      // Error: No leads created
      const errorMessage = event.errorMessage || 'Unknown error occurred';
      addWebhookErrorNotification(webhook.name, errorMessage);
    }
  }

  private buildEnhancedMessage(webhook: Webhook, event: WebhookEvent, details: {
    conditionSets: string[];
    actionsExecuted: number;
    journeyEnrollments: number;
    processingTime: number;
  }): string {
    let message = `${details.conditionSets.length > 0 ? 'Conditional rules triggered' : 'New leads received'}`;
    
    if (details.conditionSets.length > 0) {
      message += ` (${details.conditionSets.join(', ')})`;
    }
    
    if (details.journeyEnrollments > 0) {
      message += ` • ${details.journeyEnrollments} journey${details.journeyEnrollments > 1 ? 's' : ''} enrolled`;
    }
    
    if (details.actionsExecuted > 0) {
      message += ` • ${details.actionsExecuted} action${details.actionsExecuted > 1 ? 's' : ''} executed`;
    }
    
    return message;
  }
}

// Create and export singleton instance
export const webhookNotificationService = new WebhookNotificationService();

// Auto-start the service when imported (you can also start it manually if preferred)
if (typeof window !== 'undefined') {
  // Only start in browser environment
  setTimeout(() => {
    webhookNotificationService.start();
  }, 2000); // Delay start to allow initial app load
} 