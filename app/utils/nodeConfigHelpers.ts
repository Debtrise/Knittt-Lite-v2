import { 
  JourneyActionType, 
  ParamDefinition,
  DelayType
} from '@/app/types/dialplan';

/**
 * Get parameter definitions for a specific action type
 */
export const getActionTypeParams = (actionType: JourneyActionType): ParamDefinition[] => {
  switch(actionType) {
    case 'call':
      return [
        {
          id: 'transferNumber',
          name: 'Transfer Number',
          type: 'string',
          required: false,
          description: 'Direct transfer number (leave empty to use transfer group)'
        },
        {
          id: 'transferGroupId',
          name: 'Transfer Group',
          type: 'transfer_group_select',
          required: false,
          description: 'Select a transfer group for routing'
        },
        {
          id: 'scriptId',
          name: 'Call Script',
          type: 'template_select',
          templateType: 'script',
          required: false,
          description: 'Select a script template for the call'
        },
        {
          id: 'fallbackDID',
          name: 'Fallback DID',
          type: 'string',
          required: false,
          description: 'Fallback DID if no DIDs available'
        },
        {
          id: 'useLocalDID',
          name: 'Use Local DID',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Whether to try matching lead\'s area code'
        },
        {
          id: 'maxAttempts',
          name: 'Maximum Attempts',
          type: 'number',
          required: false,
          default: 3,
          description: 'Maximum attempts for this call'
        },
        {
          id: 'voicemailDetection',
          name: 'Voicemail Detection',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Whether to detect voicemail'
        },
        {
          id: 'voicemailMessage',
          name: 'Voicemail Script',
          type: 'template_select',
          templateType: 'voicemail',
          required: false,
          description: 'Select a voicemail script template'
        },
        {
          id: 'callerId',
          name: 'Caller ID Name',
          type: 'string',
          required: false,
          description: 'Custom caller ID name'
        },
        {
          id: 'recordCall',
          name: 'Record Call',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Whether to record the call'
        },
        {
          id: 'respectBusinessHours',
          name: 'Respect Business Hours',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Whether to respect tenant business hours'
        },
        {
          id: 'ivrEnabled',
          name: 'Enable IVR',
          type: 'boolean',
          required: false,
          default: false,
          description: 'Enable Interactive Voice Response system'
        },
        {
          id: 'ivrPromptText',
          name: 'IVR Prompt Text',
          type: 'string',
          required: false,
          description: 'Text-to-speech prompt for IVR (e.g., "Press 1 for sales, 2 for support")'
        },
        {
          id: 'ivrPromptRecordingId',
          name: 'IVR Prompt Recording',
          type: 'recording_select',
          required: false,
          description: 'Recording ID for IVR prompt (alternative to text)'
        },
        {
          id: 'ivrTimeout',
          name: 'IVR Timeout (seconds)',
          type: 'number',
          required: false,
          default: 10,
          description: 'Seconds to wait for user input'
        },
        {
          id: 'ivrMaxRetries',
          name: 'IVR Max Retries',
          type: 'number',
          required: false,
          default: 3,
          description: 'Maximum retries for invalid input'
        },
        {
          id: 'ivrInvalidInputText',
          name: 'Invalid Input Text',
          type: 'string',
          required: false,
          description: 'Text-to-speech for invalid input (e.g., "Invalid selection, please try again")'
        },
        {
          id: 'ivrInvalidInputRecordingId',
          name: 'Invalid Input Recording',
          type: 'recording_select',
          required: false,
          description: 'Recording ID for invalid input message'
        },
        {
          id: 'ivrOptions',
          name: 'IVR Menu Options',
          type: 'ivr_options',
          required: false,
          description: 'Configure IVR menu options and actions'
        }
      ];
      
    case 'sms':
      return [
        {
          id: 'message',
          name: 'Message',
          type: 'string',
          required: false,
          description: 'SMS text (supports variables) - leave empty to use template'
        },
        {
          id: 'templateId',
          name: 'SMS Template',
          type: 'template_select',
          templateType: 'sms',
          required: false,
          description: 'Select an SMS template (alternative to message)'
        },
        {
          id: 'from',
          name: 'From Number',
          type: 'string',
          required: false,
          description: 'Sender phone number (leave empty for default)'
        },
        {
          id: 'trackClicks',
          name: 'Track Clicks',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Whether to track link clicks'
        },
        {
          id: 'optOutMessage',
          name: 'Include Opt-Out',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Include opt-out instructions'
        }
      ];
      
    case 'email':
      return [
        {
          id: 'subject',
          name: 'Subject',
          type: 'string',
          required: false,
          description: 'Email subject (leave empty to use template subject)'
        },
        {
          id: 'templateId',
          name: 'Email Template',
          type: 'template_select',
          templateType: 'email',
          required: true,
          description: 'Select an email template'
        },
        {
          id: 'from',
          name: 'From Email',
          type: 'string',
          required: false,
          description: 'Sender email (leave empty for default)'
        },
        {
          id: 'fromName',
          name: 'From Name',
          type: 'string',
          required: false,
          description: 'Sender name (leave empty for default)'
        },
        {
          id: 'replyTo',
          name: 'Reply-To',
          type: 'string',
          required: false,
          description: 'Reply-to address (leave empty for default)'
        },
        {
          id: 'trackOpens',
          name: 'Track Opens',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Track email opens'
        },
        {
          id: 'trackClicks',
          name: 'Track Clicks',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Track link clicks'
        }
      ];
      
    case 'status_change':
      return [
        {
          id: 'newStatus',
          name: 'New Status',
          type: 'string',
          required: true,
          description: 'New status value'
        },
        {
          id: 'recordNote',
          name: 'Record Note',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Add a note about the change'
        },
        {
          id: 'noteText',
          name: 'Note Text',
          type: 'string',
          required: false,
          default: 'Status changed by journey',
          description: 'Custom note text'
        },
        {
          id: 'updateLastAttempt',
          name: 'Update Last Attempt',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Update lastAttempt timestamp'
        }
      ];
      
    case 'tag_update':
      return [
        {
          id: 'operation',
          name: 'Operation',
          type: 'select',
          required: true,
          options: ['add', 'remove', 'set'],
          default: 'add',
          description: 'Operation: add, remove, or set'
        },
        {
          id: 'tags',
          name: 'Tags',
          type: 'string',
          required: true,
          description: 'Comma-separated tags to operate on'
        },
        {
          id: 'recordNote',
          name: 'Record Note',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Record a note about tag changes'
        },
        {
          id: 'noteText',
          name: 'Note Text',
          type: 'string',
          required: false,
          default: 'Tags updated by journey',
          description: 'Custom note text'
        }
      ];
      
    case 'webhook':
      return [
        {
          id: 'url',
          name: 'Webhook URL',
          type: 'string',
          required: true,
          description: 'Webhook URL'
        },
        {
          id: 'method',
          name: 'HTTP Method',
          type: 'select',
          options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          required: false,
          default: 'POST',
          description: 'HTTP method'
        },
        {
          id: 'timeout',
          name: 'Timeout (ms)',
          type: 'number',
          required: false,
          default: 10000,
          description: 'Timeout in milliseconds'
        },
        {
          id: 'retries',
          name: 'Retries',
          type: 'number',
          required: false,
          default: 3,
          description: 'Number of retry attempts'
        },
        {
          id: 'updateLeadData',
          name: 'Update Lead Data',
          type: 'boolean',
          required: false,
          default: false,
          description: 'Update lead with response data'
        }
      ];
      
    case 'wait_for_event':
      return [
        {
          id: 'eventType',
          name: 'Event Type',
          type: 'select',
          options: ['inbound_call', 'email_opened', 'link_clicked', 'form_submitted', 'sms_replied'],
          required: true,
          description: 'Event type to wait for'
        },
        {
          id: 'timeoutDays',
          name: 'Timeout Days',
          type: 'number',
          required: false,
          default: 7,
          description: 'Days to wait before timing out'
        },
        {
          id: 'timeoutAction',
          name: 'Timeout Action',
          type: 'select',
          options: ['skip_step', 'end_journey'],
          required: false,
          default: 'skip_step',
          description: 'Action on timeout'
        },
        {
          id: 'captureData',
          name: 'Capture Event Data',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Whether to capture event data'
        }
      ];
      
    case 'conditional_branch':
      return [
        {
          id: 'conditionField',
          name: 'Condition Field',
          type: 'string',
          required: true,
          description: 'Field to evaluate (e.g., additionalData.value)'
        },
        {
          id: 'operator',
          name: 'Operator',
          type: 'select',
          options: ['=', '!=', '>', '<', '>=', '<=', 'contains', 'not_contains', 'exists', 'not_exists'],
          required: true,
          description: 'Comparison operator'
        },
        {
          id: 'value',
          name: 'Value',
          type: 'string',
          required: false,
          description: 'Value to compare against'
        },
        {
          id: 'nextStepId',
          name: 'Next Step ID',
          type: 'number',
          required: true,
          description: 'ID of step to go to if condition is true'
        },
        {
          id: 'defaultNextStepId',
          name: 'Default Next Step ID',
          type: 'number',
          required: false,
          description: 'Default step if condition is false'
        }
      ];
      
    case 'lead_assignment':
      return [
        {
          id: 'assignmentType',
          name: 'Assignment Type',
          type: 'select',
          options: ['user', 'team'],
          required: true,
          description: 'User or team'
        },
        {
          id: 'assignToId',
          name: 'Assign To ID',
          type: 'string',
          required: true,
          description: 'User or team ID'
        },
        {
          id: 'notifyAssignee',
          name: 'Notify Assignee',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Send notification to assignee'
        },
        {
          id: 'notificationMethod',
          name: 'Notification Method',
          type: 'select',
          options: ['email', 'sms', 'system'],
          required: false,
          default: 'email',
          description: 'Method to notify assignee'
        },
        {
          id: 'assignmentNote',
          name: 'Assignment Note',
          type: 'string',
          required: false,
          description: 'Note for the assignee'
        },
        {
          id: 'priority',
          name: 'Priority',
          type: 'select',
          options: ['low', 'medium', 'high', 'urgent'],
          required: false,
          default: 'medium',
          description: 'Priority level'
        }
      ];
      
    case 'data_update':
      return [
        {
          id: 'field',
          name: 'Field',
          type: 'string',
          required: true,
          description: 'Field to update (e.g., additionalData.score)'
        },
        {
          id: 'value',
          name: 'Value',
          type: 'string',
          required: true,
          description: 'New value'
        },
        {
          id: 'operation',
          name: 'Operation',
          type: 'select',
          options: ['set', 'increment', 'decrement'],
          required: false,
          default: 'set',
          description: 'Operation to perform'
        },
        {
          id: 'recordNote',
          name: 'Record Note',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Record a note about the update'
        }
      ];
      
    case 'journey_transfer':
      return [
        {
          id: 'targetJourneyId',
          name: 'Target Journey ID',
          type: 'number',
          required: true,
          description: 'Target journey ID'
        },
        {
          id: 'exitCurrentJourney',
          name: 'Exit Current Journey',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Whether to exit the current journey'
        },
        {
          id: 'transferContextData',
          name: 'Transfer Context Data',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Transfer context data to new journey'
        },
        {
          id: 'startAtStep',
          name: 'Start At Step',
          type: 'number',
          required: false,
          description: 'Start at specific step ID (null = start at beginning)'
        }
      ];
      
    case 'delay':
      return [
        {
          id: 'minutes',
          name: 'Minutes',
          type: 'number',
          required: false,
          default: 0,
          description: 'Minutes to delay'
        },
        {
          id: 'hours',
          name: 'Hours',
          type: 'number',
          required: false,
          default: 0,
          description: 'Hours to delay'
        },
        {
          id: 'days',
          name: 'Days',
          type: 'number',
          required: false,
          default: 0,
          description: 'Days to delay'
        },
        {
          id: 'businessHoursOnly',
          name: 'Business Hours Only',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Only count business hours'
        },
        {
          id: 'exactDateTime',
          name: 'Exact Date/Time',
          type: 'string',
          required: false,
          description: 'Specific date/time to resume (ISO format)'
        },
        {
          id: 'overrideStepDelay',
          name: 'Override Step Delay',
          type: 'boolean',
          required: false,
          default: true,
          description: 'Whether this overrides the step\'s delayConfig'
        }
      ];
      
    default:
      return [];
  }
};

