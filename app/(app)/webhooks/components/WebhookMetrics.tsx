'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  getAnnouncementMetrics, 
  getPauseResumeStats, 
  getWebhookEvents, 
  getExecutionLog,
  getPausedLeads 
} from '@/app/utils/api';
import { WebhookEndpoint } from '@/app/types/webhook';
import { toast } from 'react-hot-toast';
import { 
  Play, 
  Pause, 
  Square, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  BarChart3,
  Activity
} from 'lucide-react';

interface WebhookMetricsProps {
  webhook: WebhookEndpoint;
}

interface AnnouncementMetric {
  id: string;
  webhookEventId: number;
  announcementStartTime: string;
  totalDuration: number;
  successfulDisplays: number;
  failedDisplays: number;
  displayIds: string[];
  variablesInjected: Record<string, any>;
  contentGenerationTime: number;
  processingTime: number;
  contentId?: string;
  errors?: string[];
  createdAt: string;
}

interface PauseResumeStats {
  totalPaused: number;
  totalResumed: number;
  currentlyPaused: number;
  averagePauseDuration: number;
  pauseReasons: Record<string, number>;
  resumeReasons: Record<string, number>;
  pausesByDay: Array<{ date: string; paused: number; resumed: number }>;
}

interface WebhookEvent {
  id: number;
  status: 'success' | 'failed' | 'partial_success';
  receivedAt: string;
  processingTime: number;
  createdLeadIds: number[];
  affectedLeadIds: number[];
  errorMessage?: string;
  pauseResumeActions?: any;
  stopActions?: any;
  announcementActions?: any;
}

