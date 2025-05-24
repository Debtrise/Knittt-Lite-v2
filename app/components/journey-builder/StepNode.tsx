import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Phone, Mail, MessageSquare, Tag, FileText, ExternalLink, Clock, 
  AlertCircle, ArrowRightCircle, Users, Database, RefreshCw, HelpCircle 
} from 'lucide-react';
import { JourneyStep } from '@/app/types/journey';
import { Badge } from '@/app/components/ui/badge';

interface StepNodeProps extends NodeProps {
  data: {
    step: JourneyStep;
    selected: boolean;
    onEdit: (step: JourneyStep) => void;
    displayIndex?: number;
  };
}

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'call':
      return <Phone className="h-4 w-4 text-blue-500" />;
    case 'sms':
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'email':
      return <Mail className="h-4 w-4 text-amber-500" />;
    case 'status_change':
      return <FileText className="h-4 w-4 text-purple-500" />;
    case 'tag_update':
      return <Tag className="h-4 w-4 text-indigo-500" />;
    case 'webhook':
      return <ExternalLink className="h-4 w-4 text-gray-500" />;
    case 'wait_for_event':
      return <Clock className="h-4 w-4 text-teal-500" />;
    case 'conditional_branch':
      return <ArrowRightCircle className="h-4 w-4 text-indigo-500" />;
    case 'lead_assignment':
      return <Users className="h-4 w-4 text-blue-400" />;
    case 'data_update':
      return <Database className="h-4 w-4 text-orange-500" />;
    case 'journey_transfer':
      return <RefreshCw className="h-4 w-4 text-red-500" />;
    case 'delay':
      return <Clock className="h-4 w-4 text-gray-500" />;
    default:
      return <HelpCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getNodeBorderColor = (actionType: string, isStart: boolean, isEnd: boolean) => {
  switch (actionType) {
    case 'call':
      return isStart ? 'border-green-300' : isEnd ? 'border-red-300' : 'border-blue-300';
    case 'sms':
      return isStart ? 'border-green-300' : isEnd ? 'border-red-300' : 'border-green-300';
    case 'email':
      return isStart ? 'border-green-300' : isEnd ? 'border-red-300' : 'border-amber-300';
    case 'status_change':
      return isStart ? 'border-green-300' : isEnd ? 'border-red-300' : 'border-purple-300';
    case 'tag_update':
      return isStart ? 'border-green-300' : isEnd ? 'border-red-300' : 'border-indigo-300';
    case 'webhook':
      return isStart ? 'border-green-300' : isEnd ? 'border-red-300' : 'border-gray-300';
    case 'wait_for_event':
      return isStart ? 'border-green-300' : isEnd ? 'border-red-300' : 'border-teal-300';
    case 'conditional_branch':
      return isStart ? 'border-green-300' : isEnd ? 'border-red-300' : 'border-indigo-300';
    case 'lead_assignment':
      return isStart ? 'border-green-300' : isEnd ? 'border-red-300' : 'border-blue-300';
    case 'data_update':
      return isStart ? 'border-green-300' : isEnd ? 'border-red-300' : 'border-orange-300';
    case 'journey_transfer':
      return isStart ? 'border-green-300' : isEnd ? 'border-red-300' : 'border-red-300';
    case 'delay':
      return isStart ? 'border-green-300' : isEnd ? 'border-red-300' : 'border-gray-300';
    default:
      return 'border-gray-300';
  }
};

const getActionTypeLabel = (actionType: string, isStart: boolean, isEnd: boolean) => {
  switch (actionType) {
    case 'call':
      return isStart ? 'Start' : isEnd ? 'End' : 'Call';
    case 'sms':
      return isStart ? 'Start' : isEnd ? 'End' : 'SMS';
    case 'email':
      return isStart ? 'Start' : isEnd ? 'End' : 'Email';
    case 'status_change':
      return isStart ? 'Start' : isEnd ? 'End' : 'Status Change';
    case 'tag_update':
      return isStart ? 'Start' : isEnd ? 'End' : 'Tag Update';
    case 'webhook':
      return isStart ? 'Start' : isEnd ? 'End' : 'Webhook';
    case 'wait_for_event':
      return isStart ? 'Start' : isEnd ? 'End' : 'Wait for Event';
    case 'conditional_branch':
      return isStart ? 'Start' : isEnd ? 'End' : 'Branch';
    case 'lead_assignment':
      return isStart ? 'Start' : isEnd ? 'End' : 'Assignment';
    case 'data_update':
      return isStart ? 'Start' : isEnd ? 'End' : 'Data Update';
    case 'journey_transfer':
      return isStart ? 'Start' : isEnd ? 'End' : 'Transfer';
    case 'delay':
      return isStart ? 'Start' : isEnd ? 'End' : 'Delay';
    default:
      return 'Unknown';
  }
};

