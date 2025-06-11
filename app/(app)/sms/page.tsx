'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageSquare, Phone, Settings, Send, Users, History, MessageCircle, Zap } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Separator } from '@/app/components/ui/separator';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';
import { SmsMessagingService, SmsProviderService } from '@/app/lib/sms-campaigns';
import { 
  SmsProvidersResponse, 
  SendSmsRequest, 
  TwilioNumber 
} from '@/app/types/sms';

export default function SmsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('messaging');
  
  // Provider state
  const [providers, setProviders] = useState<SmsProvidersResponse | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Twilio numbers state
  const [twilioNumbers, setTwilioNumbers] = useState<TwilioNumber[]>([]);

  // SMS messaging state
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState<SendSmsRequest>({
    to: '',
    body: '',
    from: '',
    provider: undefined,
    metadata: undefined,
  });
  const [isSending, setIsSending] = useState(false);
  const [isTestingProvider, setIsTestingProvider] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadProviders();
    fetchTwilioNumbers();
    fetchConversations();
    fetchTemplates();
  }, [isAuthenticated, router]);

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      const providerData = await SmsProviderService.getProviders();
      setProviders(providerData);
    } catch (error) {
      console.error('Error loading providers:', error);
      toast.error('Failed to load SMS providers');
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchTwilioNumbers = async () => {
    try {
      const response = await api.sms.listNumbers();
      setTwilioNumbers(response.data?.numbers || []);
    } catch (error) {
      console.error('Error fetching Twilio numbers:', error);
      toast.error('Failed to load Twilio numbers');
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await api.sms.listConversations({ limit: 50 });
      setConversations(response.data?.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.templates.list({ type: 'sms', isActive: true, limit: 100 });
      setTemplates(response.data?.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load SMS templates');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.to || !newMessage.body) {
      toast.error('Please fill in recipient and message');
      return;
    }
    
    setIsSending(true);
    try {
      await SmsMessagingService.sendSms(newMessage);
      toast.success('Message sent successfully');
      setNewMessage({ 
        to: '', 
        body: '', 
        from: '', 
        provider: undefined,
        metadata: undefined 
      });
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTestProvider = async (provider: 'twilio' | 'meera') => {
    try {
      setIsTestingProvider(provider);
      
      if (provider === 'twilio') {
        const result = await SmsProviderService.testTwilioConnection();
        if (result.success) {
          toast.success(`Twilio connection successful! Found ${result.numberCount} phone numbers.`);
        } else {
          toast.error(`Twilio test failed: ${result.message}`);
        }
      } else if (provider === 'meera') {
        const result = await SmsProviderService.testMeeraConnection();
        if (result.success) {
          toast.success(`Meera connection successful! Balance: ${result.balance} ${result.currency}`);
        } else {
          toast.error(`Meera test failed: ${result.message}`);
        }
      }
    } catch (error) {
      console.error(`Error testing ${provider}:`, error);
      toast.error(`Failed to test ${provider} connection`);
    } finally {
      setIsTestingProvider(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-7 h-7 mr-2 text-blue-600" />
              SMS Messaging
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Send messages, manage conversations, and configure SMS providers
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="messaging" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Send Message
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="numbers" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Numbers
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Provider Status
            </TabsTrigger>
          </TabsList>

          {/* Send Message Tab */}
          <TabsContent value="messaging">
            <Card>
              <CardHeader>
                <CardTitle>Send SMS Message</CardTitle>
                <CardDescription>
                  Send a single SMS message using your configured providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Provider Status Alert */}
                {providers && (
                  <Alert className="mb-4">
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Default Provider:</span>
                        <Badge variant="outline">{providers.defaultProvider}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant={providers.providers.twilio.configured ? "default" : "secondary"}
                          className={providers.providers.twilio.configured ? "bg-green-100 text-green-700" : ""}
                        >
                          Twilio: {providers.providers.twilio.configured ? 'Ready' : 'Not configured'}
                        </Badge>
                        <Badge 
                          variant={providers.providers.meera.configured ? "default" : "secondary"}
                          className={providers.providers.meera.configured ? "bg-green-100 text-green-700" : ""}
                        >
                          Meera: {providers.providers.meera.configured ? 'Ready' : 'Not configured'}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recipient Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={newMessage.to}
                        onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                        placeholder="+1234567890"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Number (Optional)
                      </label>
                      <Select
                        value={newMessage.from || 'default'}
                        onValueChange={(value) => setNewMessage({ ...newMessage, from: value === 'default' ? undefined : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Use default number" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Use Default</SelectItem>
                          {twilioNumbers.map((number) => (
                            <SelectItem key={number.id} value={number.phoneNumber}>
                              {number.phoneNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider (Optional)
                    </label>
                    <Select
                      value={newMessage.provider || 'default'}
                      onValueChange={(value) => setNewMessage({ 
                        ...newMessage, 
                        provider: value === 'default' ? undefined : value as 'twilio' | 'meera'
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Use default provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Use Default</SelectItem>
                        {providers?.providers.twilio.configured && (
                          <SelectItem value="twilio">Twilio</SelectItem>
                        )}
                        {providers?.providers.meera.configured && (
                          <SelectItem value="meera">Meera</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <Textarea
                      value={newMessage.body}
                      onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
                      placeholder="Enter your SMS message..."
                      rows={4}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Character count: {newMessage.body.length} | SMS segments: {Math.ceil(newMessage.body.length / 160)}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/sms/templates')}
                    >
                      Use Template
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSending || !newMessage.to || !newMessage.body}
                    >
                      {isSending ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations">
            <Card>
              <CardHeader>
                <CardTitle>SMS Conversations</CardTitle>
                <CardDescription>
                  View and manage SMS conversations with leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                {conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start by sending your first SMS message.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {conversation.leadName || conversation.phone}
                            </h4>
                            <p className="text-sm text-gray-500">{conversation.phone}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {conversation.lastMessage}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
                              {conversation.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(conversation.lastMessageAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Phone Numbers Tab */}
          <TabsContent value="numbers">
            <Card>
              <CardHeader>
                <CardTitle>Phone Numbers</CardTitle>
                <CardDescription>
                  Manage your SMS-enabled phone numbers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {twilioNumbers.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No phone numbers</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Configure your SMS providers to see available numbers.
                    </p>
                    <Button 
                      onClick={() => router.push('/settings/sms-providers')} 
                      className="mt-4"
                    >
                      Configure Providers
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {twilioNumbers.map((number) => (
                      <div key={number.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-gray-900">{number.phoneNumber}</h4>
                            <p className="text-sm text-gray-500">
                              {number.capabilities?.join(', ') || 'SMS enabled'}
                            </p>
                          </div>
                          <Badge variant={number.isActive ? 'default' : 'secondary'}>
                            {number.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Provider Status Tab */}
          <TabsContent value="providers">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SMS Provider Status</CardTitle>
                  <CardDescription>
                    Monitor your SMS provider configurations and test connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingProviders ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading provider status...</p>
                    </div>
                  ) : providers ? (
                    <div className="space-y-4">
                      {/* Twilio Status */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${providers.providers.twilio.configured ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <div>
                              <h3 className="font-medium">Twilio</h3>
                              <p className="text-sm text-gray-500">
                                {providers.providers.twilio.configured ? 'Configured and ready' : 'Not configured'}
                              </p>
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
                                onClick={() => handleTestProvider('twilio')}
                                disabled={isTestingProvider === 'twilio'}
                              >
                                {isTestingProvider === 'twilio' ? 'Testing...' : 'Test'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Meera Status */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${providers.providers.meera.configured ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <div>
                              <h3 className="font-medium">Meera</h3>
                              <p className="text-sm text-gray-500">
                                {providers.providers.meera.configured ? 'Configured and ready' : 'Not configured'}
                              </p>
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
                                onClick={() => handleTestProvider('meera')}
                                disabled={isTestingProvider === 'meera'}
                              >
                                {isTestingProvider === 'meera' ? 'Testing...' : 'Test'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-center">
                        <Button onClick={() => router.push('/settings/sms-providers')}>
                          <Settings className="w-4 h-4 mr-2" />
                          Configure Providers
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Settings className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Unable to load providers</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Please check your SMS provider configuration.
                      </p>
                      <Button onClick={loadProviders} className="mt-4">
                        Retry
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 