'use client';

import DashboardLayout from '@/app/components/layout/Dashboard';
import WebhookForm from '../components/WebhookForm';

export default function CreateWebhookPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Create Webhook</h1>
        <WebhookForm />
      </div>
    </DashboardLayout>
  );
} 