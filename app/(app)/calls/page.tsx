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

export default function CallsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [dids, setDids] = useState<DID[]>([]);
  const [currentCallId, setCurrentCallId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'make-call' | 'call-list'>('call-list');
  const [calls, setCalls] = useState<Call[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [loadingCall, setLoadingCall] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [callLimit] = useState(10);
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CallFormData>();

  const fetchCalls = async () => {
    setIsLoading(true);
    try {
      const response = await api.calls.list({ 
        page: currentPage, 
        limit: callLimit,
        ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {})
      });
      setCalls(response.data.calls);
      setTotalPages(response.data.totalPages);
      if (!statusFilter || statusFilter === 'all') {
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

  const fetchDIDs = async () => {
    try {
      const response = await api.dids.list({ page: 1, limit: 100, isActive: true });
      setDids(response.data.dids);
    } catch (error) {
      console.error('Error fetching DIDs:', error);
      toast.error('Failed to load DIDs');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchDIDs();
    fetchCalls();
  }, [isAuthenticated, router, currentPage, statusFilter, fetchCalls]);

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

  const handleUpdateStatus = async (callId: number, newStatus: 'initiated' | 'answered' | 'transferred' | 'completed' | 'failed') => {
    setIsUpdatingStatus(true);
    try {
      await api.calls.updateStatus(callId.toString(), newStatus);
      toast.success('Call status updated');
      fetchCalls();
    } catch (error) {
      console.error('Error updating call status:', error);
      toast.error('Failed to update call status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const onSubmit = async (data: CallFormData) => {
    setIsLoading(true);
    try {
      await api.calls.make(data);
      toast.success('Call initiated successfully');
      fetchCalls();
    } catch (error) {
      console.error('Error making call:', error);
      toast.error('Failed to initiate call');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'initiated':
        return <PhoneCall className="w-4 h-4" />;
      case 'answered':
        return <PhoneIncoming className="w-4 h-4" />;
      case 'transferred':
        return <PhoneForwarded className="w-4 h-4" />;
      case 'completed':
        return <Phone className="w-4 h-4" />;
      case 'failed':
        return <PhoneOff className="w-4 h-4" />;
      default:
        return <Phone className="w-4 h-4" />;
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Call Management</h1>
          <div className="flex space-x-4">
            <Button
              variant={activeTab === 'make-call' ? 'brand' : 'outline'}
              onClick={() => setActiveTab('make-call')}
            >
              <Phone className="w-4 h-4 mr-2" />
              Make Call
            </Button>
            <Button
              variant={activeTab === 'call-list' ? 'brand' : 'outline'}
              onClick={() => setActiveTab('call-list')}
            >
              <List className="w-4 h-4 mr-2" />
              Call List
            </Button>
          </div>
        </div>

        {activeTab === 'make-call' && (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="to">To Number</Label>
                  <Input
                    id="to"
                    {...register('to', { required: 'To number is required' })}
                    placeholder="Enter phone number"
                  />
                  {errors.to && <p className="text-red-500 text-sm mt-1">{errors.to.message}</p>}
                </div>
                <div>
                  <Label htmlFor="transfer_number">Transfer Number</Label>
                  <Input
                    id="transfer_number"
                    {...register('transfer_number', { required: 'Transfer number is required' })}
                    placeholder="Enter transfer number"
                  />
                  {errors.transfer_number && (
                    <p className="text-red-500 text-sm mt-1">{errors.transfer_number.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="from">From Number</Label>
                  <Select
                    onValueChange={(value) => setValue('from', value)}
                    {...register('from', { required: 'From number is required' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a number" />
                    </SelectTrigger>
                    <SelectContent>
                      {dids.map((did) => (
                        <SelectItem key={did.id} value={did.phoneNumber}>
                          {did.phoneNumber} {did.description ? `(${did.description})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.from && <p className="text-red-500 text-sm mt-1">{errors.from.message}</p>}
                </div>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Initiating...' : 'Make Call'}
              </Button>
            </form>
          </div>
        )}

        {activeTab === 'call-list' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Recent Calls</h2>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {uniqueStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">From</th>
                    <th className="px-4 py-2 text-left">To</th>
                    <th className="px-4 py-2 text-left">Transfer</th>
                    <th className="px-4 py-2 text-left">Start Time</th>
                    <th className="px-4 py-2 text-left">Duration</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map((call) => (
                    <tr key={call.id} className="border-t">
                      <td className="px-4 py-2">{call.id}</td>
                      <td className="px-4 py-2">{call.from}</td>
                      <td className="px-4 py-2">{call.to}</td>
                      <td className="px-4 py-2">{call.transferNumber}</td>
                      <td className="px-4 py-2">{formatDateTime(call.startTime)}</td>
                      <td className="px-4 py-2">{formatDuration(call.duration)}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(call.status)}
                          <span>{call.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchCallDetails(call.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {call.status === 'initiated' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(call.id, 'completed')}
                              disabled={isUpdatingStatus}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {selectedCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-xl font-bold mb-4">Call Details</h2>
              <div className="space-y-4">
                <div>
                  <Label>Call ID</Label>
                  <p>{selectedCall.id}</p>
                </div>
                <div>
                  <Label>From</Label>
                  <p>{selectedCall.from}</p>
                </div>
                <div>
                  <Label>To</Label>
                  <p>{selectedCall.to}</p>
                </div>
                <div>
                  <Label>Transfer Number</Label>
                  <p>{selectedCall.transferNumber}</p>
                </div>
                <div>
                  <Label>Start Time</Label>
                  <p>{formatDateTime(selectedCall.startTime)}</p>
                </div>
                {selectedCall.endTime && (
                  <div>
                    <Label>End Time</Label>
                    <p>{formatDateTime(selectedCall.endTime)}</p>
                  </div>
                )}
                <div>
                  <Label>Duration</Label>
                  <p>{formatDuration(selectedCall.duration)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p>{selectedCall.status}</p>
                </div>
                {selectedCall.Lead && (
                  <div>
                    <Label>Lead Information</Label>
                    <div className="mt-2">
                      <p>Name: {selectedCall.Lead.name}</p>
                      <p>Phone: {selectedCall.Lead.phone}</p>
                      <p>Email: {selectedCall.Lead.email}</p>
                      <p>Status: {selectedCall.Lead.status}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCall(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 