'use client';

import { use } from 'react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import WebhookForm from '../../components/WebhookForm';

export default function EditWebhookPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const webhookId = parseInt(resolvedParams.id);
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Edit Webhook</h1>
        <WebhookForm webhookId={webhookId} isEdit={true} />
      </div>
    </DashboardLayout>
  );
} 