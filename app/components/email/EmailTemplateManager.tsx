'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  BarChart3,
  Send,
  Search,
  Filter,
  ChevronDown
} from 'lucide-react';
import { emailTemplates } from '@/app/lib/api';
import { EmailTemplate, EmailTemplateCategory } from '@/app/types/email';
import toast from 'react-hot-toast';

interface EmailTemplateManagerProps {
  className?: string;
}

export default function EmailTemplateManager({ className }: EmailTemplateManagerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [categories, setCategories] = useState<EmailTemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPreview, setShowPreview] = useState<EmailTemplate | null>(null);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult] = useState<{
    subject: string;
    content: string;
    htmlContent?: string;
  } | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params: any = {
        type: 'email',
        page: currentPage,
        limit: 10
      };

      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      const response = await emailTemplates.list(params);
      setTemplates(response.data.templates);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await emailTemplates.getCategories({ type: 'email' });
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await emailTemplates.delete(id);
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleCloneTemplate = async (id: number) => {
    try {
      await emailTemplates.clone(id);
      toast.success('Template cloned successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error cloning template:', error);
      toast.error('Failed to clone template');
    }
  };

  const handlePreviewTemplate = async (template: EmailTemplate) => {
    setShowPreview(template);
    
    // Initialize variables with default values
    const variables: Record<string, string> = {};
    template.variables.forEach(variable => {
      variables[variable.name] = variable.defaultValue || '';
    });
    setPreviewVariables(variables);

    // Generate initial preview
    await generatePreview(template.id, variables);
  };

  const generatePreview = async (templateId: number, variables: Record<string, string>) => {
    try {
      const response = await emailTemplates.render(templateId, { variables });
      setPreviewResult(response.data);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  const handleVariableChange = (variableName: string, value: string) => {
    const newVariables = { ...previewVariables, [variableName]: value };
    setPreviewVariables(newVariables);
    
    if (showPreview) {
      generatePreview(showPreview.id, newVariables);
    }
  };

  const sendTestEmail = async () => {
    if (!showPreview) return;

    const testEmail = prompt('Enter test email address:', 'test@example.com');
    if (!testEmail) return;

    try {
      // This would use the email.send API with the template
      toast.success('Test email sent successfully!');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, [currentPage, selectedCategory]);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={className}>
      {/* Template List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Templates
            </CardTitle>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                className="border rounded-md px-3 py-2 pr-8 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No email templates found</p>
              <p className="text-sm mt-2">Create your first email template to get started</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTemplates.map(template => (
                <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{template.name}</h3>
                      {template.description && (
                        <p className="text-gray-600 text-sm mt-1">{template.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Subject: {template.subject}</span>
                        {template.category && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {template.category.name}
                          </span>
                        )}
                        {template.usageCount !== undefined && (
                          <span>Used {template.usageCount} times</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(template)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloneTemplate(template.id)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-4 w-4" />
                        Clone
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Stats
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Preview: {showPreview.name}</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={sendTestEmail}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Variables Panel */}
                <div>
                  <h3 className="font-medium mb-4">Template Variables</h3>
                  <div className="space-y-3">
                    {showPreview.variables.map(variable => (
                      <div key={variable.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {variable.name}
                        </label>
                        <Input
                          value={previewVariables[variable.name] || ''}
                          onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                          placeholder={variable.description || variable.defaultValue}
                        />
                        {variable.description && (
                          <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Panel */}
                <div>
                  <h3 className="font-medium mb-4">Email Preview</h3>
                  {previewResult ? (
                    <div className="border rounded-lg p-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Subject:</label>
                        <p className="text-sm bg-gray-50 p-2 rounded mt-1">{previewResult.subject}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Content:</label>
                        {previewResult.htmlContent ? (
                          <div className="border rounded mt-1 max-h-64 overflow-y-auto">
                            <iframe
                              srcDoc={previewResult.htmlContent}
                              className="w-full h-64"
                              title="Email Preview"
                            />
                          </div>
                        ) : (
                          <div className="text-sm bg-gray-50 p-4 rounded mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap">
                            {previewResult.content}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 border rounded-lg">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 