const getDelayText = (delayType: string, delayConfig: Record<string, any>) => {
  switch (delayType) {
    case 'immediate':
      return 'Immediate';
    case 'fixed_time':
      return `At ${delayConfig.time || 'specific time'}`;
    case 'delay_after_previous':
      const minutes = delayConfig.minutes || 0;
      const hours = delayConfig.hours || 0;
      const days = delayConfig.days || 0;
      
      const parts = [];
      if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
      if (hours > 0) parts.push(`${hours} hr${hours !== 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} min${minutes !== 1 ? 's' : ''}`);
      
      return parts.length > 0 
        ? `${parts.join(', ')} after previous` 
        : 'After previous';
    case 'delay_after_enrollment':
      return `${delayConfig.days || 0}d ${delayConfig.hours || 0}h after enrollment`;
    case 'specific_days':
      const days_list = Array.isArray(delayConfig.days) ? delayConfig.days : [];
      const day_names = days_list.map((d: string) => d.substring(0, 3)).join(', ');
      return `On ${day_names || 'specific days'}`;
    default:
      return 'Custom delay';
  }
};

const StepNode = ({ data }: StepNodeProps) => {
  const { step, selected, onEdit, displayIndex } = data;
  const isExitPoint = step.isExitPoint;
  const isActive = step.isActive;
  const isStart = step.stepOrder === 0;
  const isEnd = isExitPoint;
  const borderColor = getNodeBorderColor(step.actionType, isStart, isEnd);
  const actionLabel = getActionTypeLabel(step.actionType, isStart, isEnd);
  
  // Display index (1, 2, 3) or fall back to the step ID if not provided
  const displayNumber = displayIndex !== undefined ? displayIndex + 1 : Math.ceil(step.stepOrder / 10);

  return (
    <div 
      className={`relative p-4 rounded-lg border-2 w-72 bg-white shadow-md transition-all hover:shadow-lg
        ${selected ? 'border-brand ring-2 ring-brand ring-opacity-50' : borderColor}
        ${!isActive ? 'opacity-60' : ''}
        ${isStart ? 'bg-gradient-to-br from-green-50 to-white' : ''}
        ${isEnd ? 'bg-gradient-to-br from-red-50 to-white' : ''}
      `}
      onClick={() => onEdit(step)}
    >
      {!isStart && !isEnd && (
        <div className="absolute -left-3 -top-3 bg-brand text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium shadow-md">
          {displayNumber}
        </div>
      )}
      
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-gray-400 !border-2 !border-white"
        />
      )}
      
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-full ${isStart ? 'bg-green-100' : isEnd ? 'bg-red-100' : 'bg-gray-100'} flex items-center justify-center shadow-sm`}>
          {isStart ? <ArrowRightCircle className="h-5 w-5 text-green-500" /> :
           isEnd ? <AlertCircle className="h-5 w-5 text-red-500" /> :
           getActionIcon(step.actionType)}
        </div>
        <div className="flex-1 truncate font-medium text-gray-800 text-base">
          {step.name}
        </div>
        <Badge variant="outline" className={`text-xs px-2 py-1 ${isStart ? 'bg-green-100 text-green-700' : isEnd ? 'bg-red-100 text-red-700' : ''}`}>
          {actionLabel}
        </Badge>
      </div>
      
      <div className="text-sm text-gray-600 mb-3 line-clamp-2">
        {step.description || 'No description'}
      </div>
      
      {/* Action-specific details */}
      <div className="text-sm text-gray-600 my-3 bg-gray-50 p-2 rounded-md border border-gray-100">
        {step.actionType === 'call' && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{step.actionConfig?.transferNumber || 'No number'}</span>
          </div>
        )}
        
        {step.actionType === 'sms' && (
          <div className="line-clamp-2">
            {step.actionConfig?.message || step.actionConfig?.templateId || 'No message'}
          </div>
        )}
        
        {step.actionType === 'email' && (
          <div className="line-clamp-2">
            {step.actionConfig?.subject || 'No subject'}
          </div>
        )}
        
        {step.actionType === 'status_change' && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span>Status: <span className="font-medium">{step.actionConfig?.newStatus || 'Not set'}</span></span>
          </div>
        )}
        
        {step.actionType === 'tag_update' && (
          <div className="flex flex-wrap gap-1">
            {step.actionConfig?.operation || 'add'}: 
            {(step.actionConfig?.tags || []).map((tag: string, idx: number) => (
              <span key={idx} className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                {tag}
              </span>
            ))}
            {(!step.actionConfig?.tags || step.actionConfig?.tags.length === 0) && 
              <span className="text-gray-400">No tags</span>
            }
          </div>
        )}
        
        {step.actionType === 'conditional_branch' && (
          <div className="flex items-center gap-2">
            <ArrowRightCircle className="h-4 w-4 text-gray-400" />
            <span>{step.actionConfig?.branches?.length || 0} condition(s)</span>
          </div>
        )}
        
        {step.actionType === 'wait_for_event' && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>Wait for: {step.actionConfig?.eventType || 'any event'}</span>
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-600 flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500">{getDelayText(step.delayType, step.delayConfig)}</span>
        </span>
        
        <div className="flex items-center gap-2">
          {!isActive && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
              Inactive
            </span>
          )}
          {isExitPoint && !isEnd && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
              Exit
            </span>
          )}
        </div>
      </div>
      
      {!isEnd && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-gray-400 !border-2 !border-white"
        />
      )}
    </div>
  );
};

export default memo(StepNode); 