export type JourneyActionType = 
  | 'call'
  | 'sms'
  | 'email'
  | 'status_change'
  | 'tag_update'
  | 'webhook'
  | 'wait_for_event'
  | 'conditional_branch'
  | 'lead_assignment'
  | 'data_update'
  | 'journey_transfer'
  | 'delay';

export type DelayType = 
  | 'immediate'
  | 'fixed_time'
  | 'delay_after_previous'
  | 'delay_after_enrollment'
  | 'specific_days'; 