'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Save,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/app/lib/api';

interface OptisignsConfig {
  id?: string;
  tenantId: string;
  apiToken: string;
  apiUrl: string;
  isActive: boolean;
  lastSync?: string;
  syncStatus: 'success' | 'failed' | 'pending';
  syncError?: string | null;
  settings: {
    autoSync: boolean;
    syncInterval: number;
    enableWebhooks: boolean;
    defaultContentDuration: number;
    allowCustomAssets: boolean;
  };
}

interface TestResult {
  success: boolean;
  displayCount?: number;
  accountInfo?: {
    accountName: string;
    plan: string;
  };
  message?: string;
}

export default function OptisignsConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [config, setConfig] = useState<OptisignsConfig | null>(null);

  const form = useForm<OptisignsConfig>({
    defaultValues: {
      apiToken: '',
      apiUrl: 'https://graphql-gateway.optisigns.com',
      isActive: false,
      settings: {
        autoSync: true,
        syncInterval: 300,
        enableWebhooks: true,
        defaultContentDuration: 30,
        allowCustomAssets: true,
      },
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await api.optisigns.getConfig();
      const configData = response.data;
      setConfig(configData);

      // Populate form with existing data
      if (configData) {
        setValue('apiToken', configData.apiToken || '');
        setValue('apiUrl', configData.apiUrl || 'https://graphql-gateway.optisigns.com');
        setValue('isActive', configData.isActive || false);
        setValue('settings.autoSync', configData.settings?.autoSync ?? true);
        setValue('settings.syncInterval', configData.settings?.syncInterval ?? 300);
        setValue('settings.enableWebhooks', configData.settings?.enableWebhooks ?? true);
        setValue('settings.defaultContentDuration', configData.settings?.defaultContentDuration ?? 30);
        setValue('settings.allowCustomAssets', configData.settings?.allowCustomAssets ?? true);
      }
    } catch (error: any) {
      console.error('Error fetching config:', error);
      if (error.response?.status === 404) {
        toast.error('Optisigns configuration API not available. Backend integration not set up.');
      } else {
        toast.error('Failed to load configuration');
      }
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const onSubmit = async (data: OptisignsConfig) => {
    setSaving(true);
    try {
      await api.optisigns.saveConfig(data);
      toast.success('Configuration saved successfully');
      fetchConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    const apiToken = watch('apiToken');
    const apiUrl = watch('apiUrl');

    if (!apiToken || !apiUrl) {
      toast.error('Please provide API token and URL');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await api.optisigns.testConnection({
        apiToken,
        apiUrl,
      });

      setTestResult(response.data);
      if (response.data.success) {
        toast.success('Connection test successful!');
      } else {
        toast.error('Connection test failed');
      }
    } catch (error: any) {
      console.error('Error testing connection:', error);
      setTestResult({
        success: false,
        message: 'Connection test failed',
      });
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const syncIntervalOptions = [
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' },
  ];

  const durationOptions = [
    { value: 15, label: '15 seconds' },
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 120, label: '2 minutes' },
    { value: 300, label: '5 minutes' },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/optisigns')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Optisigns
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Optisigns Configuration</h1>
            <p className="text-gray-600">Manage API settings and connection</p>
          </div>
        </div>

        {/* Status Alert */}
        <div className="mb-6">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Configuration Status</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Configuration reading works, but some operations have GraphQL API issues (405 Method Not Allowed errors).
                    Connection testing and configuration updates may experience intermittent failures.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading configuration...</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="connection" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="connection">Connection</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
              </TabsList>

              <TabsContent value="connection" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      API Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure your Optisigns API connection settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiUrl">API URL</Label>
                      <Input
                        id="apiUrl"
                        {...register('apiUrl', { required: 'API URL is required' })}
                        placeholder="https://graphql-gateway.optisigns.com"
                      />
                      {errors.apiUrl && (
                        <p className="text-sm text-red-500">{errors.apiUrl.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiToken">API Token</Label>
                      <Input
                        id="apiToken"
                        type="password"
                        {...register('apiToken', { required: 'API token is required' })}
                        placeholder="Enter your Optisigns API token"
                      />
                      {errors.apiToken && (
                        <p className="text-sm text-red-500">{errors.apiToken.message}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={watch('isActive')}
                        onCheckedChange={(checked) => setValue('isActive', checked)}
                      />
                      <Label htmlFor="isActive">Enable Optisigns Integration</Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testConnection}
                        disabled={testing}
                        className="flex items-center gap-2"
                      >
                        {testing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                        Test Connection
                      </Button>
                    </div>

                    {testResult && (
                      <div className={`p-4 rounded-lg border ${
                        testResult.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {testResult.success ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className={`font-medium ${
                            testResult.success ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                          </span>
                        </div>
                        {testResult.success && testResult.accountInfo && (
                          <div className="space-y-1 text-sm text-green-700">
                            <p>Account: {testResult.accountInfo.accountName}</p>
                            <p>Plan: {testResult.accountInfo.plan}</p>
                            <p>Displays: {testResult.displayCount || 0}</p>
                          </div>
                        )}
                        {!testResult.success && testResult.message && (
                          <p className="text-sm text-red-700">{testResult.message}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Integration Settings</CardTitle>
                    <CardDescription>
                      Configure how Optisigns integration behaves
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Auto Sync</Label>
                          <p className="text-sm text-gray-500">
                            Automatically sync displays and content
                          </p>
                        </div>
                        <Switch
                          checked={watch('settings.autoSync')}
                          onCheckedChange={(checked) => setValue('settings.autoSync', checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="syncInterval">Sync Interval</Label>
                        <select
                          id="syncInterval"
                          {...register('settings.syncInterval')}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          {syncIntervalOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-sm text-gray-500">
                          How often to sync data with Optisigns
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Enable Webhooks</Label>
                          <p className="text-sm text-gray-500">
                            Allow webhook rules to trigger content display
                          </p>
                        </div>
                        <Switch
                          checked={watch('settings.enableWebhooks')}
                          onCheckedChange={(checked) => setValue('settings.enableWebhooks', checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="defaultContentDuration">Default Content Duration</Label>
                        <select
                          id="defaultContentDuration"
                          {...register('settings.defaultContentDuration')}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          {durationOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-sm text-gray-500">
                          Default duration for content display
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Allow Custom Assets</Label>
                          <p className="text-sm text-gray-500">
                            Allow uploading custom images and videos
                          </p>
                        </div>
                        <Switch
                          checked={watch('settings.allowCustomAssets')}
                          onCheckedChange={(checked) => setValue('settings.allowCustomAssets', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="status" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Integration Status</CardTitle>
                    <CardDescription>
                      Current status and sync information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Integration Status</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant={config?.isActive ? "success" : "secondary"}>
                            {config?.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Sync Status</Label>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              config?.syncStatus === 'success' ? 'success' :
                              config?.syncStatus === 'failed' ? 'destructive' : 'secondary'
                            }
                          >
                            {config?.syncStatus || 'Unknown'}
                          </Badge>
                        </div>
                      </div>

                      {config?.lastSync && (
                        <div className="space-y-2">
                          <Label>Last Sync</Label>
                          <p className="text-sm">
                            {new Date(config.lastSync).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {config?.syncError && (
                        <div className="space-y-2">
                          <Label>Sync Error</Label>
                          <p className="text-sm text-red-600">{config.syncError}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Configuration
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
} 