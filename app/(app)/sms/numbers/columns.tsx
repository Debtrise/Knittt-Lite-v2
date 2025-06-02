'use client';

import { ColumnDef } from '@tanstack/react-table';
import { TwilioNumber } from '@/types/sms';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const columns: ColumnDef<TwilioNumber>[] = [
  {
    accessorKey: 'phoneNumber',
    header: 'Phone Number',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge variant={
          status === 'available' ? 'success' :
          status === 'in_use' ? 'warning' :
          'destructive'
        }>
          {status.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'messagesCount',
    header: 'Messages Sent',
  },
  {
    accessorKey: 'lastUsed',
    header: 'Last Used',
    cell: ({ row }) => {
      const lastUsed = row.getValue('lastUsed') as string | null;
      return lastUsed ? new Date(lastUsed).toLocaleDateString() : 'Never';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const number = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => window.location.href = `/sms/numbers/${number.id}`}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // Handle delete
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 