'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../app/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/select';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { toast } from '../../components/ui/use-toast';
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneOff,
  Clock,
  Download,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { formatDuration, formatDate } from '../../lib/utils';
import api from '../../lib/api';

export default function CallsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Overview state with proper initialization
  const [overview, setOverview] = useState({
    stats: {
      total: 0,
      completed: 0,
      failed: 0,
      duration: 0,
      inbound: 0,
      outbound: 0
    },
    hourlyDistribution: [],
    topDids: [],
    calls: []
  });

  // Active calls
  const [activeCalls, setActiveCalls] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    leadId: '',
    didId: '',
    ingroup: '',
    context: '',
    callDirection: '',
    search: ''
  });

  // Fetch overview data
  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await api.callLogs.getOverview(filters);
      if (response?.data) {
        setOverview({
          stats: {
            total: response.data.stats?.total || 0,
            completed: response.data.stats?.completed || 0,
            failed: response.data.stats?.failed || 0,
            duration: response.data.stats?.duration || 0,
            inbound: response.data.stats?.inbound || 0,
            outbound: response.data.stats?.outbound || 0
          },
          hourlyDistribution: response.data.hourlyDistribution || [],
          topDids: response.data.topDids || [],
          calls: response.data.calls || []
        });
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalCount || 0);
      }
    } catch (err) {
      console.error('Error fetching overview:', err);
      toast.error('Failed to load call overview');
    } finally {
      setLoading(false);
    }
  };

  // Fetch active calls
  const fetchActiveCalls = async () => {
    try {
      const response = await api.callLogs.getActiveCalls();
      if (response?.data) {
        setActiveCalls(response.data);
      }
    } catch (err) {
      console.error('Error fetching active calls:', err);
    }
  };

  // Export logs
  const handleExport = async () => {
    try {
      const response = await api.callLogs.exportLogs(filters);
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-logs-${formatDate(new Date())}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting logs:', err);
      toast.error('Failed to export call logs');
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    setPage(1);
    fetchOverview();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      leadId: '',
      didId: '',
      ingroup: '',
      context: '',
      callDirection: '',
      search: ''
    });
    setPage(1);
    fetchOverview();
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchOverview();
    // Fetch active calls every 30 seconds
    const activeCallsInterval = setInterval(fetchActiveCalls, 30000);

    return () => clearInterval(activeCallsInterval);
  }, [isAuthenticated]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.stats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Calls</CardTitle>
            <PhoneIncoming className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.stats?.completed || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Calls</CardTitle>
            <PhoneOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.stats?.failed || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatDuration(overview.stats?.duration || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Calls */}
      {activeCalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Calls ({activeCalls.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeCalls.map((call: any) => (
                <div key={call.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <div>
                    <p className="font-medium">{call.phoneNumber}</p>
                    <p className="text-sm text-muted-foreground">{call.direction} • {call.context}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDuration(call.duration)}</p>
                    <p className="text-sm text-muted-foreground">{call.agent || 'No Agent'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label>Date Range</label>
              <DateRangePicker
                startDate={filters.startDate}
                endDate={filters.endDate}
                onStartDateChange={(date) => handleFilterChange('startDate', date)}
                onEndDateChange={(date) => handleFilterChange('endDate', date)}
              />
            </div>
            <div className="space-y-2">
              <label>Status</label>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="no-answer">No Answer</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label>Direction</label>
              <Select
                value={filters.callDirection}
                onChange={(e) => handleFilterChange('callDirection', e.target.value)}
              >
                <option value="">All</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label>Search</label>
              <Input
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search phone number..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Call Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Call Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : overview.calls?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">No calls found</TableCell>
                </TableRow>
              ) : (
                overview.calls?.map((call: any) => (
                  <TableRow key={call.id}>
                    <TableCell>{call.id}</TableCell>
                    <TableCell>{call.phoneNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {call.direction === 'inbound' ? (
                          <PhoneIncoming className="h-4 w-4 mr-2 text-green-500" />
                        ) : (
                          <PhoneOutgoing className="h-4 w-4 mr-2 text-blue-500" />
                        )}
                        {call.direction}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        call.status === 'completed' ? 'bg-green-100 text-green-800' :
                        call.status === 'failed' ? 'bg-red-100 text-red-800' :
                        call.status === 'no-answer' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {call.status}
                      </span>
                    </TableCell>
                    <TableCell>{formatDuration(call.duration || 0)}</TableCell>
                    <TableCell>{call.agent || '-'}</TableCell>
                    <TableCell>{call.context || '-'}</TableCell>
                    <TableCell>{formatDate(call.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {overview.calls?.length || 0} of {totalCount} calls
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 