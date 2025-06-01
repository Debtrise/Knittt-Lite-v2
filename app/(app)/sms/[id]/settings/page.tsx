'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, MessageSquare, Save, Zap, Upload, Users } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Button from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import {
  getSmsCampaignDetails,
  updateSmsCampaignRateLimit,
  configureAutoReply,
  startSmsCampaign,
  pauseSmsCampaign,
  clearUnrespondedMessages
} from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';

interface CampaignSettings {
  id: number;
  name: string;
  status: string;
  rateLimit: number;
  autoReplyEnabled: boolean;
  replyTemplate: string;
  messageTemplate: string;
  contactStats?: {
    pending: number;
    sent: number;
    failed: number;
    replied: number;
    unresponded?: number;
  };
}

interface SettingsPageProps {
  campaignId: string;
}

function SettingsPageContent({ campaignId }: SettingsPageProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [settings, setSettings] = useState<CampaignSettings>({
    id: 0,
    name: '',
    status: '',
    rateLimit: 60,
    autoReplyEnabled: false,
    replyTemplate: '',
    messageTemplate: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchCampaignSettings();
  }, [isAuthenticated, router, campaignId]);

  const fetchCampaignSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getSmsCampaignDetails(parseInt(campaignId));
      setSettings({
        id: data.id,
        name: data.name,
        status: data.status,
        rateLimit: data.rateLimit,
        autoReplyEnabled: data.autoReplyEnabled,
        replyTemplate: data.replyTemplate || '',
        messageTemplate: data.messageTemplate,
        contactStats: data.contactStats
      });
    } catch (error) {
      console.error('Error fetching campaign settings:', error);
      toast.error('Failed to load campaign settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // First, try to save rate limit
    let rateLimitSaved = false;
    let retryCount = 0;
    const maxRetries = 2;

    while (!rateLimitSaved && retryCount <= maxRetries) {
      try {
        await updateSmsCampaignRateLimit(settings.id, settings.rateLimit);
        rateLimitSaved = true;
      } catch (error) {
        console.error(`Error saving rate limit (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
        retryCount++;
        
        // If this is the last retry and it still failed, ask user what to do
        if (retryCount > maxRetries) {
          if (window.confirm(
            'Having trouble connecting to save rate limit settings. Do you want to:\n\n' +
            '- Click OK to continue with other settings without rate limit change\n' +
            '- Click Cancel to stop the save process entirely'
          )) {
            // User chose to continue with other settings
            toast('Rate limit not saved due to connection issues, continuing with other settings.');
          } else {
            // User chose to stop entirely
            toast.error('Settings save cancelled.');
            setIsSaving(false);
            return;
          }
        } else {
          // Wait before retrying (increasing delay with each retry)
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        }
      }
    }

    // Then try to save auto-reply settings
    try {
      await configureAutoReply(settings.id, {
        autoReplyEnabled: settings.autoReplyEnabled,
        replyTemplate: settings.replyTemplate
      });
      
      if (rateLimitSaved) {
        toast.success('All settings saved successfully');
      } else {
        toast.success('Auto-reply settings saved successfully');
      }
      
      router.refresh();
    } catch (error) {
      console.error('Error saving auto-reply settings:', error);
      toast.error('Failed to save auto-reply settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    try {
      if (settings.status === 'active') {
        await pauseSmsCampaign(settings.id);
        setSettings(prev => ({ ...prev, status: 'paused' }));
        toast.success('Campaign paused');
      } else {
        await startSmsCampaign(settings.id);
        setSettings(prev => ({ ...prev, status: 'active' }));
        toast.success('Campaign started');
      }
    } catch (error) {
      console.error('Error toggling campaign status:', error);
      toast.error('Failed to update campaign status');
    }
  };

  const handleClearUnresponded = async () => {
    if (!settings.id) return;
    if (window.confirm('Are you sure you want to mark all unresponded messages for this campaign as resolved?')) {
      setIsClearing(true);
      try {
        const response = await clearUnrespondedMessages(settings.id);
        toast.success(response.message || 'Unresponded messages cleared.');
        fetchCampaignSettings();
      } catch (error) {
        console.error('Error clearing unresponded messages:', error);
        toast.error('Failed to clear unresponded messages.');
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleUploadLeads = () => {
    router.push(`/sms/upload?campaignId=${campaignId}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">Campaign Settings: {settings.name}</h1>
          </div>
          <Button
            variant="primary"
            onClick={handleUploadLeads}
            className="flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Leads
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading settings...</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSaveSettings} className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Campaign Status</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Current status: <span className={`font-medium ${
                        settings.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                      }`}>{settings.status}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUploadLeads}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Upload Contacts
                    </Button>
                    <Button
                      type="button"
                      variant={settings.status === 'active' ? 'secondary' : 'primary'}
                      onClick={handleStatusToggle}
                      disabled={settings.status === 'completed'}
                    >
                      {settings.status === 'active' ? 'Pause Campaign' : (settings.status === 'draft' || settings.status === 'paused' ? 'Start Campaign' : 'Campaign Completed')}
                    </Button>
                  </div>
                </div>

                <div>
                  <label htmlFor="rateLimit" className="block text-sm font-medium text-gray-700">
                    Rate Limit (messages per hour)
                  </label>
                  <div className="mt-1 flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <Input
                      type="number"
                      id="rateLimit"
                      value={settings.rateLimit}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        rateLimit: parseInt(e.target.value, 10) || 0
                      }))}
                      min="1"
                      max="10000"
                      className="w-32"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Maximum number of messages that can be sent per hour.
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="autoReplyEnabled"
                      checked={settings.autoReplyEnabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        autoReplyEnabled: e.target.checked
                      }))}
                      className="h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded"
                    />
                    <label htmlFor="autoReplyEnabled" className="text-sm font-medium text-gray-700">
                      Enable Auto-Reply
                    </label>
                  </div>
                  {settings.autoReplyEnabled && (
                    <div className="mt-3">
                      <label htmlFor="replyTemplate" className="block text-sm font-medium text-gray-700">
                        Auto-Reply Message
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="replyTemplate"
                          rows={3}
                          value={settings.replyTemplate}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            replyTemplate: e.target.value
                          }))}
                          className="shadow-sm focus:ring-brand focus:border-brand block w-full sm:text-sm border border-gray-300 rounded-md"
                          placeholder="Thank you for your message. We'll get back to you soon."
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        This message will be sent automatically when you receive a message.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="messageTemplate" className="block text-sm font-medium text-gray-700">
                    Campaign Message Template
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="messageTemplate"
                      rows={5}
                      value={settings.messageTemplate}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        messageTemplate: e.target.value
                      }))}
                      className="shadow-sm focus:ring-brand focus:border-brand block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Hi {name}, this is a message for you..."
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Use {'{name}'}, {'{phone}'}, {'{email}'} and other contact custom fields as placeholders.
                  </p>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900">Manage Unresponded Messages</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Mark all currently unresponded messages for this campaign as resolved. 
                    {settings.contactStats?.unresponded != null && settings.contactStats.unresponded > 0 &&
                      `There are currently ${settings.contactStats.unresponded} unresponded messages.`
                    }
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearUnresponded}
                    isLoading={isClearing}
                    disabled={isClearing}
                    className="mt-3"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Clear All Unresponded
                  </Button>
                </div>

                <div className="flex justify-end space-x-3 border-t pt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSaving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Server Component
export default async function CampaignSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <SettingsPageContent campaignId={resolvedParams.id} />;
} 