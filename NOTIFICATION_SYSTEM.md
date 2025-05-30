# 🔔 Notification System

## Overview

The notification system provides real-time notifications for webhook events, system alerts, and other important activities within the application. When webhooks receive new leads, users will see instant notifications at the top of their dashboard.

## Features

### ✅ **Real-time Notifications**
- Instant notifications when webhooks receive leads
- Different notification types: Success, Error, Warning, Info
- Auto-dismissal for success notifications (10 seconds)
- Manual dismissal for error notifications
- Notification count badge when minimized

### ✅ **Webhook Integration**
- Automatic polling for new webhook events every 30 seconds
- Lead creation notifications with lead count and webhook details
- Error notifications for failed webhook processing
- Support for multiple webhooks simultaneously

### ✅ **User Interface**
- Slide-down notification bar at the top of the page
- Color-coded notifications based on type
- Action buttons to view related pages
- Floating bell icon when notifications are minimized
- Responsive design for mobile and desktop

## Components

### 1. **Notification Store** (`app/store/notificationStore.ts`)
Zustand-based state management for notifications:

```typescript
import { useNotificationStore, addWebhookLeadNotification } from '@/app/store/notificationStore';

// Add a webhook lead notification
addWebhookLeadNotification({
  webhookName: 'Contact Form',
  leadCount: 1,
  leadIds: [12345],
  brand: 'My Brand',
  source: 'website'
});
```

### 2. **Notification Bar** (`app/components/ui/NotificationBar.tsx`)
The main UI component that displays notifications:
- Appears at the top of the page
- Shows the most recent unread notification
- Includes action buttons and dismiss controls
- Bell icon indicator when minimized

### 3. **Webhook Notification Service** (`app/services/webhookNotificationService.ts`)
Background service that polls for webhook events:
- Polls every 30 seconds for new events
- Triggers notifications for successful lead creation
- Triggers error notifications for failed webhooks
- Maintains webhook cache for efficient processing

## Usage

### Basic Notification
```typescript
import { useNotificationStore } from '@/app/store/notificationStore';

const { addNotification } = useNotificationStore();

addNotification({
  type: 'success',
  title: 'Success!',
  message: 'Your action was completed successfully.',
  actionUrl: '/leads'
});
```

### Webhook Lead Notification
```typescript
import { addWebhookLeadNotification } from '@/app/store/notificationStore';

addWebhookLeadNotification({
  webhookName: 'Contact Form Webhook',
  leadCount: 3,
  leadIds: [1001, 1002, 1003],
  brand: 'Demo Brand',
  source: 'website'
});
```

### Webhook Error Notification
```typescript
import { addWebhookErrorNotification } from '@/app/store/notificationStore';

addWebhookErrorNotification('My Webhook', 'Invalid phone number format');
```

## Notification Types

| Type | Color | Auto-Dismiss | Use Case |
|------|-------|--------------|----------|
| **Success** | Green | ✅ (10s) | Successful operations, new leads |
| **Error** | Red | ❌ | Failed operations, webhook errors |
| **Warning** | Yellow | ❌ | System warnings, maintenance alerts |
| **Info** | Blue | ✅ (10s) | General information, feature announcements |

## Testing

### Manual Testing
A test panel is available on the dashboard page with buttons to trigger different notification types:

1. **Single Lead Received** - Tests webhook lead notification
2. **Multiple Leads Received** - Tests bulk lead notification  
3. **Webhook Error** - Tests error notification
4. **System Warning** - Tests warning notification
5. **Info Notification** - Tests info notification

### Programmatic Testing
```typescript
import { webhookNotificationService } from '@/app/services/webhookNotificationService';

// Trigger a test notification
webhookNotificationService.triggerTestNotification();
```

## Configuration

### Polling Interval
The default polling interval is 30 seconds. To change it:

```typescript
// In webhookNotificationService.ts
private pollingIntervalMs = 30000; // Change to desired interval in milliseconds
```

### Auto-Dismiss Timing
Success and info notifications auto-dismiss after 10 seconds:

```typescript
// In notificationStore.ts
setTimeout(() => {
  // Remove notification
}, 10000); // Change to desired timeout
```

## Integration

### Dashboard Layout
The notification system is automatically integrated into the dashboard layout:

```typescript
// app/components/layout/Dashboard.tsx
import NotificationBar from '@/app/components/ui/NotificationBar';
import '@/app/services/webhookNotificationService'; // Auto-starts the service

return (
  <div className="min-h-screen bg-gray-50">
    <NotificationBar />
    {/* Rest of dashboard */}
  </div>
);
```

### Webhook Events
The system automatically monitors webhook events and creates notifications when:
- ✅ New leads are successfully created via webhook
- ❌ Webhook processing fails with errors
- ⚠️ Partial success with some validation warnings

## API Integration

The notification service uses the existing webhook API:

```typescript
// Get webhook events
const events = await api.webhooks.getEvents(webhookId, {
  page: 1,
  limit: 10
});

// Get webhook list
const webhooks = await api.webhooks.list({
  page: 1,
  limit: 100
});
```

## Troubleshooting

### Notifications Not Appearing
1. Check browser console for JavaScript errors
2. Verify webhook notification service is running
3. Check if user is authenticated
4. Verify webhook API endpoints are working

### Service Not Polling
1. Check if service started: Look for "🔔 Webhook notification service started" in console
2. Verify API connectivity to webhook endpoints
3. Check for authentication token validity

### Performance Considerations
- Service polls every 30 seconds by default
- Only fetches recent events (last 10 per webhook)
- Automatically stops when user logs out
- Uses efficient caching for webhook data

## Future Enhancements

Potential improvements for the notification system:

1. **WebSocket Integration** - Real-time notifications without polling
2. **Notification History** - Persistent storage of notification history
3. **User Preferences** - Customizable notification settings
4. **Sound Alerts** - Audio notifications for important events
5. **Email/SMS Notifications** - External notification channels
6. **Notification Groups** - Categorize and filter notifications
7. **Push Notifications** - Browser push notifications when tab is inactive

## Dependencies

- **Zustand** - State management
- **Lucide React** - Icons
- **React Hot Toast** - Fallback toast notifications
- **Next.js** - Framework and routing
- **Tailwind CSS** - Styling

---

🎯 **Ready to use!** The notification system is now active and will automatically show notifications when webhooks receive new leads. 