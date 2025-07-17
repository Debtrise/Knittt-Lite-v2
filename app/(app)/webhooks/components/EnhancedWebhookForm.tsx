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
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { 
  createWebhook, 
  updateWebhook, 
  getWebhookDetails, 
  testAnnouncement, 
  testWebhook 
} from '@/app/utils/api';
import api from '@/app/lib/api';
import { WebhookEndpoint, CreateWebhookParams, WebhookType } from '@/app/types/webhook';
import { toast } from 'react-hot-toast';
import { X, Play, Pause, Square, Sparkles, Loader2, RefreshCw, CheckCircle, AlertCircle, Database, Monitor, Phone } from 'lucide-react';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { useAuthStore } from '@/app/store/authStore';

type EnhancedWebhookFormProps = {
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

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  variables?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface Display {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  isOnline: boolean;
  resolution?: { width: number; height: number };
  tags?: string[];
  lastSeen: string;
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

// Data fetching status component
const DataStatus = ({ 
  loading, 
  error, 
  data, 
  label, 
  onRetry 
}: { 
  loading: boolean; 
  error: string | null; 
  data: any[]; 
  label: string; 
  onRetry: () => void 
}) => (
  <div className="flex items-center space-x-2 text-sm">
    <Database className="h-4 w-4" />
    <span>{label}:</span>
    {loading ? (
      <div className="flex items-center space-x-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    ) : error ? (
      <div className="flex items-center space-x-1">
        <AlertCircle className="h-3 w-3 text-destructive" />
        <span className="text-destructive">Error</span>
        <Button variant="ghost" size="sm" onClick={onRetry} className="h-6 px-2">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    ) : (
      <div className="flex items-center space-x-1">
        <CheckCircle className="h-3 w-3 text-green-600" />
        <span className="text-green-600">{data.length} items</span>
      </div>
    )}
  </div>
);

export default function EnhancedWebhookForm({ webhookId, isEdit = false, onSuccess }: EnhancedWebhookFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Enhanced state management for API data
  const [availableJourneys, setAvailableJourneys] = useState<Journey[]>([]);
  const [journeysLoading, setJourneysLoading] = useState(false);
  const [journeysError, setJourneysError] = useState<string | null>(null);
  
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  
  const [availableDisplays, setAvailableDisplays] = useState<Display[]>([]);
  const [displaysLoading, setDisplaysLoading] = useState(false);
  const [displaysError, setDisplaysError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateWebhookParams>({
    name: '',
    description: '',
    webhookType: 'go' as WebhookType,
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
      enabled: true,
      dialerContext: '',
      transferNumber: '',
      maxAttempts: 3,
      delayBetweenCalls: 300,
      amd: false,
      playPosition: false,
      skipPositionAnnouncement: true,
      ivrFile: null,
      recordingId: null
    }
  });

  // Additional state for UI
  const [selectedDisplayIds, setSelectedDisplayIds] = useState<string[]>([]);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testPayload, setTestPayload] = useState<string>('{\n  "phone": "+1234567890",\n  "name": "John Doe",\n  "email": "john@example.com"\n}');

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

  // Enhanced fetch functions with better error handling
  const fetchJourneys = async () => {
    setJourneysLoading(true);
    setJourneysError(null);
    try {
      const response = await api.journeys.list();
      console.log('✅ Journeys fetched:', response);
      
      const data = response.data || response;
      let journeysList = data.journeys || data || [];
      if (!Array.isArray(journeysList)) {
        journeysList = [];
      }
      setAvailableJourneys(journeysList);
      
      if (journeysList.length === 0) {
        setJourneysError('No journeys found. Create journeys first to enable auto-enrollment.');
      }
    } catch (error) {
      console.error('❌ Error fetching journeys:', error);
      setJourneysError('Failed to load journeys. Please check your connection.');
      toast.error('Failed to load journeys');
    } finally {
      setJourneysLoading(false);
    }
  };

  const fetchProjects = async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      console.log('🎨 Fetching content projects...');
      
      const response = await api.content.getProjects({
        page: 1,
        limit: 100
      });
      console.log('✅ Projects fetched:', response);
      
      const projects = response.data?.projects || response.projects || [];
      
      const transformedProjects = projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: project.status || 'published',
        variables: project.variables || {},
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }));
      
      setAvailableProjects(transformedProjects);
      console.log('✅ Available projects:', transformedProjects);
      
      if (transformedProjects.length === 0) {
        setProjectsError('No projects found. Create projects in Content Creator first.');
      }
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      setProjectsError('Failed to load projects. Please check Content Creator API.');
      toast.error('Failed to load content projects');
      setAvailableProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchDisplays = async () => {
    setDisplaysLoading(true);
    setDisplaysError(null);
    try {
      console.log('📺 Fetching OptiSigns displays...');
      
      const response = await api.optisigns.getDisplays({ limit: 500 });
      console.log('✅ Displays fetched:', response);
      
      const displays = response.data?.displays || response.displays || [];
      
      const transformedDisplays = displays.map((display: any) => ({
        id: display.id || display.deviceId,
        name: display.name || display.deviceName || `Display ${display.id}`,
        location: display.location || display.address || 'Unknown Location',
        status: display.isOnline || display.online ? 'online' : 'offline',
        isOnline: display.isOnline || display.online || false,
        resolution: display.resolution || { width: 1920, height: 1080 },
        tags: display.tags || [],
        lastSeen: display.lastSeen || display.updatedAt || new Date().toISOString()
      }));
      
      setAvailableDisplays(transformedDisplays);
      console.log('✅ Available displays:', transformedDisplays);
      
      if (transformedDisplays.length === 0) {
        setDisplaysError('No displays found. Configure OptiSigns integration first.');
      }
    } catch (error) {
      console.error('❌ Error fetching displays:', error);
      setDisplaysError('Failed to load displays. Please check OptiSigns configuration.');
      toast.error('Failed to load displays');
    } finally {
      setDisplaysLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    console.log('🚀 Initializing Enhanced Webhook Form...');
    
    // Fetch all required data in parallel
    Promise.all([
      fetchJourneys(),
      fetchProjects(),
      fetchDisplays()
    ]).then(() => {
      console.log('✅ All data initialized');
    }).catch(error => {
      console.error('❌ Error during initialization:', error);
    });

    if (isEdit && webhookId) {
      fetchWebhook();
    } else {
      setLoading(false);
    }
  }, [isEdit, webhookId]);

  const fetchWebhook = async () => {
    if (!webhookId) return;
    try {
      setLoading(true);
      const response = await getWebhookDetails(webhookId);
      const webhook = response.data || response;
      console.log('✅ Webhook details loaded:', webhook);
      
      // Update form data with webhook details
      setFormData({
        name: webhook.name || '',
        description: webhook.description || '',
        webhookType: webhook.webhookType || 'go',
        brand: webhook.brand || '',
        source: webhook.source || '',
        fieldMapping: webhook.fieldMapping || {
          phone: 'phone',
          name: 'full_name',
          email: 'email_address',
        },
        validationRules: webhook.validationRules || {
          requirePhone: true,
          requireName: false,
          requireEmail: false,
          allowDuplicatePhone: false,
        },
        autoTagRules: webhook.autoTagRules || [],
        callConfig: webhook.callConfig || {
          enabled: true,
          dialerContext: '',
          transferNumber: '',
          maxAttempts: 3,
          delayBetweenCalls: 300,
          amd: false,
          playPosition: false,
          skipPositionAnnouncement: true,
          ivrFile: null,
          recordingId: null
        }
      });
      
      // Update selected display IDs for announcement webhooks
      if (webhook.announcementConfig?.optisigns?.displaySelection?.displayIds) {
        setSelectedDisplayIds(webhook.announcementConfig.optisigns.displaySelection.displayIds);
      }
    } catch (error) {
      console.error('❌ Error fetching webhook details:', error);
      toast.error('Failed to load webhook details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWebhookTypeChange = (type: WebhookType) => {
    setFormData(prev => ({
      ...prev,
      webhookType: type,
      // Reset type-specific configs when changing types
      announcementConfig: type === 'announcement' ? prev.announcementConfig : undefined,
      pauseResumeConfig: type === 'pause' ? prev.pauseResumeConfig : undefined,
      stopConfig: type === 'stop' ? prev.stopConfig : undefined,
      callConfig: type === 'call' ? {
        enabled: true,
        dialerContext: '',
        transferNumber: '',
        maxAttempts: 3,
        delayBetweenCalls: 300,
        amd: false,
        playPosition: false,
        skipPositionAnnouncement: true,
        ivrFile: null,
        recordingId: null
      } : undefined
    }));
  };

  const handleDisplaySelection = (displayId: string, selected: boolean) => {
    const newSelectedIds = selected 
      ? [...selectedDisplayIds, displayId]
      : selectedDisplayIds.filter(id => id !== displayId);
    
    setSelectedDisplayIds(newSelectedIds);
    console.log('📺 Selected displays:', newSelectedIds);
  };

  const validateForm = () => {
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
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      const { token, isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated || !token) {
        toast.error('You must be logged in to create webhooks');
        router.push('/login');
        return;
      }
      
      const payload: CreateWebhookParams = {
        ...formData
      };

      console.log('💾 Submitting webhook:', payload);

      if (isEdit && webhookId) {
        await updateWebhook(webhookId, payload);
        toast.success('Webhook updated successfully');
      } else {
        const response = await createWebhook(payload);
        console.log('✅ Webhook created:', response);
        toast.success('Webhook created successfully');
        if (onSuccess) {
          onSuccess(response);
        } else {
          router.push('/webhooks');
        }
      }
    } catch (error: any) {
      console.error('❌ Error saving webhook:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        useAuthStore.getState().logout();
        router.push('/login');
        return;
      }
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save webhook';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

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
      
      console.log('✅ Test result:', testResult);
      toast.success('Webhook test completed successfully');
    } catch (error) {
      console.error('❌ Error testing webhook:', error);
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON in test payload');
      } else {
        toast.error('Webhook test failed');
      }
    } finally {
      setTestingWebhook(false);
    }
  };

  const generateSamplePayload = () => {
    let payload = {};

    // Add mapped fields
    Object.entries(formData.fieldMapping).forEach(([key, value]) => {
      if (key === 'phone') {
        payload[value] = '+1234567890';
      } else if (key === 'name') {
        payload[value] = 'John Doe';
      } else if (key === 'email') {
        payload[value] = 'john@example.com';
      } else {
        payload[value] = `Sample ${key}`;
      }
    });

    // Add type-specific fields
    switch (formData.webhookType) {
      case 'call':
        payload = {
          ...payload,
          source: formData.source || 'test-call',
          brand: formData.brand || 'test-brand',
          dialerContext: formData.callConfig?.dialerContext || 'BDS_Prime_Dialer',
          transferNumber: formData.callConfig?.transferNumber || '18005551234',
          maxAttempts: formData.callConfig?.maxAttempts || 3,
          delayBetweenCalls: formData.callConfig?.delayBetweenCalls || 300
        };
        break;
      case 'announcement':
        payload = {
          ...payload,
          projectId: formData.announcementConfig?.projectId || 'test-project',
          displayIds: selectedDisplayIds,
          variables: {
            name: 'John Doe',
            achievement: 'Closed Deal',
            amount: '$50,000'
          }
        };
        break;
      // Add other webhook type cases as needed
    }

    setTestPayload(JSON.stringify(payload, null, 2));
  };

  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Configure the basic details of your webhook',
    },
    {
      id: 2,
      title: 'Webhook Type & Configuration',
      description: 'Choose webhook type and configure specific settings',
    },
    {
      id: 3,
      title: 'Field Mapping & Validation',
      description: 'Map fields and set validation rules',
    },
    {
      id: 4,
      title: 'Review & Test',
      description: 'Review configuration and test webhook',
    }
  ];

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all ${
                currentStep >= step.id
                  ? 'bg-primary text-primary-foreground'
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
      <div className="flex justify-between mt-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`text-xs text-center w-24 transition-colors ${
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

  const renderDataStatus = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Backend Data Status</span>
        </CardTitle>
        <CardDescription>
          Real-time status of backend API connections and data availability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <DataStatus
          loading={journeysLoading}
          error={journeysError}
          data={availableJourneys}
          label="Journeys"
          onRetry={fetchJourneys}
        />
        <DataStatus
          loading={projectsLoading}
          error={projectsError}
          data={availableProjects}
          label="Content Projects"
          onRetry={fetchProjects}
        />
        <DataStatus
          loading={displaysLoading}
          error={displaysError}
          data={availableDisplays}
          label="OptiSigns Displays"
          onRetry={fetchDisplays}
        />
      </CardContent>
    </Card>
  );

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
        <CardTitle>Webhook Type & Configuration</CardTitle>
        <CardDescription>
          Choose the type of webhook and configure its specific settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
              Configure outbound call campaigns
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
        </div>

        {/* Show configuration based on webhook type */}
        {formData.webhookType === 'call' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Dialer Context</Label>
                <Input
                  value={formData.callConfig?.dialerContext || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    callConfig: {
                      ...prev.callConfig,
                      dialerContext: e.target.value
                    }
                  }))}
                  placeholder="e.g., BDS_Prime_Dialer"
                />
              </div>

              <div className="space-y-2">
                <Label>Transfer Number</Label>
                <Input
                  value={formData.callConfig?.transferNumber || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    callConfig: {
                      ...prev.callConfig,
                      transferNumber: e.target.value
                    }
                  }))}
                  placeholder="e.g., 18005551234"
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum Attempts</Label>
                <Input
                  type="number"
                  value={formData.callConfig?.maxAttempts || 3}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    callConfig: {
                      ...prev.callConfig,
                      maxAttempts: parseInt(e.target.value) || 3
                    }
                  }))}
                  min={1}
                  max={10}
                />
                <p className="text-sm text-muted-foreground">
                  Number of times to attempt the call
                </p>
              </div>

              <div className="space-y-2">
                <Label>Delay Between Calls (seconds)</Label>
                <Input
                  type="number"
                  value={formData.callConfig?.delayBetweenCalls || 300}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    callConfig: {
                      ...prev.callConfig,
                      delayBetweenCalls: parseInt(e.target.value) || 300
                    }
                  }))}
                  min={60}
                  max={3600}
                />
                <p className="text-sm text-muted-foreground">
                  Time to wait between call attempts (minimum 60 seconds)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="amd"
                  checked={formData.callConfig?.amd || false}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    callConfig: {
                      ...prev.callConfig,
                      amd: !!checked
                    }
                  }))}
                />
                <Label htmlFor="amd">Enable Answering Machine Detection</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="playPosition"
                  checked={formData.callConfig?.playPosition || false}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    callConfig: {
                      ...prev.callConfig,
                      playPosition: !!checked
                    }
                  }))}
                />
                <Label htmlFor="playPosition">Play Queue Position</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipPositionAnnouncement"
                  checked={formData.callConfig?.skipPositionAnnouncement || false}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    callConfig: {
                      ...prev.callConfig,
                      skipPositionAnnouncement: !!checked
                    }
                  }))}
                />
                <Label htmlFor="skipPositionAnnouncement">Skip Position Announcement</Label>
              </div>
            </div>
          </div>
        )}

        {formData.webhookType === 'announcement' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Content Project</Label>
                {projectsLoading ? (
                  <LoadingState message="Loading projects..." />
                ) : projectsError ? (
                  <ErrorState message={projectsError} onRetry={fetchProjects} />
                ) : (
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{project.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {project.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Target Displays</Label>
                {displaysLoading ? (
                  <LoadingState message="Loading displays..." />
                ) : displaysError ? (
                  <ErrorState message={displaysError} onRetry={fetchDisplays} />
                ) : (
                  <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                    {availableDisplays.map((display) => (
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
                            <div className="flex items-center space-x-2">
                              <Monitor className="h-3 w-3" />
                              <Badge 
                                variant={display.status === 'online' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {display.status}
                              </Badge>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {formData.webhookType === 'go' && (
          <div className="space-y-4">
            <Label>Auto-Enroll in Journey</Label>
            {journeysLoading ? (
              <LoadingState message="Loading journeys..." />
            ) : journeysError ? (
              <ErrorState message={journeysError} onRetry={fetchJourneys} />
            ) : (
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a journey (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableJourneys.map((journey) => (
                    <SelectItem key={journey.id} value={journey.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{journey.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {journey.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderFieldMappingStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Field Mapping & Validation</CardTitle>
        <CardDescription>
          Map incoming webhook fields to your system fields and set validation rules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium">Standard Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Phone Number Field</Label>
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
            </div>
            <div className="space-y-2">
              <Label>Name Field</Label>
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
            </div>
            <div className="space-y-2">
              <Label>Email Field</Label>
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
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Validation Rules</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requirePhone"
                checked={formData.validationRules.requirePhone}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    validationRules: {
                      ...prev.validationRules,
                      requirePhone: !!checked
                    }
                  }))
                }
              />
              <Label htmlFor="requirePhone">Require Phone Number</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireName"
                checked={formData.validationRules.requireName}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    validationRules: {
                      ...prev.validationRules,
                      requireName: !!checked
                    }
                  }))
                }
              />
              <Label htmlFor="requireName">Require Full Name</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireEmail"
                checked={formData.validationRules.requireEmail}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    validationRules: {
                      ...prev.validationRules,
                      requireEmail: !!checked
                    }
                  }))
                }
              />
              <Label htmlFor="requireEmail">Require Email Address</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowDuplicatePhone"
                checked={formData.validationRules.allowDuplicatePhone}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    validationRules: {
                      ...prev.validationRules,
                      allowDuplicatePhone: !!checked
                    }
                  }))
                }
              />
              <Label htmlFor="allowDuplicatePhone">Allow Duplicate Phone Numbers</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderReviewStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Review Configuration</CardTitle>
        <CardDescription>
          Review your webhook configuration before saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Basic Information</h3>
            <div className="space-y-1">
              <p><span className="text-muted-foreground">Name:</span> {formData.name}</p>
              <p><span className="text-muted-foreground">Type:</span> {formData.webhookType}</p>
              <p><span className="text-muted-foreground">Brand:</span> {formData.brand}</p>
              <p><span className="text-muted-foreground">Source:</span> {formData.source}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Field Mapping</h3>
            <div className="space-y-1">
              {Object.entries(formData.fieldMapping).map(([key, value]) => (
                <p key={key}>
                  <span className="text-muted-foreground">{key}:</span> {value}
                </p>
              ))}
            </div>
          </div>
        </div>

        {formData.webhookType === 'call' && formData.callConfig && (
          <div>
            <h3 className="font-medium mb-2">Call Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Basic Settings</h4>
                <div className="space-y-1">
                  <p>
                    <span className="text-muted-foreground">Dialer Context:</span>{' '}
                    {formData.callConfig.dialerContext || 'Not set'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Transfer Number:</span>{' '}
                    {formData.callConfig.transferNumber || 'Not set'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Retry Settings</h4>
                <div className="space-y-1">
                  <p>
                    <span className="text-muted-foreground">Maximum Attempts:</span>{' '}
                    {formData.callConfig.maxAttempts} times
                  </p>
                  <p>
                    <span className="text-muted-foreground">Delay Between Calls:</span>{' '}
                    {formData.callConfig.delayBetweenCalls} seconds
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Advanced Features</h4>
                <div className="space-y-1">
                  <p>
                    <span className="text-muted-foreground">AMD:</span>{' '}
                    {formData.callConfig.amd ? 'Enabled' : 'Disabled'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Play Position:</span>{' '}
                    {formData.callConfig.playPosition ? 'Enabled' : 'Disabled'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Skip Position Announcement:</span>{' '}
                    {formData.callConfig.skipPositionAnnouncement ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Existing announcement config review */}
        {formData.webhookType === 'announcement' && (
          <div className="space-y-4">
            <h3 className="font-medium">Announcement Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Content Project:</span> {formData.announcementConfig?.projectId || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Target Displays:</span> {selectedDisplayIds.length} selected
              </div>
            </div>
          </div>
        )}

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
                {testingWebhook ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Webhook'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderWebhookTypeStep();
      case 3:
        return renderFieldMappingStep();
      case 4:
        return renderReviewStep();
      default:
        return renderBasicInfoStep();
    }
  };

  if (loading) {
    return <LoadingState message="Loading webhook details..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {renderDataStatus()}
      {renderStepIndicator()}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {renderCurrentStep()}
        
        <div className="flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (currentStep > 1) {
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
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Webhook' : 'Create Webhook'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
} 