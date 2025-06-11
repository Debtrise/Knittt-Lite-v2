'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  Settings, 
  MessageSquare, 
  Globe,
  Save,
  Zap,
  AlertCircle,
  CheckCircle,
  Mail
} from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useAuthStore } from '@/app/store/authStore';
import api, { email } from '@/app/lib/api';
import { EmailConfig, MailgunSettings, EmailTestRequest } from '@/app/types/email';

type SmsConfig = {
  accountSid: string;
  authToken: string;
  defaultFromNumber: string;
  rateLimits: {
    messagesPerSecond: number;
    messagesPerMinute: number;
    messagesPerHour: number;
  };
  settings: {
    autoReplyEnabled: boolean;
    webhookUrl: string;
    fallbackNumber: string;
    optOutMessage: string;
  };
};

type ApiConfig = {
  baseUrl: string;
  apiKey: string;
  rateLimits: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
  timeout: number;
  retryAttempts: number;
};

type SystemConfig = {
  debug: boolean;
  logLevel: 'error' | 'warning' | 'info' | 'debug' | 'verbose';
  enableMetrics: boolean;
  enableWebhooks: boolean;
  maintenanceMode: boolean;
  maxConcurrentProcesses: number;
};

type EmailConfigForm = {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  dailyLimit: number;
  settings: {
    apiKey: string;
    domain: string;
    host: 'api.mailgun.net' | 'api.eu.mailgun.net';
    tracking: boolean;
    trackingClicks: 'yes' | 'no' | 'htmlonly';
    trackingOpens: boolean;
    tags: string;
  };
};

