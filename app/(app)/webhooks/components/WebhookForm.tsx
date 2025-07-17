'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { 
  createWebhook, 
  updateWebhook, 
  getWebhookDetails, 
  getWebhookConfigOptions, 
  getConditionOperators, 
  getActionTypes, 
  getAnnouncementTemplates, 
  getAnnouncementDisplays, 
  testAnnouncement, 
  testWebhook 
} from '@/app/utils/api';
import api from '@/app/lib/api';
import { WebhookEndpoint, CreateWebhookParams, UpdateWebhookParams, AnnouncementProject, AnnouncementDisplay, WebhookType, ConditionalRules, ConditionSet, Condition, Action, CallConfig } from '@/app/types/webhook';
import { toast } from 'react-hot-toast';
import { X, Play, Pause, Square, Sparkles, Loader2, RefreshCw, CheckCircle, AlertCircle, Phone } from 'lucide-react';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { useAuthStore } from '@/app/store/authStore';

// Define AnnouncementTemplate interface locally
interface AnnouncementTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  variables?: string[] | Record<string, any>;
  thumbnail?: string;
  isPublic?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

type WebhookFormProps = {
  webhookId?: number;
  isEdit?: boolean;
  onSuccess?: (webhook: any) => void;
};

interface Journey {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

// Enhanced loading state component
const LoadingState = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-3">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="text-muted-foreground">{message}</span>
    </div>
  </div>
);

// Enhanced error state component
const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center space-y-3">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  </div>
);

// Enhanced success state component
const SuccessState = ({ message }: { message: string }) => (
  <div className="flex items-center space-x-2 text-green-600">
    <CheckCircle className="h-4 w-4" />
    <span className="text-sm">{message}</span>
  </div>
);

