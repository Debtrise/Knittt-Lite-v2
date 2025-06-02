'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { TwilioNumber } from '@/types/sms';

export default function SmsNumbersPage() {
  const [numbers, setNumbers] = useState<TwilioNumber[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">SMS Numbers</h1>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Number
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phone Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={numbers} />
        </CardContent>
      </Card>
    </div>
  );
} 