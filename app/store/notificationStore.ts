import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  // Enhanced fields for webhook notifications
  webhookName?: string;
  leadCount?: number;
  leadIds?: number[];
  brand?: string;
  source?: string;
  executionDetails?: {
    conditionSets?: string[];
    actionsExecuted?: number;
    journeyEnrollments?: number;
    processingTime?: number;
  };
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isMinimized: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  toggleMinimized: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isMinimized: true,

  addNotification: (notification) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
    };

    set(state => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Auto-dismiss success and info notifications after 10 seconds
    if (notification.type === 'success' || notification.type === 'info') {
      setTimeout(() => {
        const currentNotifications = get().notifications;
        if (currentNotifications.find(n => n.id === id)) {
          get().removeNotification(id);
        }
      }, 10000);
    }
  },

  markAsRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(notification => ({
        ...notification,
        read: true,
      })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    set(state => {
      const notification = state.notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.read;
      
      return {
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  toggleMinimized: () => {
    set(state => ({ isMinimized: !state.isMinimized }));
  },
}));

// Helper functions for webhook notifications
export const addWebhookLeadNotification = (data: {
  webhookName: string;
  leadCount: number;
  leadIds: number[];
  brand?: string;
  source?: string;
  message?: string; // Optional custom message
  executionDetails?: {
    conditionSets?: string[];
    actionsExecuted?: number;
    journeyEnrollments?: number;
    processingTime?: number;
  };
}) => {
  const { addNotification } = useNotificationStore.getState();
  
  // Build title and message
  const title = `${data.leadCount} New Lead${data.leadCount > 1 ? 's' : ''} Received`;
  
  let message = data.message || `${data.leadCount} lead${data.leadCount > 1 ? 's' : ''} created from ${data.webhookName}`;
  
  if (data.brand || data.source) {
    const details = [data.brand, data.source].filter(Boolean).join(' • ');
    message += ` (${details})`;
  }

  addNotification({
    type: 'success',
    title,
    message,
    actionUrl: '/leads',
    actionLabel: 'View Leads',
    webhookName: data.webhookName,
    leadCount: data.leadCount,
    leadIds: data.leadIds,
    brand: data.brand,
    source: data.source,
    executionDetails: data.executionDetails,
  });
};

export const addWebhookErrorNotification = (webhookName: string, errorMessage: string) => {
  const { addNotification } = useNotificationStore.getState();
  
  addNotification({
    type: 'error',
    title: 'Webhook Processing Failed',
    message: `${webhookName}: ${errorMessage}`,
    actionUrl: '/webhooks',
    actionLabel: 'Manage Webhooks',
    webhookName,
  });
}; 