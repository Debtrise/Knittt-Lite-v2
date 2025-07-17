'use client';

import React from 'react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import EnhancedWebhookForm from '../../components/EnhancedWebhookForm';

export default function EditWebhookPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const webhookId = parseInt(resolvedParams.id);
  if (isNaN(webhookId)) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">Error</h1>
          <p className="text-red-500">Invalid webhook ID provided.</p>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Edit Webhook</h1>
        <EnhancedWebhookForm webhookId={webhookId} isEdit={true} />
      </div>
    </DashboardLayout>
  );
}

// This file is kept as a backup of the old edit page implementation
// The new implementation is in /webhooks/[id]/review/page.tsx 