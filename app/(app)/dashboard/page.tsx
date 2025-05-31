'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PhoneOutgoing, Users, Phone, Clock, Sliders, Upload, Route } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

type AgentStatus = {
  ingroup: string;
  agents_logged_in: number;
  agents_waiting: number;
  total_calls: number;
  calls_waiting: number;
  brand: string;
  source: string;
};

type DailyReport = {
  date: string;
  totalCalls: number;
  answeredCalls: number;
  transfers: number;
  callsOver1Min: number;
  callsOver5Min: number;
  callsOver15Min: number;
  connectionRate: string;
  transferRate: string;
};

type TenantConfig = {
  dialerConfig: {
    speed: number;
    minAgentsAvailable: number;
    autoDelete: boolean;
    sortOrder: 'oldest' | 'fewest';
    didDistribution: 'even' | 'local';
  };
  apiConfig: {
    url: string;
    ingroup: string;
    ingroups: string;
    user?: string;
    password?: string;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [agentStatus, setAgentStatus] = useState<AgentStatus[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [dialerSpeed, setDialerSpeed] = useState<number>(0);
  const [updatingSpeed, setUpdatingSpeed] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // New state for CSV upload
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [leadSource, setLeadSource] = useState('');
  const [hasHeaders, setHasHeaders] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import journey statistics
  const [stats, setStats] = useState({
    leads: { total: 0, new: 0, contacted: 0, converted: 0 },
    calls: { total: 0, connected: 0, failed: 0 },
    sms: { campaigns: 0, sent: 0, responses: 0 },
    journeys: { active: 0, totalLeads: 0, completed: 0 }
  });

  const fetchAgentStatus = async () => {
    console.log('Fetching agent status for group:', currentGroup);
    if (!currentGroup) {
      console.log('No group configured');
      return;
    }

    setIsRefreshing(true);
    try {
      console.log('Making API call with group:', currentGroup);
      const response = await api.system.getAgentStatus({
        url: tenantConfig?.apiConfig?.url || '',
        ingroup: currentGroup,
        user: tenantConfig?.apiConfig?.user || user?.username || '',
        pass: tenantConfig?.apiConfig?.password || ''
      });
      console.log('API response:', response.data);
      setAgentStatus(Array.isArray(response.data) ? response.data : []);
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
      try {
        // Fetch tenant config first
        if (user?.tenantId) {
          const response = await api.tenants.get(user.tenantId);
          const tenantData = response.data;
          console.log('Retrieved tenant data:', tenantData);
          setTenantConfig(tenantData);
          setDialerSpeed(tenantData.dialerConfig?.speed || 1);
          
          // Set the current group from tenant config - try ingroup first, then ingroups
          const group = tenantData.apiConfig?.ingroup || tenantData.apiConfig?.ingroups || 'TaxSales';
          if (group) {
            console.log('Setting current group to:', group);
            setCurrentGroup(group);
            localStorage.setItem('currentGroup', group);
            
            // Only fetch agent status and daily report after we have the group
            try {
              console.log('Fetching agent status for group:', group);
              const statusResponse = await api.system.getAgentStatus({
                url: tenantData.apiConfig?.url || '',
                ingroup: group,
                user: tenantData.apiConfig?.user || user?.username || '',
                pass: tenantData.apiConfig?.password || ''
              });
              console.log('Agent status response:', statusResponse.data);
              setAgentStatus(Array.isArray(statusResponse.data) ? statusResponse.data : []);
            } catch (statusError) {
              console.error('Error fetching agent status:', statusError);
              toast.error('Failed to fetch agent status');
              setAgentStatus([]);
            }
            
            try {
              const reportResponse = await api.system.getDailyReport(new Date().toISOString().split('T')[0]);
              setDailyReport(reportResponse.data);
            } catch (reportError) {
              console.error('Error fetching daily report:', reportError);
              toast.error('Failed to fetch daily report');
            }
          } else {
            console.warn('No group found in tenant configuration');
            toast('⚠️ No agent group configured. Please update in Settings.');
          }
        }

        // Fetch dashboard stats
        try {
          const statsResponse = await api.dashboard.getStats();
          const dashboardStats = statsResponse.data;
          setStats({
            leads: {
              total: dashboardStats.todaysLeads || 0,
              new: 0, // These would need to be calculated from other endpoints
              contacted: 0,
              converted: 0
            },
            calls: {
              total: dashboardStats.todaysCalls || 0,
              connected: 0, // These would need to be calculated from other endpoints
              failed: 0
            },
            sms: {
              campaigns: 0, // These would need to be calculated from other endpoints
              sent: dashboardStats.todaysSms || 0,
              responses: 0
            },
            journeys: {
              active: dashboardStats.activeJourneys || 0,
              totalLeads: 0, // These would need to be calculated from other endpoints
              completed: 0
            }
          });
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
        setAgentStatus([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Refresh agent status every 5 seconds, but only if we have a group
    const interval = setInterval(() => {
      if (currentGroup) {
        fetchAgentStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, router, user]);

  // Add a refresh button handler
  const handleRefresh = () => {
    fetchAgentStatus();
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDialerSpeed(parseInt(e.target.value, 10));
  };

  const updateDialerSpeed = async () => {
    if (!user?.tenantId || dialerSpeed < 1 || !tenantConfig) return;
    
    setUpdatingSpeed(true);
    try {
      const updatedConfig = {
        ...tenantConfig,
        dialerConfig: {
          ...tenantConfig.dialerConfig,
          speed: dialerSpeed
        }
      };
      
      await api.tenants.update(user.tenantId, updatedConfig);
      toast.success('Dialer speed updated successfully');
      setTenantConfig(updatedConfig);
    } catch (error) {
      console.error('Error updating dialer speed:', error);
      toast.error('Failed to update dialer speed');
    } finally {
      setUpdatingSpeed(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleUploadLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    if (!leadSource) {
      toast.error('Please enter a lead source');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Read file content as text
      const fileContent = await csvFile.text();
      
      // Prepare upload options
      const options = {
        hasHeaders,
        source: leadSource,
        // Format expected: phone,first_name,last_name,address,city,state,zip
        format: 'phone,first_name,last_name,address,city,state,zip',
      };
      
      const response = await api.leads.upload(fileContent, options);
      toast.success(response.data.message || 'Leads uploaded successfully');
      setShowUploadForm(false);
      setCsvFile(null);
      setLeadSource('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading leads:', error);
      toast.error(error.response?.data?.error || 'Failed to upload leads');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <Button
            onClick={handleRefresh}
            variant="default"
            isLoading={isRefreshing}
          >
            Refresh Status
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        ) : (
          <div className="mt-6">
            {/* Admin controls section */}
            {user?.role === 'admin' && (
              <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Dialer Speed Control Card */}
                {tenantConfig && (
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-brand rounded-md p-3">
                            <Sliders className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-5">
                            <h3 className="text-lg font-medium text-gray-900">Dialer Speed Control</h3>
                            <p className="text-sm text-gray-500">Adjust the number of calls per minute</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 w-64">
                          <Input
                            id="dialerSpeed"
                            type="number"
                            value={dialerSpeed}
                            onChange={handleSpeedChange}
                            min={1}
                            className="text-center"
                          />
                          <button
                            onClick={updateDialerSpeed}
                            disabled={updatingSpeed || dialerSpeed === tenantConfig.dialerConfig.speed}
                            className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                              ${updatingSpeed ? 'bg-gray-400' : 'bg-brand hover:bg-brand'} 
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand`}
                          >
                            {updatingSpeed ? 'Updating...' : 'Update'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* CSV Upload Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-brand rounded-md p-3">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-5">
                          <h3 className="text-lg font-medium text-gray-900">Upload Leads</h3>
                          <p className="text-sm text-gray-500">Import leads from CSV file</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowUploadForm(!showUploadForm)}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand hover:bg-brand focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
                      >
                        {showUploadForm ? 'Cancel' : 'Upload CSV'}
                      </button>
                    </div>
                    
                    {showUploadForm && (
                      <div className="mt-5">
                        <form onSubmit={handleUploadLeads} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".csv"
                              onChange={handleFileChange}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand file:bg-opacity-10 file:text-brand hover:file:bg-brand hover:file:bg-opacity-20"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              File must be CSV format with the following columns:
                            </p>
                            <pre className="text-xs bg-gray-50 p-2 mt-1 rounded">phone,first_name,last_name,address,city,state,zip</pre>
                          </div>
                          
                          <div>
                            <Input
                              id="leadSource"
                              type="text"
                              label="Lead Source"
                              placeholder="e.g., Website, Campaign Name"
                              value={leadSource}
                              onChange={(e) => setLeadSource(e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              id="hasHeaders"
                              type="checkbox"
                              checked={hasHeaders}
                              onChange={(e) => setHasHeaders(e.target.checked)}
                              className="h-4 w-4 text-brand focus:ring-brand border-gray-300 rounded"
                            />
                            <label htmlFor="hasHeaders" className="ml-2 block text-sm text-gray-700">
                              CSV has header row
                            </label>
                          </div>
                          
                          <div className="flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => setShowUploadForm(false)}
                              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isUploading || !csvFile || !leadSource}
                              className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                                ${isUploading || !csvFile || !leadSource ? 'bg-gray-400' : 'bg-brand hover:bg-brand'} 
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand`}
                            >
                              {isUploading ? 'Uploading...' : 'Upload'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <h2 className="text-lg font-medium text-gray-900 mb-4">Real-time Agent Status</h2>
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-brand rounded-md p-3">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Agents Logged In</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            {Array.isArray(agentStatus) ? agentStatus.reduce((sum, status) => sum + status.agents_logged_in, 0) : 0}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-brand rounded-md p-3">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Agents Waiting</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            {Array.isArray(agentStatus) ? agentStatus.reduce((sum, status) => sum + status.agents_waiting, 0) : 0}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-brand rounded-md p-3">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Calls</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            {Array.isArray(agentStatus) ? agentStatus.reduce((sum, status) => sum + status.total_calls, 0) : 0}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-brand rounded-md p-3">
                      <PhoneOutgoing className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Calls Waiting</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            {Array.isArray(agentStatus) ? agentStatus.reduce((sum, status) => sum + status.calls_waiting, 0) : 0}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {dailyReport && (
              <>
                <h2 className="text-lg font-medium text-gray-900 mt-8 mb-4">Today&apos;s Call Report</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Call Statistics</h3>
                        <dl className="mt-5 grid grid-cols-1 gap-5">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Total Calls</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{dailyReport.totalCalls}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Answered Calls</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{dailyReport.answeredCalls}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Call Duration</h3>
                        <dl className="mt-5 grid grid-cols-1 gap-5">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Calls Over 1 Min</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{dailyReport.callsOver1Min}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Calls Over 5 Min</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{dailyReport.callsOver5Min}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Transfer Data</h3>
                        <dl className="mt-5 grid grid-cols-1 gap-5">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Transfers</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{dailyReport.transfers}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Transfer Rate</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{dailyReport.transferRate}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Performance</h3>
                        <dl className="mt-5 grid grid-cols-1 gap-5">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Connection Rate</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{dailyReport.connectionRate}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Calls Over 15 Min</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">{dailyReport.callsOver15Min}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {agentStatus.length > 0 && (
              <>
                <h2 className="text-lg font-medium text-gray-900 mt-8 mb-4">Agent Status By Group</h2>
                <div className="flex flex-col">
                  <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ingroup
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Agents Logged In
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Agents Waiting
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Calls
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Calls Waiting
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {agentStatus.map((status, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {status.ingroup}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {status.agents_logged_in}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {status.agents_waiting}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {status.total_calls}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {status.calls_waiting}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Journey Stats Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Journeys</h3>
                <Link href="/journeys">
                  <Button variant="ghost" size="icon">
                    <Route className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{stats.journeys.active}</p>
                  <p className="text-sm text-gray-500">Active Journeys</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.journeys.totalLeads}</p>
                  <p className="text-sm text-gray-500">Active Leads</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.journeys.completed}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/journeys">
                  <Button variant="outline" className="w-full">
                    View Journeys
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 