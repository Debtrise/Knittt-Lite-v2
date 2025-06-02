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
import { DataTable } from '@/app/components/ui/data-table';
import { columns } from './columns';
import api from '@/app/lib/api';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon } from 'lucide-react';

interface JourneyLeadsClientProps {
  journeyId?: number;
}

export default function JourneyLeadsClient({ journeyId }: JourneyLeadsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [journey, setJourney] = useState<any>(null);

  useEffect(() => {
    if (!journeyId) {
      router.push('/journeys');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch journey details
        const journeyResponse = await api.journeys.get(journeyId.toString());
        setJourney(journeyResponse.data);

        // Fetch leads for this journey
        const leadsResponse = await api.journeys.getLeads(journeyId.toString());
        setLeads(leadsResponse.data.leads || []);
      } catch (error) {
        console.error('Error fetching journey leads:', error);
        toast.error('Failed to load journey leads');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [journeyId, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!journey) {
    return <div>Journey not found</div>;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {journey.name} - Leads
            </h1>
            <p className="text-gray-500">{journey.description}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/journeys')} 
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Journeys
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Journey Leads</CardTitle>
            <CardDescription>
              View and manage leads enrolled in this journey.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={leads}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 