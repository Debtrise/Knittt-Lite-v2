'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { updateTenantSettings, getTenant, updateTenant } from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';
import api from '@/app/utils/api';
import { recordings, freepbx, users, system, sms, email, dashboard, optisigns, tracers } from '@/app/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useToast } from '@/app/components/ui/use-toast';
import Link from 'next/link';
import { 
  Users, Shield, Settings, Database, Key, Lock,
  UserCircle, Mail, Phone, MessageSquare, AlertCircle,
  CheckCircle, XCircle, Clock, Activity, RefreshCw,
  Server, Mic, Search, Cog
} from 'lucide-react';

type SystemStats = {
  totalUsers: number;
  adminUsers: number;
  agentUsers: number;
  activeSessions: number;
  totalLeads: number;
  totalCalls: number;
  totalSMS: number;
  systemHealth: 'healthy' | 'warning' | 'error';
};

type ServiceStatus = {
  sms: boolean;
  email: boolean;
  recordings: boolean;
  optisigns: boolean;
  tracers: boolean;
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
  freepbxConfig?: {
    serverUrl: string;
    username: string;
    password: string;
    isActive: boolean;
    autoUpload: boolean;
  };
  timezone: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    adminUsers: 0,
    agentUsers: 0,
    activeSessions: 0,
    totalLeads: 0,
    totalCalls: 0,
    totalSMS: 0,
    systemHealth: 'healthy'
  });
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    sms: false,
    email: false,
    recordings: false,
    optisigns: false,
    tracers: false
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchSystemData();
  }, [isAuthenticated, router, user]);

  const fetchSystemData = async () => {
    setIsLoading(true);
    try {
      // Fetch system statistics and user data in parallel
      const promises = [];

      // Always fetch basic stats
      promises.push(fetchBasicStats());

      // Admin-only data
      if (user?.role === 'admin') {
        promises.push(fetchUserStats());
        promises.push(fetchServiceStatus());
      }

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error fetching system data:', error);
      toast.error('Failed to load system information');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBasicStats = async () => {
    try {
      // Get today's stats
      const todayStats = await dashboard.getTodayStats();
      console.log('Today stats response:', todayStats);
      
      if (todayStats.data) {
        // Handle different possible response structures
        const statsData = todayStats.data;
        console.log('Stats data:', statsData);
        
        // Extract values safely, handling both direct values and nested objects
        const totalCalls = typeof statsData.calls === 'object' 
          ? (statsData.calls.totalCalls || statsData.calls.total || 0)
          : (Number(statsData.calls) || 0);
        
        const totalSMS = typeof statsData.sms === 'object'
          ? (statsData.sms.totalSMS || statsData.sms.total || 0)
          : (Number(statsData.sms) || 0);
        
        const totalLeads = typeof statsData.leads === 'object'
          ? (statsData.leads.totalLeads || statsData.leads.total || 0)
          : (Number(statsData.leads) || 0);

        console.log('Extracted values:', { totalCalls, totalSMS, totalLeads });

        setSystemStats(prev => ({
          ...prev,
          totalCalls,
          totalSMS,
          totalLeads
        }));
      }
    } catch (error) {
      console.error('Error fetching basic stats:', error);
      // Set fallback values if API fails
      setSystemStats(prev => ({
        ...prev,
        totalCalls: 0,
        totalSMS: 0,
        totalLeads: 0
      }));
    }
  };

  const fetchUserStats = async () => {
    try {
      // Get user list to calculate statistics
      const userList = await users.list({ limit: 100 });
      console.log('User list response:', userList);
      
      if (userList.data) {
        // Handle different possible response structures
        const allUsers = Array.isArray(userList.data.users) 
          ? userList.data.users 
          : Array.isArray(userList.data) 
            ? userList.data 
            : [];
            
        console.log('All users:', allUsers);
        
        const adminCount = allUsers.filter(u => u && u.role === 'admin').length;
        const agentCount = allUsers.filter(u => u && u.role === 'agent').length;

        const userStats = {
          totalUsers: allUsers.length,
          adminUsers: adminCount,
          agentUsers: agentCount,
          activeSessions: Math.floor(allUsers.length * 0.6) // Estimate active sessions
        };
        
        console.log('User stats:', userStats);

        setSystemStats(prev => ({
          ...prev,
          ...userStats
        }));

        // Set recent users (last 5)
        setRecentUsers(allUsers.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Set fallback values if API fails
      setSystemStats(prev => ({
        ...prev,
        totalUsers: 0,
        adminUsers: 0,
        agentUsers: 0,
        activeSessions: 0
      }));
    }
  };

  const fetchServiceStatus = async () => {
    const statusChecks = {
      sms: () => sms.getConfig(),
      email: () => email.getConfig(),
      recordings: () => recordings.getConfig(),
      optisigns: () => optisigns.getConfig(),
      tracers: () => tracers.getServiceStatus()
    };

    const newStatus = { ...serviceStatus };

    for (const [service, checkFn] of Object.entries(statusChecks)) {
      try {
        await checkFn();
        newStatus[service] = true;
      } catch (error) {
        newStatus[service] = false;
      }
    }

    setServiceStatus(newStatus);

    // Determine overall system health
    const healthyServices = Object.values(newStatus).filter(Boolean).length;
    const totalServices = Object.keys(newStatus).length;
    
    let health: 'healthy' | 'warning' | 'error' = 'healthy';
    if (healthyServices < totalServices * 0.5) {
      health = 'error';
    } else if (healthyServices < totalServices * 0.8) {
      health = 'warning';
    }

    setSystemStats(prev => ({ ...prev, systemHealth: health }));
  };

  const refreshSystemData = async () => {
    setIsRefreshing(true);
    try {
      await fetchSystemData();
      toast.success('System data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing system data:', error);
      toast.error('Failed to refresh system data');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="py-6 text-center text-gray-500">
          Please log in to access settings.
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg text-gray-700">Loading system data...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const settingsSections = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and access',
      icon: <Users className="w-8 h-8 text-blue-600" />,
      items: [
        {
          name: 'Users',
          href: '/settings/users',
          description: 'Create and manage user accounts',
          adminOnly: true,
          status: systemStats.totalUsers > 0 ? 'active' : 'inactive'
        },
        {
          name: 'Permissions',
          href: '/settings/users/permissions',
          description: 'Manage detailed user permissions',
          adminOnly: true,
          status: 'active'
        },
        {
          name: 'Profile',
          href: '/settings/profile',
          description: 'Edit your personal profile',
          status: 'active'
        }
      ]
    },
    {
      title: 'Communication Services',
      description: 'Configure messaging and communication',
      icon: <MessageSquare className="w-8 h-8 text-green-600" />,
      items: [
        {
          name: 'SMS Providers',
          href: '/settings/sms-providers',
          description: 'Configure Twilio and Meera SMS',
          status: serviceStatus.sms ? 'active' : 'inactive'
        },
        {
          name: 'Email & Mailgun',
          href: '/config',
          description: 'Configure email service providers',
          status: serviceStatus.email ? 'active' : 'inactive'
        },
        {
          name: 'Transfer Groups',
          href: '/settings/transfer-groups',
          description: 'Manage call transfer groups',
          status: 'active'
        }
      ]
    },
    {
      title: 'Content & Media',
      description: 'Manage recordings and digital content',
      icon: <Database className="w-8 h-8 text-purple-600" />,
      items: [
        {
          name: 'Recordings',
          href: '/recordings',
          description: 'Manage TTS and audio recordings',
          status: serviceStatus.recordings ? 'active' : 'inactive'
        },
        {
          name: 'Content Creator',
          href: '/content-creator',
          description: 'Create digital signage content',
          status: 'active'
        },
        {
          name: 'OptiSigns',
          href: '/optisigns',
          description: 'Digital signage integration',
          status: serviceStatus.optisigns ? 'active' : 'inactive'
        }
      ]
    },
    {
      title: 'System Configuration',
      description: 'Core system and integration settings',
      icon: <Settings className="w-8 h-8 text-orange-600" />,
      items: [
        {
          name: 'Tenant Settings',
          href: '/settings/tenant',
          description: 'Configure tenant-wide settings',
          adminOnly: true,
          status: 'active'
        },
        {
          name: 'API Configuration',
          href: '/config',
          description: 'Configure API endpoints and keys',
          adminOnly: true,
          status: 'active'
        },
        {
          name: 'Tracers API',
          href: '/settings/tracers',
          description: 'Configure lead enrichment service',
          adminOnly: true,
          status: serviceStatus.tracers ? 'active' : 'inactive'
        },
        {
          name: 'PBX Settings',
          href: '/settings/pbx',
          description: 'Configure FreePBX integration',
          adminOnly: true,
          status: 'active'
        },
        {
          name: 'Context Management',
          href: '/settings/contexts',
          description: 'Manage AMI contexts for call routing',
          adminOnly: true,
          status: 'active'
        },
        {
          name: 'Eleven Labs',
          href: '/settings/elevenlabs',
          description: 'Configure TTS voice settings',
          adminOnly: true,
          status: serviceStatus.recordings ? 'active' : 'inactive'
        },
        {
          name: 'Webhooks',
          href: '/webhooks',
          description: 'Manage webhook integrations',
          status: 'active'
        }
      ]
    },
    {
      title: 'Security & Access',
      description: 'Security and access control settings',
      icon: <Shield className="w-8 h-8 text-red-600" />,
      items: [
        {
          name: 'Role Management',
          href: '/settings/users/permissions',
          description: 'Manage user roles and permissions',
          adminOnly: true,
          status: 'active'
        },
        {
          name: 'API Keys',
          href: '/settings/api-keys',
          description: 'Manage API access keys',
          adminOnly: true,
          comingSoon: true,
          status: 'inactive'
        },
        {
          name: 'Audit Logs',
          href: '/settings/audit-logs',
          description: 'View system audit logs',
          adminOnly: true,
          comingSoon: true,
          status: 'inactive'
        }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="py-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="mt-2 text-gray-600">
                Manage your account settings and system configuration
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getHealthIcon(systemStats.systemHealth)}
                <span className="text-sm font-medium text-gray-700">
                  System {systemStats.systemHealth}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshSystemData}
                disabled={isRefreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* System Health Banner */}
        {systemStats.systemHealth !== 'healthy' && (
          <div className={`mb-6 p-4 rounded-lg border ${
            systemStats.systemHealth === 'error' 
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center">
              {getHealthIcon(systemStats.systemHealth)}
              <div className="ml-3">
                <h3 className="text-sm font-medium">
                  {systemStats.systemHealth === 'error' ? 'System Issues Detected' : 'System Warnings'}
                </h3>
                <p className="text-sm mt-1">
                  Some services may not be functioning properly. Check individual service status below.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <div className="flex items-center mb-4">
                {section.icon}
                <div className="ml-3">
                  <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items
                  .filter(item => !item.adminOnly || user?.role === 'admin')
                  .map((item) => (
                    <Card key={item.name} className="p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {item.name}
                              {item.adminOnly && (
                                <Shield className="inline-block w-4 h-4 ml-2 text-amber-500" />
                              )}
                            </h3>
                            {item.status && getStatusIcon(item.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                          
                          {item.comingSoon ? (
                            <Button disabled variant="outline" className="w-full">
                              Coming Soon
                            </Button>
                          ) : (
                            <Link href={item.href}>
                              <Button variant="outline" className="w-full">
                                Configure
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* System Overview for Admins */}
        {user?.role === 'admin' && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{Number(systemStats.totalUsers) || 0}</p>
                    </div>
                  </div>
              </Card>
              
              <Card className="p-4">
                                  <div className="flex items-center">
                    <Shield className="w-8 h-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Admin Users</p>
                      <p className="text-2xl font-bold text-gray-900">{Number(systemStats.adminUsers) || 0}</p>
                    </div>
                  </div>
              </Card>
              
              <Card className="p-4">
                                  <div className="flex items-center">
                    <UserCircle className="w-8 h-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Agent Users</p>
                      <p className="text-2xl font-bold text-gray-900">{Number(systemStats.agentUsers) || 0}</p>
                    </div>
                  </div>
              </Card>
              
              <Card className="p-4">
                                  <div className="flex items-center">
                    <Activity className="w-8 h-8 text-orange-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Today's Calls</p>
                      <p className="text-2xl font-bold text-gray-900">{Number(systemStats.totalCalls) || 0}</p>
                    </div>
                  </div>
              </Card>
            </div>

            {/* Service Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Status</h3>
                <div className="space-y-3">
                  {Object.entries(serviceStatus).map(([service, status]) => (
                    <div key={service} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {service === 'optisigns' ? 'OptiSigns' : service}
                      </span>
                      <div className="flex items-center">
                        {status ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-sm text-green-600">Online</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-500 mr-2" />
                            <span className="text-sm text-red-600">Offline</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Leads Processed</span>
                    <span className="text-sm font-bold text-gray-900">{Number(systemStats.totalLeads) || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Calls Made</span>
                    <span className="text-sm font-bold text-gray-900">{Number(systemStats.totalCalls) || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">SMS Sent</span>
                    <span className="text-sm font-bold text-gray-900">{Number(systemStats.totalSMS) || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Active Sessions</span>
                    <span className="text-sm font-bold text-gray-900">{Number(systemStats.activeSessions) || 0}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* User Profile Quick Access */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserCircle className="w-12 h-12 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Your Profile</h3>
                <p className="text-sm text-gray-600">
                  Logged in as <strong>{user?.username}</strong> • {user?.role} role
                </p>
              </div>
            </div>
            <Link href="/settings/profile">
              <Button variant="default">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/leads">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <Database className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Manage Leads</h4>
                    <p className="text-sm text-gray-600">View and manage your leads</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/journeys">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">Journey Builder</h4>
                    <p className="text-sm text-gray-600">Create automated workflows</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/reports">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-purple-600" />
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">View Reports</h4>
                    <p className="text-sm text-gray-600">Analytics and reporting</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 