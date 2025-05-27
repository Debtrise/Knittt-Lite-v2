'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, Mail, FileText } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { createReportTemplate, updateReportTemplate } from '@/app/utils/api';
import toast from 'react-hot-toast';

interface ReportTemplate {
  id?: string;
  name: string;
  type: 'call_summary' | 'sms_summary' | 'agent_performance' | 'lead_conversion' | 'journey_analytics' | 'custom';
  config: Record<string, any>;
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    timezone: string;
    format: 'pdf' | 'csv' | 'excel';
    recipients: string[];
  };
}

interface ReportTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: ReportTemplate | null;
  onSave: () => void;
}

export default function ReportTemplateModal({ isOpen, onClose, template, onSave }: ReportTemplateModalProps) {
  const [formData, setFormData] = useState<ReportTemplate>({
    name: '',
    type: 'call_summary',
    config: {},
    schedule: {
      enabled: false,
      frequency: 'daily',
      time: '09:00',
      timezone: 'UTC',
      format: 'pdf',
      recipients: []
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        name: '',
        type: 'call_summary',
        config: {},
        schedule: {
          enabled: false,
          frequency: 'daily',
          time: '09:00',
          timezone: 'UTC',
          format: 'pdf',
          recipients: []
        }
      });
    }
  }, [template]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setIsLoading(true);
    try {
      if (template?.id) {
        await updateReportTemplate(template.id, formData);
        toast.success('Template updated successfully');
      } else {
        await createReportTemplate(formData);
        toast.success('Template created successfully');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  const addRecipient = () => {
    if (recipientEmail.trim() && formData.schedule) {
      const newRecipients = [...formData.schedule.recipients, recipientEmail.trim()];
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule!,
          recipients: newRecipients
        }
      }));
      setRecipientEmail('');
    }
  };

  const removeRecipient = (index: number) => {
    if (formData.schedule) {
      const newRecipients = formData.schedule.recipients.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule!,
          recipients: newRecipients
        }
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {template ? 'Edit Template' : 'Create Report Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <option value="call_summary">Call Summary</option>
                  <option value="sms_summary">SMS Summary</option>
                  <option value="agent_performance">Agent Performance</option>
                  <option value="lead_conversion">Lead Conversion</option>
                  <option value="journey_analytics">Journey Analytics</option>
                  <option value="custom">Custom Report</option>
                </select>
              </div>
            </div>
          </div>

          {/* Report Configuration */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Configuration</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Date Range (Days)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.config.defaultDays || 7}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      config: { ...prev.config, defaultDays: parseInt(e.target.value) || 7 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group By
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.config.groupBy || 'day'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      config: { ...prev.config, groupBy: e.target.value }
                    }))}
                  >
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </div>
              </div>

              {formData.type === 'custom' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SQL Query
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                    value={formData.config.query || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      config: { ...prev.config, query: e.target.value }
                    }))}
                    placeholder="Enter your SQL query here..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Schedule Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="enableSchedule"
                className="rounded border-gray-300"
                checked={formData.schedule?.enabled || false}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  schedule: {
                    ...prev.schedule!,
                    enabled: e.target.checked
                  }
                }))}
              />
              <label htmlFor="enableSchedule" className="text-lg font-medium text-gray-900">
                Schedule Report
              </label>
            </div>

            {formData.schedule?.enabled && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formData.schedule.frequency}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        schedule: {
                          ...prev.schedule!,
                          frequency: e.target.value as any
                        }
                      }))}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formData.schedule.time}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        schedule: {
                          ...prev.schedule!,
                          time: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Format
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={formData.schedule.format}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        schedule: {
                          ...prev.schedule!,
                          format: e.target.value as any
                        }
                      }))}
                    >
                      <option value="pdf">PDF</option>
                      <option value="csv">CSV</option>
                      <option value="excel">Excel</option>
                    </select>
                  </div>
                </div>

                {/* Email Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Recipients
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="email"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="Enter email address"
                      onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRecipient}
                      className="flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {formData.schedule.recipients.map((email, index) => (
                      <div key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
                        <span className="text-sm">{email}</span>
                        <button
                          onClick={() => removeRecipient(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {template ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </div>
    </div>
  );
} 