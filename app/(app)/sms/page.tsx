'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageSquare, Trash2, Plus, Play, Pause, Upload, Clock, Edit, Phone, Settings, Send, Users, History, MessageCircle } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
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
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';
import { SmsCampaign, CreateSmsCampaignData, TwilioNumber } from '@/app/types/sms';

export default function SmsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('campaigns');
  
  // Campaign state
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCampaign, setNewCampaign] = useState<CreateSmsCampaignData>({
    name: '',
    messageTemplate: '',
    rateLimit: 60,
  });

  // Twilio numbers state
  const [showTwilioForm, setShowTwilioForm] = useState(false);
  const [isAddingTwilio, setIsAddingTwilio] = useState(false);
  const [twilioNumbers, setTwilioNumbers] = useState<TwilioNumber[]>([]);
  const [selectedTwilioNumbers, setSelectedTwilioNumbers] = useState<number[]>([]);
  const [newTwilioNumber, setNewTwilioNumber] = useState({
    phoneNumber: '',
    accountSid: '',
    authToken: '',
  });

  // SMS messaging state
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState({
    to: '',
    body: '',
    templateId: '',
    from: '',
  });
  const [isSending, setIsSending] = useState(false);

  // Configuration state
  const [twilioConfig, setTwilioConfig] = useState({
    accountSid: '',
    authToken: '',
    defaultFromNumber: '',
    settings: {},
    rateLimits: {},
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchCampaigns();
    fetchTwilioNumbers();
    fetchConversations();
    fetchTemplates();
    fetchTwilioConfig();
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

  const fetchTwilioConfig = async () => {
    try {
      const response = await api.sms.getConfig();
      setTwilioConfig(response.data || {
        accountSid: '',
        authToken: '',
        defaultFromNumber: '',
        settings: {},
        rateLimits: {},
      });
    } catch (error) {
      console.error('Error fetching Twilio config:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.to || (!newMessage.body && !newMessage.templateId)) {
      toast.error('Please fill in recipient and message or select a template');
      return;
    }
    
    setIsSending(true);
    try {
      if (newMessage.templateId) {
        await api.sms.sendTemplate({
          to: newMessage.to,
          templateId: parseInt(newMessage.templateId),
          variables: {},
          from: newMessage.from || undefined,
        });
      } else {
        await api.sms.send({
          to: newMessage.to,
          body: newMessage.body,
          from: newMessage.from || undefined,
        });
      }
      
      toast.success('Message sent successfully');
      setNewMessage({ to: '', body: '', templateId: '', from: '' });
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTestTwilioConnection = async () => {
    setIsTestingConnection(true);
    try {
      await api.sms.testConnection();
      toast.success('Twilio connection test successful');
    } catch (error) {
      console.error('Error testing Twilio connection:', error);
      toast.error('Twilio connection test failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveTwilioConfig = async () => {
    setIsSavingConfig(true);
    try {
      await api.sms.saveConfig(twilioConfig);
      toast.success('Twilio configuration saved successfully');
    } catch (error) {
      console.error('Error saving Twilio config:', error);
      toast.error('Failed to save Twilio configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSyncTwilioNumbers = async () => {
    try {
      await api.sms.syncNumbers();
      toast.success('Twilio numbers synced successfully');
      fetchTwilioNumbers();
    } catch (error) {
      console.error('Error syncing Twilio numbers:', error);
      toast.error('Failed to sync Twilio numbers');
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
        const result = await bulkDeleteTwilioNumbers(selectedTwilioNumbers);
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
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-7 h-7 mr-2 text-blue-600" />
              SMS Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Send messages, manage campaigns, and configure SMS settings
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="messaging" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Send Message
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="numbers" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Numbers
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Send Message Tab */}
          <TabsContent value="messaging">
            <Card>
              <CardHeader>
                <CardTitle>Send SMS Message</CardTitle>
                <CardDescription>
                  Send individual SMS messages or use templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        To (Phone Number)
                      </label>
                      <Input
                        value={newMessage.to}
                        onChange={(e) => setNewMessage(prev => ({ ...prev, to: e.target.value }))}
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
                        onValueChange={(value) => setNewMessage(prev => ({ ...prev, from: value === 'default' ? '' : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Use default number" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Use default number</SelectItem>
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
                      Template (Optional)
                    </label>
                    <Select
                      value={newMessage.templateId || 'none'}
                      onValueChange={(value) => setNewMessage(prev => ({ ...prev, templateId: value === 'none' ? '' : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template or write custom message" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No template</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <Textarea
                      value={newMessage.body}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Type your message here..."
                      rows={4}
                      disabled={!!newMessage.templateId}
                    />
                    {newMessage.templateId && (
                      <p className="text-sm text-gray-500 mt-1">
                        Template selected. Message will be generated from template.
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={isSending} className="w-full">
                    {isSending ? 'Sending...' : 'Send Message'}
                  </Button>
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

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">SMS Campaigns</h2>
                <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </div>

              {showCreateForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Campaign</CardTitle>
                    <CardDescription>
                      Set up a new SMS campaign with custom messaging
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateCampaign} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Campaign Name
                        </label>
                        <Input
                          value={newCampaign.name}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter campaign name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Message Template
                        </label>
                        <Textarea
                          value={newCampaign.messageTemplate}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, messageTemplate: e.target.value }))}
                          placeholder="Enter your message template..."
                          rows={4}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rate Limit (messages per minute)
                        </label>
                        <Input
                          type="number"
                          value={newCampaign.rateLimit}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, rateLimit: parseInt(e.target.value) }))}
                          min="1"
                          max="1000"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={isCreating}>
                          {isCreating ? 'Creating...' : 'Create Campaign'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Campaign
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rate Limit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {campaigns.map((campaign) => (
                          <tr key={campaign.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                                <div className="text-sm text-gray-500">
                                  Created {formatDate(campaign.createdAt)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={
                                campaign.status === 'active' ? 'default' :
                                campaign.status === 'completed' ? 'secondary' :
                                campaign.status === 'paused' ? 'outline' : 'destructive'
                              }>
                                {campaign.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {campaign.sentCount} / {campaign.totalContacts}
                              {campaign.failedCount > 0 && (
                                <span className="text-red-600 ml-2">
                                  ({campaign.failedCount} failed)
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {campaign.rateLimit}/min
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              {campaign.status === 'draft' || campaign.status === 'paused' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleStartCampaign(campaign.id)}
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Start
                                </Button>
                              ) : campaign.status === 'active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePauseCampaign(campaign.id)}
                                >
                                  <Pause className="w-4 h-4 mr-1" />
                                  Pause
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewCampaign(campaign.id)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {campaigns.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                              No campaigns found. Create your first campaign to get started.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Phone Numbers Tab */}
          <TabsContent value="numbers">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Twilio Phone Numbers</h2>
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleSyncTwilioNumbers}>
                    Sync Numbers
                  </Button>
                  <Button onClick={() => setShowTwilioForm(!showTwilioForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Number
                  </Button>
                </div>
              </div>

              {showTwilioForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add Twilio Number</CardTitle>
                    <CardDescription>
                      Add a new Twilio phone number for SMS campaigns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddTwilioNumber} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <Input
                          value={newTwilioNumber.phoneNumber}
                          onChange={(e) => setNewTwilioNumber(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          placeholder="+1234567890"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account SID
                        </label>
                        <Input
                          value={newTwilioNumber.accountSid}
                          onChange={(e) => setNewTwilioNumber(prev => ({ ...prev, accountSid: e.target.value }))}
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auth Token
                        </label>
                        <Input
                          type="password"
                          value={newTwilioNumber.authToken}
                          onChange={(e) => setNewTwilioNumber(prev => ({ ...prev, authToken: e.target.value }))}
                          placeholder="Your Twilio Auth Token"
                          required
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={isAddingTwilio}>
                          {isAddingTwilio ? 'Adding...' : 'Add Number'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowTwilioForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {twilioNumbers.map((number) => (
                          <tr key={number.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{number.phoneNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={number.status === 'available' ? 'default' : 'secondary'}>
                                {number.status === 'available' ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {number.messagesCount || 0} messages sent
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteSingleTwilioNumber(number.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {twilioNumbers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                              No phone numbers found. Add your first Twilio number to get started.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Twilio Configuration</CardTitle>
                <CardDescription>
                  Configure your Twilio account settings for SMS functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account SID
                  </label>
                  <Input
                    value={twilioConfig.accountSid}
                    onChange={(e) => setTwilioConfig(prev => ({ ...prev, accountSid: e.target.value }))}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auth Token
                  </label>
                  <Input
                    type="password"
                    value={twilioConfig.authToken}
                    onChange={(e) => setTwilioConfig(prev => ({ ...prev, authToken: e.target.value }))}
                    placeholder="Your Twilio Auth Token"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default From Number
                  </label>
                  <Input
                    value={twilioConfig.defaultFromNumber}
                    onChange={(e) => setTwilioConfig(prev => ({ ...prev, defaultFromNumber: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleSaveTwilioConfig} disabled={isSavingConfig}>
                    {isSavingConfig ? 'Saving...' : 'Save Configuration'}
                  </Button>
                  <Button variant="outline" onClick={handleTestTwilioConnection} disabled={isTestingConnection}>
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
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