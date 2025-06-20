'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useToast } from '@/app/components/ui/use-toast';
import { Loader2, History, BarChart } from 'lucide-react';
import { recordingsService } from '@/app/services/recordingsService';
import type { VoiceUsageStats, VoiceGenerationHistory } from '@/app/types/recordings';
import { formatDistanceToNow } from 'date-fns';

export default function VoiceUsagePage() {
  const { toast } = useToast();
  const [usageStats, setUsageStats] = useState<VoiceUsageStats | null>(null);
  const [generationHistory, setGenerationHistory] = useState<VoiceGenerationHistory | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsResponse, historyResponse] = await Promise.all([
        recordingsService.getVoiceUsageStats(selectedPeriod),
        recordingsService.getVoiceGenerationHistory()
      ]);
      setUsageStats(statsResponse);
      setGenerationHistory(historyResponse);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load usage data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Voice Usage & History</h1>
        <div className="flex items-center space-x-4">
          <Select
            value={selectedPeriod}
            onValueChange={(value: 'today' | 'week' | 'month' | 'all') => setSelectedPeriod(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadData}>
            <BarChart className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Characters Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.charactersUsed.toLocaleString()}</div>
              <div className="text-sm text-gray-500">
                of {usageStats.charactersLimit.toLocaleString()} limit
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${usageStats.usagePercentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Daily Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(usageStats.dailyAverage).toLocaleString()}</div>
              <div className="text-sm text-gray-500">characters per day</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Reset Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDistanceToNow(new Date(usageStats.resetDate), { addSuffix: true })}
              </div>
              <div className="text-sm text-gray-500">
                {usageStats.daysUntilReset} days remaining
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Projected Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usageStats.projectedMonthlyUsage.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                {usageStats.willExceedLimit ? 'Will exceed limit' : 'Within limit'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {generationHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Generation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Characters
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Text
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {generationHistory.history.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(item.generatedAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.type === 'recording' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.voiceName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.charactersUsed}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {item.text}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 