'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageSquare, Trash2, Plus, Play, Pause, Upload, Clock, Edit, Phone, Settings } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import {
  listSmsCampaigns,
  createSmsCampaign,
  pauseSmsCampaign,
  startSmsCampaign,
  updateSmsCampaignRateLimit,
  configureAutoReply,
  listTwilioNumbers,
  addTwilioNumber,
  uploadTwilioNumbers,
  deleteTwilioNumber,
  bulkDeleteTwilioNumbers
} from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';
import { SmsCampaign, CreateSmsCampaignData, TwilioNumber } from '@/app/types/sms';

export default function SmsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showTwilioForm, setShowTwilioForm] = useState(false);
  const [isAddingTwilio, setIsAddingTwilio] = useState(false);
  const [twilioNumbers, setTwilioNumbers] = useState<TwilioNumber[]>([]);
  const [selectedTwilioNumbers, setSelectedTwilioNumbers] = useState<number[]>([]);
  const [newCampaign, setNewCampaign] = useState<CreateSmsCampaignData>({
    name: '',
    messageTemplate: '',
    rateLimit: 60,
  });
  const [newTwilioNumber, setNewTwilioNumber] = useState({
    phoneNumber: '',
    accountSid: '',
    authToken: '',
  });
  const [autoReplySettings, setAutoReplySettings] = useState({
    autoReplyEnabled: false,
    replyTemplate: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchCampaigns();
    fetchTwilioNumbers();
  }, [isAuthenticated, router]);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await listSmsCampaigns();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching SMS campaigns:', error);
      toast.error('Failed to load SMS campaigns');
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTwilioNumbers = async () => {
    try {
      const data = await listTwilioNumbers();
      setTwilioNumbers(data || []);
    } catch (error) {
      console.error('Error fetching Twilio numbers:', error);
      toast.error('Failed to load Twilio numbers');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCampaign.name || !newCampaign.messageTemplate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsCreating(true);
    try {
      const campaign = await createSmsCampaign(newCampaign);
      setCampaigns([...campaigns, campaign]);
      toast.success('Campaign created successfully');
      setShowCreateForm(false);
      setNewCampaign({
        name: '',
        messageTemplate: '',
        rateLimit: 60,
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddTwilioNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTwilioNumber.phoneNumber || !newTwilioNumber.accountSid || !newTwilioNumber.authToken) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsAddingTwilio(true);
    try {
      const number = await addTwilioNumber(newTwilioNumber);
      setTwilioNumbers([...twilioNumbers, number]);
      toast.success('Twilio number added successfully');
      setShowTwilioForm(false);
      setNewTwilioNumber({
        phoneNumber: '',
        accountSid: '',
        authToken: '',
      });
    } catch (error) {
      console.error('Error adding Twilio number:', error);
      toast.error('Failed to add Twilio number');
    } finally {
      setIsAddingTwilio(false);
    }
  };

  const handleUploadTwilioNumbers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('numbers', file);

    try {
      const result = await uploadTwilioNumbers(formData);
      toast.success(`Uploaded ${result.message}`);
      fetchTwilioNumbers();
    } catch (error) {
      console.error('Error uploading Twilio numbers:', error);
      toast.error('Failed to upload Twilio numbers');
    }
  };

  const handleDeleteSingleTwilioNumber = async (numberId: number) => {
    if (window.confirm('Are you sure you want to delete this Twilio number? This might affect active campaigns. Reassign contacts?')) {
      const reassign = window.confirm('Reassign contacts to another number?');
      try {
        const result = await deleteTwilioNumber(numberId, { reassign });
        toast.success(result.message || 'Twilio number deleted');
        fetchTwilioNumbers();
      } catch (error) {
        console.error('Error deleting Twilio number:', error);
        toast.error('Failed to delete Twilio number');
      }
    }
  };

  const handleToggleTwilioSelection = (numberId: number) => {
    setSelectedTwilioNumbers(prev => 
      prev.includes(numberId) 
        ? prev.filter(id => id !== numberId) 
        : [...prev, numberId]
    );
  };

  const handleBulkDeleteSelectedTwilioNumbers = async () => {
    if (selectedTwilioNumbers.length === 0) {
      toast.error('No numbers selected for deletion.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedTwilioNumbers.length} Twilio number(s)? This might affect active campaigns.`)) {
      const reassign = window.confirm('Reassign contacts to other numbers?');
      const force = window.confirm('Force delete even if used by active campaigns? This is a destructive action.')
      try {
        const result = await bulkDeleteTwilioNumbers(selectedTwilioNumbers, { reassign, force });
        toast.success(result.message || 'Selected Twilio numbers deleted');
        setSelectedTwilioNumbers([]);
        fetchTwilioNumbers();
      } catch (error) {
        console.error('Error bulk deleting Twilio numbers:', error);
        toast.error('Failed to bulk delete Twilio numbers');
      }
    }
  };

  const handleStartCampaign = async (id: number) => {
    try {
      await startSmsCampaign(id);
      fetchCampaigns();
      toast.success('Campaign started');
    } catch (error) {
      console.error('Error starting campaign:', error);
      toast.error('Failed to start campaign');
    }
  };

  const handlePauseCampaign = async (id: number) => {
    try {
      await pauseSmsCampaign(id);
      fetchCampaigns();
      toast.success('Campaign paused');
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast.error('Failed to pause campaign');
    }
  };

  const handleRateLimitChange = async (id: number, rateLimit: number) => {
    try {
      await updateSmsCampaignRateLimit(id, rateLimit);
      fetchCampaigns();
      toast.success('Rate limit updated');
    } catch (error) {
      console.error('Error updating rate limit:', error);
      toast.error('Failed to update rate limit');
    }
  };

  const handleAutoReplyChange = async (id: number, settings: { autoReplyEnabled: boolean; replyTemplate: string }) => {
    try {
      await configureAutoReply(id, settings);
      fetchCampaigns();
      toast.success('Auto-reply settings updated');
    } catch (error) {
      console.error('Error updating auto-reply settings:', error);
      toast.error('Failed to update auto-reply settings');
    }
  };

  const handleViewCampaign = (id: number) => {
    router.push(`/sms/${id}/settings`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">SMS Campaigns</h1>
          <div className="flex space-x-3">
            <Button
              onClick={() => router.push('/sms/upload')}
              variant="secondary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Leads
            </Button>
            <Button
              onClick={() => setShowTwilioForm(!showTwilioForm)}
              variant="secondary"
            >
              <Phone className="w-4 h-4 mr-2" />
              {showTwilioForm ? 'Hide Twilio Numbers' : 'Manage Twilio Numbers'}
            </Button>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              variant="primary"
            >
              {showCreateForm ? 'Cancel' : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </>
              )}
            </Button>
          </div>
        </div>

        {showTwilioForm && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Manage Twilio Numbers</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Add new Twilio numbers or upload them via CSV. Select numbers to bulk delete.
                </p>
              </div>
              {selectedTwilioNumbers.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDeleteSelectedTwilioNumbers}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedTwilioNumbers.length})
                </Button>
              )}
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <form onSubmit={handleAddTwilioNumber} className="space-y-6 mb-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-2">
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        id="phoneNumber"
                        value={newTwilioNumber.phoneNumber}
                        onChange={(e) => setNewTwilioNumber({...newTwilioNumber, phoneNumber: e.target.value})}
                        placeholder="+1234567890"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="accountSid" className="block text-sm font-medium text-gray-700">
                      Account SID
                    </label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        id="accountSid"
                        value={newTwilioNumber.accountSid}
                        onChange={(e) => setNewTwilioNumber({...newTwilioNumber, accountSid: e.target.value})}
                        placeholder="AC..."
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="authToken" className="block text-sm font-medium text-gray-700">
                      Auth Token
                    </label>
                    <div className="mt-1">
                      <Input
                        type="password"
                        id="authToken"
                        value={newTwilioNumber.authToken}
                        onChange={(e) => setNewTwilioNumber({...newTwilioNumber, authToken: e.target.value})}
                        placeholder="Auth Token"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Upload Numbers via CSV
                    </label>
                    <div className="mt-1">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleUploadTwilioNumbers}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-brand file:text-white
                          hover:file:bg-brand/90"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowTwilioForm(false)}
                    >
                      Cancel Add
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isAddingTwilio}
                    >
                      Add Number
                    </Button>
                  </div>
                </div>
              </form>

              {twilioNumbers.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Existing Twilio Numbers</h4>
                  <div className="space-y-2">
                    {twilioNumbers.map((number) => (
                      <div key={number.id} className={`flex items-center justify-between p-3 rounded-lg ${
                        selectedTwilioNumbers.includes(number.id) ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center">
                           <input 
                            type="checkbox"
                            checked={selectedTwilioNumbers.includes(number.id)}
                            onChange={() => handleToggleTwilioSelection(number.id)}
                            className="h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded mr-3"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{number.phoneNumber}</p>
                            <p className="text-xs text-gray-500 mt-1">Status: {number.status} | Messages: {number.messagesCount}</p>
                            <p className="text-xs text-gray-500">Last Used: {formatDate(number.lastUsed)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSingleTwilioNumber(number.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showCreateForm && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Create New SMS Campaign</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Fill in the details below to create a new SMS campaign
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <form onSubmit={handleCreateCampaign} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Campaign Name
                    </label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        id="name"
                        value={newCampaign.name}
                        onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                        placeholder="Enter campaign name"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="rateLimit" className="block text-sm font-medium text-gray-700">
                      Rate Limit (per hour)
                    </label>
                    <div className="mt-1">
                      <Input
                        type="number"
                        id="rateLimit"
                        value={newCampaign.rateLimit}
                        onChange={(e) => setNewCampaign({...newCampaign, rateLimit: parseInt(e.target.value, 10)})}
                        min="1"
                        max="1000"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="messageTemplate" className="block text-sm font-medium text-gray-700">
                      Message Template
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="messageTemplate"
                        rows={5}
                        value={newCampaign.messageTemplate}
                        onChange={(e) => setNewCampaign({...newCampaign, messageTemplate: e.target.value})}
                        className="shadow-sm focus:ring-brand focus:border-brand block w-full sm:text-sm border border-gray-300 rounded-md"
                        placeholder="Hi {name}, this is a message for you..."
                        required
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Use {'{name}'}, {'{phone}'}, {'{email}'} as placeholders for contact data. Custom fields from your CSV can be used as {'{field_name}'}.
                    </p>
                  </div>

                  <div className="sm:col-span-6">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoReplyEnabledCreate"
                        checked={autoReplySettings.autoReplyEnabled}
                        onChange={(e) => setAutoReplySettings({
                          ...autoReplySettings,
                          autoReplyEnabled: e.target.checked
                        })}
                        className="h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded"
                      />
                      <label htmlFor="autoReplyEnabledCreate" className="text-sm font-medium text-gray-700">
                        Enable Auto-Reply (Initial Setting)
                      </label>
                    </div>
                    {autoReplySettings.autoReplyEnabled && (
                      <div className="mt-3">
                         <label htmlFor="replyTemplateCreate" className="block text-sm font-medium text-gray-700">
                          Initial Auto-Reply Message
                        </label>
                        <textarea
                          id="replyTemplateCreate"
                          rows={3}
                          value={autoReplySettings.replyTemplate}
                          onChange={(e) => setAutoReplySettings({
                            ...autoReplySettings,
                            replyTemplate: e.target.value
                          })}
                          className="shadow-sm focus:ring-brand focus:border-brand block w-full sm:text-sm border border-gray-300 rounded-md"
                          placeholder="Thank you for your message. We'll get back to you soon."
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateForm(false)}
                    className="mr-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isCreating}
                  >
                    Create Campaign
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
            <div className="mt-6">
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-brand truncate">{campaign.name}</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status}
                          </p>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex space-x-2">
                        <Button
                          onClick={() => handleViewCampaign(campaign.id)}
                          variant="secondary"
                          size="sm"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          onClick={() => router.push(`/sms/${campaign.id}/conversations`)}
                          variant="secondary"
                          size="sm"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Conversations
                        </Button>
                        {campaign.status === 'active' ? (
                          <Button
                            onClick={() => handlePauseCampaign(campaign.id)}
                            variant="secondary"
                            size="sm"
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleStartCampaign(campaign.id)}
                            variant="secondary"
                            size="sm"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </Button>
                        )}
                        <Button
                          onClick={() => router.push(`/sms/${campaign.id}/settings`)}
                          variant="secondary"
                          size="sm"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Settings
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          Rate: {campaign.rateLimit}/hr
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Created {formatDate(campaign.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{campaign.totalContacts}</p>
                        <p className="text-xs text-gray-500">Total Contacts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{campaign.sentCount}</p>
                        <p className="text-xs text-gray-500">Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{campaign.failedCount}</p>
                        <p className="text-xs text-gray-500">Failed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {campaign.autoReplyEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                        <p className="text-xs text-gray-500">Auto-Reply</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 