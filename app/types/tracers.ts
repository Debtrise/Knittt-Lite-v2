// TracersAPI Types for Lead Enrichment

export interface TracersPersonData {
  PersonId: string;
  FirstName: string;
  MiddleName?: string;
  LastName: string;
  Age?: number;
  DOB?: string;
  Phones: TracersPhone[];
  Emails: TracersEmail[];
  Addresses: TracersAddress[];
  Relatives: TracersRelative[];
  Associates: TracersAssociate[];
}

export interface TracersPhone {
  Phone: string;
  Type: string;
  Carrier?: string;
  LineType?: string;
}

export interface TracersEmail {
  Email: string;
  Type: string;
}

export interface TracersAddress {
  Address: string;
  City: string;
  State: string;
  Zip: string;
  County?: string;
  Type: string;
  DateFirstSeen?: string;
  DateLastSeen?: string;
}

export interface TracersRelative {
  Name: string;
  Relationship: string;
}

export interface TracersAssociate {
  Name: string;
  Relationship?: string;
}

// Search Requests
export interface TracersPhoneSearchRequest {
  phone: string;
  leadId?: number;
  skipCache?: boolean;
}

export interface TracersComprehensiveSearchRequest {
  searchCriteria: {
    FirstName?: string;
    LastName?: string;
    Phone?: string;
    Email?: string;
    Addresses?: Array<{
      AddressLine1: string;
      AddressLine2?: string;
    }>;
    Page?: number;
    ResultsPerPage?: number;
  };
  leadId?: number;
  skipCache?: boolean;
}

// Search Responses
export interface TracersSearchResponse {
  success: boolean;
  data: {
    results: TracersPersonData[];
    totalResults: number;
  };
}

// Lead Enrichment
export interface LeadEnrichmentRequest {
  forceRefresh?: boolean;
}

export interface LeadEnrichmentData {
  leadId: number;
  tenantId: string;
  status: 'enriched' | 'partial' | 'no_data' | 'error';
  confidence: number;
  enrichedFields: {
    name: boolean;
    age: boolean;
    emails: boolean;
    phones: boolean;
    addresses: boolean;
    relatives: boolean;
    associates: boolean;
  };
  enrichmentData: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    age?: number;
    dateOfBirth?: string;
    emails: Array<{
      email: string;
      type: string;
    }>;
    phones: Array<{
      phone: string;
      type: string;
      carrier?: string;
      lineType?: string;
    }>;
    addresses: Array<{
      address: string;
      city: string;
      state: string;
      zip: string;
      county?: string;
      type: string;
    }>;
    relatives: Array<{
      name: string;
      relationship: string;
    }>;
    tracersPersonId: string;
    lastUpdated: string;
  };
  lastEnrichedAt: string;
  nextEnrichmentDate: string;
}

export interface LeadEnrichmentResponse {
  success: boolean;
  enrichment: LeadEnrichmentData;
}

export interface BulkEnrichmentRequest {
  leadIds: number[];
}

export interface BulkEnrichmentResponse {
  success: boolean;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  results: Array<{
    leadId: number;
    status: 'success' | 'error';
    enrichment?: LeadEnrichmentData;
    error?: string;
  }>;
}

// Enrichment Status
export interface EnrichmentStatusResponse {
  enriched: boolean;
  enrichment?: {
    leadId: number;
    status: string;
    confidence: number;
    lastEnrichedAt: string;
    enrichmentData: any;
    tracersSearch: {
      id: string;
      searchType: 'phone' | 'comprehensive';
      status: 'success' | 'no_results' | 'error';
      createdAt: string;
    };
  };
}

// Search History
export interface TracersSearchHistory {
  id: string;
  searchType: 'phone' | 'comprehensive';
  searchPhone?: string;
  searchCriteria?: any;
  status: 'success' | 'no_results' | 'error';
  resultCount: number;
  cost: number;
  cacheHit: boolean;
  apiCallDuration: number;
  createdAt: string;
  lead?: {
    id: number;
    name: string;
    phone: string;
    email?: string;
  };
}

export interface SearchHistoryResponse {
  searches: TracersSearchHistory[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// Usage Statistics
export interface TracersUsageStats {
  date: string;
  searchCount: number;
  successfulSearches: number;
  failedSearches: number;
  noResultSearches: number;
  cacheHits: number;
  totalCost: number;
  searchTypes: {
    phone: number;
    comprehensive: number;
  };
  peakHour: number;
  uniquePhones: number;
}

export interface UsageStatsResponse {
  usage: TracersUsageStats[];
  totals: {
    searchCount: number;
    successfulSearches: number;
    failedSearches: number;
    noResultSearches: number;
    cacheHits: number;
    totalCost: number;
  };
  limits: {
    daily: number;
    monthly: number;
  };
  remaining: {
    daily: number;
    monthly: number;
  };
}

// Service Status
export interface TracersServiceStatus {
  enabled: boolean;
  limits: {
    daily: number;
    monthly: number;
  };
  usage: {
    today: number;
    todayRemaining: number;
  };
  costPerSearch: number;
}

// Admin endpoints
export interface TracersTestConnectionResponse {
  success: boolean;
  message: string;
  apiVersion: string;
}

export interface TracersTenantAccessRequest {
  isEnabled: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  costPerSearch: number;
}

// Error responses
export interface TracersErrorResponse {
  error: string;
  message?: string;
} 