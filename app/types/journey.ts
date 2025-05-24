export interface Journey {
  id: number;
  name: string;
  description: string;
  tenantId: string;
  isActive: boolean;
  triggerCriteria: {
    leadStatus: string[];
    leadTags: string[];
    leadAgeDays?: {
      min?: number;
      max?: number;
    };
    brands?: string[];
    sources?: string[];
    autoEnroll: boolean;
  };
  createdAt: string;
  updatedAt: string;
  activeLeadsCount?: number;
  completedLeadsCount?: number;
  failedLeadsCount?: number;
}

export interface JourneyStep {
  id: number;
  name: string;
  description: string;
  journeyId: number;
  stepOrder: number;
  actionType: 'call' | 'sms' | 'email' | 'status_change' | 'tag_update' | 'webhook' | 'wait_for_event' | 'conditional_branch' | 'lead_assignment' | 'data_update' | 'journey_transfer' | 'delay';
  actionConfig: Record<string, any>;
  delayType: 'immediate' | 'fixed_time' | 'delay_after_previous' | 'delay_after_enrollment' | 'specific_days';
  delayConfig: Record<string, any>;
  conditions: {
    leadAgeDays?: {
      min?: number;
      max?: number;
    };
    brands?: string[];
    sources?: string[];
    status?: string | string[];
    callOutcomes?: string[];
    [key: string]: any;
  };
  isActive: boolean;
  isExitPoint: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadJourney {
  id: number;
  leadId: number;
  journeyId: number;
  status: 'active' | 'paused' | 'completed' | 'failed' | 'exited';
  currentStepId: number | null;
  startedAt: string;
  nextExecutionTime: string | null;
  lastExecutionTime: string | null;
  Lead?: {
    id: number;
    name: string;
    phone: string;
    email: string;
    status: string;
    brand?: string;
    source?: string;
    ageDays?: number;
  };
  Journey?: Journey;
  currentStep?: JourneyStep;
}

export interface JourneyExecution {
  id: number;
  leadJourneyId: number;
  stepId: number;
  scheduledTime: string;
  status: 'pending' | 'completed' | 'failed';
  attempts?: number;
  lastAttempt?: string;
  result?: Record<string, any>;
  LeadJourney?: LeadJourney;
  JourneyStep?: JourneyStep;
}

export interface JourneyStatistics {
  activeJourneys: number;
  activeLeadJourneys: number;
  completedLeadJourneys: number;
  topJourneys: Array<{
    id: number;
    name: string;
  }>;
}

export interface StepCompletionCount {
  stepId: number;
  completions: number;
}

export interface JourneyWithSteps extends Journey {
  steps: JourneyStep[];
  stepCompletionCounts?: StepCompletionCount[];
} 