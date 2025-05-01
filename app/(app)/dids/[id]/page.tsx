'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Phone, MapPin, Tag, Clock, ArrowLeft, Trash2, Calendar, Clock1 } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Button from '@/app/components/ui/Button';
import { getDIDDetails, deleteDID } from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';
import Link from 'next/link';

type DIDDetail = {
  id: number;
  phoneNumber: string;
  description: string;
  areaCode: string;
  state: string;
  isActive: boolean;
  usageCount: number;
  lastUsed?: string;
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

type UsageStats = {
  totalCalls: number;
  answeredCalls: number;
  transferredCalls: number;
  completedCalls: number;
  totalDuration: number;
  avgDuration: number;
  callsByDayOfWeek: number[];
  callsByHour: number[];
};

type DIDDetailsResponse = {
  did: DIDDetail;
  usageHistory: {
    calls: Call[];
    stats: UsageStats;
  };
};

export default function DIDDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [didDetails, setDIDDetails] = useState<DIDDetailsResponse | null>(null);

  const didId = typeof params.id === 'string' ? parseInt(params.id, 10) : 0;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (didId) {
      fetchDIDDetails();
    }
  }, [isAuthenticated, didId]);

  const fetchDIDDetails = async () => {
    setIsLoading(true);
    try {
      const data = await getDIDDetails(didId);
      setDIDDetails(data);
    } catch (error) {
      console.error('Error fetching DID details:', error);
      toast.error('Failed to load DID details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this DID? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDID(didId);
      toast.success('DID deleted successfully');
      router.push('/dids');
    } catch (error) {
      console.error('Error deleting DID:', error);
      toast.error('Failed to delete DID');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/dids">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to DIDs
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">DID Details</h1>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            isLoading={isDeleting}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete DID
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading DID details...</div>
          </div>
        ) : !didDetails ? (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">DID not found or you don't have permission to view it.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* DID Information Card */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">DID Information</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Details and usage statistics.</p>
                </div>
                <div>
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      didDetails.did.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {didDetails.did.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Phone className="h-5 w-5 mr-2 text-gray-400" />
                      Phone Number
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {didDetails.did.phoneNumber}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Tag className="h-5 w-5 mr-2 text-gray-400" />
                      Description
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {didDetails.did.description || 'No description'}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                      Area Code
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {didDetails.did.areaCode}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                      State
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {didDetails.did.state}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-gray-400" />
                      Last Used
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatDateTime(didDetails.did.lastUsed || '')}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Usage Statistics Card */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Usage Statistics</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Overview of calls using this DID.</p>
              </div>
              <div className="border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Total Calls</div>
                    <div className="mt-1 text-3xl font-semibold text-gray-900">{didDetails.usageHistory.stats.totalCalls}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Answered Calls</div>
                    <div className="mt-1 text-3xl font-semibold text-gray-900">{didDetails.usageHistory.stats.answeredCalls}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Completed Calls</div>
                    <div className="mt-1 text-3xl font-semibold text-gray-900">{didDetails.usageHistory.stats.completedCalls}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Avg. Duration</div>
                    <div className="mt-1 text-3xl font-semibold text-gray-900">{formatDuration(didDetails.usageHistory.stats.avgDuration)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Patterns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calls by Day of Week */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                    Calls by Day of Week
                  </h3>
                </div>
                <div className="border-t border-gray-200 p-4">
                  <div className="space-y-4">
                    {daysOfWeek.map((day, index) => (
                      <div key={day} className="flex items-center">
                        <div className="w-20 text-sm text-gray-500">{day}</div>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-5 bg-blue-500 rounded-full"
                            style={{ 
                              width: `${didDetails.usageHistory.stats.callsByDayOfWeek[index] / Math.max(...didDetails.usageHistory.stats.callsByDayOfWeek) * 100}%` 
                            }}
                          />
                        </div>
                        <div className="ml-2 w-10 text-sm text-gray-500 text-right">
                          {didDetails.usageHistory.stats.callsByDayOfWeek[index]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calls by Hour */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <Clock1 className="h-5 w-5 mr-2 text-gray-400" />
                    Calls by Hour
                  </h3>
                </div>
                <div className="border-t border-gray-200 p-4">
                  <div className="space-y-4">
                    {didDetails.usageHistory.stats.callsByHour.map((count, hour) => (
                      <div key={hour} className="flex items-center">
                        <div className="w-20 text-sm text-gray-500">{hour}:00</div>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-5 bg-green-500 rounded-full"
                            style={{ 
                              width: `${count / Math.max(...didDetails.usageHistory.stats.callsByHour) * 100}%` 
                            }}
                          />
                        </div>
                        <div className="ml-2 w-10 text-sm text-gray-500 text-right">
                          {count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Calls Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Calls</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest calls using this DID.</p>
              </div>
              <div className="border-t border-gray-200">
                <div className="overflow-x-auto">
                  {didDetails.usageHistory.calls.length === 0 ? (
                    <div className="flex justify-center items-center p-6">
                      <p className="text-gray-500">No call history found for this DID.</p>
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
                        {didDetails.usageHistory.calls.map((call) => (
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