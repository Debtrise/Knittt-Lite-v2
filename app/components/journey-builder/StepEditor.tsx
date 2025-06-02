'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { JourneyStep } from '@/app/types/journey';
import { JourneyActionType, DelayType } from '@/app/types/journey-actions';
import { updateJourneyStep, deleteJourneyStep } from '@/app/utils/api';
import { getActionTypeParams, getDelayTypeParams, getDefaultActionConfigValues, getDefaultDelayConfigValues } from '@/app/utils/nodeConfigHelpers';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';
import toast from 'react-hot-toast';
import { Trash2, Save, Eye, Play, Pause } from 'lucide-react';
import AudioPlayer from '@/app/components/ui/AudioPlayer';

interface StepEditorProps {
  step: JourneyStep;
  journeyId: number;
  onStepUpdated: () => void;
  onStepDeleted: () => void;
  stepIndex?: number; // Optional index for display purposes
}

const StepEditor: React.FC<StepEditorProps> = ({
  step,
  journeyId,
  onStepUpdated,
  onStepDeleted,
  stepIndex
}) => {
  const { isAuthenticated, user, token } = useAuthStore();
  
  // Debug authentication state
  console.log('StepEditor - Authentication state:', { isAuthenticated, user, hasToken: !!token });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: step.name,
    description: step.description || '',
    actionType: step.actionType,
    actionConfig: step.actionConfig || {},
    delayType: step.delayType || 'immediate',
    delayConfig: step.delayConfig || {},
    conditions: step.conditions || {},
    isActive: step.isActive
  });
  
  // State for templates and transfer groups
  const [templates, setTemplates] = useState<Record<string, any[]>>({});
  const [transferGroups, setTransferGroups] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingTransferGroups, setLoadingTransferGroups] = useState(false);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  
  // State for email preview
  const [emailPreview, setEmailPreview] = useState<{
    subject: string;
    htmlContent: string;
    textContent: string;
  } | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [loadingEmailPreview, setLoadingEmailPreview] = useState(false);
  const [previewTab, setPreviewTab] = useState<'html' | 'text'>('html');
  
  // Display number for the step (1-based index)
  const displayNumber = stepIndex !== undefined ? stepIndex + 1 : Math.ceil(step.stepOrder / 10);
  
  // Get the parameter definitions for the current action type
  const actionParams = getActionTypeParams(formData.actionType as JourneyActionType);
  const delayParams = getDelayTypeParams(formData.delayType as DelayType);
  
  // Define callback functions first, before useEffect hooks that depend on them
  const loadTemplates = useCallback(async (templateTypes: string[]) => {
    if (!isAuthenticated) {
      console.warn('User not authenticated, skipping template loading');
      return;
    }

    console.log('Loading templates for types:', templateTypes);
    setLoadingTemplates(true);
    try {
      const templateData: Record<string, any[]> = {};
      
      for (const type of templateTypes) {
        try {
          console.log(`Loading templates for type: ${type}`);
          const response = await api.templates.list({ 
            type: type as any, 
            isActive: true, 
            limit: 100 
          });
          
          // Extract templates from response
          const templates = response.data?.templates || response.data || [];
          templateData[type] = Array.isArray(templates) ? templates : [];
          console.log(`Loaded ${templateData[type].length} templates for ${type}`);
          console.log(`Sample template data for ${type}:`, templateData[type][0]);
        } catch (typeError) {
          console.error(`Error loading templates for type ${type}:`, typeError);
          templateData[type] = [];
        }
      }
      
      setTemplates(prev => ({ ...prev, ...templateData }));
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, [isAuthenticated]);

  const loadTransferGroups = useCallback(async () => {
    if (!isAuthenticated) {
      console.warn('User not authenticated, skipping transfer groups loading');
      return;
    }

    console.log('Loading transfer groups...');
    setLoadingTransferGroups(true);
    try {
      const response = await api.transferGroups.list({ isActive: true, limit: 100 });
      console.log('Transfer groups API response:', response);
      
      // Extract groups from response
      const groups = response.data?.groups || response.data || [];
      setTransferGroups(Array.isArray(groups) ? groups : []);
      console.log(`Loaded ${groups.length} transfer groups`);
    } catch (error) {
      console.error('Error loading transfer groups:', error);
      toast.error('Failed to load transfer groups');
      setTransferGroups([]);
    } finally {
      setLoadingTransferGroups(false);
    }
  }, [isAuthenticated]);

  const loadRecordings = useCallback(async () => {
    if (!isAuthenticated) {
      console.warn('User not authenticated, skipping recordings loading');
      return;
    }

    console.log('Loading recordings...');
    setLoadingRecordings(true);
    try {
      // First check if Eleven Labs is configured
      const configResponse = await api.recordings.getConfig();
      if (!configResponse.data?.apiKey) {
        console.warn('Eleven Labs API not configured');
        toast.error('Eleven Labs API not configured. Please configure it in Settings.');
        setRecordings([]);
        return;
      }

      const response = await api.recordings.list({ isActive: true, limit: 100 });
      console.log('Recordings API response:', response);
      
      // Extract recordings from response
      const recordingsList = response.data?.data || response.data || [];
      setRecordings(Array.isArray(recordingsList) ? recordingsList : []);
      console.log(`Loaded ${recordingsList.length} recordings`);
    } catch (error: any) {
      console.error('Error loading recordings:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication required to load recordings');
      } else if (error.response?.status === 404) {
        toast.error('Recordings API not available. Please check your configuration.');
      } else {
        toast.error('Failed to load recordings');
      }
      setRecordings([]);
    } finally {
      setLoadingRecordings(false);
    }
  }, [isAuthenticated]);
  
  // All useEffect hooks must be at the top level
  useEffect(() => {
    if (step) {
      setFormData({
        name: step.name,
        description: step.description || '',
        actionType: step.actionType,
        actionConfig: step.actionConfig || {},
        delayType: step.delayType || 'immediate',
        delayConfig: step.delayConfig || {},
        conditions: step.conditions || {},
        isActive: step.isActive
      });
    }
  }, [step]);

  // Load templates when needed
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Simple: load templates based on action type
    if (formData.actionType === 'sms') {
      loadTemplates(['sms']);
    } else if (formData.actionType === 'email') {
      loadTemplates(['email']);
    } else if (formData.actionType === 'call') {
      loadTemplates(['script', 'voicemail']);
    }
  }, [formData.actionType, isAuthenticated, loadTemplates]);

  // Load transfer groups when needed
  useEffect(() => {
    // Simple: if action type is 'call', load transfer groups immediately
    if (formData.actionType === 'call' && isAuthenticated) {
      loadTransferGroups();
    }
  }, [formData.actionType, isAuthenticated, loadTransferGroups]);

  // Load recordings when IVR is enabled
  useEffect(() => {
    // Load recordings when IVR is enabled for call actions
    if (formData.actionType === 'call' && formData.actionConfig?.ivrEnabled && isAuthenticated) {
      loadRecordings();
    }
  }, [formData.actionType, formData.actionConfig?.ivrEnabled, isAuthenticated, loadRecordings]);
  
  // Show authentication warning if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Step</h3>
          <div className="bg-brand text-white px-2 py-1 rounded-md text-sm font-medium">
            Step {displayNumber}
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Please log in to edit journey steps.</p>
        </div>
      </div>
    );
  }

  const loadEmailPreview = async (templateId: string) => {
    if (!isAuthenticated || !templateId) {
      return;
    }

    console.log('Loading email preview for template:', templateId);
    setLoadingEmailPreview(true);
    try {
      // First get the template details
      const templateResponse = await api.templates.get(templateId);
      const template = templateResponse.data || templateResponse;
      
      console.log('Template response:', template);
      
      // Try to render the preview with sample variables
      let previewResponse = null;
      try {
        previewResponse = await api.templates.renderPreview(templateId, {
          variables: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            company: 'Example Company'
          },
          context: {
            leadId: 'sample',
            journeyId: journeyId.toString(),
            stepId: step.id.toString()
          }
        });
        console.log('Preview response:', previewResponse);
      } catch (previewError) {
        console.warn('Preview rendering failed, using template content directly:', previewError);
      }
      
      // Extract content with fallbacks
      let htmlContent = '';
      let textContent = '';
      let subject = '';
      
      // Try to get content from preview response first
      if (previewResponse?.data) {
        htmlContent = previewResponse.data.htmlContent || previewResponse.data.html || '';
        textContent = previewResponse.data.textContent || previewResponse.data.text || previewResponse.data.content || '';
        subject = previewResponse.data.subject || '';
      }
      
      // Fallback to template content if preview failed
      if (!htmlContent && !textContent) {
        htmlContent = template.htmlContent || template.html_content || '';
        textContent = template.content || template.textContent || template.text_content || '';
        subject = template.subject || '';
      }
      
      // If still no HTML content, try to use text content as HTML
      if (!htmlContent && textContent) {
        // Convert plain text to basic HTML
        htmlContent = `<html><body><div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${textContent.replace(/\n/g, '<br>')}</div></body></html>`;
      }
      
      console.log('Final content:', { htmlContent, textContent, subject });
      
      setEmailPreview({
        subject: subject || 'No Subject',
        htmlContent: htmlContent,
        textContent: textContent
      });
      setPreviewTab('html');
      setShowEmailPreview(true);
    } catch (error) {
      console.error('Error loading email preview:', error);
      toast.error('Failed to load email preview');
    } finally {
      setLoadingEmailPreview(false);
    }
  };
  
  const handleUpdateStep = async () => {
    try {
      setIsSubmitting(true);
      await updateJourneyStep(journeyId, step.id, {
        ...formData
      });
      toast.success('Step updated successfully');
      onStepUpdated();
    } catch (error) {
      console.error('Error updating step:', error);
      toast.error('Failed to update step');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteStep = async () => {
    if (!confirm('Are you sure you want to delete this step?')) return;
    
    try {
      setIsSubmitting(true);
      await deleteJourneyStep(journeyId, step.id);
      toast.success('Step deleted successfully');
      onStepDeleted();
    } catch (error) {
      console.error('Error deleting step:', error);
      toast.error('Failed to delete step');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderActionConfig = () => {
    switch (formData.actionType) {
      case 'sms':
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="sms-template">Message Template</Label>
              <Textarea
                id="sms-template"
                value={formData.actionConfig.template || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  actionConfig: { ...formData.actionConfig, template: e.target.value }
                })}
                placeholder="Enter your message template"
                rows={4}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sms-sender">Sender ID</Label>
              <Input
                id="sms-sender"
                value={formData.actionConfig.senderId || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  actionConfig: { ...formData.actionConfig, senderId: e.target.value }
                })}
                placeholder="Enter sender ID"
              />
            </div>
          </div>
        );
        
      case 'call':
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="call-script">Call Script</Label>
              <Textarea
                id="call-script"
                value={formData.actionConfig.script || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  actionConfig: { ...formData.actionConfig, script: e.target.value }
                })}
                placeholder="Enter call script"
                rows={4}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="call-duration">Max Duration (seconds)</Label>
              <Input
                id="call-duration"
                type="number"
                value={formData.actionConfig.maxDuration || 300}
                onChange={(e) => setFormData({
                  ...formData,
                  actionConfig: { ...formData.actionConfig, maxDuration: parseInt(e.target.value, 10) }
                })}
                min={30}
                max={3600}
              />
            </div>
          </div>
        );
        
      case 'delay':
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="delay-type">Delay Type</Label>
              <Select
                value={formData.delayType}
                onValueChange={(value) => setFormData({
                  ...formData,
                  delayType: value as 'immediate' | 'fixed_time' | 'delay_after_previous' | 'delay_after_enrollment' | 'specific_days'
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select delay type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="fixed_time">Fixed Time</SelectItem>
                  <SelectItem value="delay_after_previous">Delay After Previous</SelectItem>
                  <SelectItem value="delay_after_enrollment">Delay After Enrollment</SelectItem>
                  <SelectItem value="specific_days">Specific Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.delayType === 'fixed_time' && (
              <div className="grid gap-2">
                <Label htmlFor="delay-time">Time</Label>
                <Input
                  id="delay-time"
                  type="time"
                  value={formData.delayConfig.time || '09:00'}
                  onChange={(e) => setFormData({
                    ...formData,
                    delayConfig: { ...formData.delayConfig, time: e.target.value }
                  })}
                />
              </div>
            )}
            {formData.delayType === 'delay_after_previous' && (
              <div className="grid gap-2">
                <Label htmlFor="delay-minutes">Minutes</Label>
                <Input
                  id="delay-minutes"
                  type="number"
                  value={formData.delayConfig.minutes || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    delayConfig: { ...formData.delayConfig, minutes: parseInt(e.target.value, 10) }
                  })}
                  min={0}
                />
                <Label htmlFor="delay-hours">Hours</Label>
                <Input
                  id="delay-hours"
                  type="number"
                  value={formData.delayConfig.hours || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    delayConfig: { ...formData.delayConfig, hours: parseInt(e.target.value, 10) }
                  })}
                  min={0}
                />
                <Label htmlFor="delay-days">Days</Label>
                <Input
                  id="delay-days"
                  type="number"
                  value={formData.delayConfig.days || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    delayConfig: { ...formData.delayConfig, days: parseInt(e.target.value, 10) }
                  })}
                  min={0}
                />
              </div>
            )}
            {formData.delayType === 'delay_after_enrollment' && (
              <div className="grid gap-2">
                <Label htmlFor="delay-days-enrollment">Days After Enrollment</Label>
                <Input
                  id="delay-days-enrollment"
                  type="number"
                  value={formData.delayConfig.days || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    delayConfig: { ...formData.delayConfig, days: parseInt(e.target.value, 10) }
                  })}
                  min={0}
                />
                <Label htmlFor="delay-hours-enrollment">Hours After Enrollment</Label>
                <Input
                  id="delay-hours-enrollment"
                  type="number"
                  value={formData.delayConfig.hours || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    delayConfig: { ...formData.delayConfig, hours: parseInt(e.target.value, 10) }
                  })}
                  min={0}
                />
              </div>
            )}
            {formData.delayType === 'specific_days' && (
              <div className="grid gap-2">
                <Label htmlFor="delay-days-list">Days (comma separated)</Label>
                <Input
                  id="delay-days-list"
                  value={formData.delayConfig.days || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    delayConfig: { ...formData.delayConfig, days: e.target.value }
                  })}
                  placeholder="e.g. Monday,Wednesday,Friday"
                />
              </div>
            )}
          </div>
        );
        
      case 'conditional_branch':
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="condition-type">Condition Type</Label>
              <Select
                value={formData.actionConfig.conditionType || 'lead_status'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  actionConfig: { ...formData.actionConfig, conditionType: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_status">Lead Status</SelectItem>
                  <SelectItem value="lead_tag">Lead Tag</SelectItem>
                  <SelectItem value="custom_field">Custom Field</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.actionConfig.conditionType === 'lead_status' && (
              <div className="grid gap-2">
                <Label htmlFor="status-value">Status Value</Label>
                <Input
                  id="status-value"
                  value={formData.actionConfig.statusValue || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    actionConfig: { ...formData.actionConfig, statusValue: e.target.value }
                  })}
                  placeholder="Enter status value"
                />
              </div>
            )}
            
            {formData.actionConfig.conditionType === 'lead_tag' && (
              <div className="grid gap-2">
                <Label htmlFor="tag-value">Tag Value</Label>
                <Input
                  id="tag-value"
                  value={formData.actionConfig.tagValue || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    actionConfig: { ...formData.actionConfig, tagValue: e.target.value }
                  })}
                  placeholder="Enter tag value"
                />
              </div>
            )}
            
            {formData.actionConfig.conditionType === 'custom_field' && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="field-name">Field Name</Label>
                  <Input
                    id="field-name"
                    value={formData.actionConfig.fieldName || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      actionConfig: { ...formData.actionConfig, fieldName: e.target.value }
                    })}
                    placeholder="Enter field name"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="field-value">Field Value</Label>
                  <Input
                    id="field-value"
                    value={formData.actionConfig.fieldValue || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      actionConfig: { ...formData.actionConfig, fieldValue: e.target.value }
                    })}
                    placeholder="Enter field value"
                  />
                </div>
              </>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step Properties</CardTitle>
        <CardDescription>
          Configure the properties for this journey step
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="step-name">Name</Label>
            <Input
              id="step-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Step name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="step-description">Description</Label>
            <Textarea
              id="step-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Step description"
              rows={2}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="step-type">Step Type</Label>
            <Select
              value={formData.actionType}
              onValueChange={(value) => setFormData({
                ...formData,
                actionType: value as 'sms' | 'email' | 'webhook' | 'call' | 'status_change' | 'tag_update' | 'wait_for_event' | 'conditional_branch' | 'lead_assignment' | 'data_update' | 'journey_transfer' | 'delay',
                actionConfig: {} // Reset action config when type changes
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select step type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="delay">Delay</SelectItem>
                <SelectItem value="conditional_branch">Conditional Branch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Tabs defaultValue="action" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="action">Action</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="action" className="mt-4">
              {renderActionConfig()}
            </TabsContent>
            
            <TabsContent value="conditions" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="step-active"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="form-checkbox h-4 w-4 text-indigo-600"
                  />
                  <Label htmlFor="step-active">Step is active</Label>
                </div>
                
                {/* Add more condition fields here */}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between pt-4">
            <Button
              variant="destructive"
              onClick={handleDeleteStep}
              disabled={isSubmitting}
            >
              Delete Step
            </Button>
            
            <Button
              onClick={handleUpdateStep}
              disabled={!formData.name || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StepEditor; 