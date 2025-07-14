'use client';

import React, { useEffect, useState } from 'react';
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
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Textarea } from '@/app/components/ui/textarea';
import { WebhookEndpoint, WebhookType } from '@/app/types/webhook';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, RefreshCw, Plus, X, Trash2 } from 'lucide-react';
import api from '@/app/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

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

export default function WebhookReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const webhookId = parseInt(resolvedParams.id);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhook, setWebhook] = useState<WebhookEndpoint | null>(null);
  const [formData, setFormData] = useState<Partial<WebhookEndpoint>>({});
  const [availableJourneys, setAvailableJourneys] = useState<any[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [availableDisplays, setAvailableDisplays] = useState<any[]>([]);

  useEffect(() => {
    fetchWebhook();
    fetchJourneys();
    fetchTemplates();
    fetchDisplays();
  }, [webhookId]);

  const fetchJourneys = async () => {
    try {
      const response = await api.journeys.list();
      const data = response.data || response;
      setAvailableJourneys(data.journeys || data || []);
    } catch (error) {
      console.error('Error fetching journeys:', error);
      toast.error('Failed to load journeys');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.webhooks.announcement.getTemplates({
        category: 'announcement',
        isPublic: true,
        limit: 100
      });
      const data = response.data || response;
      setAvailableTemplates(data.templates || data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Don't show error toast as this is not critical
    }
  };

  const fetchDisplays = async () => {
    try {
      const response = await api.webhooks.announcement.getDisplays({
        status: 'any',
        limit: 500
      });
      const data = response.data || response;
      setAvailableDisplays(data.displays || data || []);
    } catch (error) {
      console.error('Error fetching displays:', error);
      // Don't show error toast as this is not critical
    }
  };

  const fetchWebhook = async () => {
    setLoading(true);
    try {
      const response = await api.webhooks.get(webhookId.toString());
      const data = response.data || response;
      console.log('Fetched webhook data:', data);
      setWebhook(data);
      setFormData({
        ...data,
        // Ensure all required fields have default values
        fieldMapping: data.fieldMapping || {},
        validationRules: data.validationRules || {
          requirePhone: false,
          requireName: false,
          requireEmail: false,
          allowDuplicatePhone: false
        },
        autoTagRules: data.autoTagRules || [],
        requiredHeaders: data.requiredHeaders || {},
        conditionalRules: data.conditionalRules || {
          enabled: false,
          logicOperator: 'AND',
          conditionSets: []
        },
        pauseResumeConfig: data.pauseResumeConfig || { enabled: false },
        stopConfig: data.stopConfig || { enabled: false },
        announcementConfig: data.announcementConfig || { enabled: false }
      });
    } catch (error) {
      console.error('Error fetching webhook:', error);
      toast.error('Failed to load webhook details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleValidationRuleChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      validationRules: {
        ...prev.validationRules,
        [field]: value
      }
    }));
  };

  const handleAutoTagRuleChange = (index: number, field: string, value: any) => {
    const newRules = [...(formData.autoTagRules || [])];
    newRules[index] = { ...newRules[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      autoTagRules: newRules
    }));
  };

  const addAutoTagRule = () => {
    setFormData(prev => ({
      ...prev,
      autoTagRules: [
        ...(prev.autoTagRules || []),
        { field: '', operator: 'equals', value: '', tag: '' }
      ]
    }));
  };

  const removeAutoTagRule = (index: number) => {
    const newRules = [...(formData.autoTagRules || [])];
    newRules.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      autoTagRules: newRules
    }));
  };

  const handleRequiredHeaderChange = (index: number, key: string, value: string) => {
    const headers = { ...(formData.requiredHeaders || {}) };
    headers[key] = value;
    setFormData(prev => ({
      ...prev,
      requiredHeaders: headers
    }));
  };

  const addRequiredHeader = () => {
    const newKey = `header_${Object.keys(formData.requiredHeaders || {}).length + 1}`;
    setFormData(prev => ({
      ...prev,
      requiredHeaders: {
        ...(prev.requiredHeaders || {}),
        [newKey]: ''
      }
    }));
  };

  const removeRequiredHeader = (key: string) => {
    const headers = { ...(formData.requiredHeaders || {}) };
    delete headers[key];
    setFormData(prev => ({
      ...prev,
      requiredHeaders: headers
    }));
  };

  const handleConditionSetChange = (index: number, field: string, value: any) => {
    const newSets = [...(formData.conditionalRules?.conditionSets || [])];
    newSets[index] = { ...newSets[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      conditionalRules: {
        ...prev.conditionalRules,
        conditionSets: newSets
      }
    }));
  };

  const addConditionSet = () => {
    setFormData(prev => ({
      ...prev,
      conditionalRules: {
        ...prev.conditionalRules,
        enabled: true,
        logicOperator: prev.conditionalRules?.logicOperator || 'AND',
        conditionSets: [
          ...(prev.conditionalRules?.conditionSets || []),
          {
            name: `Condition Set ${(prev.conditionalRules?.conditionSets?.length || 0) + 1}`,
            conditions: [],
            actions: []
          }
        ]
      }
    }));
  };

  const removeConditionSet = (index: number) => {
    const newSets = [...(formData.conditionalRules?.conditionSets || [])];
    newSets.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      conditionalRules: {
        ...prev.conditionalRules,
        conditionSets: newSets
      }
    }));
  };

  const handleConditionChange = (setIndex: number, conditionIndex: number, field: string, value: any) => {
    const newSets = [...(formData.conditionalRules?.conditionSets || [])];
    newSets[setIndex].conditions[conditionIndex] = {
      ...newSets[setIndex].conditions[conditionIndex],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      conditionalRules: {
        ...prev.conditionalRules,
        conditionSets: newSets
      }
    }));
  };

  const addCondition = (setIndex: number) => {
    const newSets = [...(formData.conditionalRules?.conditionSets || [])];
    newSets[setIndex].conditions.push({
      field: '',
      operator: 'equals',
      value: '',
      dataType: 'string'
    });
    setFormData(prev => ({
      ...prev,
      conditionalRules: {
        ...prev.conditionalRules,
        conditionSets: newSets
      }
    }));
  };

  const removeCondition = (setIndex: number, conditionIndex: number) => {
    const newSets = [...(formData.conditionalRules?.conditionSets || [])];
    newSets[setIndex].conditions.splice(conditionIndex, 1);
    setFormData(prev => ({
      ...prev,
      conditionalRules: {
        ...prev.conditionalRules,
        conditionSets: newSets
      }
    }));
  };

  const handleActionChange = (setIndex: number, actionIndex: number, field: string, value: any) => {
    const newSets = [...(formData.conditionalRules?.conditionSets || [])];
    newSets[setIndex].actions[actionIndex] = {
      ...newSets[setIndex].actions[actionIndex],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      conditionalRules: {
        ...prev.conditionalRules,
        conditionSets: newSets
      }
    }));
  };

  const addAction = (setIndex: number) => {
    const newSets = [...(formData.conditionalRules?.conditionSets || [])];
    newSets[setIndex].actions.push({
      type: 'create_lead',
      config: {}
    });
    setFormData(prev => ({
      ...prev,
      conditionalRules: {
        ...prev.conditionalRules,
        conditionSets: newSets
      }
    }));
  };

  const removeAction = (setIndex: number, actionIndex: number) => {
    const newSets = [...(formData.conditionalRules?.conditionSets || [])];
    newSets[setIndex].actions.splice(actionIndex, 1);
    setFormData(prev => ({
      ...prev,
      conditionalRules: {
        ...prev.conditionalRules,
        conditionSets: newSets
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.webhooks.update(webhookId.toString(), formData);
      toast.success('Webhook updated successfully');
      router.push(`/webhooks/${webhookId}`);
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast.error('Failed to update webhook');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading webhook details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!webhook) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Webhook not found</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/webhooks')}
            >
              Back to Webhooks
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/webhooks/${webhookId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Review & Update Webhook</h1>
              <p className="text-gray-500">Review and modify webhook configuration</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchWebhook}
              disabled={saving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Webhook Information */}
          <Card>
            <CardHeader>
              <CardTitle>Webhook Information</CardTitle>
              <CardDescription>Webhook endpoint details and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {webhook && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Webhook ID</Label>
                    <div className="p-2 bg-gray-50 rounded border">
                      <code className="text-sm">{webhook.id}</code>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Endpoint Key</Label>
                    <div className="p-2 bg-gray-50 rounded border">
                      <code className="text-sm">{webhook.endpointKey || 'Not available'}</code>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Webhook URL</Label>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-50 rounded border flex-1">
                        <code className="text-sm break-all">
                          {webhook.webhookUrl || `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://34.122.156.88:3001'}/api/webhook-receiver/${webhook.endpointKey}`}
                        </code>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = webhook.webhookUrl || `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://34.122.156.88:3001'}/api/webhook-receiver/${webhook.endpointKey}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Webhook URL copied to clipboard');
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  {webhook.securityToken && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Security Token</Label>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-50 rounded border flex-1">
                          <code className="text-sm">{webhook.securityToken}</code>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(webhook.securityToken);
                            toast.success('Security token copied to clipboard');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                  {webhook.announcementConfig?.contentCreator?.templateId && (
                    <div className="space-y-2">
                      <Label>Template ID</Label>
                      <div className="p-2 bg-gray-50 rounded border">
                        <code className="text-sm">{webhook.announcementConfig.contentCreator.templateId}</code>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Created</Label>
                    <div className="p-2 bg-gray-50 rounded border">
                      <span className="text-sm">{new Date(webhook.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Updated</Label>
                    <div className="p-2 bg-gray-50 rounded border">
                      <span className="text-sm">{new Date(webhook.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core webhook configuration details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Webhook name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Webhook description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand || ''}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="Brand name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={formData.source || ''}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    placeholder="Lead source"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookType">Webhook Type</Label>
                  <Select
                    value={formData.webhookType || 'go'}
                    onValueChange={(value) => handleInputChange('webhookType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select webhook type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="go">Go</SelectItem>
                      <SelectItem value="pause">Pause</SelectItem>
                      <SelectItem value="stop">Stop</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive || false}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Mapping */}
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping</CardTitle>
              <CardDescription>Map incoming webhook fields to lead fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Field</Label>
                  <Input
                    id="phone"
                    value={getFieldMappingValue(formData.fieldMapping?.phone, '')}
                    onChange={(e) => handleInputChange('fieldMapping', {
                      ...formData.fieldMapping,
                      phone: e.target.value
                    })}
                    placeholder="phone_number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name Field</Label>
                  <Input
                    id="name"
                    value={getFieldMappingValue(formData.fieldMapping?.name, '')}
                    onChange={(e) => handleInputChange('fieldMapping', {
                      ...formData.fieldMapping,
                      name: e.target.value
                    })}
                    placeholder="full_name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Field</Label>
                  <Input
                    id="email"
                    value={getFieldMappingValue(formData.fieldMapping?.email, '')}
                    onChange={(e) => handleInputChange('fieldMapping', {
                      ...formData.fieldMapping,
                      email: e.target.value
                    })}
                    placeholder="email_address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Rules</CardTitle>
              <CardDescription>Configure how incoming data should be validated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requirePhone">Require Phone</Label>
                  <Switch
                    id="requirePhone"
                    checked={formData.validationRules?.requirePhone || false}
                    onCheckedChange={(checked) => handleValidationRuleChange('requirePhone', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireName">Require Name</Label>
                  <Switch
                    id="requireName"
                    checked={formData.validationRules?.requireName || false}
                    onCheckedChange={(checked) => handleValidationRuleChange('requireName', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireEmail">Require Email</Label>
                  <Switch
                    id="requireEmail"
                    checked={formData.validationRules?.requireEmail || false}
                    onCheckedChange={(checked) => handleValidationRuleChange('requireEmail', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowDuplicatePhone">Allow Duplicate Phone</Label>
                  <Switch
                    id="allowDuplicatePhone"
                    checked={formData.validationRules?.allowDuplicatePhone || false}
                    onCheckedChange={(checked) => handleValidationRuleChange('allowDuplicatePhone', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto Tagging */}
          <Card>
            <CardHeader>
              <CardTitle>Auto Tagging</CardTitle>
              <CardDescription>Configure automatic tagging rules for incoming leads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {(formData.autoTagRules || []).map((rule, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div className="space-y-2">
                        <Label>Field</Label>
                        <Input
                          value={rule.field || ''}
                          onChange={(e) => handleAutoTagRuleChange(index, 'field', e.target.value)}
                          placeholder="source"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Operator</Label>
                        <Select
                          value={rule.operator || 'equals'}
                          onValueChange={(value) => handleAutoTagRuleChange(index, 'operator', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="exists">Exists</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Value</Label>
                        <Input
                          value={rule.value || ''}
                          onChange={(e) => handleAutoTagRuleChange(index, 'value', e.target.value)}
                          placeholder="website"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tag</Label>
                        <Input
                          value={rule.tag || ''}
                          onChange={(e) => handleAutoTagRuleChange(index, 'tag', e.target.value)}
                          placeholder="web-lead"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAutoTagRule(index)}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addAutoTagRule}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tag Rule
              </Button>
            </CardContent>
          </Card>

          {/* Required Headers */}
          <Card>
            <CardHeader>
              <CardTitle>Required Headers</CardTitle>
              <CardDescription>Configure required HTTP headers for webhook requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(formData.requiredHeaders || {}).map(([key, value]) => (
                <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Header Name</Label>
                    <Input
                      value={key}
                      onChange={(e) => {
                        const headers = { ...(formData.requiredHeaders || {}) };
                        delete headers[key];
                        headers[e.target.value] = value;
                        setFormData(prev => ({
                          ...prev,
                          requiredHeaders: headers
                        }));
                      }}
                      placeholder="Header name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Header Value</Label>
                    <div className="flex gap-2">
                      <Input
                        value={value}
                        onChange={(e) => handleRequiredHeaderChange(index, key, e.target.value)}
                        placeholder="Header value"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRequiredHeader(key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addRequiredHeader}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Required Header
              </Button>
            </CardContent>
          </Card>

          {/* Auto Enrollment */}
          <Card>
            <CardHeader>
              <CardTitle>Auto Enrollment</CardTitle>
              <CardDescription>Configure automatic journey enrollment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Auto Enroll Journey</Label>
                <Select
                  value={formData.autoEnrollJourneyId?.toString() || 'none'}
                  onValueChange={(value) => handleInputChange('autoEnrollJourneyId', value === 'none' ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select journey" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableJourneys.map((journey) => (
                      <SelectItem key={journey.id} value={journey.id.toString()}>
                        {journey.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Conditional Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Conditional Rules</CardTitle>
              <CardDescription>Configure conditional processing and automated actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.conditionalRules?.enabled || false}
                    onCheckedChange={(checked) => handleInputChange('conditionalRules', {
                      ...formData.conditionalRules,
                      enabled: checked
                    })}
                  />
                  <Label>Enable Conditional Processing</Label>
                </div>
                {formData.conditionalRules?.enabled && (
                  <Select
                    value={formData.conditionalRules?.logicOperator || 'AND'}
                    onValueChange={(value) => handleInputChange('conditionalRules', {
                      ...formData.conditionalRules,
                      logicOperator: value
                    })}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Logic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {formData.conditionalRules?.enabled && (
                <div className="space-y-6">
                  {(formData.conditionalRules?.conditionSets || []).map((set, setIndex) => (
                    <div key={setIndex} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Input
                          value={set.name}
                          onChange={(e) => handleConditionSetChange(setIndex, 'name', e.target.value)}
                          placeholder="Condition Set Name"
                          className="max-w-[300px]"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeConditionSet(setIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Conditions */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Conditions</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addCondition(setIndex)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Condition
                          </Button>
                        </div>
                        {set.conditions.map((condition, conditionIndex) => (
                          <div key={conditionIndex} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-2">
                              <Label>Field</Label>
                              <Input
                                value={condition.field}
                                onChange={(e) => handleConditionChange(setIndex, conditionIndex, 'field', e.target.value)}
                                placeholder="Field name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Operator</Label>
                              <Select
                                value={condition.operator}
                                onValueChange={(value) => handleConditionChange(setIndex, conditionIndex, 'operator', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select operator" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="not_equals">Not Equals</SelectItem>
                                  <SelectItem value="contains">Contains</SelectItem>
                                  <SelectItem value="not_contains">Not Contains</SelectItem>
                                  <SelectItem value="starts_with">Starts With</SelectItem>
                                  <SelectItem value="ends_with">Ends With</SelectItem>
                                  <SelectItem value="greater_than">Greater Than</SelectItem>
                                  <SelectItem value="less_than">Less Than</SelectItem>
                                  <SelectItem value="exists">Exists</SelectItem>
                                  <SelectItem value="not_exists">Not Exists</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Value</Label>
                              <Input
                                value={condition.value || ''}
                                onChange={(e) => handleConditionChange(setIndex, conditionIndex, 'value', e.target.value)}
                                placeholder="Value to compare"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Data Type</Label>
                              <Select
                                value={condition.dataType}
                                onValueChange={(value) => handleConditionChange(setIndex, conditionIndex, 'dataType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-4 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCondition(setIndex, conditionIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Actions</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addAction(setIndex)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Action
                          </Button>
                        </div>
                        {set.actions.map((action, actionIndex) => (
                          <div key={actionIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                              <Label>Action Type</Label>
                              <Select
                                value={action.type}
                                onValueChange={(value) => handleActionChange(setIndex, actionIndex, 'type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="create_lead">Create Lead</SelectItem>
                                  <SelectItem value="update_lead">Update Lead</SelectItem>
                                  <SelectItem value="delete_lead">Delete Lead</SelectItem>
                                  <SelectItem value="send_notification">Send Notification</SelectItem>
                                  <SelectItem value="enroll_journey">Enroll Journey</SelectItem>
                                  <SelectItem value="call_webhook">Call Webhook</SelectItem>
                                  <SelectItem value="set_tags">Set Tags</SelectItem>
                                  <SelectItem value="create_task">Create Task</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Configuration</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={JSON.stringify(action.config)}
                                  onChange={(e) => {
                                    try {
                                      const config = JSON.parse(e.target.value);
                                      handleActionChange(setIndex, actionIndex, 'config', config);
                                    } catch (error) {
                                      // Invalid JSON, ignore
                                    }
                                  }}
                                  placeholder="Action configuration (JSON)"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeAction(setIndex, actionIndex)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addConditionSet}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition Set
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pause/Resume Configuration */}
          {formData.webhookType === 'pause' && (
            <Card>
              <CardHeader>
                <CardTitle>Pause/Resume Configuration</CardTitle>
                <CardDescription>Configure pause and resume behavior for leads and journeys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.pauseResumeConfig?.enabled || false}
                    onCheckedChange={(checked) => handleInputChange('pauseResumeConfig', {
                      ...formData.pauseResumeConfig,
                      enabled: checked
                    })}
                  />
                  <Label>Enable Pause/Resume Configuration</Label>
                </div>

                {formData.pauseResumeConfig?.enabled && (
                  <div className="space-y-6">
                    {/* Resume Conditions */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Resume Conditions</h4>
                      
                      {/* Timer Resume */}
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.pauseResumeConfig?.resumeConditions?.timerResume?.enabled || false}
                            onCheckedChange={(checked) => handleInputChange('pauseResumeConfig', {
                              ...formData.pauseResumeConfig,
                              resumeConditions: {
                                ...formData.pauseResumeConfig?.resumeConditions,
                                timerResume: {
                                  ...formData.pauseResumeConfig?.resumeConditions?.timerResume,
                                  enabled: checked
                                }
                              }
                            })}
                          />
                          <Label>Timer Resume</Label>
                        </div>
                        
                        {formData.pauseResumeConfig?.resumeConditions?.timerResume?.enabled && (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Days</Label>
                              <Input
                                type="number"
                                value={formData.pauseResumeConfig?.resumeConditions?.timerResume?.delayDays || 0}
                                onChange={(e) => handleInputChange('pauseResumeConfig', {
                                  ...formData.pauseResumeConfig,
                                  resumeConditions: {
                                    ...formData.pauseResumeConfig?.resumeConditions,
                                    timerResume: {
                                      ...formData.pauseResumeConfig?.resumeConditions?.timerResume,
                                      delayDays: parseInt(e.target.value) || 0
                                    }
                                  }
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Hours</Label>
                              <Input
                                type="number"
                                value={formData.pauseResumeConfig?.resumeConditions?.timerResume?.delayHours || 0}
                                onChange={(e) => handleInputChange('pauseResumeConfig', {
                                  ...formData.pauseResumeConfig,
                                  resumeConditions: {
                                    ...formData.pauseResumeConfig?.resumeConditions,
                                    timerResume: {
                                      ...formData.pauseResumeConfig?.resumeConditions?.timerResume,
                                      delayHours: parseInt(e.target.value) || 0
                                    }
                                  }
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Minutes</Label>
                              <Input
                                type="number"
                                value={formData.pauseResumeConfig?.resumeConditions?.timerResume?.delayMinutes || 0}
                                onChange={(e) => handleInputChange('pauseResumeConfig', {
                                  ...formData.pauseResumeConfig,
                                  resumeConditions: {
                                    ...formData.pauseResumeConfig?.resumeConditions,
                                    timerResume: {
                                      ...formData.pauseResumeConfig?.resumeConditions?.timerResume,
                                      delayMinutes: parseInt(e.target.value) || 0
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Resume */}
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.pauseResumeConfig?.resumeConditions?.statusResume?.enabled || false}
                            onCheckedChange={(checked) => handleInputChange('pauseResumeConfig', {
                              ...formData.pauseResumeConfig,
                              resumeConditions: {
                                ...formData.pauseResumeConfig?.resumeConditions,
                                statusResume: {
                                  ...formData.pauseResumeConfig?.resumeConditions?.statusResume,
                                  enabled: checked
                                }
                              }
                            })}
                          />
                          <Label>Status Resume</Label>
                        </div>
                        
                        {formData.pauseResumeConfig?.resumeConditions?.statusResume?.enabled && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Target Statuses (comma-separated)</Label>
                              <Input
                                value={formData.pauseResumeConfig?.resumeConditions?.statusResume?.targetStatuses?.join(', ') || ''}
                                onChange={(e) => handleInputChange('pauseResumeConfig', {
                                  ...formData.pauseResumeConfig,
                                  resumeConditions: {
                                    ...formData.pauseResumeConfig?.resumeConditions,
                                    statusResume: {
                                      ...formData.pauseResumeConfig?.resumeConditions?.statusResume,
                                      targetStatuses: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                    }
                                  }
                                })}
                                placeholder="contacted, qualified, sold"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Check Interval (minutes)</Label>
                              <Input
                                type="number"
                                value={formData.pauseResumeConfig?.resumeConditions?.statusResume?.checkInterval || 30}
                                onChange={(e) => handleInputChange('pauseResumeConfig', {
                                  ...formData.pauseResumeConfig,
                                  resumeConditions: {
                                    ...formData.pauseResumeConfig?.resumeConditions,
                                    statusResume: {
                                      ...formData.pauseResumeConfig?.resumeConditions?.statusResume,
                                      checkInterval: parseInt(e.target.value) || 30
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tag Resume */}
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.pauseResumeConfig?.resumeConditions?.tagResume?.enabled || false}
                            onCheckedChange={(checked) => handleInputChange('pauseResumeConfig', {
                              ...formData.pauseResumeConfig,
                              resumeConditions: {
                                ...formData.pauseResumeConfig?.resumeConditions,
                                tagResume: {
                                  ...formData.pauseResumeConfig?.resumeConditions?.tagResume,
                                  enabled: checked
                                }
                              }
                            })}
                          />
                          <Label>Tag Resume</Label>
                        </div>
                        
                        {formData.pauseResumeConfig?.resumeConditions?.tagResume?.enabled && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Required Tags (comma-separated)</Label>
                              <Input
                                value={formData.pauseResumeConfig?.resumeConditions?.tagResume?.requiredTags?.join(', ') || ''}
                                onChange={(e) => handleInputChange('pauseResumeConfig', {
                                  ...formData.pauseResumeConfig,
                                  resumeConditions: {
                                    ...formData.pauseResumeConfig?.resumeConditions,
                                    tagResume: {
                                      ...formData.pauseResumeConfig?.resumeConditions?.tagResume,
                                      requiredTags: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                    }
                                  }
                                })}
                                placeholder="ready, qualified"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Forbidden Tags (comma-separated)</Label>
                              <Input
                                value={formData.pauseResumeConfig?.resumeConditions?.tagResume?.forbiddenTags?.join(', ') || ''}
                                onChange={(e) => handleInputChange('pauseResumeConfig', {
                                  ...formData.pauseResumeConfig,
                                  resumeConditions: {
                                    ...formData.pauseResumeConfig?.resumeConditions,
                                    tagResume: {
                                      ...formData.pauseResumeConfig?.resumeConditions?.tagResume,
                                      forbiddenTags: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                    }
                                  }
                                })}
                                placeholder="dnc, sold"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Pause Actions</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={formData.pauseResumeConfig?.pauseActions?.pauseJourneys || false}
                              onCheckedChange={(checked) => handleInputChange('pauseResumeConfig', {
                                ...formData.pauseResumeConfig,
                                pauseActions: {
                                  ...formData.pauseResumeConfig?.pauseActions,
                                  pauseJourneys: checked
                                }
                              })}
                            />
                            <Label>Pause Journeys</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={formData.pauseResumeConfig?.pauseActions?.addPauseTag || false}
                              onCheckedChange={(checked) => handleInputChange('pauseResumeConfig', {
                                ...formData.pauseResumeConfig,
                                pauseActions: {
                                  ...formData.pauseResumeConfig?.pauseActions,
                                  addPauseTag: checked
                                }
                              })}
                            />
                            <Label>Add Pause Tag</Label>
                          </div>
                          {formData.pauseResumeConfig?.pauseActions?.addPauseTag && (
                            <div className="ml-6 space-y-2">
                              <Label>Pause Tag Name</Label>
                              <Input
                                value={formData.pauseResumeConfig?.pauseActions?.pauseTagName || 'paused'}
                                onChange={(e) => handleInputChange('pauseResumeConfig', {
                                  ...formData.pauseResumeConfig,
                                  pauseActions: {
                                    ...formData.pauseResumeConfig?.pauseActions,
                                    pauseTagName: e.target.value
                                  }
                                })}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Resume Actions</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={formData.pauseResumeConfig?.resumeActions?.resumeJourneys || false}
                              onCheckedChange={(checked) => handleInputChange('pauseResumeConfig', {
                                ...formData.pauseResumeConfig,
                                resumeActions: {
                                  ...formData.pauseResumeConfig?.resumeActions,
                                  resumeJourneys: checked
                                }
                              })}
                            />
                            <Label>Resume Journeys</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={formData.pauseResumeConfig?.resumeActions?.removePauseTag || false}
                              onCheckedChange={(checked) => handleInputChange('pauseResumeConfig', {
                                ...formData.pauseResumeConfig,
                                resumeActions: {
                                  ...formData.pauseResumeConfig?.resumeActions,
                                  removePauseTag: checked
                                }
                              })}
                            />
                            <Label>Remove Pause Tag</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={formData.pauseResumeConfig?.resumeActions?.addResumeTag || false}
                              onCheckedChange={(checked) => handleInputChange('pauseResumeConfig', {
                                ...formData.pauseResumeConfig,
                                resumeActions: {
                                  ...formData.pauseResumeConfig?.resumeActions,
                                  addResumeTag: checked
                                }
                              })}
                            />
                            <Label>Add Resume Tag</Label>
                          </div>
                          {formData.pauseResumeConfig?.resumeActions?.addResumeTag && (
                            <div className="ml-6 space-y-2">
                              <Label>Resume Tag Name</Label>
                              <Input
                                value={formData.pauseResumeConfig?.resumeActions?.resumeTagName || 'resumed'}
                                onChange={(e) => handleInputChange('pauseResumeConfig', {
                                  ...formData.pauseResumeConfig,
                                  resumeActions: {
                                    ...formData.pauseResumeConfig?.resumeActions,
                                    resumeTagName: e.target.value
                                  }
                                })}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stop Configuration */}
          {formData.webhookType === 'stop' && (
            <Card>
              <CardHeader>
                <CardTitle>Stop Configuration</CardTitle>
                <CardDescription>Configure stop behavior for leads and journeys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.stopConfig?.enabled || false}
                    onCheckedChange={(checked) => handleInputChange('stopConfig', {
                      ...formData.stopConfig,
                      enabled: checked
                    })}
                  />
                  <Label>Enable Stop Configuration</Label>
                </div>

                {formData.stopConfig?.enabled && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Stop Actions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={formData.stopConfig?.stopActions?.exitJourneys || false}
                              onCheckedChange={(checked) => handleInputChange('stopConfig', {
                                ...formData.stopConfig,
                                stopActions: {
                                  ...formData.stopConfig?.stopActions,
                                  exitJourneys: checked
                                }
                              })}
                            />
                            <Label>Exit Journeys</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={formData.stopConfig?.stopActions?.addStopTag || false}
                              onCheckedChange={(checked) => handleInputChange('stopConfig', {
                                ...formData.stopConfig,
                                stopActions: {
                                  ...formData.stopConfig?.stopActions,
                                  addStopTag: checked
                                }
                              })}
                            />
                            <Label>Add Stop Tag</Label>
                          </div>
                          {formData.stopConfig?.stopActions?.addStopTag && (
                            <div className="ml-6 space-y-2">
                              <Label>Stop Tag Name</Label>
                              <Input
                                value={formData.stopConfig?.stopActions?.stopTagName || 'stopped'}
                                onChange={(e) => handleInputChange('stopConfig', {
                                  ...formData.stopConfig,
                                  stopActions: {
                                    ...formData.stopConfig?.stopActions,
                                    stopTagName: e.target.value
                                  }
                                })}
                              />
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={formData.stopConfig?.stopActions?.markAsDNC || false}
                              onCheckedChange={(checked) => handleInputChange('stopConfig', {
                                ...formData.stopConfig,
                                stopActions: {
                                  ...formData.stopConfig?.stopActions,
                                  markAsDNC: checked
                                }
                              })}
                            />
                            <Label>Mark as DNC</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={formData.stopConfig?.stopActions?.markAsSold || false}
                              onCheckedChange={(checked) => handleInputChange('stopConfig', {
                                ...formData.stopConfig,
                                stopActions: {
                                  ...formData.stopConfig?.stopActions,
                                  markAsSold: checked
                                }
                              })}
                            />
                            <Label>Mark as Sold</Label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={formData.stopConfig?.stopActions?.preventFutureEnrollment || false}
                              onCheckedChange={(checked) => handleInputChange('stopConfig', {
                                ...formData.stopConfig,
                                stopActions: {
                                  ...formData.stopConfig?.stopActions,
                                  preventFutureEnrollment: checked
                                }
                              })}
                            />
                            <Label>Prevent Future Enrollment</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Metadata Tracking</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.stopConfig?.stopMetadata?.trackStopReason || false}
                            onCheckedChange={(checked) => handleInputChange('stopConfig', {
                              ...formData.stopConfig,
                              stopMetadata: {
                                ...formData.stopConfig?.stopMetadata,
                                trackStopReason: checked
                              }
                            })}
                          />
                          <Label>Track Stop Reason</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.stopConfig?.stopMetadata?.trackStopSource || false}
                            onCheckedChange={(checked) => handleInputChange('stopConfig', {
                              ...formData.stopConfig,
                              stopMetadata: {
                                ...formData.stopConfig?.stopMetadata,
                                trackStopSource: checked
                              }
                            })}
                          />
                          <Label>Track Stop Source</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.stopConfig?.stopMetadata?.trackStopTimestamp || false}
                            onCheckedChange={(checked) => handleInputChange('stopConfig', {
                              ...formData.stopConfig,
                              stopMetadata: {
                                ...formData.stopConfig?.stopMetadata,
                                trackStopTimestamp: checked
                              }
                            })}
                          />
                          <Label>Track Stop Timestamp</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Announcement Configuration */}
          {formData.webhookType === 'announcement' && (
            <Card>
              <CardHeader>
                <CardTitle>Announcement Configuration</CardTitle>
                <CardDescription>Configure announcement generation and display settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.announcementConfig?.enabled || false}
                    onCheckedChange={(checked) => handleInputChange('announcementConfig', {
                      ...formData.announcementConfig,
                      enabled: checked
                    })}
                  />
                  <Label>Enable Announcement Configuration</Label>
                </div>

                {formData.announcementConfig?.enabled && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Content Creator Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Selected Template</Label>
                          <Select
                            value={formData.announcementConfig?.contentCreator?.templateId || ''}
                            onValueChange={(value) => {
                              const selectedTemplate = availableTemplates.find(t => t.id === value);
                              handleInputChange('announcementConfig', {
                                ...formData.announcementConfig,
                                contentCreator: {
                                  ...formData.announcementConfig?.contentCreator,
                                  templateId: value,
                                  templateName: selectedTemplate?.name || ''
                                }
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTemplates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formData.announcementConfig?.contentCreator?.templateId && (
                            <div className="text-xs text-gray-500">
                              Template ID: {formData.announcementConfig.contentCreator.templateId}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Template Name Template</Label>
                          <Input
                            value={formData.announcementConfig?.contentCreator?.templateName || ''}
                            onChange={(e) => handleInputChange('announcementConfig', {
                              ...formData.announcementConfig,
                              contentCreator: {
                                ...formData.announcementConfig?.contentCreator,
                                templateName: e.target.value
                              }
                            })}
                            placeholder="Announcement - {{timestamp}}"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.announcementConfig?.contentCreator?.autoGenerate || false}
                          onCheckedChange={(checked) => handleInputChange('announcementConfig', {
                            ...formData.announcementConfig,
                            contentCreator: {
                              ...formData.announcementConfig?.contentCreator,
                              autoGenerate: checked
                            }
                          })}
                        />
                        <Label>Auto Generate Content</Label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Display Settings</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Display Selection Mode</Label>
                          <Select
                            value={formData.announcementConfig?.optisigns?.displaySelection?.mode || 'all'}
                            onValueChange={(value) => handleInputChange('announcementConfig', {
                              ...formData.announcementConfig,
                              optisigns: {
                                ...formData.announcementConfig?.optisigns,
                                displaySelection: {
                                  ...formData.announcementConfig?.optisigns?.displaySelection,
                                  mode: value
                                }
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Displays</SelectItem>
                              <SelectItem value="specific">Specific Displays</SelectItem>
                              <SelectItem value="group">Display Groups</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.announcementConfig?.optisigns?.displaySelection?.mode === 'specific' && (
                          <div className="space-y-2">
                            <Label>Selected Displays</Label>
                            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                              {availableDisplays.length > 0 ? (
                                <div className="space-y-2">
                                  {availableDisplays.map((display) => {
                                    const isSelected = formData.announcementConfig?.optisigns?.displaySelection?.displayIds?.includes(display.id);
                                    return (
                                      <div key={display.id} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id={`display-${display.id}`}
                                          checked={isSelected || false}
                                          onChange={(e) => {
                                            const currentDisplayIds = formData.announcementConfig?.optisigns?.displaySelection?.displayIds || [];
                                            const newDisplayIds = e.target.checked
                                              ? [...currentDisplayIds, display.id]
                                              : currentDisplayIds.filter(id => id !== display.id);
                                            
                                            handleInputChange('announcementConfig', {
                                              ...formData.announcementConfig,
                                              optisigns: {
                                                ...formData.announcementConfig?.optisigns,
                                                displaySelection: {
                                                  ...formData.announcementConfig?.optisigns?.displaySelection,
                                                  displayIds: newDisplayIds
                                                }
                                              }
                                            });
                                          }}
                                        />
                                        <label htmlFor={`display-${display.id}`} className="text-sm">
                                          {display.name} 
                                          <span className="text-gray-500 ml-1">({display.location || 'No location'})</span>
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">No displays available</p>
                              )}
                            </div>
                            {formData.announcementConfig?.optisigns?.displaySelection?.displayIds?.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {formData.announcementConfig.optisigns.displaySelection.displayIds.length} display(s) selected
                              </div>
                            )}
                          </div>
                        )}

                        {formData.announcementConfig?.optisigns?.displaySelection?.mode === 'all' && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm text-blue-800">All available displays will be used for announcements</p>
                          </div>
                        )}

                        {formData.announcementConfig?.optisigns?.displaySelection?.mode === 'group' && (
                          <div className="space-y-2">
                            <Label>Display Groups</Label>
                            <div className="p-3 bg-gray-50 border rounded">
                              <p className="text-sm text-gray-600">
                                Groups: {formData.announcementConfig?.optisigns?.displaySelection?.groupIds?.join(', ') || 'None selected'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Takeover Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select
                            value={formData.announcementConfig?.optisigns?.takeover?.priority || 'MEDIUM'}
                            onValueChange={(value) => handleInputChange('announcementConfig', {
                              ...formData.announcementConfig,
                              optisigns: {
                                ...formData.announcementConfig?.optisigns,
                                takeover: {
                                  ...formData.announcementConfig?.optisigns?.takeover,
                                  priority: value
                                }
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Duration (seconds)</Label>
                          <Input
                            type="number"
                            value={formData.announcementConfig?.optisigns?.takeover?.duration || 30}
                            onChange={(e) => handleInputChange('announcementConfig', {
                              ...formData.announcementConfig,
                              optisigns: {
                                ...formData.announcementConfig?.optisigns,
                                takeover: {
                                  ...formData.announcementConfig?.optisigns?.takeover,
                                  duration: parseInt(e.target.value) || 30
                                }
                              }
                            })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.announcementConfig?.optisigns?.takeover?.restoreAfter || false}
                          onCheckedChange={(checked) => handleInputChange('announcementConfig', {
                            ...formData.announcementConfig,
                            optisigns: {
                              ...formData.announcementConfig?.optisigns,
                              takeover: {
                                ...formData.announcementConfig?.optisigns?.takeover,
                                restoreAfter: checked
                              }
                            }
                          })}
                        />
                        <Label>Restore After Takeover</Label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Variable Mapping</h4>
                      <div className="space-y-2">
                        <Label>Variable Mapping (JSON)</Label>
                        <Textarea
                          value={JSON.stringify(formData.announcementConfig?.contentCreator?.variableMapping || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const mapping = JSON.parse(e.target.value);
                              handleInputChange('announcementConfig', {
                                ...formData.announcementConfig,
                                contentCreator: {
                                  ...formData.announcementConfig?.contentCreator,
                                  variableMapping: mapping
                                }
                              });
                            } catch (error) {
                              // Invalid JSON, ignore
                            }
                          }}
                          placeholder='{"dealAmount": "amount", "repName": "name"}'
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Test Payload */}
          <Card>
            <CardHeader>
              <CardTitle>Test Payload</CardTitle>
              <CardDescription>Configure test payload for webhook testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Test Payload (JSON)</Label>
                <Textarea
                  value={JSON.stringify(formData.testPayload || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const payload = JSON.parse(e.target.value);
                      handleInputChange('testPayload', payload);
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"phone": "5551234567", "name": "John Doe", "email": "john@example.com"}'
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/webhooks/${webhookId}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 