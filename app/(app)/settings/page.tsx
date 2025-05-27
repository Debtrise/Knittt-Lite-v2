'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Settings, Users, Phone, Activity, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { getAgentStatus, updateTenantSettings, getTenant, updateTenant } from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';
import api from '@/app/utils/api';
import { recordings } from '@/app/lib/api';

type AgentStatus = {
  ingroup: string;
  agents_logged_in: number;
  agents_waiting: number;
  total_calls: number;
  calls_waiting: number;
  brand: string;
  source: string;
};

type AgentStatusResponse = {
  subdomain: string;
  user: string;
  pass: string;
  ingroups: string;
  data: AgentStatus[];
};

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
};

type TestResult = {
  success: boolean;
  message: string;
  data?: AgentStatus[];
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
};

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [agentStatus, setAgentStatus] = useState<AgentStatus[]>([]);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [elevenLabsConfig, setElevenLabsConfig] = useState<{ apiKey: string } | null>(null);
  const [isLoadingElevenLabs, setIsLoadingElevenLabs] = useState(true);
  
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
      schedule: {
        monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
        sunday: { enabled: false, startTime: '09:00', endTime: '17:00' }
      },
      amiConfig: {
        host: '',
        port: '',
        trunk: '',
        context: '',
        username: '',
        password: ''
      },
      elevenLabsConfig: {
        apiKey: '',
      },
    }
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  const fetchAgentStatus = async () => {
    if (!tenantData?.apiConfig?.ingroup && !tenantData?.apiConfig?.ingroups) {
      toast.error('No agent groups configured');
      return;
    }

    if (!tenantData?.apiConfig?.url) {
      toast.error('No API URL configured');
      return;
    }

    if (!tenantData?.apiConfig?.user || !tenantData?.apiConfig?.password) {
      toast.error('API credentials not configured');
      return;
    }

    setIsRefreshing(true);
    try {
      const group = tenantData.apiConfig.ingroup || tenantData.apiConfig.ingroups;
      const status = await getAgentStatus({
        url: tenantData.apiConfig.url,
        ingroup: group,
        user: tenantData.apiConfig.user,
        pass: tenantData.apiConfig.password
      });
      setAgentStatus(Array.isArray(status) ? status : []);
    } catch (error) {
      console.error('Error fetching agent status:', error);
      toast.error('Failed to fetch agent status');
      setAgentStatus([]);
    } finally {
      setIsRefreshing(false);
    }
  };

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
              Object.entries(data.schedule).forEach(([day, config]) => {
                if (typeof config === 'object' && config !== null) {
                  setValue(`schedule.${day}.enabled`, config.enabled || false);
                  setValue(`schedule.${day}.startTime`, config.startTime || config.start || '09:00');
                  setValue(`schedule.${day}.endTime`, config.endTime || config.end || '17:00');
                }
              });
            }
            
            if (data.amiConfig) {
              setValue('amiConfig.host', data.amiConfig.host || '');
              setValue('amiConfig.port', data.amiConfig.port || 5038);
              setValue('amiConfig.trunk', data.amiConfig.trunk || '');
              setValue('amiConfig.context', data.amiConfig.context || '');
              setValue('amiConfig.username', data.amiConfig.username || '');
              setValue('amiConfig.password', data.amiConfig.password || '');
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

        // Fetch initial agent status if groups are configured
        if (tenantData?.apiConfig?.ingroup || tenantData?.apiConfig?.ingroups) {
        await fetchAgentStatus();
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
      let groups = data.apiConfig.groups;
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
      
      console.log('Updating API config with:', updatedApiConfig);
      
      // Update the entire tenant with all settings at once
      await updateTenant(tenantId, {
        ...currentTenant,
        apiConfig: updatedApiConfig,
        dialerConfig: data.dialerConfig,
        schedule: data.schedule,
        amiConfig: data.amiConfig,
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <Button
            onClick={fetchAgentStatus}
            variant="primary"
            isLoading={isRefreshing}
          >
            Refresh Status
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Agent Status Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Activity className="h-5 w-5 text-brand mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Agent Status</h2>
            </div>
            
            {agentStatus.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No agent groups found</h3>
                <p className="mt-1 text-sm text-gray-500">Configure agent groups in your settings.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agentStatus.map((group) => (
                  <div key={group.ingroup} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-brand">{group.ingroup}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand bg-opacity-10 text-brand">
                        {group.source}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600">
                            {group.agents_logged_in} agents logged in
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600">
                            {group.agents_waiting} agents waiting
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600">
                            {group.total_calls} total calls
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600">
                            {group.calls_waiting} calls waiting
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings Form Section */}
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
                  variant="primary"
                  isLoading={isSubmitting}
                >
                  Save API Settings
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Dialer Configuration Section */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
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
                <Input
                  type="number"
                  {...register('dialerConfig.speed', { 
                    required: 'Dialer speed is required',
                    min: { value: 1, message: 'Speed must be at least 1' }
                  })}
                />
                {errors.dialerConfig?.speed && (
                  <p className="mt-1 text-sm text-red-600">{errors.dialerConfig.speed.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Agents Available
                </label>
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
                variant="primary"
                isLoading={isSubmitting}
              >
                Save Dialer Settings
              </Button>
            </div>
          </form>
        </div>

        {/* Schedule Section */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-brand mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Schedule</h2>
            </div>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#265871] hover:bg-[#1d4355] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#265871] transition-colors duration-200 font-poppins"
            >
              {isSubmitting ? 'Saving...' : 'Save Schedule'}
            </button>
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
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Settings className="h-5 w-5 text-brand mr-2" />
            <h2 className="text-lg font-medium text-gray-900">AMI Configuration</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                variant="primary"
                isLoading={isSubmitting}
              >
                Save AMI Settings
              </Button>
            </div>
          </form>
        </div>

        {/* Eleven Labs Configuration Section */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Settings className="h-5 w-5 text-brand mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Eleven Labs Configuration</h2>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Configure your Eleven Labs API key to enable text-to-speech functionality for recordings.
            </p>
          </div>

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
                variant="primary"
                isLoading={isSubmitting}
              >
                Save Eleven Labs Settings
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 