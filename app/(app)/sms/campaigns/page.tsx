'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, MessageSquare, Settings, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { useAuthStore } from '@/app/store/authStore';

export default function SmsCampaignsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            SMS Campaigns - Deprecated
          </h1>
          <p className="text-gray-600 mt-1">
            SMS campaigns have been replaced with a new provider-based messaging system
          </p>
        </div>

        {/* Deprecation Notice */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Feature Deprecated</AlertTitle>
          <AlertDescription className="text-amber-700 mt-2">
            <div className="space-y-2">
              <p>
                SMS Campaigns have been deprecated in favor of our new provider-based messaging system. 
                This provides better reliability, support for multiple SMS providers, and improved message delivery.
              </p>
              <p className="font-medium">
                Please use the new SMS messaging features instead:
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Migration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Direct SMS Messaging
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Send individual SMS messages using Twilio or Meera providers. Perfect for immediate, targeted messaging.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ArrowRight className="h-4 w-4 text-green-600" />
                  <span>Send messages instantly</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ArrowRight className="h-4 w-4 text-green-600" />
                  <span>Choose your SMS provider</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ArrowRight className="h-4 w-4 text-green-600" />
                  <span>Use templates for consistent messaging</span>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/sms')}
                className="w-full"
              >
                Go to SMS Messaging
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Journey-Based SMS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Use SMS nodes in customer journeys for automated, workflow-based messaging with advanced logic.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ArrowRight className="h-4 w-4 text-purple-600" />
                  <span>Automated message sequences</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ArrowRight className="h-4 w-4 text-purple-600" />
                  <span>Conditional logic and branching</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ArrowRight className="h-4 w-4 text-purple-600" />
                  <span>Integration with lead management</span>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/journeys')}
                variant="outline"
                className="w-full"
              >
                Go to Journeys
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Provider Configuration */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure SMS Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Before using the new SMS features, make sure your SMS providers are properly configured. 
              We support both Twilio and Meera for reliable message delivery.
            </p>
            <Button 
              onClick={() => router.push('/settings/sms-providers')}
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Providers
            </Button>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Need Help with Migration?</h3>
          <p className="text-blue-700 text-sm">
            If you have existing SMS campaigns or need assistance migrating to the new system, 
            please contact support. We're here to help you transition smoothly to the improved SMS messaging platform.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}