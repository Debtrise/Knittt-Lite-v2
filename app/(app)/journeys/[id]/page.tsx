'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Play, Pause, Edit, Trash2, Users } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useAuthStore } from '@/app/store/authStore';
import {
  getJourneyDetails,
  updateJourney,
  deleteJourney,
  listJourneySteps,
  createJourneyStep,
  updateJourneyStep,
  deleteJourneyStep,
  getJourneyLeads,
  enrollLeadsByCriteria,
  getJourneyMatchingStats
} from '@/app/utils/api';
import { Journey, JourneyStep, JourneyWithSteps, LeadJourney } from '@/app/types/journey';
import { BulkEnrollCriteria, JourneyMatchingStats } from '@/app/types/lead';

// Import our new components
import JourneyFlow from '@/app/components/journey-builder/JourneyFlow';
import StepEditor from '@/app/components/journey-builder/StepEditor';

export default function JourneyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const journeyId = parseInt(params.id, 10);
  
  const [journey, setJourney] = useState<JourneyWithSteps | null>(null);
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [leads, setLeads] = useState<LeadJourney[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('builder');
  
  const [showEditJourneyDialog, setShowEditJourneyDialog] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedStep, setSelectedStep] = useState<JourneyStep | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add new state for bulk enrollment
  const [showBulkEnrollDialog, setShowBulkEnrollDialog] = useState(false);
  const [bulkEnrollCriteria, setBulkEnrollCriteria] = useState<BulkEnrollCriteria>({
    brands: [],
    sources: [],
    leadStatus: [],
    leadTags: [],
    leadAgeDays: {
      min: undefined,
      max: undefined
    }
  });
  const [brandInput, setBrandInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [enrollLimit, setEnrollLimit] = useState(100);
  const [restartEnrollment, setRestartEnrollment] = useState(false);
  const [matchingStats, setMatchingStats] = useState<JourneyMatchingStats | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    autoEnroll: true,
    leadStatus: [] as string[],
    leadTags: [] as string[]
  });
  
  useEffect(() => {
    if (isAuthenticated && journeyId) {
      fetchJourneyDetails();
    }
  }, [isAuthenticated, journeyId]);
  
  // Add effect to fetch matching stats when bulk enroll dialog is opened
  useEffect(() => {
    if (showBulkEnrollDialog && journeyId) {
      fetchMatchingStats();
    }
  }, [showBulkEnrollDialog, journeyId, bulkEnrollCriteria]);
  
  const fetchMatchingStats = async () => {
    try {
      const stats = await getJourneyMatchingStats(journeyId);
      setMatchingStats(stats);
    } catch (error) {
      console.error('Error fetching matching stats:', error);
    }
  };
  
  const fetchJourneyDetails = async () => {
    try {
      setIsLoading(true);
      const journeyData = await getJourneyDetails(journeyId);
      setJourney(journeyData);
      
      // Fetch steps if not included in journeyData
      if (!journeyData.steps) {
        const stepsData = await listJourneySteps(journeyId);
        setSteps(stepsData);
      } else {
        setSteps(journeyData.steps);
      }
      
      // Fetch leads - API function now handles errors internally
      const leadsData = await getJourneyLeads(journeyId, { limit: 10 });
      setLeads(leadsData.leads || []);
    } catch (error) {
      console.error('Error fetching journey details:', error);
      toast.error('Failed to load journey details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleJourneyStatus = async () => {
    if (!journey) return;
    
    try {
      await updateJourney(journeyId, {
        isActive: !journey.isActive
      });
      toast.success(`Journey ${journey.isActive ? 'paused' : 'activated'} successfully`);
      fetchJourneyDetails();
    } catch (error) {
      console.error('Error updating journey status:', error);
      toast.error('Failed to update journey status');
    }
  };
  
  const openEditJourneyDialog = () => {
    if (!journey) return;
    
    setFormData({
      name: journey.name,
      description: journey.description,
      isActive: journey.isActive,
      autoEnroll: journey.triggerCriteria.autoEnroll,
      leadStatus: journey.triggerCriteria.leadStatus || [],
      leadTags: journey.triggerCriteria.leadTags || []
    });
    
    setShowEditJourneyDialog(true);
  };
  
  const handleUpdateJourney = async () => {
    if (!journey) return;
    
    try {
      setIsSubmitting(true);
      await updateJourney(journey.id, {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        triggerCriteria: {
          leadStatus: formData.leadStatus,
          leadTags: formData.leadTags,
          autoEnroll: formData.autoEnroll
        }
      });
      toast.success('Journey updated successfully');
      setShowEditJourneyDialog(false);
      fetchJourneyDetails();
    } catch (error) {
      console.error('Error updating journey:', error);
      toast.error('Failed to update journey');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteJourney = async () => {
    if (!journey) return;
    
    try {
      setIsSubmitting(true);
      await deleteJourney(journey.id);
      toast.success('Journey deleted successfully');
      router.push('/journeys');
    } catch (error) {
      console.error('Error deleting journey:', error);
      toast.error('Failed to delete journey');
      setIsSubmitting(false);
      setShowDeleteConfirmation(false);
    }
  };
  
  // Add bulk enrollment helper functions
  const addBrand = () => {
    if (brandInput && !bulkEnrollCriteria.brands?.includes(brandInput)) {
      setBulkEnrollCriteria({
        ...bulkEnrollCriteria,
        brands: [...(bulkEnrollCriteria.brands || []), brandInput]
      });
      setBrandInput('');
    }
  };
  
  const removeBrand = (brand: string) => {
    setBulkEnrollCriteria({
      ...bulkEnrollCriteria,
      brands: bulkEnrollCriteria.brands?.filter(b => b !== brand) || []
    });
  };
  
  const addSource = () => {
    if (sourceInput && !bulkEnrollCriteria.sources?.includes(sourceInput)) {
      setBulkEnrollCriteria({
        ...bulkEnrollCriteria,
        sources: [...(bulkEnrollCriteria.sources || []), sourceInput]
      });
      setSourceInput('');
    }
  };
  
  const removeSource = (source: string) => {
    setBulkEnrollCriteria({
      ...bulkEnrollCriteria,
      sources: bulkEnrollCriteria.sources?.filter(s => s !== source) || []
    });
  };
  
  const addStatus = () => {
    if (statusInput && !bulkEnrollCriteria.leadStatus?.includes(statusInput)) {
      setBulkEnrollCriteria({
        ...bulkEnrollCriteria,
        leadStatus: [...(bulkEnrollCriteria.leadStatus || []), statusInput]
      });
      setStatusInput('');
    }
  };
  
  const removeStatus = (status: string) => {
    setBulkEnrollCriteria({
      ...bulkEnrollCriteria,
      leadStatus: bulkEnrollCriteria.leadStatus?.filter(s => s !== status) || []
    });
  };
  
  const addTag = () => {
    if (tagInput && !bulkEnrollCriteria.leadTags?.includes(tagInput)) {
      setBulkEnrollCriteria({
        ...bulkEnrollCriteria,
        leadTags: [...(bulkEnrollCriteria.leadTags || []), tagInput]
      });
      setTagInput('');
    }
  };
  
  const removeTag = (tag: string) => {
    setBulkEnrollCriteria({
      ...bulkEnrollCriteria,
      leadTags: bulkEnrollCriteria.leadTags?.filter(t => t !== tag) || []
    });
  };
  
  const resetBulkEnrollForm = () => {
    setBulkEnrollCriteria({
      brands: [],
      sources: [],
      leadStatus: [],
      leadTags: [],
      leadAgeDays: {
        min: undefined,
        max: undefined
      }
    });
    setBrandInput('');
    setSourceInput('');
    setStatusInput('');
    setTagInput('');
    setEnrollLimit(100);
    setRestartEnrollment(false);
  };
  
  const handleBulkEnroll = async () => {
    try {
      setIsSubmitting(true);
      const result = await enrollLeadsByCriteria(journeyId, {
        criteria: bulkEnrollCriteria,
        restart: restartEnrollment,
        limit: enrollLimit
      });
      
      toast.success(`Successfully enrolled ${result.enrolledCount} leads`);
      setShowBulkEnrollDialog(false);
      resetBulkEnrollForm();
      fetchJourneyDetails();
    } catch (error) {
      console.error('Error enrolling leads:', error);
      toast.error('Failed to enroll leads');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isAuthenticated || !journey) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="flex items-center mb-6">
            <Link href="/journeys">
              <Button variant="secondary" className="mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isLoading ? 'Loading journey...' : 'Journey not found'}
            </h1>
          </div>
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Link href="/journeys">
              <Button variant="secondary" className="mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {journey.name}
              </h1>
              <p className="text-sm text-gray-500">
                {journey.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowBulkEnrollDialog(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Bulk Enroll
            </Button>
            <Button
              variant={journey.isActive ? "outline" : "secondary"}
              onClick={handleToggleJourneyStatus}
            >
              {journey.isActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={openEditJourneyDialog}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="builder">Flow Builder</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="builder" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Journey Flow</h2>
                  <JourneyFlow 
                    journey={journey}
                    onJourneyUpdated={fetchJourneyDetails}
                    onSelectStep={setSelectedStep}
                    selectedStep={selectedStep}
                  />
                </div>
              </div>
              
              <div>
                {selectedStep ? (
                  <StepEditor
                    step={selectedStep}
                    journeyId={journeyId}
                    onStepUpdated={fetchJourneyDetails}
                    onStepDeleted={() => {
                      fetchJourneyDetails();
                      setSelectedStep(null);
                    }}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Step Properties</CardTitle>
                      <CardDescription>
                        Select a step in the flow builder to edit its properties
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        Click on any step in the flow to view and edit its properties.
                        You can also add new steps using the + button in the flow builder.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={journey.isActive ? "default" : "secondary"} className="text-sm">
                    {journey.isActive ? 'Active' : 'Paused'}
                  </Badge>
                  <p className="text-sm text-gray-500 mt-2">
                    Last updated: {new Date(journey.updatedAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-2xl font-bold">{journey.activeLeadsCount || 0}</p>
                      <p className="text-sm text-gray-500">Active</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{journey.completedLeadsCount || 0}</p>
                      <p className="text-sm text-gray-500">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{journey.failedLeadsCount || 0}</p>
                      <p className="text-sm text-gray-500">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Enrollment Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Auto-enrollment:</p>
                      <p className="text-sm">
                        {journey.triggerCriteria.autoEnroll ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Lead Status:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {journey.triggerCriteria.leadStatus?.length ? (
                          journey.triggerCriteria.leadStatus.map(status => (
                            <Badge key={status} variant="outline" className="text-xs">
                              {status}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Any</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Lead Tags:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {journey.triggerCriteria.leadTags?.length ? (
                          journey.triggerCriteria.leadTags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Any</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="leads" className="mt-6">
            <div className="bg-white shadow rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Enrolled Leads</h2>
                  <Link href={`/journeys/${journeyId}/leads`}>
                    <Button>
                      <Users className="h-4 w-4 mr-2" />
                      Manage Leads
                    </Button>
                  </Link>
                </div>
              </div>
              
              {leads.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">
                    {isLoading ? 'Loading leads...' : 'No leads enrolled in this journey'}
                  </p>
                  {!isLoading && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={fetchJourneyDetails}
                    >
                      Retry Loading Leads
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leads.map((lead) => (
                        <tr key={lead.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={
                                lead.status === 'active' || lead.status === 'completed' ? 'default' :
                                lead.status === 'paused' ? 'secondary' :
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {leads.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <Link href={`/journeys/${journeyId}/leads`} className="text-sm text-indigo-600 hover:text-indigo-900">
                    View all enrolled leads →
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={showEditJourneyDialog} onOpenChange={setShowEditJourneyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Journey</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Journey name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Journey description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="edit-isActive" className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="form-checkbox h-4 w-4 text-indigo-600"
                />
                Active
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="edit-autoEnroll" className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="edit-autoEnroll"
                  checked={formData.autoEnroll}
                  onChange={(e) => setFormData({ ...formData, autoEnroll: e.target.checked })}
                  className="form-checkbox h-4 w-4 text-indigo-600"
                />
                Auto-enroll matching leads
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditJourneyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateJourney} disabled={!formData.name || isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Journey'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Journey</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-500">
              Are you sure you want to delete the journey "{journey?.name}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteJourney} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete Journey'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bulk Enroll Dialog */}
      <Dialog open={showBulkEnrollDialog} onOpenChange={setShowBulkEnrollDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Enroll Leads</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Enroll leads that match the specified criteria in this journey.
            </p>
            
            {matchingStats && (
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm font-medium">Matching Statistics</p>
                <p className="text-xs text-gray-500">
                  {matchingStats.matchingLeads} out of {matchingStats.totalLeads} leads match the current journey criteria
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Lead Age Criteria (Days)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulk-minAge" className="text-xs">Minimum Age</Label>
                    <Input
                      id="bulk-minAge"
                      type="number"
                      value={bulkEnrollCriteria.leadAgeDays?.min !== undefined ? bulkEnrollCriteria.leadAgeDays.min : ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                        setBulkEnrollCriteria({ 
                          ...bulkEnrollCriteria, 
                          leadAgeDays: { ...bulkEnrollCriteria.leadAgeDays, min: value } 
                        });
                      }}
                      placeholder="Min days"
                      min={0}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bulk-maxAge" className="text-xs">Maximum Age</Label>
                    <Input
                      id="bulk-maxAge"
                      type="number"
                      value={bulkEnrollCriteria.leadAgeDays?.max !== undefined ? bulkEnrollCriteria.leadAgeDays.max : ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                        setBulkEnrollCriteria({ 
                          ...bulkEnrollCriteria, 
                          leadAgeDays: { ...bulkEnrollCriteria.leadAgeDays, max: value } 
                        });
                      }}
                      placeholder="Max days"
                      min={0}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Lead Brands</Label>
                <div className="flex gap-2">
                  <Input
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    placeholder="Add brand"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBrand())}
                  />
                  <Button type="button" onClick={addBrand} variant="secondary">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bulkEnrollCriteria.brands?.map((brand) => (
                    <Badge key={brand} variant="outline" className="flex items-center gap-1">
                      {brand}
                      <button
                        type="button"
                        onClick={() => removeBrand(brand)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Lead Sources</Label>
                <div className="flex gap-2">
                  <Input
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value)}
                    placeholder="Add source"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSource())}
                  />
                  <Button type="button" onClick={addSource} variant="secondary">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bulkEnrollCriteria.sources?.map((source) => (
                    <Badge key={source} variant="outline" className="flex items-center gap-1">
                      {source}
                      <button
                        type="button"
                        onClick={() => removeSource(source)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Lead Status</Label>
                <div className="flex gap-2">
                  <Input
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    placeholder="Add status"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStatus())}
                  />
                  <Button type="button" onClick={addStatus} variant="secondary">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bulkEnrollCriteria.leadStatus?.map((status) => (
                    <Badge key={status} variant="outline" className="flex items-center gap-1">
                      {status}
                      <button
                        type="button"
                        onClick={() => removeStatus(status)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Max Leads to Enroll</Label>
                <Input
                  type="number"
                  value={enrollLimit}
                  onChange={(e) => setEnrollLimit(parseInt(e.target.value, 10) || 100)}
                  min={1}
                  max={500}
                />
                <p className="text-xs text-gray-500">Maximum number of leads to enroll in one operation (1-500)</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restart-enrollment"
                  checked={restartEnrollment}
                  onCheckedChange={(checked) => setRestartEnrollment(checked as boolean)}
                />
                <Label htmlFor="restart-enrollment">Restart for leads already in journey</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkEnrollDialog(false);
              resetBulkEnrollForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleBulkEnroll} disabled={isSubmitting}>
              {isSubmitting ? 'Enrolling...' : 'Enroll Leads'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
