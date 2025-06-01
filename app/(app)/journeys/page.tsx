'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Play, Pause, Users } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Button from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { useAuthStore } from '@/app/store/authStore';
import { listJourneys, createJourney, updateJourney, deleteJourney } from '@/app/utils/api';
import { Journey } from '@/app/types/journey';

export default function JourneysPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewJourneyDialog, setShowNewJourneyDialog] = useState(false);
  const [showEditJourneyDialog, setShowEditJourneyDialog] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    autoEnroll: true,
    leadStatus: [] as string[],
    leadTags: [] as string[],
    brands: [] as string[],
    sources: [] as string[],
    leadAgeDays: {
      min: undefined as number | undefined,
      max: undefined as number | undefined
    }
  });
  const [statusInput, setStatusInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [brandInput, setBrandInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchJourneys();
    }
  }, [isAuthenticated, currentPage]);

  const fetchJourneys = async () => {
    try {
      setIsLoading(true);
      const response = await listJourneys({
        page: currentPage,
        limit: 10
      });
      setJourneys(response.journeys || response);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error fetching journeys:', error);
      toast.error('Failed to load journeys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJourney = async () => {
    try {
      setIsSubmitting(true);
      await createJourney({
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        triggerCriteria: {
          leadStatus: formData.leadStatus,
          leadTags: formData.leadTags,
          brands: formData.brands.length > 0 ? formData.brands : undefined,
          sources: formData.sources.length > 0 ? formData.sources : undefined,
          leadAgeDays: (formData.leadAgeDays.min !== undefined || formData.leadAgeDays.max !== undefined) 
            ? formData.leadAgeDays 
            : undefined,
          autoEnroll: formData.autoEnroll
        }
      });
      toast.success('Journey created successfully');
      setShowNewJourneyDialog(false);
      resetForm();
      fetchJourneys();
    } catch (error) {
      console.error('Error creating journey:', error);
      toast.error('Failed to create journey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateJourney = async () => {
    if (!selectedJourney) return;
    
    try {
      setIsSubmitting(true);
      await updateJourney(selectedJourney.id, {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        triggerCriteria: {
          leadStatus: formData.leadStatus,
          leadTags: formData.leadTags,
          brands: formData.brands.length > 0 ? formData.brands : undefined,
          sources: formData.sources.length > 0 ? formData.sources : undefined,
          leadAgeDays: (formData.leadAgeDays.min !== undefined || formData.leadAgeDays.max !== undefined) 
            ? formData.leadAgeDays 
            : undefined,
          autoEnroll: formData.autoEnroll
        }
      });
      toast.success('Journey updated successfully');
      setShowEditJourneyDialog(false);
      resetForm();
      fetchJourneys();
    } catch (error) {
      console.error('Error updating journey:', error);
      toast.error('Failed to update journey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJourney = async () => {
    if (!selectedJourney) return;
    
    try {
      setIsSubmitting(true);
      await deleteJourney(selectedJourney.id);
      toast.success('Journey deleted successfully');
      setShowDeleteConfirmation(false);
      fetchJourneys();
    } catch (error) {
      console.error('Error deleting journey:', error);
      toast.error('Failed to delete journey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleJourneyStatus = async (journey: Journey) => {
    try {
      await updateJourney(journey.id, {
        isActive: !journey.isActive
      });
      toast.success(`Journey ${journey.isActive ? 'paused' : 'activated'} successfully`);
      fetchJourneys();
    } catch (error) {
      console.error('Error updating journey status:', error);
      toast.error('Failed to update journey status');
    }
  };

  const openEditDialog = (journey: Journey) => {
    setSelectedJourney(journey);
    setFormData({
      name: journey.name,
      description: journey.description,
      isActive: journey.isActive,
      autoEnroll: journey.triggerCriteria.autoEnroll,
      leadStatus: journey.triggerCriteria.leadStatus || [],
      leadTags: journey.triggerCriteria.leadTags || [],
      brands: journey.triggerCriteria.brands || [],
      sources: journey.triggerCriteria.sources || [],
      leadAgeDays: {
        min: journey.triggerCriteria.leadAgeDays?.min,
        max: journey.triggerCriteria.leadAgeDays?.max
      }
    });
    setShowEditJourneyDialog(true);
  };

  const openDeleteConfirmation = (journey: Journey) => {
    setSelectedJourney(journey);
    setShowDeleteConfirmation(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      autoEnroll: true,
      leadStatus: [],
      leadTags: [],
      brands: [],
      sources: [],
      leadAgeDays: {
        min: undefined,
        max: undefined
      }
    });
    setStatusInput('');
    setTagInput('');
    setBrandInput('');
    setSourceInput('');
    setSelectedJourney(null);
  };

  const addStatus = () => {
    if (statusInput && !formData.leadStatus.includes(statusInput)) {
      setFormData({
        ...formData,
        leadStatus: [...formData.leadStatus, statusInput]
      });
      setStatusInput('');
    }
  };

  const removeStatus = (status: string) => {
    setFormData({
      ...formData,
      leadStatus: formData.leadStatus.filter(s => s !== status)
    });
  };

  const addTag = () => {
    if (tagInput && !formData.leadTags.includes(tagInput)) {
      setFormData({
        ...formData,
        leadTags: [...formData.leadTags, tagInput]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      leadTags: formData.leadTags.filter(t => t !== tag)
    });
  };

  const addBrand = () => {
    if (brandInput && !formData.brands.includes(brandInput)) {
      setFormData({
        ...formData,
        brands: [...formData.brands, brandInput]
      });
      setBrandInput('');
    }
  };

  const removeBrand = (brand: string) => {
    setFormData({
      ...formData,
      brands: formData.brands.filter(b => b !== brand)
    });
  };

  const addSource = () => {
    if (sourceInput && !formData.sources.includes(sourceInput)) {
      setFormData({
        ...formData,
        sources: [...formData.sources, sourceInput]
      });
      setSourceInput('');
    }
  };

  const removeSource = (source: string) => {
    setFormData({
      ...formData,
      sources: formData.sources.filter(s => s !== source)
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Journeys</h1>
          <Button onClick={() => setShowNewJourneyDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Journey
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        ) : journeys.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-4">No journeys found</p>
            <Button onClick={() => setShowNewJourneyDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first journey
            </Button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leads
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {journeys.map((journey) => (
                  <tr key={journey.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            <Link href={`/journeys/${journey.id}`} className="hover:underline">
                              {journey.name}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {journey.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={journey.isActive ? "default" : "secondary"}>
                        {journey.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {journey.activeLeadsCount || 0} active
                      </div>
                      <div className="text-xs text-gray-500">
                        {journey.completedLeadsCount || 0} completed
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(journey.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleJourneyStatus(journey)}
                          title={journey.isActive ? 'Pause journey' : 'Activate journey'}
                        >
                          {journey.isActive ? (
                            <Pause className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Play className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Link href={`/journeys/${journey.id}/leads`}>
                          <Button variant="secondary" size="sm" title="View enrolled leads">
                            <Users className="h-4 w-4 text-blue-500" />
                          </Button>
                        </Link>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditDialog(journey)}
                          title="Edit journey"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openDeleteConfirmation(journey)}
                          title="Delete journey"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-brand text-white border-brand'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
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

      {/* Create Journey Dialog */}
      <Dialog open={showNewJourneyDialog} onOpenChange={setShowNewJourneyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Journey</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Journey name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Journey description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoEnroll"
                checked={formData.autoEnroll}
                onCheckedChange={(checked) => setFormData({ ...formData, autoEnroll: checked as boolean })}
              />
              <Label htmlFor="autoEnroll">Auto-enroll matching leads</Label>
            </div>
            <div className="grid gap-2">
              <Label>Lead Status Criteria</Label>
              <div className="flex gap-2">
                <Input
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  placeholder="Add lead status"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStatus())}
                />
                <Button type="button" onClick={addStatus} variant="secondary">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.leadStatus.map((status) => (
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
              <Label>Lead Tags Criteria</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add lead tag"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="secondary">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.leadTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      &times;
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Lead Age Criteria (Days)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minAge" className="text-xs">Minimum Age</Label>
                  <Input
                    id="minAge"
                    type="number"
                    value={formData.leadAgeDays.min !== undefined ? formData.leadAgeDays.min : ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      setFormData({ 
                        ...formData, 
                        leadAgeDays: { ...formData.leadAgeDays, min: value } 
                      });
                    }}
                    placeholder="Min days"
                    min={0}
                  />
                </div>
                <div>
                  <Label htmlFor="maxAge" className="text-xs">Maximum Age</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    value={formData.leadAgeDays.max !== undefined ? formData.leadAgeDays.max : ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      setFormData({ 
                        ...formData, 
                        leadAgeDays: { ...formData.leadAgeDays, max: value } 
                      });
                    }}
                    placeholder="Max days"
                    min={0}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Lead Brand Criteria</Label>
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
                {formData.brands.map((brand) => (
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
              <Label>Lead Source Criteria</Label>
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
                {formData.sources.map((source) => (
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewJourneyDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateJourney} disabled={!formData.name || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Journey'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Journey Dialog */}
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
              <Checkbox
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-autoEnroll"
                checked={formData.autoEnroll}
                onCheckedChange={(checked) => setFormData({ ...formData, autoEnroll: checked as boolean })}
              />
              <Label htmlFor="edit-autoEnroll">Auto-enroll matching leads</Label>
            </div>
            <div className="grid gap-2">
              <Label>Lead Status Criteria</Label>
              <div className="flex gap-2">
                <Input
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  placeholder="Add lead status"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStatus())}
                />
                <Button type="button" onClick={addStatus} variant="secondary">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.leadStatus.map((status) => (
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
              <Label>Lead Tags Criteria</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add lead tag"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="secondary">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.leadTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      &times;
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Lead Age Criteria (Days)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minAge" className="text-xs">Minimum Age</Label>
                  <Input
                    id="minAge"
                    type="number"
                    value={formData.leadAgeDays.min !== undefined ? formData.leadAgeDays.min : ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      setFormData({ 
                        ...formData, 
                        leadAgeDays: { ...formData.leadAgeDays, min: value } 
                      });
                    }}
                    placeholder="Min days"
                    min={0}
                  />
                </div>
                <div>
                  <Label htmlFor="maxAge" className="text-xs">Maximum Age</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    value={formData.leadAgeDays.max !== undefined ? formData.leadAgeDays.max : ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      setFormData({ 
                        ...formData, 
                        leadAgeDays: { ...formData.leadAgeDays, max: value } 
                      });
                    }}
                    placeholder="Max days"
                    min={0}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Lead Brand Criteria</Label>
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
                {formData.brands.map((brand) => (
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
              <Label>Lead Source Criteria</Label>
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
                {formData.sources.map((source) => (
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditJourneyDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateJourney} disabled={!formData.name || isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Journey'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Journey</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-500">
              Are you sure you want to delete the journey "{selectedJourney?.name}"? This action cannot be undone.
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
    </DashboardLayout>
  );
} 