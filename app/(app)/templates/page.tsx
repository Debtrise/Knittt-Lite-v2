'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import api from '@/app/lib/api';

// Placeholder type for a template
interface Template {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'script';
  updatedAt: string;
}

const TEMPLATE_TYPES = [
  { label: 'All', value: '' },
  { label: 'SMS', value: 'sms' },
  { label: 'Email', value: 'email' },
  { label: 'Script', value: 'script' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Replace the placeholder useEffect with a real API call
  useEffect(() => {
    setLoading(true);
    api.templates.list({})
      .then(response => {
        console.log('API response:', response);
        const templatesData = response.data?.templates || [];
        setTemplates(templatesData);
      })
      .catch(error => {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredTemplates = templates.filter(t =>
    (!filterType || t.type === filterType) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <FileText className="w-7 h-7 mr-2 text-brand" />
              Templates
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage all your templates (SMS, Email, Script) here.
            </p>
          </div>
          <Link href="/templates/new">
            <Button variant="brand" className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </Link>
        </div>
        <div className="mb-4 flex gap-2 items-center">
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="ml-2 border rounded px-2 py-1 text-sm"
          >
            {TEMPLATE_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400">Loading templates...</td>
                  </tr>
                ) : filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400">No templates found.</td>
                  </tr>
                ) : (
                  filteredTemplates.map(template => (
                    <tr key={template.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{template.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">{template.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(template.updatedAt).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="ghost" size="icon" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 