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
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Textarea } from '@/app/components/ui/textarea';
import { WebhookEndpoint, WebhookType } from '@/app/types/webhook';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, RefreshCw, Plus, X, Trash2 } from 'lucide-react';
import api from '@/app/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

export default function WebhookReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const webhookId = parseInt(params.id);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhook, setWebhook] = useState<WebhookEndpoint | null>(null);
  const [formData, setFormData] = useState<Partial<WebhookEndpoint>>({});
  const [availableJourneys, setAvailableJourneys] = useState<any[]>([]);

  useEffect(() => {
    fetchWebhook();
    fetchJourneys();
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

  const fetchWebhook = async () => {
    setLoading(true);
    try {
      const response = await api.webhooks.get(webhookId.toString());
      const data = response.data || response;
      setWebhook(data);
      setFormData(data);
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
          <div className="text-center">Loading webhook details...</div>
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
                    value={formData.fieldMapping?.phone || ''}
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
                    value={formData.fieldMapping?.name || ''}
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
                    value={formData.fieldMapping?.email || ''}
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

          {/* Auto Tag Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Auto Tag Rules</CardTitle>
              <CardDescription>Configure automatic tagging based on incoming data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(formData.autoTagRules || []).map((rule, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Field</Label>
                    <Input
                      value={rule.field}
                      onChange={(e) => handleAutoTagRuleChange(index, 'field', e.target.value)}
                      placeholder="Field name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select
                      value={rule.operator}
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
                      placeholder="Value to match"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tag</Label>
                    <div className="flex gap-2">
                      <Input
                        value={rule.tag}
                        onChange={(e) => handleAutoTagRuleChange(index, 'tag', e.target.value)}
                        placeholder="Tag name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAutoTagRule(index)}
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
                onClick={addAutoTagRule}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Auto Tag Rule
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

          {/* Webhook URL and Security */}
          <Card>
            <CardHeader>
              <CardTitle>Webhook URL & Security</CardTitle>
              <CardDescription>Endpoint details and security configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                    {webhook.webhookUrl || `${process.env.NEXT_PUBLIC_API_URL}/api/webhook-receiver/${webhook.endpointKey}`}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(webhook.webhookUrl || `${process.env.NEXT_PUBLIC_API_URL}/api/webhook-receiver/${webhook.endpointKey}`);
                      toast.success('Webhook URL copied to clipboard');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              {webhook.securityToken && (
                <div className="space-y-2">
                  <Label>Security Token</Label>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                      {webhook.securityToken}
                    </code>
                    <Button
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