/**
 * Get parameter definitions for a delay type
 */
export const getDelayTypeParams = (delayType: DelayType): ParamDefinition[] => {
  switch(delayType) {
    case 'immediate':
      return [];
      
    case 'fixed_time':
      return [
        {
          id: 'time',
          name: 'Time',
          type: 'string',
          required: true,
          description: 'Time in HH:MM format (24-hour)'
        }
      ];
      
    case 'delay_after_previous':
      return [
        {
          id: 'minutes',
          name: 'Minutes',
          type: 'number',
          required: false,
          default: 0,
          description: 'Minutes to delay'
        },
        {
          id: 'hours',
          name: 'Hours',
          type: 'number',
          required: false,
          default: 0,
          description: 'Hours to delay'
        },
        {
          id: 'days',
          name: 'Days',
          type: 'number',
          required: false,
          default: 0,
          description: 'Days to delay'
        }
      ];
      
    case 'delay_after_enrollment':
      return [
        {
          id: 'minutes',
          name: 'Minutes',
          type: 'number',
          required: false,
          default: 0,
          description: 'Minutes to delay'
        },
        {
          id: 'hours',
          name: 'Hours',
          type: 'number',
          required: false,
          default: 0,
          description: 'Hours to delay'
        },
        {
          id: 'days',
          name: 'Days',
          type: 'number',
          required: false,
          default: 0,
          description: 'Days to delay'
        }
      ];
      
    case 'specific_days':
      return [
        {
          id: 'days',
          name: 'Days',
          type: 'select',
          options: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          required: true,
          description: 'Days of the week to execute'
        },
        {
          id: 'time',
          name: 'Time',
          type: 'string',
          required: true,
          description: 'Time in HH:MM format (24-hour)'
        }
      ];
      
    default:
      return [];
  }
};

