'use client';

import React, { useState, useEffect } from 'react';
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
import { RefreshCwIcon, PencilIcon, ClipboardCopy, PlayIcon, KeyIcon, ShieldIcon, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Textarea } from '@/app/components/ui/textarea';
import WebhookForm from '../components/WebhookForm';

interface Journey {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

interface WebhookDetailPageProps {
  params: {
    id: string;
  };
}

export default function WebhookDetailPage({ params }: WebhookDetailPageProps) {
  const router = useRouter();
  const webhookId = parseInt(params.id);

  const [loading, setLoading] = useState(true);
  const [webhook, setWebhook] = useState<WebhookEndpoint | null>(null);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [enrolledJourney, setEnrolledJourney] = useState<Journey | null>(null);
  const [testPayload, setTestPayload] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [regenerating, setRegenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const fetchWebhookData = async () => {
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
        if (data.fieldMapping.phone) {
          defaultPayload[data.fieldMapping.phone] = "5551234567";
        }
        if (data.fieldMapping.name) {
          defaultPayload[data.fieldMapping.name] = "John Doe";
        }
        if (data.fieldMapping.email) {
          defaultPayload[data.fieldMapping.email] = "john@example.com";
        }
        
        setTestPayload(JSON.stringify(defaultPayload, null, 2));
      }
    } catch (error) {
      console.error('Error fetching webhook details:', error);
      toast.error('Failed to load webhook details');
    }
  };

  const fetchEvents = async () => {
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
  };

  useEffect(() => {
    fetchWebhookData().then(() => fetchEvents());
  }, [webhookId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      await api.webhooks.delete(webhookId.toString());
      toast.success('Webhook deleted successfully');
      router.push('/webhooks');
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading webhook details...</p>
        </div>
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Webhook not found</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Details
          </Button>
        </div>
        <WebhookForm
          webhookId={webhookId}
          isEdit={true}
          onSuccess={() => {
            setIsEditing(false);
            // Reload webhook data
            setLoading(true);
            api.webhooks.get(webhookId.toString()).then(response => {
              setWebhook(response.data);
              setLoading(false);
            });
          }}
        />
      </div>
    );
  }

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
            <Button
              variant="outline"
              onClick={() => router.push('/webhooks')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Webhooks
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
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
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
                {webhook.conditionalRules?.enabled && (
                  <TabsTrigger value="rules">Conditional Rules</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Webhook Details</CardTitle>
                    <CardDescription>Configuration details for this webhook endpoint.</CardDescription>
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
                            variant="secondary" 
                            size="sm" 
                            onClick={() => {
                              const url = webhook.webhookUrl || `${process.env.NEXT_PUBLIC_API_URL}/api/webhook-receiver/${webhook.endpointKey}`;
                              navigator.clipboard.writeText(url);
                              toast.success('Webhook URL copied to clipboard');
                            }}
                          >
                            <ClipboardCopy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              if (!confirm('Are you sure? This will invalidate the current endpoint key.')) return;
                              setRegenerating(true);
                              api.webhooks.regenerateKey(webhookId.toString())
                                .then(response => {
                                  setWebhook(prev => prev ? { ...prev, endpointKey: response.data.endpointKey } : null);
                                  toast.success('Endpoint key regenerated');
                                })
                                .catch(error => {
                                  console.error('Error regenerating key:', error);
                                  toast.error('Failed to regenerate key');
                                })
                                .finally(() => setRegenerating(false));
                            }}
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
                                    {sourceField}
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
                            onClick={() => {
                              if (!confirm('Are you sure? This will invalidate the current authentication token.')) return;
                              setRegenerating(true);
                              api.webhooks.regenerateToken(webhookId.toString())
                                .then(response => {
                                  setWebhook(prev => prev ? { ...prev, authToken: response.data.authToken } : null);
                                  toast.success('Authentication token regenerated');
                                })
                                .catch(error => {
                                  console.error('Error regenerating token:', error);
                                  toast.error('Failed to regenerate token');
                                })
                                .finally(() => setRegenerating(false));
                            }}
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
                      variant="secondary" 
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
                                    let hasValue = false;
                                    try {
                                      const testPayloadData = JSON.parse(testPayload);
                                      hasValue = Boolean(webhookField && testPayloadData[webhookField] !== undefined);
                                    } catch (e) {
                                      hasValue = false;
                                    }
                                    return (
                                      <div key={leadField} className="flex justify-between items-center">
                                        <span className="text-blue-800">
                                          {leadField} ← {webhookField || 'unmapped'}
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
                      onClick={() => {
                        setTestLoading(true);
                        setTestResult(null);
                        let parsedPayload;
                        try {
                          parsedPayload = JSON.parse(testPayload);
                        } catch (e) {
                          toast.error('Invalid JSON payload');
                          return;
                        }
                        
                        api.webhooks.test(webhookId.toString(), parsedPayload)
                          .then(result => {
                            setTestResult(result);
                            toast.success('Webhook test completed');
                          })
                          .catch(error => {
                            console.error('Error testing webhook:', error);
                            toast.error('Failed to test webhook');
                          })
                          .finally(() => setTestLoading(false));
                      }}
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