'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Switch } from '@/app/components/ui/switch';
import { Separator } from '@/app/components/ui/separator';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { useAuthStore } from '@/app/store/authStore';
import { SmsProviderService } from '@/app/lib/sms-campaigns';
import { 
  SmsProvidersResponse, 
  TwilioConfig, 
  MeeraConfig,
  TwilioTestResponse,
  MeeraTestResponse,
  MeeraBalanceResponse
} from '@/types/sms';
import toast from 'react-hot-toast';
import { 
  MessageSquare, 
  Settings, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  DollarSign,
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react';

export default function SmsProvidersPage() {
  const { isAuthenticated } = useAuthStore();
  const [providers, setProviders] = useState<SmsProvidersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  
  // Twilio form state
  const [twilioConfig, setTwilioConfig] = useState<Partial<TwilioConfig>>({
    accountSid: '',
    authToken: '',
    defaultFromNumber: '',
    settings: {
      statusCallbackUrl: '',
      enableDeliveryReports: true
    },
    rateLimits: {
      messagesPerMinute: 60,
      messagesPerHour: 1000,
      messagesPerDay: 10000
    }
  });

  // Meera form state
  const [meeraConfig, setMeeraConfig] = useState<Partial<MeeraConfig>>({
    apiKey: '',
    apiSecret: '',
    baseUrl: 'https://api.meera.ai/v1',
    defaultFromNumber: '',
    settings: {
      messageType: 'promotional',
      enableUnicode: true,
      maxSegments: 4
    },
    rateLimits: {
      messagesPerSecond: 10,
      messagesPerMinute: 300,
      messagesPerHour: 5000,
      messagesPerDay: 50000
    }
  });

  const [meeraBalance, setMeeraBalance] = useState<MeeraBalanceResponse | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadProviders();
    }
  }, [isAuthenticated]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await SmsProviderService.getProviders();
      setProviders(response);

      // Load existing configurations
      if (response.providers.twilio.configured) {
        try {
          const twilioData = await SmsProviderService.getTwilioConfig();
          setTwilioConfig(twilioData);
        } catch (error) {
          console.error('Error loading Twilio config:', error);
        }
      }

      if (response.providers.meera.configured) {
        try {
          const meeraData = await SmsProviderService.getMeeraConfig();
          setMeeraConfig(meeraData);
          // Load balance if configured
          loadMeeraBalance();
        } catch (error) {
          console.error('Error loading Meera config:', error);
        }
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      toast.error('Failed to load SMS provider settings');
    } finally {
      setLoading(false);
    }
  };

  const loadMeeraBalance = async () => {
    try {
      const balance = await SmsProviderService.checkMeeraBalance();
      setMeeraBalance(balance);
    } catch (error) {
      console.error('Error loading Meera balance:', error);
    }
  };

  const handleSetDefaultProvider = async (provider: 'twilio' | 'meera') => {
    try {
      setSaving(true);
      await SmsProviderService.setDefaultProvider(provider);
      toast.success(`Default provider set to ${provider}`);
      loadProviders();
    } catch (error) {
      console.error('Error setting default provider:', error);
      toast.error('Failed to set default provider');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTwilioConfig = async () => {
    try {
      setSaving(true);
      await SmsProviderService.saveTwilioConfig(twilioConfig as any);
      toast.success('Twilio configuration saved');
      loadProviders();
    } catch (error) {
      console.error('Error saving Twilio config:', error);
      toast.error('Failed to save Twilio configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMeeraConfig = async () => {
    try {
      setSaving(true);
      await SmsProviderService.saveMeeraConfig(meeraConfig as any);
      toast.success('Meera configuration saved');
      loadProviders();
      loadMeeraBalance();
    } catch (error) {
      console.error('Error saving Meera config:', error);
      toast.error('Failed to save Meera configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestProvider = async (provider: 'twilio' | 'meera') => {
    try {
      setTesting(provider);
      
      if (provider === 'twilio') {
        const result: TwilioTestResponse = await SmsProviderService.testTwilioConnection();
        if (result.success) {
          toast.success(`Twilio connection successful! Found ${result.numberCount} phone numbers.`);
        } else {
          toast.error(`Twilio test failed: ${result.message}`);
        }
      } else if (provider === 'meera') {
        const result: MeeraTestResponse = await SmsProviderService.testMeeraConnection();
        if (result.success) {
          toast.success(`Meera connection successful! Balance: ${result.balance} ${result.currency}`);
          loadMeeraBalance();
        } else {
          toast.error(`Meera test failed: ${result.message}`);
        }
      }
    } catch (error) {
      console.error(`Error testing ${provider}:`, error);
      toast.error(`Failed to test ${provider} connection`);
    } finally {
      setTesting(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-gray-500">Please log in to access SMS provider settings.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              SMS Provider Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Configure your SMS providers for sending messages through journeys and campaigns
            </p>
          </div>
          <Button onClick={loadProviders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-2">Loading SMS provider settings...</p>
          </div>
        ) : (
          <>
            {/* Provider Status Overview */}
            {providers && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Provider Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${providers.providers.twilio.configured ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <div className="font-medium">Twilio</div>
                          <div className="text-sm text-gray-500">
                            {providers.providers.twilio.configured ? 'Configured' : 'Not configured'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {providers.defaultProvider === 'twilio' && (
                          <Badge variant="default">Default</Badge>
                        )}
                        {providers.providers.twilio.configured && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetDefaultProvider('twilio')}
                            disabled={saving || providers.defaultProvider === 'twilio'}
                          >
                            Set Default
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${providers.providers.meera.configured ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <div className="font-medium">Meera</div>
                          <div className="text-sm text-gray-500">
                            {providers.providers.meera.configured ? 'Configured' : 'Not configured'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {providers.defaultProvider === 'meera' && (
                          <Badge variant="default">Default</Badge>
                        )}
                        {providers.providers.meera.configured && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetDefaultProvider('meera')}
                            disabled={saving || providers.defaultProvider === 'meera'}
                          >
                            Set Default
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {meeraBalance && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">
                          Meera Balance: {meeraBalance.balance} {meeraBalance.currency}
                        </span>
                        <span className="text-sm text-blue-600">
                          (Last checked: {new Date(meeraBalance.lastChecked).toLocaleString()})
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Configuration Tabs */}
            <Tabs defaultValue="twilio" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="twilio">
                  Twilio Configuration
                </TabsTrigger>
                <TabsTrigger value="meera">
                  Meera Configuration
                </TabsTrigger>
              </TabsList>

              {/* Twilio Configuration */}
              <TabsContent value="twilio">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Twilio Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="twilio-account-sid">Account SID</Label>
                        <Input
                          id="twilio-account-sid"
                          value={twilioConfig.accountSid || ''}
                          onChange={(e) => setTwilioConfig({
                            ...twilioConfig,
                            accountSid: e.target.value
                          })}
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        />
                      </div>
                      <div>
                        <Label htmlFor="twilio-auth-token">Auth Token</Label>
                        <Input
                          id="twilio-auth-token"
                          type="password"
                          value={twilioConfig.authToken || ''}
                          onChange={(e) => setTwilioConfig({
                            ...twilioConfig,
                            authToken: e.target.value
                          })}
                          placeholder="Your Twilio auth token"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="twilio-from-number">Default From Number</Label>
                      <Input
                        id="twilio-from-number"
                        value={twilioConfig.defaultFromNumber || ''}
                        onChange={(e) => setTwilioConfig({
                          ...twilioConfig,
                          defaultFromNumber: e.target.value
                        })}
                        placeholder="+1234567890"
                      />
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-base font-semibold">Advanced Settings</Label>
                      <div className="mt-2 space-y-4">
                        <div>
                          <Label htmlFor="twilio-webhook-url">Status Callback URL</Label>
                          <Input
                            id="twilio-webhook-url"
                            value={twilioConfig.settings?.statusCallbackUrl || ''}
                            onChange={(e) => setTwilioConfig({
                              ...twilioConfig,
                              settings: {
                                ...twilioConfig.settings,
                                statusCallbackUrl: e.target.value
                              }
                            })}
                            placeholder="https://yourapp.com/webhooks/twilio/status"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={twilioConfig.settings?.enableDeliveryReports ?? true}
                            onCheckedChange={(checked) => setTwilioConfig({
                              ...twilioConfig,
                              settings: {
                                ...twilioConfig.settings,
                                enableDeliveryReports: checked
                              }
                            })}
                          />
                          <Label>Enable delivery reports</Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-base font-semibold">Rate Limits</Label>
                      <div className="mt-2 grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="twilio-rate-minute">Messages/Minute</Label>
                          <Input
                            id="twilio-rate-minute"
                            type="number"
                            value={twilioConfig.rateLimits?.messagesPerMinute || 60}
                            onChange={(e) => setTwilioConfig({
                              ...twilioConfig,
                              rateLimits: {
                                ...twilioConfig.rateLimits,
                                messagesPerMinute: parseInt(e.target.value) || 60
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="twilio-rate-hour">Messages/Hour</Label>
                          <Input
                            id="twilio-rate-hour"
                            type="number"
                            value={twilioConfig.rateLimits?.messagesPerHour || 1000}
                            onChange={(e) => setTwilioConfig({
                              ...twilioConfig,
                              rateLimits: {
                                ...twilioConfig.rateLimits,
                                messagesPerHour: parseInt(e.target.value) || 1000
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="twilio-rate-day">Messages/Day</Label>
                          <Input
                            id="twilio-rate-day"
                            type="number"
                            value={twilioConfig.rateLimits?.messagesPerDay || 10000}
                            onChange={(e) => setTwilioConfig({
                              ...twilioConfig,
                              rateLimits: {
                                ...twilioConfig.rateLimits,
                                messagesPerDay: parseInt(e.target.value) || 10000
                              }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <Button
                        onClick={handleSaveTwilioConfig}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Configuration'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleTestProvider('twilio')}
                        disabled={testing === 'twilio' || !twilioConfig.accountSid || !twilioConfig.authToken}
                      >
                        {testing === 'twilio' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Test Connection
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Meera Configuration */}
              <TabsContent value="meera">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Meera Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="meera-api-key">API Key</Label>
                        <Input
                          id="meera-api-key"
                          type="password"
                          value={meeraConfig.apiKey || ''}
                          onChange={(e) => setMeeraConfig({
                            ...meeraConfig,
                            apiKey: e.target.value
                          })}
                          placeholder="Your Meera API key"
                        />
                      </div>
                      <div>
                        <Label htmlFor="meera-api-secret">API Secret</Label>
                        <Input
                          id="meera-api-secret"
                          type="password"
                          value={meeraConfig.apiSecret || ''}
                          onChange={(e) => setMeeraConfig({
                            ...meeraConfig,
                            apiSecret: e.target.value
                          })}
                          placeholder="Your Meera API secret"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="meera-base-url">Base URL</Label>
                        <Input
                          id="meera-base-url"
                          value={meeraConfig.baseUrl || ''}
                          onChange={(e) => setMeeraConfig({
                            ...meeraConfig,
                            baseUrl: e.target.value
                          })}
                          placeholder="https://api.meera.ai/v1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="meera-from-number">Default From Number</Label>
                        <Input
                          id="meera-from-number"
                          value={meeraConfig.defaultFromNumber || ''}
                          onChange={(e) => setMeeraConfig({
                            ...meeraConfig,
                            defaultFromNumber: e.target.value
                          })}
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-base font-semibold">Message Settings</Label>
                      <div className="mt-2 space-y-4">
                        <div>
                          <Label htmlFor="meera-message-type">Message Type</Label>
                          <Select
                            value={meeraConfig.settings?.messageType || 'promotional'}
                            onValueChange={(value) => setMeeraConfig({
                              ...meeraConfig,
                              settings: {
                                ...meeraConfig.settings,
                                messageType: value
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="promotional">Promotional</SelectItem>
                              <SelectItem value="transactional">Transactional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={meeraConfig.settings?.enableUnicode ?? true}
                              onCheckedChange={(checked) => setMeeraConfig({
                                ...meeraConfig,
                                settings: {
                                  ...meeraConfig.settings,
                                  enableUnicode: checked
                                }
                              })}
                            />
                            <Label>Enable Unicode</Label>
                          </div>
                          <div>
                            <Label htmlFor="meera-max-segments">Max Segments</Label>
                            <Input
                              id="meera-max-segments"
                              type="number"
                              value={meeraConfig.settings?.maxSegments || 4}
                              onChange={(e) => setMeeraConfig({
                                ...meeraConfig,
                                settings: {
                                  ...meeraConfig.settings,
                                  maxSegments: parseInt(e.target.value) || 4
                                }
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-base font-semibold">Rate Limits</Label>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="meera-rate-second">Messages/Second</Label>
                          <Input
                            id="meera-rate-second"
                            type="number"
                            value={meeraConfig.rateLimits?.messagesPerSecond || 10}
                            onChange={(e) => setMeeraConfig({
                              ...meeraConfig,
                              rateLimits: {
                                ...meeraConfig.rateLimits,
                                messagesPerSecond: parseInt(e.target.value) || 10
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="meera-rate-minute">Messages/Minute</Label>
                          <Input
                            id="meera-rate-minute"
                            type="number"
                            value={meeraConfig.rateLimits?.messagesPerMinute || 300}
                            onChange={(e) => setMeeraConfig({
                              ...meeraConfig,
                              rateLimits: {
                                ...meeraConfig.rateLimits,
                                messagesPerMinute: parseInt(e.target.value) || 300
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="meera-rate-hour">Messages/Hour</Label>
                          <Input
                            id="meera-rate-hour"
                            type="number"
                            value={meeraConfig.rateLimits?.messagesPerHour || 5000}
                            onChange={(e) => setMeeraConfig({
                              ...meeraConfig,
                              rateLimits: {
                                ...meeraConfig.rateLimits,
                                messagesPerHour: parseInt(e.target.value) || 5000
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="meera-rate-day">Messages/Day</Label>
                          <Input
                            id="meera-rate-day"
                            type="number"
                            value={meeraConfig.rateLimits?.messagesPerDay || 50000}
                            onChange={(e) => setMeeraConfig({
                              ...meeraConfig,
                              rateLimits: {
                                ...meeraConfig.rateLimits,
                                messagesPerDay: parseInt(e.target.value) || 50000
                              }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <Button
                        onClick={handleSaveMeeraConfig}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Configuration'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleTestProvider('meera')}
                        disabled={testing === 'meera' || !meeraConfig.apiKey || !meeraConfig.apiSecret}
                      >
                        {testing === 'meera' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Test Connection
                          </>
                        )}
                      </Button>
                      {meeraConfig.apiKey && meeraConfig.apiSecret && (
                        <Button
                          variant="outline"
                          onClick={loadMeeraBalance}
                          disabled={loading}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Check Balance
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 