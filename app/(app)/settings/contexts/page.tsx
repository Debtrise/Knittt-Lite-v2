'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Switch } from '@/app/components/ui/switch';
import { useAuthStore } from '@/app/store/authStore';
import api, { TenantContext } from '@/app/lib/api';
import { 
  ArrowLeft, Save, Plus, Edit, Trash2, TestTube, 
  CheckCircle, XCircle, AlertTriangle, Cog, 
  Activity, RefreshCw, Copy, Settings
} from 'lucide-react';
import Link from 'next/link';

interface ContextFormData {
  name: string;
  description: string;
  isActive: boolean;
  settings: {
    maxConcurrentCalls?: number;
    retryAttempts?: number;
    timeout?: number;
    priority?: number;
  };
}

export default function ContextsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [contexts, setContexts] = useState<TenantContext[]>([]);
  const [amiConfig, setAmiConfig] = useState<any>(null);
  const [editingContext, setEditingContext] = useState<TenantContext | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ContextFormData>({
    name: '',
    description: '',
    isActive: true,
    settings: {
      maxConcurrentCalls: 50,
      retryAttempts: 3,
      timeout: 30,
      priority: 1
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      router.push('/settings');
      return;
    }

    fetchContexts();
  }, [isAuthenticated, user, router]);

  const fetchContexts = async () => {
    setIsLoading(true);
    try {
      const response = await api.tenants.getContexts();
      
      // API returns { contexts: string[], amiConfig: {...} } directly
      if (response.data) {
        // Convert string array to TenantContext objects for compatibility with existing UI
        const contextObjects = response.data.contexts.map((name: string, index: number) => ({
          id: `context-${index}`,
          name,
          description: `AMI Context: ${name}`,
          isActive: true,
          settings: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        setContexts(contextObjects);
        setAmiConfig(response.data.amiConfig || null);
      }
    } catch (error) {
      console.error('Error fetching contexts:', error);
      toast.error('Failed to load contexts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast.error('Context name is required');
      return;
    }

    setIsSaving(true);
    try {
      const contextName = form.name.trim();

      let updatedContextNames;
      if (editingContext) {
        // Update existing context (replace the name)
        updatedContextNames = contexts.map(ctx => 
          ctx.id === editingContext.id ? contextName : ctx.name
        );
      } else {
        // Add new context
        const existingNames = contexts.map(ctx => ctx.name);
        if (existingNames.includes(contextName)) {
          toast.error('Context name already exists');
          return;
        }
        updatedContextNames = [...existingNames, contextName];
      }

      // API expects { contexts: string[] }
      await api.tenants.updateContexts({ contexts: updatedContextNames });
      
      toast.success(editingContext ? 'Context updated successfully' : 'Context created successfully');
      
      // Reset form and refresh data
      resetForm();
      await fetchContexts();
    } catch (error) {
      console.error('Error saving context:', error);
      toast.error('Failed to save context');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (context: TenantContext) => {
    setEditingContext(context);
    setForm({
      name: context.name,
      description: context.description || '',
      isActive: context.isActive,
      settings: context.settings as any || {
        maxConcurrentCalls: 50,
        retryAttempts: 3,
        timeout: 30,
        priority: 1
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (context: TenantContext) => {
    if (!confirm(`Are you sure you want to delete the context "${context.name}"?`)) {
      return;
    }

    try {
      const updatedContextNames = contexts
        .filter(ctx => ctx.id !== context.id)
        .map(ctx => ctx.name);
      
      await api.tenants.updateContexts({ contexts: updatedContextNames });
      
      toast.success('Context deleted successfully');
      await fetchContexts();
    } catch (error) {
      console.error('Error deleting context:', error);
      toast.error('Failed to delete context');
    }
  };

  // Note: Backend API only supports context names, not active/inactive status
  // Contexts are either in the list (active) or not (inactive)

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      isActive: true,
      settings: {
        maxConcurrentCalls: 50,
        retryAttempts: 3,
        timeout: 30,
        priority: 1
      }
    });
    setEditingContext(null);
    setShowForm(false);
  };

  const copyContextName = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success('Context name copied to clipboard');
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading contexts...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Settings
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Context Management</h1>
                <p className="text-gray-600 mt-1">Manage tenant AMI contexts for call routing</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Context</span>
            </Button>
          </div>

          <Tabs defaultValue="contexts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contexts">Contexts</TabsTrigger>
              <TabsTrigger value="ami-config">AMI Configuration</TabsTrigger>
            </TabsList>

            {/* Contexts Tab */}
            <TabsContent value="contexts" className="space-y-6">
              {/* Context List */}
              <div className="grid gap-4">
                {contexts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Cog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Contexts Found</h3>
                      <p className="text-gray-600 mb-4">Get started by creating your first context</p>
                      <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Context
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  contexts.map((context) => (
                    <Card key={context.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{context.name}</h3>
                            <Badge variant={context.isActive ? "default" : "secondary"}>
                              {context.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyContextName(context.name)}
                              className="p-1"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {context.description && (
                            <p className="text-gray-600 mb-3">{context.description}</p>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Max Calls:</span>
                              <p className="font-medium">{(context.settings as any)?.maxConcurrentCalls || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Retry Attempts:</span>
                              <p className="font-medium">{(context.settings as any)?.retryAttempts || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Timeout:</span>
                              <p className="font-medium">{(context.settings as any)?.timeout || 'N/A'}s</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Priority:</span>
                              <p className="font-medium">{(context.settings as any)?.priority || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={context.isActive}
                            onCheckedChange={() => handleToggleActive(context)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(context)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(context)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Context Form */}
              {showForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {editingContext ? 'Edit Context' : 'Add New Context'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Context Name *</Label>
                          <Input
                            id="name"
                            value={form.name}
                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., BDS_Prime_Dialer"
                            required
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-6">
                          <Switch
                            checked={form.isActive}
                            onCheckedChange={(checked) => setForm(prev => ({ ...prev, isActive: checked }))}
                          />
                          <Label>Active</Label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={form.description}
                          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Optional description for this context"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="maxCalls">Max Concurrent Calls</Label>
                          <Input
                            id="maxCalls"
                            type="number"
                            value={form.settings.maxConcurrentCalls || ''}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              settings: { ...prev.settings, maxConcurrentCalls: parseInt(e.target.value) || 50 }
                            }))}
                            min="1"
                            max="1000"
                          />
                        </div>

                        <div>
                          <Label htmlFor="retryAttempts">Retry Attempts</Label>
                          <Input
                            id="retryAttempts"
                            type="number"
                            value={form.settings.retryAttempts || ''}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              settings: { ...prev.settings, retryAttempts: parseInt(e.target.value) || 3 }
                            }))}
                            min="1"
                            max="10"
                          />
                        </div>

                        <div>
                          <Label htmlFor="timeout">Timeout (seconds)</Label>
                          <Input
                            id="timeout"
                            type="number"
                            value={form.settings.timeout || ''}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              settings: { ...prev.settings, timeout: parseInt(e.target.value) || 30 }
                            }))}
                            min="1"
                            max="300"
                          />
                        </div>

                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Input
                            id="priority"
                            type="number"
                            value={form.settings.priority || ''}
                            onChange={(e) => setForm(prev => ({
                              ...prev,
                              settings: { ...prev.settings, priority: parseInt(e.target.value) || 1 }
                            }))}
                            min="1"
                            max="10"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetForm}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              {editingContext ? 'Update' : 'Create'} Context
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* AMI Configuration Tab */}
            <TabsContent value="ami-config">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>AMI Connection Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {amiConfig ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        {amiConfig.connected ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-medium">
                          {amiConfig.connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Host:</span>
                          <p className="font-medium">{amiConfig.host}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Port:</span>
                          <p className="font-medium">{amiConfig.port}</p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={fetchContexts}
                        className="flex items-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh Status</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">AMI Configuration Not Found</h3>
                      <p className="text-gray-600">Configure AMI settings in PBX Settings</p>
                      <Link href="/settings/pbx">
                        <Button className="mt-4">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure PBX
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
} 