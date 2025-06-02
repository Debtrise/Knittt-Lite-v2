'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
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

type WebhookFormProps = {
  webhookId?: number;
  isEdit?: boolean;
  onSuccess?: (webhook: any) => void;
};

interface Journey {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export default function WebhookForm({ webhookId, isEdit = false, onSuccess }: WebhookFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [availableJourneys, setAvailableJourneys] = useState<Journey[]>([]);
  const [availableWebhookFields, setAvailableWebhookFields] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateWebhookParams>({
    name: '',
    description: '',
    brand: '',
    source: '',
    fieldMapping: {
      phone: 'phone',
      name: 'full_name',
      email: 'email_address',
    },
    validationRules: {
      requirePhone: true,
      requireName: false,
      requireEmail: false,
      allowDuplicatePhone: false,
    },
    autoTagRules: [
      {
        field: 'source',
        operator: 'equals',
        value: 'website',
        tag: 'web-lead',
      },
    ],
  });

  // Additional state for fields that need custom handling
  const [fieldMappings, setFieldMappings] = useState<Array<{ key: string; value: string }>>([
    { key: 'phone', value: 'phone' },
    { key: 'name', value: 'full_name' },
    { key: 'email', value: 'email_address' },
  ]);
  
  const [customFieldMappings, setCustomFieldMappings] = useState<Array<{ key: string; value: string }>>([]);
  
  const [autoTagRules, setAutoTagRules] = useState<
    Array<{
      field: string;
      operator: 'equals' | 'contains' | 'exists';
      value?: string;
      tag: string;
    }>
  >([
    {
      field: 'source',
      operator: 'equals',
      value: 'website',
      tag: 'web-lead',
    },
  ]);
  
  const [requiredHeaders, setRequiredHeaders] = useState<Array<{ key: string; value: string }>>([]);

  // New state for conditional rules
  const [conditionalRules, setConditionalRules] = useState({
    enabled: false,
    logicOperator: 'AND' as 'AND' | 'OR',
    conditionSets: [] as Array<{
      name: string;
      conditions: Array<{
        field: string;
        operator: string;
        value: any;
        dataType: 'string' | 'number' | 'boolean' | 'date' | 'array';
      }>;
      actions: Array<{
        type: 'create_lead' | 'update_lead' | 'delete_lead' | 'send_notification' | 'enroll_journey' | 'call_webhook' | 'set_tags' | 'create_task';
        config: Record<string, any>;
      }>;
    }>
  });

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
  const fetchWebhookFields = async () => {
    if (!webhookId) return;
    
    try {
      const response = await api.webhooks.getEvents(webhookId.toString(), {
        page: 1,
        limit: 10, // Get recent events to analyze fields
      });
      
      const data = response.data || response;
      const events = data.events || data || [];
      
      // Extract all unique field names from webhook payloads
      const fieldSet = new Set<string>();
      
      events.forEach((event: any) => {
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
      // Don't show error toast as this is not critical
    }
  };

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

  const fetchWebhook = async () => {
    if (!webhookId) return;
    
    try {
      const response = await api.webhooks.get(webhookId.toString());
      const data = response.data || response;
      
      console.log('Fetched webhook data:', data); // Debug log
      
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
      toast.error('Failed to load webhook');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch journeys when component mounts
    fetchJourneys();
    
    if (isEdit && webhookId) {
      fetchWebhook();
      fetchWebhookFields(); // Fetch available fields from webhook events
    } else {
      // If not in edit mode, set loading to false
      setLoading(false);
    }
  }, [isEdit, webhookId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleValidationRuleChange = (name: keyof typeof formData.validationRules, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      validationRules: {
        ...prev.validationRules,
        [name]: checked,
      },
    }));
  };

  const handleFieldMappingChange = (index: number, key: string, value: string) => {
    const newMappings = [...fieldMappings];
    if (key !== '') {
      newMappings[index] = { key, value };
    }
    setFieldMappings(newMappings);
    
    // Update the main form data
    const mappingObject = newMappings.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const customMappingObject = customFieldMappings.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    setFormData(prev => ({
      ...prev,
      fieldMapping: {
        ...mappingObject,
        ...customMappingObject,
      },
    }));
  };

  const addCustomFieldMapping = () => {
    setCustomFieldMappings([...customFieldMappings, { key: '', value: '' }]);
  };

  const handleCustomFieldMappingChange = (index: number, key: string, value: string) => {
    const newMappings = [...customFieldMappings];
    newMappings[index] = { key, value };
    setCustomFieldMappings(newMappings);
    
    // Update the main form data
    const mappingObject = fieldMappings.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const customMappingObject = newMappings.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    setFormData(prev => ({
      ...prev,
      fieldMapping: {
        ...mappingObject,
        ...customMappingObject,
      },
    }));
  };

  const removeCustomFieldMapping = (index: number) => {
    const newMappings = [...customFieldMappings];
    newMappings.splice(index, 1);
    setCustomFieldMappings(newMappings);
    
    // Update the main form data
    const mappingObject = fieldMappings.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const customMappingObject = newMappings.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    setFormData(prev => ({
      ...prev,
      fieldMapping: {
        ...mappingObject,
        ...customMappingObject,
      },
    }));
  };

  const handleAutoTagRuleChange = (index: number, field: string, value: any) => {
    const newRules = [...autoTagRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setAutoTagRules(newRules);
    
    // Update the main form data
    setFormData(prev => ({
      ...prev,
      autoTagRules: newRules,
    }));
  };

  const addAutoTagRule = () => {
    setAutoTagRules([
      ...autoTagRules,
      {
        field: '',
        operator: 'equals',
        value: '',
        tag: '',
      },
    ]);
  };

  const removeAutoTagRule = (index: number) => {
    const newRules = [...autoTagRules];
    newRules.splice(index, 1);
    setAutoTagRules(newRules);
    
    // Update the main form data
    setFormData(prev => ({
      ...prev,
      autoTagRules: newRules,
    }));
  };

  const handleRequiredHeaderChange = (index: number, key: string, value: string) => {
    const newHeaders = [...requiredHeaders];
    newHeaders[index] = { key, value };
    setRequiredHeaders(newHeaders);
    
    // Update the main form data
    const headersObject = newHeaders.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    setFormData(prev => ({
      ...prev,
      requiredHeaders: headersObject,
    }));
  };

  const addRequiredHeader = () => {
    setRequiredHeaders([...requiredHeaders, { key: '', value: '' }]);
  };

  const removeRequiredHeader = (index: number) => {
    const newHeaders = [...requiredHeaders];
    newHeaders.splice(index, 1);
    setRequiredHeaders(newHeaders);
    
    // Update the main form data
    const headersObject = newHeaders.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    setFormData(prev => ({
      ...prev,
      requiredHeaders: headersObject,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      const cleanedFieldMapping = Object.fromEntries(
        Object.entries(formData.fieldMapping || {})
          .filter(([_, v]) => typeof v === 'string' && v !== undefined && v !== '')
      );
      const cleanedAutoTagRules = (formData.autoTagRules || []).map(rule => ({
        ...rule,
        value: typeof rule.value === 'string' ? rule.value : ''
      }));
      const submitData = {
        ...formData,
        fieldMapping: cleanedFieldMapping as Record<string, string>,
        autoTagRules: cleanedAutoTagRules,
        autoEnrollJourneyId: formData.autoEnrollJourneyId == null ? null : formData.autoEnrollJourneyId,
        conditionalRules: conditionalRules.enabled ? conditionalRules : null,
      };

      let response;
      if (webhookId) {
        response = await api.webhooks.update(webhookId.toString(), submitData);
        toast.success('Webhook updated successfully');
      } else {
        response = await api.webhooks.create(submitData);
        toast.success('Webhook created successfully');
      }

      if (onSuccess) {
        onSuccess(response.data || response);
      }
    } catch (error: any) {
      console.error('Error saving webhook:', error);
      toast.error(error.response?.data?.error || 'Failed to save webhook');
    } finally {
      setSaving(false);
    }
  };

  const validateForm = () => {
    // Implement form validation logic here
    return true; // Placeholder return, actual implementation needed
  };

  // Conditional rules handlers
  const addConditionSet = () => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: [
        ...prev.conditionSets,
        {
          name: `Condition Set ${prev.conditionSets.length + 1}`,
          conditions: [{
            field: '',
            operator: 'equals',
            value: '',
            dataType: 'string'
          }],
          actions: []
        }
      ]
    }));
  };

  const removeConditionSet = (index: number) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.filter((_, i) => i !== index)
    }));
  };

  const updateConditionSet = (index: number, field: string, value: any) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === index ? { ...set, [field]: value } : set
      )
    }));
  };

  const addCondition = (setIndex: number) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === setIndex 
          ? {
              ...set,
              conditions: [
                ...set.conditions,
                {
                  field: '',
                  operator: 'equals',
                  value: '',
                  dataType: 'string'
                }
              ]
            }
          : set
      )
    }));
  };

  const removeCondition = (setIndex: number, conditionIndex: number) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === setIndex 
          ? {
              ...set,
              conditions: set.conditions.filter((_, ci) => ci !== conditionIndex)
            }
          : set
      )
    }));
  };

  const updateCondition = (setIndex: number, conditionIndex: number, field: string, value: any) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === setIndex 
          ? {
              ...set,
              conditions: set.conditions.map((condition, ci) => 
                ci === conditionIndex ? { ...condition, [field]: value } : condition
              )
            }
          : set
      )
    }));
  };

  const addAction = (setIndex: number) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === setIndex 
          ? {
              ...set,
              actions: [
                ...set.actions,
                {
                  type: 'create_lead',
                  config: {}
                }
              ]
            }
          : set
      )
    }));
  };

  const removeAction = (setIndex: number, actionIndex: number) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === setIndex 
          ? {
              ...set,
              actions: set.actions.filter((_, ai) => ai !== actionIndex)
            }
          : set
      )
    }));
  };

  const updateAction = (setIndex: number, actionIndex: number, field: string, value: any) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === setIndex 
          ? {
              ...set,
              actions: set.actions.map((action, ai) => 
                ai === actionIndex 
                  ? field === 'type' 
                    ? { type: value, config: {} }
                    : { ...action, [field]: value }
                  : action
              )
            }
          : set
      )
    }));
  };

  const getActionConfigFields = (actionType: string) => {
    switch (actionType) {
      case 'create_lead':
        return [
          { key: 'brand', label: 'Brand', type: 'text', placeholder: 'Override brand' },
          { key: 'source', label: 'Source', type: 'text', placeholder: 'Override source' },
        ];
      case 'update_lead':
        return [
          { key: 'searchField', label: 'Search Field', type: 'select', options: [
            { value: 'phone', label: 'Phone Number' },
            { value: 'email', label: 'Email Address' },
            { value: 'id', label: 'Lead ID' }
          ]},
          { key: 'searchValue', label: 'Search Value', type: 'text', placeholder: 'Use {{field}} for dynamic values' },
          { key: 'updateFields', label: 'Update Fields', type: 'textarea', placeholder: '{"status": "updated", "notes": "Updated via webhook"}' },
        ];
      case 'delete_lead':
        return [
          { key: 'searchField', label: 'Search Field', type: 'select', options: [
            { value: 'phone', label: 'Phone Number' },
            { value: 'email', label: 'Email Address' },
            { value: 'id', label: 'Lead ID' },
            { value: 'brand', label: 'Brand' },
            { value: 'source', label: 'Source' }
          ]},
          { key: 'searchValue', label: 'Search Value', type: 'text', placeholder: 'Use {{field}} for dynamic values from webhook' },
          { key: 'confirmationRequired', label: 'Require Confirmation', type: 'select', options: [
            { value: 'false', label: 'Delete Immediately' },
            { value: 'true', label: 'Mark for Deletion (Requires Manual Confirmation)' }
          ]},
          { key: 'reason', label: 'Deletion Reason', type: 'text', placeholder: 'Unsubscribed via webhook' },
        ];
      case 'enroll_journey':
        return [
          { key: 'journeyId', label: 'Journey', type: 'select', options: availableJourneys.map(j => ({ value: j.id, label: j.name })) },
          { key: 'priority', label: 'Priority', type: 'select', options: [
            { value: 'low', label: 'Low' },
            { value: 'normal', label: 'Normal' },
            { value: 'high', label: 'High' },
            { value: 'immediate', label: 'Immediate' }
          ]},
        ];
      case 'send_notification':
        return [
          { key: 'recipients', label: 'Recipients', type: 'text', placeholder: 'email1@example.com,email2@example.com' },
          { key: 'subject', label: 'Subject', type: 'text', placeholder: 'New lead: {{name}}' },
          { key: 'message', label: 'Message', type: 'textarea', placeholder: 'New lead received: {{name}} ({{phone}})' },
          { key: 'type', label: 'Type', type: 'select', options: [
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' }
          ]},
        ];
      case 'set_tags':
        return [
          { key: 'operation', label: 'Operation', type: 'select', options: [
            { value: 'add', label: 'Add Tags' },
            { value: 'remove', label: 'Remove Tags' }
          ]},
          { key: 'tags', label: 'Tags', type: 'text', placeholder: 'tag1,tag2,tag3' },
        ];
      case 'call_webhook':
        return [
          { key: 'url', label: 'Webhook URL', type: 'text', placeholder: 'https://api.example.com/webhook' },
          { key: 'method', label: 'Method', type: 'select', options: [
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'PATCH', label: 'PATCH' }
          ]},
          { key: 'headers', label: 'Headers', type: 'textarea', placeholder: '{"Authorization": "Bearer token"}' },
        ];
      case 'create_task':
        return [
          { key: 'title', label: 'Task Title', type: 'text', placeholder: 'Follow up with {{name}}' },
          { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Contact lead about {{subject}}' },
          { key: 'dueDate', label: 'Due Date', type: 'text', placeholder: '+1d (1 day from now)' },
          { key: 'assignee', label: 'Assignee', type: 'text', placeholder: 'user@example.com' },
        ];
      default:
        return [];
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the basic details for your webhook endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="CRM Integration"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Receives leads from our CRM system"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="Tax Relief"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source">Source *</Label>
                <Input
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  placeholder="CRM"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Field Mapping</CardTitle>
          <CardDescription>
            Map fields from the incoming webhook data to lead fields.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Use dot notation for nested fields (e.g., contact.phoneNumber)
            </p>
            
            {/* Required field mappings */}
            {fieldMappings.map((mapping, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-1">
                  <Label>{mapping.key} *</Label>
                </div>
                <div className="md:col-span-2">
                  <Input
                    value={mapping.value}
                    onChange={(e) => handleFieldMappingChange(index, mapping.key, e.target.value)}
                    placeholder={`Path to ${mapping.key} field in webhook data`}
                    required
                  />
                </div>
              </div>
            ))}
            
            {/* Custom field mappings */}
            {customFieldMappings.map((mapping, index) => (
              <div key={`custom-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-1">
                  <Input
                    value={mapping.key}
                    onChange={(e) => handleCustomFieldMappingChange(index, e.target.value, mapping.value)}
                    placeholder="Custom field name"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Input
                    value={mapping.value}
                    onChange={(e) => handleCustomFieldMappingChange(index, mapping.key, e.target.value)}
                    placeholder="Path to field in webhook data"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => removeCustomFieldMapping(index)}
                  >
                    &times;
                  </Button>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomFieldMapping}
            >
              + Add Custom Field
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Validation Rules</CardTitle>
          <CardDescription>
            Configure validation rules for incoming webhook data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requirePhone"
                checked={formData.validationRules.requirePhone}
                onCheckedChange={(checked) => 
                  handleValidationRuleChange('requirePhone', checked as boolean)
                }
              />
              <Label htmlFor="requirePhone">Require phone number</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireName"
                checked={formData.validationRules.requireName}
                onCheckedChange={(checked) => 
                  handleValidationRuleChange('requireName', checked as boolean)
                }
              />
              <Label htmlFor="requireName">Require name</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireEmail"
                checked={formData.validationRules.requireEmail}
                onCheckedChange={(checked) => 
                  handleValidationRuleChange('requireEmail', checked as boolean)
                }
              />
              <Label htmlFor="requireEmail">Require email</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowDuplicatePhone"
                checked={formData.validationRules.allowDuplicatePhone}
                onCheckedChange={(checked) => 
                  handleValidationRuleChange('allowDuplicatePhone', checked as boolean)
                }
              />
              <Label htmlFor="allowDuplicatePhone">Allow duplicate phone numbers</Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Auto-Tag Rules</CardTitle>
          <CardDescription>
            Automatically add tags to leads based on webhook data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {autoTagRules.map((rule, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div className="space-y-2 md:col-span-1">
                <Label>Field</Label>
                <Input
                  value={rule.field}
                  onChange={(e) => handleAutoTagRuleChange(index, 'field', e.target.value)}
                  placeholder="source"
                />
              </div>
              
              <div className="space-y-2 md:col-span-1">
                <Label>Operator</Label>
                <select
                  value={rule.operator}
                  onChange={(e) => handleAutoTagRuleChange(index, 'operator', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900"
                >
                  <option value="equals">equals</option>
                  <option value="contains">contains</option>
                  <option value="exists">exists</option>
                </select>
              </div>
              
              {rule.operator !== 'exists' && (
                <div className="space-y-2 md:col-span-1">
                  <Label>Value</Label>
                  <Input
                    value={rule.value || ''}
                    onChange={(e) => handleAutoTagRuleChange(index, 'value', e.target.value)}
                    placeholder="website"
                  />
                </div>
              )}
              
              <div className="space-y-2 md:col-span-1">
                <Label>Tag</Label>
                <Input
                  value={rule.tag}
                  onChange={(e) => handleAutoTagRuleChange(index, 'tag', e.target.value)}
                  placeholder="web-lead"
                />
              </div>
              
              <div className="flex items-end md:col-span-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => removeAutoTagRule(index)}
                >
                  &times;
                </Button>
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAutoTagRule}
          >
            + Add Tag Rule
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>
            Configure security and additional options for your webhook.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="autoEnrollJourneyId">Auto-Enroll Journey</Label>
            <Select
              value={formData.autoEnrollJourneyId ? formData.autoEnrollJourneyId.toString() : 'none'}
              onValueChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  autoEnrollJourneyId: value === 'none' ? null : parseInt(value, 10)
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a journey (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None - No auto-enrollment</SelectItem>
                {availableJourneys.map((journey) => (
                  <SelectItem key={journey.id} value={journey.id.toString()}>
                    {journey.name} {!journey.isActive && '(Inactive)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              If selected, leads created from this webhook will be automatically enrolled in the specified journey.
            </p>
          </div>
          
          <div className="space-y-2 pt-4">
            <div className="flex justify-between items-center">
              <Label>Required Headers</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRequiredHeader}
              >
                + Add Header
              </Button>
            </div>
            
            {requiredHeaders.map((header, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-1">
                  <Input
                    value={header.key}
                    onChange={(e) => handleRequiredHeaderChange(index, e.target.value, header.value)}
                    placeholder="Header name (e.g., X-API-Version)"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Input
                    value={header.value}
                    onChange={(e) => handleRequiredHeaderChange(index, header.key, e.target.value)}
                    placeholder="Required value"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => removeRequiredHeader(index)}
                  >
                    &times;
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Conditional Rules & Actions</CardTitle>
          <CardDescription>
            Set up advanced conditional logic to automatically execute actions when specific conditions are met.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="enableConditionalRules"
              checked={conditionalRules.enabled}
              onCheckedChange={(checked) => 
                setConditionalRules(prev => ({ ...prev, enabled: checked as boolean }))
              }
            />
            <div>
              <Label htmlFor="enableConditionalRules" className="text-base font-medium">
                Enable Conditional Processing
              </Label>
              <p className="text-sm text-gray-500">
                When enabled, webhook data will be processed through conditional rules before creating leads
              </p>
            </div>
          </div>

          {conditionalRules.enabled && (
            <div className="space-y-6 border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Logic Operator</h4>
                  <p className="text-xs text-gray-500">How condition sets should be evaluated</p>
                </div>
                <Select
                  value={conditionalRules.logicOperator}
                  onValueChange={(value: 'AND' | 'OR') => 
                    setConditionalRules(prev => ({ ...prev, logicOperator: value }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Condition Sets</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addConditionSet}
                  >
                    + Add Condition Set
                  </Button>
                </div>

                {conditionalRules.conditionSets.map((conditionSet, setIndex) => (
                  <Card key={setIndex} className="border-2 border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Input
                          value={conditionSet.name}
                          onChange={(e) => updateConditionSet(setIndex, 'name', e.target.value)}
                          placeholder="Condition Set Name"
                          className="max-w-md"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => removeConditionSet(setIndex)}
                        >
                          Remove Set
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Conditions */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <h5 className="text-sm font-medium">Conditions</h5>
                            {availableWebhookFields.length > 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                {availableWebhookFields.length} fields available
                              </span>
                            )}
                            {isEdit && webhookId && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={fetchWebhookFields}
                                className="text-xs px-2 py-1 h-6"
                                title="Refresh available fields from recent webhook events"
                              >
                                ↻
                              </Button>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addCondition(setIndex)}
                          >
                            + Add Condition
                          </Button>
                        </div>

                        {availableWebhookFields.length > 0 && (
                          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700">
                              💡 Field names are populated from recent webhook data. Select from dropdown or enter custom field names.
                            </p>
                          </div>
                        )}

                        {conditionSet.conditions.map((condition, conditionIndex) => (
                          <div key={conditionIndex} className="grid grid-cols-12 gap-2 items-center mb-2 p-3 bg-gray-50 rounded-lg">
                            <div className="col-span-3">
                              {availableWebhookFields.length > 0 ? (
                                <div className="space-y-1">
                                  <Select
                                    value={availableWebhookFields.includes(condition.field) ? condition.field : '__manual__'}
                                    onValueChange={(value) => {
                                      if (value === '__manual__') {
                                        updateCondition(setIndex, conditionIndex, 'field', '');
                                      } else {
                                        updateCondition(setIndex, conditionIndex, 'field', value);
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select field from webhook data" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-48 overflow-y-auto">
                                      <SelectItem value="__manual__">
                                        <span className="text-gray-500">Manual entry...</span>
                                      </SelectItem>
                                      {availableWebhookFields.map(field => (
                                        <SelectItem key={field} value={field}>
                                          <code className="text-xs bg-gray-100 px-1 rounded">{field}</code>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {!availableWebhookFields.includes(condition.field) && (
                                    <Input
                                      placeholder="Enter custom field name"
                                      value={condition.field}
                                      onChange={(e) => updateCondition(setIndex, conditionIndex, 'field', e.target.value)}
                                    />
                                  )}
                                </div>
                              ) : (
                                <Input
                                  placeholder="Field (e.g., budget)"
                                  value={condition.field}
                                  onChange={(e) => updateCondition(setIndex, conditionIndex, 'field', e.target.value)}
                                />
                              )}
                            </div>
                            <div className="col-span-2">
                              <Select
                                value={condition.dataType}
                                onValueChange={(value) => updateCondition(setIndex, conditionIndex, 'dataType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="array">Array</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <Select
                                value={condition.operator}
                                onValueChange={(value) => updateCondition(setIndex, conditionIndex, 'operator', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {conditionOperators
                                    .filter(op => op.dataTypes.includes(condition.dataType))
                                    .map(op => (
                                      <SelectItem key={op.value} value={op.value}>
                                        {op.label}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-4">
                              {['exists', 'not_exists', 'is_empty', 'is_not_empty'].includes(condition.operator) ? (
                                <div className="text-sm text-gray-500 italic">No value required</div>
                              ) : (
                                <Input
                                  placeholder="Value"
                                  value={condition.value}
                                  onChange={(e) => {
                                    let value = e.target.value;
                                    updateCondition(setIndex, conditionIndex, 'value', value);
                                  }}
                                />
                              )}
                            </div>
                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => removeCondition(setIndex, conditionIndex)}
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium">Actions</h5>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addAction(setIndex)}
                          >
                            + Add Action
                          </Button>
                        </div>

                        {conditionSet.actions.map((action, actionIndex) => (
                          <div key={actionIndex} className={`border rounded-lg p-4 space-y-3 ${
                            action.type === 'delete_lead' 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-blue-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <Select
                                value={action.type}
                                onValueChange={(value) => updateAction(setIndex, actionIndex, 'type', value)}
                              >
                                <SelectTrigger className="max-w-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {actionTypes.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => removeAction(setIndex, actionIndex)}
                              >
                                Remove Action
                              </Button>
                            </div>

                            {action.type === 'delete_lead' && (
                              <div className="flex items-center space-x-2 p-2 bg-red-100 border border-red-300 rounded">
                                <span className="text-red-600 font-bold">⚠️</span>
                                <span className="text-xs text-red-700 font-medium">
                                  WARNING: This action will permanently delete leads from your system. Use with caution.
                                </span>
                              </div>
                            )}

                            <div className={`text-xs ${
                              action.type === 'delete_lead' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {actionTypes.find(t => t.value === action.type)?.description}
                            </div>

                            {/* Action Configuration */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {getActionConfigFields(action.type).map(field => (
                                <div key={field.key} className="space-y-1">
                                  <Label className="text-xs">{field.label}</Label>
                                  {field.type === 'select' ? (
                                    <Select
                                      value={action.config[field.key] || ''}
                                      onValueChange={(value) => {
                                        const newConfig = { ...action.config, [field.key]: value };
                                        updateAction(setIndex, actionIndex, 'config', newConfig);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder={`Select ${field.label}`} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {field.options?.map(option => (
                                          <SelectItem key={option.value} value={option.value.toString()}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : field.type === 'textarea' ? (
                                    'placeholder' in field ? (
                                      <textarea
                                        className="w-full p-2 text-xs border rounded resize-none"
                                        rows={2}
                                        placeholder={field.placeholder}
                                        value={action.config[field.key] || ''}
                                        onChange={(e) => {
                                          const newConfig = { ...action.config, [field.key]: e.target.value };
                                          updateAction(setIndex, actionIndex, 'config', newConfig);
                                        }}
                                      />
                                    ) : (
                                      <textarea
                                        className="w-full p-2 text-xs border rounded resize-none"
                                        rows={2}
                                        value={action.config[field.key] || ''}
                                        onChange={(e) => {
                                          const newConfig = { ...action.config, [field.key]: e.target.value };
                                          updateAction(setIndex, actionIndex, 'config', newConfig);
                                        }}
                                      />
                                    )
                                  ) : (
                                    'placeholder' in field ? (
                                      <Input
                                        className="text-xs"
                                        placeholder={field.placeholder}
                                        value={action.config[field.key] || ''}
                                        onChange={(e) => {
                                          const newConfig = { ...action.config, [field.key]: e.target.value };
                                          updateAction(setIndex, actionIndex, 'config', newConfig);
                                        }}
                                      />
                                    ) : (
                                      <Input
                                        className="text-xs"
                                        value={action.config[field.key] || ''}
                                        onChange={(e) => {
                                          const newConfig = { ...action.config, [field.key]: e.target.value };
                                          updateAction(setIndex, actionIndex, 'config', newConfig);
                                        }}
                                      />
                                    )
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {conditionalRules.conditionSets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No condition sets configured</p>
                    <p className="text-sm">Add a condition set to start creating conditional rules</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/webhooks')}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update Webhook' : 'Create Webhook'}
        </Button>
      </div>
    </form>
  );
} 