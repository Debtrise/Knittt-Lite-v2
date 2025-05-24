'use client';

import { useEffect, useState } from 'react';
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
import { getWebhookDetails, getWebhookEvents, testWebhook } from '@/app/utils/api';
import { WebhookEndpoint, WebhookEvent } from '@/app/types/webhook';
import { toast } from 'react-hot-toast';
import { RefreshCwIcon, PencilIcon, ClipboardCopy, PlayIcon } from 'lucide-react';
import { Textarea } from '@/app/components/ui/textarea';

export default function WebhookDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const webhookId = parseInt(params.id);
  
  const [loading, setLoading] = useState(true);
  const [webhook, setWebhook] = useState<WebhookEndpoint | null>(null);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [testPayload, setTestPayload] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  const fetchWebhookData = async () => {
    setLoading(true);
    try {
      const webhookData = await getWebhookDetails(webhookId);
      setWebhook(webhookData);
      
      // If there's a test payload, use it as initial value
      if (webhookData.testPayload) {
        setTestPayload(JSON.stringify(webhookData.testPayload, null, 2));
      } else {
        // Set a default test payload based on the field mapping
        const defaultPayload: Record<string, any> = {};
        let phoneField = webhookData.fieldMapping.phone.split('.');
        let nameField = webhookData.fieldMapping.name.split('.');
        let emailField = webhookData.fieldMapping.email.split('.');
        
        let currentPhoneObj = defaultPayload;
        let currentNameObj = defaultPayload;
        let currentEmailObj = defaultPayload;
        
        // Build the nested structure for phone
        for (let i = 0; i < phoneField.length - 1; i++) {
          if (!currentPhoneObj[phoneField[i]]) {
            currentPhoneObj[phoneField[i]] = {};
          }
          currentPhoneObj = currentPhoneObj[phoneField[i]];
        }
        currentPhoneObj[phoneField[phoneField.length - 1]] = "5551234567";
        
        // Build the nested structure for name
        for (let i = 0; i < nameField.length - 1; i++) {
          if (!currentNameObj[nameField[i]]) {
            currentNameObj[nameField[i]] = {};
          }
          currentNameObj = currentNameObj[nameField[i]];
        }
        currentNameObj[nameField[nameField.length - 1]] = "John Doe";
        
        // Build the nested structure for email
        for (let i = 0; i < emailField.length - 1; i++) {
          if (!currentEmailObj[emailField[i]]) {
            currentEmailObj[emailField[i]] = {};
          }
          currentEmailObj = currentEmailObj[emailField[i]];
        }
        currentEmailObj[emailField[emailField.length - 1]] = "john@example.com";
        
        setTestPayload(JSON.stringify(defaultPayload, null, 2));
      }
    } catch (error) {
      console.error('Error fetching webhook details:', error);
      toast.error('Failed to load webhook details');
    }
  };

  const fetchEvents = async () => {
    try {
      const eventsData = await getWebhookEvents(webhookId);
      setEvents(eventsData.events);
    } catch (error) {
      console.error('Error fetching webhook events:', error);
      toast.error('Failed to load webhook events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookData().then(() => fetchEvents());
  }, [webhookId]);

  const handleEdit = () => {
    router.push(`/webhooks/edit/${webhookId}`);
  };

  const handleCopyEndpoint = () => {
    if (!webhook) return;
    
    const url = `${process.env.NEXT_PUBLIC_API_URL}/webhook-receiver/${webhook.endpointKey}`;
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied to clipboard');
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
      
      const result = await testWebhook(webhookId, parsedPayload);
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
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
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
                        <Badge variant={webhook.isActive ? "success" : "secondary"} className="mt-1">
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
                        <div className="flex items-center mt-1">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                            {process.env.NEXT_PUBLIC_API_URL}/webhook-receiver/{webhook.endpointKey}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleCopyEndpoint}
                            className="ml-2"
                          >
                            <ClipboardCopy className="h-4 w-4" />
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
                        <p className="text-sm">
                          <span className="font-medium">Security Token: </span>
                          <code className="bg-gray-100 px-1 rounded text-xs">
                            {webhook.securityToken}
                          </code>
                        </p>
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
                    
                    {webhook.autoEnrollJourneyId && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Auto Enrollment</h3>
                        <p className="text-sm">
                          <span className="font-medium">Auto Enroll Journey ID: </span>
                          {webhook.autoEnrollJourneyId}
                        </p>
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
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Leads Created
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                IP Address
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Processing Time
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {events.map((event) => (
                              <tr key={event.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(event.receivedAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    variant={
                                      event.status === 'success' 
                                        ? 'success' 
                                        : event.status === 'partial_success' 
                                        ? 'warning' 
                                        : 'destructive'
                                    }
                                  >
                                    {event.status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {event.createdLeadIds.length}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {event.ipAddress}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {event.processingTime}ms
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                            <Badge variant={testResult.success ? 'success' : 'destructive'}>
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
                          
                          {testResult.processedLeads && testResult.processedLeads.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2">Processed Leads:</h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Phone
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Name
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Email
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {testResult.processedLeads.map((lead: any, index: number) => (
                                      <tr key={index}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                          {lead.phone}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                          {lead.name}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                          {lead.email}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          
                          {testResult.errors && testResult.errors.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Errors:</h4>
                              <ul className="list-disc list-inside text-sm text-red-600">
                                {testResult.errors.map((error: string, index: number) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
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