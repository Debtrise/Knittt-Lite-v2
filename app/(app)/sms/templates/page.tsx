'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';

type SmsTemplate = {
  id: number;
  name: string;
  content: string;
  category: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
};

export default function SmsTemplatesPage() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">SMS Templates</h1>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={templates} />
        </CardContent>
      </Card>
    </div>
  );
} 