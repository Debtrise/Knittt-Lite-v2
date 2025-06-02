'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { createWebhook, updateWebhook, getWebhookDetails } from '@/app/utils/api';
import api from '@/app/lib/api';
import { WebhookEndpoint, CreateWebhookParams, UpdateWebhookParams } from '@/app/types/webhook';
import { toast } from 'react-hot-toast';
import { Plus, X, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Journey } from '@/app/types/journey';

interface FieldMapping {
  key: string;
  value: string;
}

interface AutoTagRule {
  field: string;
  operator: string;
  value: string;
  tag: string;
}

interface RequiredHeader {
  key: string;
  value: string;
}

interface ConditionalRule {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: string;
  action: 'accept' | 'reject';
}

interface WebhookFormProps {
  webhookId?: string;
  isEdit?: boolean;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  description: string;
  brand: string;
  source: string;
  fieldMapping: {
    phone: string;
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    leadValue: string;
    notes: string;
  };
  validationRules: {
    requirePhone: boolean;
    requireName: boolean;
    requireEmail: boolean;
    allowDuplicatePhone: boolean;
  };
  autoTagRules: AutoTagRule[];
  requiredHeaders: Record<string, string>;
  autoEnrollJourneyId: string | null;
  conditionalRules: ConditionalRule | null;
}

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'textarea';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface WebhookEvent {
  id: string;
  payload: Record<string, unknown>;
  createdAt: string;
  status: 'success' | 'error';
  error?: string;
}

interface WebhookResponse {
  id: string;
  name: string;
  description: string;
  brand: string;
  source: string;
  fieldMapping: Record<string, string>;
  validationRules: {
    requirePhone: boolean;
    requireName: boolean;
    requireEmail: boolean;
    allowDuplicatePhone: boolean;
  };
  autoTagRules: Array<{
    field: string;
    value: string;
    tag: string;
  }>;
  requiredHeaders: Record<string, string>;
  autoEnrollJourneyId: string | null;
  conditionalRules: ConditionalRule | null;
  createdAt: string;
  updatedAt: string;
}

interface WebhookEventsResponse {
  events: WebhookEvent[];
  total: number;
  page: number;
  limit: number;
}

interface ApiError {
  message: string;
  code: string;
  status: number;
}

