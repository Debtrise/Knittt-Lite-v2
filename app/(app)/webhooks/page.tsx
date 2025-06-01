'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Button from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { WebhookEndpoint, WebhookListResponse } from '@/app/types/webhook';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { PlusIcon, RefreshCwIcon, TrashIcon, PencilIcon } from 'lucide-react';
import api from '@/app/lib/api';

export default function WebhooksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchWebhooks = async (page = 1, filter: { isActive?: boolean } = {}) => {
    setLoading(true);
    try {
      const response = await api.webhooks.list({
        page,
        limit: 10,
        ...filter,
      });
      
      // Handle different response structures
      const data = response.data || response;
      const webhookList = data.webhooks || data || [];
      
      setWebhooks(webhookList);
      setPaginationInfo({
        currentPage: data.currentPage || page,
        totalPages: data.totalPages || Math.ceil((data.totalCount || webhookList.length) / 10),
        totalCount: data.totalCount || webhookList.length,
      });
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    let filter = {};
    if (value === 'active') {
      filter = { isActive: true };
    } else if (value === 'inactive') {
      filter = { isActive: false };
    }
    fetchWebhooks(1, filter);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      try {
        await api.webhooks.delete(id.toString());
        toast.success('Webhook deleted successfully');
        fetchWebhooks(paginationInfo.currentPage);
      } catch (error) {
        console.error('Error deleting webhook:', error);
        toast.error('Failed to delete webhook');
      }
    }
  };

  const handleCreate = () => {
    router.push('/webhooks/create');
  };

  const handleEdit = (id: number) => {
    router.push(`/webhooks/edit/${id}`);
  };

  const handleView = (id: number) => {
    router.push(`/webhooks/${id}`);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Webhook Management</h1>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            <span>Create Webhook</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>
              Manage webhook endpoints that receive lead data from external systems.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Tabs 
                defaultValue="all" 
                value={activeFilter || 'all'}
                onValueChange={handleFilterChange}
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading webhooks...</div>
            ) : webhooks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No webhooks found</p>
                <Button onClick={handleCreate} variant="outline">
                  Create Your First Webhook
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand / Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Endpoint Key
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {webhooks.map((webhook) => (
                      <tr key={webhook.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleView(webhook.id)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{webhook.name}</div>
                          <div className="text-gray-500 text-sm">{webhook.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{webhook.brand}</div>
                          <div className="text-gray-500 text-sm">{webhook.source}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{webhook.endpointKey}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={webhook.isActive ? "default" : "secondary"}>
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(webhook.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(webhook.id);
                            }}
                            className="mr-2"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(webhook.id);
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              {!loading && webhooks.length > 0 && (
                <p className="text-sm text-gray-500">
                  Showing {webhooks.length} of {paginationInfo.totalCount} webhooks
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={paginationInfo.currentPage <= 1}
                onClick={() => fetchWebhooks(paginationInfo.currentPage - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={paginationInfo.currentPage >= paginationInfo.totalPages}
                onClick={() => fetchWebhooks(paginationInfo.currentPage + 1)}
              >
                Next
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => fetchWebhooks(paginationInfo.currentPage)}
                className="ml-2"
              >
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
} 