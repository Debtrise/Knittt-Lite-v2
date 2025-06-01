'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Phone, PhoneCall, PhoneForwarded, Route, BarChart, Edit, Filter, Search, ChevronDown, ChevronRight, Eye, Mail, Database, PieChart, Activity, List, Settings, Play, Plus } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Input } from '@/app/components/ui/Input';
import Button from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';
import { checkDialplanCapabilities, getProjects, createProject, getProjectDetails, generateDialplan } from '@/app/utils/dialplanApi';
import { getCalls, getCallDetails } from '@/app/utils/api';
import MakeCallForm from '@/app/components/calls/MakeCallForm';
import CallList from '@/app/components/calls/CallList';

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
    nodeTypes: Record<string, {
      id: number;
      name: string;
      description: string;
      category: 'extension' | 'application' | 'flowcontrol' | 'action' | 'terminal';
      inputHandles?: number;
      outputHandles?: number;
      defaultParams?: Record<string, any>;
      paramDefs?: Array<{
        id: string;
        name: string;
        type: 'string' | 'number' | 'boolean' | 'select' | 'template_select' | 'transfer_group_select' | 'recording_select' | 'ivr_options';
        required: boolean;
        default?: any;
        options?: string[];
        templateType?: 'sms' | 'email' | 'script' | 'voicemail' | 'transfer';
        description?: string;
      }>;
    }>;
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

  const fetchCalls = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.calls.list({
        page: currentPage,
        limit: callLimit,
        status: statusFilter,
        leadId: selectedProject?.id
      });
      setCalls(response.data.calls);
      setTotalPages(Math.ceil(response.data.total / callLimit));
      
      // Extract unique statuses from the data for filter options
      if (!statusFilter) {
        const statuses = Array.from(new Set(response.data.calls.map((call: Call) => call.status))) as string[];
        setUniqueStatuses(statuses);
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
      toast.error('Failed to fetch calls');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, callLimit, statusFilter, selectedProject]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

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
  }, [isAuthenticated, router, currentPage, statusFilter]);

  // Load dialplan data when dialplan tab is active
  useEffect(() => {
    if (activeTab === 'dialplan') {
      loadDialplanData();
    }
  }, [activeTab, dialplanTab]);

  const loadCallTemplates = useCallback(async () => {
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
  }, []);

  const loadDialplanProjects = useCallback(async () => {
    try {
      const projects = await getProjects();
      setDialplanProjects(Array.isArray(projects) ? projects : []);
    } catch (error) {
      console.error('Error loading dialplan projects:', error);
      // Set empty array on error to prevent UI issues
      setDialplanProjects([]);
    }
  }, []);

  const loadDialplanCapabilities = useCallback(async () => {
    try {
      const capabilities = await checkDialplanCapabilities();
      setDialplanCapabilities(capabilities);
    } catch (error) {
      console.error('Error loading dialplan capabilities:', error);
      throw error;
    }
  }, []);

  const loadDialplanData = useCallback(async () => {
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
  }, [dialplanTab, loadCallTemplates, loadDialplanProjects, loadDialplanCapabilities]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadDialplanData();
  }, [isAuthenticated, router, loadDialplanData]);

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
      await api.calls.updateStatus(callId.toString(), newStatus as any);
      toast.success(`Call status updated to ${newStatus}`);
      if (selectedCall && selectedCall.id === callId) {
        setSelectedCall({
          ...selectedCall,
          status: newStatus
        });
      }
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
        leadId: data.leadId || 0,
        variables: {} as Record<string, string>
      };
      
      // Only add variables if we have trunk or context
      if (data.trunk) callData.variables.trunk = data.trunk;
      if (data.context) callData.variables.context = data.context;
      
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
        return <PhoneCall className="w-5 h-5 text-green-500" />;
      case 'transferred':
        return <PhoneForwarded className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <Phone className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <Phone className="w-5 h-5 text-red-500" />;
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
      const template = await api.templates.create({
        name: newTemplate.name,
        description: newTemplate.description,
        type: newTemplate.type,
        content: newTemplate.content,
        isActive: true
      });

      toast.success('Template created successfully');
      setShowCreateTemplate(false);
      setNewTemplate({ name: '', description: '', type: 'script', content: '' });
      await loadCallTemplates();
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast.error(error.response?.data?.error || 'Failed to create template');
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
      
      // Create and download the dialplan file
      const blob = new Blob([result.dialplan || 'No dialplan content'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}-dialplan.conf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error generating dialplan:', error);
      toast.error(error.response?.data?.error || 'Failed to generate dialplan');
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
          <MakeCallForm
            dids={dids}
            onSubmit={onSubmit}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            errors={errors}
            register={register}
          />
        ) : activeTab === 'call-list' ? (
          <CallList
            calls={calls}
            selectedCall={selectedCall}
            loadingCall={loadingCall}
            isLoading={isLoading}
            statusFilter={statusFilter}
            uniqueStatuses={uniqueStatuses}
            fetchCalls={fetchCalls}
            handlePageChange={handlePageChange}
            currentPage={currentPage}
            totalPages={totalPages}
            formatDateTime={formatDateTime}
            formatDuration={formatDuration}
            getStatusIcon={getStatusIcon}
            fetchCallDetails={fetchCallDetails}
            handleUpdateStatus={handleUpdateStatus}
            isUpdatingStatus={isUpdatingStatus}
            setStatusFilter={setStatusFilter}
          />
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
                              <Settings className="h-3 w-3" />
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
              ) : null}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}