function WebhookForm({ webhookId, isEdit = false, onSuccess }: WebhookFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableJourneys, setAvailableJourneys] = useState<Journey[]>([]);
  const [availableWebhookFields, setAvailableWebhookFields] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    brand: '',
    source: '',
    fieldMapping: {
      phone: '',
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      leadValue: '',
      notes: '',
    },
    validationRules: {
      requirePhone: true,
      requireName: false,
      requireEmail: false,
      allowDuplicatePhone: false,
    },
    autoTagRules: [],
    requiredHeaders: {},
    autoEnrollJourneyId: null,
    conditionalRules: null,
  });

  // Additional state for fields that need custom handling
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([
    { key: 'phone', value: 'phone' },
    { key: 'name', value: 'full_name' },
    { key: 'email', value: 'email_address' },
  ]);
  
  const [customFieldMappings, setCustomFieldMappings] = useState<FieldMapping[]>([]);
  
  const [autoTagRules, setAutoTagRules] = useState<AutoTagRule[]>([]);
  
  const [requiredHeaders, setRequiredHeaders] = useState<RequiredHeader[]>([]);

  // New state for conditional rules
  const [conditionalRules, setConditionalRules] = useState<ConditionalRule | null>(null);

  // Available operators for conditions
  const conditionOperators = [
    { value: 'equals', label: 'Equals', dataTypes: ['string', 'number', 'boolean'] },
    { value: 'not_equals', label: 'Not Equals', dataTypes: ['string', 'number', 'boolean'] },
    { value: 'contains', label: 'Contains', dataTypes: ['string', 'array'] },
    { value: 'not_contains', label: 'Not Contains', dataTypes: ['string', 'array'] },
    { value: 'starts_with', label: 'Starts With', dataTypes: ['string'] },
    { value: 'ends_with', label: 'Ends With', dataTypes: ['string'] },
    { value: 'greater_than', label: 'Greater Than', dataTypes: ['number', 'date'] },
    { value: 'less_than', label: 'Less Than', dataTypes: ['number', 'date'] },
    { value: 'greater_than_or_equal', label: 'Greater Than or Equal', dataTypes: ['number', 'date'] },
    { value: 'less_than_or_equal', label: 'Less Than or Equal', dataTypes: ['number', 'date'] },
    { value: 'exists', label: 'Exists', dataTypes: ['string', 'number', 'boolean', 'array'] },
    { value: 'not_exists', label: 'Not Exists', dataTypes: ['string', 'number', 'boolean', 'array'] },
    { value: 'is_empty', label: 'Is Empty', dataTypes: ['string', 'array'] },
    { value: 'is_not_empty', label: 'Is Not Empty', dataTypes: ['string', 'array'] },
    { value: 'regex_match', label: 'Regex Match', dataTypes: ['string'] },
  ];

  // Available action types
  const actionTypes = [
    { value: 'create_lead', label: 'Create Lead', description: 'Create a new lead with custom field mapping' },
    { value: 'update_lead', label: 'Update Lead', description: 'Update existing leads based on search criteria' },
    { value: 'delete_lead', label: 'Delete Lead', description: 'Delete existing leads based on search criteria' },
    { value: 'send_notification', label: 'Send Notification', description: 'Send email/SMS notifications' },
    { value: 'enroll_journey', label: 'Enroll Journey', description: 'Auto-enroll leads in journeys' },
    { value: 'call_webhook', label: 'Call Webhook', description: 'Call external webhooks' },
    { value: 'set_tags', label: 'Set Tags', description: 'Add/remove tags from leads' },
    { value: 'create_task', label: 'Create Task', description: 'Create tasks and reminders' },
  ];

  // Fetch available journeys
  const fetchJourneys = async () => {
    try {
      const response = await api.journeys.list();
      console.log('Journeys API response:', response);
      
      const data = response.data || response;
      const journeysList = data.journeys || data || [];
      setAvailableJourneys(journeysList);
    } catch (error) {
      console.error('Error fetching journeys:', error);
      toast.error('Failed to load journeys');
    }
  };

  // Fetch webhook events to extract available fields
  const fetchWebhookFields = useCallback(async () => {
    if (!webhookId) return;
    
    try {
      const response = await api.webhooks.getEvents(webhookId.toString(), {
        page: 1,
        limit: 10,
      });
      
      const data = response.data as WebhookEventsResponse;
      const events = data.events;
      
      // Extract all unique field names from webhook payloads
      const fieldSet = new Set<string>();
      
      events.forEach((event) => {
        if (event.payload && typeof event.payload === 'object') {
          extractFieldNames(event.payload, '', fieldSet);
        }
      });
      
      // Convert to sorted array
      const fields = Array.from(fieldSet).sort();
      console.log('Extracted webhook fields:', fields);
      setAvailableWebhookFields(fields);
    } catch (error) {
      console.error('Error fetching webhook events:', error);
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to fetch webhook fields');
    }
  }, [webhookId]);

  // Recursively extract field names from nested objects
  const extractFieldNames = (obj: any, prefix: string, fieldSet: Set<string>) => {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      fieldSet.add(fullKey);
      
      // If the value is an object (but not an array), recurse
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        extractFieldNames(obj[key], fullKey, fieldSet);
      }
    });
  };

  const fetchWebhook = useCallback(async () => {
    if (!webhookId) return;
    
    try {
      const response = await api.webhooks.get(webhookId.toString());
      const data = response.data as WebhookResponse;
      
      console.log('Fetched webhook data:', data);
      
      // Map API response to form data
      setFormData({
        name: data.name || '',
        description: data.description || '',
        brand: data.brand || '',
        source: data.source || '',
        fieldMapping: {
          phone: data.fieldMapping?.phone || '',
          name: data.fieldMapping?.name || '',
          email: data.fieldMapping?.email || '',
          address: data.fieldMapping?.address || '',
          city: data.fieldMapping?.city || '',
          state: data.fieldMapping?.state || '',
          zip: data.fieldMapping?.zip || '',
          leadValue: data.fieldMapping?.leadValue || '',
          notes: data.fieldMapping?.notes || '',
        },
        validationRules: {
          requirePhone: data.validationRules?.requirePhone ?? true,
          requireName: data.validationRules?.requireName ?? false,
          requireEmail: data.validationRules?.requireEmail ?? false,
          allowDuplicatePhone: data.validationRules?.allowDuplicatePhone ?? false,
        },
        autoTagRules: data.autoTagRules || [],
        requiredHeaders: data.requiredHeaders || {},
        autoEnrollJourneyId: data.autoEnrollJourneyId || null,
        conditionalRules: data.conditionalRules || null,
      });

      // Populate fieldMappings state from the fetched data
      if (data.fieldMapping) {
        const baseMappings = [
          { key: 'phone', value: data.fieldMapping.phone || 'phone' },
          { key: 'name', value: data.fieldMapping.name || 'full_name' },
          { key: 'email', value: data.fieldMapping.email || 'email_address' },
        ];
        setFieldMappings(baseMappings);
        
        // Set custom field mappings for any additional fields
        const customFields = Object.entries(data.fieldMapping)
          .filter(([key]) => !['phone', 'name', 'email'].includes(key))
          .map(([key, value]) => ({ key, value: value as string }));
        setCustomFieldMappings(customFields);
      }

      // Populate autoTagRules state
      if (data.autoTagRules) {
        setAutoTagRules(data.autoTagRules);
      }

      // Populate requiredHeaders state
      if (data.requiredHeaders) {
        const headerEntries = Object.entries(data.requiredHeaders)
          .map(([key, value]) => ({ key, value: value as string }));
        setRequiredHeaders(headerEntries);
      }

      // Load conditional rules if they exist
      if (data.conditionalRules) {
        setConditionalRules(data.conditionalRules);
      }
    } catch (error) {
      console.error('Error fetching webhook:', error);
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to load webhook');
    } finally {
      setLoading(false);
    }
  }, [webhookId]);

  useEffect(() => {
    if (webhookId) {
      fetchWebhook();
      fetchWebhookFields();
    }
  }, [webhookId, fetchWebhook, fetchWebhookFields]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleValidationRuleChange = (name: keyof FormData['validationRules'], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      validationRules: {
        ...prev.validationRules,
        [name]: checked,
      },
    }));
  };

  const handleFieldMappingChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      fieldMapping: {
        ...prev.fieldMapping,
        [key]: value,
      },
    }));
  };

  const handleAddCustomField = () => {
    setCustomFieldMappings(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFieldMappings(prev => prev.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (index: number, field: keyof FieldMapping, value: string) => {
    setCustomFieldMappings(prev => {
      const newMappings = [...prev];
      newMappings[index] = { ...newMappings[index], [field]: value };
      return newMappings;
    });
  };

  const handleAutoTagRuleChange = (index: number, field: keyof AutoTagRule, value: string) => {
    setAutoTagRules(prev => {
      const newRules = [...prev];
      newRules[index] = { ...newRules[index], [field]: value };
      return newRules;
    });
  };

  const handleAddAutoTagRule = () => {
    setAutoTagRules(prev => [...prev, { field: '', value: '', tag: '' }]);
  };

  const handleRemoveAutoTagRule = (index: number) => {
    setAutoTagRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleRequiredHeaderChange = (index: number, field: keyof RequiredHeader, value: string) => {
    setRequiredHeaders(prev => {
      const newHeaders = [...prev];
      newHeaders[index] = { ...newHeaders[index], [field]: value };
      return newHeaders;
    });
  };

  const handleAddRequiredHeader = () => {
    setRequiredHeaders(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveRequiredHeader = (index: number) => {
    setRequiredHeaders(prev => prev.filter((_, i) => i !== index));
  };

  const handleConditionalRuleChange = (field: keyof ConditionalRule, value: string) => {
    setConditionalRules(prev => {
      if (!prev) {
        return {
          field: '',
          operator: 'equals',
          value: '',
          action: 'accept',
          [field]: value,
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        source: formData.source,
        fieldMapping: formData.fieldMapping,
        validationRules: formData.validationRules,
        autoTagRules: formData.autoTagRules.map(rule => ({
          field: rule.field,
          operator: rule.operator,
          value: rule.value,
          tag: rule.tag
        })),
        requiredHeaders: formData.requiredHeaders,
        autoEnrollJourneyId: formData.autoEnrollJourneyId,
        conditionalRules: formData.conditionalRules
      };

      if (isEdit && webhookId) {
        await api.webhooks.update(webhookId, payload);
        toast.success('Webhook updated successfully');
      } else {
        await api.webhooks.create(payload);
        toast.success('Webhook created successfully');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/webhooks');
      }
    } catch (error) {
      console.error('Error saving webhook:', error);
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to save webhook');
    } finally {
      setLoading(false);
    }
  };

  const formFields: FormField[] = [
    {
      key: 'name',
      label: 'Webhook Name',
      type: 'text',
      placeholder: 'Enter webhook name',
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter webhook description',
    },
    {
      key: 'brand',
      label: 'Brand',
      type: 'text',
      placeholder: 'Enter brand name',
    },
    {
      key: 'source',
      label: 'Source',
      type: 'text',
      placeholder: 'Enter source name',
    },
  ];

  const validationFields: FormField[] = [
    {
      key: 'requirePhone',
      label: 'Require Phone Number',
      type: 'select',
      options: [
        { value: 'true', label: 'Required' },
        { value: 'false', label: 'Optional' },
      ],
    },
    {
      key: 'requireName',
      label: 'Require Name',
      type: 'select',
      options: [
        { value: 'true', label: 'Required' },
        { value: 'false', label: 'Optional' },
      ],
    },
    {
      key: 'requireEmail',
      label: 'Require Email',
      type: 'select',
      options: [
        { value: 'true', label: 'Required' },
        { value: 'false', label: 'Optional' },
      ],
    },
    {
      key: 'allowDuplicatePhone',
      label: 'Allow Duplicate Phone Numbers',
      type: 'select',
      options: [
        { value: 'true', label: 'Allow' },
        { value: 'false', label: 'Prevent' },
      ],
    },
  ];

  const renderFormField = (field: FormField) => {
    switch (field.type) {
      case 'select':
        return (
          <Select
            value={formData[field.key as keyof FormData]?.toString() || ''}
            onValueChange={(value) => handleInputChange({ target: { name: field.key, value } } as React.ChangeEvent<HTMLInputElement>)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return (
          <Textarea
            name={field.key}
            value={formData[field.key as keyof FormData]?.toString() || ''}
            onChange={handleInputChange}
            placeholder={field.placeholder}
          />
        );
      default:
        return (
          <Input
            name={field.key}
            value={formData[field.key as keyof FormData]?.toString() || ''}
            onChange={handleInputChange}
            placeholder={field.placeholder}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Loading webhook data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {formFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              {renderFormField(field)}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field Mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {fieldMappings.map((mapping) => (
            <div key={mapping.key} className="space-y-2">
              <Label htmlFor={mapping.key}>{mapping.key}</Label>
              <Input
                value={mapping.value}
                onChange={(e) => handleFieldMappingChange(mapping.key, e.target.value)}
                placeholder={`Path to ${mapping.key} field in webhook data`}
                required
              />
            </div>
          ))}

          {customFieldMappings.map((mapping, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={mapping.key}
                onChange={(e) => handleCustomFieldChange(index, 'key', e.target.value)}
                placeholder="Custom field name"
              />
              <Input
                value={mapping.value}
                onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                placeholder="Path to field in webhook data"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCustomField(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCustomField}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Field
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {validationFields.map((field) => (
            <div key={field.key} className="flex items-center justify-between">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Switch
                id={field.key}
                checked={formData.validationRules[field.key as keyof FormData['validationRules']]}
                onCheckedChange={(checked) => handleValidationRuleChange(field.key as keyof FormData['validationRules'], checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto Tag Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {autoTagRules.map((rule, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={rule.field}
                onChange={(e) => handleAutoTagRuleChange(index, 'field', e.target.value)}
                placeholder="Field name"
              />
              <Input
                value={rule.value}
                onChange={(e) => handleAutoTagRuleChange(index, 'value', e.target.value)}
                placeholder="Field value"
              />
              <Input
                value={rule.tag}
                onChange={(e) => handleAutoTagRuleChange(index, 'tag', e.target.value)}
                placeholder="Tag to apply"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveAutoTagRule(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAutoTagRule}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tag Rule
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required Headers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {requiredHeaders.map((header, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={header.key}
                onChange={(e) => handleRequiredHeaderChange(index, 'key', e.target.value)}
                placeholder="Header name (e.g., X-API-Version)"
              />
              <Input
                value={header.value}
                onChange={(e) => handleRequiredHeaderChange(index, 'value', e.target.value)}
                placeholder="Header value"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveRequiredHeader(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRequiredHeader}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Header
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conditional Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="enableConditionalRules"
              checked={conditionalRules !== null}
              onCheckedChange={(checked) => 
                setConditionalRules(checked ? { field: '', operator: 'equals', value: '', action: 'accept' } : null)
              }
            />
            <Label htmlFor="enableConditionalRules">Enable Conditional Rules</Label>
          </div>

          {conditionalRules && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={conditionalRules.field}
                  onChange={(e) => handleConditionalRuleChange('field', e.target.value)}
                  placeholder="Field name"
                />
                <Select
                  value={conditionalRules.operator}
                  onValueChange={(value: ConditionalRule['operator']) => 
                    handleConditionalRuleChange('operator', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">equals</SelectItem>
                    <SelectItem value="contains">contains</SelectItem>
                    <SelectItem value="startsWith">starts with</SelectItem>
                    <SelectItem value="endsWith">ends with</SelectItem>
                    <SelectItem value="greaterThan">greater than</SelectItem>
                    <SelectItem value="lessThan">less than</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={conditionalRules.value}
                  onChange={(e) => handleConditionalRuleChange('value', e.target.value)}
                  placeholder="Value"
                />
                <Select
                  value={conditionalRules.action}
                  onValueChange={(value: ConditionalRule['action']) => 
                    handleConditionalRuleChange('action', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accept">Accept</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/webhooks')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Webhook' : 'Create Webhook'}
        </Button>
      </div>
    </form>
  );
}

export default WebhookForm; 