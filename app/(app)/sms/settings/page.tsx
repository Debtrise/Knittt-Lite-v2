'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Button from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { useAuthStore } from '@/app/store/authStore';
import toast from 'react-hot-toast';
import { Save, RefreshCw } from 'lucide-react';

interface SMSSettings {
  defaultSenderId: string;
  messageRateLimit: number;
  retryAttempts: number;
  retryDelay: number;
  webhookUrl: string;
  enableDeliveryReports: boolean;
  enableReadReceipts: boolean;
  enableAutoReply: boolean;
  autoReplyMessage: string;
}

export default function SMSSettingsPage() {
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SMSSettings>({
    defaultSenderId: '',
    messageRateLimit: 100,
    retryAttempts: 3,
    retryDelay: 60,
    webhookUrl: '',
    enableDeliveryReports: true,
    enableReadReceipts: true,
    enableAutoReply: false,
    autoReplyMessage: '',
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      toast.success('Settings saved (local only, no backend)');
      setSaving(false);
    }, 800);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">SMS Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure your SMS messaging preferences and defaults
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Sender ID
                  </label>
                  <Input
                    name="defaultSenderId"
                    value={settings.defaultSenderId}
                    onChange={handleInputChange}
                    placeholder="Enter default sender ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Rate Limit (per minute)
                  </label>
                  <Input
                    type="number"
                    name="messageRateLimit"
                    value={settings.messageRateLimit}
                    onChange={handleInputChange}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Retry Settings</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retry Attempts
                  </label>
                  <Input
                    type="number"
                    name="retryAttempts"
                    value={settings.retryAttempts}
                    onChange={handleInputChange}
                    min="0"
                    max="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retry Delay (seconds)
                  </label>
                  <Input
                    type="number"
                    name="retryDelay"
                    value={settings.retryDelay}
                    onChange={handleInputChange}
                    min="0"
                    max="3600"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Webhook Settings</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL
                  </label>
                  <Input
                    name="webhookUrl"
                    value={settings.webhookUrl}
                    onChange={handleInputChange}
                    placeholder="Enter webhook URL for delivery reports"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Message Settings</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enableDeliveryReports"
                    checked={settings.enableDeliveryReports}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Enable Delivery Reports
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enableReadReceipts"
                    checked={settings.enableReadReceipts}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Enable Read Receipts
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enableAutoReply"
                    checked={settings.enableAutoReply}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Enable Auto Reply
                  </label>
                </div>
                {settings.enableAutoReply && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto Reply Message
                    </label>
                    <Input
                      name="autoReplyMessage"
                      value={settings.autoReplyMessage}
                      onChange={handleInputChange}
                      placeholder="Enter auto reply message"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSettings({
                  defaultSenderId: '',
                  messageRateLimit: 100,
                  retryAttempts: 3,
                  retryDelay: 60,
                  webhookUrl: '',
                  enableDeliveryReports: true,
                  enableReadReceipts: true,
                  enableAutoReply: false,
                  autoReplyMessage: '',
                })}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
} 