'use client';

import { useEffect, useState } from 'react';
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
import {
  Webhook,
  Plus,
  ArrowLeft,
  Eye,
  Edit,
  Copy,
  Trash2,
  Play,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Sparkles,
  Megaphone,
  Broadcast
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import api from '@/app/lib/api';

interface WebhookRule {
  id: string;
  name: string;
  description: string;
  webhookEndpointId: string;
  webhookType?: 'go' | 'pause' | 'stop' | 'announcement';
  conditions: {
    triggers: Array<{
      field: string;
      operator: string;
      value: string;
      type: string;
    }>;
    operator: 'and' | 'or';
  };
  actions: {
    contentId: string;
    displayIds: string[];
    duration: number;
    priority: 'low' | 'medium' | 'high';
    variables: Record<string, string>;
    announcementConfig?: {
      templateId?: string;
      projectName?: string;
      autoGenerate?: boolean;
      restoreAfter?: boolean;
      overrideCurrent?: boolean;
    };
  };
  isActive: boolean;
  executionCount: number;
  lastExecuted?: string;
  priority: number;
  webhookEndpoint?: {
    id: string;
    name: string;
    brand?: string;
    webhookType?: 'go' | 'pause' | 'stop' | 'announcement';
  };
  content?: {
    id: string;
    name: string;
  };
}

interface WebhookRuleListResponse {
  rules: WebhookRule[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export default function OptisignsWebhookRulesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<WebhookRule[]>([]);
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const fetchRules = async (page = 1, filter: any = {}) => {
    setLoading(true);
    try {
      const params = {
        page: page.toString(),
        limit: '20',
        ...filter,
      };

      const response = await api.optisigns.getWebhookRules(params);
      const data = response.data;

      setRules(data.rules || []);
      setPaginationInfo({
        currentPage: data.currentPage || page,
        totalPages: data.totalPages || 1,
        totalCount: data.totalCount || 0,
      });
    } catch (error: any) {
      console.error('Error fetching webhook rules:', error);
      if (error.response?.status === 404) {
        toast.error('Optisigns webhook rules API not available. Please configure the backend integration.');
      } else {
        toast.error('Failed to load webhook rules');
      }
      
      // Set empty states
      setRules([]);
      setPaginationInfo({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    let filter = {};
    
    switch (value) {
      case 'active':
        filter = { isActive: true };
        break;
      case 'inactive':
        filter = { isActive: false };
        break;
      case 'announcement':
        filter = { webhookType: 'announcement' };
        break;
      case 'high-priority':
        filter = { priority: 'high' };
        break;
      case 'recent':
        // Filter rules executed in last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filter = { lastExecutedAfter: weekAgo.toISOString() };
        break;
      default:
        filter = {};
    }
    
    fetchRules(1, filter);
  };

  const handleCreateRule = () => {
    router.push('/optisigns/webhook-rules/create');
  };

  const handleViewRule = (ruleId: string) => {
    router.push(`/optisigns/webhook-rules/${ruleId}`);
  };

  const handleEditRule = (ruleId: string) => {
    router.push(`/optisigns/webhook-rules/${ruleId}/edit`);
  };

  const handleDuplicateRule = async (ruleId: string) => {
    try {
      const response = await api.optisigns.createWebhookRule({ duplicateFrom: ruleId });
      toast.success('Rule duplicated successfully');
      fetchRules(paginationInfo.currentPage);
    } catch (error) {
      console.error('Error duplicating rule:', error);
      toast.error('Failed to duplicate rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this webhook rule?')) return;

    try {
      await api.optisigns.deleteWebhookRule(ruleId);
      toast.success('Webhook rule deleted successfully');
      fetchRules(paginationInfo.currentPage);
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete webhook rule');
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await api.optisigns.updateWebhookRule(ruleId, { isActive: !isActive });
      toast.success(`Rule ${!isActive ? 'enabled' : 'disabled'} successfully`);
      fetchRules(paginationInfo.currentPage);
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to update rule');
    }
  };

  const handleTestRule = (ruleId: string) => {
    router.push(`/optisigns/webhook-rules/${ruleId}/test`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getWebhookTypeIcon = (type?: string) => {
    switch (type) {
      case 'announcement':
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      case 'pause':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'stop':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'go':
      default:
        return <Play className="h-4 w-4 text-green-500" />;
    }
  };

  const getWebhookTypeBadge = (type?: string) => {
    switch (type) {
      case 'announcement':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Announcement</Badge>;
      case 'pause':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Pause</Badge>;
      case 'stop':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Stop</Badge>;
      case 'go':
      default:
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Go</Badge>;
    }
  };

  const formatLastExecuted = (lastExecuted?: string) => {
    if (!lastExecuted) return 'Never';
    
    const date = new Date(lastExecuted);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const formatConditions = (conditions: WebhookRule['conditions']) => {
    const triggerCount = conditions.triggers.length;
    if (triggerCount === 0) return 'No conditions';
    if (triggerCount === 1) return '1 condition';
    return `${triggerCount} conditions (${conditions.operator.toUpperCase()})`;
  };

  const formatDisplays = (displayIds: string[]) => {
    if (displayIds.includes('all')) return 'All displays';
    if (displayIds.length === 1) return '1 display';
    return `${displayIds.length} displays`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/optisigns')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Optisigns
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Webhook Rules</h1>
            <p className="text-gray-600">Configure conditional content display based on webhook events</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateRule}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Rule
            </Button>
            <Button
              onClick={() => router.push('/optisigns/webhook-rules/create?type=announcement')}
              variant="outline"
              className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Sparkles className="h-4 w-4" />
              Create Announcement Rule
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Rules
            </CardTitle>
            <CardDescription>
              Automatically trigger content display when webhook conditions are met
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Tabs value={activeFilter} onValueChange={handleFilterChange}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                  <TabsTrigger value="announcement">Announcements</TabsTrigger>
                  <TabsTrigger value="high-priority">High Priority</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading webhook rules...</div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8">
                {activeFilter === 'announcement' ? (
                  <Sparkles className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                ) : (
                  <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                )}
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeFilter === 'announcement' ? 'No announcement rules found' : 'No webhook rules found'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {activeFilter === 'announcement' 
                    ? 'Create announcement rules to trigger dynamic content celebrations and notifications'
                    : activeFilter === 'all' 
                      ? 'Create your first webhook rule to automate content display'
                      : `No rules match the current filter: ${activeFilter}`
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleCreateRule} variant="outline">
                    Create Rule
                  </Button>
                  {activeFilter === 'announcement' && (
                    <Button 
                      onClick={() => router.push('/optisigns/webhook-rules/create?type=announcement')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Announcement Rule
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <Card key={rule.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                            {getWebhookTypeIcon(rule.webhookType || rule.webhookEndpoint?.webhookType)}
                            <div>
                              <h3 className="font-medium text-lg">{rule.name}</h3>
                              <p className="text-sm text-gray-600">{rule.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={rule.isActive ? 'success' : 'secondary'}>
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {getWebhookTypeBadge(rule.webhookType || rule.webhookEndpoint?.webhookType)}
                            <Badge 
                              variant="outline" 
                              className={getPriorityColor(rule.actions.priority)}
                            >
                              {rule.actions.priority} priority
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewRule(rule.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditRule(rule.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTestRule(rule.id)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Test Rule
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateRule(rule.id)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleToggleRule(rule.id, rule.isActive)}
                                >
                                  <Zap className="h-4 w-4 mr-2" />
                                  {rule.isActive ? 'Disable' : 'Enable'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="space-y-1">
                            <span className="text-gray-600">Webhook Source</span>
                            <div className="font-medium">
                              {rule.webhookEndpoint?.name || 'Unknown'}
                              {rule.webhookEndpoint?.brand && (
                                <span className="text-gray-500 ml-1">({rule.webhookEndpoint.brand})</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-gray-600">Webhook Type</span>
                            <div className="font-medium flex items-center gap-2">
                              {getWebhookTypeIcon(rule.webhookType || rule.webhookEndpoint?.webhookType)}
                              {rule.webhookType || rule.webhookEndpoint?.webhookType || 'go'}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-gray-600">Conditions</span>
                            <div className="font-medium">
                              {formatConditions(rule.conditions)}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-gray-600">Target Content</span>
                            <div className="font-medium">
                              {rule.content?.name || 'Unknown Content'}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-gray-600">Target Displays</span>
                            <div className="font-medium">
                              {formatDisplays(rule.actions.displayIds)}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-gray-600">Duration</span>
                            <div className="font-medium">
                              {formatDuration(rule.actions.duration)}
                            </div>
                          </div>

                          {(rule.webhookType === 'announcement' || rule.webhookEndpoint?.webhookType === 'announcement') && rule.actions.announcementConfig && (
                            <div className="space-y-1">
                              <span className="text-gray-600">Announcement Config</span>
                              <div className="font-medium">
                                {rule.actions.announcementConfig.autoGenerate ? 'Auto-generate' : 'Manual'}
                                {rule.actions.announcementConfig.restoreAfter && ' • Restore'}
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <span className="text-gray-600">Variables</span>
                            <div className="font-medium">
                              {Object.keys(rule.actions.variables || {}).length} mapped
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-gray-600">Executions</span>
                            <div className="font-medium">
                              {rule.executionCount.toLocaleString()} times
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-gray-600">Last Executed</span>
                            <div className="font-medium">
                              {formatLastExecuted(rule.lastExecuted)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewRule(rule.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditRule(rule.id)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTestRule(rule.id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Test
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {paginationInfo.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Showing {rules.length} of {paginationInfo.totalCount} rules
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={paginationInfo.currentPage === 1}
                        onClick={() => fetchRules(paginationInfo.currentPage - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={paginationInfo.currentPage === paginationInfo.totalPages}
                        onClick={() => fetchRules(paginationInfo.currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {rules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {rules.filter(r => r.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Active Rules</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {rules.filter(r => r.actions.priority === 'high').length}
                </div>
                <div className="text-sm text-gray-600">High Priority</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {rules.reduce((sum, r) => sum + r.executionCount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Executions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {rules.filter(r => r.lastExecuted && 
                    new Date(r.lastExecuted) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Recent Activity</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 