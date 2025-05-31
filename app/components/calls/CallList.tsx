import React from 'react';
import { Button } from '@/app/components/ui/button';
import { List } from 'lucide-react';

type Call = {
  id: number;
  tenantId: string;
  leadId: number;
  from: string;
  to: string;
  transferNumber: string;
  startTime: string;
  endTime?: string;
  duration: number;
  status: string;
  Lead?: any;
};

type CallListProps = {
  calls: Call[];
  selectedCall: Call | null;
  loadingCall: boolean;
  isLoading: boolean;
  statusFilter: string;
  uniqueStatuses: string[];
  fetchCalls: () => void;
  handlePageChange: (newPage: number) => void;
  currentPage: number;
  totalPages: number;
  formatDateTime: (dateTimeStr: string) => string;
  formatDuration: (seconds: number) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  fetchCallDetails: (callId: number) => void;
  handleUpdateStatus: (callId: number, newStatus: string) => Promise<void>;
  isUpdatingStatus: boolean;
  setStatusFilter: (status: string) => void;
};

const CallList: React.FC<CallListProps> = ({
  calls,
  selectedCall,
  loadingCall,
  isLoading,
  statusFilter,
  uniqueStatuses,
  fetchCalls,
  handlePageChange,
  currentPage,
  totalPages,
  formatDateTime,
  formatDuration,
  getStatusIcon,
  fetchCallDetails,
  handleUpdateStatus,
  isUpdatingStatus,
  setStatusFilter,
}) => (
  <div className="bg-white rounded-lg shadow">
    <div className="p-4 border-b">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Call List</h2>
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={fetchCalls}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              From
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              To
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Start Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {calls.map((call) => (
            <tr key={call.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getStatusIcon(call.status)}
                  <span className="ml-2 text-sm text-gray-900">
                    {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {call.from}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {call.to}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDateTime(call.startTime)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDuration(call.duration)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <Button
                  type="button"
                  onClick={() => fetchCallDetails(call.id)}
                  disabled={loadingCall}
                >
                  Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {selectedCall && (
      <div className="p-4 border-t">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Call Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-sm font-medium text-gray-900">
              {selectedCall.status.charAt(0).toUpperCase() + selectedCall.status.slice(1)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDuration(selectedCall.duration)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">From</p>
            <p className="text-sm font-medium text-gray-900">{selectedCall.from}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">To</p>
            <p className="text-sm font-medium text-gray-900">{selectedCall.to}</p>
          </div>
          {selectedCall.transferNumber && (
            <div>
              <p className="text-sm text-gray-500">Transfer Number</p>
              <p className="text-sm font-medium text-gray-900">{selectedCall.transferNumber}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Start Time</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDateTime(selectedCall.startTime)}
            </p>
          </div>
          {selectedCall.endTime && (
            <div>
              <p className="text-sm text-gray-500">End Time</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDateTime(selectedCall.endTime)}
              </p>
            </div>
          )}
        </div>

        {selectedCall.status !== 'completed' && selectedCall.status !== 'failed' && (
          <div className="mt-4">
            <Button
              type="button"
              onClick={() => handleUpdateStatus(selectedCall.id, 'completed')}
              disabled={isUpdatingStatus}
            >
              Mark as Completed
            </Button>
          </div>
        )}
      </div>
    )}

    <div className="px-4 py-3 border-t">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Showing page {currentPage} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export default CallList; 