'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { User, Phone, Clock, Mail, File, BarChart, Trash2, ArrowLeft, Tag } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { getLeadDetails, deleteLead } from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';
import Link from 'next/link';

type LeadDetail = {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
  callDurations?: number[];
  additionalData?: Record<string, any>;
  tags?: string[];
  activeJourneys?: { journeyName: string }[];
};

type Call = {
  id: number;
  startTime: string;
  endTime?: string;
  duration: number;
  status: string;
  from: string;
  to: string;
};

type CallStats = {
  totalCalls: number;
  answeredCalls: number;
  transferredCalls: number;
  completedCalls: number;
  totalDuration: number;
  avgDuration: number;
};

type LeadDetailsResponse = {
  lead: LeadDetail;
  callHistory: {
    calls: Call[];
    stats: CallStats;
  };
};

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [leadDetails, setLeadDetails] = useState<LeadDetailsResponse | null>(null);

  // Get leadId from params directly
  const leadId = typeof params.id === 'string' ? parseInt(params.id, 10) : 0;

  // Function to calculate lead age in days
  const calculateLeadAge = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Function to format lead age for display
  const formatLeadAge = (days: number): string => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) {
      const months = Math.floor(days / 30);
      return months === 1 ? '1 month' : `${months} months`;
    }
    const years = Math.floor(days / 365);
    return years === 1 ? '1 year' : `${years} years`;
  };

  // Function to format tags for display
  const formatTags = (lead: LeadDetail): string[] => {
    // Check multiple possible locations for tags
    if (lead.tags && Array.isArray(lead.tags)) {
      return lead.tags;
    }
    if (lead.additionalData?.tags && Array.isArray(lead.additionalData.tags)) {
      return lead.additionalData.tags;
    }
    if (lead.additionalData?.leadTags && Array.isArray(lead.additionalData.leadTags)) {
      return lead.additionalData.leadTags;
    }
    return [];
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (leadId) {
      fetchLeadDetails();
    }
  }, [isAuthenticated, leadId]);

  const fetchLeadDetails = async () => {
    setIsLoading(true);
    try {
      const data = await getLeadDetails(leadId);
      setLeadDetails(data);
    } catch (error) {
      console.error('Error fetching lead details:', error);
      toast.error('Failed to load lead details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteLead(leadId);
      toast.success('Lead deleted successfully');
      router.push('/leads');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'converted':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCallStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'initiated':
        return 'bg-blue-100 text-blue-800';
      case 'answered':
        return 'bg-yellow-100 text-yellow-800';
      case 'transferred':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/leads">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leads
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">Lead Details</h1>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            isLoading={isDeleting}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Lead
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading lead details...</div>
          </div>
        ) : !leadDetails ? (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">Lead not found or you don't have permission to view it.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Lead Information Card */}
            <div className="bg-white shadow rounded-lg p-6 w-full">
              <h2 className="text-lg font-semibold mb-4">Lead Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Name</span>
                  </div>
                  <p className="text-base font-medium">{leadDetails.lead.name}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Phone</span>
                  </div>
                  <p className="text-base font-medium">{leadDetails.lead.phone}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Email</span>
                  </div>
                  <p className="text-base font-medium">{leadDetails.lead.email || 'N/A'}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-gray-500">Status</span>
                  </div>
                  <Badge className={getStatusColor(leadDetails.lead.status)}>
                    {leadDetails.lead.status}
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Lead Age</span>
                  </div>
                  <p className="text-base font-medium">{formatLeadAge(calculateLeadAge(leadDetails.lead.createdAt))}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formatTags(leadDetails.lead).length > 0 ? (
                      formatTags(leadDetails.lead).map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))
                    ) : (
                      <span className="text-base">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <File className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Active Journeys</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {leadDetails.lead.activeJourneys && leadDetails.lead.activeJourneys.length > 0 ? (
                      leadDetails.lead.activeJourneys.map((journey, index) => (
                        <Badge key={index} variant="outline">{journey.journeyName}</Badge>
                      ))
                    ) : (
                      <span className="text-base">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Call Statistics Card */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Call Statistics</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Overview of calls with this lead.</p>
              </div>
              <div className="border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Total Calls</div>
                    <div className="mt-1 text-3xl font-semibold text-gray-900">{leadDetails.callHistory.stats.totalCalls}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Answered Calls</div>
                    <div className="mt-1 text-3xl font-semibold text-gray-900">{leadDetails.callHistory.stats.answeredCalls}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Completed Calls</div>
                    <div className="mt-1 text-3xl font-semibold text-gray-900">{leadDetails.callHistory.stats.completedCalls}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Avg. Duration</div>
                    <div className="mt-1 text-3xl font-semibold text-gray-900">{formatDuration(leadDetails.callHistory.stats.avgDuration)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call History Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Call History</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Details of all calls with this lead.</p>
              </div>
              <div className="border-t border-gray-200">
                <div className="overflow-x-auto">
                  {leadDetails.callHistory.calls.length === 0 ? (
                    <div className="flex justify-center items-center p-6">
                      <p className="text-gray-500">No call history found for this lead.</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leadDetails.callHistory.calls.map((call) => (
                          <tr key={call.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(call.startTime)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{call.from}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{call.to}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDuration(call.duration)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCallStatusColor(call.status)}`}>
                                {call.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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