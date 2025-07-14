'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useAuthStore } from '@/app/store/authStore';
import { getTenant, updateTenant } from '@/app/utils/api';
import { 
  Clock, Save, ArrowLeft, Building, Globe, 
  Calendar, CheckCircle, XCircle, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';

type DaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
};

type TenantSchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

type TenantFormData = {
  name: string;
  schedule: TenantSchedule;
  timezone: string;
  dialerConfig: {
    speed: number;
    minAgentsAvailable: number;
    autoDelete: boolean;
    sortOrder: 'oldest' | 'fewest';
    didDistribution: 'even' | 'local';
  };
};

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKST)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'UTC', label: 'UTC' },
];

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

export default function TenantSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tenantData, setTenantData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<TenantFormData>({
    defaultValues: {
      name: '',
      schedule: {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '09:00', end: '17:00' },
        sunday: { enabled: false, start: '09:00', end: '17:00' },
      },
      timezone: 'America/New_York',
      dialerConfig: {
        speed: 1,
        minAgentsAvailable: 1,
        autoDelete: false,
        sortOrder: 'oldest',
        didDistribution: 'even',
      },
    },
  });

  const watchedSchedule = watch('schedule');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      router.push('/settings');
      return;
    }

    fetchTenantData();
  }, [isAuthenticated, router, user]);

  const fetchTenantData = async () => {
    if (!user?.tenantId) return;

    setIsLoading(true);
    try {
      const tenantId = parseInt(user.tenantId, 10);
      const data = await getTenant(tenantId);
      setTenantData(data);

      // Populate form with existing data
      setValue('name', data.name || '');
      setValue('timezone', data.timezone || 'America/New_York');
      
      // Handle schedule data (might be in different formats)
      if (data.schedule) {
        DAYS.forEach(day => {
          const scheduleData = data.schedule[day.key];
          if (scheduleData) {
            setValue(`schedule.${day.key}`, {
              enabled: scheduleData.enabled || false,
              start: scheduleData.start || '09:00',
              end: scheduleData.end || '17:00',
            });
          }
        });
      }

      // Handle dialer config
      if (data.dialerConfig) {
        setValue('dialerConfig.speed', data.dialerConfig.speed || 1);
        setValue('dialerConfig.minAgentsAvailable', data.dialerConfig.minAgentsAvailable || 1);
        setValue('dialerConfig.autoDelete', data.dialerConfig.autoDelete || false);
        setValue('dialerConfig.sortOrder', data.dialerConfig.sortOrder || 'oldest');
        setValue('dialerConfig.didDistribution', data.dialerConfig.didDistribution || 'even');
      }

    } catch (error) {
      console.error('Error fetching tenant data:', error);
      toast.error('Failed to load tenant settings');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: TenantFormData) => {
    if (!user?.tenantId) return;

    setIsSaving(true);
    try {
      const tenantId = parseInt(user.tenantId, 10);
      
      const updateData = {
        name: data.name,
        schedule: data.schedule,
        timezone: data.timezone,
        dialerConfig: data.dialerConfig,
      };

      await updateTenant(tenantId, updateData);
      toast.success('Tenant settings updated successfully');
      
      // Refresh data to show updated values
      await fetchTenantData();
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      toast.error(error.message || 'Failed to update tenant settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDayEnabled = (day: keyof TenantSchedule, enabled: boolean) => {
    setValue(`schedule.${day}.enabled`, enabled, { shouldDirty: true });
  };

  const updateDayTime = (day: keyof TenantSchedule, field: 'start' | 'end', value: string) => {
    setValue(`schedule.${day}.${field}`, value, { shouldDirty: true });
  };

  const copyToAllDays = (sourceDay: keyof TenantSchedule) => {
    const sourceSchedule = watchedSchedule[sourceDay];
    DAYS.forEach(day => {
      if (day.key !== sourceDay) {
        setValue(`schedule.${day.key}`, sourceSchedule, { shouldDirty: true });
      }
    });
    toast.success(`Copied ${sourceDay} schedule to all days`);
  };

  const setBusinessHours = () => {
    const businessSchedule = { enabled: true, start: '09:00', end: '17:00' };
    const weekendSchedule = { enabled: false, start: '09:00', end: '17:00' };

    setValue('schedule.monday', businessSchedule, { shouldDirty: true });
    setValue('schedule.tuesday', businessSchedule, { shouldDirty: true });
    setValue('schedule.wednesday', businessSchedule, { shouldDirty: true });
    setValue('schedule.thursday', businessSchedule, { shouldDirty: true });
    setValue('schedule.friday', businessSchedule, { shouldDirty: true });
    setValue('schedule.saturday', weekendSchedule, { shouldDirty: true });
    setValue('schedule.sunday', weekendSchedule, { shouldDirty: true });
    
    toast.success('Set standard business hours (9 AM - 5 PM, weekdays only)');
  };

  const set24Hours = () => {
    const alwaysOpen = { enabled: true, start: '00:00', end: '23:59' };
    DAYS.forEach(day => {
      setValue(`schedule.${day.key}`, alwaysOpen, { shouldDirty: true });
    });
    toast.success('Set 24/7 availability');
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tenant settings...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Settings
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tenant Settings</h1>
                <p className="text-gray-600 mt-1">Manage tenant-wide configuration and business hours</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isDirty && (
                <span className="text-amber-600 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Unsaved changes
                </span>
              )}
              <Button 
                onClick={handleSubmit(onSubmit)}
                disabled={isSaving || !isDirty}
                className="flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="schedule">Business Hours</TabsTrigger>
                <TabsTrigger value="dialer">Dialer Settings</TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building className="w-5 h-5" />
                      <span>General Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Tenant Name</Label>
                      <Input
                        id="name"
                        {...register('name', { required: 'Tenant name is required' })}
                        placeholder="Enter tenant name"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        {...register('timezone')}
                        className="w-full p-2 border rounded-md"
                      >
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Business Hours */}
              <TabsContent value="schedule">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Business Hours</span>
                    </CardTitle>
                    <div className="flex space-x-2 mt-4">
                      <Button type="button" variant="outline" size="sm" onClick={setBusinessHours}>
                        Standard Hours (9-5, M-F)
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={set24Hours}>
                        24/7 Availability
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {DAYS.map((day) => {
                      const daySchedule = watchedSchedule[day.key];
                      return (
                        <div key={day.key} className="flex items-center space-x-4 p-3 border rounded-lg">
                          <div className="w-24">
                            <span className="font-medium capitalize">{day.label}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={daySchedule.enabled}
                              onCheckedChange={(checked) => toggleDayEnabled(day.key, checked)}
                            />
                            <span className="text-sm text-gray-600">
                              {daySchedule.enabled ? 'Open' : 'Closed'}
                            </span>
                          </div>

                          {daySchedule.enabled && (
                            <>
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm">From:</Label>
                                <Input
                                  type="time"
                                  value={daySchedule.start}
                                  onChange={(e) => updateDayTime(day.key, 'start', e.target.value)}
                                  className="w-32"
                                />
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm">To:</Label>
                                <Input
                                  type="time"
                                  value={daySchedule.end}
                                  onChange={(e) => updateDayTime(day.key, 'end', e.target.value)}
                                  className="w-32"
                                />
                              </div>
                            </>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToAllDays(day.key)}
                            title={`Copy ${day.label} schedule to all days`}
                          >
                            Copy to All
                          </Button>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Dialer Settings */}
              <TabsContent value="dialer">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5" />
                      <span>Dialer Configuration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="speed">Dialer Speed</Label>
                        <Input
                          id="speed"
                          type="number"
                          min="1"
                          max="10"
                          {...register('dialerConfig.speed', { 
                            valueAsNumber: true,
                            min: 1,
                            max: 10 
                          })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="minAgents">Min Agents Available</Label>
                        <Input
                          id="minAgents"
                          type="number"
                          min="1"
                          {...register('dialerConfig.minAgentsAvailable', { 
                            valueAsNumber: true,
                            min: 1 
                          })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sortOrder">Sort Order</Label>
                        <select
                          id="sortOrder"
                          {...register('dialerConfig.sortOrder')}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="oldest">Oldest First</option>
                          <option value="fewest">Fewest Attempts First</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="didDistribution">DID Distribution</Label>
                        <select
                          id="didDistribution"
                          {...register('dialerConfig.didDistribution')}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="even">Even Distribution</option>
                          <option value="local">Local Area Preference</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        {...register('dialerConfig.autoDelete')}
                      />
                      <Label>Auto-delete completed leads</Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 