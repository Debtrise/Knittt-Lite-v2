export interface Lead {
  id: number;
  tenantId: string;
  phone: string;
  name: string;
  email: string;
  brand?: string;
  source?: string;
  status: string;
  createdAt: string;
  additionalData?: Record<string, any>;
  ageDays?: number;
  tags?: string[];
}

export interface LeadDetail extends Lead {
  callHistory?: {
    calls: Array<{
      id: number;
      startTime: string;
      endTime?: string;
      duration: number;
      status: string;
      from: string;
      to: string;
    }>;
    stats?: {
      totalCalls: number;
      totalDuration: number;
      averageDuration: number;
      longestCall: number;
    };
  };
  activeJourneys?: Array<{
    id: number;
    journeyId: number;
    journeyName: string;
    status: string;
    currentStep?: string;
    nextExecution?: string;
  }>;
}

export interface LeadFilterOptions {
  page?: number;
  limit?: number;
  status?: string;
  phone?: string;
  name?: string;
  email?: string;
  brand?: string; 
  source?: string;
  minAgeDays?: number;
  maxAgeDays?: number;
}

export interface BulkEnrollCriteria {
  brands?: string[];
  sources?: string[];
  leadAgeDays?: {
    min?: number;
    max?: number;
  };
  leadStatus?: string[];
  leadTags?: string[];
}

export interface JourneyMatchingStats {
  totalLeads: number;
  matchingLeads: number;
  criteriaBreakdown: {
    leadStatus: number;
    leadTags: number;
    leadAgeDays: number;
    brands: number;
    sources: number;
  };
}

export interface JourneyBrandStats {
  brandBreakdown: Array<{
    brand: string;
    activeJourneys: number;
    completedJourneys: number;
    conversionRate: number;
  }>;
}

export interface JourneySourceStats {
  sourceBreakdown: Array<{
    source: string;
    activeJourneys: number;
    completedJourneys: number;
    conversionRate: number;
  }>;
} 