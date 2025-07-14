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

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onClick if not in the middle of a drag operation
    e.stopPropagation();
    onEdit(step);
  };

  return (
    <div 
      className={`relative p-4 rounded-lg border-2 w-72 bg-white shadow-md transition-all hover:shadow-lg cursor-pointer
        ${selected ? 'border-brand ring-2 ring-brand ring-opacity-50' : borderColor}
        ${!isActive ? 'opacity-60' : ''}
        ${isStart ? 'bg-gradient-to-br from-green-50 to-white' : ''}
        ${isEnd ? 'bg-gradient-to-br from-red-50 to-white' : ''}
      `}
      onClick={handleClick}
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
          <div className="flex items-center gap-2 mb-1">
            {step.name}
            {step.isDayStart && (
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-300">Day Start</span>
            )}
            {step.isDayEnd && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-300">Day End</span>
            )}
          </div>
          
          {/* Show day assignment */}
          {step.conditions?.leadAgeDays?.min !== undefined && step.conditions?.leadAgeDays?.max !== undefined && 
           step.conditions.leadAgeDays.min === step.conditions.leadAgeDays.max && (
            <div className="flex items-center gap-1 text-xs text-purple-700">
              <span>📅</span>
              <span>Day {step.conditions.leadAgeDays.min + 1} leads</span>
            </div>
          )}
        </div>
        <Badge variant="outline" className={`text-xs px-2 py-1 ${isStart ? 'bg-green-100 text-green-700' : isEnd ? 'bg-red-100 text-red-700' : ''}`}>
          {actionLabel}
        </Badge>
      </div>
      
      <div className="text-sm text-gray-600 mb-3 line-clamp-2">
        {step.description || 'No description'}
      </div>
      
      {/* Day Schedule Info */}
      {(step.isDayStart || step.isDayEnd) && (
        <div className="text-xs text-blue-700 mb-2 p-2 bg-blue-50 rounded border border-blue-200">
          {step.isDayStart && (
            <div className="flex items-center gap-1">
              <span>🌅</span>
              <span>Starts at: {step.dayStartTime || '09:00'}</span>
            </div>
          )}
          {step.isDayEnd && (
            <div className="flex items-center gap-1">
              <span>🌆</span>
              <span>Ends at: {step.dayEndTime || '17:00'}</span>
            </div>
          )}
        </div>
      )}

      {/* Action-specific details */}
      <div className="text-sm text-gray-600 my-3 bg-gray-50 p-2 rounded-md border border-gray-100">
        {step.actionType === 'call' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="font-medium">
                {step.actionConfig?.transferGroupId ? 'Transfer Group' : 'Dialer Context'}
              </span>
            </div>
            {step.actionConfig?.transferGroupId ? (
              <div className="text-xs">
                <div className="font-medium">Group ID: {step.actionConfig.transferGroupId}</div>
                {step.actionConfig.fallbackDID && (
                  <div className="text-gray-500">Fallback: {step.actionConfig.fallbackDID}</div>
                )}
                {step.actionConfig.dialerContext && (
                  <div className="text-gray-500">Override Context: {step.actionConfig.dialerContext}</div>
                )}
              </div>
            ) : step.actionConfig?.dialerContext ? (
              <div className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                {typeof step.actionConfig.dialerContext === 'string' ? (
                  <span className="whitespace-pre-wrap break-all">
                    {step.actionConfig.dialerContext}
                  </span>
                ) : (
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(step.actionConfig.dialerContext, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <span className="text-gray-400 italic text-xs">No configuration</span>
            )}
          </div>
        )}
        
        {step.actionType === 'sms' && (
          <div className="flex flex-col gap-1">
            <div className="line-clamp-2">
              {step.actionConfig?.message || step.actionConfig?.templateId || 'No message'}
            </div>
            {step.actionConfig?.provider && (
              <div className="flex items-center gap-1 text-xs">
                <MessageSquare className="h-3 w-3 text-gray-400" />
                <span className="text-gray-500">Provider: {step.actionConfig.provider}</span>
              </div>
            )}
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
            {Array.isArray(step.actionConfig?.tags) ? (
              step.actionConfig.tags.map((tag: string, idx: number) => (
                <span key={idx} className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                  {tag}
                </span>
              ))
            ) : (
              <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                {step.actionConfig?.tags || 'No tags'}
              </span>
            )}
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