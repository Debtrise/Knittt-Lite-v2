'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import api from '@/app/lib/api';

const EmailEditor = dynamic(() => import('react-email-editor'), { ssr: false });

type TemplateType = 'sms' | 'email' | 'script' | 'voicemail' | 'transfer';

const TEMPLATE_TYPES = [
  { label: 'SMS', value: 'sms' },
  { label: 'Email', value: 'email' },
  { label: 'Script', value: 'script' },
  { label: 'Voicemail', value: 'voicemail' },
  { label: 'Transfer', value: 'transfer' },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const [type, setType] = useState<TemplateType>('sms');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const emailEditorRef = useRef<any>(null);

  // For SMS live preview
  const smsPreview = content || 'Your SMS preview will appear here...';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let templateContent = content;
    if (type === 'email' && emailEditorRef.current) {
      // Export HTML from the email editor
      emailEditorRef.current.editor.exportHtml((data: any) => {
        templateContent = data.html;
        finishSave(templateContent);
      });
      return;
    }
    finishSave(templateContent);
  };

  const finishSave = (templateContent: string) => {
    api.templates.create({
      name,
      description: '',
      type,
      categoryId: 1,
      content: templateContent,
      isActive: true,
    })
      .then(() => {
        toast.success('Template created successfully');
        router.push('/templates');
      })
      .catch(error => {
        console.error('Error creating template:', error);
        toast.error('Failed to create template');
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <DashboardLayout>
      <div className="py-6 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center">
          <FileText className="w-7 h-7 mr-2 text-brand" />
          <h1 className="text-2xl font-semibold text-gray-900">New Template</h1>
        </div>
        <form onSubmit={handleSave} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as TemplateType)}
              className="border rounded px-3 py-2 w-full"
              required
            >
              {TEMPLATE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Template name"
              required
            />
          </div>
          {/* Content input switches by type */}
          {type === 'sms' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMS Content</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Enter SMS message..."
                rows={5}
                className="border rounded px-3 py-2 w-full font-mono"
                required
              />
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Live Preview</label>
                <div className="w-64 mx-auto bg-gray-100 rounded-2xl shadow-inner p-4 flex flex-col items-center border border-gray-300">
                  <div className="w-40 h-6 bg-gray-300 rounded-t-xl mb-2" />
                  <div className="w-full min-h-[60px] bg-white rounded-xl p-3 text-gray-900 text-sm flex items-center justify-center">
                    {smsPreview}
                  </div>
                  <div className="w-16 h-2 bg-gray-300 rounded-b-xl mt-2" />
                </div>
              </div>
            </div>
          )}
          {type === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Content</label>
              <div className="border rounded bg-gray-50 p-2 mb-2">
                <EmailEditor ref={emailEditorRef} minHeight={400} />
              </div>
            </div>
          )}
          {type === 'script' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Script Content</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Enter script content..."
                rows={8}
                className="border rounded px-3 py-2 w-full font-mono"
                required
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.push('/templates')}>Cancel</Button>
            <Button type="submit" variant="brand" disabled={saving}>
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 