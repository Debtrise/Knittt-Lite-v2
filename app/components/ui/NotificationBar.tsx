'use client';

import React from 'react';
import { useNotificationStore } from '@/app/store/notificationStore';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

const NotificationBar: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    isMinimized, 
    markAsRead, 
    removeNotification, 
    clearAll, 
    toggleMinimized 
  } = useNotificationStore();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatExecutionDetails = (notification: any) => {
    if (!notification.executionDetails) return null;

    const details = notification.executionDetails;
    const parts = [];

    if (details.conditionSets && details.conditionSets.length > 0) {
      parts.push(`Rules: ${details.conditionSets.join(', ')}`);
    }

    if (details.journeyEnrollments > 0) {
      parts.push(`${details.journeyEnrollments} Journey${details.journeyEnrollments > 1 ? 's' : ''}`);
    }

    if (details.actionsExecuted > 0) {
      parts.push(`${details.actionsExecuted} Action${details.actionsExecuted > 1 ? 's' : ''}`);
    }

    if (details.processingTime) {
      parts.push(`${details.processingTime}ms`);
    }

    return parts.length > 0 ? parts.join(' • ') : null;
  };

  // If minimized, show floating bell
  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleMinimized}
          className="relative bg-white border border-gray-200 rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow duration-200"
        >
          <Bell className="h-6 w-6 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Show notification bar
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Notifications {unreadCount > 0 && `(${unreadCount} new)`}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={toggleMinimized}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto pb-4">
            <div className="space-y-3">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${getNotificationColors(notification.type)} ${
                    !notification.read ? 'ring-2 ring-opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm opacity-90 mb-2">
                          {notification.message}
                        </p>
                        
                        {/* Enhanced details for webhook notifications */}
                        {notification.webhookName && (
                          <div className="text-xs opacity-75 space-y-1">
                            <div>
                              <strong>Webhook:</strong> {notification.webhookName}
                              {notification.brand && ` • ${notification.brand}`}
                              {notification.source && ` • ${notification.source}`}
                            </div>
                            {notification.leadCount && (
                              <div>
                                <strong>Leads:</strong> {notification.leadCount} created
                                {notification.leadIds && notification.leadIds.length > 0 && (
                                  <span className="ml-2 text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                                    IDs: {notification.leadIds.slice(0, 3).join(', ')}
                                    {notification.leadIds.length > 3 && '...'}
                                  </span>
                                )}
                              </div>
                            )}
                            {formatExecutionDetails(notification) && (
                              <div>
                                <strong>Execution:</strong> {formatExecutionDetails(notification)}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs opacity-75">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                          <div className="flex items-center space-x-2">
                            {notification.actionUrl && notification.actionLabel && (
                              <Link
                                href={notification.actionUrl}
                                className="text-xs bg-white bg-opacity-50 hover:bg-opacity-75 px-3 py-1 rounded transition-colors"
                              >
                                {notification.actionLabel}
                              </Link>
                            )}
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs bg-white bg-opacity-50 hover:bg-opacity-75 px-2 py-1 rounded transition-colors"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {notifications.length > 10 && (
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                  Showing 10 of {notifications.length} notifications
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationBar; 