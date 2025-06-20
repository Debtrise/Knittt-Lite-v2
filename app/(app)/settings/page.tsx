'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Settings, Phone, Lock } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { updateTenantSettings, getTenant, updateTenant } from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';
import api from '@/app/utils/api';
import { recordings, freepbx } from '@/app/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useToast } from '@/app/components/ui/use-toast';

type TenantData = {
  id: number;
  name: string;
  apiConfig: {
    url: string;
    user: string;
    password: string;
    source: string;
    ingroup: string;
    ingroups: string;
    endpoint: string;
  };
  dialerConfig: {
    speed: number;
    minAgentsAvailable: number | string;
    autoDelete: boolean;
    sortOrder: 'oldest' | 'fewest';
    didDistribution: 'even' | 'local';
  };
  schedule: any;
  amiConfig: {
    host: string;
    port: number;
    trunk: string;
    context: string;
    username: string;
    password: string;
  };
  freepbxConfig?: {
    serverUrl: string;
    username: string;
    password: string;
    isActive: boolean;
    autoUpload: boolean;
  };
  timezone: string;
};

type SettingsFormData = {
  apiConfig: {
    apiKey: string;
    apiSecret: string;
    url: string;
    groups: string[];
    source: string;
  };
  dialerConfig: {
    speed: number;
    minAgentsAvailable: number;
    autoDelete: boolean;
    sortOrder: 'oldest' | 'fewest';
    didDistribution: 'even' | 'local';
  };
  schedule: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  }[];
  timezone: string;
  amiConfig: {
    host: string;
    port: number;
    trunk: string;
    context: string;
    username: string;
    password: string;
  };
  elevenLabsConfig: {
    apiKey: string;
  };
  freepbxConfig: {
    serverUrl: string;
    username: string;
    password: string;
    isActive: boolean;
    autoUpload: boolean;
  };
};

