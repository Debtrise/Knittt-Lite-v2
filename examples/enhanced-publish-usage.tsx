import React, { useState } from 'react';
import { EnhancedPublishDialog } from '../app/components/EnhancedPublishDialog';
import { usePublishWorkflow } from '../app/hooks/usePublishWorkflow';

// Example 1: Basic Enhanced Publish Dialog Usage
export const BasicPublishExample: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState('project-123');

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Basic Enhanced Publish</h2>
      <button
        onClick={() => setShowDialog(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Open Enhanced Publish Dialog
      </button>

      <EnhancedPublishDialog
        projectId={selectedProject}
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={(result) => {
          console.log('Publish successful:', result);
          alert('Content published successfully!');
        }}
      />
    </div>
  );
};

// Example 2: Programmatic Publish with Progress Tracking
export const ProgrammaticPublishExample: React.FC = () => {
  const {
    isPublishing,
    progress,
    error,
    result,
    publishToDisplays,
    publishWithTakeover,
    publishWithVariables,
    getProgressPercentage,
    getProgressMessage,
    getProgressStage,
    isCompleted,
    reset,
  } = usePublishWorkflow({
    onProgress: (progress) => {
      console.log('Progress update:', progress);
    },
    onComplete: (result) => {
      console.log('Publish completed:', result);
    },
    onError: (error) => {
      console.error('Publish failed:', error);
    },
  });

  // Example: Simple publish to displays
  const handleSimplePublish = async () => {
    try {
      await publishToDisplays(
        'project-123',
        ['display-1', 'display-2'],
        'png',
        'high'
      );
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  };

  // Example: Emergency takeover publish
  const handleEmergencyPublish = async () => {
    try {
      await publishWithTakeover(
        'project-123',
        ['display-1', 'display-2', 'display-3'],
        {
          priority: 'EMERGENCY',
          duration: 600, // 10 minutes
          message: 'Emergency evacuation notice',
          restoreAfter: true,
        },
        'png',
        'high'
      );
    } catch (error) {
      console.error('Failed to publish emergency content:', error);
    }
  };

  // Example: Publish with dynamic variables
  const handleDynamicPublish = async () => {
    try {
      await publishWithVariables(
        'project-123',
        ['display-1', 'display-2'],
        {
          name: 'John Doe',
          event: 'Monthly Meeting',
          date: new Date().toLocaleDateString(),
          location: 'Conference Room A',
        },
        'png',
        'high'
      );
    } catch (error) {
      console.error('Failed to publish dynamic content:', error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Programmatic Publish Examples</h2>
      
      {/* Control Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={handleSimplePublish}
          disabled={isPublishing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Simple Publish
        </button>
        <button
          onClick={handleEmergencyPublish}
          disabled={isPublishing}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          Emergency Takeover
        </button>
        <button
          onClick={handleDynamicPublish}
          disabled={isPublishing}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Dynamic Variables
        </button>
        <button
          onClick={reset}
          disabled={isPublishing}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      {/* Progress Display */}
      {progress && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="capitalize">{getProgressStage().replace('_', ' ')}</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{getProgressMessage()}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-medium text-red-800">Error</h3>
          <p className="text-red-600">{error.message}</p>
        </div>
      )}

      {/* Success Display */}
      {isCompleted() && result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-800">Success!</h3>
          <p className="text-green-600">Content published successfully</p>
          {result.export?.processingTimeMs && (
            <p className="text-sm text-green-600">
              Processing time: {(result.export.processingTimeMs / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Example 3: Custom Progress Tracking Component
export const CustomProgressTracker: React.FC<{ exportId: string }> = ({ exportId }) => {
  const { checkStatus } = usePublishWorkflow();
  const [status, setStatus] = useState(null);

  const refreshStatus = async () => {
    try {
      const currentStatus = await checkStatus(exportId);
      setStatus(currentStatus);
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-medium mb-2">Export Status: {exportId}</h3>
      <button
        onClick={refreshStatus}
        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 mb-2"
      >
        Refresh Status
      </button>
      
      {status && (
        <div className="text-sm">
          <p><strong>Stage:</strong> {status.progress?.stage}</p>
          <p><strong>Progress:</strong> {status.progress?.progress}%</p>
          <p><strong>Message:</strong> {status.progress?.message}</p>
          <p><strong>Status:</strong> {status.export?.status}</p>
        </div>
      )}
    </div>
  );
};

// Example 4: Batch Publishing with Multiple Projects
export const BatchPublishExample: React.FC = () => {
  const [projects] = useState([
    { id: 'project-1', name: 'Welcome Message' },
    { id: 'project-2', name: 'Event Announcement' },
    { id: 'project-3', name: 'Safety Notice' },
  ]);
  
  const [publishResults, setPublishResults] = useState<Record<string, any>>({});
  const [isPublishing, setIsPublishing] = useState(false);

  const handleBatchPublish = async () => {
    setIsPublishing(true);
    const results: Record<string, any> = {};

    for (const project of projects) {
      try {
        console.log(`Publishing ${project.name}...`);
        // Note: In a real implementation, you'd use the actual publish methods
        // This is just for demonstration
        results[project.id] = {
          success: true,
          message: `${project.name} published successfully`,
        };
      } catch (error) {
        results[project.id] = {
          success: false,
          error: (error as Error).message,
        };
      }
    }

    setPublishResults(results);
    setIsPublishing(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Batch Publishing</h2>
      
      <button
        onClick={handleBatchPublish}
        disabled={isPublishing}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 mb-4"
      >
        {isPublishing ? 'Publishing...' : 'Publish All Projects'}
      </button>

      <div className="space-y-2">
        {projects.map((project) => {
          const result = publishResults[project.id];
          return (
            <div
              key={project.id}
              className={`p-3 rounded border ${
                result?.success === true ? 'bg-green-50 border-green-200' :
                result?.success === false ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{project.name}</span>
                <span className="text-sm">
                  {result?.success === true ? '✅ Success' :
                   result?.success === false ? '❌ Failed' :
                   isPublishing ? '⏳ Publishing...' : '⏸️ Pending'}
                </span>
              </div>
              {result?.message && (
                <p className="text-sm text-gray-600 mt-1">{result.message}</p>
              )}
              {result?.error && (
                <p className="text-sm text-red-600 mt-1">{result.error}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Example usage in a main component
export const EnhancedPublishExamples: React.FC = () => {
  const [activeExample, setActiveExample] = useState<string>('basic');

  const examples = [
    { id: 'basic', label: 'Basic Dialog', component: BasicPublishExample },
    { id: 'programmatic', label: 'Programmatic', component: ProgrammaticPublishExample },
    { id: 'batch', label: 'Batch Publishing', component: BatchPublishExample },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Enhanced Publish Examples</h1>
        
        {/* Example Navigation */}
        <div className="flex justify-center space-x-2 mb-8">
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() => setActiveExample(example.id)}
              className={`px-4 py-2 rounded ${
                activeExample === example.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {example.label}
            </button>
          ))}
        </div>

        {/* Example Content */}
        <div className="bg-white rounded-lg shadow-lg">
          {examples.map((example) => {
            const Component = example.component;
            return activeExample === example.id ? (
              <Component key={example.id} />
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}; 