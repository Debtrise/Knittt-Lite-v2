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
import { freepbx } from '@/app/lib/api';
import { getTenant, updateTenant } from '@/app/utils/api';
import { 
  Server, CheckCircle, XCircle, AlertCircle, 
  ArrowLeft, Save, TestTube, Activity, Shield
} from 'lucide-react';
import Link from 'next/link';

type PBXConfig = {
  serverUrl: string;
  username: string;
  password: string;
  isActive: boolean;
  autoUpload: boolean;
  settings: {
    timeout: number;
    retryAttempts: number;
    sshPort: number;
    enableSSL: boolean;
    enableRecording: boolean;
    recordingPath: string;
  };
  amiConfig: {
    host: string;
    port: number;
    username: string;
    password: string;
    trunk: string;
    context: string;
  };
};

export default function PBXSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  const form = useForm<PBXConfig>({
    defaultValues: {
      serverUrl: '',
      username: '',
      password: '',
      isActive: false,
      autoUpload: false,
      settings: {
        timeout: 30,
        retryAttempts: 3,
        sshPort: 22,
        enableSSL: true,
        enableRecording: false,
        recordingPath: '/var/spool/asterisk/monitor'
      },
      amiConfig: {
        host: '',
        port: 5038,
        username: '',
        password: '',
        trunk: '',
        context: 'from-internal'
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

    fetchPBXConfig();
  }, [isAuthenticated, user, router]);

  const fetchPBXConfig = async () => {
    setIsLoading(true);
    try {
      if (user?.tenantId) {
        const tenantId = parseInt(user.tenantId, 10);
        const tenantData = await getTenant(tenantId);
        
        if (tenantData.freepbxConfig) {
          const config = tenantData.freepbxConfig;
          setValue('serverUrl', config.serverUrl || '');
          setValue('username', config.username || '');
          setValue('password', config.password || '');
          setValue('isActive', config.isActive || false);
          setValue('autoUpload', config.autoUpload || false);
          setConnectionStatus(config.isActive ? 'connected' : 'disconnected');
        }

        if (tenantData.amiConfig) {
          const amiConfig = tenantData.amiConfig;
          setValue('amiConfig.host', amiConfig.host || '');
          setValue('amiConfig.port', amiConfig.port || 5038);
          setValue('amiConfig.username', amiConfig.username || '');
          setValue('amiConfig.password', amiConfig.password || '');
          setValue('amiConfig.trunk', amiConfig.trunk || '');
          setValue('amiConfig.context', amiConfig.context || 'from-internal');
        }
      }
      
      toast.success('PBX configuration loaded');
    } catch (error) {
      console.error('Error fetching PBX config:', error);
      setConnectionStatus('disconnected');
      toast.error('Failed to load PBX configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: PBXConfig) => {
    setIsSaving(true);
    try {
      if (user?.tenantId) {
        const tenantId = parseInt(user.tenantId, 10);
        const currentTenant = await getTenant(tenantId);
        
        // Update tenant with PBX configuration
        await updateTenant(tenantId, {
          ...currentTenant,
          freepbxConfig: {
            serverUrl: data.serverUrl,
            username: data.username,
            password: data.password,
            isActive: data.isActive,
            autoUpload: data.autoUpload
          },
          amiConfig: {
            host: data.amiConfig.host,
            port: data.amiConfig.port,
            username: data.amiConfig.username,
            password: data.amiConfig.password,
            trunk: data.amiConfig.trunk,
            context: data.amiConfig.context
          }
        });
        
        setConnectionStatus(data.isActive ? 'connected' : 'disconnected');
        toast.success('PBX configuration saved successfully');
      }
    } catch (error) {
      console.error('Error saving PBX config:', error);
      toast.error('Failed to save PBX configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const formData = form.getValues();
      
      // Test FreePBX connection
      const response = await freepbx.test({
        serverUrl: formData.serverUrl,
        username: formData.username,
        password: formData.password
      });
      
      setTestResult({
        success: response.data.success,
        message: response.data.message || 'Connection test successful'
      });
      setConnectionStatus(response.data.success ? 'connected' : 'disconnected');
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Connection test failed'
      });
      setConnectionStatus('disconnected');
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
              <span className="text-lg text-gray-700">Loading PBX configuration...</span>
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
                  <Server className="w-8 h-8 mr-3 text-blue-600" />
                  PBX Settings
                </h1>
                <p className="mt-2 text-gray-600">
                  Configure FreePBX integration and AMI settings
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {connectionStatus === 'connected' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {connectionStatus === 'disconnected' && <XCircle className="w-5 h-5 text-red-500" />}
              {connectionStatus === 'unknown' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
              <span className="text-sm font-medium text-gray-700 capitalize">
                {connectionStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Critical System Settings
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                These settings directly affect your phone system. Incorrect configuration may disrupt service.
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* FreePBX Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>FreePBX Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="serverUrl">Server URL</Label>
                <Input
                  id="serverUrl"
                  {...register('serverUrl', { required: 'Server URL is required' })}
                  placeholder="https://your-freepbx-server.com"
                />
                {errors.serverUrl && (
                  <p className="text-sm text-red-600 mt-1">{errors.serverUrl.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    {...register('username', { required: 'Username is required' })}
                    placeholder="FreePBX username"
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password', { required: 'Password is required' })}
                    placeholder="FreePBX password"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register('isActive')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive">Enable FreePBX Integration</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoUpload"
                    {...register('autoUpload')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="autoUpload">Auto-upload Recordings</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AMI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>AMI (Asterisk Manager Interface) Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amiHost">AMI Host</Label>
                  <Input
                    id="amiHost"
                    {...register('amiConfig.host', { required: 'AMI Host is required' })}
                    placeholder="192.168.1.100"
                  />
                  {errors.amiConfig?.host && (
                    <p className="text-sm text-red-600 mt-1">{errors.amiConfig.host.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="amiPort">AMI Port</Label>
                  <Input
                    id="amiPort"
                    type="number"
                    {...register('amiConfig.port', { 
                      required: 'AMI Port is required',
                      min: { value: 1, message: 'Port must be greater than 0' },
                      max: { value: 65535, message: 'Port must be less than 65536' }
                    })}
                    placeholder="5038"
                  />
                  {errors.amiConfig?.port && (
                    <p className="text-sm text-red-600 mt-1">{errors.amiConfig.port.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amiUsername">AMI Username</Label>
                  <Input
                    id="amiUsername"
                    {...register('amiConfig.username', { required: 'AMI Username is required' })}
                    placeholder="admin"
                  />
                  {errors.amiConfig?.username && (
                    <p className="text-sm text-red-600 mt-1">{errors.amiConfig.username.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="amiPassword">AMI Password</Label>
                  <Input
                    id="amiPassword"
                    type="password"
                    {...register('amiConfig.password', { required: 'AMI Password is required' })}
                    placeholder="AMI password"
                  />
                  {errors.amiConfig?.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.amiConfig.password.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trunk">Trunk</Label>
                  <Input
                    id="trunk"
                    {...register('amiConfig.trunk')}
                    placeholder="SIP/provider"
                  />
                </div>

                <div>
                  <Label htmlFor="context">Context</Label>
                  <Input
                    id="context"
                    {...register('amiConfig.context')}
                    placeholder="from-internal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
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

                <div>
                  <Label htmlFor="sshPort">SSH Port</Label>
                  <Input
                    id="sshPort"
                    type="number"
                    {...register('settings.sshPort', { 
                      required: 'SSH Port is required',
                      min: { value: 1, message: 'Port must be greater than 0' },
                      max: { value: 65535, message: 'Port must be less than 65536' }
                    })}
                  />
                  {errors.settings?.sshPort && (
                    <p className="text-sm text-red-600 mt-1">{errors.settings.sshPort.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="recordingPath">Recording Path</Label>
                <Input
                  id="recordingPath"
                  {...register('settings.recordingPath')}
                  placeholder="/var/spool/asterisk/monitor"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableSSL"
                    {...register('settings.enableSSL')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="enableSSL">Enable SSL/TLS</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableRecording"
                    {...register('settings.enableRecording')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="enableRecording">Enable Call Recording</Label>
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
                    Test your PBX connection to ensure it's working properly.
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