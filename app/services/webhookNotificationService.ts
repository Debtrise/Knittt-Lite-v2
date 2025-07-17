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
  affectedLeadIds: number[];
  payload: Record<string, any>;
  errorMessage?: string;
  validationErrors?: string[];
  processedData?: Record<string, any>;
  headers?: Record<string, string>;
  responseData?: Record<string, any>;
  // Enhanced fields for comprehensive webhook support
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
  // Pause/Resume specific fields
  pauseResumeActions?: {
    leadsPaused: number;
    leadsResumed: number;
    journeysPaused: number;
    journeysResumed: number;
  };
  // Stop specific fields
  stopActions?: {
    leadsStopped: number;
    journeysExited: number;
    leadsMarkedDNC: number;
    leadsMarkedSold: number;
  };
  // Announcement specific fields
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

interface Webhook {
  id: number;
  name: string;
  webhookType: 'go' | 'pause' | 'stop' | 'announcement' | 'call';
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
  pauseResumeConfig?: any;
  stopConfig?: any;
  announcementConfig?: any;
  callConfig?: any;
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

    // Enhanced processing based on webhook type
    switch (webhook.webhookType) {
      case 'go':
        await this.processGoWebhookEvent(event, webhook);
        break;
      case 'pause':
        await this.processPauseWebhookEvent(event, webhook);
        break;
      case 'stop':
        await this.processStopWebhookEvent(event, webhook);
        break;
      case 'announcement':
        await this.processAnnouncementWebhookEvent(event, webhook);
        break;
      default:
        await this.processBasicWebhookEvent(event, webhook);
    }
  }

  private async processGoWebhookEvent(event: WebhookEvent, webhook: Webhook) {
    if (event.status === 'success' && event.createdLeadIds.length > 0) {
      const message = this.buildGoWebhookMessage(event, webhook);
      
      addWebhookLeadNotification({
        webhookName: webhook.name,
        leadCount: event.createdLeadIds.length,
        leadIds: event.createdLeadIds,
        brand: webhook.brand,
        source: webhook.source,
        message
      });
    } else if (event.status === 'failed') {
      const errorDetails = this.buildErrorMessage(event, webhook);
      addWebhookErrorNotification(webhook.name, errorDetails);
    }
  }

  private async processPauseWebhookEvent(event: WebhookEvent, webhook: Webhook) {
    if (event.status === 'success' && event.pauseResumeActions) {
      const { pauseResumeActions } = event;
      let message = '';
      
      if (pauseResumeActions.leadsPaused > 0) {
        message += `${pauseResumeActions.leadsPaused} lead(s) paused`;
      }
      
      if (pauseResumeActions.leadsResumed > 0) {
        if (message) message += ', ';
        message += `${pauseResumeActions.leadsResumed} lead(s) resumed`;
      }
      
      if (pauseResumeActions.journeysPaused > 0) {
        if (message) message += ', ';
        message += `${pauseResumeActions.journeysPaused} journey(s) paused`;
      }
      
      addWebhookLeadNotification({
        webhookName: webhook.name,
        leadCount: pauseResumeActions.leadsPaused + pauseResumeActions.leadsResumed,
        leadIds: event.affectedLeadIds || [],
        brand: webhook.brand,
        source: webhook.source,
        message: message || 'Pause/resume actions completed'
      });
    } else if (event.status === 'failed') {
      addWebhookErrorNotification(webhook.name, event.errorMessage || 'Pause/resume webhook failed');
    }
  }

  private async processStopWebhookEvent(event: WebhookEvent, webhook: Webhook) {
    if (event.status === 'success' && event.stopActions) {
      const { stopActions } = event;
      let message = '';
      
      if (stopActions.leadsStopped > 0) {
        message += `${stopActions.leadsStopped} lead(s) stopped`;
      }
      
      if (stopActions.leadsMarkedDNC > 0) {
        if (message) message += ', ';
        message += `${stopActions.leadsMarkedDNC} marked as DNC`;
      }
      
      if (stopActions.leadsMarkedSold > 0) {
        if (message) message += ', ';
        message += `${stopActions.leadsMarkedSold} marked as sold`;
      }
      
      addWebhookLeadNotification({
        webhookName: webhook.name,
        leadCount: stopActions.leadsStopped,
        leadIds: event.affectedLeadIds || [],
        brand: webhook.brand,
        source: webhook.source,
        message: message || 'Stop actions completed'
      });
    } else if (event.status === 'failed') {
      addWebhookErrorNotification(webhook.name, event.errorMessage || 'Stop webhook failed');
    }
  }

  private async processAnnouncementWebhookEvent(event: WebhookEvent, webhook: Webhook) {
    if (event.status === 'success' && event.announcementActions) {
      const { announcementActions } = event;
      let message = '';
      
      if (announcementActions.contentGenerated) {
        message += 'Content generated';
      }
      
      if (announcementActions.displaysTriggered > 0) {
        if (message) message += ', ';
        message += `${announcementActions.displaysTriggered} display(s) triggered`;
      }
      
      if (announcementActions.successfulDisplays > 0) {
        if (message) message += ' (';
        message += `${announcementActions.successfulDisplays} successful`;
        if (announcementActions.failedDisplays > 0) {
          message += `, ${announcementActions.failedDisplays} failed`;
        }
        message += ')';
      }
      
      addWebhookLeadNotification({
        webhookName: webhook.name,
        leadCount: 1, // Announcement events typically affect one "event"
        leadIds: [],
        brand: webhook.brand,
        source: webhook.source,
        message: message || 'Announcement triggered successfully'
      });
    } else if (event.status === 'failed') {
      addWebhookErrorNotification(webhook.name, event.errorMessage || 'Announcement webhook failed');
    }
  }

  private async processBasicWebhookEvent(event: WebhookEvent, webhook: Webhook) {
    // Enhanced processing for conditional rules
    if (event.conditionalRulesApplied && event.executionLog) {
      await this.processConditionalWebhookEvent(event, webhook);
    } else {
      // Fallback to basic processing
      if (event.status === 'success' && event.createdLeadIds.length > 0) {
        addWebhookLeadNotification({
          webhookName: webhook.name,
          leadCount: event.createdLeadIds.length,
          leadIds: event.createdLeadIds,
          brand: webhook.brand,
          source: webhook.source,
        });
      } else if (event.status === 'failed') {
        const errorMessage = event.errorMessage || 'Unknown error occurred';
        addWebhookErrorNotification(webhook.name, errorMessage);
      }
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
    
    // Check for lead creation or other successful actions
    if (event.status === 'success' && (event.createdLeadIds.length > 0 || executionLog.actionsExecuted.some(a => a.status === 'success'))) {
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

  private buildGoWebhookMessage(event: WebhookEvent, webhook: Webhook): string {
    let message = `${event.createdLeadIds.length} new lead(s) created`;
    
    if (event.executionLog?.conditionResults) {
      const matchedConditions = event.executionLog.conditionResults.filter(r => r.matched);
      if (matchedConditions.length > 0) {
        message += ` • Conditions matched: ${matchedConditions.map(c => c.conditionSetName).join(', ')}`;
      }
    }
    
    if (event.executionLog?.actionsExecuted) {
      const successfulActions = event.executionLog.actionsExecuted.filter(a => a.status === 'success');
      if (successfulActions.length > 0) {
        message += ` • ${successfulActions.length} action(s) executed`;
      }
    }
    
    return message;
  }

  private buildErrorMessage(event: WebhookEvent, webhook: Webhook): string {
    if (event.executionLog?.actionsExecuted) {
      const failedActions = event.executionLog.actionsExecuted.filter(a => a.status === 'failed');
      if (failedActions.length > 0) {
        return `Failed actions: ${failedActions.map(a => `${a.type} (${a.error})`).join(', ')}`;
      }
    }
    
    if (event.validationErrors && event.validationErrors.length > 0) {
      return `Validation errors: ${event.validationErrors.join(', ')}`;
    }
    
    return event.errorMessage || 'Unknown error occurred';
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

  // Public methods for manual webhook management
  async testWebhook(webhookId: number, payload: Record<string, any>) {
    try {
      const response = await api.webhooks.test(webhookId.toString(), payload);
      return response.data;
    } catch (error) {
      console.error('Error testing webhook:', error);
      throw error;
    }
  }

  async getWebhookMetrics(webhookId: number, startDate?: string, endDate?: string) {
    try {
      const webhook = this.webhookCache.get(webhookId);
      if (webhook?.webhookType === 'announcement') {
        const response = await api.webhooks.announcement.getMetrics(webhookId.toString(), {
          startDate,
          endDate
        });
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error getting webhook metrics:', error);
      throw error;
    }
  }

  async getPausedLeads(webhookId?: number) {
    try {
      const response = await api.webhooks.pauseResume.getPausedLeads({
        webhookId,
        page: 1,
        limit: 50
      });
      return response.data;
    } catch (error) {
      console.error('Error getting paused leads:', error);
      throw error;
    }
  }

  async resumeLead(pauseStateId: string) {
    try {
      const response = await api.webhooks.pauseResume.resumeLead(pauseStateId);
      return response.data;
    } catch (error) {
      console.error('Error resuming lead:', error);
      throw error;
    }
  }

  async getExecutionLog(eventId: number) {
    try {
      const response = await api.webhooks.getExecutionLog(eventId.toString());
      return response.data;
    } catch (error) {
      console.error('Error getting execution log:', error);
      throw error;
    }
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