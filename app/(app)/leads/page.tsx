'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Upload, User, CheckCircle, XCircle, PhoneOutgoing, Filter, Trash2, Edit, AlertTriangle, Tag, Search } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Badge } from '@/app/components/ui/badge';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useToast } from '@/app/components/ui/use-toast';
import { getLeads, createLead, updateLead, deleteLead } from '@/app/utils/api';
import { debounce } from 'lodash';
import BulkEnrichmentModal from './components/BulkEnrichmentModal';

type Lead = {
  id: number;
  tenantId: string;
  phone: string;
  name: string;
  email: string;
  additionalData: Record<string, any>;
  attempts: number;
  lastAttempt: string | null;
  callDurations: number[];
  status: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
};

type UploadFormData = {
  fileContent: string;
  sortOrder: 'oldest' | 'fewest';
  autoDelete: boolean;
};

export default function LeadsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadIsLoading, setUploadIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState({
    phone: '',
    name: '',
    email: '',
    brand: '',
    source: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'text' | 'file'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [isBulkEnrichmentOpen, setIsBulkEnrichmentOpen] = useState(false);

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadFormData>({
    defaultValues: {
      sortOrder: 'oldest',
      autoDelete: false,
    },
  });

  const fetchLeads = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const allowedStatuses = ["pending", "contacted", "transferred", "completed", "failed"] as const;
      const statusFilter = allowedStatuses.includes(filterStatus as any) ? filterStatus as typeof allowedStatuses[number] : undefined;
      
      // Build search parameters
      const searchParams: any = {
        page,
        limit: 10,
        ...(statusFilter ? { status: statusFilter } : {})
      };

      // Add search fields if they have values
      if (searchQuery.phone) searchParams.phone = searchQuery.phone;
      if (searchQuery.name) searchParams.name = searchQuery.name;
      if (searchQuery.email) searchParams.email = searchQuery.email;
      if (searchQuery.brand) searchParams.brand = searchQuery.brand;
      if (searchQuery.source) searchParams.source = searchQuery.source;

      const response = await api.leads.list(searchParams);
      
      // Update state with pagination info
      setLeads(response.leads || []);
      setTotalPages(Math.ceil((response.totalCount || 0) / 10));
      setCurrentPage(page);
      setTotalLeads(response.totalCount || 0);
      
      // Extract unique statuses from the data for filter options
      if (!filterStatus) {
        const statuses = Array.from(new Set(response.leads.map((lead: Lead) => lead.status))) as string[];
        setUniqueStatuses(statuses);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  // Add debounced search handler
  const debouncedSearch = useCallback(
    debounce(() => {
      fetchLeads(1); // Reset to page 1 when search changes
    }, 500),
    [searchQuery]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchLeads(currentPage);
  }, [isAuthenticated, router, currentPage, filterStatus]);

  useEffect(() => {
    debouncedSearch();
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const onUploadSubmit = async (data: UploadFormData) => {
    setUploadIsLoading(true);
    
    try {
      const response = await api.leads.upload(data.fileContent, {
        sortOrder: data.sortOrder,
        autoDelete: data.autoDelete,
      });
      
      toast.success(response.data.message || 'Leads uploaded successfully');
      setIsUploading(false);
      fetchLeads(1); // Refresh leads
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload leads');
    } finally {
      setUploadIsLoading(false);
    }
  };

  const onCsvInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // We'll handle the CSV content directly in the form
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const file = e.target.files[0];
        const fileContent = await file.text();
        // Set the textarea content directly
        const formValues = { 
          fileContent,
          sortOrder: 'oldest' as const,
          autoDelete: false
        };
        
        await onUploadSubmit(formValues);
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error('Failed to read CSV file');
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      fetchLeads(page);
    }
  };

  // Function to format tags for display
  const formatTags = (lead: Lead): string[] => {
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

  // Handle lead selection for bulk operations
  const toggleLeadSelection = (lead: Lead, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedLeads(prev => {
      const isSelected = prev.some(l => l.id === lead.id);
      if (isSelected) {
        return prev.filter(l => l.id !== lead.id);
      } else {
        return [...prev, lead];
      }
    });
  };

  const selectAllLeads = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads([...leads]);
    }
  };

  const handleBulkEnrichment = () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select leads to enrich');
      return;
    }
    setIsBulkEnrichmentOpen(true);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Leads</h1>
          <div className="flex gap-2">
            <Button onClick={() => setIsUploading(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Leads
            </Button>
            {selectedLeads.length > 0 && (
              <Button onClick={handleBulkEnrichment} variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Enrich Selected ({selectedLeads.length})
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Search by phone"
                  value={searchQuery.phone}
                  onChange={(e) => setSearchQuery(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Search by name"
                  value={searchQuery.name}
                  onChange={(e) => setSearchQuery(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Search by email"
                  value={searchQuery.email}
                  onChange={(e) => setSearchQuery(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="Search by brand"
                  value={searchQuery.brand}
                  onChange={(e) => setSearchQuery(prev => ({ ...prev, brand: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  placeholder="Search by source"
                  value={searchQuery.source}
                  onChange={(e) => setSearchQuery(prev => ({ ...prev, source: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full p-2 border rounded-md"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {uniqueStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="p-4 border-b border-gray-200 sm:px-6">
              <div className="flex items-center justify-between flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Lead List</h3>
                  {leads.length > 0 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === leads.length}
                        onChange={selectAllLeads}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">Select All</span>
                    </div>
                  )}
                </div>
                {selectedLeads.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No leads</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by uploading some leads.</p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <li key={lead.id}>
                      <div 
                        className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                        onClick={() => router.push(`/leads/${lead.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 mr-3">
                              <input
                                type="checkbox"
                                checked={selectedLeads.some(l => l.id === lead.id)}
                                onChange={(e) => toggleLeadSelection(lead, e)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded border-gray-300"
                              />
                            </div>
                            <div className="flex-shrink-0">
                              <User className="h-10 w-10 rounded-full bg-gray-100 p-2 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-brand">{lead.name}</div>
                              <div className="text-sm text-gray-500">{lead.email}</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <a 
                              href={`tel:${lead.phone}`} 
                              className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-brand hover:bg-brand focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
                              onClick={(e) => e.stopPropagation()} // Prevent row click when clicking phone button
                            >
                              <PhoneOutgoing className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex sm:flex-wrap">
                            <p className="flex items-center text-sm text-gray-500">
                              <span className="truncate">{lead.phone}</span>
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <span className="ml-1">
                                {lead.attempts} {lead.attempts === 1 ? 'attempt' : 'attempts'}
                              </span>
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <span className="ml-1">
                                Age: {formatLeadAge(calculateLeadAge(lead.createdAt))}
                              </span>
                            </p>
                            {formatTags(lead).length > 0 && (
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                <Tag className="h-4 w-4 mr-1" />
                                <div className="flex flex-wrap gap-1">
                                  {formatTags(lead).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                              ${lead.status === 'new' ? 'bg-brand bg-opacity-10 text-brand' : 
                                lead.status === 'contacted' ? 'bg-brand bg-opacity-10 text-brand' :
                                lead.status === 'qualified' ? 'bg-brand bg-opacity-10 text-brand' :
                                lead.status === 'converted' ? 'bg-brand bg-opacity-10 text-brand' :
                                'bg-brand bg-opacity-10 text-brand'
                              }"
                            >
                              {lead.status === 'converted' ? (
                                <CheckCircle className="mr-1 h-3 w-3" />
                              ) : lead.status === 'rejected' ? (
                                <XCircle className="mr-1 h-3 w-3" />
                              ) : null}
                              {lead.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="secondary"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="secondary"
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * 10, totalLeads)}
                        </span> of{' '}
                        <span className="font-medium">{totalLeads}</span> leads
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-brand focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={`page-${i}-${pageNum}`}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                                ${currentPage === pageNum
                                  ? 'z-10 bg-brand bg-opacity-10 border-brand text-brand'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-brand focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bulk Enrichment Modal */}
        <BulkEnrichmentModal
          isOpen={isBulkEnrichmentOpen}
          onClose={() => setIsBulkEnrichmentOpen(false)}
          selectedLeads={selectedLeads}
          onEnrichmentComplete={() => {
            setSelectedLeads([]);
            fetchLeads(currentPage);
          }}
        />
      </div>
    </DashboardLayout>
  );
} 