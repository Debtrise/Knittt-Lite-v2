import { Position } from 'reactflow';

// Project Types
export interface DialplanProject {
  id: number;
  name: string;
  description?: string;
  tenantId?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
  lastDeployed?: string | null;
  createdAt: string;
  updatedAt: string;
  contexts?: DialplanContext[];
  deployments?: DialplanDeployment[];
}

// Context Types
export interface DialplanContext {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  position: {
    x: number;
    y: number;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  nodes?: DialplanNode[];
}

// Node Types
export interface DialplanNode {
  id: number;
  contextId: number;
  nodeTypeId: number;
  name: string;
  label: string;
  position: {
    x: number;
    y: number;
  };
  properties: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NodeType {
  id: number;
  name: string;
  description: string;
  category: 'extension' | 'application' | 'flowcontrol' | 'action' | 'terminal';
  inputHandles?: number;
  outputHandles?: number;
  defaultParams?: Record<string, any>;
  paramDefs?: ParamDefinition[];
}

export interface ParamDefinition {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'template_select' | 'transfer_group_select' | 'recording_select' | 'ivr_options';
  required: boolean;
  default?: any;
  options?: string[]; // For select type
  templateType?: 'sms' | 'email' | 'script' | 'voicemail' | 'transfer'; // For template_select type
  description?: string;
}

// Journey Node Action Types
export type JourneyActionType = 
  'call' | 
  'sms' | 
  'email' | 
  'status_change' | 
  'tag_update' | 
  'webhook' | 
  'wait_for_event' | 
  'conditional_branch' | 
  'lead_assignment' | 
  'data_update' | 
  'journey_transfer' | 
  'delay';

// Journey Node Action Configuration Interfaces
export interface CommonActionConfig {
  respectBusinessHours?: boolean;
  timeoutAfter?: number;
  maxRetries?: number;
  notifyOnError?: string[];
  errorHandler?: {
    action: 'retry' | 'skip' | 'end_journey';
    delay?: number;
  };
  logLevel?: 'error' | 'warning' | 'info' | 'debug' | 'verbose';
}

export interface CallActionConfig extends CommonActionConfig {
  transferNumber: string;
  scriptId?: string;
  fallbackDID?: string;
  useLocalDID?: boolean;
  maxAttempts?: number;
  voicemailDetection?: boolean;
  voicemailMessage?: string;
  callerId?: string;
  variables?: Record<string, any>;
  recordCall?: boolean;
}

export interface SmsActionConfig extends CommonActionConfig {
  message?: string;
  templateId?: string;
  from?: string;
  media?: string[];
  trackClicks?: boolean;
  optOutMessage?: boolean;
  scheduleTime?: string | null;
  variables?: Record<string, any>;
}

export interface EmailActionConfig extends CommonActionConfig {
  subject: string;
  templateId: string;
  from?: string;
  fromName?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: string[];
  trackOpens?: boolean;
  trackClicks?: boolean;
  replyTo?: string;
  variables?: Record<string, any>;
}

export interface StatusChangeActionConfig extends CommonActionConfig {
  newStatus: string;
  onlyIfCurrent?: string[];
  recordNote?: boolean;
  noteText?: string;
  updateLastAttempt?: boolean;
}

export interface TagUpdateActionConfig extends CommonActionConfig {
  operation: 'add' | 'remove' | 'set';
  tags: string[];
  recordNote?: boolean;
  noteText?: string;
}

export interface WebhookActionConfig extends CommonActionConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, any>;
  timeout?: number;
  retries?: number;
  successCodes?: number[];
  validateResponse?: boolean;
  updateLeadData?: boolean;
  dataMapping?: Record<string, string>;
}

export interface WaitForEventActionConfig extends CommonActionConfig {
  eventType: string;
  timeout?: {
    days: number;
    action: 'skip_step' | 'end_journey';
  };
  conditions?: Record<string, any>;
  captureData?: boolean;
  dataMapping?: Record<string, string>;
}

export interface ConditionalBranchConfig extends CommonActionConfig {
  branches: Array<{
    name?: string;
    conditions: Record<string, any>;
    nextStepId: number;
  }>;
  defaultNextStepId?: number;
}

export interface LeadAssignmentConfig extends CommonActionConfig {
  assignmentType: 'user' | 'team';
  assignToId: string;
  notifyAssignee?: boolean;
  notificationMethod?: 'email' | 'sms' | 'system';
  assignmentNote?: string;
  priority?: string;
  dueDate?: {
    days: number;
    businessDaysOnly?: boolean;
  };
}

export interface DataUpdateConfig extends CommonActionConfig {
  updates: Array<{
    field: string;
    value: any;
    operation?: 'set' | 'increment' | 'decrement';
  }>;
  conditions?: Record<string, any>;
  recordNote?: boolean;
}

export interface JourneyTransferConfig extends CommonActionConfig {
  targetJourneyId: number;
  exitCurrentJourney?: boolean;
  transferContextData?: boolean;
  specificContextFields?: string[];
  startAtStep?: number | null;
}

export interface DelayActionConfig extends CommonActionConfig {
  minutes?: number;
  hours?: number;
  days?: number;
  businessHoursOnly?: boolean;
  exactDateTime?: string | null;
  overrideStepDelay?: boolean;
}

// Journey Step Delay Types
export type DelayType = 'immediate' | 'fixed_time' | 'delay_after_previous' | 'delay_after_enrollment' | 'specific_days';

export interface ImmediateDelayConfig {}

export interface FixedTimeDelayConfig {
  time: string; // HH:MM format (24-hour)
}

export interface DelayAfterPreviousConfig {
  minutes?: number;
  hours?: number;
  days?: number;
}

export interface DelayAfterEnrollmentConfig {
  minutes?: number;
  hours?: number;
  days?: number;
}

export interface SpecificDaysDelayConfig {
  days: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>;
  time: string; // HH:MM format (24-hour)
}

export type DelayConfig = 
  ImmediateDelayConfig | 
  FixedTimeDelayConfig | 
  DelayAfterPreviousConfig | 
  DelayAfterEnrollmentConfig | 
  SpecificDaysDelayConfig;

// Connection Types
export interface DialplanConnection {
  id: number;
  sourceNodeId: number;
  targetNodeId: number;
  condition: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
  sourceNode?: DialplanNode;
  targetNode?: DialplanNode;
}

// Deployment Types
export interface DialplanDeployment {
  id: number;
  projectId: number;
  deployedAt: string;
  status: 'success' | 'failed';
  serverResponse: string;
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  timestamp: string;
}

export interface ValidationIssue {
  level: 'project' | 'context' | 'node' | 'connection';
  nodeId?: number;
  nodeName?: string;
  contextId?: number;
  contextName?: string;
  message: string;
  severity: 'error' | 'warning';
}

// Generation Types
export interface DialplanGenerationResult {
  dialplan: string;
  project: string;
  contexts: number;
  timestamp: string;
}

// Deployment Request Types
export interface DeploymentRequest {
  server: string;
  port: number;
  username: string;
  password: string;
  asteriskPath: string;
}

// Capabilities Types
export interface DialplanCapabilities {
  message: string;
  capabilities: {
    nodeTypes: Record<string, NodeType>;
    generator: boolean;
    validator: boolean;
    deployment: boolean;
  };
}

// React Flow Types (for the UI)
export interface ReactFlowNode {
  id: string;
  type: string;
  data: {
    label: string;
    nodeType: NodeType;
    properties: Record<string, any>;
    dialplanNode: DialplanNode;
    isEntry?: boolean;
    isExit?: boolean;
  };
  position: Position;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  data?: {
    condition: string | null;
    priority: number;
    dialplanConnection: DialplanConnection;
  };
}

export interface ReactFlowGraph {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

export interface DialplanEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  data?: {
    condition: string | null;
    priority: number;
  };
} 