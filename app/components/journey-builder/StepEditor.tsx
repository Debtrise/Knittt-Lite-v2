import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { JourneyStep } from '@/app/types/journey';
import { JourneyActionType, DelayType } from '@/app/types/dialplan';
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
  
  const [formData, setFormData] = useState<Partial<JourneyStep>>({
    name: '',
    description: '',
    stepOrder: 0,
    actionType: 'call',
    actionConfig: {},
    delayType: 'immediate',
    delayConfig: {},
    isActive: true,
    isExitPoint: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
    } catch (error) {
      console.error('Error loading recordings:', error);
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response === 'object' &&
        (error as any).response !== null
      ) {
        const response = (error as any).response;
        if (response.status === 401) {
          toast.error('Authentication required to load recordings');
        } else if (response.status === 404) {
          toast.error('Recordings API not available. Please check your configuration.');
        } else {
          toast.error('Failed to load recordings');
        }
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
        description: step.description,
        stepOrder: step.stepOrder,
        actionType: step.actionType,
        actionConfig: step.actionConfig,
        delayType: step.delayType,
        delayConfig: step.delayConfig,
        isActive: step.isActive,
        isExitPoint: step.isExitPoint
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
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleActionTypeChange = (newActionType: string) => {
    console.log('Action type changing to:', newActionType);
    
    // Get default values for the new action type
    const defaultActionConfig = getDefaultActionConfigValues(newActionType as JourneyActionType);
    const newActionParams = getActionTypeParams(newActionType as JourneyActionType);
    
    console.log('New action params:', newActionParams);
    console.log('Template select params:', newActionParams.filter(p => p.type === 'template_select'));
    console.log('Transfer group select params:', newActionParams.filter(p => p.type === 'transfer_group_select'));
    
    setFormData(prev => ({
      ...prev,
      actionType: newActionType as JourneyStep['actionType'],
      actionConfig: defaultActionConfig
    }));
  };
  
  const handleDelayTypeChange = (newDelayType: string) => {
    // Get default values for the new delay type
    const defaultDelayConfig = getDefaultDelayConfigValues(newDelayType as DelayType);
    
    setFormData(prev => ({
      ...prev,
      delayType: newDelayType as JourneyStep['delayType'],
      delayConfig: defaultDelayConfig
    }));
  };
  
  const handleActionConfigChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      actionConfig: {
        ...prev.actionConfig,
        [field]: value
      }
    }));
  };
  
  const handleDelayConfigChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      delayConfig: {
        ...prev.delayConfig,
        [field]: value
      }
    }));
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateJourneyStep(journeyId, step.id, formData);
      toast.success('Step updated successfully');
      onStepUpdated();
    } catch (error) {
      console.error('Error updating step:', error);
      toast.error('Failed to update step');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this step?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await deleteJourneyStep(journeyId, step.id);
      toast.success('Step deleted successfully');
      onStepDeleted();
    } catch (error) {
      console.error('Error deleting step:', error);
      toast.error('Failed to delete step');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // IVR Options configuration component
  const IVROptionsField: React.FC<{
    value: any;
    onChange: (field: string, value: any) => void;
    fieldId: string;
  }> = ({ value, onChange, fieldId }) => {
    const ivrOptions = value || {};
    const [showIVRConfig, setShowIVRConfig] = useState(false);
    
    const updateIVROption = (key: string, optionData: any) => {
      const newOptions = { ...ivrOptions, [key]: optionData };
      onChange(fieldId, newOptions);
    };
    
    const removeIVROption = (key: string) => {
      const newOptions = { ...ivrOptions };
      delete newOptions[key];
      onChange(fieldId, newOptions);
    };
    
    const availableKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '*', '#', 'default'];
    const usedKeys = Object.keys(ivrOptions);
    const unusedKeys = availableKeys.filter(key => !usedKeys.includes(key));
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">IVR Menu Options ({usedKeys.length})</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowIVRConfig(!showIVRConfig)}
          >
            {showIVRConfig ? 'Hide' : 'Configure'} IVR Menu
          </Button>
        </div>
        
        {showIVRConfig && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
            {/* Existing IVR Options */}
            {usedKeys.map((key) => (
              <div key={key} className="border rounded-lg p-3 bg-white">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium text-sm">
                    Key: {key === 'default' ? 'Default (No Input/Invalid)' : key}
                  </h5>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeIVROption(key)}
                  >
                    Remove
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Action</Label>
                    <Select
                      value={ivrOptions[key]?.action || 'transfer'}
                      onValueChange={(action) => updateIVROption(key, { ...ivrOptions[key], action })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transfer">Transfer Call</SelectItem>
                        <SelectItem value="playRecording">Play Recording</SelectItem>
                        <SelectItem value="hangup">Hang Up</SelectItem>
                        <SelectItem value="collectInput">Collect More Input</SelectItem>
                        <SelectItem value="tag">Add Tag</SelectItem>
                        <SelectItem value="webhook">Call Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={ivrOptions[key]?.description || ''}
                      onChange={(e) => updateIVROption(key, { ...ivrOptions[key], description: e.target.value })}
                      placeholder="Description for this option"
                    />
                  </div>
                </div>
                
                {/* Action-specific fields */}
                {ivrOptions[key]?.action === 'transfer' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label>Transfer Number</Label>
                      <Input
                        value={ivrOptions[key]?.transferNumber || ''}
                        onChange={(e) => updateIVROption(key, { ...ivrOptions[key], transferNumber: e.target.value })}
                        placeholder="Phone number to transfer to"
                      />
                    </div>
                    <div>
                      <Label>Transfer Group</Label>
                      <Select
                        value={ivrOptions[key]?.transferGroupId?.toString() || 'none'}
                        onValueChange={(v) => updateIVROption(key, { ...ivrOptions[key], transferGroupId: v === 'none' ? null : parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transfer group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No transfer group</SelectItem>
                          {transferGroups.map((group: any) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name} ({group.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                {ivrOptions[key]?.action === 'playRecording' && (
                  <div className="grid grid-cols-1 gap-3 mt-3">
                    <div>
                      <Label>Select Recording</Label>
                      <Select
                        value={ivrOptions[key]?.recordingId?.toString() || 'none'}
                        onValueChange={(v) => {
                          const newValue = v === 'none' ? null : parseInt(v);
                          const updatedOptions = { ...ivrOptions };
                          updatedOptions[key] = {
                            ...updatedOptions[key],
                            recordingId: newValue
                          };
                          onChange(fieldId, updatedOptions);
                        }}
                        disabled={loadingRecordings}
                        onOpenChange={(open) => {
                          if (open && recordings.length === 0 && isAuthenticated) {
                            console.log('Recording dropdown opened in IVR options, loading recordings...');
                            loadRecordings();
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingRecordings ? 'Loading recordings...' : 'Select a recording'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No recording (use text below)</SelectItem>
                          {recordings.map((recording: any) => (
                            <SelectItem key={recording.id} value={recording.id.toString()}>
                              {recording.name} ({recording.type})
                            </SelectItem>
                          ))}
                          {recordings.length === 0 && !loadingRecordings && (
                            <SelectItem value="none" disabled>
                              No recordings available - Configure Eleven Labs in Settings
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      
                      {ivrOptions[key]?.recordingId && (
                        <div className="mt-2 p-2 bg-gray-50 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700">Preview Recording</span>
                          </div>
                          <AudioPlayer
                            recordingId={ivrOptions[key].recordingId.toString()}
                            recordingName={recordings.find(r => r.id.toString() === ivrOptions[key].recordingId.toString())?.name || 'Recording'}
                            audioUrl={recordings.find(r => r.id.toString() === ivrOptions[key].recordingId.toString())?.audioUrl}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Fallback Text (TTS)</Label>
                      <Input
                        value={ivrOptions[key]?.recordingText || ''}
                        onChange={(e) => {
                          const updatedOptions = { ...ivrOptions };
                          updatedOptions[key] = {
                            ...updatedOptions[key],
                            recordingText: e.target.value
                          };
                          onChange(fieldId, updatedOptions);
                        }}
                        placeholder="Text-to-speech fallback if recording unavailable"
                      />
                    </div>
                  </div>
                )}
                
                {ivrOptions[key]?.action === 'tag' && (
                  <div className="mt-3">
                    <Label>Tag Name</Label>
                    <Input
                      value={ivrOptions[key]?.tag || ''}
                      onChange={(e) => updateIVROption(key, { ...ivrOptions[key], tag: e.target.value })}
                      placeholder="Tag to add to lead"
                    />
                  </div>
                )}
                
                {ivrOptions[key]?.action === 'webhook' && (
                  <div className="mt-3">
                    <Label>Webhook URL</Label>
                    <Input
                      value={ivrOptions[key]?.webhookUrl || ''}
                      onChange={(e) => updateIVROption(key, { ...ivrOptions[key], webhookUrl: e.target.value })}
                      placeholder="https://example.com/webhook"
                    />
                  </div>
                )}
                
                <div className="mt-3">
                  <Label>Next Step ID (Optional)</Label>
                  <Input
                    type="number"
                    value={ivrOptions[key]?.nextStepId || ''}
                    onChange={(e) => updateIVROption(key, { ...ivrOptions[key], nextStepId: parseInt(e.target.value) || null })}
                    placeholder="Jump to specific step after action"
                  />
                </div>
              </div>
            ))}
            
            {/* Add New Option */}
            {unusedKeys.length > 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-3">Add IVR Menu Option</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {unusedKeys.map((key) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateIVROption(key, { 
                        action: 'transfer', 
                        description: `Option ${key === 'default' ? 'Default' : key}` 
                      })}
                    >
                      Add {key === 'default' ? 'Default' : key}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {unusedKeys.length === 0 && (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">All IVR options configured</p>
              </div>
            )}
          </div>
        )}
        
        {usedKeys.length === 0 && !showIVRConfig && (
          <p className="text-sm text-gray-500">No IVR options configured</p>
        )}
      </div>
    );
  };

  // Generate form field for a specific parameter
  const renderParamField = (param: any, value: any, onChange: (field: string, value: any) => void) => {
    switch (param.type) {
      case 'string':
        return (
          <Input
            id={param.id}
            value={value || param.default || ''}
            onChange={(e) => onChange(param.id, e.target.value)}
            placeholder={param.description}
          />
        );
      case 'number':
        return (
          <Input
            id={param.id}
            type="number"
            value={value !== undefined ? value : (param.default || 0)}
            onChange={(e) => onChange(param.id, parseInt(e.target.value, 10) || 0)}
            placeholder={param.description}
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={param.id}
              checked={value !== undefined ? value : (param.default || false)}
              onCheckedChange={(checked) => onChange(param.id, !!checked)}
            />
            <Label htmlFor={param.id}>{param.description}</Label>
          </div>
        );
      case 'select':
        return (
          <Select
            value={value || param.default || (param.options ? param.options[0] : '')}
            onValueChange={(v) => onChange(param.id, v)}
          >
            <SelectTrigger id={param.id}>
              <SelectValue placeholder={param.description} />
            </SelectTrigger>
            <SelectContent>
              {param.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'template_select':
        const templateOptions = param.templateType ? templates[param.templateType] || [] : [];
        const isEmailTemplate = param.templateType === 'email';
        const selectedTemplateId = value || param.default;
        
        return (
          <div className="space-y-2">
            <Select
              value={selectedTemplateId || 'none'}
              onValueChange={(v) => {
                const newValue = v === 'none' ? '' : v;
                onChange(param.id, newValue);
                // Clear preview when template changes
                if (isEmailTemplate) {
                  setEmailPreview(null);
                  setShowEmailPreview(false);
                }
              }}
              disabled={loadingTemplates}
              onOpenChange={(open) => {
                if (open && param.templateType && (!templates[param.templateType] || templates[param.templateType].length === 0) && isAuthenticated) {
                  console.log(`Template dropdown opened for ${param.templateType}, loading templates...`);
                  loadTemplates([param.templateType]);
                }
              }}
            >
              <SelectTrigger id={param.id}>
                <SelectValue placeholder={loadingTemplates ? 'Loading templates...' : 'Select a template'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                {templateOptions.map((template: any) => (
                  <SelectItem key={template.id} value={template.id.toString()}>
                    {template.name}
                  </SelectItem>
                ))}
                {templateOptions.length === 0 && !loadingTemplates && (
                  <SelectItem value="no-templates" disabled>
                    No {param.templateType} templates found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {isEmailTemplate && selectedTemplateId && selectedTemplateId !== 'none' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadEmailPreview(selectedTemplateId)}
                disabled={loadingEmailPreview}
                className="w-full flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {loadingEmailPreview ? 'Loading Preview...' : 'Preview Email'}
              </Button>
            )}
          </div>
        );
      case 'transfer_group_select':
        return (
          <Select
            value={value || param.default || 'none'}
            onValueChange={(v) => onChange(param.id, v === 'none' ? '' : v)}
            disabled={loadingTransferGroups}
            onOpenChange={(open) => {
              if (open && transferGroups.length === 0 && isAuthenticated) {
                console.log('Transfer group dropdown opened, loading transfer groups...');
                loadTransferGroups();
              }
            }}
          >
            <SelectTrigger id={param.id}>
              <SelectValue placeholder={loadingTransferGroups ? 'Loading transfer groups...' : 'Select a transfer group'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No transfer group</SelectItem>
              {transferGroups.map((group: any) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name} ({group.type})
                </SelectItem>
              ))}
              {transferGroups.length === 0 && !loadingTransferGroups && (
                <SelectItem value="no-groups" disabled>
                  No transfer groups found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        );
      case 'recording_select':
        const selectedRecordingId = value || param.default;
        
        return (
          <div className="space-y-2">
            <Select
              value={selectedRecordingId?.toString() || 'none'}
              onValueChange={(v) => {
                const newValue = v === 'none' ? null : parseInt(v);
                onChange(param.id, newValue);
              }}
              disabled={loadingRecordings}
              onOpenChange={(open) => {
                if (open && recordings.length === 0 && isAuthenticated) {
                  console.log('Recording dropdown opened, loading recordings...');
                  loadRecordings();
                }
              }}
            >
              <SelectTrigger id={param.id}>
                <SelectValue placeholder={loadingRecordings ? 'Loading recordings...' : 'Select a recording'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No recording (use text-to-speech)</SelectItem>
                {recordings.map((recording: any) => (
                  <SelectItem key={recording.id} value={recording.id.toString()}>
                    {recording.name} ({recording.type})
                  </SelectItem>
                ))}
                {recordings.length === 0 && !loadingRecordings && (
                  <SelectItem value="none" disabled>
                    No recordings available - Configure Eleven Labs in Settings
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {selectedRecordingId && (
              <div className="mt-2 p-2 bg-gray-50 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Preview Recording</span>
                </div>
                <AudioPlayer
                  recordingId={selectedRecordingId.toString()}
                  recordingName={recordings.find(r => r.id.toString() === selectedRecordingId.toString())?.name || 'Recording'}
                  audioUrl={recordings.find(r => r.id.toString() === selectedRecordingId.toString())?.audioUrl}
                />
              </div>
            )}
          </div>
        );
      case 'ivr_options':
        return <IVROptionsField value={value} onChange={onChange} fieldId={param.id} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white p-4 border border-gray-200 rounded-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Edit Step</h3>
        <div className="bg-brand text-white px-2 py-1 rounded-md text-sm font-medium">
          Step {displayNumber}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="stepOrder">Order</Label>
          <Input
            id="stepOrder"
            type="number"
            value={formData.stepOrder !== undefined ? Number(formData.stepOrder) || 0 : 0}
            onChange={(e) => handleChange('stepOrder', parseInt(e.target.value, 10) || 0)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Internal order value. Displayed as Step {displayNumber}.
          </p>
        </div>
        
        <div>
          <Label htmlFor="actionType">Action Type</Label>
          <Select
            value={formData.actionType}
            onValueChange={handleActionTypeChange}
          >
            <SelectTrigger id="actionType">
              <SelectValue placeholder="Select action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="status_change">Status Change</SelectItem>
              <SelectItem value="tag_update">Tag Update</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="wait_for_event">Wait for Event</SelectItem>
              <SelectItem value="conditional_branch">Conditional Branch</SelectItem>
              <SelectItem value="lead_assignment">Lead Assignment</SelectItem>
              <SelectItem value="data_update">Data Update</SelectItem>
              <SelectItem value="journey_transfer">Journey Transfer</SelectItem>
              <SelectItem value="delay">Delay</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Action Configuration Fields */}
        <div className="border border-gray-200 rounded-md p-3 bg-white">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Action Configuration</h4>
          <div className="space-y-3">
            {actionParams.filter(param => !param.id.startsWith('ivr') || param.id === 'ivrEnabled').map((param) => (
              <div key={param.id}>
                <Label htmlFor={param.id}>{param.name}{param.required ? ' *' : ''}</Label>
                {renderParamField(
                  param, 
                  formData.actionConfig?.[param.id], 
                  handleActionConfigChange
                )}
                {param.description && (
                  <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                )}
              </div>
            ))}
            {formData.actionType === 'call' && formData.actionConfig?.dialerContext && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-700">
                  Dialer Context is set. Most other call options will be overridden by the dialer configuration.
                </p>
              </div>
            )}
            {actionParams.filter(param => !param.id.startsWith('ivr') || param.id === 'ivrEnabled').length === 0 && (
              <p className="text-sm text-gray-500">No configuration needed for this action type.</p>
            )}
          </div>
        </div>

        {/* IVR Configuration Section - Only show for call actions when IVR is enabled and no dialerContext is set */}
        {formData.actionType === 'call' && formData.actionConfig?.ivrEnabled && !formData.actionConfig?.dialerContext && (
          <div className="border border-blue-200 rounded-md p-3 bg-blue-50">
            <h4 className="text-sm font-medium text-blue-900 mb-3">IVR Configuration</h4>
            <div className="space-y-3">
              {actionParams.filter(param => param.id.startsWith('ivr') && param.id !== 'ivrEnabled').map((param) => (
                <div key={param.id}>
                  <Label htmlFor={param.id}>{param.name}{param.required ? ' *' : ''}</Label>
                  {renderParamField(
                    param, 
                    formData.actionConfig?.[param.id], 
                    handleActionConfigChange
                  )}
                  {param.description && (
                    <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <Label htmlFor="delayType">Delay Type</Label>
          <Select
            value={formData.delayType}
            onValueChange={handleDelayTypeChange}
          >
            <SelectTrigger id="delayType">
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
        
        {/* Delay Configuration Fields */}
        {delayParams.length > 0 && (
          <div className="border border-gray-200 rounded-md p-3 bg-white">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Delay Configuration</h4>
            <div className="space-y-3">
              {delayParams.map((param) => (
                <div key={param.id}>
                  <Label htmlFor={param.id}>{param.name}{param.required ? ' *' : ''}</Label>
                  {renderParamField(
                    param, 
                    formData.delayConfig?.[param.id], 
                    handleDelayConfigChange
                  )}
                  {param.description && (
                    <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => handleChange('isActive', !!checked)}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isExitPoint"
            checked={formData.isExitPoint}
            onCheckedChange={(checked) => handleChange('isExitPoint', !!checked)}
          />
          <Label htmlFor="isExitPoint">Exit Point (Journey ends after this step)</Label>
        </div>
        
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete Step'}
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      {/* Email Preview Modal */}
      {showEmailPreview && emailPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Email Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmailPreview(false)}
              >
                Close
              </Button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Subject Line */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Subject</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                  {emailPreview.subject}
                </div>
              </div>
              
              {/* Preview Tabs */}
              <div className="border rounded-lg">
                <div className="flex border-b">
                  <button
                    className={`px-4 py-2 text-sm font-medium border-r ${
                      previewTab === 'html' 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => setPreviewTab('html')}
                  >
                    HTML Preview
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      previewTab === 'text' 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => setPreviewTab('text')}
                  >
                    Text Version
                  </button>
                </div>
                
                {/* HTML Content */}
                {previewTab === 'html' && (
                  <div className="p-4">
                    <div className="border rounded bg-white min-h-[400px]">
                      {emailPreview.htmlContent ? (
                        <div className="h-full">
                          {emailPreview.htmlContent.includes('<html>') || emailPreview.htmlContent.includes('<body>') ? (
                            <iframe
                              srcDoc={emailPreview.htmlContent}
                              className="w-full h-[500px] border-0 rounded"
                              title="Email HTML Preview"
                              style={{ minHeight: '400px' }}
                            />
                          ) : (
                            <div className="p-6 overflow-auto max-h-[500px]">
                              <div 
                                className="prose prose-sm max-w-none leading-relaxed"
                                style={{ 
                                  lineHeight: '1.6',
                                  fontSize: '14px',
                                  fontFamily: 'system-ui, -apple-system, sans-serif'
                                }}
                                dangerouslySetInnerHTML={{ __html: emailPreview.htmlContent }}
                              />
                            </div>
                          )}
                        </div>
                      ) : emailPreview.textContent ? (
                        <div className="p-6">
                          <p className="text-sm text-gray-500 mb-4 italic">No HTML content available. Showing text content:</p>
                          <div 
                            className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                            style={{ 
                              lineHeight: '1.6',
                              fontSize: '14px',
                              fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}
                          >
                            {emailPreview.textContent}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[400px] text-gray-500 italic">
                          No HTML content available
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Text Content */}
                {previewTab === 'text' && (
                  <div className="p-4">
                    <div className="border rounded bg-gray-50 min-h-[400px]">
                      <div className="p-6">
                        <pre 
                          className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans"
                          style={{ 
                            lineHeight: '1.6',
                            fontSize: '14px',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}
                        >
                          {emailPreview.textContent || 'No text content available'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sample Variables Info */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Sample Variables Used</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div><strong>firstName:</strong> John</div>
                  <div><strong>lastName:</strong> Doe</div>
                  <div><strong>email:</strong> john.doe@example.com</div>
                  <div><strong>phone:</strong> +1234567890</div>
                  <div><strong>company:</strong> Example Company</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepEditor; 