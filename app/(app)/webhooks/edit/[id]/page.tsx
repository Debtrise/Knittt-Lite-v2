'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/Dashboard';
import WebhookForm from '../../components/WebhookForm';
import { WebhookEndpoint } from '@/app/types/webhook';
import api from '@/app/lib/api';

export default function EditWebhookPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  if (!id) {
    router.push('/webhooks');
    return null;
  }
  
  return <EditWebhookClient webhookId={id} />;
}

function EditWebhookClient({ webhookId }: { webhookId: string }) {
  const [webhook, setWebhook] = useState<WebhookEndpoint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebhook = async () => {
      try {
        const response = await api.webhooks.get(webhookId);
        setWebhook(response.data);
      } catch (error) {
        console.error('Error fetching webhook:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebhook();
  }, [webhookId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!webhook) {
    return <div>Webhook not found</div>;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Edit Webhook</h1>
        <WebhookForm webhookId={webhookId} isEdit={true} />
      </div>
    </DashboardLayout>
  );
} 