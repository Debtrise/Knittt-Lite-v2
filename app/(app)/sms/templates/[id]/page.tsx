'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Trash2, Eye } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useToast } from '@/app/components/ui/use-toast';
import { getTemplate, updateTemplate, deleteTemplate, renderPreview } from '@/app/utils/api';

type Template = {
  id: number;
  name: string;
  description: string;
  type: 'sms' | 'email' | 'transfer' | 'script' | 'voicemail';
  categoryId: number;
  subject?: string;
  content: string;
  htmlContent?: string;
  isActive: boolean;
  category: {
    id: number;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
  variables: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean';
    required: boolean;
    defaultValue?: string;
  }>;
};

type Category = {
  id: number;
  name: string;
  description: string;
  type: string;
};

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const templateId = params.id;
  const { isAuthenticated } = useAuthStore();
  const [template, setTemplate] = useState<Template | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchTemplate();
    fetchCategories();
  }, [isAuthenticated, router, templateId]);

  const fetchTemplate = async () => {
    setIsLoading(true);
    try {
      const response = await api.templates.get(parseInt(templateId));
      setTemplate(response.data);
      // Initialize preview variables
      const initialVariables: Record<string, string> = {};
      if (response.data.content) {
        const matches = response.data.content.match(/\{\{([^}]+)\}\}/g) || [];
        matches.forEach((match: string) => {
          const variable = match.replace(/[{}]/g, '');
          initialVariables[variable] = '';
        });
      }
      setPreviewVariables(initialVariables);
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.templates.listCategories('sms');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleSave = async () => {
    if (!template) return;
    
    setIsSaving(true);
    try {
      const updatedTemplate = await api.templates.update(parseInt(templateId), {
        name: template.name,
        description: template.description,
        content: template.content,
        type: template.type,
        categoryId: template.categoryId,
        subject: template.subject,
        htmlContent: template.htmlContent,
        isActive: template.isActive,
      });
      setTemplate(updatedTemplate.data);
      toast.success('Template updated successfully');
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.templates.delete(parseInt(templateId));
      toast.success('Template deleted successfully');
      router.push('/sms/templates');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handlePreviewChange = (variable: string, value: string) => {
    setPreviewVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const generatePreview = () => {
    if (!template) return;
    
    let content = template.content;
    Object.entries(previewVariables).forEach(([variable, value]) => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      content = content.replace(regex, value || `{{${variable}}}`);
    });
    setPreviewContent(content);
  };

  useEffect(() => {
    if (params.id) {
      fetchTemplate();
    }
  }, [params.id, fetchTemplate]);

  useEffect(() => {
    if (template?.content) {
      generatePreview();
    }
  }, [template?.content, generatePreview]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button
              variant="secondary"
              onClick={() => router.push('/sms/templates')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Template</h1>
              <p className="mt-1 text-sm text-gray-500">
                Update your SMS template
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="brand"
              onClick={handleSave}
              isLoading={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Edit Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <Input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                placeholder="Template name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
                value={template.categoryId}
                onChange={(e) => setTemplate({ ...template, categoryId: parseInt(e.target.value) })}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
                rows={6}
                value={template.content}
                onChange={(e) => setTemplate({ ...template, content: e.target.value })}
                placeholder="Enter your template content. Use {{variable}} for variables."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Variables</label>
              <div className="mt-2 space-y-2">
                {Object.keys(previewVariables).map((variable) => (
                  <div key={variable} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{variable}:</span>
                    <Input
                      type="text"
                      value={previewVariables[variable] || ''}
                      onChange={(e) => handlePreviewChange(variable, e.target.value)}
                      placeholder={`Enter ${variable}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{previewContent}</p>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                <p>Variables not filled in will show as {'{variable}'} in the preview.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 