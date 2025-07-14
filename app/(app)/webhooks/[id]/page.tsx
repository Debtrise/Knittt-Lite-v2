'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { getWebhookDetails, getWebhookEvents, testWebhook, regenerateWebhookKey, regenerateWebhookToken } from '@/app/utils/api';
import api from '@/app/lib/api';
import { WebhookEndpoint, WebhookEvent } from '@/app/types/webhook';
import { toast } from 'react-hot-toast';
import { RefreshCwIcon, PencilIcon, ClipboardCopy, PlayIcon, KeyIcon, ShieldIcon } from 'lucide-react';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { useToast } from '@/app/components/ui/use-toast';

// Helper function to safely get field mapping value
const getFieldMappingValue = (field: any, defaultValue: string): string => {
  if (typeof field === 'string') {
    return field;
  }
  if (typeof field === 'object' && field !== null && 'sourceField' in field) {
    return (field as { sourceField: string }).sourceField;
  }
  return defaultValue;
};

interface Journey {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

interface WebhookData {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string>;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WebhookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const webhookId = parseInt(resolvedParams.id);
  
  const [loading, setLoading] = useState(true);
  const [webhook, setWebhook] = useState<WebhookEndpoint | null>(null);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [enrolledJourney, setEnrolledJourney] = useState<Journey | null>(null);
  const [testPayload, setTestPayload] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [regenerating, setRegenerating] = useState(false);

  const fetchJourneyDetails = async (journeyId: number) => {
    try {
      const response = await api.journeys.get(journeyId.toString());
      setEnrolledJourney(response.data);
    } catch (error) {
      console.error('Error fetching journey details:', error);
      // Don't show error toast for journey fetch failures as it's not critical
      setEnrolledJourney(null);
    }
  };

  const fetchWebhookData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.webhooks.get(webhookId.toString());
      const data = response.data || response;
      setWebhook(data);
      
      // Fetch journey details if webhook has auto-enrollment
      if (data.autoEnrollJourneyId) {
        await fetchJourneyDetails(data.autoEnrollJourneyId);
      }
      
