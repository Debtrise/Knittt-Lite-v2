'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, X, RefreshCw, UserPlus } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/Input';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useAuthStore } from '@/app/store/authStore';
import {
  getJourneyDetails,
  getJourneyLeads,
  enrollLeadsInJourney,
  updateLeadJourneyStatus,
  getLeads
} from '@/app/utils/api';
import { Journey, LeadJourney } from '@/app/types/journey';

interface JourneyLead {
  id: number;
  leadId: number;
  journeyId: number;
  status: string;
  currentStepId?: number;
  enrolledAt: string;
  lastExecutedAt?: string;
  exitedAt?: string;
  exitReason?: string;
  Lead?: {
    id: number;
    phone: string;
    name?: string;
    email?: string;
    status: string;
    brand?: string;
    source?: string;
  };
  currentStep?: {
    id: number;
    name: string;
  };
  nextExecutionTime?: string;
}

interface JourneyLeadsClientProps {
  journeyId: string;
}

export default function JourneyLeadsClient({ journeyId }: JourneyLeadsClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [journey, setJourney] = useState<Journey | null>(null);
  const [leads, setLeads] = useState<JourneyLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [showEnrollLeadsDialog, setShowEnrollLeadsDialog] = useState(false);
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    if (isAuthenticated && journeyId) {
      fetchJourneyDetails();
      fetchLeads();
    }
  }, [isAuthenticated, journeyId, activeTab, currentPage]);
  
  const fetchJourneyDetails = async () => {
    try {
      const journeyData = await getJourneyDetails(parseInt(journeyId, 10));
      setJourney(journeyData);
    } catch (error) {
      console.error('Error fetching journey details:', error);
      toast.error('Failed to load journey details');
    }
  };
  
  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const response = await getJourneyLeads(parseInt(journeyId, 10), {
        status: activeTab !== 'all' ? activeTab : undefined,
        page: currentPage,
        limit: 10
      });
      setLeads(response.leads || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error fetching journey leads:', error);
      toast.error('Failed to load journey leads');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchAvailableLeads = async () => {
    try {
      const response = await getLeads({ limit: 100 });
      setAvailableLeads(response.leads || []);
    } catch (error) {
      console.error('Error fetching available leads:', error);
      toast.error('Failed to load available leads');
    }
  };
  
  const handleSearch = () => {
    setCurrentPage(1);
    fetchLeads();
  };
  
  const handleEnrollLeads = async (leadIds: number[]) => {
    try {
      setIsEnrolling(true);
      await enrollLeadsInJourney(parseInt(journeyId, 10), { leadIds });
      toast.success('Leads enrolled successfully');
      setShowEnrollLeadsDialog(false);
      fetchLeads();
    } catch (error) {
      console.error('Error enrolling leads:', error);
      toast.error('Failed to enroll leads');
    } finally {
      setIsEnrolling(false);
    }
  };
  
  const handleUpdateLeadStatus = async (leadId: number, status: string) => {
    try {
      await updateLeadJourneyStatus(leadId, parseInt(journeyId, 10), { status });
      toast.success(`Lead status updated to ${status}`);
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };
  
  const handleBulkAction = async (action: string) => {
    if (selectedLeads.length === 0) {
      toast.error('No leads selected');
      return;
    }
    
    try {
      setIsLoading(true);
      
      for (const leadId of selectedLeads) {
        await updateLeadJourneyStatus(leadId, parseInt(journeyId, 10), { status: action });
      }
      
      toast.success(`Updated ${selectedLeads.length} leads to ${action}`);
      setSelectedLeads([]);
      fetchLeads();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to update some leads');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectAllLeads = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };
  
  const toggleLeadSelection = (leadId: number) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Link href={`/journeys/${journeyId}`}>
              <Button variant="secondary" className="mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {journey ? `${journey.name} - Leads` : 'Journey Leads'}
              </h1>
              {journey && (
                <p className="text-sm text-gray-500">
                  Manage leads enrolled in this journey
                </p>
              )}
            </div>
          </div>
          <Button onClick={() => {
            fetchAvailableLeads();
            setShowEnrollLeadsDialog(true);
          }}>
            <UserPlus className="h-4 w-4 mr-2" />
            Enroll Leads
          </Button>
        </div>
        
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="paused">Paused</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                  <TabsTrigger value="exited">Exited</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center ml-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  {searchTerm && (
                    <button
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => {
                        setSearchTerm('');
                        handleSearch();
                      }}
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchLeads}
                  title="Refresh"
                  className="ml-2"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {selectedLeads.length > 0 && (
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('paused')}
                  disabled={isLoading}
                >
                  Pause
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('active')}
                  disabled={isLoading}
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('exited')}
                  disabled={isLoading}
                >
                  Exit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedLeads([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">No leads found in this journey</p>
              <Button onClick={() => {
                fetchAvailableLeads();
                setShowEnrollLeadsDialog(true);
              }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Enroll Leads
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="pl-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      <Checkbox
                        checked={selectedLeads.length === leads.length}
                        onCheckedChange={handleSelectAllLeads}
                        aria-label="Select all leads"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Step
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Execution
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="pl-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={() => toggleLeadSelection(lead.id)}
                          aria-label={`Select lead ${lead.id}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {lead.Lead ? (
                                <Link href={`/leads/${lead.leadId}`} className="hover:underline">
                                  {lead.Lead.name}
                                </Link>
                              ) : (
                                `Lead #${lead.leadId}`
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {lead.Lead?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={
                            lead.status === 'active' ? 'default' :
                            lead.status === 'paused' ? 'secondary' :
                            lead.status === 'completed' ? 'outline' :
                            'destructive'
                          }
                          className="text-xs"
                        >
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.currentStep ? lead.currentStep.name : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.nextExecutionTime ? 
                          new Date(lead.nextExecutionTime).toLocaleString() : 
                          'Not scheduled'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {lead.status === 'active' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpdateLeadStatus(lead.id, 'paused')}
                            >
                              Pause
                            </Button>
                          ) : lead.status === 'paused' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpdateLeadStatus(lead.id, 'active')}
                            >
                              Activate
                            </Button>
                          ) : null}
                          
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUpdateLeadStatus(lead.id, 'exited')}
                          >
                            Exit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Enroll Leads Dialog */}
      <Dialog open={showEnrollLeadsDialog} onOpenChange={setShowEnrollLeadsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll Leads in Journey</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Select leads to enroll in this journey
              </p>
              <Input
                type="text"
                placeholder="Search leads..."
                className="mb-2"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  if (searchTerm === '') {
                    fetchAvailableLeads();
                  } else {
                    setAvailableLeads(prevLeads => 
                      prevLeads.filter(lead => 
                        lead.name?.toLowerCase().includes(searchTerm) || 
                        lead.phone?.includes(searchTerm) ||
                        lead.email?.toLowerCase().includes(searchTerm)
                      )
                    );
                  }
                }}
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {availableLeads.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No leads found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {availableLeads.map(lead => (
                    <div key={lead.id} className="p-3 flex items-center">
                      <Checkbox
                        id={`lead-${lead.id}`}
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLeads(prev => [...prev, lead.id]);
                          } else {
                            setSelectedLeads(prev => prev.filter(id => id !== lead.id));
                          }
                        }}
                        className="mr-2"
                      />
                      <label
                        htmlFor={`lead-${lead.id}`}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-gray-500 text-xs">
                          {lead.phone} {lead.email ? `• ${lead.email}` : ''}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnrollLeadsDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleEnrollLeads(selectedLeads)}
              disabled={selectedLeads.length === 0 || isEnrolling}
            >
              {isEnrolling ? 'Enrolling...' : 'Enroll Selected Leads'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
} 