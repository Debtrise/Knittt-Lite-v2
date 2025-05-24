'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Phone, List, Clock, User, PhoneIncoming, PhoneForwarded, PhoneOff, PhoneCall } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/button';
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
        ) : (
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
        )}
      </div>
    </DashboardLayout>
  );
} 