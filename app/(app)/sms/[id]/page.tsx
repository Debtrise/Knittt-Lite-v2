'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageSquare, ArrowLeft, Play, Pause, Upload, Clock, Check, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Button from '@/app/components/ui/button';
import {
  getSmsCampaignDetails,
  uploadSmsCampaignContacts,
  startSmsCampaign,
  pauseSmsCampaign,
  updateSmsCampaignRateLimit
} from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';
import { SmsCampaign } from '@/app/types/sms';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [campaign, setCampaign] = useState<SmsCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const campaignId = parseInt(params.id as string, 10);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchCampaignDetails();

    // Set up auto-refresh if campaign is active
    const interval = setInterval(() => {
      if (campaign?.status === 'active') {
        fetchCampaignDetails();
      }
    }, 10000); // refresh every 10 seconds when active

    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthenticated, router, campaignId, campaign?.status]);

  const fetchCampaignDetails = async () => {
    setIsLoading(true);
    try {
      const data = await getSmsCampaignDetails(campaignId);
      setCampaign(data);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast.error('Failed to load campaign details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCampaign = async () => {
    try {
      const updatedCampaign = await startSmsCampaign(campaignId);
      if (updatedCampaign) {
        setCampaign(updatedCampaign);
        toast.success('Campaign started');
      } else {
        fetchCampaignDetails();
        toast.success('Campaign started');
      }
    } catch (error) {
      console.error('Error starting campaign:', error);
      toast.error('Failed to start campaign');
    }
  };

  const handlePauseCampaign = async () => {
    try {
      const updatedCampaign = await pauseSmsCampaign(campaignId);
      if (updatedCampaign) {
        setCampaign(updatedCampaign);
        toast.success('Campaign paused');
      } else {
        fetchCampaignDetails();
        toast.success('Campaign paused');
      }
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast.error('Failed to pause campaign');
    }
  };

  const handleRateLimitChange = async () => {
    if (!campaign) return;
    
    const newRate = prompt('Enter new rate limit (messages per hour):', campaign.rateLimit.toString());
    if (!newRate) return;
    
    const rateNum = parseInt(newRate, 10);
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error('Please enter a valid number greater than 0');
      return;
    }
    
    try {
      const updatedCampaign = await updateSmsCampaignRateLimit(campaignId, rateNum);
      if (updatedCampaign) {
        setCampaign(updatedCampaign);
        toast.success('Rate limit updated successfully');
      } else {
        fetchCampaignDetails();
        toast.success('Rate limit updated successfully');
      }
    } catch (error) {
      console.error('Error updating rate limit:', error);
      toast.error('Failed to update rate limit');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    
    const formData = new FormData();
    formData.append('contacts', file);
    
    setIsUploading(true);
    try {
      const response = await uploadSmsCampaignContacts(campaignId, formData);
      // If the response contains the campaign data, update it directly
      if (response && response.campaign) {
        setCampaign(response.campaign);
        toast.success(response.message || 'Contacts uploaded successfully');
      } else {
        // Fallback to fetching campaign details
        fetchCampaignDetails();
        toast.success('Contacts uploaded successfully');
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading contacts:', error);
      toast.error('Failed to upload contacts');
    } finally {
      setIsUploading(false);
    }
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

  const getProgressPercentage = () => {
    if (!campaign || campaign.totalContacts === 0) return 0;
    return Math.round((campaign.sentCount / campaign.totalContacts) * 100);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="secondary"
            onClick={() => router.push('/sms')}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            SMS Campaign Details
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        ) : campaign ? (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{campaign.name}</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Created: {formatDate(campaign.createdAt)} • Last Updated: {formatDate(campaign.updatedAt)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {campaign.status === 'active' ? (
                    <Button
                      variant="secondary"
                      onClick={handlePauseCampaign}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Campaign
                    </Button>
                  ) : campaign.status !== 'completed' && (
                    <Button
                      variant="primary"
                      onClick={handleStartCampaign}
                      disabled={campaign.totalContacts === 0}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Campaign
                    </Button>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          campaign.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'}`}
                      >
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Message Template</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono bg-gray-50 p-3 rounded">
                      {campaign.messageTemplate}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Rate Limit</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                      <span>{campaign.rateLimit} messages per hour</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRateLimitChange}
                        className="ml-2"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Progress</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-sm font-medium text-brand">
                            {campaign.sentCount} of {campaign.totalContacts} messages sent
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold inline-block text-brand">
                            {getProgressPercentage()}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-brand h-2.5 rounded-full" 
                          style={{ width: `${getProgressPercentage()}%` }}
                        ></div>
                      </div>
                      {campaign.failedCount > 0 && (
                        <div className="flex items-center mt-2 text-red-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span className="text-sm">{campaign.failedCount} messages failed to send</span>
                        </div>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Upload Contacts</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Upload a CSV file with contacts for this campaign.
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="sm:flex sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-3">
                      The CSV file must have a <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">phone</code> column. 
                      Other recognized columns are <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">name</code> and <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">email</code>.
                      Any additional columns will be available as custom fields in your message template.
                    </p>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700">Example CSV format:</h4>
                      <pre className="mt-1 text-xs text-gray-600">phone,name,email,custom_field1,custom_field2
+12345678901,John Doe,john@example.com,value1,value2</pre>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0 sm:flex sm:items-center">
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <label
                        htmlFor="file-upload"
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          isUploading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-brand hover:bg-brand-dark cursor-pointer'
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 text-white">
                              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Contacts
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                
                {campaign.totalContacts > 0 && (
                  <div className="mt-4 flex items-center text-sm text-green-600">
                    <Check className="h-5 w-5 mr-1" />
                    <span>{campaign.totalContacts} contacts loaded</span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-12 text-center sm:px-6">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Campaign not found</h3>
              <p className="mt-1 text-sm text-gray-500">The requested campaign may have been deleted or doesn't exist.</p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={() => router.push('/sms')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Campaigns
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 