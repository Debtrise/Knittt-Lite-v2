'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageSquare, Trash2, Plus, Play, Pause, Upload, Clock, Edit } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import Input from '@/app/components/ui/Input';
import {
  listSmsCampaigns,
  createSmsCampaign,
  pauseSmsCampaign,
  startSmsCampaign,
  updateSmsCampaignRateLimit
} from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';
import { SmsCampaign, CreateSmsCampaignData } from '@/app/types/sms';

export default function SmsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCampaign, setNewCampaign] = useState<CreateSmsCampaignData>({
    name: '',
    messageTemplate: '',
    rateLimit: 60,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchCampaigns();
  }, [isAuthenticated, router]);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await listSmsCampaigns();
      // Handle both array response and paginated response format
      const campaignsList = Array.isArray(data) ? data : 
        (data.campaigns ? data.campaigns : []);
      setCampaigns(campaignsList);
    } catch (error) {
      console.error('Error fetching SMS campaigns:', error);
      toast.error('Failed to load SMS campaigns');
      setCampaigns([]);
    } finally {
      setIsLoading(false);
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

  const handleStartCampaign = async (id: number) => {
    try {
      await startSmsCampaign(id);
      fetchCampaigns(); // Refresh list to see status change
      toast.success('Campaign started');
    } catch (error) {
      console.error('Error starting campaign:', error);
      toast.error('Failed to start campaign');
    }
  };

  const handlePauseCampaign = async (id: number) => {
    try {
      await pauseSmsCampaign(id);
      fetchCampaigns(); // Refresh list to see status change
      toast.success('Campaign paused');
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast.error('Failed to pause campaign');
    }
  };

  const handleRateLimitChange = async (id: number, rateLimit: number) => {
    try {
      await updateSmsCampaignRateLimit(id, rateLimit);
      fetchCampaigns(); // Refresh list to see changes
      toast.success('Rate limit updated');
    } catch (error) {
      console.error('Error updating rate limit:', error);
      toast.error('Failed to update rate limit');
    }
  };

  const handleViewCampaign = (id: number) => {
    router.push(`/sms/${id}`);
  };

  const formatDate = (dateString: string) => {
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
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-12 text-center sm:px-6">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No SMS campaigns</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign and uploading leads.</p>
              <div className="mt-6 flex justify-center space-x-3">
                <Button
                  onClick={() => router.push('/sms/upload')}
                  variant="secondary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Leads
                </Button>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <li key={campaign.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-brand bg-opacity-10 rounded-md p-2">
                        <MessageSquare className="h-6 w-6 text-brand" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-brand">{campaign.name}</div>
                        <div className="text-sm text-gray-500">
                          Created: {formatDate(campaign.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewCampaign(campaign.id)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="ml-1">Details</span>
                      </Button>
                      {campaign.status === 'active' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePauseCampaign(campaign.id)}
                        >
                          <Pause className="h-4 w-4" />
                          <span className="ml-1">Pause</span>
                        </Button>
                      ) : campaign.status !== 'completed' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStartCampaign(campaign.id)}
                        >
                          <Play className="h-4 w-4" />
                          <span className="ml-1">Start</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="mt-1 text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            campaign.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'}`}
                        >
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="sm:col-span-1">
                      <div className="text-sm text-gray-500">Contacts</div>
                      <div className="mt-1 text-sm text-gray-900">
                        {campaign.sentCount} / {campaign.totalContacts} sent
                        {campaign.failedCount > 0 && (
                          <span className="text-red-600 ml-1">
                            ({campaign.failedCount} failed)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="sm:col-span-1">
                      <div className="text-sm text-gray-500">Rate Limit</div>
                      <div className="mt-1 text-sm text-gray-900 flex items-center">
                        <span>{campaign.rateLimit} per hour</span>
                        <span className="ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newRate = prompt('Enter new rate limit (messages per hour):', campaign.rateLimit.toString());
                              if (newRate) {
                                const rateNum = parseInt(newRate, 10);
                                if (!isNaN(rateNum) && rateNum > 0) {
                                  handleRateLimitChange(campaign.id, rateNum);
                                }
                              }
                            }}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </span>
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