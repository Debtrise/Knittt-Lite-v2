'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Plus, Play, Pause, Edit, Trash2, Users, 
  Save, Eye, Settings, Layers, History, Maximize2, Minimize2,
  PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose,
  Zap, Layout, FileText, Clock, Target, Activity, BarChart3
} from 'lucide-react';
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
import { Separator } from '@/app/components/ui/separator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
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
import { ReactFlowProvider } from 'reactflow';

export default function JourneyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  // Handle params as a Promise for future Next.js compatibility
  const resolvedParams = React.use ? React.use(params) : params;
  const journeyId = parseInt(resolvedParams.id, 10);
  
  const [journey, setJourney] = useState<JourneyWithSteps | null>(null);
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [leads, setLeads] = useState<LeadJourney[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('builder');
  
  // Enhanced UI State for full-screen layout
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true); // Default to fullscreen for journey builder
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showJourneySettings, setShowJourneySettings] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSave, setLastSave] = useState<Date | null>(null);
  
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
  const [enrollLimit, setEnrollLimit] = useState(10000); // High default for "unlimited"
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
      
      if (autoSave) {
        setLastSave(new Date());
      }
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
    setEnrollLimit(10000);
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

  // Auto-save functionality
  const handleSave = async () => {
    if (!journey) return;
    
    try {
      setIsSubmitting(true);
      await updateJourney(journeyId, {
        name: journey.name,
        description: journey.description,
        isActive: journey.isActive
      });
      setLastSave(new Date());
      toast.success('Journey saved successfully');
    } catch (error) {
      console.error('Error saving journey:', error);
      toast.error('Failed to save journey');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !journey) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex items-center mb-6">
            <Link href="/journeys">
              <Button variant="ghost" className="mr-4">
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
      </div>
    );
  }

  return (
    <div 
      className={`h-screen w-full flex flex-col bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ 
        touchAction: 'manipulation',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Enhanced Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left Section - Journey Info & Controls */}
          <div className="flex items-center space-x-2 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              {!isFullscreen && (
                <Link href="/journeys">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[200px]">
                {journey.name}
              </h1>
              <Badge variant={journey.isActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
                {journey.isActive ? 'Active' : 'Paused'}
              </Badge>
              {lastSave && (
                <Badge variant="outline" className="bg-green-50 text-green-700 text-xs flex-shrink-0">
                  Saved {lastSave.toLocaleTimeString()}
                </Badge>
              )}
            </div>
            
            <Separator orientation="vertical" className="h-5 hidden md:block" />
            
            {/* Quick Journey Actions */}
            <div className="flex items-center space-x-1 hidden md:flex">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleToggleJourneyStatus}
                      className="h-9 w-9 p-0"
                    >
                      {journey.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{journey.isActive ? 'Pause Journey' : 'Activate Journey'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowBulkEnrollDialog(true)}
                      className="h-9 w-9 p-0"
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bulk Enroll Leads</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAnalytics(!showAnalytics)}
                      className="h-9 w-9 p-0"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Journey Analytics</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Right Section - Main Actions */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openEditJourneyDialog}
              className="h-9 hidden md:flex"
            >
              <Edit className="w-4 h-4 mr-1" />
              <span className="hidden lg:inline">Edit</span>
            </Button>
            
            <Button 
              onClick={handleSave} 
              size="sm" 
              className={`h-9 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              <span className="hidden md:inline">Save</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className="h-9 w-9 p-0"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        {/* Enhanced Left Sidebar - Journey Steps & Tools */}
        <div className={`${leftPanelCollapsed ? 'w-12' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0`}>
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            {!leftPanelCollapsed && (
              <h2 className="font-medium text-gray-900 text-sm">Journey Tools</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="h-8 w-8 p-0"
            >
              {leftPanelCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>
          </div>

          {!leftPanelCollapsed && (
            <div className="flex-1 flex flex-col min-h-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 m-3 mb-0">
                  <TabsTrigger value="builder" className="text-xs">
                    <Layout className="w-3 h-3 mr-1" />
                    Builder
                  </TabsTrigger>
                  <TabsTrigger value="overview" className="text-xs">
                    <Target className="w-3 h-3 mr-1" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="leads" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Leads
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="builder" className="flex-1 p-3 pt-2 overflow-auto">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Journey Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Status:</span>
                          <Badge variant={journey.isActive ? "default" : "secondary"} className="text-xs">
                            {journey.isActive ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Steps:</span>
                          <span className="text-xs font-medium">{steps.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Active Leads:</span>
                          <span className="text-xs font-medium">{journey.activeLeadsCount || 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start text-xs"
                          onClick={handleToggleJourneyStatus}
                        >
                          {journey.isActive ? <Pause className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                          {journey.isActive ? 'Pause Journey' : 'Activate Journey'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start text-xs"
                          onClick={() => setShowBulkEnrollDialog(true)}
                        >
                          <Users className="w-3 h-3 mr-2" />
                          Bulk Enroll Leads
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start text-xs"
                          onClick={openEditJourneyDialog}
                        >
                          <Edit className="w-3 h-3 mr-2" />
                          Edit Journey
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="overview" className="flex-1 p-3 pt-2 overflow-auto">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Lead Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-bold text-blue-700">{journey.activeLeadsCount || 0}</div>
                            <div className="text-blue-600">Active</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-bold text-green-700">{journey.completedLeadsCount || 0}</div>
                            <div className="text-green-600">Completed</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Enrollment Criteria</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-xs">
                          <div className="font-medium text-gray-700">Auto-enrollment:</div>
                          <div className="text-gray-600">
                            {journey.triggerCriteria.autoEnroll ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                        
                        {journey.triggerCriteria.leadStatus?.length > 0 && (
                          <div className="text-xs">
                            <div className="font-medium text-gray-700">Lead Status:</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {journey.triggerCriteria.leadStatus.map(status => (
                                <Badge key={status} variant="outline" className="text-xs">
                                  {status}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="leads" className="flex-1 p-3 pt-2 overflow-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Recent Leads</h3>
                      <Link href={`/journeys/${journeyId}/leads`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          View All
                        </Button>
                      </Link>
                    </div>
                    
                    {leads.slice(0, 5).map((lead) => (
                      <Card key={lead.id} className="p-2">
                        <div className="text-xs">
                          <div className="font-medium truncate">
                            {lead.Lead?.name || `Lead #${lead.leadId}`}
                          </div>
                          <div className="text-gray-500 truncate">
                            Step: {lead.JourneyStep?.actionType || 'Unknown'}
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    {leads.length === 0 && (
                      <div className="text-center py-4 text-xs text-gray-500">
                        No leads enrolled
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Main Journey Builder Canvas */}
        <div className="flex-1 flex flex-col min-h-0 bg-gray-100 w-0 overflow-hidden">
          <ReactFlowProvider>
            <JourneyFlow 
              journey={journey}
              onJourneyUpdated={fetchJourneyDetails}
              onSelectStep={setSelectedStep}
              selectedStep={selectedStep}
            />
          </ReactFlowProvider>
        </div>

        {/* Enhanced Right Sidebar - Step Properties */}
        <div className={`${rightPanelCollapsed ? 'w-12' : 'w-80'} bg-white border-l border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0`}>
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            {!rightPanelCollapsed && (
              <h2 className="font-medium text-gray-900 text-sm">Step Properties</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              className="h-8 w-8 p-0"
            >
              {rightPanelCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
            </Button>
          </div>

          {!rightPanelCollapsed && (
            <div className="flex-1 overflow-auto">
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
                <div className="p-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">No Step Selected</CardTitle>
                      <CardDescription className="text-xs">
                        Click on a step in the journey flow to edit its properties
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-500">
                        Select any step in the flow to view and modify its configuration.
                        You can also add new steps using the + button in the flow.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
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
            <Button variant="destructive" onClick={handleDeleteJourney} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete Journey'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bulk Enroll Dialog */}
      <Dialog open={showBulkEnrollDialog} onOpenChange={setShowBulkEnrollDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Enroll Leads</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Lead Brands</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    placeholder="Enter brand name"
                    onKeyPress={(e) => e.key === 'Enter' && addBrand()}
                  />
                  <Button type="button" onClick={addBrand} size="sm">Add</Button>
                </div>
                {bulkEnrollCriteria.brands && bulkEnrollCriteria.brands.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bulkEnrollCriteria.brands.map(brand => (
                      <Badge key={brand} variant="outline" className="text-xs">
                        {brand}
                        <button onClick={() => removeBrand(brand)} className="ml-1 text-red-500">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Lead Sources</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value)}
                    placeholder="Enter lead source"
                    onKeyPress={(e) => e.key === 'Enter' && addSource()}
                  />
                  <Button type="button" onClick={addSource} size="sm">Add</Button>
                </div>
                {bulkEnrollCriteria.sources && bulkEnrollCriteria.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bulkEnrollCriteria.sources.map(source => (
                      <Badge key={source} variant="outline" className="text-xs">
                        {source}
                        <button onClick={() => removeSource(source)} className="ml-1 text-red-500">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Lead Status</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    placeholder="Enter lead status"
                    onKeyPress={(e) => e.key === 'Enter' && addStatus()}
                  />
                  <Button type="button" onClick={addStatus} size="sm">Add</Button>
                </div>
                {bulkEnrollCriteria.leadStatus && bulkEnrollCriteria.leadStatus.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bulkEnrollCriteria.leadStatus.map(status => (
                      <Badge key={status} variant="outline" className="text-xs">
                        {status}
                        <button onClick={() => removeStatus(status)} className="ml-1 text-red-500">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Lead Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Enter lead tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" onClick={addTag} size="sm">Add</Button>
                </div>
                {bulkEnrollCriteria.leadTags && bulkEnrollCriteria.leadTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bulkEnrollCriteria.leadTags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-1 text-red-500">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Lead Age (days)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={9999}
                    step={1}
                    value={bulkEnrollCriteria.leadAgeDays?.min || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numericValue = value ? parseInt(value, 10) : undefined;
                      
                      // Only update if it's a valid number or empty
                      if (value === '' || (!isNaN(numericValue!) && numericValue! >= 0)) {
                        setBulkEnrollCriteria({
                          ...bulkEnrollCriteria,
                          leadAgeDays: {
                            ...bulkEnrollCriteria.leadAgeDays,
                            min: numericValue
                          }
                        });
                      }
                    }}
                    placeholder="Min age"
                  />
                </div>
                <div>
                  <Label>Max Lead Age (days)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={9999}
                    step={1}
                    value={bulkEnrollCriteria.leadAgeDays?.max || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numericValue = value ? parseInt(value, 10) : undefined;
                      
                      // Only update if it's a valid number or empty
                      if (value === '' || (!isNaN(numericValue!) && numericValue! >= 0)) {
                        setBulkEnrollCriteria({
                          ...bulkEnrollCriteria,
                          leadAgeDays: {
                            ...bulkEnrollCriteria.leadAgeDays,
                            max: numericValue
                          }
                        });
                      }
                    }}
                    placeholder="Max age"
                  />
                </div>
              </div>

              <div>
                <Label>Enrollment Limit</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={enrollLimit}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numericValue = parseInt(value, 10);
                    
                    // Only update if it's a valid positive number
                    if (!isNaN(numericValue) && numericValue > 0) {
                      setEnrollLimit(Math.max(1, numericValue));
                    } else if (value === '') {
                      setEnrollLimit(10000); // Set to high default for "unlimited"
                    }
                  }}
                  placeholder="Number of leads to enroll (leave high for unlimited)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set to a high number (e.g., 10,000+) for unlimited enrollment of all matching leads
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restart-enrollment"
                  checked={restartEnrollment}
                  onCheckedChange={setRestartEnrollment}
                />
                <Label htmlFor="restart-enrollment">Restart enrollment for already enrolled leads</Label>
              </div>

              {matchingStats && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">
                    Found {matchingStats.totalMatching} matching leads
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkEnrollDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkEnroll} disabled={isSubmitting}>
              {isSubmitting ? 'Enrolling...' : 'Enroll Leads'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
