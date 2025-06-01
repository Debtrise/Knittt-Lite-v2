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
import { 
  TemplateType, 
  TemplateCategory, 
  CreateTemplateData, 
  TemplateCategoryListResponse 
} from '@/app/types/templates';

interface TemplateFormData extends Omit<CreateTemplateData, 'categoryId'> {
  categoryId: string; // We keep this as string for form handling, convert to number on submit
}

export default function NewTemplatePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState('');

  const [template, setTemplate] = useState<TemplateFormData>({
    name: '',
    content: '',
    categoryId: '',
    type: 'sms',
    isActive: true,
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
      const data = response.data as TemplateCategoryListResponse;
      setCategories(data.categories || []);
      if (data.categories?.length > 0) {
        setTemplate(prev => ({ ...prev, categoryId: data.categories[0].id.toString() }));
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
      const createData: CreateTemplateData = {
        ...template,
        categoryId: parseInt(template.categoryId),
      };

      await api.templates.create(createData);
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
              variant="brand"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Creating...' : 'Create Template'}
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
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
                value={template.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Template content. Use {{variable}} for dynamic content."
              />
              <p className="mt-2 text-sm text-gray-500">
                Use {'{{'} variable {'}}'}  syntax for dynamic content. Example: Hello {'{{'} name {'}}'}!
              </p>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Preview</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Fill in the variables below to preview the template
                </p>
              </div>

              {/* Variable inputs */}
              {Object.keys(previewVariables).length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Variables</h4>
                  {Object.entries(previewVariables).map(([variable, value]) => (
                    <div key={variable}>
                      <label className="block text-sm font-medium text-gray-700">
                        {variable}
                      </label>
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => handlePreviewChange(variable, e.target.value)}
                        placeholder={`Value for ${variable}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Preview content */}
              <div>
                <h4 className="text-sm font-medium text-gray-700">Result</h4>
                <div className="mt-1 p-4 rounded-md bg-gray-50 text-gray-900">
                  {previewContent || 'Preview will appear here'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 