export default function WebhookMetrics({ webhook }: WebhookMetricsProps) {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  // State for different metric types
  const [announcementMetrics, setAnnouncementMetrics] = useState<AnnouncementMetric[]>([]);
  const [pauseResumeStats, setPauseResumeStats] = useState<PauseResumeStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<WebhookEvent[]>([]);
  const [pausedLeads, setPausedLeads] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalEvents: 0,
    successRate: 0,
    averageProcessingTime: 0,
    totalLeadsAffected: 0
  });

  useEffect(() => {
    fetchMetrics();
  }, [webhook.id, dateRange]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverallStats(),
        fetchRecentEvents(),
        webhook.webhookType === 'announcement' && fetchAnnouncementMetrics(),
        webhook.webhookType === 'pause' && fetchPauseResumeMetrics(),
        webhook.webhookType === 'pause' && fetchPausedLeads()
      ].filter(Boolean));
    } catch (error) {
      console.error('Error fetching webhook metrics:', error);
      toast.error('Failed to load webhook metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallStats = async () => {
    try {
      const response = await getWebhookEvents(webhook.id, {
        page: 1,
        limit: 100
      });
      
      const events = response.events || [];
      
      const totalEvents = events.length;
      const successfulEvents = events.filter((e: WebhookEvent) => e.status === 'success').length;
      const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;
      
      const totalProcessingTime = events.reduce((sum: number, e: WebhookEvent) => sum + (e.processingTime || 0), 0);
      const averageProcessingTime = totalEvents > 0 ? totalProcessingTime / totalEvents : 0;
      
      const totalLeadsAffected = events.reduce((sum: number, e: WebhookEvent) => 
        sum + (e.createdLeadIds?.length || 0) + (e.affectedLeadIds?.length || 0), 0);

      setOverallStats({
        totalEvents,
        successRate,
        averageProcessingTime,
        totalLeadsAffected
      });
      
      setRecentEvents(events.slice(0, 10)); // Store recent 10 events
    } catch (error) {
      console.error('Error fetching overall stats:', error);
    }
  };

  const fetchRecentEvents = async () => {
    try {
      const response = await getWebhookEvents(webhook.id, {
        page: 1,
        limit: 20
      });
      
      setRecentEvents(response.events || []);
    } catch (error) {
      console.error('Error fetching recent events:', error);
    }
  };

  const fetchAnnouncementMetrics = async () => {
    try {
      const response = await getAnnouncementMetrics(webhook.id, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 50
      });
      
      setAnnouncementMetrics(response.metrics || []);
    } catch (error) {
      console.error('Error fetching announcement metrics:', error);
    }
  };

  const fetchPauseResumeMetrics = async () => {
    try {
      const response = await getPauseResumeStats({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      setPauseResumeStats(response);
    } catch (error) {
      console.error('Error fetching pause/resume stats:', error);
    }
  };

  const fetchPausedLeads = async () => {
    try {
      const response = await getPausedLeads({
        webhookId: webhook.id,
        page: 1,
        limit: 20
      });
      
      setPausedLeads(response.pausedLeads || []);
    } catch (error) {
      console.error('Error fetching paused leads:', error);
    }
  };

  const renderOverallStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overallStats.totalEvents}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overallStats.successRate.toFixed(1)}%</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overallStats.averageProcessingTime.toFixed(0)}ms</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leads Affected</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overallStats.totalLeadsAffected}</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRecentEvents = () => (
    <Card>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>Latest webhook events and their status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center space-x-3">
                {event.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {event.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                {event.status === 'partial_success' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                
                <div>
                  <div className="font-medium">
                    {new Date(event.receivedAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {event.createdLeadIds?.length || 0} leads created, 
                    {event.affectedLeadIds?.length || 0} leads affected
                  </div>
                  {event.errorMessage && (
                    <div className="text-sm text-red-600">{event.errorMessage}</div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <Badge variant={event.status === 'success' ? 'default' : 'destructive'}>
                  {event.status}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">
                  {event.processingTime}ms
                </div>
              </div>
            </div>
          ))}
          
          {recentEvents.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No recent events found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderAnnouncementMetrics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5" />
          <span>Announcement Metrics</span>
        </CardTitle>
        <CardDescription>Performance data for announcement triggers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcementMetrics.map((metric) => (
            <div key={metric.id} className="p-4 border rounded">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">
                    {new Date(metric.announcementStartTime).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Duration: {metric.totalDuration}s | Processing: {metric.processingTime}ms
                  </div>
                </div>
                <Badge variant={metric.errors?.length ? 'destructive' : 'default'}>
                  {metric.successfulDisplays}/{metric.successfulDisplays + metric.failedDisplays} displays
                </Badge>
              </div>
              
              {metric.variablesInjected && Object.keys(metric.variablesInjected).length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium mb-1">Variables:</div>
                  <div className="text-sm text-muted-foreground">
                    {Object.entries(metric.variablesInjected)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(', ')}
                  </div>
                </div>
              )}
              
              {metric.errors && metric.errors.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium text-red-600 mb-1">Errors:</div>
                  <div className="text-sm text-red-600">
                    {metric.errors.join(', ')}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {announcementMetrics.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No announcement metrics found for the selected date range
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderPauseResumeMetrics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Pause className="h-5 w-5" />
          <span>Pause/Resume Metrics</span>
        </CardTitle>
        <CardDescription>Statistics for pause and resume operations</CardDescription>
      </CardHeader>
      <CardContent>
        {pauseResumeStats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{pauseResumeStats.totalPaused}</div>
                <div className="text-sm text-muted-foreground">Total Paused</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{pauseResumeStats.totalResumed}</div>
                <div className="text-sm text-muted-foreground">Total Resumed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pauseResumeStats.currentlyPaused}</div>
                <div className="text-sm text-muted-foreground">Currently Paused</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{pauseResumeStats.averagePauseDuration.toFixed(0)}h</div>
                <div className="text-sm text-muted-foreground">Avg Duration</div>
              </div>
            </div>
            
            {pausedLeads.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Currently Paused Leads</h4>
                <div className="space-y-2">
                  {pausedLeads.slice(0, 5).map((lead, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <div className="font-medium">{lead.phone || lead.leadId}</div>
                        <div className="text-sm text-muted-foreground">
                          Paused: {new Date(lead.pausedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="secondary">{lead.reason || 'No reason'}</Badge>
                    </div>
                  ))}
                  {pausedLeads.length > 5 && (
                    <div className="text-sm text-muted-foreground text-center">
                      +{pausedLeads.length - 5} more paused leads
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No pause/resume statistics available
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Webhook Metrics</span>
            <div className="flex items-center space-x-2">
              {getWebhookTypeIcon(webhook.webhookType)}
              <Badge variant="outline">{webhook.webhookType.toUpperCase()}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="startDate">From:</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-auto"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="endDate">To:</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-auto"
              />
            </div>
            <Button onClick={fetchMetrics} disabled={loading}>
              {loading ? 'Loading...' : 'Update'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      {renderOverallStats()}

      {/* Type-specific Metrics */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          {webhook.webhookType === 'announcement' && (
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          )}
          {webhook.webhookType === 'pause' && (
            <TabsTrigger value="pause-resume">Pause/Resume</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="events">
          {renderRecentEvents()}
        </TabsContent>
        
        {webhook.webhookType === 'announcement' && (
          <TabsContent value="announcements">
            {renderAnnouncementMetrics()}
          </TabsContent>
        )}
        
        {webhook.webhookType === 'pause' && (
          <TabsContent value="pause-resume">
            {renderPauseResumeMetrics()}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function getWebhookTypeIcon(type: string) {
  switch (type) {
    case 'go':
      return <Play className="h-4 w-4 text-green-500" />;
    case 'pause':
      return <Pause className="h-4 w-4 text-blue-500" />;
    case 'stop':
      return <Square className="h-4 w-4 text-red-500" />;
    case 'announcement':
      return <Sparkles className="h-4 w-4 text-purple-500" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
} 