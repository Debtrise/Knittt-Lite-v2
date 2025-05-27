'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Phone, List, Clock, User, PhoneIncoming, PhoneForwarded, PhoneOff, PhoneCall, Settings, Play, Save, Plus, Edit, Trash2, Eye } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';
import { checkDialplanCapabilities, getProjects, createProject, getProjectDetails, generateDialplan } from '@/app/utils/dialplanApi';

type CallFormData = {
  to: string;
  transfer_number: string;
  from: string;
  trunk?: string;
  context?: string;
  leadId?: number;
};

type DID = {
  id: number;
  phoneNumber: string;
  description: string;
  isActive: boolean;
};

type Lead = {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
  callDurations?: number[];
};

type Call = {
  id: number;
  tenantId: string;
  leadId: number;
  from: string;
  to: string;
  transferNumber: string;
  startTime: string;
  endTime?: string;
  duration: number;
  status: string;
  Lead?: Lead;
};

type CallTemplate = {
  id: number;
  name: string;
  description: string;
  type: 'script' | 'voicemail';
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type DialplanProject = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  lastDeployed?: string;
  createdAt: string;
  updatedAt: string;
};

type DialplanCapabilities = {
  message: string;
  capabilities: {
    nodeTypes: number;
    generator: boolean;
    validator: boolean;
    deployment: boolean;
  };
};

