'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { createWebhook, updateWebhook, getWebhookDetails } from '@/app/utils/api';
import { WebhookEndpoint, CreateWebhookParams, UpdateWebhookParams } from '@/app/types/webhook';
import { toast } from 'react-hot-toast';

type WebhookFormProps = {
  webhookId?: number;
  isEdit?: boolean;
};

export default function WebhookForm({ webhookId, isEdit = false }: WebhookFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateWebhookParams>({
    name: '',
    description: '',
    isActive: true,
    brand: '',
    source: '',
    fieldMapping: {
      phone: 'contact.phoneNumber',
      name: 'contact.fullName',
      email: 'contact.email',
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
    { key: 'phone', value: 'contact.phoneNumber' },
    { key: 'name', value: 'contact.fullName' },
    { key: 'email', value: 'contact.email' },
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

  useEffect(() => {
    if (isEdit && webhookId) {
      const fetchWebhook = async () => {
        try {
          const response = await getWebhookDetails(webhookId);
          
          // Normalize field mappings
          const standardFields = ['phone', 'name', 'email'];
          const stdFieldMappings = standardFields.map(field => ({
            key: field,
            value: response.fieldMapping[field] || '',
          }));
          
          const customFields = Object.entries(response.fieldMapping)
            .filter(([key]) => !standardFields.includes(key))
            .map(([key, value]) => ({ key, value: value as string }));
          
          setFieldMappings(stdFieldMappings);
          setCustomFieldMappings(customFields);
          
          // Set auto tag rules
          if (response.autoTagRules && response.autoTagRules.length > 0) {
            setAutoTagRules(response.autoTagRules);
          }
          
          // Set required headers
          if (response.requiredHeaders) {
            const headers = Object.entries(response.requiredHeaders).map(([key, value]) => ({
              key,
              value: value as string,
            }));
            setRequiredHeaders(headers);
          }
          
          // Set main form data
          setFormData({
            name: response.name,
            description: response.description,
            isActive: response.isActive,
            brand: response.brand,
            source: response.source,
            fieldMapping: response.fieldMapping,
            validationRules: response.validationRules,
            autoTagRules: response.autoTagRules,
            securityToken: response.securityToken,
            requiredHeaders: response.requiredHeaders,
            autoEnrollJourneyId: response.autoEnrollJourneyId,
          });
        } catch (error) {
          console.error('Error fetching webhook:', error);
          toast.error('Failed to load webhook');
        } finally {
          setLoading(false);
        }
      };
      
      fetchWebhook();
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
    setSaving(true);
    
    try {
      // Validate required fields
      if (!formData.name || !formData.brand || !formData.source) {
        toast.error('Please fill in all required fields');
        setSaving(false);
        return;
      }
      
      // Validate field mappings
      const requiredMappings = ['phone', 'name', 'email'];
      for (const field of requiredMappings) {
        const mapping = fieldMappings.find(m => m.key === field);
        if (!mapping || !mapping.value) {
          toast.error(`Field mapping for ${field} is required`);
          setSaving(false);
          return;
        }
      }
      
      // Update the form data with the latest field mappings, headers, etc.
      const updatedFormData = {
        ...formData,
        fieldMapping: {
          ...fieldMappings.reduce((acc, { key, value }) => {
            if (key) acc[key] = value;
            return acc;
          }, {} as Record<string, string>),
          ...customFieldMappings.reduce((acc, { key, value }) => {
            if (key) acc[key] = value;
            return acc;
          }, {} as Record<string, string>),
        },
        autoTagRules: autoTagRules.filter(rule => rule.field && rule.tag),
        requiredHeaders: requiredHeaders.reduce((acc, { key, value }) => {
          if (key) acc[key] = value;
          return acc;
        }, {} as Record<string, string>),
      };
      
      if (isEdit && webhookId) {
        // Update existing webhook
        await updateWebhook(webhookId, updatedFormData);
        toast.success('Webhook updated successfully');
      } else {
        // Create new webhook
        await createWebhook(updatedFormData);
        toast.success('Webhook created successfully');
      }
      
      // Redirect back to webhooks list
      router.push('/webhooks');
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error(isEdit ? 'Failed to update webhook' : 'Failed to create webhook');
    } finally {
      setSaving(false);
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
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => 
                  handleCheckboxChange('isActive', checked as boolean)
                }
              />
              <Label htmlFor="isActive">Webhook is active</Label>
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
                    variant="ghost"
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
                  variant="ghost"
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
            <Label htmlFor="securityToken">Security Token</Label>
            <Input
              id="securityToken"
              name="securityToken"
              value={formData.securityToken || ''}
              onChange={handleInputChange}
              placeholder="Optional security token"
            />
            <p className="text-xs text-gray-500">
              If provided, API clients must include this token in the Authorization header.
            </p>
          </div>
          
          <div className="space-y-2 pt-4">
            <Label htmlFor="autoEnrollJourneyId">Auto-Enroll Journey ID</Label>
            <Input
              id="autoEnrollJourneyId"
              name="autoEnrollJourneyId"
              type="number"
              value={formData.autoEnrollJourneyId || ''}
              onChange={handleInputChange}
              placeholder="Journey ID for auto-enrollment"
            />
            <p className="text-xs text-gray-500">
              If provided, leads created from this webhook will be automatically enrolled in the specified journey.
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
                    variant="ghost"
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