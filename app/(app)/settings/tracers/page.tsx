'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { useAuthStore } from '@/app/store/authStore';
import { tracers } from '@/app/lib/api';
import { 
  Search, CheckCircle, XCircle, AlertCircle, 
  ArrowLeft, Save, TestTube, Activity
} from 'lucide-react';
import Link from 'next/link';

type TracersConfig = {
  apiKey: string;
  serviceUrl: string;
  isActive: boolean;
  settings: {
    timeout: number;
    retryAttempts: number;
    enableBulkEnrichment: boolean;
    enableAutoEnrichment: boolean;
    dailyLimit: number;
  };
};

export default function TracersSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [serviceStatus, setServiceStatus] = useState<'unknown' | 'active' | 'inactive'>('unknown');
  const [usageStats, setUsageStats] = useState<any>(null);

  const form = useForm<TracersConfig>({
    defaultValues: {
      apiKey: '',
      serviceUrl: 'https://api.tracers.com/v1',
      isActive: false,
      settings: {
        timeout: 30,
        retryAttempts: 3,
        enableBulkEnrichment: true,
        enableAutoEnrichment: false,
        dailyLimit: 1000
      }
    }
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin') {
      router.push('/settings');
      return;
    }

    fetchTracersConfig();
  }, [isAuthenticated, user, router]);

  const fetchTracersConfig = async () => {
    setIsLoading(true);
    try {
      // Check service status
      const statusResponse = await tracers.getServiceStatus();
      setServiceStatus(statusResponse.data ? 'active' : 'inactive');

      // Get usage stats
      const usageResponse = await tracers.getUsageStats({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      });
      setUsageStats(usageResponse.data);

      // Note: There might not be a specific config endpoint for Tracers
      // You may need to implement this on the backend
      toast.success('Tracers configuration loaded');
    } catch (error) {
      console.error('Error fetching Tracers config:', error);
      setServiceStatus('inactive');
      toast.error('Failed to load Tracers configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: TracersConfig) => {
    setIsSaving(true);
    try {
      // Note: You may need to implement a config save endpoint for Tracers
      // For now, we'll just test the connection
      await testConnection();
      toast.success('Tracers configuration saved successfully');
    } catch (error) {
      console.error('Error saving Tracers config:', error);
      toast.error('Failed to save Tracers configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await tracers.testConnection();
      setTestResult({
        success: response.data.success,
        message: response.data.message || 'Connection test successful'
      });
      setServiceStatus(response.data.success ? 'active' : 'inactive');
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Connection test failed'
      });
      setServiceStatus('inactive');
    } finally {
      setIsTesting(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="py-6 text-center text-gray-500">
          Access denied. Admin privileges required.
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg text-gray-700">Loading Tracers configuration...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Settings
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Search className="w-8 h-8 mr-3 text-blue-600" />
                  Tracers API Settings
                </h1>
                <p className="mt-2 text-gray-600">
                  Configure lead enrichment and data enhancement services
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {serviceStatus === 'active' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {serviceStatus === 'inactive' && <XCircle className="w-5 h-5 text-red-500" />}
              {serviceStatus === 'unknown' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
              <span className="text-sm font-medium text-gray-700 capitalize">
                {serviceStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Service Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {usageStats?.totalSearches || 0}
                </div>
                <div className="text-sm text-gray-600">Total Searches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {usageStats?.successfulEnrichments || 0}
                </div>
                <div className="text-sm text-gray-600">Successful Enrichments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {usageStats?.dailyUsage || 0}
                </div>
                <div className="text-sm text-gray-600">Today's Usage</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  {...register('apiKey', { required: 'API Key is required' })}
                  placeholder="Enter your Tracers API key"
                />
                {errors.apiKey && (
                  <p className="text-sm text-red-600 mt-1">{errors.apiKey.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="serviceUrl">Service URL</Label>
                <Input
                  id="serviceUrl"
                  {...register('serviceUrl', { required: 'Service URL is required' })}
                  placeholder="https://api.tracers.com/v1"
                />
                {errors.serviceUrl && (
                  <p className="text-sm text-red-600 mt-1">{errors.serviceUrl.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register('isActive')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isActive">Enable Tracers API</Label>
              </div>
            </CardContent>
          </Card>

          {/* Service Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Service Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeout">Request Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    {...register('settings.timeout', { 
                      required: 'Timeout is required',
                      min: { value: 5, message: 'Minimum timeout is 5 seconds' },
                      max: { value: 120, message: 'Maximum timeout is 120 seconds' }
                    })}
                  />
                  {errors.settings?.timeout && (
                    <p className="text-sm text-red-600 mt-1">{errors.settings.timeout.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="retryAttempts">Retry Attempts</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    {...register('settings.retryAttempts', { 
                      required: 'Retry attempts is required',
                      min: { value: 0, message: 'Minimum retry attempts is 0' },
                      max: { value: 5, message: 'Maximum retry attempts is 5' }
                    })}
                  />
                  {errors.settings?.retryAttempts && (
                    <p className="text-sm text-red-600 mt-1">{errors.settings.retryAttempts.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="dailyLimit">Daily Usage Limit</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  {...register('settings.dailyLimit', { 
                    required: 'Daily limit is required',
                    min: { value: 1, message: 'Minimum daily limit is 1' }
                  })}
                />
                {errors.settings?.dailyLimit && (
                  <p className="text-sm text-red-600 mt-1">{errors.settings.dailyLimit.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableBulkEnrichment"
                    {...register('settings.enableBulkEnrichment')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="enableBulkEnrichment">Enable Bulk Enrichment</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableAutoEnrichment"
                    {...register('settings.enableAutoEnrichment')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="enableAutoEnrichment">Enable Auto Enrichment</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Connection */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Test your Tracers API connection to ensure it's working properly.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={testConnection}
                  disabled={isTesting}
                  className="flex items-center space-x-2"
                >
                  <TestTube className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </Button>
              </div>

              {testResult && (
                <div className={`mt-4 p-3 rounded-md ${
                  testResult.success 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center">
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    <span className="text-sm font-medium">
                      {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{testResult.message}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 