      // If there's a test payload, use it as initial value
      if (data.testPayload) {
        setTestPayload(JSON.stringify(data.testPayload, null, 2));
      } else {
        // Set a default test payload based on the field mapping
        const defaultPayload: Record<string, any> = {};
        const phoneField = getFieldMappingValue(data.fieldMapping.phone, '');
        const nameField = getFieldMappingValue(data.fieldMapping.name, '');
        const emailField = getFieldMappingValue(data.fieldMapping.email, '');
        
        if (phoneField) {
          defaultPayload[phoneField] = "5551234567";
        }
        if (nameField) {
          defaultPayload[nameField] = "John Doe";
        }
        if (emailField) {
          defaultPayload[emailField] = "john@example.com";
        }
        
        setTestPayload(JSON.stringify(defaultPayload, null, 2));
      }
    } catch (error) {
      console.error('Error fetching webhook details:', error);
      toast.error('Failed to load webhook details');
    }
  }, [webhookId]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.webhooks.getEvents(webhookId.toString(), {
        page: 1,
        limit: 20,
      });
      
      const data = response.data || response;
      setEvents(data.events || data || []);
    } catch (error) {
      console.error('Error fetching webhook events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [webhookId]);

  useEffect(() => {
    if (webhookId) {
      fetchWebhookData();
      fetchEvents();
    }

  }, [webhookId, fetchWebhookData, fetchEvents]);

  const handleEdit = () => {
    router.push(`/webhooks/${webhookId}/review`);
  };

  const handleCopyEndpoint = () => {
    if (!webhook) return;
    
    const url = webhook.webhookUrl || `${process.env.NEXT_PUBLIC_API_URL}/api/webhook-receiver/${webhook.endpointKey}`;
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied to clipboard');
  };

  const handleRegenerateKey = async () => {
    if (!confirm('Are you sure? This will invalidate the current endpoint key.')) return;
    
    setRegenerating(true);
    try {
      const response = await api.webhooks.regenerateKey(webhookId.toString());
      const data = response.data || response;
      setWebhook(prev => prev ? { ...prev, endpointKey: data.endpointKey } : null);
      toast.success('Endpoint key regenerated');
    } catch (error) {
      console.error('Error regenerating key:', error);
      toast.error('Failed to regenerate key');
    } finally {
      setRegenerating(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!confirm('Are you sure? This will invalidate the current authentication token.')) return;
    
    setRegenerating(true);
    try {
      const response = await api.webhooks.regenerateToken(webhookId.toString());
      const data = response.data || response;
      setWebhook(prev => prev ? { ...prev, authToken: data.authToken } : null);
      toast.success('Authentication token regenerated');
    } catch (error) {
      console.error('Error regenerating token:', error);
      toast.error('Failed to regenerate token');
    } finally {
      setRegenerating(false);
    }
  };

  const handleTestSubmit = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(testPayload);
      } catch (e) {
        toast.error('Invalid JSON payload');
        return;
      }
      
      const result = await api.webhooks.test(webhookId.toString(), parsedPayload);
      setTestResult(result);
      toast.success('Webhook test completed');
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Failed to test webhook');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {loading ? 'Loading webhook...' : webhook?.name}
            </h1>
            {webhook && (
              <p className="text-gray-500">{webhook.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <PencilIcon className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/webhooks')} 
              className="flex items-center gap-2"
            >
              Back to List
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading webhook details...</div>
        ) : webhook ? (
          <div className="space-y-6">
            <Tabs 
              defaultValue="details" 
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList>
                <TabsTrigger value="details">Configuration</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
                                    {webhook.conditionalRules?.enabled && (
                      <TabsTrigger value="rules">Conditional Rules</TabsTrigger>
                    )}
                    <TabsTrigger value="advanced">Advanced Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Webhook Configuration</CardTitle>
                    <CardDescription>Complete configuration details and settings for this webhook endpoint.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                        <Badge variant={webhook.isActive ? "default" : "secondary"} className="mt-1">
                          {webhook.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Created</h3>
                        <p className="text-gray-900">
                          {new Date(webhook.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Brand</h3>
                        <p className="text-gray-900">{webhook.brand}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Source</h3>
                        <p className="text-gray-900">{webhook.source}</p>
                      </div>
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-500">Webhook URL</h3>
                        <div className="flex items-center mt-1 gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                            {webhook.webhookUrl || `${process.env.NEXT_PUBLIC_API_URL}/api/webhook-receiver/${webhook.endpointKey}`}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleCopyEndpoint}
                          >
                            <ClipboardCopy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRegenerateKey}
                            disabled={regenerating}
                          >
                            <KeyIcon className="h-4 w-4 mr-1" />
                            Regenerate Key
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Field Mapping</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Lead Field
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Source Field
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(webhook.fieldMapping).map(([field, sourceField]) => (
                              <tr key={field}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {field}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  <code className="bg-gray-100 px-1 rounded text-xs">
                                    {getFieldMappingValue(sourceField, '')}
                                  </code>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Validation Rules</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Require Phone: </span>
                            {webhook.validationRules.requirePhone ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Require Name: </span>
                            {webhook.validationRules.requireName ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Require Email: </span>
                            {webhook.validationRules.requireEmail ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Allow Duplicate Phone: </span>
                            {webhook.validationRules.allowDuplicatePhone ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {webhook.autoTagRules && webhook.autoTagRules.length > 0 && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Auto Tag Rules</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Field
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Condition
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Tag
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {webhook.autoTagRules.map((rule, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    <code className="bg-gray-100 px-1 rounded text-xs">
                                      {rule.field}
                                    </code>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {rule.operator === 'equals' && <>equals <strong>"{rule.value}"</strong></>}
                                    {rule.operator === 'contains' && <>contains <strong>"{rule.value}"</strong></>}
                                    {rule.operator === 'exists' && <>exists</>}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    <Badge variant="outline">{rule.tag}</Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {webhook.securityToken && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Security</h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">Security Token: </span>
                            <code className="bg-gray-100 px-1 rounded text-xs">
                              {webhook.securityToken}
                            </code>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRegenerateToken}
                            disabled={regenerating}
                          >
                            <ShieldIcon className="h-4 w-4 mr-1" />
                            Regenerate Token
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {webhook.requiredHeaders && Object.keys(webhook.requiredHeaders).length > 0 && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Required Headers</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Header
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  Value
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {Object.entries(webhook.requiredHeaders).map(([header, value]) => (
                                <tr key={header}>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {header}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    <code className="bg-gray-100 px-1 rounded text-xs">
                                      {value}
                                    </code>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {(webhook.autoEnrollJourneyId || enrolledJourney) && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Auto Enrollment</h3>
                        {enrolledJourney ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{enrolledJourney.name}</p>
                                <p className="text-xs text-gray-500">{enrolledJourney.description}</p>
                              </div>
                              <Badge variant={enrolledJourney.isActive ? 'default' : 'secondary'}>
                                {enrolledJourney.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              Journey ID: {webhook.autoEnrollJourneyId}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm">
                            <span className="font-medium">Auto Enroll Journey ID: </span>
                            {webhook.autoEnrollJourneyId}
                            <span className="text-xs text-red-500 ml-2">(Journey not found)</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Webhook Type Information */}
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Webhook Type</h3>
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="text-sm">
                          {webhook.webhookType.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {webhook.webhookType === 'go' && 'Standard lead processing webhook'}
                          {webhook.webhookType === 'pause' && 'Pause/resume lead processing'}
                          {webhook.webhookType === 'stop' && 'Stop lead processing permanently'}
                          {webhook.webhookType === 'announcement' && 'Generate announcements for displays'}
                        </span>
                      </div>
                    </div>

                    {/* Pause/Resume Configuration */}
                    {webhook.pauseResumeConfig?.enabled && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Pause/Resume Configuration</h3>
                        <div className="space-y-4">
                          {/* Resume Conditions */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase">Resume Conditions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {webhook.pauseResumeConfig.resumeConditions.timerResume?.enabled && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                  <h5 className="font-medium text-sm text-blue-900">Timer Resume</h5>
                                  <p className="text-sm text-blue-700">
                                    Delay: {webhook.pauseResumeConfig.resumeConditions.timerResume.delayDays || 0}d {webhook.pauseResumeConfig.resumeConditions.timerResume.delayHours || 0}h {webhook.pauseResumeConfig.resumeConditions.timerResume.delayMinutes || 0}m
                                  </p>
                                </div>
                              )}
                              {webhook.pauseResumeConfig.resumeConditions.statusResume?.enabled && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded">
                                  <h5 className="font-medium text-sm text-green-900">Status Resume</h5>
                                  <p className="text-sm text-green-700">
                                    Statuses: {webhook.pauseResumeConfig.resumeConditions.statusResume.targetStatuses.join(', ')}
                                  </p>
                                  <p className="text-xs text-green-600">
                                    Check interval: {webhook.pauseResumeConfig.resumeConditions.statusResume.checkInterval}min
                                  </p>
                                </div>
                              )}
                              {webhook.pauseResumeConfig.resumeConditions.tagResume?.enabled && (
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                                  <h5 className="font-medium text-sm text-purple-900">Tag Resume</h5>
                                  <p className="text-sm text-purple-700">
                                    Required: {webhook.pauseResumeConfig.resumeConditions.tagResume.requiredTags.join(', ') || 'None'}
                                  </p>
                                  <p className="text-sm text-purple-700">
                                    Forbidden: {webhook.pauseResumeConfig.resumeConditions.tagResume.forbiddenTags.join(', ') || 'None'}
                                  </p>
                                </div>
                              )}
                              {webhook.pauseResumeConfig.resumeConditions.externalResume?.enabled && (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                                  <h5 className="font-medium text-sm text-orange-900">External Resume</h5>
                                  <p className="text-sm text-orange-700">Enabled via external trigger</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase">Pause Actions</h4>
                              <div className="space-y-2">
                                {webhook.pauseResumeConfig.pauseActions.pauseJourneys && (
                                  <Badge variant="outline">Pause Journeys</Badge>
                                )}
                                {webhook.pauseResumeConfig.pauseActions.addPauseTag && (
                                  <Badge variant="outline">Add Tag: {webhook.pauseResumeConfig.pauseActions.pauseTagName}</Badge>
                                )}
                                {webhook.pauseResumeConfig.pauseActions.sendNotification && (
                                  <Badge variant="outline">Send Notification</Badge>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase">Resume Actions</h4>
                              <div className="space-y-2">
                                {webhook.pauseResumeConfig.resumeActions.resumeJourneys && (
                                  <Badge variant="outline">Resume Journeys</Badge>
                                )}
                                {webhook.pauseResumeConfig.resumeActions.removePauseTag && (
                                  <Badge variant="outline">Remove Pause Tag</Badge>
                                )}
                                {webhook.pauseResumeConfig.resumeActions.addResumeTag && (
                                  <Badge variant="outline">Add Tag: {webhook.pauseResumeConfig.resumeActions.resumeTagName}</Badge>
                                )}
                                {webhook.pauseResumeConfig.resumeActions.sendNotification && (
                                  <Badge variant="outline">Send Notification</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stop Configuration */}
                    {webhook.stopConfig?.enabled && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Stop Configuration</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase">Stop Actions</h4>
                              <div className="space-y-2">
                                {webhook.stopConfig.stopActions.exitJourneys && (
                                  <Badge variant="outline">Exit Journeys</Badge>
                                )}
                                {webhook.stopConfig.stopActions.addStopTag && (
                                  <Badge variant="outline">Add Tag: {webhook.stopConfig.stopActions.stopTagName}</Badge>
                                )}
                                {webhook.stopConfig.stopActions.markAsDNC && (
                                  <Badge variant="destructive">Mark as DNC</Badge>
                                )}
                                {webhook.stopConfig.stopActions.markAsSold && (
                                  <Badge variant="default">Mark as Sold</Badge>
                                )}
                                {webhook.stopConfig.stopActions.preventFutureEnrollment && (
                                  <Badge variant="outline">Prevent Future Enrollment</Badge>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase">Metadata Tracking</h4>
                              <div className="space-y-2">
                                {webhook.stopConfig.stopMetadata.trackStopReason && (
                                  <Badge variant="outline">Track Reason</Badge>
                                )}
                                {webhook.stopConfig.stopMetadata.trackStopSource && (
                                  <Badge variant="outline">Track Source</Badge>
                                )}
                                {webhook.stopConfig.stopMetadata.trackStopTimestamp && (
                                  <Badge variant="outline">Track Timestamp</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Additional Stop Config Details */}
                          {(webhook.stopConfig.stopActions.dncReason || webhook.stopConfig.stopActions.soldReason) && (
                            <div className="p-3 bg-gray-50 rounded">
                              {webhook.stopConfig.stopActions.dncReason && (
                                <p className="text-sm"><span className="font-medium">DNC Reason:</span> {webhook.stopConfig.stopActions.dncReason}</p>
                              )}
                              {webhook.stopConfig.stopActions.soldReason && (
                                <p className="text-sm"><span className="font-medium">Sold Reason:</span> {webhook.stopConfig.stopActions.soldReason}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Announcement Configuration */}
                    {webhook.announcementConfig?.enabled && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Announcement Configuration</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase">Content Creator</h4>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium">Project ID:</span>
                                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                                    {webhook.announcementConfig.contentCreator.templateId || 'Not set'}
                                  </code>
                                </div>
                                {webhook.announcementConfig.contentCreator.projectName && (
                                  <div>
                                    <span className="text-sm font-medium">Project Name:</span>
                                    <span className="ml-2 text-sm">{webhook.announcementConfig.contentCreator.projectName}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">Auto Generate:</span>
                                  <Badge variant={webhook.announcementConfig.contentCreator.autoGenerate ? "default" : "secondary"}>
                                    {webhook.announcementConfig.contentCreator.autoGenerate ? 'Yes' : 'No'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase">Display Settings</h4>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium">Selection Mode:</span>
                                  <Badge variant="outline" className="ml-2">
                                    {webhook.announcementConfig.optisigns.displaySelection.mode}
                                  </Badge>
                                </div>
                                {webhook.announcementConfig.optisigns.displaySelection.displayIds && (
                                  <div>
                                    <span className="text-sm font-medium">Displays:</span>
                                    <Badge variant="outline" className="ml-2">
                                      {webhook.announcementConfig.optisigns.displaySelection.displayIds.length} selected
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Takeover Settings */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase">Takeover Settings</h4>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">
                                Priority: {webhook.announcementConfig.optisigns.takeover.priority}
                              </Badge>
                              <Badge variant="outline">
                                Duration: {webhook.announcementConfig.optisigns.takeover.duration}s
                              </Badge>
                              {webhook.announcementConfig.optisigns.takeover.restoreAfter && (
                                <Badge variant="outline">Restore After</Badge>
                              )}
                              {webhook.announcementConfig.optisigns.takeover.overrideCurrent && (
                                <Badge variant="outline">Override Current</Badge>
                              )}
                            </div>
                          </div>

                          {/* Variable Mapping */}
                          {webhook.announcementConfig.contentCreator.variableMapping && 
                           Object.keys(webhook.announcementConfig.contentCreator.variableMapping).length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase">Variable Mapping</h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Template Variable
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Source Field
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.entries(webhook.announcementConfig.contentCreator.variableMapping).map(([key, value]) => (
                                      <tr key={key}>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
                                          {key}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">
                                          {value}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Scheduling */}
                          {webhook.announcementConfig.optisigns.scheduling && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase">Scheduling</h4>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant={webhook.announcementConfig.optisigns.scheduling.immediate ? "default" : "outline"}>
                                  {webhook.announcementConfig.optisigns.scheduling.immediate ? 'Immediate' : 'Scheduled'}
                                </Badge>
                                {webhook.announcementConfig.optisigns.scheduling.delay && (
                                  <Badge variant="outline">
                                    Delay: {webhook.announcementConfig.optisigns.scheduling.delay}s
                                  </Badge>
                                )}
                                {webhook.announcementConfig.optisigns.scheduling.businessHoursOnly && (
                                  <Badge variant="outline">Business Hours Only</Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Conditions */}
                          {webhook.announcementConfig.conditions?.enabled && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase">Announcement Conditions</h4>
                              <div className="space-y-2">
                                {webhook.announcementConfig.conditions.rules.map((rule, index) => (
                                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                                    <code className="bg-white px-2 py-1 rounded text-xs">
                                      {rule.field}
                                    </code>
                                    <span className="text-xs text-gray-600">{rule.operator}</span>
                                    <code className="bg-white px-2 py-1 rounded text-xs">
                                      {String(rule.value)}
                                    </code>
                                    {rule.required && (
                                      <Badge variant="destructive" className="text-xs">Required</Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                                                 </div>
                       </div>
                     )}

                    {/* Test Payload */}
                    {webhook.testPayload && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Saved Test Payload</h3>
                        <div className="bg-gray-50 rounded p-3 text-xs font-mono max-h-40 overflow-y-auto">
                          <pre>{JSON.stringify(webhook.testPayload, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Timestamps</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium">Created:</span>
                          <p className="text-sm text-gray-900">{new Date(webhook.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Last Updated:</span>
                          <p className="text-sm text-gray-900">{new Date(webhook.updatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="events" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Webhook Events</CardTitle>
                    <CardDescription>Recent events received by this webhook.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {events.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No events recorded for this webhook</p>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab('testing')}
                        >
                          Test Webhook
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {events.map((event) => (
                          <div key={event.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-4">
                                <Badge 
                                  variant={
                                    event.status === 'success' 
                                      ? 'default' 
                                      : event.status === 'partial_success' 
                                      ? 'outline' 
                                      : 'destructive'
                                  }
                                >
                                  {event.status}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {new Date(event.receivedAt).toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {event.processingTime}ms
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                  IP: {event.ipAddress}
                                </span>
                                <span className="text-sm text-gray-500">
                                  Leads: {event.createdLeadIds.length}
                                </span>
                              </div>
                            </div>
                            
                            {/* Payload Preview */}
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Payload</h4>
                              <div className="bg-gray-50 rounded p-3 text-xs font-mono max-h-32 overflow-y-auto">
                                <pre>{JSON.stringify(event.payload, null, 2)}</pre>
                              </div>
                            </div>
                            
                            {/* Error Details for Failed Events */}
                            {event.status === 'failed' && event.errorMessage && (
                              <div className="mb-3">
                                <h4 className="text-sm font-medium text-red-700 mb-2">Error Details</h4>
                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                  <p className="text-sm text-red-800">{event.errorMessage}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Partial Success Details */}
                            {event.status === 'partial_success' && event.errorMessage && (
                              <div className="mb-3">
                                <h4 className="text-sm font-medium text-yellow-700 mb-2">Warnings</h4>
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                  <p className="text-sm text-yellow-800">{event.errorMessage}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Success Details */}
                            {event.status === 'success' && event.createdLeadIds.length > 0 && (
                              <div className="mb-3">
                                <h4 className="text-sm font-medium text-green-700 mb-2">
                                  Successfully Created Leads ({event.createdLeadIds.length})
                                </h4>
                                <div className="bg-green-50 border border-green-200 rounded p-3">
                                  <div className="flex flex-wrap gap-1">
                                    {event.createdLeadIds.map((leadId) => (
                                      <Badge key={leadId} variant="outline" className="text-xs">
                                        Lead #{leadId}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Raw Response Data for Debugging */}
                            <details className="mt-3">
                              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                                View Raw Event Data
                              </summary>
                              <div className="mt-2 bg-gray-50 rounded p-3 text-xs font-mono max-h-40 overflow-y-auto">
                                <pre>{JSON.stringify(event, null, 2)}</pre>
                              </div>
                            </details>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={fetchEvents}
                      className="ml-auto"
                    >
                      <RefreshCwIcon className="h-4 w-4 mr-2" />
                      Refresh Events
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="testing" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Webhook</CardTitle>
                    <CardDescription>
                      Send a test payload to this webhook without creating actual leads.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Test Payload</h3>
                      <Textarea
                        value={testPayload}
                        onChange={(e) => setTestPayload(e.target.value)}
                        className="font-mono text-sm"
                        rows={10}
                      />
                    </div>
                    
                    {testResult && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Test Results</h3>
                        <div className="bg-gray-50 rounded p-4">
                          <div className="flex justify-between mb-2">
                            <span className="font-medium">Status:</span>
                            <Badge variant={testResult.success ? 'default' : 'destructive'}>
                              {testResult.success ? 'Success' : 'Failed'}
                            </Badge>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span className="font-medium">Valid Leads:</span>
                            <span>{testResult.validCount}</span>
                          </div>
                          <div className="flex justify-between mb-4">
                            <span className="font-medium">Errors:</span>
                            <span>{testResult.errorCount}</span>
                          </div>
                          
                          {/* Error Details */}
                          {testResult.errors && testResult.errors.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2 text-red-700">Error Details:</h4>
                              <div className="bg-red-50 border border-red-200 rounded p-3 max-h-40 overflow-y-auto">
                                <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                                  {testResult.errors.map((error: string, index: number) => (
                                    <li key={index}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                          
                          {/* Processed Leads Details */}
                          {testResult.processedLeads && testResult.processedLeads.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2 text-green-700">Successfully Processed Leads:</h4>
                              <div className="bg-green-50 border border-green-200 rounded p-3 max-h-40 overflow-y-auto">
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-green-200">
                                    <thead className="bg-green-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-green-700 uppercase">
                                          Phone
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-green-700 uppercase">
                                          Name
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-green-700 uppercase">
                                          Email
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-green-700 uppercase">
                                          Brand
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-green-700 uppercase">
                                          Source
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-green-200">
                                      {testResult.processedLeads.map((lead: any, index: number) => (
                                        <tr key={index}>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {lead.phone}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {lead.name || '-'}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {lead.email || '-'}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {lead.brand || '-'}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                            {lead.source || '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Field Mapping Validation */}
                          {webhook && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2 text-blue-700">Field Mapping Validation:</h4>
                              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <div className="text-xs space-y-1">
                                  {Object.entries(webhook.fieldMapping).map(([leadField, webhookField]) => {
                                    const fieldValue = getFieldMappingValue(webhookField, '');
                                    let hasValue = false;
                                    try {
                                      const testPayloadData = JSON.parse(testPayload);
                                      hasValue = Boolean(fieldValue && testPayloadData[fieldValue] !== undefined);
                                    } catch (e) {
                                      hasValue = false;
                                    }
                                    return (
                                      <div key={leadField} className="flex justify-between items-center">
                                        <span className="text-blue-800">
                                          {leadField} ← {fieldValue || 'unmapped'}
                                        </span>
                                        <Badge 
                                          variant={hasValue ? 'default' : 'destructive'} 
                                          className="text-xs"
                                        >
                                          {hasValue ? 'Found' : 'Missing'}
                                        </Badge>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Raw Response for Debugging */}
                          <details className="mt-4">
                            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                              View Raw Test Response
                            </summary>
                            <div className="mt-2 bg-white border rounded p-3 text-xs font-mono max-h-40 overflow-y-auto">
                              <pre>{JSON.stringify(testResult, null, 2)}</pre>
                            </div>
                          </details>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleTestSubmit} 
                      disabled={testLoading}
                      className="ml-auto flex items-center gap-2"
                    >
                      {testLoading ? (
                        <>Testing...</>
                      ) : (
                        <>
                          <PlayIcon className="h-4 w-4" />
                          <span>Run Test</span>
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {webhook.conditionalRules?.enabled && (
                <TabsContent value="rules" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Conditional Rules Configuration</CardTitle>
                      <CardDescription>
                        Advanced conditional logic and automated actions for this webhook.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-green-800">Conditional Processing Enabled</span>
                        </div>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Logic: {webhook.conditionalRules.logicOperator}
                        </Badge>
                      </div>

                      {webhook.conditionalRules.conditionSets?.map((conditionSet, index) => (
                        <Card key={index} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{conditionSet.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Conditions */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Conditions</h4>
                              <div className="space-y-2">
                                {conditionSet.conditions?.map((condition, conditionIndex) => (
                                  <div key={conditionIndex} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <code className="bg-white px-2 py-1 rounded text-sm border">
                                      {condition.field}
                                    </code>
                                    <span className="text-sm text-gray-600">
                                      {condition.operator.replace('_', ' ')}
                                    </span>
                                    {!['exists', 'not_exists', 'is_empty', 'is_not_empty'].includes(condition.operator) && (
                                      <>
                                        <code className="bg-white px-2 py-1 rounded text-sm border">
                                          {typeof condition.value === 'string' ? `"${condition.value}"` : String(condition.value)}
                                        </code>
                                      </>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {condition.dataType}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Actions ({conditionSet.actions?.length || 0})</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {conditionSet.actions?.map((action, actionIndex) => (
                                  <div key={actionIndex} className={`border rounded-lg p-3 ${
                                    action.type === 'delete_lead' 
                                      ? 'bg-red-50 border-red-200' 
                                      : 'bg-blue-50'
                                  }`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge 
                                        variant={action.type === 'delete_lead' ? 'destructive' : 'default'} 
                                        className="text-xs"
                                      >
                                        {action.type === 'delete_lead' && '⚠️ '}
                                        {action.type.replace('_', ' ').toUpperCase()}
                                      </Badge>
                                    </div>
                                    <div className={`text-xs space-y-1 ${
                                      action.type === 'delete_lead' ? 'text-red-700' : 'text-gray-600'
                                    }`}>
                                      {Object.entries(action.config || {}).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                          <span className="font-medium">{key}:</span>
                                          <span className="text-right max-w-32 truncate" title={String(value)}>
                                            {String(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {(!webhook.conditionalRules.conditionSets || webhook.conditionalRules.conditionSets.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No condition sets configured</p>
                          <p className="text-sm">Edit this webhook to add conditional rules</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              <TabsContent value="advanced" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Webhook Details</CardTitle>
                    <CardDescription>Complete webhook configuration including all parameters and metadata.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Webhook Type Details */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 border-b pb-2">Webhook Type Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium">Webhook Type:</span>
                          <Badge variant="outline" className="ml-2">
                            {webhook.webhookType?.toUpperCase() || 'GO'}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Endpoint Key:</span>
                          <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                            {webhook.endpointKey}
                          </code>
                        </div>
                        {webhook.authToken && (
                          <div className="md:col-span-2">
                            <span className="text-sm font-medium">Authentication Token:</span>
                            <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs break-all">
                              {webhook.authToken}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Full Field Mapping Details */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 border-b pb-2">Complete Field Mapping</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                System Field
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Webhook Field
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Type
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Required
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(webhook.fieldMapping || {}).map(([field, sourceField]) => {
                              const isStandardField = ['phone', 'name', 'email'].includes(field);
                              const isRequired = 
                                (field === 'phone' && webhook.validationRules?.requirePhone) ||
                                (field === 'name' && webhook.validationRules?.requireName) ||
                                (field === 'email' && webhook.validationRules?.requireEmail);
                              
                              return (
                                <tr key={field}>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {field}
                                    {isStandardField && (
                                      <Badge variant="secondary" className="ml-1 text-xs">Standard</Badge>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    <code className="bg-gray-100 px-1 rounded text-xs">
                                      {getFieldMappingValue(sourceField, '')}
                                    </code>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {isStandardField ? 'Standard' : 'Custom'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    <Badge variant={isRequired ? 'destructive' : 'secondary'} className="text-xs">
                                      {isRequired ? 'Required' : 'Optional'}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Complete Validation Rules */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 border-b pb-2">Validation Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Phone Required</span>
                            <Badge variant={webhook.validationRules?.requirePhone ? 'destructive' : 'secondary'}>
                              {webhook.validationRules?.requirePhone ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Name Required</span>
                            <Badge variant={webhook.validationRules?.requireName ? 'destructive' : 'secondary'}>
                              {webhook.validationRules?.requireName ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Email Required</span>
                            <Badge variant={webhook.validationRules?.requireEmail ? 'destructive' : 'secondary'}>
                              {webhook.validationRules?.requireEmail ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Allow Duplicates</span>
                            <Badge variant={webhook.validationRules?.allowDuplicatePhone ? 'default' : 'destructive'}>
                              {webhook.validationRules?.allowDuplicatePhone ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Complete Auto Tag Rules */}
                    {webhook.autoTagRules && webhook.autoTagRules.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 border-b pb-2">Auto-Tagging Rules</h3>
                        <div className="space-y-3">
                          {webhook.autoTagRules.map((rule, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Field</span>
                                  <code className="block mt-1 bg-white px-2 py-1 rounded text-sm border">
                                    {rule.field}
                                  </code>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Operator</span>
                                  <Badge variant="outline" className="block mt-1 text-center">
                                    {rule.operator}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Value</span>
                                  <code className="block mt-1 bg-white px-2 py-1 rounded text-sm border break-all">
                                    {rule.value || 'N/A'}
                                  </code>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Tag</span>
                                  <Badge variant="default" className="block mt-1 text-center">
                                    {rule.tag}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw Webhook Data */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 border-b pb-2">Raw Webhook Data</h3>
                      <details className="border rounded-lg">
                        <summary className="p-4 cursor-pointer hover:bg-gray-50 font-medium">
                          View Complete Webhook Object
                        </summary>
                        <div className="border-t p-4 bg-gray-50">
                          <pre className="text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
                            {JSON.stringify(webhook, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>

                    {/* Webhook Stats and Metadata */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 border-b pb-2">Webhook Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {events.length}
                          </div>
                          <div className="text-sm text-gray-600">Total Events</div>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {events.filter(e => e.status === 'success').length}
                          </div>
                          <div className="text-sm text-gray-600">Successful Events</div>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {events.filter(e => e.status === 'failed').length}
                          </div>
                          <div className="text-sm text-gray-600">Failed Events</div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Configuration */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 border-b pb-2">Additional Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Active Status:</span>
                          <Badge variant={webhook.isActive ? 'default' : 'destructive'} className="ml-2">
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Created:</span>
                          <span className="ml-2 text-sm text-gray-600">
                            {new Date(webhook.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Last Updated:</span>
                          <span className="ml-2 text-sm text-gray-600">
                            {new Date(webhook.updatedAt).toLocaleString()}
                          </span>
                        </div>
                        {webhook.lastTriggered && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium">Last Triggered:</span>
                            <span className="ml-2 text-sm text-gray-600">
                              {new Date(webhook.lastTriggered).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Environment and System Info */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 border-b pb-2">System Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Backend URL:</span>
                          <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                            {process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api'}
                          </code>
                        </div>
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Webhook ID:</span>
                          <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                            {webhook.id}
                          </code>
                        </div>
                        {webhook.tenantId && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium">Tenant ID:</span>
                            <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                              {webhook.tenantId}
                            </code>
                          </div>
                        )}
                        {webhook.version && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium">Version:</span>
                            <Badge variant="outline" className="ml-2">
                              {webhook.version}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                                         {/* Complete Announcement Configuration */}
                     {webhook.announcementConfig?.enabled && (
                       <div className="space-y-4">
                         <h3 className="text-sm font-medium text-gray-500 border-b pb-2">Complete Announcement Configuration</h3>
                         
                         {/* Announcement Type & Basic Settings */}
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
                             <h4 className="text-sm font-medium text-purple-900 mb-2">Announcement Type</h4>
                             <Badge variant="outline" className="bg-purple-100 text-purple-800">
                               {webhook.announcementConfig.announcementType?.toUpperCase() || 'TEMPLATE'}
                             </Badge>
                             <p className="text-xs text-purple-700 mt-2">
                               {webhook.announcementConfig.announcementType === 'template' && 'Uses content creator templates'}
                               {webhook.announcementConfig.announcementType === 'video' && 'Generates sales rep videos'}
                               {webhook.announcementConfig.announcementType === 'image' && 'Shows sales rep images'}
                             </p>
                           </div>
                           
                           <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                             <h4 className="text-sm font-medium text-blue-900 mb-2">Auto Generation</h4>
                             <Badge variant={webhook.announcementConfig.contentCreator?.autoGenerate ? 'default' : 'secondary'}>
                               {webhook.announcementConfig.contentCreator?.autoGenerate ? 'Enabled' : 'Disabled'}
                             </Badge>
                             <p className="text-xs text-blue-700 mt-2">
                               {webhook.announcementConfig.contentCreator?.autoGenerate 
                                 ? 'Content generated automatically from template'
                                 : 'Manual content creation required'
                               }
                             </p>
                           </div>
                           
                           <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                             <h4 className="text-sm font-medium text-green-900 mb-2">Status</h4>
                             <Badge variant="default" className="bg-green-100 text-green-800">
                               ACTIVE
                             </Badge>
                             <p className="text-xs text-green-700 mt-2">
                               Announcement webhook is enabled and ready
                             </p>
                           </div>
                         </div>

                         {/* Content Creator Configuration */}
                         <div className="p-4 border rounded-lg bg-gray-50">
                           <h4 className="text-sm font-medium text-gray-900 mb-3">Content Creator Configuration</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                               <span className="text-xs font-medium text-gray-600">Template/Project ID:</span>
                               <code className="block mt-1 bg-white px-2 py-1 rounded text-sm border">
                                 {webhook.announcementConfig.contentCreator?.templateId || 'Not configured'}
                               </code>
                             </div>
                             <div>
                               <span className="text-xs font-medium text-gray-600">Template Name Pattern:</span>
                               <code className="block mt-1 bg-white px-2 py-1 rounded text-sm border">
                                 {webhook.announcementConfig.contentCreator?.templateName || 'Announcement - {{timestamp}}'}
                               </code>
                             </div>
                           </div>
                           
                           {/* Variable Mapping */}
                           {webhook.announcementConfig.contentCreator?.variableMapping && 
                            Object.keys(webhook.announcementConfig.contentCreator.variableMapping).length > 0 && (
                             <div className="mt-4">
                               <span className="text-xs font-medium text-gray-600">Variable Mapping:</span>
                               <div className="mt-2 space-y-2">
                                 {Object.entries(webhook.announcementConfig.contentCreator.variableMapping).map(([key, value]) => (
                                   <div key={key} className="flex items-center space-x-2 p-2 bg-white rounded border">
                                     <code className="text-xs bg-gray-100 px-2 py-1 rounded">{key}</code>
                                     <span className="text-xs text-gray-500">→</span>
                                     <code className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-800">{value}</code>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                         </div>

                         {/* OptiSigns Display Configuration */}
                         <div className="p-4 border rounded-lg bg-gray-50">
                           <h4 className="text-sm font-medium text-gray-900 mb-3">OptiSigns Display Configuration</h4>
                           
                           {/* Display Selection */}
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                             <div>
                               <span className="text-xs font-medium text-gray-600">Selection Mode:</span>
                               <Badge variant="outline" className="block mt-1 text-center">
                                 {webhook.announcementConfig.optisigns?.displaySelection?.mode?.toUpperCase() || 'ALL'}
                               </Badge>
                             </div>
                             
                             {webhook.announcementConfig.optisigns?.displaySelection?.displayIds && (
                               <div>
                                 <span className="text-xs font-medium text-gray-600">Selected Displays:</span>
                                 <Badge variant="default" className="block mt-1 text-center">
                                   {webhook.announcementConfig.optisigns.displaySelection.displayIds.length} displays
                                 </Badge>
                               </div>
                             )}
                             
                             {webhook.announcementConfig.optisigns?.displaySelection?.groupIds && (
                               <div>
                                 <span className="text-xs font-medium text-gray-600">Display Groups:</span>
                                 <Badge variant="outline" className="block mt-1 text-center">
                                   {webhook.announcementConfig.optisigns.displaySelection.groupIds.length} groups
                                 </Badge>
                               </div>
                             )}
                           </div>

                           {/* Specific Display IDs */}
                           {webhook.announcementConfig.optisigns?.displaySelection?.displayIds && 
                            webhook.announcementConfig.optisigns.displaySelection.displayIds.length > 0 && (
                             <div className="mb-4">
                               <span className="text-xs font-medium text-gray-600">Display IDs:</span>
                               <div className="mt-2 flex flex-wrap gap-1">
                                 {webhook.announcementConfig.optisigns.displaySelection.displayIds.map((displayId) => (
                                   <code key={displayId} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                     {displayId}
                                   </code>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* Takeover Settings */}
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                             <div className="p-3 bg-white rounded border">
                               <span className="text-xs font-medium text-gray-600">Priority:</span>
                               <Badge variant="outline" className="block mt-1 text-center">
                                 {webhook.announcementConfig.optisigns?.takeover?.priority || 'MEDIUM'}
                               </Badge>
                             </div>
                             
                             <div className="p-3 bg-white rounded border">
                               <span className="text-xs font-medium text-gray-600">Duration:</span>
                               <Badge variant="outline" className="block mt-1 text-center">
                                 {webhook.announcementConfig.optisigns?.takeover?.duration || 30}s
                               </Badge>
                             </div>
                             
                             <div className="p-3 bg-white rounded border">
                               <span className="text-xs font-medium text-gray-600">Restore After:</span>
                               <Badge variant={webhook.announcementConfig.optisigns?.takeover?.restoreAfter ? 'default' : 'secondary'} className="block mt-1 text-center">
                                 {webhook.announcementConfig.optisigns?.takeover?.restoreAfter ? 'Yes' : 'No'}
                               </Badge>
                             </div>
                             
                             <div className="p-3 bg-white rounded border">
                               <span className="text-xs font-medium text-gray-600">Override Current:</span>
                               <Badge variant={webhook.announcementConfig.optisigns?.takeover?.overrideCurrent ? 'destructive' : 'secondary'} className="block mt-1 text-center">
                                 {webhook.announcementConfig.optisigns?.takeover?.overrideCurrent ? 'Yes' : 'No'}
                               </Badge>
                             </div>
                           </div>
                         </div>

                         {/* Scheduling Configuration */}
                         {webhook.announcementConfig.optisigns?.scheduling && (
                           <div className="p-4 border rounded-lg bg-gray-50">
                             <h4 className="text-sm font-medium text-gray-900 mb-3">Scheduling Configuration</h4>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div className="p-3 bg-white rounded border">
                                 <span className="text-xs font-medium text-gray-600">Immediate:</span>
                                 <Badge variant={webhook.announcementConfig.optisigns.scheduling.immediate !== false ? 'default' : 'secondary'} className="block mt-1 text-center">
                                   {webhook.announcementConfig.optisigns.scheduling.immediate !== false ? 'Yes' : 'No'}
                                 </Badge>
                               </div>
                               
                               {webhook.announcementConfig.optisigns.scheduling.delay && (
                                 <div className="p-3 bg-white rounded border">
                                   <span className="text-xs font-medium text-gray-600">Delay:</span>
                                   <Badge variant="outline" className="block mt-1 text-center">
                                     {webhook.announcementConfig.optisigns.scheduling.delay}s
                                   </Badge>
                                 </div>
                               )}
                               
                               {webhook.announcementConfig.optisigns.scheduling.businessHoursOnly && (
                                 <div className="p-3 bg-white rounded border">
                                   <span className="text-xs font-medium text-gray-600">Business Hours Only:</span>
                                   <Badge variant="default" className="block mt-1 text-center">
                                     Yes
                                   </Badge>
                                 </div>
                               )}
                             </div>
                           </div>
                         )}

                         {/* Sales Rep Field Mapping for Announcements */}
                         <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                           <h4 className="text-sm font-medium text-yellow-900 mb-3">Sales Rep Field Mapping</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                             <div>
                               <span className="text-xs font-medium text-yellow-700">Rep Email Field:</span>
                               <code className="block mt-1 bg-white px-2 py-1 rounded text-sm border">
                                 {getFieldMappingValue(webhook.fieldMapping?.repEmail, 'repEmail')}
                               </code>
                             </div>
                             <div>
                               <span className="text-xs font-medium text-yellow-700">Rep Name Field:</span>
                               <code className="block mt-1 bg-white px-2 py-1 rounded text-sm border">
                                 {getFieldMappingValue(webhook.fieldMapping?.repName, 'repName')}
                               </code>
                             </div>
                             <div>
                               <span className="text-xs font-medium text-yellow-700">Deal Amount Field:</span>
                               <code className="block mt-1 bg-white px-2 py-1 rounded text-sm border">
                                 {getFieldMappingValue(webhook.fieldMapping?.dealAmount, 'dealAmount')}
                               </code>
                             </div>
                             <div>
                               <span className="text-xs font-medium text-yellow-700">Company Name Field:</span>
                               <code className="block mt-1 bg-white px-2 py-1 rounded text-sm border">
                                 {getFieldMappingValue(webhook.fieldMapping?.companyName, 'companyName')}
                               </code>
                             </div>
                           </div>
                         </div>

                         {/* Announcement Conditions */}
                         {webhook.announcementConfig.conditions?.enabled && (
                           <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                             <h4 className="text-sm font-medium text-red-900 mb-3">Announcement Conditions</h4>
                             <div className="space-y-2">
                               {webhook.announcementConfig.conditions.rules?.map((rule, index) => (
                                 <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded border">
                                   <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                     {rule.field}
                                   </code>
                                   <span className="text-xs text-gray-600">{rule.operator}</span>
                                   <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                     {String(rule.value)}
                                   </code>
                                   {rule.required && (
                                     <Badge variant="destructive" className="text-xs">Required</Badge>
                                   )}
                                 </div>
                               )) || (
                                 <p className="text-sm text-red-700">No specific conditions configured</p>
                               )}
                             </div>
                           </div>
                         )}

                         {/* Raw Announcement Config */}
                         <details className="border rounded-lg">
                           <summary className="p-4 cursor-pointer hover:bg-gray-50 font-medium">
                             View Raw Announcement Configuration
                           </summary>
                           <div className="border-t p-4 bg-gray-50">
                             <pre className="text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                               {JSON.stringify(webhook.announcementConfig, null, 2)}
                             </pre>
                           </div>
                         </details>
                       </div>
                     )}

                     {/* Custom Properties */}
                     {(() => {
                       const standardProps = [
                         'id', 'name', 'description', 'brand', 'source', 'fieldMapping', 
                         'validationRules', 'autoTagRules', 'requiredHeaders', 'autoEnrollJourneyId',
                         'isActive', 'createdAt', 'updatedAt', 'endpointKey', 'authToken',
                         'webhookType', 'pauseResumeConfig', 'stopConfig', 'announcementConfig',
                         'conditionalRules', 'testPayload', 'webhookUrl', 'securityToken'
                       ];
                       const customProps = Object.entries(webhook).filter(([key]) => !standardProps.includes(key));
                       
                       return customProps.length > 0 && (
                         <div className="space-y-4">
                           <h3 className="text-sm font-medium text-gray-500 border-b pb-2">Custom Properties</h3>
                           <div className="overflow-x-auto">
                             <table className="min-w-full divide-y divide-gray-200">
                               <thead className="bg-gray-50">
                                 <tr>
                                   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                     Property
                                   </th>
                                   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                     Value
                                   </th>
                                   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                     Type
                                   </th>
                                 </tr>
                               </thead>
                               <tbody className="bg-white divide-y divide-gray-200">
                                 {customProps.map(([key, value]) => (
                                   <tr key={key}>
                                     <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                       {key}
                                     </td>
                                     <td className="px-4 py-2 text-sm text-gray-900 max-w-md">
                                       <code className="bg-gray-100 px-1 rounded text-xs break-all">
                                         {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                       </code>
                                     </td>
                                     <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                       <Badge variant="outline" className="text-xs">
                                         {typeof value}
                                       </Badge>
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                         </div>
                       );
                     })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Webhook not found</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/webhooks')}
            >
              Back to Webhooks
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 