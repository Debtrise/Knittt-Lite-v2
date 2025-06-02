'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import api from '@/app/lib/api';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, PhoneIcon, MailIcon, MapPinIcon, CalendarIcon } from 'lucide-react';

interface LeadDetailClientProps {
  leadId: number;
}

export default function LeadDetailClient({ leadId }: LeadDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!leadId) {
      router.push('/leads');
      return;
    }

    const fetchLeadData = async () => {
      try {
        const response = await api.leads.get(leadId.toString());
        setLead(response.data);
      } catch (error) {
        console.error('Error fetching lead:', error);
        toast.error('Failed to load lead details');
      } finally {
        setLoading(false);
      }
    };

    fetchLeadData();
  }, [leadId, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!lead) {
    return <div>Lead not found</div>;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Lead Details
            </h1>
            <p className="text-gray-500">View and manage lead information</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/leads')} 
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Leads
          </Button>
        </div>

        <Tabs 
          defaultValue="details" 
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="journeys">Journeys</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Information</CardTitle>
                <CardDescription>Basic information about this lead.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <Badge variant={lead.isActive ? "default" : "secondary"} className="mt-1">
                      {lead.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                    <p className="text-gray-900">
                      {new Date(lead.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="text-gray-900">{lead.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-500" />
                      <p className="text-gray-900">{lead.phone}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <div className="flex items-center gap-2">
                      <MailIcon className="h-4 w-4 text-gray-500" />
                      <p className="text-gray-900">{lead.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-500" />
                      <p className="text-gray-900">{lead.location || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {lead.tags && lead.tags.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {lead.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {lead.customFields && Object.keys(lead.customFields).length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Custom Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(lead.customFields).map(([key, value]) => (
                        <div key={key}>
                          <h4 className="text-sm font-medium text-gray-500">{key}</h4>
                          <p className="text-gray-900">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journeys" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Journey History</CardTitle>
                <CardDescription>Journeys this lead has been enrolled in.</CardDescription>
              </CardHeader>
              <CardContent>
                {lead.journeys && lead.journeys.length > 0 ? (
                  <div className="space-y-4">
                    {lead.journeys.map((journey: any) => (
                      <div key={journey.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{journey.name}</h4>
                            <p className="text-sm text-gray-500">{journey.description}</p>
                          </div>
                          <Badge variant={journey.status === 'active' ? 'default' : 'secondary'}>
                            {journey.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>Enrolled: {new Date(journey.enrolledAt).toLocaleString()}</span>
                          </div>
                          {journey.completedAt && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              <span>Completed: {new Date(journey.completedAt).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No journey history found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calls" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Call History</CardTitle>
                <CardDescription>Recorded calls with this lead.</CardDescription>
              </CardHeader>
              <CardContent>
                {lead.calls && lead.calls.length > 0 ? (
                  <div className="space-y-4">
                    {lead.calls.map((call: any) => (
                      <div key={call.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">Call #{call.id}</h4>
                            <p className="text-sm text-gray-500">
                              {call.dialplanName || 'Unknown Dialplan'}
                            </p>
                          </div>
                          <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                            {call.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{new Date(call.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <PhoneIcon className="h-4 w-4" />
                            <span>Duration: {call.duration}s</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No call history found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>SMS History</CardTitle>
                <CardDescription>Text messages sent to and from this lead.</CardDescription>
              </CardHeader>
              <CardContent>
                {lead.sms && lead.sms.length > 0 ? (
                  <div className="space-y-4">
                    {lead.sms.map((message: any) => (
                      <div key={message.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">Message #{message.id}</h4>
                            <p className="text-sm text-gray-500">
                              {message.campaignName || 'Unknown Campaign'}
                            </p>
                          </div>
                          <Badge variant={message.status === 'delivered' ? 'default' : 'secondary'}>
                            {message.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{new Date(message.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MailIcon className="h-4 w-4" />
                            <span>Direction: {message.direction}</span>
                          </div>
                        </div>
                        <div className="mt-2 p-3 bg-gray-50 rounded">
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No SMS history found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 