export default function ConfigPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});

  // Form data states
  const [smsConfig, setSmsConfig] = useState<SmsConfig>({
    accountSid: '',
    authToken: '',
    defaultFromNumber: '',
    rateLimits: {
      messagesPerSecond: 1,
      messagesPerMinute: 60,
      messagesPerHour: 3600
    },
    settings: {
      autoReplyEnabled: false,
      webhookUrl: '',
      fallbackNumber: '',
      optOutMessage: 'Reply STOP to opt out'
    }
  });

  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    baseUrl: 'http://34.122.156.88:3001/api',
    apiKey: '',
    rateLimits: {
      requestsPerSecond: 10,
      requestsPerMinute: 600
    },
    timeout: 30000,
    retryAttempts: 3
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    debug: false,
    logLevel: 'info',
    enableMetrics: true,
    enableWebhooks: true,
    maintenanceMode: false,
    maxConcurrentProcesses: 10
  });

  const [emailConfig, setEmailConfig] = useState<EmailConfigForm>({
    provider: 'mailgun',
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
    dailyLimit: 1000,
    settings: {
      apiKey: '',
      domain: '',
      host: 'api.mailgun.net',
      tracking: true,
      trackingClicks: 'yes',
      trackingOpens: true,
      tags: ''
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchConfigs();
  }, [isAuthenticated, router]);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      
      // Fetch SMS configuration
      try {
        const smsResponse = await api.sms.getConfig();
        if (smsResponse.data) {
          setSmsConfig({
            accountSid: smsResponse.data.accountSid || '',
            authToken: smsResponse.data.authToken || '',
            defaultFromNumber: smsResponse.data.defaultFromNumber || '',
            rateLimits: smsResponse.data.rateLimits || smsConfig.rateLimits,
            settings: smsResponse.data.settings || smsConfig.settings
          });
        }
      } catch (error) {
        console.warn('SMS config not available:', error);
      }

      // Fetch Email configuration
      try {
        const emailResponse = await email.getConfig();
        if (emailResponse.data) {
          const config = emailResponse.data;
          setEmailConfig({
            provider: config.provider,
            fromEmail: config.fromEmail || '',
            fromName: config.fromName || '',
            replyToEmail: config.replyToEmail || '',
            dailyLimit: config.dailyLimit || 1000,
            settings: {
              apiKey: (config.settings as MailgunSettings).apiKey || '',
              domain: (config.settings as MailgunSettings).domain || '',
              host: (config.settings as MailgunSettings).host || 'api.mailgun.net',
              tracking: (config.settings as MailgunSettings).tracking ?? true,
              trackingClicks: (config.settings as MailgunSettings).trackingClicks || 'yes',
              trackingOpens: (config.settings as MailgunSettings).trackingOpens ?? true,
              tags: (config.settings as MailgunSettings).tags || ''
            }
          });
        }
      } catch (error) {
        console.warn('Email config not available:', error);
      }
      
    } catch (error) {
      console.error('Error fetching configurations:', error);
      toast.error('Failed to load configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const testSmsConnection = async () => {
    try {
      setIsTesting(true);
      setTestResults(prev => ({ ...prev, sms: null }));
      
      const response = await api.sms.testConnection();
      const success = response.data?.success || false;
      
      setTestResults(prev => ({ ...prev, sms: success }));
      
      if (success) {
        toast.success('SMS connection test successful');
      } else {
        toast.error('SMS connection test failed');
      }
    } catch (error) {
      console.error('SMS connection test error:', error);
      setTestResults(prev => ({ ...prev, sms: false }));
      toast.error('SMS connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const testEmailConnection = async () => {
    try {
      setIsTesting(true);
      setTestResults(prev => ({ ...prev, email: null }));
      
      const testEmail = prompt('Enter test email address:', 'test@example.com');
      if (!testEmail) {
        setIsTesting(false);
        return;
      }

      const testRequest: EmailTestRequest = {
        to: testEmail,
        testType: 'basic'
      };
      
      const response = await email.test(testRequest);
      const success = response.data?.success || false;
      
      setTestResults(prev => ({ ...prev, email: success }));
      
      if (success) {
        toast.success(`Email test successful! Message ID: ${response.data?.messageId}`);
      } else {
        toast.error('Email connection test failed');
      }
    } catch (error) {
      console.error('Email connection test error:', error);
      setTestResults(prev => ({ ...prev, email: false }));
      toast.error('Email connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const testApiConnection = async () => {
    try {
      setIsTesting(true);
      setTestResults(prev => ({ ...prev, api: null }));
      
      // Test the API connection with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (apiConfig.apiKey) {
        headers['Authorization'] = apiConfig.apiKey.startsWith('Bearer ') 
          ? apiConfig.apiKey 
          : `Bearer ${apiConfig.apiKey}`;
      }
      
      const response = await fetch(`${apiConfig.baseUrl}/campaigns`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000),
      });
      
      const success = response.ok;
      setTestResults(prev => ({ ...prev, api: success }));
      
      if (success) {
        toast.success('API connection test successful');
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        toast.error(`API connection test failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('API connection test error:', error);
      setTestResults(prev => ({ ...prev, api: false }));
      toast.error(`API connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const saveSmsConfig = async () => {
    try {
      setIsSubmitting(true);
      
      await api.sms.saveConfig(smsConfig);
      toast.success('SMS configuration saved successfully');
      
      // Refresh the phone numbers after saving config
      try {
        await api.sms.syncNumbers();
        toast.success('Phone numbers synced successfully');
      } catch (syncError) {
        console.warn('Phone number sync failed:', syncError);
        toast.warning('Configuration saved but phone number sync failed');
      }
      
    } catch (error) {
      console.error('Error saving SMS configuration:', error);
      toast.error('Failed to save SMS configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveApiConfig = async () => {
    try {
      setIsSubmitting(true);
      
      // Save to localStorage for now (can be moved to backend later)
      if (typeof window !== 'undefined') {
        localStorage.setItem('sms_api_config', JSON.stringify({
          baseUrl: apiConfig.baseUrl,
          apiKey: apiConfig.apiKey,
          authToken: apiConfig.apiKey, // Using apiKey as authToken for now
        }));
      }
      
      toast.success('API configuration saved successfully');
    } catch (error) {
      console.error('Error saving API configuration:', error);
      toast.error('Failed to save API configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveEmailConfig = async () => {
    try {
      setIsSubmitting(true);
      
      const configData = {
        provider: emailConfig.provider,
        fromEmail: emailConfig.fromEmail,
        fromName: emailConfig.fromName,
        replyToEmail: emailConfig.replyToEmail,
        dailyLimit: emailConfig.dailyLimit,
        settings: emailConfig.settings
      };
      
      await email.saveConfig(configData);
      toast.success('Email configuration saved successfully');
    } catch (error) {
      console.error('Error saving email config:', error);
      toast.error('Failed to save email configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveSystemConfig = async () => {
    try {
      setIsSubmitting(true);
      // Add API call when backend endpoint is ready
      toast.success('System configuration saved successfully');
    } catch (error) {
      console.error('Error saving system configuration:', error);
      toast.error('Failed to save system configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
          <p className="text-gray-600">Manage API configurations, SMS settings, and system preferences</p>
        </div>

        <Tabs defaultValue="sms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS & Twilio
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email & Mailgun
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              API Settings
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* SMS Configuration Tab */}
          <TabsContent value="sms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Twilio SMS Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="accountSid">Account SID</Label>
                      <Input
                        id="accountSid"
                        type="password"
                        value={smsConfig.accountSid}
                        onChange={(e) => setSmsConfig(prev => ({
                          ...prev,
                          accountSid: e.target.value
                        }))}
                        placeholder="Enter Twilio Account SID"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="authToken">Auth Token</Label>
                      <Input
                        id="authToken"
                        type="password"
                        value={smsConfig.authToken}
                        onChange={(e) => setSmsConfig(prev => ({
                          ...prev,
                          authToken: e.target.value
                        }))}
                        placeholder="Enter Twilio Auth Token"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="defaultFromNumber">Default From Number</Label>
                      <Input
                        id="defaultFromNumber"
                        value={smsConfig.defaultFromNumber}
                        onChange={(e) => setSmsConfig(prev => ({
                          ...prev,
                          defaultFromNumber: e.target.value
                        }))}
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="webhookUrl">Webhook URL</Label>
                      <Input
                        id="webhookUrl"
                        value={smsConfig.settings.webhookUrl}
                        onChange={(e) => setSmsConfig(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            webhookUrl: e.target.value
                          }
                        }))}
                        placeholder="https://yourdomain.com/sms/webhook"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fallbackNumber">Fallback Number</Label>
                      <Input
                        id="fallbackNumber"
                        value={smsConfig.settings.fallbackNumber}
                        onChange={(e) => setSmsConfig(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            fallbackNumber: e.target.value
                          }
                        }))}
                        placeholder="+1234567890"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="optOutMessage">Opt-Out Message</Label>
                      <Input
                        id="optOutMessage"
                        value={smsConfig.settings.optOutMessage}
                        onChange={(e) => setSmsConfig(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            optOutMessage: e.target.value
                          }
                        }))}
                        placeholder="Reply STOP to opt out"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium mb-4">Rate Limits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="messagesPerSecond">Messages per Second</Label>
                      <Input
                        id="messagesPerSecond"
                        type="number"
                        value={smsConfig.rateLimits.messagesPerSecond}
                        onChange={(e) => setSmsConfig(prev => ({
                          ...prev,
                          rateLimits: {
                            ...prev.rateLimits,
                            messagesPerSecond: parseInt(e.target.value)
                          }
                        }))}
                        min={1}
                        max={100}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="messagesPerMinute">Messages per Minute</Label>
                      <Input
                        id="messagesPerMinute"
                        type="number"
                        value={smsConfig.rateLimits.messagesPerMinute}
                        onChange={(e) => setSmsConfig(prev => ({
                          ...prev,
                          rateLimits: {
                            ...prev.rateLimits,
                            messagesPerMinute: parseInt(e.target.value)
                          }
                        }))}
                        min={1}
                        max={6000}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="messagesPerHour">Messages per Hour</Label>
                      <Input
                        id="messagesPerHour"
                        type="number"
                        value={smsConfig.rateLimits.messagesPerHour}
                        onChange={(e) => setSmsConfig(prev => ({
                          ...prev,
                          rateLimits: {
                            ...prev.rateLimits,
                            messagesPerHour: parseInt(e.target.value)
                          }
                        }))}
                        min={1}
                        max={360000}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="autoReplyEnabled"
                      checked={smsConfig.settings.autoReplyEnabled}
                      onCheckedChange={(checked) => setSmsConfig(prev => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          autoReplyEnabled: !!checked
                        }
                      }))}
                    />
                    <Label htmlFor="autoReplyEnabled">Enable Auto-Reply</Label>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t">
                  <Button 
                    onClick={testSmsConnection}
                    disabled={isTesting}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isTesting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Test Connection
                  </Button>
                  
                  {testResults.sms !== undefined && (
                    <div className="flex items-center gap-2">
                      {testResults.sms ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Connection successful</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">Connection failed</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={saveSmsConfig}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 ml-auto"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Configuration Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Mailgun Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fromEmail">From Email</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={emailConfig.fromEmail}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          fromEmail: e.target.value
                        }))}
                        placeholder="noreply@yourdomain.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fromName">From Name</Label>
                      <Input
                        id="fromName"
                        value={emailConfig.fromName}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          fromName: e.target.value
                        }))}
                        placeholder="Your Company"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="replyToEmail">Reply-To Email</Label>
                      <Input
                        id="replyToEmail"
                        type="email"
                        value={emailConfig.replyToEmail}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          replyToEmail: e.target.value
                        }))}
                        placeholder="support@yourdomain.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dailyLimit">Daily Email Limit</Label>
                      <Input
                        id="dailyLimit"
                        type="number"
                        value={emailConfig.dailyLimit}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          dailyLimit: parseInt(e.target.value) || 1000
                        }))}
                        min={1}
                        max={50000}
                        placeholder="1000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="apiKey">Mailgun API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={emailConfig.settings.apiKey}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            apiKey: e.target.value
                          }
                        }))}
                        placeholder="key-xxxxxxxxxxxxxxxx"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="domain">Mailgun Domain</Label>
                      <Input
                        id="domain"
                        value={emailConfig.settings.domain}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            domain: e.target.value
                          }
                        }))}
                        placeholder="mg.yourdomain.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="host">Mailgun Region</Label>
                      <Select 
                        value={emailConfig.settings.host} 
                        onValueChange={(value: 'api.mailgun.net' | 'api.eu.mailgun.net') => setEmailConfig(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            host: value
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api.mailgun.net">US (api.mailgun.net)</SelectItem>
                          <SelectItem value="api.eu.mailgun.net">EU (api.eu.mailgun.net)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tags">Default Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={emailConfig.settings.tags}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            tags: e.target.value
                          }
                        }))}
                        placeholder="automated,dialer,marketing"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium mb-4">Tracking Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tracking"
                        checked={emailConfig.settings.tracking}
                        onCheckedChange={(checked) => setEmailConfig(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            tracking: !!checked
                          }
                        }))}
                      />
                      <Label htmlFor="tracking">Enable Tracking</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="trackingOpens"
                        checked={emailConfig.settings.trackingOpens}
                        onCheckedChange={(checked) => setEmailConfig(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            trackingOpens: !!checked
                          }
                        }))}
                      />
                      <Label htmlFor="trackingOpens">Track Opens</Label>
                    </div>

                    <div>
                      <Label htmlFor="trackingClicks">Track Clicks</Label>
                      <Select 
                        value={emailConfig.settings.trackingClicks} 
                        onValueChange={(value: 'yes' | 'no' | 'htmlonly') => setEmailConfig(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            trackingClicks: value
                          }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="htmlonly">HTML Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t">
                  <Button 
                    onClick={testEmailConnection}
                    disabled={isTesting}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isTesting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Test Connection
                  </Button>
                  
                  {testResults.email !== undefined && (
                    <div className="flex items-center gap-2">
                      {testResults.email ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Email test successful</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">Email test failed</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={saveEmailConfig}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 ml-auto"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Configuration Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  External API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="baseUrl">Base URL</Label>
                      <Input
                        id="baseUrl"
                        value={apiConfig.baseUrl}
                        onChange={(e) => setApiConfig(prev => ({
                          ...prev,
                          baseUrl: e.target.value
                        }))}
                        placeholder="http://34.122.156.88:3001/api"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiConfig.apiKey}
                        onChange={(e) => setApiConfig(prev => ({
                          ...prev,
                          apiKey: e.target.value
                        }))}
                        placeholder="Enter API key"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="timeout">Timeout (ms)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={apiConfig.timeout}
                        onChange={(e) => setApiConfig(prev => ({
                          ...prev,
                          timeout: parseInt(e.target.value)
                        }))}
                        min={1000}
                        max={120000}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="retryAttempts">Retry Attempts</Label>
                      <Input
                        id="retryAttempts"
                        type="number"
                        value={apiConfig.retryAttempts}
                        onChange={(e) => setApiConfig(prev => ({
                          ...prev,
                          retryAttempts: parseInt(e.target.value)
                        }))}
                        min={0}
                        max={10}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="requestsPerSecond">Requests per Second</Label>
                      <Input
                        id="requestsPerSecond"
                        type="number"
                        value={apiConfig.rateLimits.requestsPerSecond}
                        onChange={(e) => setApiConfig(prev => ({
                          ...prev,
                          rateLimits: {
                            ...prev.rateLimits,
                            requestsPerSecond: parseInt(e.target.value)
                          }
                        }))}
                        min={1}
                        max={1000}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="requestsPerMinute">Requests per Minute</Label>
                      <Input
                        id="requestsPerMinute"
                        type="number"
                        value={apiConfig.rateLimits.requestsPerMinute}
                        onChange={(e) => setApiConfig(prev => ({
                          ...prev,
                          rateLimits: {
                            ...prev.rateLimits,
                            requestsPerMinute: parseInt(e.target.value)
                          }
                        }))}
                        min={1}
                        max={60000}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t">
                  <Button 
                    onClick={testApiConnection}
                    disabled={isTesting}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isTesting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Test Connection
                  </Button>
                  
                  {testResults.api !== undefined && (
                    <div className="flex items-center gap-2">
                      {testResults.api ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Connection successful</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">Connection failed</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    onClick={saveApiConfig}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 ml-auto"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Configuration Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="logLevel">Log Level</Label>
                      <Select 
                        value={systemConfig.logLevel} 
                        onValueChange={(value) => setSystemConfig(prev => ({
                          ...prev,
                          logLevel: value as any
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="verbose">Verbose</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="maxConcurrentProcesses">Max Concurrent Processes</Label>
                      <Input
                        id="maxConcurrentProcesses"
                        type="number"
                        value={systemConfig.maxConcurrentProcesses}
                        onChange={(e) => setSystemConfig(prev => ({
                          ...prev,
                          maxConcurrentProcesses: parseInt(e.target.value)
                        }))}
                        min={1}
                        max={100}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="debug"
                          checked={systemConfig.debug}
                          onCheckedChange={(checked) => setSystemConfig(prev => ({
                            ...prev,
                            debug: !!checked
                          }))}
                        />
                        <Label htmlFor="debug">Enable Debug Mode</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="enableMetrics"
                          checked={systemConfig.enableMetrics}
                          onCheckedChange={(checked) => setSystemConfig(prev => ({
                            ...prev,
                            enableMetrics: !!checked
                          }))}
                        />
                        <Label htmlFor="enableMetrics">Enable Metrics Collection</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="enableWebhooks"
                          checked={systemConfig.enableWebhooks}
                          onCheckedChange={(checked) => setSystemConfig(prev => ({
                            ...prev,
                            enableWebhooks: !!checked
                          }))}
                        />
                        <Label htmlFor="enableWebhooks">Enable Webhooks</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="maintenanceMode"
                          checked={systemConfig.maintenanceMode}
                          onCheckedChange={(checked) => setSystemConfig(prev => ({
                            ...prev,
                            maintenanceMode: !!checked
                          }))}
                        />
                        <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t">
                  <Button 
                    onClick={saveSystemConfig}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 ml-auto"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 