'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageSquare, Trash2, Plus, Edit, FolderPlus, Folder } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';

type Template = {
  id: number;
  name: string;
  content: string;
  categoryId: number;
  category: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
};

type Category = {
  id: number;
  name: string;
  description: string;
  type: string;
};

export default function SmsTemplatesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    categoryId: '',
    variables: '',
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    type: 'sms',
  });

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.templates.list({
        type: 'sms',
        categoryId: selectedCategory || undefined,
      });
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.templates.listCategories('sms');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchTemplates();
    fetchCategories();
  }, [isAuthenticated, router, selectedCategory, fetchTemplates, fetchCategories]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTemplate.name || !newTemplate.content || !newTemplate.categoryId) {
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
        content: newTemplate.content,
        categoryId: parseInt(newTemplate.categoryId),
        variables,
        type: 'sms',
      });
      
      setTemplates([...templates, template.data]);
      toast.success('Template created successfully');
      setShowCreateForm(false);
      setNewTemplate({
        name: '',
        content: '',
        categoryId: '',
        variables: '',
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name) {
      toast.error('Please enter a category name');
      return;
    }
    
    setIsCreatingCategory(true);
    try {
      const category = await api.templates.createCategory(newCategory);
      setCategories([...categories, category.data]);
      toast.success('Category created successfully');
      setShowCategoryForm(false);
      setNewCategory({
        name: '',
        description: '',
        type: 'sms',
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await api.templates.delete(Number(id));
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

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all templates in this category.')) return;
    
    try {
      await api.templates.deleteCategory(Number(id));
      setCategories(categories.filter(c => c.id !== id));
      setTemplates(templates.filter(t => t.categoryId !== id));
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">SMS Templates</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your SMS templates and categories
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowCategoryForm(true)}
              variant="secondary"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Category
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="brand"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === null ? "brand" : "secondary"}
              onClick={() => setSelectedCategory(null)}
            >
              All Templates
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "brand" : "secondary"}
                onClick={() => setSelectedCategory(category.id)}
              >
                <Folder className="w-4 h-4 mr-2" />
                {category.name}
              </Button>
            ))}
          </div>
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
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
                      value={newTemplate.categoryId}
                      onChange={(e) => setNewTemplate({ ...newTemplate, categoryId: e.target.value })}
                      required
                    >
                      <option value="">Select a category</option>
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
                    variant="brand"
                    isLoading={isCreating}
                  >
                    Create Template
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Category Form */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-medium mb-4">Create New Category</h2>
              <form onSubmit={handleCreateCategory}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <Input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Category name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
                      rows={3}
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Category description"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCategoryForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="brand"
                    isLoading={isCreatingCategory}
                  >
                    Create Category
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
                    <p className="text-sm text-gray-500">{template.category}</p>
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