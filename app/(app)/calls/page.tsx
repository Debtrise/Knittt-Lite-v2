'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Phone, List, Clock, User, PhoneIncoming, PhoneForwarded, PhoneOff, PhoneCall } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/button';
import { makeCall, getDIDs, getCalls, getCallDetails, updateCallStatus } from '@/app/utils/api';
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
        const response = await getDIDs({ page: 1, limit: 100, isActive: true });
        setDids(response.dids);
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
      const response = await getCalls({ 
        page: currentPage, 
        limit: callLimit,
        ...(statusFilter ? { status: statusFilter } : {})
      });
      setCalls(response.calls);
      setTotalPages(response.totalPages);
      
      // Extract unique statuses from the data for filter options
      if (!statusFilter) {
        const statuses = Array.from(new Set(response.calls.map((call: Call) => call.status))) as string[];
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
      const callData = await getCallDetails(callId);
      setSelectedCall(callData);
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
      await updateCallStatus(callId, newStatus);
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
      
      const response = await makeCall(callData);
      setCurrentCallId(response.callId);
      toast.success('Call initiated successfully');
      fetchCalls(); // Refresh call list after making a call
    } catch (error) {
      console.error('Call error:', error);
      toast.error('Failed to make call');
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
          <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <div className="px-4 sm:px-0">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Call Information</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Enter the phone numbers to initiate a call.
                  </p>
                  {currentCallId && (
                    <div className="mt-6 p-4 border rounded-md bg-green-50 border-green-200">
                      <h4 className="text-sm font-medium text-green-800">Current Call</h4>
                      <p className="mt-1 text-sm text-green-700">Call ID: {currentCallId}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-5 md:mt-0 md:col-span-2">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <Input
                        id="to"
                        type="text"
                        label="Destination Number"
                        placeholder="Enter phone number to call"
                        error={errors.to?.message}
                        {...register('to', { 
                          required: 'Destination number is required',
                          pattern: {
                            value: /^[0-9]{10,15}$/,
                            message: 'Please enter a valid phone number',
                          },
                        })}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <Input
                        id="transfer_number"
                        type="text"
                        label="Transfer Number"
                        placeholder="Enter transfer number"
                        error={errors.transfer_number?.message}
                        {...register('transfer_number', { 
                          required: 'Transfer number is required',
                          pattern: {
                            value: /^[0-9]{10,15}$/,
                            message: 'Please enter a valid phone number',
                          },
                        })}
                      />
                    </div>
                    
                    <div className="col-span-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">From (Caller ID)</label>
                      <select
                        id="from"
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        {...register('from', { required: 'Caller ID is required' })}
                      >
                        <option value="">Select a DID number</option>
                        {dids.map((did) => (
                          <option key={did.id} value={did.phoneNumber}>
                            {did.phoneNumber} - {did.description}
                          </option>
                        ))}
                      </select>
                      {errors.from && <p className="mt-1 text-sm text-red-600">{errors.from.message}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <Input
                        id="trunk"
                        type="text"
                        label="Trunk (Optional)"
                        placeholder="Enter trunk"
                        error={errors.trunk?.message}
                        {...register('trunk')}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <Input
                        id="context"
                        type="text"
                        label="Context (Optional)"
                        placeholder="Enter context"
                        error={errors.context?.message}
                        {...register('context')}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      className="mr-3"
                      onClick={() => {
                        setValue('to', '');
                        setValue('transfer_number', '');
                        setValue('from', '');
                        setValue('trunk', '');
                        setValue('context', '');
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isLoading}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Make Call
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Call History</h3>
                  <div className="mt-3 sm:mt-0">
                    <select
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {uniqueStatuses.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          From
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          To
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            Loading calls...
                          </td>
                        </tr>
                      ) : calls.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                            No calls found.
                          </td>
                        </tr>
                      ) : (
                        calls.map((call) => (
                          <tr 
                            key={call.id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => fetchCallDetails(call.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {getStatusIcon(call.status)}
                                <span className="ml-2 text-sm text-gray-900 capitalize">
                                  {call.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {call.from}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {call.to}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(call.startTime)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDuration(call.duration)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Button
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fetchCallDetails(call.id);
                                }}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing page <span className="font-medium">{currentPage}</span> of{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Previous</span>
                            &larr;
                          </button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Calculate page numbers to display, ensuring they're unique and sequential
                            let pageNum;
                            if (totalPages <= 5) {
                              // If 5 or fewer pages, just number them 1 through totalPages
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              // If near the start, show pages 1-5
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              // If near the end, show the last 5 pages
                              pageNum = totalPages - 4 + i;
                            } else {
                              // Otherwise, show current page and 2 pages on each side when possible
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={`page-${i}-${pageNum}`}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Next</span>
                            &rarr;
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Call Details */}
            {selectedCall && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Call Details</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Call ID: {selectedCall.id}</p>
                  </div>
                  <Button 
                    variant="secondary"
                    onClick={() => setSelectedCall(null)}
                  >
                    Close
                  </Button>
                </div>
                {loadingCall ? (
                  <div className="px-4 py-5 sm:p-6 text-center">
                    <p className="text-gray-500">Loading call details...</p>
                  </div>
                ) : (
                  <>
                    <div className="border-t border-gray-200">
                      <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Status</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                            {getStatusIcon(selectedCall.status)}
                            <span className="ml-2 capitalize">{selectedCall.status}</span>
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">From</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedCall.from}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">To</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedCall.to}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Transfer Number</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedCall.transferNumber}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Start Time</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDateTime(selectedCall.startTime)}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">End Time</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {selectedCall.endTime ? formatDateTime(selectedCall.endTime) : 'N/A'}
                          </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Duration</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDuration(selectedCall.duration)}</dd>
                        </div>
                        {selectedCall.Lead && (
                          <>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Lead Name</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedCall.Lead.name || 'N/A'}</dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Lead Email</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedCall.Lead.email || 'N/A'}</dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Lead Status</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">{selectedCall.Lead.status}</dd>
                            </div>
                          </>
                        )}
                      </dl>
                    </div>
                    <div className="px-4 py-5 border-t border-gray-200 sm:px-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Update Status</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus(selectedCall.id, 'initiated')}
                          disabled={isUpdatingStatus || selectedCall.status === 'initiated'}
                        >
                          <PhoneCall className="w-4 h-4 mr-2" />
                          Initiated
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus(selectedCall.id, 'answered')}
                          disabled={isUpdatingStatus || selectedCall.status === 'answered'}
                        >
                          <PhoneIncoming className="w-4 h-4 mr-2" />
                          Answered
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus(selectedCall.id, 'transferred')}
                          disabled={isUpdatingStatus || selectedCall.status === 'transferred'}
                        >
                          <PhoneForwarded className="w-4 h-4 mr-2" />
                          Transferred
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus(selectedCall.id, 'completed')}
                          disabled={isUpdatingStatus || selectedCall.status === 'completed'}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Completed
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus(selectedCall.id, 'failed')}
                          disabled={isUpdatingStatus || selectedCall.status === 'failed'}
                        >
                          <PhoneOff className="w-4 h-4 mr-2" />
                          Failed
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 