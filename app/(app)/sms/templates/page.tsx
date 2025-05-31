'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageSquare, Trash2, Plus, Edit } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';

type Template = {
  id: number;
  name: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
};

export default function SmsTemplatesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    variables: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchTemplates();
  }, [isAuthenticated, router]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await api.templates.list({
        type: 'sms',
      });
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTemplate.name || !newTemplate.content) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsCreating(true);
    try {
      const variables = newTemplate.variables
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);
      
      const template = await api.templates.create({
        name: newTemplate.name,
        description: '',
        content: newTemplate.content,
        type: 'sms',
        isActive: true,
      });
      
      setTemplates([...templates, template.data]);
      toast.success('Template created successfully');
      setShowCreateForm(false);
      setNewTemplate({
        name: '',
        content: '',
        variables: '',
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await api.templates.delete(id.toString());
      setTemplates(templates.filter(t => t.id !== id));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleEditTemplate = (id: number) => {
    router.push(`/sms/templates/${id}`);
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">SMS Templates</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your SMS templates
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="default"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Create Template Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-lg font-medium mb-4">Create New Template</h2>
              <form onSubmit={handleCreateTemplate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <Input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Template name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Content</label>
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
                      rows={4}
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                      placeholder="Enter your template content. Use {{variable}} for variables."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Variables (comma-separated)</label>
                    <Input
                      type="text"
                      value={newTemplate.variables}
                      onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value })}
                      placeholder="name, phone, email"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    isLoading={isCreating}
                  >
                    Create Template
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Templates List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new template.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTemplate(template.id)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">{template.content}</p>
                {template.variables.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Variables:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.variables.map((variable) => (
                        <span
                          key={variable}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 text-xs text-gray-500">
                  Last updated: {new Date(template.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 