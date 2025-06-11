'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/Dashboard';
import EmailStatsCard from '@/app/components/email/EmailStatsCard';
import EmailTemplateManager from '@/app/components/email/EmailTemplateManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { 
  Mail, 
  Settings, 
  Send, 
  BarChart3, 
  FileText, 
  Plus,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';
import { email, emailTemplates } from '@/app/lib/api';
import { EmailConfig, EmailStats } from '@/app/types/email';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface QuickEmailSendProps {
  className?: string;
}

function QuickEmailSend({ className }: QuickEmailSendProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    templateId: '',
    variables: {} as Record<string, string>
  });

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await email.send({
        to: formData.to,
        templateId: Number(formData.templateId),
        variables: formData.variables
      });
      
      toast.success(`Email sent successfully! Message ID: ${response.data.messageId}`);
      setFormData({ to: '', templateId: '', variables: {} });
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Quick Send Email
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Email
            </label>
            <Input
              type="email"
              value={formData.to}
              onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="recipient@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template ID
            </label>
            <Input
              type="number"
              value={formData.templateId}
              onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
              placeholder="Enter template ID"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Email
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface RecentActivityProps {
  className?: string;
}

function RecentActivity({ className }: RecentActivityProps) {
  const activities = [
    {
      id: 1,
      type: 'email_sent',
      message: 'Welcome email sent to john@example.com',
      time: '2 minutes ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'template_created',
      message: 'New template "Follow-up Email" created',
      time: '1 hour ago',
      status: 'info'
    },
    {
      id: 3,
      type: 'email_bounced',
      message: 'Email bounced for invalid@domain.com',
      time: '2 hours ago',
      status: 'warning'
    },
    {
      id: 4,
      type: 'config_updated',
      message: 'Mailgun configuration updated',
      time: '1 day ago',
      status: 'info'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              {getStatusIcon(activity.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmailDashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchEmailConfig();
  }, [isAuthenticated, router]);

  const fetchEmailConfig = async () => {
    try {
      const response = await email.getConfig();
      setEmailConfig(response.data);
    } catch (error) {
      console.error('Error fetching email config:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Mail className="h-8 w-8 text-blue-600" />
              Email Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your Mailgun email campaigns, templates, and analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/config" passHref>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Email Config
              </Button>
            </Link>
            <Link href="/templates/new" passHref>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            </Link>
          </div>
        </div>

        {/* Configuration Status */}
        {!emailConfig ? (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-10 w-10 text-yellow-600" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-yellow-800">
                    Email Configuration Required
                  </h3>
                  <p className="text-yellow-700 mt-1">
                    Configure your Mailgun settings to start sending emails and view statistics.
                  </p>
                </div>
                <Link href="/config" passHref>
                  <Button variant="outline" className="bg-white">
                    Configure Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : emailConfig.isActive ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">
                    Email service is active ({emailConfig.provider})
                  </p>
                  <p className="text-green-700 text-sm">
                    Sending from {emailConfig.fromEmail}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="text-red-800 font-medium">
                    Email service is configured but inactive
                  </p>
                  <p className="text-red-700 text-sm">
                    Check your configuration settings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats and Quick Actions */}
          <div className="space-y-6">
            <EmailStatsCard />
            <QuickEmailSend />
            <RecentActivity />
          </div>

          {/* Right Column - Template Management */}
          <div className="lg:col-span-2">
            <EmailTemplateManager />
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Templates</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12.5%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Rate</p>
                  <p className="text-2xl font-bold">24.6%</p>
                  <p className="text-xs text-blue-600">Industry avg: 21.3%</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Daily Limit</p>
                  <p className="text-2xl font-bold">{emailConfig?.dailyLimit || 1000}</p>
                  <p className="text-xs text-gray-600">
                    {emailConfig?.sentToday || 0} sent today
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Integration Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              API Integration Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Send Email via API</h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <pre className="text-xs overflow-x-auto">
{`fetch('/api/email/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: 'customer@example.com',
    templateId: 1,
    variables: {
      firstName: 'John',
      companyName: 'Acme Corp'
    },
    tags: ['welcome', 'onboarding']
  })
});`}
                  </pre>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Get Email Statistics</h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <pre className="text-xs overflow-x-auto">
{`fetch('/api/email/stats', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
}).then(response => response.json())
  .then(data => {
    console.log('Email stats:', data.stats);
  });`}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 