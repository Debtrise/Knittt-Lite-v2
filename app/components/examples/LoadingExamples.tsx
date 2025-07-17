'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAppLoading } from '../../providers/LoadingProvider';
import { 
  withApiLoading, 
  withUploadProgress, 
  withFormLoading, 
  withBatchProgress,
  useComponentLoading 
} from '../../utils/loadingHelpers';
import { MiniLoadingAnimation } from '../ui/LoadingAnimation';

export function LoadingExamples() {
  const { showSimpleLoading, showProgressLoading, hideLoading, isLoading } = useAppLoading();
  const componentLoading = useComponentLoading();
  const [miniLoading, setMiniLoading] = useState(false);

  // Simulate API call
  const simulateApiCall = () => {
    return new Promise(resolve => setTimeout(resolve, 2000));
  };

  // Simulate upload with progress
  const simulateUpload = (onProgress: (progress: number) => void) => {
    return new Promise<string>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        onProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          resolve('Upload completed!');
        }
      }, 200);
    });
  };

  // Simulate form submission
  const handleFormSubmit = withFormLoading(async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Form submitted:', data);
  }, 'Submitting form...');

  // Simulate batch processing
  const handleBatchProcess = async () => {
    const items = Array.from({ length: 10 }, (_, i) => `Item ${i + 1}`);
    
    await withBatchProgress(
      items,
      async (item, index) => {
        // Simulate processing each item
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('Processed:', item);
      },
      'Processing batch items...'
    );
  };

  const examples = [
    {
      title: 'Simple Loading',
      description: 'Basic loading state without progress',
      action: () => {
        showSimpleLoading('Processing request...');
        setTimeout(() => hideLoading(), 3000);
      }
    },
    {
      title: 'Progress Loading',
      description: 'Loading with progress bar',
      action: () => {
        showProgressLoading('Loading with progress...');
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress <= 100) {
            // Progress is managed internally by the store
          }
          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => hideLoading(), 1000);
          }
        }, 300);
      }
    },
    {
      title: 'API Call with Loading',
      description: 'Wrap API calls with automatic loading',
      action: async () => {
        try {
          await withApiLoading(
            simulateApiCall, 
            'Fetching data from server...'
          );
          console.log('API call completed!');
        } catch (error) {
          console.error('API call failed:', error);
        }
      }
    },
    {
      title: 'Upload with Progress',
      description: 'File upload simulation with progress tracking',
      action: async () => {
        try {
          const result = await withUploadProgress(
            simulateUpload,
            'Uploading file...'
          );
          console.log(result);
        } catch (error) {
          console.error('Upload failed:', error);
        }
      }
    },
    {
      title: 'Form Submission',
      description: 'Form submission with loading wrapper',
      action: () => {
        handleFormSubmit({ name: 'John Doe', email: 'john@example.com' });
      }
    },
    {
      title: 'Batch Processing',
      description: 'Process multiple items with progress',
      action: handleBatchProcess
    },
    {
      title: 'Component Level Loading',
      description: 'Loading state managed at component level',
      action: async () => {
        await componentLoading.withLoading(
          simulateApiCall,
          'Component loading...'
        );
        console.log('Component operation completed!');
      }
    },
    {
      title: 'Mini Loading Animation',
      description: 'Small loading indicator for inline use',
      action: () => {
        setMiniLoading(true);
        setTimeout(() => setMiniLoading(false), 3000);
      }
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Loading System Examples
        </h1>
        <p className="text-gray-600">
          Demonstration of the app-wide loading animation system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examples.map((example, index) => (
          <Card key={index} className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">{example.title}</CardTitle>
              <CardDescription>{example.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={example.action}
                disabled={isLoading || componentLoading.isLoading}
                className="w-full"
              >
                {example.title === 'Mini Loading Animation' && miniLoading ? (
                  <MiniLoadingAnimation message="Loading..." />
                ) : (
                  `Try ${example.title}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Documentation */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Use the Loading System</CardTitle>
          <CardDescription>
            Integration examples and best practices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Basic Usage Hook</h4>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              <code>{`import { useAppLoading } from '@/app/providers/LoadingProvider';

const { showSimpleLoading, hideLoading } = useAppLoading();

// Show loading
showSimpleLoading('Loading data...');

// Hide loading
hideLoading();`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. API Wrapper</h4>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              <code>{`import { withApiLoading } from '@/app/utils/loadingHelpers';

const fetchData = async () => {
  return withApiLoading(
    () => api.getData(),
    'Fetching data...'
  );
};`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Component Level</h4>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              <code>{`import { useComponentLoading } from '@/app/utils/loadingHelpers';

const { withLoading } = useComponentLoading();

const handleAction = async () => {
  await withLoading(
    () => performAction(),
    'Processing...'
  );
};`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">4. Auto Route Loading</h4>
            <p className="text-sm text-gray-600">
              Route changes automatically show loading with contextual messages. 
              No additional setup required!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 