type TestResult = {
  success: boolean;
  message: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [elevenLabsConfig, setElevenLabsConfig] = useState<{ apiKey: string } | null>(null);
  const [isLoadingElevenLabs, setIsLoadingElevenLabs] = useState(true);
  const [showAmiWarning, setShowAmiWarning] = useState(false);
  const [amiExpanded, setAmiExpanded] = useState(false);
  const [elevenLabsExpanded, setElevenLabsExpanded] = useState(false);
  const [freePbxExpanded, setFreePbxExpanded] = useState(false);
  
  const form = useForm<SettingsFormData>({
    defaultValues: {
      apiConfig: {
        url: '',
        apiKey: '',
        apiSecret: '',
        groups: [],
        source: 'BTR'
      },
      dialerConfig: {
        speed: 1,
        minAgentsAvailable: 1,
        autoDelete: false,
        sortOrder: 'oldest',
        didDistribution: 'even'
      },
      schedule: [
        { enabled: true, startTime: '09:00', endTime: '17:00' }, // monday
        { enabled: true, startTime: '09:00', endTime: '17:00' }, // tuesday
        { enabled: true, startTime: '09:00', endTime: '17:00' }, // wednesday
        { enabled: true, startTime: '09:00', endTime: '17:00' }, // thursday
        { enabled: true, startTime: '09:00', endTime: '17:00' }, // friday
        { enabled: false, startTime: '09:00', endTime: '17:00' }, // saturday
        { enabled: false, startTime: '09:00', endTime: '17:00' }  // sunday
      ],
      timezone: 'America/Los_Angeles',
      amiConfig: {
        host: '',
        port: 0,
        trunk: '',
        context: '',
        username: '',
        password: ''
      },
      elevenLabsConfig: {
        apiKey: '',
      },
      freepbxConfig: {
        serverUrl: '',
        username: '',
        password: '',
        isActive: false,
        autoUpload: false,
      },
    }
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setIsLoadingElevenLabs(true);
      try {
        // Fetch tenant data
        if (user?.tenantId) {
          const tenantId = parseInt(user.tenantId, 10);
          const data = await getTenant(tenantId);
          console.log('Retrieved tenant data:', data);
          setTenantData(data);

          // Prefill form with tenant data
          if (data) {
            // Parse ingroup/ingroups into an array for the form
            const groups = [];
            if (data.apiConfig?.ingroup) {
              groups.push(data.apiConfig.ingroup);
            }
            if (data.apiConfig?.ingroups && data.apiConfig.ingroups !== data.apiConfig?.ingroup) {
              groups.push(...data.apiConfig.ingroups.split(',').filter(Boolean));
            }

            setValue('apiConfig.url', data.apiConfig?.url || '');
            setValue('apiConfig.apiKey', data.apiConfig?.user || '');
            setValue('apiConfig.apiSecret', data.apiConfig?.password || '');
            setValue('apiConfig.groups', groups);
            setValue('apiConfig.source', data.apiConfig?.source || 'BTR');
            
            setValue('dialerConfig.speed', data.dialerConfig?.speed || 1);
            setValue('dialerConfig.minAgentsAvailable', data.dialerConfig?.minAgentsAvailable || 1);
            setValue('dialerConfig.autoDelete', data.dialerConfig?.autoDelete || false);
            setValue('dialerConfig.sortOrder', data.dialerConfig?.sortOrder || 'oldest');
            setValue('dialerConfig.didDistribution', data.dialerConfig?.didDistribution || 'even');
            
            if (data.schedule) {
              // Map schedule data from API format to form format
              // The API uses named days, but the form uses an array with indices
              const scheduleMapping = {
                sunday: 0,
                monday: 1,
                tuesday: 2,
                wednesday: 3,
                thursday: 4,
                friday: 5,
                saturday: 6
              };
              
              Object.entries(data.schedule).forEach(([day, config]) => {
                const index = scheduleMapping[day.toLowerCase()];
                if (index !== undefined && config) {
                  setValue(`schedule.${index}.enabled`, config.enabled || false);
                  setValue(`schedule.${index}.startTime`, config.start || '09:00');
                  setValue(`schedule.${index}.endTime`, config.end || '17:00');
                }
              });
            }
            
            // Set timezone from tenant data
            if (data.timezone) {
              setValue('timezone', data.timezone);
            }
            
            if (data.amiConfig) {
              setValue('amiConfig.host', data.amiConfig.host || '');
              setValue('amiConfig.port', data.amiConfig.port || 5038);
              setValue('amiConfig.trunk', data.amiConfig.trunk || '');
              setValue('amiConfig.context', data.amiConfig.context || '');
              setValue('amiConfig.username', data.amiConfig.username || '');
              setValue('amiConfig.password', data.amiConfig.password || '');
            }

            if (data.freepbxConfig) {
              setValue('freepbxConfig.serverUrl', data.freepbxConfig.serverUrl || '');
              setValue('freepbxConfig.username', data.freepbxConfig.username || '');
              setValue('freepbxConfig.password', data.freepbxConfig.password || '');
              setValue('freepbxConfig.isActive', data.freepbxConfig.isActive || false);
              setValue('freepbxConfig.autoUpload', data.freepbxConfig.autoUpload || false);
            }
          }

          // Fetch Eleven Labs configuration
          try {
            const config = await recordings.getConfig();
            setElevenLabsConfig(config.data);
            setValue('elevenLabsConfig.apiKey', config.data.apiKey || '');
          } catch (error) {
            console.error('Error fetching Eleven Labs config:', error);
            setElevenLabsConfig(null);
          }
        }
      } catch (error) {
        console.error('Error fetching settings data:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
        setIsLoadingElevenLabs(false);
      }
    };

    fetchData();
  }, [isAuthenticated, router, user, setValue]);

  const onSubmit = async (data: SettingsFormData) => {
    if (!user?.tenantId) return;
    
    setIsSubmitting(true);
    try {
      const tenantId = parseInt(user.tenantId, 10);
      console.log('Submitting form data:', data);
      
      // Make sure the ingroup/ingroups is an array or create from comma-separated string
      let groups = data.apiConfig.groups as string | string[];
      if (!Array.isArray(groups) && typeof groups === 'string') {
        groups = groups.split(',').map(g => g.trim()).filter(Boolean);
      } else if (!Array.isArray(groups)) {
        groups = [];
      }

      // Ensure at least one group is set
      if (groups.length === 0) {
        groups = ['TaxSales'];
      }
      
      // Get current tenant data to preserve any fields we don't update
      const currentTenant = await getTenant(tenantId);
      
      // Prepare the updated API config with all fields
      const updatedApiConfig = {
        ...currentTenant.apiConfig,
        url: data.apiConfig.url,
        user: data.apiConfig.apiKey, // Map apiKey to user field
        password: data.apiConfig.apiSecret, // Map apiSecret to password field
        ingroup: groups.length > 0 ? groups[0] : 'TaxSales',
        ingroups: groups.join(',')
      };
      
      // Convert schedule format from form to API format
      const scheduleData = {
        monday: { enabled: data.schedule[1].enabled, start: data.schedule[1].startTime, end: data.schedule[1].endTime },
        tuesday: { enabled: data.schedule[2].enabled, start: data.schedule[2].startTime, end: data.schedule[2].endTime },
        wednesday: { enabled: data.schedule[3].enabled, start: data.schedule[3].startTime, end: data.schedule[3].endTime },
        thursday: { enabled: data.schedule[4].enabled, start: data.schedule[4].startTime, end: data.schedule[4].endTime },
        friday: { enabled: data.schedule[5].enabled, start: data.schedule[5].startTime, end: data.schedule[5].endTime },
        saturday: { enabled: data.schedule[6].enabled, start: data.schedule[6].startTime, end: data.schedule[6].endTime },
        sunday: { enabled: data.schedule[0].enabled, start: data.schedule[0].startTime, end: data.schedule[0].endTime }
      };
      
      console.log('Updating API config with:', updatedApiConfig);
      
      // Update the entire tenant with all settings at once
      await updateTenant(tenantId, {
        ...currentTenant,
        apiConfig: updatedApiConfig,
        dialerConfig: data.dialerConfig,
        schedule: scheduleData,
        timezone: data.timezone,
        amiConfig: data.amiConfig,
        freepbxConfig: data.freepbxConfig,
      });

      // Update Eleven Labs configuration if changed
      if (data.elevenLabsConfig.apiKey !== elevenLabsConfig?.apiKey) {
        await recordings.configure({ apiKey: data.elevenLabsConfig.apiKey });
        toast.success('Eleven Labs configuration updated successfully');
      }

      toast.success('Settings updated successfully');
      
      // Refresh the form with the latest data
      const updatedTenant = await getTenant(tenantId);
      setTenantData(updatedTenant);

    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to update only the schedule
  const updateScheduleOnly = async () => {
    if (!user?.tenantId) return;
    
    setIsSubmitting(true);
    try {
      const tenantId = parseInt(user.tenantId, 10);
      const formData = form.getValues();
      
      // Get current tenant data to preserve other fields
      const currentTenant = await getTenant(tenantId);
      
      // Convert schedule format from form to API format
      const scheduleData = {
        monday: { enabled: formData.schedule[1].enabled, start: formData.schedule[1].startTime, end: formData.schedule[1].endTime },
        tuesday: { enabled: formData.schedule[2].enabled, start: formData.schedule[2].startTime, end: formData.schedule[2].endTime },
        wednesday: { enabled: formData.schedule[3].enabled, start: formData.schedule[3].startTime, end: formData.schedule[3].endTime },
        thursday: { enabled: formData.schedule[4].enabled, start: formData.schedule[4].startTime, end: formData.schedule[4].endTime },
        friday: { enabled: formData.schedule[5].enabled, start: formData.schedule[5].startTime, end: formData.schedule[5].endTime },
        saturday: { enabled: formData.schedule[6].enabled, start: formData.schedule[6].startTime, end: formData.schedule[6].endTime },
        sunday: { enabled: formData.schedule[0].enabled, start: formData.schedule[0].startTime, end: formData.schedule[0].endTime }
      };
      
      console.log('Updating schedule with:', scheduleData);
      console.log('Timezone:', formData.timezone);
      
      // Update only the schedule and timezone
      await updateTenant(tenantId, {
        schedule: scheduleData,
        timezone: formData.timezone
      });
      
      toast.success('Schedule updated successfully');
      
      // Refresh the form with the latest data
      const updatedTenant = await getTenant(tenantId);
      setTenantData(updatedTenant);
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API Configuration Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 text-brand mr-2" />
              <h2 className="text-lg font-medium text-gray-900">API Configuration</h2>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                Your API credentials will be used to connect to the agent status service. Make sure all fields are filled correctly.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API URL
                </label>
                <Input
                  type="text"
                  {...register('apiConfig.url', { 
                    required: 'API URL is required',
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'Please enter a valid URL starting with http:// or https://'
                    }
                  })}
                  placeholder="https://btr.ytel.com/x5/api/non_agent_api.php"
                />
                {errors.apiConfig?.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.apiConfig.url.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Username
                </label>
                <Input
                  type="text"
                  {...register('apiConfig.apiKey', { required: 'API Username is required' })}
                  placeholder="Enter API username"
                />
                {errors.apiConfig?.apiKey && (
                  <p className="mt-1 text-sm text-red-600">{errors.apiConfig.apiKey.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Password
                </label>
                <Input
                  type="password"
                  {...register('apiConfig.apiSecret', { required: 'API Password is required' })}
                  placeholder="Enter API password"
                />
                {errors.apiConfig?.apiSecret && (
                  <p className="mt-1 text-sm text-red-600">{errors.apiConfig.apiSecret.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Groups (comma-separated)
                </label>
                <Input
                  {...register('apiConfig.groups')}
                  onChange={(e) => {
                    const groups = e.target.value.split(',').map(group => group.trim());
                    setValue('apiConfig.groups', groups);
                  }}
                  placeholder="TaxSales, TaxSupport"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="brand"
                  isLoading={isSubmitting}
                >
                  Save API Settings
                </Button>
              </div>
            </form>
          </div>

          {/* Dialer Configuration Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 text-brand mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Dialer Configuration</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dialer Speed
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      id="dialerDisabled"
                      checked={watch('dialerConfig.speed') === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setValue('dialerConfig.speed', 0);
                        } else {
                          setValue('dialerConfig.speed', 1);
                        }
                      }}
                      className="h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded"
                    />
                    <label htmlFor="dialerDisabled" className="text-sm text-gray-700">
                      Disable Dialer
                    </label>
                  </div>
                  <Input
                    type="number"
                    {...register('dialerConfig.speed', { 
                      required: 'Dialer speed is required',
                      min: { value: 0, message: 'Speed must be at least 0' },
                      valueAsNumber: true
                    })}
                    disabled={watch('dialerConfig.speed') === 0}
                  />
                  {errors.dialerConfig?.speed && (
                    <p className="mt-1 text-sm text-red-600">{errors.dialerConfig.speed.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Set to 0 to disable the dialer, or 1+ to set the dialing speed.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Agents Available
                  </label>
                  <div className="flex items-center space-x-2 mb-2 invisible">
                    {/* Invisible spacer to match the layout of the dialer speed field */}
                    <input
                      type="checkbox"
                      className="h-4 w-4 invisible"
                    />
                    <label className="text-sm text-gray-700 invisible">
                      Placeholder
                    </label>
                  </div>
                  <Input
                    type="number"
                    {...register('dialerConfig.minAgentsAvailable', { 
                      required: 'Minimum agents is required',
                      min: { value: 1, message: 'Must have at least 1 agent' }
                    })}
                  />
                  {errors.dialerConfig?.minAgentsAvailable && (
                    <p className="mt-1 text-sm text-red-600">{errors.dialerConfig.minAgentsAvailable.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum number of agents that must be available before dialing.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <select
                    {...register('dialerConfig.sortOrder')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
                  >
                    <option value="oldest">Oldest First</option>
                    <option value="fewest">Fewest Calls First</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DID Distribution
                  </label>
                  <select
                    {...register('dialerConfig.didDistribution')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
                  >
                    <option value="even">Even Distribution</option>
                    <option value="local">Local First</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('dialerConfig.autoDelete')}
                    className="h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Auto Delete Processed Leads
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="brand"
                  isLoading={isSubmitting}
                >
                  Save Dialer Settings
                </Button>
              </div>
            </form>
          </div>

          {/* Schedule Section */}
          <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-brand mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Schedule</h2>
              </div>
              <button
                type="button"
                onClick={updateScheduleOnly}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#265871] hover:bg-[#1d4355] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#265871] transition-colors duration-200 font-poppins"
              >
                {isSubmitting ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                {...register('timezone')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#265871] focus:ring-[#265871] sm:text-sm"
              >
                <option value="America/Los_Angeles">America/Los_Angeles (Pacific Time)</option>
                <option value="America/Denver">America/Denver (Mountain Time)</option>
                <option value="America/Chicago">America/Chicago (Central Time)</option>
                <option value="America/New_York">America/New_York (Eastern Time)</option>
                <option value="America/Anchorage">America/Anchorage (Alaska Time)</option>
                <option value="Pacific/Honolulu">Pacific/Honolulu (Hawaii Time)</option>
                <option value="America/Phoenix">America/Phoenix (Arizona Time)</option>
              </select>
            </div>

            <div className="space-y-6">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                <div key={day} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register(`schedule.${index}.enabled`)}
                        className="h-5 w-5 text-[#265871] focus:ring-[#265871] border-gray-300 rounded cursor-pointer"
                      />
                      <label className="ml-3 block text-sm font-medium text-gray-700 w-24 cursor-pointer font-poppins">
                        {day}
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        {...register(`schedule.${index}.startTime`)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-[#265871] focus:ring-[#265871] sm:text-sm bg-white px-3 py-2 font-poppins"
                        disabled={!watch(`schedule.${index}.enabled`)}
                      />
                      <span className="text-gray-500 font-poppins">to</span>
                      <input
                        type="time"
                        {...register(`schedule.${index}.endTime`)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-[#265871] focus:ring-[#265871] sm:text-sm bg-white px-3 py-2 font-poppins"
                        disabled={!watch(`schedule.${index}.enabled`)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AMI Configuration Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-brand mr-2" />
                <h2 className="text-lg font-medium text-gray-900">AMI Configuration</h2>
              </div>
              <button
                type="button"
                onClick={() => setAmiExpanded(!amiExpanded)}
                className="flex items-center px-3 py-1 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Lock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                {amiExpanded ? 'Hide' : 'Show'} Advanced Settings
                <svg
                  className={`ml-1 h-5 w-5 transform transition-transform ${amiExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Changing AMI configuration can be detrimental to your system if not configured correctly. 
                These are advanced settings that should only be modified by system administrators.
              </p>
            </div>

            {amiExpanded && (
              <form onSubmit={(e) => {
                e.preventDefault();
                setShowAmiWarning(true);
              }} className="space-y-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Host
                    </label>
                    <Input
                      {...register('amiConfig.host', { required: 'Host is required' })}
                    />
                    {errors.amiConfig?.host && (
                      <p className="mt-1 text-sm text-red-600">{errors.amiConfig.host.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <Input
                      type="number"
                      {...register('amiConfig.port', { 
                        required: 'Port is required',
                        valueAsNumber: true
                      })}
                    />
                    {errors.amiConfig?.port && (
                      <p className="mt-1 text-sm text-red-600">{errors.amiConfig.port.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trunk
                    </label>
                    <Input
                      {...register('amiConfig.trunk', { required: 'Trunk is required' })}
                    />
                    {errors.amiConfig?.trunk && (
                      <p className="mt-1 text-sm text-red-600">{errors.amiConfig.trunk.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Context
                    </label>
                    <Input
                      {...register('amiConfig.context', { required: 'Context is required' })}
                    />
                    {errors.amiConfig?.context && (
                      <p className="mt-1 text-sm text-red-600">{errors.amiConfig.context.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <Input
                      {...register('amiConfig.username', { required: 'Username is required' })}
                    />
                    {errors.amiConfig?.username && (
                      <p className="mt-1 text-sm text-red-600">{errors.amiConfig.username.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <Input
                      type="password"
                      {...register('amiConfig.password', { required: 'Password is required' })}
                    />
                    {errors.amiConfig?.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.amiConfig.password.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="brand"
                    isLoading={isSubmitting}
                  >
                    Save AMI Settings
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Eleven Labs Configuration Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-brand mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Eleven Labs Configuration</h2>
              </div>
              <button
                type="button"
                onClick={() => setElevenLabsExpanded(!elevenLabsExpanded)}
                className="flex items-center px-3 py-1 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Lock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                {elevenLabsExpanded ? 'Hide' : 'Show'} Advanced Settings
                <svg
                  className={`ml-1 h-5 w-5 transform transition-transform ${elevenLabsExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                Configure your Eleven Labs API key to enable text-to-speech functionality for recordings.
              </p>
            </div>

            {elevenLabsExpanded && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <Input
                    type="password"
                    {...register('elevenLabsConfig.apiKey', { required: 'API Key is required' })}
                    placeholder="Enter your Eleven Labs API key"
                  />
                  {errors.elevenLabsConfig?.apiKey && (
                    <p className="mt-1 text-sm text-red-600">{errors.elevenLabsConfig.apiKey.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="brand"
                    isLoading={isSubmitting}
                  >
                    Save Eleven Labs Settings
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* FreePBX Configuration Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-brand mr-2" />
                <h2 className="text-lg font-medium text-gray-900">FreePBX Configuration</h2>
              </div>
              <button
                type="button"
                onClick={() => setFreePbxExpanded(!freePbxExpanded)}
                className="flex items-center px-3 py-1 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Lock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                {freePbxExpanded ? 'Hide' : 'Show'} Advanced Settings
                <svg
                  className={`ml-1 h-5 w-5 transform transition-transform ${freePbxExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                Configure FreePBX integration to automatically upload recordings to your PBX system. 
                Recordings will be available in FreePBX under Admin → System Recordings.
              </p>
            </div>

            {freePbxExpanded && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      FreePBX Server URL
                    </label>
                    <Input
                      type="url"
                      {...register('freepbxConfig.serverUrl', { 
                        required: 'Server URL is required',
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: 'Please enter a valid URL starting with http:// or https://'
                        }
                      })}
                      placeholder="https://dial.knittt.com"
                    />
                    {errors.freepbxConfig?.serverUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.freepbxConfig.serverUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <Input
                      {...register('freepbxConfig.username', { required: 'Username is required' })}
                      placeholder="admin"
                    />
                    {errors.freepbxConfig?.username && (
                      <p className="mt-1 text-sm text-red-600">{errors.freepbxConfig.username.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <Input
                      type="password"
                      {...register('freepbxConfig.password', { required: 'Password is required' })}
                      placeholder="Enter FreePBX password"
                    />
                    {errors.freepbxConfig?.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.freepbxConfig.password.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('freepbxConfig.isActive')}
                        className="h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Enable FreePBX Integration
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('freepbxConfig.autoUpload')}
                        className="h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded"
                        disabled={!watch('freepbxConfig.isActive')}
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Auto-upload recordings to FreePBX
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      // Test FreePBX connection
                      const formData = watch('freepbxConfig');
                      try {
                        setIsTesting(true);
                        const response = await freepbx.test({
                          serverUrl: formData.serverUrl,
                          username: formData.username,
                          password: formData.password
                        });
                        toast.success(`FreePBX connection test successful! Connected to ${response.data.version}`);
                      } catch (error: any) {
                        const errorMessage = error.response?.data?.error || 'FreePBX connection test failed';
                        toast.error(errorMessage);
                      } finally {
                        setIsTesting(false);
                      }
                    }}
                    isLoading={isTesting}
                  >
                    Test Connection
                  </Button>
                  <Button
                    type="submit"
                    variant="brand"
                    isLoading={isSubmitting}
                  >
                    Save FreePBX Settings
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      
      {/* AMI Warning Dialog */}
      {showAmiWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Warning: Critical System Settings</h3>
            <p className="mb-4 text-gray-700">
              You are about to modify AMI configuration settings. Incorrect settings can cause system failures and disrupt your service.
            </p>
            <p className="mb-6 text-gray-700">
              Are you sure you want to proceed with these changes?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAmiWarning(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAmiWarning(false);
                  handleSubmit(onSubmit)();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Yes, Update Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 