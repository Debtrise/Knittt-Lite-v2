import React, { useState, useEffect } from 'react';
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
import toast from 'react-hot-toast';
import { Trash2, Save } from 'lucide-react';

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
  
  // Display number for the step (1-based index)
  const displayNumber = stepIndex !== undefined ? stepIndex + 1 : Math.ceil(step.stepOrder / 10);
  
  // Get the parameter definitions for the current action type
  const actionParams = getActionTypeParams(formData.actionType as JourneyActionType);
  const delayParams = getDelayTypeParams(formData.delayType as DelayType);
  
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
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleActionTypeChange = (newActionType: string) => {
    // Get default values for the new action type
    const defaultActionConfig = getDefaultActionConfigValues(newActionType as JourneyActionType);
    
    setFormData(prev => ({
      ...prev,
      actionType: newActionType,
      actionConfig: defaultActionConfig
    }));
  };
  
  const handleDelayTypeChange = (newDelayType: string) => {
    // Get default values for the new delay type
    const defaultDelayConfig = getDefaultDelayConfigValues(newDelayType as DelayType);
    
    setFormData(prev => ({
      ...prev,
      delayType: newDelayType,
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
  
  // Generate form field for a specific parameter
  const renderParamField = (param: any, value: any, onChange: (field: string, value: any) => void) => {
    switch (param.type) {
      case 'string':
        return (
          <Input
            id={param.id}
            value={value || ''}
            onChange={(e) => onChange(param.id, e.target.value)}
            placeholder={param.description}
          />
        );
      case 'number':
        return (
          <Input
            id={param.id}
            type="number"
            value={value !== undefined && value !== null ? Number(value) || 0 : 0}
            onChange={(e) => onChange(param.id, parseInt(e.target.value, 10) || 0)}
            placeholder={param.description}
          />
        );
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={param.id}
              checked={!!value}
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
            {actionParams.map((param) => (
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
            {actionParams.length === 0 && (
              <p className="text-sm text-gray-500">No configuration needed for this action type.</p>
            )}
          </div>
        </div>
        
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
            variant="destructive"
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
    </div>
  );
};

export default StepEditor; 