export default function WebhookForm({ webhookId, isEdit = false, onSuccess }: WebhookFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Enhanced state management for API data
  const [availableJourneys, setAvailableJourneys] = useState<Journey[]>([]);
  const [journeysLoading, setJourneysLoading] = useState(false);
  const [journeysError, setJourneysError] = useState<string | null>(null);
  
  const [availableWebhookFields, setAvailableWebhookFields] = useState<string[]>([]);
  
  const [availableTemplates, setAvailableTemplates] = useState<AnnouncementTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  
  const [availableDisplays, setAvailableDisplays] = useState<AnnouncementDisplay[]>([]);
  const [displaysLoading, setDisplaysLoading] = useState(false);
  const [displaysError, setDisplaysError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateWebhookParams>({
    name: '',
    description: '',
    webhookType: 'go',
    brand: '',
    source: '',
    fieldMapping: {
      phone: 'phone',
      name: 'full_name',
      email: 'email_address',
    },
    validationRules: {
      requirePhone: true,
      requireName: false,
      requireEmail: false,
      allowDuplicatePhone: false,
    },
    autoTagRules: [
      {
        field: 'source',
        operator: 'equals',
        value: 'website',
        tag: 'web-lead',
      },
    ],
    callConfig: {
      enabled: false,
      dialerContext: 'BDS_Prime_Dialer',
      transferNumber: '',
      maxAttempts: 3,
      delayBetweenCalls: 300,
      amd: false,
      playPosition: false,
      skipPositionAnnouncement: true,
      ivrFile: '',
      recordingId: undefined
    },
    pauseResumeConfig: {
      enabled: false,
      resumeConditions: {
        timerResume: {
          enabled: false,
          delayMinutes: 0,
          delayHours: 0,
          delayDays: 0
        },
        statusResume: {
          enabled: false,
          targetStatuses: [],
          checkInterval: 30
        },
        tagResume: {
          enabled: false,
          requiredTags: [],
          forbiddenTags: [],
          checkInterval: 30
        },
        externalResume: {
          enabled: false
        }
      },
      pauseActions: {
        pauseJourneys: true,
        addPauseTag: true,
        pauseTagName: 'paused',
        sendNotification: false
      },
      resumeActions: {
        resumeJourneys: true,
        removePauseTag: true,
        addResumeTag: false,
        resumeTagName: 'resumed',
        sendNotification: false
      }
    },
    stopConfig: {
      enabled: false,
      stopActions: {
        exitJourneys: true,
        addStopTag: true,
        stopTagName: 'stopped',
        markAsDNC: false,
        markAsSold: false,
        preventFutureEnrollment: true
      },
      stopMetadata: {
        trackStopReason: true,
        trackStopSource: true,
        trackStopTimestamp: true
      }
    },
    announcementConfig: {
      enabled: false,
      announcementType: 'template', // Default to template
      contentCreator: {
        templateId: '',
        variableMapping: {},
        autoGenerate: true,
        templateName: 'Announcement - {{timestamp}}'
      },
      optisigns: {
        displaySelection: {
          mode: 'all'
        },
        takeover: {
          priority: 'MEDIUM',
          duration: 30,
          restoreAfter: true,
          overrideCurrent: false
        },
        scheduling: {
          immediate: true
        }
      }
    }
  });

  // Additional state for fields that need custom handling
  const [fieldMappings, setFieldMappings] = useState<Array<{ key: string; value: string }>>([
    { key: 'phone', value: 'phone' },
    { key: 'name', value: 'full_name' },
    { key: 'email', value: 'email_address', },
  ]);
  
  const [customFieldMappings, setCustomFieldMappings] = useState<Array<{ key: string; value: string }>>([]);
  
  const [autoTagRules, setAutoTagRules] = useState<
    Array<{
      field: string;
      operator: 'equals' | 'contains' | 'exists';
      value?: string;
      tag: string;
    }>
  >([
    {
      field: 'source',
      operator: 'equals',
      value: 'website',
      tag: 'web-lead',
    },
  ]);
  
  const [requiredHeaders, setRequiredHeaders] = useState<Array<{ key: string; value: string }>>([]);

  // New state for conditional rules
  const [conditionalRules, setConditionalRules] = useState<ConditionalRules>({
    enabled: false,
    logicOperator: 'AND',
    conditionSets: []
  });

  // Available operators for conditions
  const conditionOperators = [
    { value: 'equals', label: 'Equals', dataTypes: ['string', 'number', 'boolean'] },
    { value: 'not_equals', label: 'Not Equals', dataTypes: ['string', 'number', 'boolean'] },
    { value: 'contains', label: 'Contains', dataTypes: ['string', 'array'] },
    { value: 'not_contains', label: 'Not Contains', dataTypes: ['string', 'array'] },
    { value: 'starts_with', label: 'Starts With', dataTypes: ['string'] },
    { value: 'ends_with', label: 'Ends With', dataTypes: ['string'] },
    { value: 'greater_than', label: 'Greater Than', dataTypes: ['number', 'date'] },
    { value: 'less_than', label: 'Less Than', dataTypes: ['number', 'date'] },
    { value: 'greater_than_or_equal', label: 'Greater Than or Equal', dataTypes: ['number', 'date'] },
    { value: 'less_than_or_equal', label: 'Less Than or Equal', dataTypes: ['number', 'date'] },
    { value: 'exists', label: 'Exists', dataTypes: ['string', 'number', 'boolean', 'array'] },
    { value: 'not_exists', label: 'Not Exists', dataTypes: ['string', 'number', 'boolean', 'array'] },
    { value: 'is_empty', label: 'Is Empty', dataTypes: ['string', 'array'] },
    { value: 'is_not_empty', label: 'Is Not Empty', dataTypes: ['string', 'array'] },
    { value: 'regex_match', label: 'Regex Match', dataTypes: ['string'] },
  ];

  // Available action types
  const actionTypes = [
    { value: 'create_lead', label: 'Create Lead', description: 'Create a new lead with custom field mapping' },
    { value: 'update_lead', label: 'Update Lead', description: 'Update existing leads based on search criteria' },
    { value: 'delete_lead', label: 'Delete Lead', description: 'Delete existing leads based on search criteria' },
    { value: 'send_notification', label: 'Send Notification', description: 'Send email/SMS notifications' },
    { value: 'enroll_journey', label: 'Enroll Journey', description: 'Auto-enroll leads in journeys' },
    { value: 'call_webhook', label: 'Call Webhook', description: 'Call external webhooks' },
    { value: 'set_tags', label: 'Set Tags', description: 'Add/remove tags from leads' },
    { value: 'create_task', label: 'Create Task', description: 'Create tasks and reminders' },
    { value: 'set_dialer_assignment', label: 'Set Dialer Assignment', description: 'Set dialer assignment for leads' },
  ];

  // Add new state for tracking selected displays
  const [selectedDisplayIds, setSelectedDisplayIds] = useState<string[]>([]);
  const [displaysFetched, setDisplaysFetched] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testPayload, setTestPayload] = useState<string>('{\n  "phone": "+1234567890",\n  "name": "John Doe",\n  "email": "john@example.com"\n}');

  // Enhanced fetch functions with better error handling
  const fetchJourneys = async () => {
    setJourneysLoading(true);
    setJourneysError(null);
    try {
      const response = await api.journeys.list();
      console.log('Journeys API response:', response);
      
      const data = response.data || response;
      let journeysList = data.journeys || data || [];
      // Ensure journeysList is an array
      if (!Array.isArray(journeysList)) {
        journeysList = [];
      }
      setAvailableJourneys(journeysList);
    } catch (error) {
      console.error('Error fetching journeys:', error);
      setJourneysError('Failed to load journeys. Please try again.');
      toast.error('Failed to load journeys');
    } finally {
      setJourneysLoading(false);
    }
  };

  // Fetch configuration options based on webhook type
  const fetchConfigOptions = async (webhookType: WebhookType) => {
    try {
      const response = await getWebhookConfigOptions(webhookType);
      console.log('Config options for', webhookType, ':', response);
      
      if (response.fields) {
        setAvailableWebhookFields(response.fields);
      }
    } catch (error) {
      console.error('Error fetching config options:', error);
    }
  };

  // Fetch condition operators for conditional rules
  const fetchConditionOperators = async () => {
    try {
      const response = await getConditionOperators();
      console.log('Available condition operators:', response);
      return response;
    } catch (error) {
      console.error('Error fetching condition operators:', error);
      return [];
    }
  };

  // Fetch action types for conditional rules
  const fetchActionTypes = async (webhookType?: 'go' | 'pause' | 'stop' | 'announcement') => {
    try {
      const response = await getActionTypes(webhookType);
      console.log('Available action types for', webhookType, ':', response);
      return response;
    } catch (error) {
      console.error('Error fetching action types:', error);
      return [];
    }
  };

  // Fetch available announcement templates from backend API
  const fetchAnnouncementTemplates = async () => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      console.log('🔍 Fetching announcement templates from backend API...');
      
      // Use the correct templates endpoint pointing to external backend
      const { token } = useAuthStore.getState();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://34.122.156.88:3001';
      const response = await fetch(`${backendUrl}/api/content/templates?category=&isPublic=true&limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Raw templates response from backend:', data);
      
      // Extract templates from response using the documented structure
      const templates = data?.templates || [];
      console.log('📋 Extracted templates array:', templates);
      console.log('📊 Templates count:', Array.isArray(templates) ? templates.length : 'Not an array');
      
      if (!Array.isArray(templates)) {
        console.error('❌ Templates is not an array:', typeof templates);
        setTemplatesError('Invalid response format from backend API');
        return;
      }
      
      // Transform backend templates to match frontend AnnouncementTemplate interface
      const announcementTemplates = templates.map((template: any) => {
        console.log('🔄 Transforming template:', template);
        return {
          id: template.id,
          name: template.name,
          description: template.description || '',
          category: template.category || 'general',
          variables: template.tags || [],
          thumbnail: template.previewImage,
          isPublic: template.isPublic || false,
          createdAt: template.createdAt || new Date().toISOString(),
          updatedAt: template.updatedAt || new Date().toISOString()
        };
      });
      
      console.log('✅ Transformed announcement templates:', announcementTemplates);
      setAvailableTemplates(announcementTemplates);
      
      if (announcementTemplates.length === 0) {
        console.warn('⚠️ No templates found in backend response');
        setTemplatesError('No announcement templates found. Templates need to be created in the content creator system.');
      } else {
        console.log(`🎉 Successfully loaded ${announcementTemplates.length} templates from backend`);
      }
    } catch (error) {
      console.error('❌ Error fetching announcement templates from backend:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setTemplatesError('Failed to load announcement templates. Please check your connection and try again.');
      toast.error('Failed to load announcement templates');
      setAvailableTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Fetch available displays from backend API
  const fetchAnnouncementDisplays = async () => {
    setDisplaysLoading(true);
    setDisplaysError(null);
    try {
      console.log('🖥️ Fetching displays from backend API...');
      
      // Call the external backend API for displays
      const { token } = useAuthStore.getState();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://34.122.156.88:3001';
      const response = await fetch(`${backendUrl}/api/optisigns/displays?limit=500`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🖥️ Raw displays response from backend:', data);
      
      const displays = data?.displays || data?.data || data || [];
      console.log('🖥️ Extracted displays array:', displays);
      console.log('🖥️ Displays count:', Array.isArray(displays) ? displays.length : 'Not an array');
      
      if (!Array.isArray(displays)) {
        console.error('❌ Displays is not an array:', typeof displays);
        setDisplaysError('Invalid displays response format from backend API');
        return;
      }
      
      // Transform display data to match AnnouncementDisplay interface
      const transformedDisplays = displays.map((display: any) => {
        console.log('🔄 Transforming display:', display);
        const status = display.isOnline || display.online || display.status === 'online' ? 'online' : 'offline';
        return {
          id: display.id || display.deviceId || display.displayId,
          name: display.name || display.deviceName || display.displayName || `Display ${display.id}`,
          location: display.location || display.address || display.site || display.locationName || 'Unknown Location',
          status: status as 'online' | 'offline',
          isOnline: display.isOnline || display.online || false,
          resolution: display.resolution || display.screenResolution || { width: 1920, height: 1080 },
          tags: display.tags || display.deviceTags || [],
          groupIds: display.groupIds || display.groups || [],
          lastSeen: display.lastSeen || display.lastActivity || display.updatedAt || new Date().toISOString()
        };
      });
      
      console.log('✅ Transformed displays:', transformedDisplays);
      setAvailableDisplays(transformedDisplays);
      setDisplaysFetched(true);
      
      if (transformedDisplays.length === 0) {
        console.warn('⚠️ No displays found in backend response');
        setDisplaysError('No displays found. Backend needs to implement OptiSigns integration.');
      } else {
        console.log(`🎉 Successfully loaded ${transformedDisplays.length} displays from backend`);
      }
    } catch (error) {
      console.error('❌ Error fetching displays from backend:', error);
      console.error('❌ Display error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Fallback: Show message that backend needs to implement displays endpoint
      setDisplaysError('Backend API does not have displays endpoint implemented yet. Please ask backend team to implement /api/optisigns/displays endpoint.');
      toast.error('Backend displays API not available');
      setAvailableDisplays([]);
    } finally {
      setDisplaysLoading(false);
    }
  };

  // Enhanced fetch function for webhook events
  const fetchWebhookFields = async () => {
    if (!webhookId) return;
    
    try {
      const response = await api.webhooks.getEvents(webhookId.toString(), {
        page: 1,
        limit: 10, // Get recent events to analyze fields
      });
      
      const data = response.data || response;
      const events = data.data || data || [];
      
      // Extract all unique field names from webhook payloads
      const fieldSet = new Set<string>();
      
      events.forEach((event: any) => {
        if (event.payload && typeof event.payload === 'object') {
          extractFieldNames(event.payload, '', fieldSet);
        }
      });
      
      // Convert to sorted array
      const fields = Array.from(fieldSet).sort();
      console.log('Extracted webhook fields:', fields);
      setAvailableWebhookFields(fields);
    } catch (error) {
      console.error('Error fetching webhook events:', error);
      // Don't show error toast as this is not critical
    }
  };

  // Recursively extract field names from nested objects
  const extractFieldNames = (obj: any, prefix: string, fieldSet: Set<string>) => {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      fieldSet.add(fullKey);
      
      // If the value is an object (but not an array), recurse
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        extractFieldNames(obj[key], fullKey, fieldSet);
      }
    });
  };

  // Fetch webhook details for edit mode
  const fetchWebhook = async () => {
    if (!webhookId) return;
    try {
      setLoading(true);
      const response = await getWebhookDetails(webhookId);
      const webhook = response.data || response;
      console.log('Webhook details:', webhook);
      
      // Update form data with webhook details
      setFormData({
        name: webhook.name || '',
        description: webhook.description || '',
        webhookType: webhook.webhookType || 'go',
        brand: webhook.brand || '',
        source: webhook.source || '',
        fieldMapping: (() => {
          const backendMapping = webhook.fieldMapping || {};
          const convertedMapping: Record<string, string> = {};
          Object.entries(backendMapping).forEach(([key, value]) => {
            convertedMapping[key] = typeof value === 'object' && value !== null && 'sourceField' in value 
              ? (value as { sourceField: string }).sourceField 
              : (value as string);
          });
          return Object.keys(convertedMapping).length > 0 ? convertedMapping : {
            phone: 'phone',
            name: 'full_name',
            email: 'email_address',
          };
        })(),
        validationRules: webhook.validationRules || {
          requirePhone: true,
          requireName: false,
          requireEmail: false,
          allowDuplicatePhone: false,
        },
        autoTagRules: webhook.autoTagRules || [
          {
            field: 'source',
            operator: 'equals',
            value: 'website',
            tag: 'web-lead',
          },
        ],
        pauseResumeConfig: webhook.pauseResumeConfig || {
          enabled: false,
          resumeConditions: {
            timerResume: {
              enabled: false,
              delayMinutes: 0,
              delayHours: 0,
              delayDays: 0
            },
            statusResume: {
              enabled: false,
              targetStatuses: [],
              checkInterval: 30
            },
            tagResume: {
              enabled: false,
              requiredTags: [],
              forbiddenTags: [],
              checkInterval: 30
            },
            externalResume: {
              enabled: false
            }
          },
          pauseActions: {
            pauseJourneys: true,
            addPauseTag: true,
            pauseTagName: 'paused',
            sendNotification: false
          },
          resumeActions: {
            resumeJourneys: true,
            removePauseTag: true,
            addResumeTag: false,
            resumeTagName: 'resumed',
            sendNotification: false
          }
        },
        stopConfig: webhook.stopConfig || {
          enabled: false,
          stopActions: {
            exitJourneys: true,
            addStopTag: true,
            stopTagName: 'stopped',
            markAsDNC: false,
            markAsSold: false,
            preventFutureEnrollment: true
          },
          stopMetadata: {
            trackStopReason: true,
            trackStopSource: true,
            trackStopTimestamp: true
          }
        },
        requiredHeaders: webhook.requiredHeaders || {},
        autoEnrollJourneyId: webhook.autoEnrollJourneyId || undefined,
        announcementConfig: webhook.announcementConfig || {
          enabled: false,
          announcementType: 'template', // Default to template for backward compatibility
          contentCreator: {
            templateId: '',
            variableMapping: {},
            autoGenerate: true,
            templateName: 'Announcement - {{timestamp}}'
          },
          optisigns: {
            displaySelection: {
              mode: 'all'
            },
            takeover: {
              priority: 'MEDIUM',
              duration: 30,
              restoreAfter: true,
              overrideCurrent: false
            },
            scheduling: {
              immediate: true
            }
          }
        },
        callConfig: webhook.callConfig || {
          enabled: false,
          dialerContext: 'BDS_Prime_Dialer',
          transferNumber: '',
          maxAttempts: 3,
          delayBetweenCalls: 300,
          amd: false,
          playPosition: false,
          skipPositionAnnouncement: true,
          ivrFile: '',
          recordingId: undefined
        },
      });
      
      // Update field mappings for display
      // Convert from backend format { sourceField: "value" } to frontend format
      const backendMapping = webhook.fieldMapping || {};
      const mappings = Object.entries(backendMapping).map(([key, value]) => ({
        key,
        value: typeof value === 'object' && value !== null && 'sourceField' in value 
          ? (value as { sourceField: string }).sourceField 
          : (value as string)
      }));
      
      // Split into standard and custom mappings
      const standardKeys = ['phone', 'name', 'email'];
      const standardMappings = mappings.filter(m => standardKeys.includes(m.key));
      const customMappings = mappings.filter(m => !standardKeys.includes(m.key));
      
      setFieldMappings(standardMappings.length > 0 ? standardMappings : [
        { key: 'phone', value: 'phone' },
        { key: 'name', value: 'full_name' },
        { key: 'email', value: 'email_address' },
      ]);
      setCustomFieldMappings(customMappings);
      
      console.log('Standard field mappings:', standardMappings);
      console.log('Custom field mappings:', customMappings);
      
      // Update auto tag rules
      if (webhook.autoTagRules && webhook.autoTagRules.length > 0) {
        setAutoTagRules(webhook.autoTagRules);
      }
      
      // Update required headers
      if (webhook.requiredHeaders) {
        const headers = Object.entries(webhook.requiredHeaders).map(([key, value]) => ({
          key,
          value: value as string
        }));
        setRequiredHeaders(headers);
      }
      
      // Update selected display IDs for announcement webhooks
      if (webhook.announcementConfig?.optisigns?.displaySelection?.displayIds) {
        setSelectedDisplayIds(webhook.announcementConfig.optisigns.displaySelection.displayIds);
      }
      
      // Check for conditional rules or advanced processing rules
      if (webhook.conditionalRules) {
        setConditionalRules({
          enabled: true,
          logicOperator: webhook.conditionalRules.logicOperator || 'AND',
          conditionSets: webhook.conditionalRules.conditionSets || []
        });
      } else if (webhook.rules) {
        // Handle older format if it exists
        setConditionalRules({
          enabled: true,
          logicOperator: 'AND',
          conditionSets: webhook.rules || []
        });
      }
    } catch (error) {
      console.error('Error fetching webhook details:', error);
      toast.error('Failed to load webhook details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch data when component mounts
    fetchJourneys();
            fetchAnnouncementTemplates();
    fetchAnnouncementDisplays();
    
    // Fetch config options for default webhook type
    fetchConfigOptions(formData.webhookType);
    
    if (isEdit && webhookId) {
      fetchWebhook();
      fetchWebhookFields(); // Fetch available fields from webhook events
    } else {
      // If not in edit mode, set loading to false
      setLoading(false);
      
      // Initialize custom field mappings from the default formData
      const standardKeys = ['phone', 'name', 'email'];
      const customMappings = Object.entries(formData.fieldMapping)
        .filter(([key]) => !standardKeys.includes(key))
        .map(([key, value]) => ({ key, value: value as string }));
      
      setCustomFieldMappings(customMappings);
    }
  }, [isEdit, webhookId]);

  // Fetch config options when webhook type changes
  useEffect(() => {
    if (formData.webhookType) {
      fetchConfigOptions(formData.webhookType);
    }
  }, [formData.webhookType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleValidationRuleChange = (name: keyof typeof formData.validationRules, checked: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      validationRules: {
        ...prev.validationRules,
        [name]: typeof checked === 'boolean' ? checked : checked === 'true',
      },
    }));
  };

  const handleFieldMappingChange = (index: number, key: string, value: string) => {
    const newMappings = [...fieldMappings];
    if (key !== '') {
      newMappings[index] = { key, value };
    }
    setFieldMappings(newMappings);
    
    // Update the main form data
    const mappingObject = newMappings.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const customMappingObject = customFieldMappings.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    setFormData(prev => ({
      ...prev,
      fieldMapping: {
        ...mappingObject,
        ...customMappingObject,
      },
    }));
    
    console.log("Updated field mapping:", {
      ...mappingObject,
      ...customMappingObject,
    });
  };

  const handleCustomFieldMappingChange = (index: number, field: 'key' | 'value', value: string) => {
    const newCustomMappings = [...customFieldMappings];
    const oldKey = newCustomMappings[index].key;
    
    if (field === 'key') {
      newCustomMappings[index].key = value;
    } else {
      newCustomMappings[index].value = value;
    }
    
    setCustomFieldMappings(newCustomMappings);
    
    // Update the main form data
    const newFieldMapping = { ...formData.fieldMapping };
    
    if (field === 'key') {
      // Remove old key and add new one with the same value
      const oldValue = newFieldMapping[oldKey];
      delete newFieldMapping[oldKey];
      newFieldMapping[value] = oldValue;
    } else {
      // Just update the value for the existing key
      newFieldMapping[oldKey] = value;
    }
    
    setFormData(prev => ({
      ...prev,
      fieldMapping: newFieldMapping
    }));
    
    console.log("Updated custom field mapping:", field === 'key' ? `${oldKey} -> ${value}` : `${oldKey} = ${value}`);
  };

  const addCustomFieldMapping = () => {
    const newKey = `custom_field_${customFieldMappings.length + 1}`;
    const newMapping = { key: newKey, value: '' };
    setCustomFieldMappings([...customFieldMappings, newMapping]);
    
    // Update the main form data
    setFormData(prev => ({
      ...prev,
      fieldMapping: {
        ...prev.fieldMapping,
        [newKey]: ''
      }
    }));
    
    console.log("Added custom field mapping:", newKey);
  };

  const removeCustomFieldMapping = (index: number) => {
    const keyToRemove = customFieldMappings[index].key;
    const newCustomMappings = customFieldMappings.filter((_, i) => i !== index);
    setCustomFieldMappings(newCustomMappings);
    
    // Update the main form data
    const newFieldMapping = { ...formData.fieldMapping };
    delete newFieldMapping[keyToRemove];
    
    setFormData(prev => ({
      ...prev,
      fieldMapping: newFieldMapping
    }));
    
    console.log("Removed custom field mapping:", keyToRemove);
  };

  const handleAutoTagRuleChange = (index: number, field: string, value: any) => {
    const newRules = [...autoTagRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setAutoTagRules(newRules);
    
    // Update the main form data
    setFormData(prev => ({
      ...prev,
      autoTagRules: newRules,
    }));
  };

  const addAutoTagRule = () => {
    setAutoTagRules([
      ...autoTagRules,
      {
        field: '',
        operator: 'equals',
        value: '',
        tag: '',
      },
    ]);
  };

  const removeAutoTagRule = (index: number) => {
    const newRules = [...autoTagRules];
    newRules.splice(index, 1);
    setAutoTagRules(newRules);
    
    // Update the main form data
    setFormData(prev => ({
      ...prev,
      autoTagRules: newRules,
    }));
  };

  const handleRequiredHeaderChange = (index: number, key: string, value: string) => {
    const newHeaders = [...requiredHeaders];
    newHeaders[index] = { key, value };
    setRequiredHeaders(newHeaders);
    
    // Update the main form data
    const headersObject = newHeaders.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    setFormData(prev => ({
      ...prev,
      requiredHeaders: headersObject,
    }));
    
    console.log("Updated required headers:", headersObject);
  };

  const addRequiredHeader = () => {
    const newHeaders = [...requiredHeaders, { key: '', value: '' }];
    setRequiredHeaders(newHeaders);
    
    // No need to update formData yet since the new header has empty key/value
    console.log("Added new required header");
  };

  const removeRequiredHeader = (index: number) => {
    const headerToRemove = requiredHeaders[index];
    const newHeaders = requiredHeaders.filter((_, i) => i !== index);
    setRequiredHeaders(newHeaders);
    
    // Update the main form data
    const headersObject = newHeaders.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    setFormData(prev => ({
      ...prev,
      requiredHeaders: headersObject,
    }));
    
    console.log("Removed required header:", headerToRemove);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Check if user is authenticated
      const { token, isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated || !token) {
        toast.error('You must be logged in to create webhooks');
        router.push('/login');
        return;
      }
      
      // Ensure all field mappings are included
      const fieldMappingData = buildFieldMapping();
      
      // Convert field mapping to backend expected format
      const backendFieldMapping = convertFieldMappingForBackend(fieldMappingData);
      
      // Ensure headers are included
      const requiredHeadersData = buildRequiredHeaders();

      const payload: any = {
        name: formData.name,
        description: formData.description,
        webhookType: formData.webhookType,
        brand: formData.brand,
        source: formData.source,
        fieldMapping: backendFieldMapping,
        validationRules: formData.validationRules,
        autoTagRules: formData.autoTagRules,
        requiredHeaders: requiredHeadersData,
        autoEnrollJourneyId: formData.autoEnrollJourneyId,
        conditionalRules: conditionalRules.enabled ? conditionalRules as any : undefined,
        pauseResumeConfig: formData.webhookType === 'pause' ? formData.pauseResumeConfig : undefined,
        stopConfig: formData.webhookType === 'stop' ? formData.stopConfig : undefined,
        announcementConfig: formData.webhookType === 'announcement' ? {
          ...formData.announcementConfig!,
          optisigns: {
            ...formData.announcementConfig!.optisigns,
            displaySelection: {
              ...formData.announcementConfig!.optisigns.displaySelection,
              displayIds: formData.announcementConfig!.optisigns.displaySelection.mode === 'specific' 
                ? selectedDisplayIds 
                : undefined
            }
          }
        } : undefined,
        callConfig: formData.webhookType === 'call' ? formData.callConfig : undefined
      };

      console.log('Submitting webhook with payload:', payload);

      if (isEdit && webhookId) {
        await updateWebhook(webhookId, payload);
        toast.success('Webhook updated successfully');
      } else {
        const response = await createWebhook(payload);
        console.log('Webhook created successfully:', response);
        toast.success('Webhook created successfully');
        if (onSuccess) {
          onSuccess(response);
        } else {
        router.push('/webhooks');
      }
      }
    } catch (error: any) {
      console.error('Error saving webhook:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        useAuthStore.getState().logout();
        router.push('/login');
        return;
      }
      
      // Handle validation errors
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || 'Invalid webhook data. Please check your inputs.';
        toast.error(errorMessage);
        return;
      }
      
      // Generic error
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save webhook';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.name) {
      toast.error('Name is required');
      setCurrentStep(1);
      return false;
    }
    
    if (!formData.brand) {
      toast.error('Brand is required');
      setCurrentStep(1);
      return false;
    }
    
    if (!formData.source) {
      toast.error('Source is required');
      setCurrentStep(1);
      return false;
    }
    
    // Validate field mappings
    if (formData.validationRules.requirePhone && !getFieldMappingValue(formData.fieldMapping.phone, '')) {
      toast.error('Phone field mapping is required');
      setCurrentStep(3);
      return false;
    }
    
    if (formData.validationRules.requireName && !getFieldMappingValue(formData.fieldMapping.name, '')) {
      toast.error('Name field mapping is required');
      setCurrentStep(3);
      return false;
    }
    
    if (formData.validationRules.requireEmail && !getFieldMappingValue(formData.fieldMapping.email, '')) {
      toast.error('Email field mapping is required');
      setCurrentStep(3);
      return false;
    }
    
    // Validate announcement configuration
    if (formData.webhookType === 'announcement') {
      if (formData.announcementConfig?.optisigns?.displaySelection?.mode === 'specific') {
        if (!selectedDisplayIds || selectedDisplayIds.length === 0) {
          toast.error('At least one display must be selected for specific display mode');
          setCurrentStep(2); // Assuming step 2 is where announcement config is
          return false;
        }
      }
      
      const announcementType = formData.announcementConfig?.announcementType || 'template';
      
      // Validate based on announcement type
      if (announcementType === 'template') {
        if (!formData.announcementConfig?.contentCreator?.templateId?.trim()) {
          toast.error('Announcement template is required for template-based announcements');
          setCurrentStep(2);
          return false;
        }
      } else if (announcementType === 'video' || announcementType === 'image') {
        // Validate template selection for video/image types
        if (!formData.announcementConfig?.contentCreator?.templateId?.trim()) {
          toast.error(`Content template is required for ${announcementType} announcements`);
          setCurrentStep(2);
          return false;
        }
      }
    }

    // Validate call configuration
    if (formData.webhookType === 'call') {
      if (!formData.callConfig?.dialerContext) {
        toast.error('Dialer context is required');
        setCurrentStep(2);
        return false;
      }

      if (!formData.callConfig?.transferNumber) {
        toast.error('Transfer number is required');
        setCurrentStep(2);
        return false;
      }

      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.callConfig.transferNumber.replace(/\D/g, ''))) {
        toast.error('Invalid transfer number format');
        setCurrentStep(2);
        return false;
      }

      if (formData.callConfig.maxAttempts < 1 || formData.callConfig.maxAttempts > 10) {
        toast.error('Max attempts must be between 1 and 10');
        setCurrentStep(2);
        return false;
      }

      if (formData.callConfig.delayBetweenCalls < 60 || formData.callConfig.delayBetweenCalls > 3600) {
        toast.error('Delay between calls must be between 60 and 3600 seconds');
        setCurrentStep(2);
        return false;
      }
    }
    
    return true;
  };

  // Conditional rules handlers
  const addConditionSet = () => {
    console.log("Adding new condition set");
    
    // Create a new condition set with default values
    const newConditionSet: ConditionSet = {
      name: `Condition Set ${conditionalRules.conditionSets.length + 1}`,
      conditions: [{
        field: '',
        operator: 'equals',
        value: '',
        dataType: 'string'
      }],
      actions: [{
        type: 'create_lead',
        config: {}
      }]
    };
    
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: [
        ...prev.conditionSets,
        newConditionSet
      ]
    }));
  };

  const removeConditionSet = (index: number) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.filter((_, i) => i !== index)
    }));
  };

  const updateConditionSet = (index: number, field: string, value: any) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === index ? { ...set, [field]: value } : set
      )
    }));
  };

  const addCondition = (setIndex: number) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === setIndex 
          ? {
              ...set,
              conditions: [
                ...set.conditions,
                {
                  field: '',
                  operator: 'equals',
                  value: '',
                  dataType: 'string'
                }
              ]
            }
          : set
      )
    }));
  };

  const removeCondition = (setIndex: number, conditionIndex: number) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === setIndex 
          ? {
              ...set,
              conditions: set.conditions.filter((_, ci) => ci !== conditionIndex)
            }
          : set
      )
    }));
  };

  const updateCondition = (setIndex: number, conditionIndex: number, field: string, value: any) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === setIndex 
          ? {
              ...set,
              conditions: set.conditions.map((condition, ci) => 
                ci === conditionIndex ? { ...condition, [field]: value } : condition
              )
            }
          : set
      )
    }));
  };

  const addAction = (setIndex: number) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === setIndex 
          ? {
              ...set,
              actions: [
                ...set.actions,
                {
                  type: 'create_lead',
                  config: {}
                }
              ]
            }
          : set
      )
    }));
  };

  const removeAction = (setIndex: number, actionIndex: number) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === setIndex 
          ? {
              ...set,
              actions: set.actions.filter((_, ai) => ai !== actionIndex)
            }
          : set
      )
    }));
  };

  const updateAction = (setIndex: number, actionIndex: number, field: string, value: any) => {
    setConditionalRules(prev => ({
      ...prev,
      conditionSets: prev.conditionSets.map((set, i) => 
        i === setIndex 
          ? {
              ...set,
              actions: set.actions.map((action, ai) => 
                ai === actionIndex 
                  ? field === 'type' 
                    ? { type: value, config: {} }
                    : { ...action, [field]: value }
                  : action
              )
            }
          : set
      )
    }));
  };

  const getActionConfigFields = (actionType: string, setIndex: number, actionIndex: number) => {
    const action = conditionalRules?.conditionSets[setIndex]?.actions[actionIndex];
    const config = action?.config || {};
    
    const updateActionConfig = (key: string, value: any) => {
      const newConfig = { ...config, [key]: value };
      updateAction(setIndex, actionIndex, 'config', newConfig);
    };
    
    switch (actionType) {
      case 'create_lead':
        return (
          <div className="space-y-2">
            <Label>Lead Data</Label>
            <Textarea
              value={config.leadData || ''}
              onChange={(e) => updateActionConfig('leadData', e.target.value)}
              placeholder="Enter lead data in JSON format"
              className="h-20"
            />
          </div>
        );
      case 'update_lead':
        return (
          <div className="space-y-2">
            <Label>Update Data</Label>
            <Textarea
              value={config.updateData || ''}
              onChange={(e) => updateActionConfig('updateData', e.target.value)}
              placeholder="Enter update data in JSON format"
              className="h-20"
            />
          </div>
        );
      case 'send_notification':
        return (
          <div className="space-y-2">
            <Label>Notification Template</Label>
            <Select
              value={config.template || "email"}
              onValueChange={(value) => updateActionConfig('template', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email Template</SelectItem>
                <SelectItem value="sms">SMS Template</SelectItem>
                <SelectItem value="webhook">Webhook Notification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'enroll_journey':
        return (
          <div className="space-y-2">
            <Label>Journey</Label>
            <Select
              value={config.journeyId?.toString() || "none"}
              onValueChange={(value) => updateActionConfig('journeyId', value === "none" ? null : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select journey" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {availableJourneys.map((journey) => (
                  <SelectItem key={journey.id} value={journey.id.toString()}>
                    {journey.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'call_webhook':
        return (
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input 
              value={config.url || ''}
              onChange={(e) => updateActionConfig('url', e.target.value)}
              placeholder="Enter webhook URL" 
            />
            <Label>Method</Label>
            <Select
              value={config.method || "POST"}
              onValueChange={(value) => updateActionConfig('method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 'set_tags':
        return (
          <div className="space-y-2">
            <Label>Tags</Label>
            <Input 
              value={config.tags || ''}
              onChange={(e) => updateActionConfig('tags', e.target.value)}
              placeholder="Enter tags (comma-separated)" 
            />
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`addTags-${setIndex}-${actionIndex}`}
                checked={config.operation === 'add'}
                onCheckedChange={(checked) => {
                  if (checked) updateActionConfig('operation', 'add');
                }}
              />
              <Label htmlFor={`addTags-${setIndex}-${actionIndex}`}>Add Tags</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`removeTags-${setIndex}-${actionIndex}`}
                checked={config.operation === 'remove'}
                onCheckedChange={(checked) => {
                  if (checked) updateActionConfig('operation', 'remove');
                }}
              />
              <Label htmlFor={`removeTags-${setIndex}-${actionIndex}`}>Remove Tags</Label>
            </div>
          </div>
        );
      case 'create_task':
        return (
          <div className="space-y-2">
            <Label>Task Type</Label>
            <Select
              value={config.taskType || "call"}
              onValueChange={(value) => updateActionConfig('taskType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Label>Priority</Label>
            <Select
              value={config.priority || "medium"}
              onValueChange={(value) => updateActionConfig('priority', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      default:
        return null;
    }
  };

  const buildFieldMapping = () => {
    const mappingObject = fieldMappings.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const customMappingObject = customFieldMappings.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    return {
      ...mappingObject,
      ...customMappingObject,
    };
  };

  // Convert field mapping to backend expected format
  const convertFieldMappingForBackend = (fieldMapping: Record<string, string>) => {
    const backendMapping: Record<string, { sourceField: string }> = {};
    Object.entries(fieldMapping).forEach(([key, value]) => {
      backendMapping[key] = { sourceField: value };
    });
    return backendMapping;
  };

  // Helper function to safely get field mapping value
  const getFieldMappingValue = (field: any, defaultValue: string): string => {
    if (typeof field === 'string') {
      return field;
    }
    if (typeof field === 'object' && field !== null && 'sourceField' in field) {
      return (field as { sourceField: string }).sourceField;
    }
    return defaultValue;
  };

  const buildRequiredHeaders = () => {
    return requiredHeaders.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  };

  const handleWebhookTypeChange = (type: WebhookType) => {
    console.log("Changing webhook type to:", type);
    
    setFormData(prev => ({
      ...prev,
      webhookType: type,
      // Initialize type-specific configs with minimal defaults
      pauseResumeConfig: type === 'pause' ? {
        enabled: true,
        resumeConditions: {
          timerResume: {
            enabled: false,
            delayMinutes: 0,
            delayHours: 0,
            delayDays: 0
          },
          statusResume: {
            enabled: false,
            targetStatuses: [],
            checkInterval: 30
          },
          tagResume: {
            enabled: false,
            requiredTags: [],
            forbiddenTags: [],
            checkInterval: 30
          },
          externalResume: {
            enabled: false
          }
        },
        pauseActions: {
          pauseJourneys: true,
          addPauseTag: true,
          pauseTagName: 'paused',
          sendNotification: false,
          notificationTemplate: undefined
        },
        resumeActions: {
          resumeJourneys: true,
          removePauseTag: true,
          addResumeTag: false,
          resumeTagName: 'resumed',
          sendNotification: false,
          notificationTemplate: undefined
        }
      } : prev.pauseResumeConfig,
      stopConfig: type === 'stop' ? {
        enabled: true,
        stopActions: {
          exitJourneys: true,
          addStopTag: true,
          stopTagName: 'stopped',
          markAsDNC: false,
          dncReason: '',
          markAsSold: false,
          soldReason: '',
          preventFutureEnrollment: true
        },
        stopMetadata: {
          trackStopReason: true,
          trackStopSource: true,
          trackStopTimestamp: true
        }
      } : prev.stopConfig,
      announcementConfig: type === 'announcement' ? {
        enabled: true,
        announcementType: 'template', // Default to template
        contentCreator: {
          templateId: '',
          variableMapping: {},
          autoGenerate: true,
          templateName: 'Announcement - {{timestamp}}'
        },
        optisigns: {
          displaySelection: {
            mode: 'all'
          },
          takeover: {
            priority: 'MEDIUM',
            duration: 30,
            restoreAfter: true,
            overrideCurrent: false
          },
          scheduling: {
            immediate: true
          }
        }
      } : prev.announcementConfig,
      callConfig: type === 'call' ? {
        enabled: true,
        dialerContext: 'BDS_Prime_Dialer',
        transferNumber: '',
        maxAttempts: 3,
        delayBetweenCalls: 300,
        amd: false,
        playPosition: false,
        skipPositionAnnouncement: true,
        ivrFile: '',
        recordingId: undefined
      } : prev.callConfig
    }));
  };

  const handlePauseResumeConfigChange = (field: string, value: any) => {
    console.log("Updating pauseResumeConfig:", field, value);
    
    // Handle nested fields using a recursive function
    const updateNestedField = (obj: any, path: string[], value: any): any => {
      const [current, ...rest] = path;
      if (rest.length === 0) {
        return { ...obj, [current]: value };
      }
      return {
        ...obj,
        [current]: updateNestedField(obj[current] || {}, rest, value)
      };
    };
    
    const fieldPath = field.split('.');
    
    setFormData(prev => ({
      ...prev,
      pauseResumeConfig: updateNestedField(prev.pauseResumeConfig || {}, fieldPath, value)
    }));
  };

  const handleStopConfigChange = (field: string, value: any) => {
    console.log("Updating stopConfig:", field, value);
    
    // Handle nested fields using a recursive function
    const updateNestedField = (obj: any, path: string[], value: any): any => {
      const [current, ...rest] = path;
      if (rest.length === 0) {
        return { ...obj, [current]: value };
      }
      return {
        ...obj,
        [current]: updateNestedField(obj[current] || {}, rest, value)
      };
    };
    
    const fieldPath = field.split('.');
    
    setFormData(prev => ({
      ...prev,
      stopConfig: updateNestedField(prev.stopConfig || {}, fieldPath, value)
    }));
  };

  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Configure the basic details of your webhook',
      icon: 'settings'
    },
    {
      id: 2,
      title: 'Webhook Type',
      description: 'Choose the type of webhook and its behavior',
      icon: 'type'
    },
    {
      id: 3,
      title: 'Field Mapping',
      description: 'Map incoming webhook fields to your system',
      icon: 'fields'
    },
    {
      id: 4,
      title: 'Validation Rules',
      description: 'Set up validation rules for incoming data',
      icon: 'validation'
    },
    {
      id: 5,
      title: 'Auto-Tagging',
      description: 'Configure automatic tagging rules',
      icon: 'tags'
    },
    {
      id: 6,
      title: 'Advanced Settings',
      description: 'Configure additional webhook settings',
      icon: 'advanced'
    }
  ];

  const renderStepIndicator = () => {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-medium transition-all ${
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground scale-110'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.id}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 transition-all ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`text-sm text-center w-32 transition-colors ${
                currentStep === step.id
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBasicInfoStep = () => (
    <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the basic details for your webhook endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="CRM Integration"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Receives leads from our CRM system"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="Tax Relief"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source">Source *</Label>
                <Input
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  placeholder="CRM"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  );

  const renderWebhookTypeStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Type</CardTitle>
        <CardDescription>
          Choose the type of webhook you want to create.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              formData.webhookType === 'go'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleWebhookTypeChange('go')}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Play className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Go</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Create new leads and process them through journeys
            </p>
          </div>

          <div
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              formData.webhookType === 'pause'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleWebhookTypeChange('pause')}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Pause className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Pause</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Pause existing leads and their journeys
            </p>
          </div>

          <div
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              formData.webhookType === 'stop'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleWebhookTypeChange('stop')}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Square className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Stop</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Stop leads and exit them from all journeys
            </p>
          </div>

          <div
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              formData.webhookType === 'announcement'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleWebhookTypeChange('announcement')}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Announcement</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate content and trigger screen takeovers
            </p>
          </div>

          <div
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              formData.webhookType === 'call'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleWebhookTypeChange('call')}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Phone className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Call</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Initiate outbound calls to leads
            </p>
          </div>
        </div>

        {formData.webhookType === 'pause' && (
          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Resume Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timer Resume</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={formData.pauseResumeConfig?.resumeConditions?.timerResume?.delayMinutes || 0}
                      onChange={(e) =>
                        handlePauseResumeConfigChange('resumeConditions.timerResume.delayMinutes', parseInt(e.target.value))
                      }
                      placeholder="Minutes"
                      className="w-24"
                    />
                    <Input
                      type="number"
                      value={formData.pauseResumeConfig?.resumeConditions?.timerResume?.delayHours || 0}
                      onChange={(e) =>
                        handlePauseResumeConfigChange('resumeConditions.timerResume.delayHours', parseInt(e.target.value))
                      }
                      placeholder="Hours"
                      className="w-24"
                    />
                    <Input
                      type="number"
                      value={formData.pauseResumeConfig?.resumeConditions?.timerResume?.delayDays || 0}
                      onChange={(e) =>
                        handlePauseResumeConfigChange('resumeConditions.timerResume.delayDays', parseInt(e.target.value))
                      }
                      placeholder="Days"
                      className="w-24"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status Resume</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="statusResumeEnabled"
                        checked={formData.pauseResumeConfig?.resumeConditions?.statusResume?.enabled || false}
                        onCheckedChange={(checked) =>
                          handlePauseResumeConfigChange('resumeConditions.statusResume.enabled', checked)
                        }
                      />
                      <Label htmlFor="statusResumeEnabled">Enable Status-based Resume</Label>
                    </div>
                    {formData.pauseResumeConfig?.resumeConditions?.statusResume?.enabled && (
                      <>
                        <Input
                          value={formData.pauseResumeConfig?.resumeConditions?.statusResume?.targetStatuses?.join(', ') || ''}
                          onChange={(e) =>
                            handlePauseResumeConfigChange('resumeConditions.statusResume.targetStatuses', e.target.value.split(',').map(s => s.trim()))
                          }
                          placeholder="Comma-separated statuses"
                        />
                        <Input
                          type="number"
                          value={formData.pauseResumeConfig?.resumeConditions?.statusResume?.checkInterval || 30}
                          onChange={(e) =>
                            handlePauseResumeConfigChange('resumeConditions.statusResume.checkInterval', parseInt(e.target.value))
                          }
                          placeholder="Check interval (minutes)"
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tag Resume</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tagResumeEnabled"
                        checked={formData.pauseResumeConfig?.resumeConditions?.tagResume?.enabled || false}
                        onCheckedChange={(checked) =>
                          handlePauseResumeConfigChange('resumeConditions.tagResume.enabled', checked)
                        }
                      />
                      <Label htmlFor="tagResumeEnabled">Enable Tag-based Resume</Label>
                    </div>
                    {formData.pauseResumeConfig?.resumeConditions?.tagResume?.enabled && (
                      <>
                        <Input
                          value={formData.pauseResumeConfig?.resumeConditions?.tagResume?.requiredTags?.join(', ') || ''}
                          onChange={(e) =>
                            handlePauseResumeConfigChange('resumeConditions.tagResume.requiredTags', e.target.value.split(',').map(s => s.trim()))
                          }
                          placeholder="Required tags (comma-separated)"
                        />
                        <Input
                          value={formData.pauseResumeConfig?.resumeConditions?.tagResume?.forbiddenTags?.join(', ') || ''}
                          onChange={(e) =>
                            handlePauseResumeConfigChange('resumeConditions.tagResume.forbiddenTags', e.target.value.split(',').map(s => s.trim()))
                          }
                          placeholder="Forbidden tags (comma-separated)"
                        />
                        <Input
                          type="number"
                          value={formData.pauseResumeConfig?.resumeConditions?.tagResume?.checkInterval || 30}
                          onChange={(e) =>
                            handlePauseResumeConfigChange('resumeConditions.tagResume.checkInterval', parseInt(e.target.value))
                          }
                          placeholder="Check interval (minutes)"
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>External Resume</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="externalResumeEnabled"
                      checked={formData.pauseResumeConfig?.resumeConditions?.externalResume?.enabled || false}
                      onCheckedChange={(checked) =>
                        handlePauseResumeConfigChange('resumeConditions.externalResume.enabled', checked)
                      }
                    />
                    <Label htmlFor="externalResumeEnabled">Enable Manual Resume</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Pause Actions</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pauseJourneys"
                    checked={formData.pauseResumeConfig?.pauseActions?.pauseJourneys || false}
                    onCheckedChange={(checked) =>
                      handlePauseResumeConfigChange('pauseActions.pauseJourneys', checked)
                    }
                  />
                  <Label htmlFor="pauseJourneys">Pause Journeys</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addPauseTag"
                    checked={formData.pauseResumeConfig?.pauseActions?.addPauseTag || false}
                    onCheckedChange={(checked) =>
                      handlePauseResumeConfigChange('pauseActions.addPauseTag', checked)
                    }
                  />
                  <Label htmlFor="addPauseTag">Add Pause Tag</Label>
                </div>
                {formData.pauseResumeConfig?.pauseActions?.addPauseTag && (
                  <Input
                    value={formData.pauseResumeConfig?.pauseActions?.pauseTagName || ''}
                    onChange={(e) =>
                      handlePauseResumeConfigChange('pauseActions.pauseTagName', e.target.value)
                    }
                    placeholder="Pause tag name"
                  />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendPauseNotification"
                    checked={formData.pauseResumeConfig?.pauseActions?.sendNotification || false}
                    onCheckedChange={(checked) =>
                      handlePauseResumeConfigChange('pauseActions.sendNotification', checked)
                    }
                  />
                  <Label htmlFor="sendPauseNotification">Send Notification</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Resume Actions</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="resumeJourneys"
                    checked={formData.pauseResumeConfig?.resumeActions?.resumeJourneys || false}
                    onCheckedChange={(checked) =>
                      handlePauseResumeConfigChange('resumeActions.resumeJourneys', checked)
                    }
                  />
                  <Label htmlFor="resumeJourneys">Resume Journeys</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="removePauseTag"
                    checked={formData.pauseResumeConfig?.resumeActions?.removePauseTag || false}
                    onCheckedChange={(checked) =>
                      handlePauseResumeConfigChange('resumeActions.removePauseTag', checked)
                    }
                  />
                  <Label htmlFor="removePauseTag">Remove Pause Tag</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addResumeTag"
                    checked={formData.pauseResumeConfig?.resumeActions?.addResumeTag || false}
                    onCheckedChange={(checked) =>
                      handlePauseResumeConfigChange('resumeActions.addResumeTag', checked)
                    }
                  />
                  <Label htmlFor="addResumeTag">Add Resume Tag</Label>
                </div>
                {formData.pauseResumeConfig?.resumeActions?.addResumeTag && (
                  <Input
                    value={formData.pauseResumeConfig?.resumeActions?.resumeTagName || ''}
                    onChange={(e) =>
                      handlePauseResumeConfigChange('resumeActions.resumeTagName', e.target.value)
                    }
                    placeholder="Resume tag name"
                  />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendResumeNotification"
                    checked={formData.pauseResumeConfig?.resumeActions?.sendNotification || false}
                    onCheckedChange={(checked) =>
                      handlePauseResumeConfigChange('resumeActions.sendNotification', checked)
                    }
                  />
                  <Label htmlFor="sendResumeNotification">Send Notification</Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.webhookType === 'stop' && (
          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Stop Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DNC Option Card */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="markAsDNC"
                      checked={formData.stopConfig?.stopActions?.markAsDNC || false}
                      onCheckedChange={(checked) =>
                        handleStopConfigChange('stopActions.markAsDNC', checked)
                      }
                    />
                    <Label htmlFor="markAsDNC" className="font-medium">Mark as DNC (Do Not Contact)</Label>
                  </div>
                  
                  {formData.stopConfig?.stopActions?.markAsDNC && (
                    <div className="space-y-3 pl-6">
                      <div className="space-y-2">
                        <Label>DNC Reason</Label>
                        <Select
                          value={formData.stopConfig?.stopActions?.dncReason || "not_interested"}
                          onValueChange={(value) =>
                            handleStopConfigChange('stopActions.dncReason', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_interested">Not Interested</SelectItem>
                            <SelectItem value="wrong_number">Wrong Number</SelectItem>
                            <SelectItem value="requested_removal">Requested Removal</SelectItem>
                            <SelectItem value="complaint">Complaint</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="trackStopReason"
                          checked={formData.stopConfig?.stopMetadata?.trackStopReason || false}
                          onCheckedChange={(checked) =>
                            handleStopConfigChange('stopMetadata.trackStopReason', checked)
                          }
                        />
                        <Label htmlFor="trackStopReason">Track Stop Reason</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sold Option Card */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="markAsSold"
                      checked={formData.stopConfig?.stopActions?.markAsSold || false}
                      onCheckedChange={(checked) =>
                        handleStopConfigChange('stopActions.markAsSold', checked)
                      }
                    />
                    <Label htmlFor="markAsSold" className="font-medium">Mark as Sold</Label>
                  </div>
                  
                  {formData.stopConfig?.stopActions?.markAsSold && (
                    <div className="space-y-3 pl-6">
                      <div className="space-y-2">
                        <Label>Sale Type</Label>
                        <Select
                          value={formData.stopConfig?.stopActions?.soldReason || "completed_sale"}
                          onValueChange={(value) =>
                            handleStopConfigChange('stopActions.soldReason', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select sale type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed_sale">Completed Sale</SelectItem>
                            <SelectItem value="partial_sale">Partial Sale</SelectItem>
                            <SelectItem value="upsell">Upsell</SelectItem>
                            <SelectItem value="renewal">Renewal</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="addStopTag"
                          checked={formData.stopConfig?.stopActions?.addStopTag || false}
                          onCheckedChange={(checked) =>
                            handleStopConfigChange('stopActions.addStopTag', checked)
                          }
                        />
                        <Label htmlFor="addStopTag">Add Sale Tag</Label>
                      </div>
                      
                      {formData.stopConfig?.stopActions?.addStopTag && (
                        <div className="space-y-2">
                          <Input
                            value={formData.stopConfig?.stopActions?.stopTagName || ''}
                            onChange={(e) =>
                              handleStopConfigChange('stopActions.stopTagName', e.target.value)
                            }
                            placeholder="Sale tag name (e.g. sold)"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 space-y-3">
                <h4 className="font-medium">Additional Options</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="exitJourneys"
                      checked={formData.stopConfig?.stopActions?.exitJourneys || false}
                      onCheckedChange={(checked) =>
                        handleStopConfigChange('stopActions.exitJourneys', checked)
                      }
                    />
                    <Label htmlFor="exitJourneys">Exit from All Journeys</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="preventFutureEnrollment"
                      checked={formData.stopConfig?.stopActions?.preventFutureEnrollment || false}
                      onCheckedChange={(checked) =>
                        handleStopConfigChange('stopActions.preventFutureEnrollment', checked)
                      }
                    />
                    <Label htmlFor="preventFutureEnrollment">Prevent Future Enrollment</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.webhookType === 'announcement' && (
          <div className="mt-6 space-y-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-lg">Announcement Type</h3>
                <Badge variant="secondary" className="text-xs">Choose Method</Badge>
              </div>
              
              {/* Announcement Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.announcementConfig?.announcementType === 'template'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      announcementConfig: {
                        ...prev.announcementConfig!,
                        announcementType: 'template'
                      }
                    }))
                  }
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Custom Template</h4>
                  </div>
                                     <p className="text-sm text-muted-foreground">
                     Use content creator projects with full customization
                   </p>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.announcementConfig?.announcementType === 'video'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      announcementConfig: {
                        ...prev.announcementConfig!,
                        announcementType: 'video'
                      }
                    }))
                  }
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Play className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Sales Rep Video</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate video with sales rep photo and deal details
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.announcementConfig?.announcementType === 'image'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      announcementConfig: {
                        ...prev.announcementConfig!,
                        announcementType: 'image'
                      }
                    }))
                  }
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Square className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Sales Rep Image</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Show sales rep photo as image announcement
                  </p>
                </div>
              </div>

              {/* Template Configuration - Only show for template type */}
              {(!formData.announcementConfig?.announcementType || formData.announcementConfig?.announcementType === 'template') && (
                                 <div className="space-y-4">
                                       <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-lg">Template Configuration</h3>
                      <Badge variant="secondary" className="text-xs">Announcement Templates</Badge>
                    </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                    <Label>Announcement Template</Label>
                    <Select
                      value={formData.announcementConfig?.contentCreator?.templateId || ""}
                      onValueChange={(value) =>
                        setFormData(prev => ({
                          ...prev,
                          announcementConfig: {
                            ...prev.announcementConfig!,
                            contentCreator: {
                              ...prev.announcementConfig!.contentCreator,
                              templateId: value
                            }
                          }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select announcement template" />
                      </SelectTrigger>
                    <SelectContent className="max-h-60">
                                              {availableTemplates.length === 0 ? (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            No announcement templates available.
                          </div>
                      ) : (
                        availableTemplates
                          .filter(template => template.id && template.id.trim() !== '')
                          .map((template) => (
                          <SelectItem key={template.id} value={template.id} className="p-3">
                            <div className="flex flex-col space-y-1 w-full">
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium text-sm">{template.name}</span>
                                {template.status && (
                                  <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                                    {template.status}
                                  </Badge>
                                )}
                              </div>
                              {template.description && (
                                <span className="text-xs text-muted-foreground max-w-full overflow-hidden text-ellipsis line-clamp-2">
                                  {template.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Show selected template details */}
                  {formData.announcementConfig?.contentCreator?.templateId && (() => {
                    const selectedTemplate = availableTemplates.find(
                      t => t.id === formData.announcementConfig?.contentCreator?.templateId
                    );
                    return selectedTemplate ? (
                      <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{selectedTemplate.name}</p>
                            {selectedTemplate.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {selectedTemplate.description}
                              </p>
                            )}
                          </div>
                          {selectedTemplate.status && (
                            <Badge variant="outline" className="text-xs ml-2 shrink-0">
                              {selectedTemplate.status}
                            </Badge>
                          )}
                        </div>
                        {selectedTemplate.variables && Object.keys(selectedTemplate.variables).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-muted">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Available Variables:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(selectedTemplate.variables).map((variable, index) => (
                                <code key={index} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                  {`{{${variable}}}`}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="space-y-2">
                  <Label>Generated Template Name</Label>
                  <Input
                    value={formData.announcementConfig?.contentCreator?.templateName || ''}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        announcementConfig: {
                          ...prev.announcementConfig!,
                          contentCreator: {
                            ...prev.announcementConfig!.contentCreator,
                            templateName: e.target.value
                          }
                        }
                      }))
                    }
                    placeholder="Announcement - {{rep_name}}"
                  />
                  <p className="text-xs text-muted-foreground">
                    Name for the generated template. Use variables like {'{{rep_name}}'}, {'{{timestamp}}'}, etc.
                  </p>
                </div>
              </div>
                              {availableTemplates.length === 0 && (
                  <div className="col-span-2 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-amber-800">No Templates Available</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          No announcement templates found. Templates need to be created in the content creator system.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoGenerate"
                  checked={formData.announcementConfig?.contentCreator?.autoGenerate || false}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      announcementConfig: {
                        ...prev.announcementConfig!,
                        contentCreator: {
                          ...prev.announcementConfig!.contentCreator,
                          autoGenerate: !!checked
                        }
                      }
                    }))
                  }
                />
                <Label htmlFor="autoGenerate">Auto-generate content from project</Label>
              </div>
                </div>
              )}

              {/* Sales Rep & Deal Information Configuration - Show for all announcement types */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-lg">Sales Rep & Deal Information</h3>
                  <Badge variant="outline" className="text-xs">All Announcement Types</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Sales Rep Email Field</Label>
                    <Input
                      value={getFieldMappingValue(formData.fieldMapping?.repEmail, 'repEmail')}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          fieldMapping: {
                            ...prev.fieldMapping,
                            repEmail: e.target.value
                          }
                        }))
                      }
                      placeholder="repEmail"
                    />
                    <p className="text-xs text-muted-foreground">
                      Webhook field containing the sales rep email (used to find their photo)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Sales Rep Name Field</Label>
                    <Input
                      value={getFieldMappingValue(formData.fieldMapping?.repName, 'repName')}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          fieldMapping: {
                            ...prev.fieldMapping,
                            repName: e.target.value
                          }
                        }))
                      }
                      placeholder="repName"
                    />
                    <p className="text-xs text-muted-foreground">
                      Webhook field containing the sales rep name (optional)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Deal Amount Field</Label>
                    <Input
                      value={getFieldMappingValue(formData.fieldMapping?.dealAmount, 'dealAmount')}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          fieldMapping: {
                            ...prev.fieldMapping,
                            dealAmount: e.target.value
                          }
                        }))
                      }
                      placeholder="dealAmount"
                    />
                    <p className="text-xs text-muted-foreground">
                      Webhook field containing the deal amount (for celebrations and announcements)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Company Name Field</Label>
                    <Input
                      value={getFieldMappingValue(formData.fieldMapping?.companyName, 'companyName')}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          fieldMapping: {
                            ...prev.fieldMapping,
                            companyName: e.target.value
                          }
                        }))
                      }
                      placeholder="companyName"
                    />
                    <p className="text-xs text-muted-foreground">
                      Webhook field containing the company/client name (for announcements)
                    </p>
                  </div>
                </div>
              </div>

              {/* Project/Template Selection for Video/Image */}
              {(formData.announcementConfig?.announcementType === 'video' || formData.announcementConfig?.announcementType === 'image') && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">Content Project</h4>
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Select Project for {formData.announcementConfig?.announcementType === 'video' ? 'Video' : 'Image'} Generation</Label>
                    <Select
                      value={formData.announcementConfig?.contentCreator?.templateId || ""}
                      onValueChange={(value) =>
                        setFormData(prev => ({
                          ...prev,
                          announcementConfig: {
                            ...prev.announcementConfig!,
                            contentCreator: {
                              ...prev.announcementConfig!.contentCreator,
                              templateId: value
                            }
                          }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${formData.announcementConfig?.announcementType} project`} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {availableTemplates.length === 0 ? (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            No templates available.
                          </div>
                        ) : (
                          availableTemplates
                            .filter(template => template.id && template.id.trim() !== '')
                            .map((template) => (
                              <SelectItem key={template.id} value={template.id} className="p-3">
                                <div className="flex flex-col space-y-1 w-full">
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-medium text-sm">{template.name}</span>
                                    {template.status && (
                                      <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                                        {template.status}
                                      </Badge>
                                    )}
                                  </div>
                                  {template.description && (
                                    <span className="text-xs text-muted-foreground max-w-full overflow-hidden text-ellipsis line-clamp-2">
                                      {template.description}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    
                    {/* Show selected template details */}
                    {formData.announcementConfig?.contentCreator?.templateId && (() => {
                      const selectedTemplate = availableTemplates.find(
                        t => t.id === formData.announcementConfig?.contentCreator?.templateId
                      );
                      return selectedTemplate ? (
                        <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{selectedTemplate.name}</p>
                              {selectedTemplate.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {selectedTemplate.description}
                                </p>
                              )}
                            </div>
                            {selectedTemplate.status && (
                              <Badge variant="outline" className="text-xs ml-2 shrink-0">
                                {selectedTemplate.status}
                              </Badge>
                            )}
                          </div>
                          {selectedTemplate.variables && Object.keys(selectedTemplate.variables).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-muted">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Available Variables:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {Object.keys(selectedTemplate.variables).map((variable, index) => (
                                  <code key={index} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                    {`{{${variable}}}`}
                                  </code>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-800">Simple API Integration</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {formData.announcementConfig?.announcementType === 'video' 
                            ? 'This will use the /announcement/video endpoint to generate a video based on the selected project with the sales rep photo and deal details.'
                            : 'This will use the /announcement/image endpoint to generate an image based on the selected project with the sales rep photo.'
                          }
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          Required: repEmail, displayIds, project | Optional: repName{formData.announcementConfig?.announcementType === 'video' ? ', dealAmount, companyName' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-lg">Display Configuration</h3>
                <Badge variant="outline" className="text-xs">OptiSigns</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Display Selection Mode</Label>
                  <Select
                    value={formData.announcementConfig?.optisigns?.displaySelection?.mode || "all"}
                    onValueChange={(value) => handleDisplayModeChange(value as 'all' | 'specific' | 'group')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Displays</SelectItem>
                      <SelectItem value="specific">Specific Displays</SelectItem>
                      <SelectItem value="group">Display Groups</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Specific Display Selection UI */}
                {formData.announcementConfig?.optisigns?.displaySelection?.mode === 'specific' && (
                  <div className="space-y-2 col-span-2">
                    <Label>Select Displays</Label>
                    {displaysFetched ? (
                      <div className="max-h-64 overflow-y-auto border rounded-md p-3 space-y-2">
                        {availableDisplays.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No displays available</p>
                        ) : (
                          availableDisplays.map((display) => (
                            <div key={display.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`display-${display.id}`}
                                checked={selectedDisplayIds.includes(display.id)}
                                onCheckedChange={(checked) => 
                                  handleDisplaySelection(display.id, !!checked)
                                }
                              />
                              <Label 
                                htmlFor={`display-${display.id}`} 
                                className="flex-1 text-sm cursor-pointer"
                              >
                                <div className="flex items-center justify-between">
                                  <span>{display.name}</span>
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <span>{display.location}</span>
                                    <Badge 
                                      variant={display.status === 'online' ? 'success' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {display.status}
                                    </Badge>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        Loading displays...
                      </div>
                    )}
                    {selectedDisplayIds.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedDisplayIds.length} display{selectedDisplayIds.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Takeover Priority</Label>
                  <Select
                    value={formData.announcementConfig?.optisigns?.takeover?.priority || "MEDIUM"}
                    onValueChange={(value) =>
                      setFormData(prev => ({
                        ...prev,
                        announcementConfig: {
                          ...prev.announcementConfig!,
                          optisigns: {
                            ...prev.announcementConfig!.optisigns,
                            takeover: {
                              ...prev.announcementConfig!.optisigns.takeover,
                              priority: value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
                            }
                          }
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={formData.announcementConfig?.optisigns?.takeover?.duration || 30}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        announcementConfig: {
                          ...prev.announcementConfig!,
                          optisigns: {
                            ...prev.announcementConfig!.optisigns,
                            takeover: {
                              ...prev.announcementConfig!.optisigns.takeover,
                              duration: parseInt(e.target.value)
                            }
                          }
                        }
                      }))
                    }
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Takeover Options</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="restoreAfter"
                        checked={formData.announcementConfig?.optisigns?.takeover?.restoreAfter || false}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({
                            ...prev,
                            announcementConfig: {
                              ...prev.announcementConfig!,
                              optisigns: {
                                ...prev.announcementConfig!.optisigns,
                                takeover: {
                                  ...prev.announcementConfig!.optisigns.takeover,
                                  restoreAfter: !!checked
                                }
                              }
                            }
                          }))
                        }
                      />
                      <Label htmlFor="restoreAfter" className="text-sm">Restore previous content after announcement</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="overrideCurrent"
                        checked={formData.announcementConfig?.optisigns?.takeover?.overrideCurrent || false}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({
                            ...prev,
                            announcementConfig: {
                              ...prev.announcementConfig!,
                              optisigns: {
                                ...prev.announcementConfig!.optisigns,
                                takeover: {
                                  ...prev.announcementConfig!.optisigns.takeover,
                                  overrideCurrent: !!checked
                                }
                              }
                            }
                          }))
                        }
                      />
                      <Label htmlFor="overrideCurrent" className="text-sm">Override current content</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="immediate"
                        checked={formData.announcementConfig?.optisigns?.scheduling?.immediate !== false}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({
                            ...prev,
                            announcementConfig: {
                              ...prev.announcementConfig!,
                              optisigns: {
                                ...prev.announcementConfig!.optisigns,
                                scheduling: {
                                  ...prev.announcementConfig!.optisigns.scheduling,
                                  immediate: !!checked
                                }
                              }
                            }
                          }))
                        }
                      />
                      <Label htmlFor="immediate" className="text-sm">Trigger immediately</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.webhookType === 'call' && (
          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Call Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Dialer Context</Label>
                  <Input
                    value={formData.callConfig?.dialerContext || ''}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        callConfig: {
                          ...prev.callConfig!,
                          dialerContext: e.target.value
                        }
                      }))
                    }
                    placeholder="BDS_Prime_Dialer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Asterisk context for call routing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Transfer Number</Label>
                  <Input
                    value={formData.callConfig?.transferNumber || ''}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        callConfig: {
                          ...prev.callConfig!,
                          transferNumber: e.target.value
                        }
                      }))
                    }
                    placeholder="18005551234"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number to transfer calls to
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Max Call Attempts</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.callConfig?.maxAttempts || 3}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        callConfig: {
                          ...prev.callConfig!,
                          maxAttempts: parseInt(e.target.value)
                        }
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of call attempts (1-10)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Delay Between Calls (seconds)</Label>
                  <Input
                    type="number"
                    min={60}
                    max={3600}
                    value={formData.callConfig?.delayBetweenCalls || 300}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        callConfig: {
                          ...prev.callConfig!,
                          delayBetweenCalls: parseInt(e.target.value)
                        }
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Time to wait between attempts (1-60 minutes)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Advanced Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="amd"
                      checked={formData.callConfig?.amd || false}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({
                          ...prev,
                          callConfig: {
                            ...prev.callConfig!,
                            amd: !!checked
                          }
                        }))
                      }
                    />
                    <Label htmlFor="amd">Enable Answering Machine Detection</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="playPosition"
                      checked={formData.callConfig?.playPosition || false}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({
                          ...prev,
                          callConfig: {
                            ...prev.callConfig!,
                            playPosition: !!checked
                          }
                        }))
                      }
                    />
                    <Label htmlFor="playPosition">Play Position in Queue</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipPositionAnnouncement"
                      checked={formData.callConfig?.skipPositionAnnouncement || false}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({
                          ...prev,
                          callConfig: {
                            ...prev.callConfig!,
                            skipPositionAnnouncement: !!checked
                          }
                        }))
                      }
                    />
                    <Label htmlFor="skipPositionAnnouncement">Skip Position Announcement</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>IVR File (Optional)</Label>
                    <Input
                      value={formData.callConfig?.ivrFile || ''}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          callConfig: {
                            ...prev.callConfig!,
                            ivrFile: e.target.value
                          }
                        }))
                      }
                      placeholder="custom-ivr.wav"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Recording ID (Optional)</Label>
                    <Input
                      type="number"
                      value={formData.callConfig?.recordingId || ''}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          callConfig: {
                            ...prev.callConfig!,
                            recordingId: e.target.value ? parseInt(e.target.value) : undefined
                          }
                        }))
                      }
                      placeholder="12345"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderFieldMappingStep = () => (
      <Card>
        <CardHeader>
          <CardTitle>Field Mapping</CardTitle>
          <CardDescription>
          Map incoming webhook fields to your system fields.
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-6">
          <div className="space-y-4">
          <h3 className="font-medium">Standard Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="space-y-1">
                <Input
                  value={getFieldMappingValue(formData.fieldMapping.phone, '')}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      fieldMapping: {
                        ...prev.fieldMapping,
                        phone: e.target.value
                      }
                    }));
                  }}
                  placeholder="phone"
                />
                <p className="text-xs text-muted-foreground">
                  Will listen for: phone, phone_number, mobile, cell, contact_number
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="space-y-1">
                <Input
                  value={getFieldMappingValue(formData.fieldMapping.name, '')}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      fieldMapping: {
                        ...prev.fieldMapping,
                        name: e.target.value
                      }
                    }));
                  }}
                  placeholder="full_name"
                />
                <p className="text-xs text-muted-foreground">
                  Will listen for: name, full_name, customer_name, contact_name
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="space-y-1">
                <Input
                  value={getFieldMappingValue(formData.fieldMapping.email, '')}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      fieldMapping: {
                        ...prev.fieldMapping,
                        email: e.target.value
                      }
                    }));
                  }}
                  placeholder="email_address"
                />
                <p className="text-xs text-muted-foreground">
                  Will listen for: email, email_address, contact_email, customer_email
                </p>
              </div>
            </div>
          </div>
        </div>

        {formData.webhookType === 'pause' && (
          <div className="space-y-4">
            <h3 className="font-medium">Pause/Resume Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lead Identifier Field</Label>
                <div className="space-y-1">
                  <Input
                    value={getFieldMappingValue(formData.fieldMapping.pauseLeadId, '')}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        fieldMapping: {
                          ...prev.fieldMapping,
                          pauseLeadId: e.target.value
                        }
                      }))
                    }
                    placeholder="lead_id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Field that identifies which lead to pause (e.g., lead_id, phone, email)
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pause Duration Field</Label>
                <div className="space-y-1">
                  <Input
                    value={getFieldMappingValue(formData.fieldMapping.pauseDuration, '')}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        fieldMapping: {
                          ...prev.fieldMapping,
                          pauseDuration: e.target.value
                        }
                      }))
                    }
                    placeholder="pause_duration"
                  />
                  <p className="text-xs text-muted-foreground">
                    Field that specifies pause duration in minutes/hours/days
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pause Reason Field</Label>
                <div className="space-y-1">
                  <Input
                    value={getFieldMappingValue(formData.fieldMapping.pauseReason, '')}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        fieldMapping: {
                          ...prev.fieldMapping,
                          pauseReason: e.target.value
                        }
                      }))
                    }
                    placeholder="pause_reason"
                  />
                  <p className="text-xs text-muted-foreground">
                    Field that provides the reason for pausing
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.webhookType === 'stop' && (
          <div className="space-y-4">
            <h3 className="font-medium">Stop Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lead Identifier Field</Label>
                <div className="space-y-1">
                  <Input
                    value={getFieldMappingValue(formData.fieldMapping.stopLeadId, '')}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        fieldMapping: {
                          ...prev.fieldMapping,
                          stopLeadId: e.target.value
                        }
                      }))
                    }
                    placeholder="lead_id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Field that identifies which lead to stop (e.g., lead_id, phone, email)
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stop Reason Field</Label>
                <div className="space-y-1">
                  <Input
                    value={getFieldMappingValue(formData.fieldMapping.stopReason, '')}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        fieldMapping: {
                          ...prev.fieldMapping,
                          stopReason: e.target.value
                        }
                      }))
                    }
                    placeholder="stop_reason"
                  />
                  <p className="text-xs text-muted-foreground">
                    Field that provides the reason for stopping
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>DNC Field</Label>
                <div className="space-y-1">
                  <Input
                    value={getFieldMappingValue(formData.fieldMapping.dncFlag, '')}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        fieldMapping: {
                          ...prev.fieldMapping,
                          dncFlag: e.target.value
                        }
                      }))
                    }
                    placeholder="dnc"
                  />
                  <p className="text-xs text-muted-foreground">
                    Field that indicates if lead should be marked as DNC
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sold Field</Label>
                <div className="space-y-1">
                  <Input
                    value={getFieldMappingValue(formData.fieldMapping.soldFlag, '')}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        fieldMapping: {
                          ...prev.fieldMapping,
                          soldFlag: e.target.value
                        }
                      }))
                    }
                    placeholder="sold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Field that indicates if lead should be marked as sold
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Custom Fields</h3>
                  <Button
                    type="button"
              variant="outline"
                    size="sm"
              onClick={addCustomFieldMapping}
                  >
              Add Field
                  </Button>
                </div>
          <div className="space-y-4">
            {customFieldMappings.map((mapping, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Field Name</Label>
                    <Input
                      value={mapping.key}
                      onChange={(e) =>
                        handleCustomFieldMappingChange(index, 'key', e.target.value)
                      }
                      placeholder="Field name"
                    />
              </div>
                  <div className="space-y-2">
                    <Label>Webhook Field</Label>
                    <Input
                      value={mapping.value}
                      onChange={(e) =>
                        handleCustomFieldMappingChange(index, 'value', e.target.value)
                      }
                      placeholder="Webhook field"
                    />
                  </div>
                </div>
            <Button
              type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCustomFieldMapping(index)}
                  className="mt-6"
                >
                  <X className="h-4 w-4" />
            </Button>
              </div>
            ))}
          </div>
          </div>
        </CardContent>
      </Card>
  );
      
  const renderValidationRulesStep = () => (
      <Card>
        <CardHeader>
          <CardTitle>Validation Rules</CardTitle>
          <CardDescription>
            Configure validation rules for incoming webhook data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requirePhone"
                checked={formData.validationRules.requirePhone}
                onCheckedChange={(checked) => 
                handleValidationRuleChange('requirePhone', checked)
                }
              />
            <Label htmlFor="requirePhone">Require Phone Number</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireName"
                checked={formData.validationRules.requireName}
                onCheckedChange={(checked) => 
                handleValidationRuleChange('requireName', checked)
                }
              />
            <Label htmlFor="requireName">Require Full Name</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireEmail"
                checked={formData.validationRules.requireEmail}
                onCheckedChange={(checked) => 
                handleValidationRuleChange('requireEmail', checked)
                }
              />
            <Label htmlFor="requireEmail">Require Email Address</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowDuplicatePhone"
                checked={formData.validationRules.allowDuplicatePhone}
                onCheckedChange={(checked) => 
                handleValidationRuleChange('allowDuplicatePhone', checked)
                }
              />
            <Label htmlFor="allowDuplicatePhone">Allow Duplicate Phone Numbers</Label>
            </div>
          </div>
        </CardContent>
      </Card>
  );
      
  const renderAutoTagStep = () => (
      <Card>
        <CardHeader>
        <CardTitle>Auto-Tagging Rules</CardTitle>
          <CardDescription>
          Configure automatic tagging rules for incoming leads.
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {formData.autoTagRules?.map((rule, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="space-y-2">
                <Label>Field</Label>
                <Input
                  value={rule.field}
                    onChange={(e) =>
                      handleAutoTagRuleChange(index, 'field', e.target.value)
                    }
                  placeholder="source"
                />
              </div>
                <div className="space-y-2">
                <Label>Operator</Label>
                  <Select
                  value={rule.operator}
                    onValueChange={(value) =>
                      handleAutoTagRuleChange(index, 'operator', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="exists">Exists</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    value={rule.value}
                    onChange={(e) =>
                      handleAutoTagRuleChange(index, 'value', e.target.value)
                    }
                    placeholder="website"
                  />
                </div>
                <div className="space-y-2">
                <Label>Tag</Label>
                <Input
                  value={rule.tag}
                    onChange={(e) =>
                      handleAutoTagRuleChange(index, 'tag', e.target.value)
                    }
                  placeholder="web-lead"
                />
              </div>
              </div>
                <Button
                  type="button"
                  variant="ghost"
                size="icon"
                  onClick={() => removeAutoTagRule(index)}
                >
                <X className="h-4 w-4" />
                </Button>
            </div>
          ))}
        </div>
          <Button
            type="button"
            variant="outline"
            onClick={addAutoTagRule}
          >
          Add Tag Rule
          </Button>
        </CardContent>
      </Card>
  );
      
  const renderAdvancedSettingsStep = () => {
    console.log("Rendering advanced settings step with conditionalRules:", conditionalRules);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>
            Configure additional settings for your webhook.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Required Headers</h3>
            <div className="space-y-4">
            {requiredHeaders.map((header, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Header Name</Label>
                  <Input
                    value={header.key}
                        onChange={(e) =>
                          handleRequiredHeaderChange(index, e.target.value, header.value)
                        }
                        placeholder="Header name"
                  />
                </div>
                    <div className="space-y-2">
                      <Label>Header Value</Label>
                  <Input
                    value={header.value}
                        onChange={(e) =>
                          handleRequiredHeaderChange(index, header.key, e.target.value)
                        }
                        placeholder="Header value"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRequiredHeader(index)}
                    className="mt-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRequiredHeader}
              >
                Add Header
              </Button>
              </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Auto-Enroll in Journey</h3>
            <Select
              value={formData.autoEnrollJourneyId?.toString() || "none"}
              onValueChange={(value) =>
                setFormData(prev => ({
                  ...prev,
                  autoEnrollJourneyId: value === "none" ? null : parseInt(value)
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a journey" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {availableJourneys.map((journey) => (
                  <SelectItem key={journey.id} value={journey.id.toString()}>
                    {journey.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Webhook Testing Section */}
          {isEdit && webhookId && (
            <div className="space-y-4">
              <h3 className="font-medium">Test Webhook</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Test Payload</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateSamplePayload}
                    >
                      Generate Sample
                    </Button>
                  </div>
                  <Textarea
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    placeholder="Enter JSON payload for testing"
                    className="h-32 font-mono text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook}
                  className="w-full"
                >
                  {testingWebhook ? 'Testing...' : 'Test Webhook'}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-medium">Conditional Rules</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
            <Checkbox
              id="enableConditionalRules"
              checked={conditionalRules.enabled}
                  onCheckedChange={(checked) => {
                    console.log("Setting conditionalRules.enabled to:", checked);
                    setConditionalRules(prev => ({
                      ...prev,
                      enabled: !!checked
                    }));
                  }}
                />
                <Label htmlFor="enableConditionalRules">Enable Conditional Rules</Label>
            </div>
          {conditionalRules.enabled && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Label>Logic Operator</Label>
                <Select
                  value={conditionalRules.logicOperator}
                      onValueChange={(value) => {
                        console.log("Setting logicOperator to:", value);
                        setConditionalRules(prev => ({
                          ...prev,
                          logicOperator: value as 'AND' | 'OR'
                        }));
                      }}
                >
                  <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                  {conditionalRules.conditionSets.length === 0 ? (
                    <div className="p-8 text-center border rounded-lg">
                      <p className="text-muted-foreground mb-4">No condition sets defined yet</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addConditionSet}
                  >
                        Add Your First Condition Set
                  </Button>
                </div>
                  ) : (
                    <div className="space-y-4">
                      {conditionalRules.conditionSets.map((set, setIndex) => (
                        <div key={setIndex} className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                            <h4 className="font-medium">Condition Set {setIndex + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                              size="icon"
                          onClick={() => removeConditionSet(setIndex)}
                        >
                              <X className="h-4 w-4" />
                        </Button>
                      </div>
                          <div className="space-y-4">
                            {set.conditions.map((condition, conditionIndex) => (
                              <div key={conditionIndex} className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                  <div className="space-y-2">
                                    <Label>Field</Label>
                                    <Input
                                      value={condition.field}
                                      onChange={(e) =>
                                        updateCondition(setIndex, conditionIndex, 'field', e.target.value)
                                      }
                                      placeholder="Field name"
                                    />
                          </div>
                                  <div className="space-y-2">
                                    <Label>Operator</Label>
                                  <Select
                                      value={condition.operator || "equals"}
                                      onValueChange={(value) =>
                                        updateCondition(setIndex, conditionIndex, 'operator', value)
                                      }
                                  >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select operator" />
                                    </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="equals">Equals</SelectItem>
                                        <SelectItem value="not_equals">Not Equals</SelectItem>
                                        <SelectItem value="contains">Contains</SelectItem>
                                        <SelectItem value="not_contains">Not Contains</SelectItem>
                                        <SelectItem value="starts_with">Starts With</SelectItem>
                                        <SelectItem value="ends_with">Ends With</SelectItem>
                                        <SelectItem value="greater_than">Greater Than</SelectItem>
                                        <SelectItem value="less_than">Less Than</SelectItem>
                                        <SelectItem value="greater_than_or_equal">Greater Than or Equal</SelectItem>
                                        <SelectItem value="less_than_or_equal">Less Than or Equal</SelectItem>
                                        <SelectItem value="exists">Exists</SelectItem>
                                        <SelectItem value="not_exists">Not Exists</SelectItem>
                                        <SelectItem value="is_empty">Is Empty</SelectItem>
                                        <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                                        <SelectItem value="regex_match">Regex Match</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                  <div className="space-y-2">
                                    <Label>Value</Label>
                                <Input
                                      value={condition.value || ''}
                                      onChange={(e) =>
                                        updateCondition(setIndex, conditionIndex, 'value', e.target.value)
                                      }
                                      placeholder="Value"
                                    />
                            </div>
                                  <div className="space-y-2">
                                    <Label>Data Type</Label>
                              <Select
                                      value={condition.dataType || "string"}
                                      onValueChange={(value) =>
                                        updateCondition(setIndex, conditionIndex, 'dataType', value)
                                      }
                              >
                                <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="array">Array</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCondition(setIndex, conditionIndex)}
                              >
                                  Remove Condition
                              </Button>
                          </div>
                        ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                              onClick={() => addCondition(setIndex)}
                          >
                              Add Condition
                          </Button>
                        </div>

                          <div className="space-y-4 mt-6">
                            <h4 className="font-medium">Actions</h4>
                            {set.actions && set.actions.map((action, actionIndex) => (
                              <div key={actionIndex} className="space-y-2 border-t pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Action Type</Label>
                              <Select
                                      value={action.type || "create_lead"}
                                      onValueChange={(value) =>
                                        updateAction(setIndex, actionIndex, 'type', value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                        <SelectItem value="create_lead">Create Lead</SelectItem>
                                        <SelectItem value="update_lead">Update Lead</SelectItem>
                                        <SelectItem value="delete_lead">Delete Lead</SelectItem>
                                        <SelectItem value="send_notification">Send Notification</SelectItem>
                                        <SelectItem value="enroll_journey">Enroll in Journey</SelectItem>
                                        <SelectItem value="call_webhook">Call Webhook</SelectItem>
                                        <SelectItem value="set_tags">Set Tags</SelectItem>
                                        <SelectItem value="create_task">Create Task</SelectItem>
                                </SelectContent>
                              </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Action Configuration</Label>
                                    {getActionConfigFields(action.type, setIndex, actionIndex)}
                                  </div>
                                </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAction(setIndex, actionIndex)}
                              >
                                Remove Action
                              </Button>
                            </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addAction(setIndex)}
                            >
                              Add Action
                            </Button>
                            </div>
                          </div>
                        ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addConditionSet}
                      >
                        Add Condition Set
                      </Button>
                      </div>
                  )}
                  </div>
                )}
              </div>
            </div>
        </CardContent>
      </Card>
    );
  };

  const renderCurrentStep = () => {
    console.log(`Rendering step ${currentStep} of ${steps.length}`);
    
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderWebhookTypeStep();
      case 3:
        return renderFieldMappingStep();
      case 4:
        return renderValidationRulesStep();
      case 5:
        return renderAutoTagStep();
      case 6:
        return renderAdvancedSettingsStep();
      default:
        console.error(`Invalid step: ${currentStep}`);
        return renderBasicInfoStep();
    }
  };

  // Add function to fetch displays when specific mode is selected
  const handleDisplayModeChange = async (mode: 'all' | 'specific' | 'group') => {
    setFormData(prev => ({
      ...prev,
      announcementConfig: {
        ...prev.announcementConfig!,
        optisigns: {
          ...prev.announcementConfig!.optisigns,
          displaySelection: {
            ...prev.announcementConfig!.optisigns.displaySelection,
            mode,
            displayIds: mode === 'specific' ? selectedDisplayIds : undefined
          }
        }
      }
    }));

    // Fetch displays if not already fetched and specific mode is selected
    if (mode === 'specific' && !displaysFetched) {
      await fetchAnnouncementDisplays();
    }
  };

  // Add function to handle display selection
  const handleDisplaySelection = (displayId: string, selected: boolean) => {
    const newSelectedIds = selected 
      ? [...selectedDisplayIds, displayId]
      : selectedDisplayIds.filter(id => id !== displayId);
    
    setSelectedDisplayIds(newSelectedIds);
    
    setFormData(prev => ({
      ...prev,
      announcementConfig: {
        ...prev.announcementConfig!,
        optisigns: {
          ...prev.announcementConfig!.optisigns,
          displaySelection: {
            ...prev.announcementConfig!.optisigns.displaySelection,
            displayIds: newSelectedIds
          }
        }
      }
    }));
  };



  // Test webhook functionality
  const handleTestWebhook = async () => {
    if (!webhookId) {
      toast.error('Save the webhook first before testing');
      return;
    }

    try {
      setTestingWebhook(true);
      const payload = JSON.parse(testPayload);
      
      let testResult;
      if (formData.webhookType === 'announcement') {
        testResult = await testAnnouncement(webhookId, payload);
      } else {
        testResult = await testWebhook(webhookId, payload);
      }
      
      console.log('Test result:', testResult);
      toast.success('Webhook test completed successfully');
    } catch (error) {
      console.error('Error testing webhook:', error);
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON in test payload');
      } else {
        toast.error('Webhook test failed');
      }
    } finally {
      setTestingWebhook(false);
    }
  };

  // Generate sample test payload based on webhook type
  const generateSamplePayload = () => {
    let samplePayload: Record<string, any> = {};
    
    switch (formData.webhookType) {
      case 'go':
        samplePayload = {
          phone: "+1234567890",
          name: "John Doe",
          email: "john@example.com",
          brand: formData.brand || "Sample Brand",
          source: formData.source || "Website"
        };
        break;
      
      case 'pause':
        samplePayload = {
          phone: "+1234567890",
          pause_reason: "customer_request",
          pause_duration: "2_hours"
        };
        break;
      
      case 'stop':
        samplePayload = {
          phone: "+1234567890",
          stop_reason: "sold",
          stop_type: "converted"
        };
        break;
      
      case 'announcement':
        samplePayload = {
          rep_name: "John Smith",
          deal_amount: "$50,000",
          company_name: "Acme Corp",
          achievement_type: "deal_closed"
        };
        break;

      case 'call':
        samplePayload = {
          phone: "+1234567890",
          name: "John Doe",
          email: "john@example.com",
          brand: formData.brand || "Sample Brand",
          source: formData.source || "Website",
          priority: "high",
          callback_number: formData.callConfig?.transferNumber || "+18005551234"
        };
        break;
    }
    
    // Add custom fields from field mapping
    Object.entries(formData.fieldMapping).forEach(([key, value]) => {
      if (!samplePayload[value as string] && key !== 'phone' && key !== 'name' && key !== 'email') {
        samplePayload[value as string] = `sample_${key}_value`;
      }
    });
    
    setTestPayload(JSON.stringify(samplePayload, null, 2));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}
      <form onSubmit={handleSubmit} className="space-y-6">
        {renderCurrentStep()}
        
        <div className="flex justify-between gap-4">
        <Button
          type="button"
          variant="outline"
            onClick={() => {
              if (currentStep > 1) {
                console.log(`Moving to previous step: ${currentStep - 1}`);
                setCurrentStep(currentStep - 1);
              } else {
                router.push('/webhooks');
              }
            }}
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>
          
          {currentStep < steps.length ? (
            <Button
              type="button"
              onClick={() => {
                console.log(`Moving to next step: ${currentStep + 1}`);
                setCurrentStep(currentStep + 1);
              }}
            >
              Next
            </Button>
          ) : (
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update Webhook' : 'Create Webhook'}
        </Button>
          )}
      </div>
    </form>
    </div>
  );
} 