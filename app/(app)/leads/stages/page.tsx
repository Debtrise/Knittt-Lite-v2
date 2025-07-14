'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Save, X, Tag, Users, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { useAuthStore } from '@/app/store/authStore';
import api from '@/app/lib/api';

interface Stage {
  id: number;
  title: string;
  catalysts?: string[];
  createdAt: string;
  updatedAt: string;
  leadCount?: number;
}

interface CreateStageData {
  title: string;
  catalysts?: string[];
}

interface UpdateStageData {
  title: string;
  catalysts?: string[];
}

interface AssignStageData {
  stageId: number;
}

export default function StagesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreateForm,
    formState: { errors: createErrors },
  } = useForm<CreateStageData>();

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    formState: { errors: editErrors },
  } = useForm<UpdateStageData>();

  // Fetch stages
  const fetchStages = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/stages');
      setStages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
      toast.error('Failed to load stages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchStages();
  }, [isAuthenticated, router]);

  // Create stage
  const onCreateStage = async (data: CreateStageData) => {
    setIsCreating(true);
    try {
      const response = await api.post('/stages', data);
      toast.success('Stage created successfully');
      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchStages();
    } catch (error: any) {
      console.error('Error creating stage:', error);
      toast.error(error.response?.data?.error || 'Failed to create stage');
    } finally {
      setIsCreating(false);
    }
  };

  // Update stage
  const onUpdateStage = async (data: UpdateStageData) => {
    if (!editingStage) return;
    
    setIsUpdating(true);
    try {
      const response = await api.put(`/stages/${editingStage.id}`, data);
      toast.success('Stage updated successfully');
      setIsEditDialogOpen(false);
      setEditingStage(null);
      resetEditForm();
      fetchStages();
    } catch (error: any) {
      console.error('Error updating stage:', error);
      toast.error(error.response?.data?.error || 'Failed to update stage');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete stage
  const onDeleteStage = async (stageId: number) => {
    if (!confirm('Are you sure you want to delete this stage? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/stages/${stageId}`);
      toast.success('Stage deleted successfully');
      fetchStages();
    } catch (error: any) {
      console.error('Error deleting stage:', error);
      toast.error(error.response?.data?.error || 'Failed to delete stage');
    }
  };

  // Open edit dialog
  const openEditDialog = (stage: Stage) => {
    setEditingStage(stage);
    resetEditForm({
      title: stage.title,
      catalysts: stage.catalysts?.join('\n') || '',
    });
    setIsEditDialogOpen(true);
  };

  // Format catalysts for display
  const formatCatalysts = (catalysts?: string[]): string => {
    if (!catalysts || catalysts.length === 0) return 'No catalysts defined';
    return catalysts.join(', ');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Lead Stages</h1>
            <p className="text-gray-600 mt-1">Manage lead stages and their catalysts</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Stage
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Stage</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit(onCreateStage)} className="space-y-4">
                <div>
                  <Label htmlFor="title">Stage Title</Label>
                  <Input
                    id="title"
                    {...registerCreate('title', { required: 'Stage title is required' })}
                    placeholder="e.g., Qualified Lead, Proposal Sent"
                  />
                  {createErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{createErrors.title.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="catalysts">Catalysts (Optional)</Label>
                  <Textarea
                    id="catalysts"
                    {...registerCreate('catalysts')}
                    placeholder="Enter catalysts, one per line&#10;e.g.,&#10;Lead requested proposal&#10;Demo completed&#10;Budget approved"
                    rows={4}
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Catalysts are triggers that move a lead into this stage. Enter one per line.
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Stage'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        ) : stages.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stages created yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first stage to start organizing your leads by their progress in the sales funnel.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Stage
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {stages.map((stage) => (
              <Card key={stage.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{stage.title}</h3>
                        {stage.leadCount !== undefined && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {stage.leadCount} leads
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <strong>Catalysts:</strong> {formatCatalysts(stage.catalysts)}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Created: {new Date(stage.createdAt).toLocaleDateString()}
                        {stage.updatedAt !== stage.createdAt && (
                          <span className="ml-4">
                            Updated: {new Date(stage.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(stage)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteStage(stage.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Stage Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Stage</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit(onUpdateStage)} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Stage Title</Label>
                <Input
                  id="edit-title"
                  {...registerEdit('title', { required: 'Stage title is required' })}
                  placeholder="e.g., Qualified Lead, Proposal Sent"
                />
                {editErrors.title && (
                  <p className="text-red-500 text-sm mt-1">{editErrors.title.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-catalysts">Catalysts (Optional)</Label>
                <Textarea
                  id="edit-catalysts"
                  {...registerEdit('catalysts')}
                  placeholder="Enter catalysts, one per line&#10;e.g.,&#10;Lead requested proposal&#10;Demo completed&#10;Budget approved"
                  rows={4}
                />
                <p className="text-gray-500 text-sm mt-1">
                  Catalysts are triggers that move a lead into this stage. Enter one per line.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingStage(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Stage'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}