'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Phone, List, Clock, User, PhoneIncoming, PhoneForwarded, PhoneOff, PhoneCall, Settings, Play, Save, Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';
import { checkDialplanCapabilities, getProjects, createProject, getProjectDetails, generateDialplan } from '@/app/utils/dialplanApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useToast } from '@/app/components/ui/use-toast';
import type { Call } from '@/app/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';

type CallFormData = {
  to: string;
  from: string;
  message?: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    from: '',
    to: '',
    ingroup: '',
  });
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
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CallFormData>();

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const response = await api.calls.list({
        page,
        limit: 10,
        ...filters,
        status: filters.status === 'all' ? undefined : filters.status,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        ingroup: filters.ingroup || undefined,
      });
      setCalls(response.calls);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
      setError(null);
    } catch (err) {
      setError('Failed to fetch calls');
      console.error('Error fetching calls:', err);
    } finally {
      setLoading(false);
    }
  };

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
  }, [isAuthenticated, router, page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

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

  useEffect(() => {
    if (activeTab === 'dialplan') {
      loadDialplanData();
    }
  }, [activeTab, dialplanTab, loadDialplanData]);

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

  const fetchCallDetails = async (callId: number) => {
    setLoading(true);
    try {
      const response = await api.calls.get(callId.toString());
      const call = response.data.data;
      
      // If the call has a leadId, fetch the lead details separately
      if (call.leadId) {
        try {
          const leadResponse = await api.leads.get(call.leadId.toString());
          call.lead = leadResponse.data.data;
        } catch (error) {
          console.error('Error fetching lead details:', error);
          // Don't throw the error, just continue without lead details
        }
      }
      
      setSelectedCall(call);
      setCurrentCallId(Number(call.id));
    } catch (error: any) {
      console.error('Error fetching call details:', error.response?.data || error.message);
      toast.error(error.response?.data?.error || 'Failed to load call details');
      setSelectedCall(null);
      setCurrentCallId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (callId: number, newStatus: 'initiated' | 'answered' | 'transferred' | 'completed' | 'failed') => {
    setIsLoading(true);
    try {
      await api.calls.updateStatus(callId.toString(), newStatus);
      toast.success(`Call status updated to ${newStatus}`);
      
      // Update the call in the UI
      if (currentCallId === callId) {
        setCurrentCallId(null);
      }
      
      // Refresh the call list
      fetchCalls();
    } catch (error: any) {
      console.error('Error updating call status:', error);
      toast.error(error.response?.data?.error || 'Failed to update call status');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CallFormData) => {
    setIsLoading(true);
    
    try {
      const callData = {
        to: data.to,
        from: data.from,
        message: data.message,
      };
      
      const response = await api.calls.make(callData);
      setCurrentCallId(Number(response.data.data.id));
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
      
      setTemplatePreview(response.data?.data.content || template.content);
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Calls</h1>
          <div className="flex space-x-4">
            <Button onClick={() => setActiveTab('make-call')}>Make Call</Button>
            <Button onClick={() => setActiveTab('dialplan')}>Dialplan</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Date Range</label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <Input
              placeholder="Search by phone number"
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {(calls || []).filter(call => call.status === 'initiated').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Completed Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {(calls || []).filter(call => call.status === 'completed').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Failed Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {(calls || []).filter(call => call.status === 'failed').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Calls Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : (calls || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    No calls found
                  </TableCell>
                </TableRow>
              ) : (
                (calls || []).map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>{call.id}</TableCell>
                    <TableCell>
                      {call.lead ? (
                        <div>
                          <div className="font-medium">{call.lead.name}</div>
                          <div className="text-sm text-gray-500">{call.lead.phone}</div>
                        </div>
                      ) : (
                        'No lead'
                      )}
                    </TableCell>
                    <TableCell>{call.from}</TableCell>
                    <TableCell>{call.to}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          call.status === 'completed'
                            ? 'success'
                            : call.status === 'failed'
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {call.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {call.duration !== null ? `${call.duration}s` : '-'}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(call.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(Number(call.id), 'completed')}
                      >
                        Complete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {(calls || []).length} of {totalCount} calls
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Call Details Section */}
        {selectedCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Call Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCall(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Call Information */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <Badge variant={getStatusVariant(selectedCall.status)}>
                        {selectedCall.status}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                      <p className="mt-1">{selectedCall.duration ? formatDuration(selectedCall.duration) : 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
                      <p className="mt-1">{formatDateTime(selectedCall.startTime)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">End Time</h3>
                      <p className="mt-1">{selectedCall.endTime ? formatDateTime(selectedCall.endTime) : 'N/A'}</p>
                    </div>
                  </div>

                  {/* Call Numbers */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">From</h3>
                      <p className="mt-1">{selectedCall.from}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">To</h3>
                      <p className="mt-1">{selectedCall.to}</p>
                    </div>
                    {selectedCall.transferNumber && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Transfer Number</h3>
                        <p className="mt-1">{selectedCall.transferNumber}</p>
                      </div>
                    )}
                    {selectedCall.ingroup && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">In Group</h3>
                        <p className="mt-1">{selectedCall.ingroup}</p>
                      </div>
                    )}
                  </div>

                  {/* Lead Information */}
                  {selectedCall.lead && (
                    <div className="col-span-2 border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Name</h4>
                          <p className="mt-1">{selectedCall.lead.name}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                          <p className="mt-1">{selectedCall.lead.phone}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Email</h4>
                          <p className="mt-1">{selectedCall.lead.email || 'N/A'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Status</h4>
                          <Badge variant={getStatusVariant(selectedCall.lead.status)}>
                            {selectedCall.lead.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recording */}
                  {selectedCall.recordingUrl && (
                    <div className="col-span-2 border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Call Recording</h3>
                      <audio controls className="w-full">
                        <source src={selectedCall.recordingUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 