export default function CallsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [dids, setDids] = useState<DID[]>([]);
  const [currentCallId, setCurrentCallId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'make-call' | 'call-list' | 'dialplan'>('call-list');
  const [calls, setCalls] = useState<Call[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [loadingCall, setLoadingCall] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [callLimit] = useState(10);
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);

  // Dialplan state
  const [dialplanTab, setDialplanTab] = useState<'templates' | 'projects' | 'capabilities'>('templates');
  const [callTemplates, setCallTemplates] = useState<CallTemplate[]>([]);
  const [dialplanProjects, setDialplanProjects] = useState<DialplanProject[]>([]);
  const [dialplanCapabilities, setDialplanCapabilities] = useState<DialplanCapabilities | null>(null);
  const [loadingDialplan, setLoadingDialplan] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CallTemplate | null>(null);
  const [selectedProject, setSelectedProject] = useState<DialplanProject | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string>('');
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'script' as 'script' | 'voicemail',
    content: ''
  });
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CallFormData>();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchDIDs = async () => {
      try {
        const response = await api.dids.list({ page: 1, limit: 100, isActive: true });
        setDids(response.data.dids);
      } catch (error) {
        console.error('Error fetching DIDs:', error);
        toast.error('Failed to load DIDs');
      }
    };

    fetchDIDs();
    fetchCalls();
  }, [isAuthenticated, router, currentPage, statusFilter]);

  // Load dialplan data when dialplan tab is active
  useEffect(() => {
    if (activeTab === 'dialplan') {
      loadDialplanData();
    }
  }, [activeTab, dialplanTab]);

  const loadDialplanData = async () => {
    setLoadingDialplan(true);
    try {
      // Load based on current dialplan tab
      if (dialplanTab === 'templates') {
        await loadCallTemplates();
      } else if (dialplanTab === 'projects') {
        await loadDialplanProjects();
      } else if (dialplanTab === 'capabilities') {
        await loadDialplanCapabilities();
      }
    } catch (error) {
      console.error('Error loading dialplan data:', error);
      toast.error('Failed to load dialplan data');
    } finally {
      setLoadingDialplan(false);
    }
  };

  const loadCallTemplates = async () => {
    try {
      // Load script templates
      const scriptResponse = await api.templates.list({ 
        type: 'script', 
        isActive: true, 
        limit: 100 
      });
      
      // Load voicemail templates
      const voicemailResponse = await api.templates.list({ 
        type: 'voicemail', 
        isActive: true, 
        limit: 100 
      });
      
      const scriptTemplates = scriptResponse.data?.templates || [];
      const voicemailTemplates = voicemailResponse.data?.templates || [];
      
      const allTemplates = [
        ...scriptTemplates.map((t: any) => ({ ...t, type: 'script' })),
        ...voicemailTemplates.map((t: any) => ({ ...t, type: 'voicemail' }))
      ];
      
      setCallTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading call templates:', error);
      throw error;
    }
  };

  const loadDialplanProjects = async () => {
    try {
      const projects = await getProjects();
      setDialplanProjects(Array.isArray(projects) ? projects : []);
    } catch (error) {
      console.error('Error loading dialplan projects:', error);
      // Set empty array on error to prevent UI issues
      setDialplanProjects([]);
    }
  };

  const loadDialplanCapabilities = async () => {
    try {
      const capabilities = await checkDialplanCapabilities();
      setDialplanCapabilities(capabilities);
    } catch (error) {
      console.error('Error loading dialplan capabilities:', error);
      throw error;
    }
  };

  const fetchCalls = async () => {
    setIsLoading(true);
    try {
      const response = await api.calls.list({ 
        page: currentPage, 
        limit: callLimit,
        ...(statusFilter ? { status: statusFilter } : {})
      });
      setCalls(response.data.calls);
      setTotalPages(response.data.totalPages);
      
      // Extract unique statuses from the data for filter options
      if (!statusFilter) {
        const statuses = Array.from(new Set(response.data.calls.map((call: Call) => call.status))) as string[];
        setUniqueStatuses(statuses);
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
      toast.error('Failed to load calls');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCallDetails = async (callId: number) => {
    setLoadingCall(true);
    try {
      const response = await api.calls.get(callId.toString());
      setSelectedCall(response.data);
    } catch (error) {
      console.error('Error fetching call details:', error);
      toast.error('Failed to load call details');
    } finally {
      setLoadingCall(false);
    }
  };

  const handleUpdateStatus = async (callId: number, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await api.calls.updateStatus(callId.toString(), newStatus);
      toast.success(`Call status updated to ${newStatus}`);
      
      // Update the call in the UI
      if (selectedCall && selectedCall.id === callId) {
        setSelectedCall({
          ...selectedCall,
          status: newStatus
        });
      }
      
      // Refresh the call list
      fetchCalls();
    } catch (error: any) {
      console.error('Error updating call status:', error);
      toast.error(error.response?.data?.error || 'Failed to update call status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const onSubmit = async (data: CallFormData) => {
    setIsLoading(true);
    
    try {
      const callData = {
        to: data.to,
        from: data.from,
        transfer_number: data.transfer_number,
        leadId: data.leadId || 0, // Provide a default value if leadId is not specified
      };
      
      // Only add variables if we have trunk or context
      const variables: Record<string, string> = {};
      if (data.trunk) variables.trunk = data.trunk;
      if (data.context) variables.context = data.context;
      
      // Only add variables property if we have any variables
      if (Object.keys(variables).length > 0) {
        Object.assign(callData, { variables });
      }
      
      const response = await api.calls.make(callData);
      setCurrentCallId(response.data.callId);
      toast.success('Call initiated successfully');
      fetchCalls(); // Refresh call list after making a call
    } catch (error: any) {
      console.error('Call error:', error);
      toast.error(error.response?.data?.error || 'Failed to make call');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'initiated':
        return <PhoneCall className="w-5 h-5 text-blue-500" />;
      case 'answered':
        return <PhoneIncoming className="w-5 h-5 text-green-500" />;
      case 'transferred':
        return <PhoneForwarded className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <Phone className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <PhoneOff className="w-5 h-5 text-red-500" />;
      default:
        return <Phone className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoadingDialplan(true);
    try {
      await api.templates.create({
        name: newTemplate.name,
        description: newTemplate.description,
        type: newTemplate.type,
        categoryId: 1, // Default category
        content: newTemplate.content,
        isActive: true
      });

      toast.success('Template created successfully');
      setShowCreateTemplate(false);
      setNewTemplate({ name: '', description: '', type: 'script', content: '' });
      await loadCallTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setLoadingDialplan(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name) {
      toast.error('Please enter a project name');
      return;
    }

    setLoadingDialplan(true);
    try {
      await createProject({
        name: newProject.name,
        description: newProject.description
      });

      toast.success('Dialplan project created successfully');
      setShowCreateProject(false);
      setNewProject({ name: '', description: '' });
      await loadDialplanProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create dialplan project');
    } finally {
      setLoadingDialplan(false);
    }
  };

  const handlePreviewTemplate = async (template: CallTemplate) => {
    try {
      const response = await api.templates.renderPreview(template.id.toString(), {
        variables: {
          firstName: 'John',
          lastName: 'Doe',
          company: 'Example Company',
          phone: '+1234567890'
        }
      });
      
      setTemplatePreview(response.data?.content || template.content);
      setSelectedTemplate(template);
      setShowTemplatePreview(true);
    } catch (error) {
      console.error('Error previewing template:', error);
      setTemplatePreview(template.content);
      setSelectedTemplate(template);
      setShowTemplatePreview(true);
    }
  };

  const handleGenerateDialplan = async (project: DialplanProject) => {
    setLoadingDialplan(true);
    try {
      const result = await generateDialplan(project.id);
      toast.success('Dialplan generated successfully');
      console.log('Generated dialplan:', result);
      
      // You could show the generated dialplan in a modal or download it
      const blob = new Blob([result.dialplan || 'No dialplan content'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}-dialplan.conf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating dialplan:', error);
      toast.error('Failed to generate dialplan');
    } finally {
      setLoadingDialplan(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Call Management</h1>
          <div className="space-x-2">
            <Button
              type="button"
              variant={activeTab === 'call-list' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('call-list')}
            >
              <List className="w-4 h-4 mr-2" />
              Call List
            </Button>
            <Button
              type="button"
              variant={activeTab === 'make-call' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('make-call')}
            >
              <Phone className="w-4 h-4 mr-2" />
              Make Call
            </Button>
            <Button
              type="button"
              variant={activeTab === 'dialplan' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('dialplan')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Dialplan
            </Button>
          </div>
        </div>

        {activeTab === 'make-call' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                  To Number
                </label>
                <Input
                  id="to"
                  type="tel"
                  {...register('to', { required: 'Phone number is required' })}
                  className="mt-1"
                  placeholder="Enter phone number"
                />
                {errors.to && (
                  <p className="mt-1 text-sm text-red-500">{errors.to.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                  From Number
                </label>
                <select
                  id="from"
                  {...register('from', { required: 'From number is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a number</option>
                  {dids.map((did) => (
                    <option key={did.id} value={did.phoneNumber}>
                      {did.phoneNumber} - {did.description}
                    </option>
                  ))}
                </select>
                {errors.from && (
                  <p className="mt-1 text-sm text-red-500">{errors.from.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="transfer_number" className="block text-sm font-medium text-gray-700">
                  Transfer Number (Optional)
                </label>
                <Input
                  id="transfer_number"
                  type="tel"
                  {...register('transfer_number')}
                  className="mt-1"
                  placeholder="Enter transfer number"
                />
              </div>

              <div>
                <label htmlFor="leadId" className="block text-sm font-medium text-gray-700">
                  Lead ID (Optional)
                </label>
                <Input
                  id="leadId"
                  type="number"
                  {...register('leadId')}
                  className="mt-1"
                  placeholder="Enter lead ID"
                />
              </div>

              <div>
                <label htmlFor="trunk" className="block text-sm font-medium text-gray-700">
                  Trunk (Optional)
                </label>
                <Input
                  id="trunk"
                  type="text"
                  {...register('trunk')}
                  className="mt-1"
                  placeholder="Enter trunk"
                />
              </div>

              <div>
                <label htmlFor="context" className="block text-sm font-medium text-gray-700">
                  Context (Optional)
                </label>
                <Input
                  id="context"
                  type="text"
                  {...register('context')}
                  className="mt-1"
                  placeholder="Enter context"
                />
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Making Call...' : 'Make Call'}
                </Button>
              </div>
            </form>
          </div>
        ) : activeTab === 'call-list' ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Call List</h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    {uniqueStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={fetchCalls}
                    disabled={isLoading}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calls.map((call) => (
                    <tr key={call.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(call.status)}
                          <span className="ml-2 text-sm text-gray-900">
                            {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {call.from}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {call.to}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(call.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(call.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Button
                          type="button"
                          onClick={() => fetchCallDetails(call.id)}
                          disabled={loadingCall}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedCall && (
              <div className="p-4 border-t">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Call Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedCall.status.charAt(0).toUpperCase() + selectedCall.status.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDuration(selectedCall.duration)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="text-sm font-medium text-gray-900">{selectedCall.from}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <p className="text-sm font-medium text-gray-900">{selectedCall.to}</p>
                  </div>
                  {selectedCall.transferNumber && (
                    <div>
                      <p className="text-sm text-gray-500">Transfer Number</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCall.transferNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(selectedCall.startTime)}
                    </p>
                  </div>
                  {selectedCall.endTime && (
                    <div>
                      <p className="text-sm text-gray-500">End Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDateTime(selectedCall.endTime)}
                      </p>
                    </div>
                  )}
                </div>

                {selectedCall.status !== 'completed' && selectedCall.status !== 'failed' && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedCall.id, 'completed')}
                      disabled={isUpdatingStatus}
                    >
                      Mark as Completed
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="px-4 py-3 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Dialplan</h2>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={dialplanTab === 'templates' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setDialplanTab('templates')}
                  >
                    Call Templates
                  </Button>
                  <Button
                    type="button"
                    variant={dialplanTab === 'projects' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setDialplanTab('projects')}
                  >
                    Dialplan Projects
                  </Button>
                  <Button
                    type="button"
                    variant={dialplanTab === 'capabilities' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setDialplanTab('capabilities')}
                  >
                    Capabilities
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loadingDialplan ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-gray-500">Loading dialplan data...</div>
                </div>
              ) : dialplanTab === 'templates' ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Call Templates</h3>
                    <Button
                      onClick={() => setShowCreateTemplate(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Template
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {callTemplates.map((template) => (
                      <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            template.type === 'script' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {template.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {new Date(template.updatedAt).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreviewTemplate(template)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setNewTemplate({
                                  name: template.name,
                                  description: template.description,
                                  type: template.type,
                                  content: template.content
                                });
                                setShowCreateTemplate(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {callTemplates.length === 0 && (
                    <div className="text-center py-12">
                      <Phone className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No call templates</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating a new call template.</p>
                      <div className="mt-6">
                        <Button onClick={() => setShowCreateTemplate(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Template
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : dialplanTab === 'projects' ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Dialplan Projects</h3>
                    <Button
                      onClick={() => setShowCreateProject(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Project
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dialplanProjects.map((project) => (
                      <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            project.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {project.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {project.lastDeployed 
                              ? `Deployed: ${new Date(project.lastDeployed).toLocaleDateString()}`
                              : 'Never deployed'
                            }
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateDialplan(project)}
                              disabled={loadingDialplan}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dialplan/${project.id}`)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {dialplanProjects.length === 0 && (
                    <div className="text-center py-12">
                      <Settings className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No dialplan projects</h3>
                      <p className="mt-1 text-sm text-gray-500">Create a dialplan project to manage call flows.</p>
                      <div className="mt-6">
                        <Button onClick={() => setShowCreateProject(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Project
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Dialplan Capabilities</h3>
                  
                  {dialplanCapabilities ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">System Status</h4>
                        <p className="text-sm text-blue-700">{dialplanCapabilities.message}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Node Types</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {dialplanCapabilities.capabilities.nodeTypes}
                              </p>
                            </div>
                            <Settings className="h-8 w-8 text-blue-500" />
                          </div>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Generator</p>
                              <p className={`text-sm font-medium ${
                                dialplanCapabilities.capabilities.generator 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {dialplanCapabilities.capabilities.generator ? 'Available' : 'Unavailable'}
                              </p>
                            </div>
                            <Play className={`h-8 w-8 ${
                              dialplanCapabilities.capabilities.generator 
                                ? 'text-green-500' 
                                : 'text-red-500'
                            }`} />
                          </div>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Validator</p>
                              <p className={`text-sm font-medium ${
                                dialplanCapabilities.capabilities.validator 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {dialplanCapabilities.capabilities.validator ? 'Available' : 'Unavailable'}
                              </p>
                            </div>
                            <Eye className={`h-8 w-8 ${
                              dialplanCapabilities.capabilities.validator 
                                ? 'text-green-500' 
                                : 'text-red-500'
                            }`} />
                          </div>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Deployment</p>
                              <p className={`text-sm font-medium ${
                                dialplanCapabilities.capabilities.deployment 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {dialplanCapabilities.capabilities.deployment ? 'Available' : 'Unavailable'}
                              </p>
                            </div>
                            <Save className={`h-8 w-8 ${
                              dialplanCapabilities.capabilities.deployment 
                                ? 'text-green-500' 
                                : 'text-red-500'
                            }`} />
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Integration with Journey Builder</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Call templates created here can be used in the Journey Builder for automated call campaigns. 
                          Script templates provide agent guidance, while voicemail templates handle automated messages.
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push('/journeys')}
                          >
                            Go to Journey Builder
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push('/dialplan')}
                          >
                            Advanced Dialplan Builder
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Settings className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Loading capabilities...</h3>
                      <p className="mt-1 text-sm text-gray-500">Checking dialplan system status.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedTemplate ? 'Edit Template' : 'Create Call Template'}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateTemplate(false);
                  setSelectedTemplate(null);
                  setNewTemplate({ name: '', description: '', type: 'script', content: '' });
                }}
              >
                Cancel
              </Button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Enter template description"
                />
              </div>

              <div>
                <Label htmlFor="template-type">Template Type</Label>
                <Select
                  value={newTemplate.type}
                  onValueChange={(value: 'script' | 'voicemail') => 
                    setNewTemplate({ ...newTemplate, type: value })
                  }
                >
                  <SelectTrigger id="template-type">
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="script">Call Script</SelectItem>
                    <SelectItem value="voicemail">Voicemail Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="template-content">Template Content</Label>
                <Textarea
                  id="template-content"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder={
                    newTemplate.type === 'script' 
                      ? "Enter call script content. Use {{firstName}}, {{lastName}}, {{company}} for variables..."
                      : "Enter voicemail message. Use {{firstName}}, {{lastName}}, {{company}} for variables..."
                  }
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Available Variables</h4>
                <p className="text-xs text-blue-700">
                  {`{{firstName}}, {{lastName}}, {{email}}, {{phone}}, {{company}}, {{leadId}}`}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateTemplate(false);
                  setSelectedTemplate(null);
                  setNewTemplate({ name: '', description: '', type: 'script', content: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTemplate}
                disabled={loadingDialplan}
              >
                {loadingDialplan ? 'Saving...' : (selectedTemplate ? 'Update Template' : 'Create Template')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Create Dialplan Project</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateProject(false);
                  setNewProject({ name: '', description: '' });
                }}
              >
                Cancel
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <div className="bg-gray-50 border rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-1">About Dialplan Projects</h4>
                <p className="text-xs text-gray-600">
                  Dialplan projects allow you to create complex call flows using a visual node-based editor. 
                  You can define call routing, IVR menus, and automated responses.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateProject(false);
                  setNewProject({ name: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={loadingDialplan}
              >
                {loadingDialplan ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {showTemplatePreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Template Preview: {selectedTemplate.name}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTemplatePreview(false);
                  setSelectedTemplate(null);
                  setTemplatePreview('');
                }}
              >
                Close
              </Button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Template Info</h4>
                  <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
                    <div>
                      <span className="text-xs font-medium text-gray-500">Type:</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        selectedTemplate.type === 'script' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedTemplate.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Description:</span>
                      <p className="text-xs text-gray-700 mt-1">{selectedTemplate.description}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Last Updated:</span>
                      <p className="text-xs text-gray-700 mt-1">
                        {new Date(selectedTemplate.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Sample Variables</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs space-y-1">
                      <div><strong>firstName:</strong> John</div>
                      <div><strong>lastName:</strong> Doe</div>
                      <div><strong>company:</strong> Example Company</div>
                      <div><strong>phone:</strong> +1234567890</div>
                      <div><strong>email:</strong> john.doe@example.com</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Rendered Preview</h4>
                <div className="bg-white border rounded-lg p-4 min-h-[200px]">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                    {templatePreview}
                  </pre>
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-1">Usage in Journey Builder</h4>
                <p className="text-xs text-gray-600">
                  This template can be selected in the Journey Builder when configuring call actions. 
                  {selectedTemplate.type === 'script' 
                    ? ' Script templates provide guidance for agents during calls.'
                    : ' Voicemail templates are used for automated voicemail messages.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
} 