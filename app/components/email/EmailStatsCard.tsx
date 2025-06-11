'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { 
  Mail, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Calendar,
  Eye,
  MousePointer,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { email } from '@/app/lib/api';
import { EmailStats } from '@/app/types/email';
import toast from 'react-hot-toast';

interface EmailStatsCardProps {
  className?: string;
}

export default function EmailStatsCard({ className }: EmailStatsCardProps) {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const response = await email.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching email stats:', error);
      toast.error('Failed to load email statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resetDailyLimit = async () => {
    try {
      await email.resetDailyLimit();
      toast.success('Daily email limit reset successfully');
      fetchStats();
    } catch (error) {
      console.error('Error resetting daily limit:', error);
      toast.error('Failed to reset daily limit');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No email configuration found</p>
            <p className="text-sm mt-2">Configure your email provider to view statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const deliveryRate = stats.stats.sent > 0 ? ((stats.stats.delivered / stats.stats.sent) * 100).toFixed(1) : '0';
  const openRate = stats.stats.delivered > 0 ? ((stats.stats.opened / stats.stats.delivered) * 100).toFixed(1) : '0';
  const clickRate = stats.stats.delivered > 0 ? ((stats.stats.clicked / stats.stats.delivered) * 100).toFixed(1) : '0';
  const usagePercentage = ((stats.sentToday / stats.dailyLimit) * 100).toFixed(1);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Statistics
            <span className="text-sm font-normal text-gray-500">({stats.provider})</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Daily Usage</span>
            <span className="text-sm text-gray-500">
              {stats.sentToday} / {stats.dailyLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                Number(usagePercentage) >= 90 ? 'bg-red-500' : 
                Number(usagePercentage) >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(Number(usagePercentage), 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{usagePercentage}% used</span>
            <span>Reset: {stats.lastResetDate}</span>
          </div>
        </div>

        {/* Email Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Sent</span>
            </div>
            <div className="text-2xl font-bold">{stats.stats.sent.toLocaleString()}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Delivered</span>
            </div>
            <div className="text-2xl font-bold">{stats.stats.delivered.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{deliveryRate}% delivery rate</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Opened</span>
            </div>
            <div className="text-2xl font-bold">{stats.stats.opened.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{openRate}% open rate</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Clicked</span>
            </div>
            <div className="text-2xl font-bold">{stats.stats.clicked.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{clickRate}% click rate</div>
          </div>
        </div>

        {/* Issues */}
        {(stats.stats.bounced > 0 || stats.stats.failed > 0 || stats.stats.unsubscribed > 0) && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Issues
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {stats.stats.bounced > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Bounced</span>
                  <span className="text-red-600 font-medium">{stats.stats.bounced}</span>
                </div>
              )}
              {stats.stats.failed > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Failed</span>
                  <span className="text-red-600 font-medium">{stats.stats.failed}</span>
                </div>
              )}
              {stats.stats.unsubscribed > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Unsubscribed</span>
                  <span className="text-yellow-600 font-medium">{stats.stats.unsubscribed}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Actions */}
        <div className="border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={resetDailyLimit}
            className="w-full flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Daily Limit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 