/**
 * Get default property values for a specific action type
 */
export const getDefaultActionConfigValues = (actionType: JourneyActionType): Record<string, any> => {
  const paramDefs = getActionTypeParams(actionType);
  const defaultValues: Record<string, any> = {};
  
  paramDefs.forEach(param => {
    if (param.default !== undefined) {
      defaultValues[param.id] = param.default;
    } else if (param.required) {
      // For required fields without defaults, set reasonable empty values
      if (param.type === 'string') defaultValues[param.id] = '';
      else if (param.type === 'number') defaultValues[param.id] = 0;
      else if (param.type === 'boolean') defaultValues[param.id] = false;
      else if (param.type === 'select' && param.options && param.options.length > 0) {
        defaultValues[param.id] = param.options[0];
      }
    }
  });
  
  return defaultValues;
};

/**
 * Get default property values for a specific delay type
 */
export const getDefaultDelayConfigValues = (delayType: DelayType): Record<string, any> => {
  const paramDefs = getDelayTypeParams(delayType);
  const defaultValues: Record<string, any> = {};
  
  paramDefs.forEach(param => {
    if (param.default !== undefined) {
      defaultValues[param.id] = param.default;
    } else if (param.required) {
      // For required fields without defaults, set reasonable empty values
      if (param.type === 'string') defaultValues[param.id] = '';
      else if (param.type === 'number') defaultValues[param.id] = 0;
      else if (param.type === 'boolean') defaultValues[param.id] = false;
      else if (param.type === 'select' && param.options && param.options.length > 0) {
        defaultValues[param.id] = param.options[0];
      }
    }
  });
  
  return defaultValues;
}; 