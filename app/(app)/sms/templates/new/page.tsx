'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';

type Category = {
  id: number;
  name: string;
  description: string;
  type: string;
};

export default function NewTemplatePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState('');

  const [template, setTemplate] = useState({
    name: '',
    content: '',
    categoryId: '',
    variables: [] as string[],
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchCategories();
  }, [isAuthenticated, router]);

  const fetchCategories = async () => {
    try {
      const response = await api.templates.listCategories('sms');
      setCategories(response.categories || []);
      if (response.categories?.length > 0) {
        setTemplate(prev => ({ ...prev, categoryId: response.categories[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template.name || !template.content || !template.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      await api.templates.create({
        name: template.name,
        content: template.content,
        categoryId: parseInt(template.categoryId),
        variables: template.variables,
        type: 'sms',
      });
      toast.success('Template created successfully');
      router.push('/sms/templates');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (content: string) => {
    setTemplate(prev => ({ ...prev, content }));
    // Extract variables from content
    const variableRegex = /{{([^}]+)}}/g;
    const matches = content.match(variableRegex) || [];
    const variables = matches.map(match => match.slice(2, -2));
    setTemplate(prev => ({ ...prev, variables }));
    
    // Initialize preview variables for new variables
    const newPreviewVariables = { ...previewVariables };
    variables.forEach(variable => {
      if (!(variable in newPreviewVariables)) {
        newPreviewVariables[variable] = '';
      }
    });
    setPreviewVariables(newPreviewVariables);
  };

  const handlePreviewChange = (variable: string, value: string) => {
    setPreviewVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const generatePreview = () => {
    let content = template.content;
    Object.entries(previewVariables).forEach(([variable, value]) => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      content = content.replace(regex, value || `{{${variable}}}`);
    });
    setPreviewContent(content);
  };

  useEffect(() => {
    generatePreview();
  }, [previewVariables, template.content]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      </DashboardLayout>
    );
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
              <h1 className="text-2xl font-semibold text-gray-900">Create Template</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create a new SMS template
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
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Form */}
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
                onChange={(e) => setTemplate({ ...template, categoryId: e.target.value })}
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
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Enter your template content. Use {{variable}} for variables."
              />
              <p className="mt-1 text-xs text-gray-500">
                Use {{variable}} syntax to add variables to your template.
              </p>
            </div>

            {template.variables.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Variables</label>
                <div className="mt-2 space-y-2">
                  {template.variables.map((variable) => (
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
            )}
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{previewContent}</p>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                <p>Variables not filled in will show as {{variable}} in the preview.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 