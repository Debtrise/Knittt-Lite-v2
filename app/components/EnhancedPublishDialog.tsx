import React, { useState, useEffect } from 'react';
import { usePublishWorkflow } from '../hooks/usePublishWorkflow';
import { useContentStore } from '../store/contentStore';

interface Display {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'syncing' | 'error';
  isActive?: boolean;
  lastSeen?: string;
}

interface EnhancedPublishDialogProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
}

export const EnhancedPublishDialog: React.FC<EnhancedPublishDialogProps> = ({
  projectId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { getAvailableDisplays } = useContentStore();
  const [displays, setDisplays] = useState<Display[]>([]);
  const [selectedDisplays, setSelectedDisplays] = useState<string[]>([]);
  const [format, setFormat] = useState<'png' | 'jpg' | 'gif' | 'webp'>('png');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [variableData, setVariableData] = useState<Record<string, any>>({});
  const [enableTakeover, setEnableTakeover] = useState(false);
  const [takeoverPriority, setTakeoverPriority] = useState<'EMERGENCY' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [takeoverDuration, setTakeoverDuration] = useState(300); // 5 minutes
  const [takeoverMessage, setTakeoverMessage] = useState('');
  const [restoreAfter, setRestoreAfter] = useState(true);
  const [showVariables, setShowVariables] = useState(false);

  const {
    isPublishing,
    progress,
    result,
    error,
    startPublish,
    reset,
    getProgressPercentage,
    getProgressMessage,
    getProgressStage,
    isCompleted,
    isFailed,
    getTakeoverResults,
  } = usePublishWorkflow({
    onComplete: (result) => {
      console.log('Publish completed:', result);
      onSuccess?.(result);
    },
    onError: (error) => {
      console.error('Publish failed:', error);
    },
  });

  // Load displays on mount
  useEffect(() => {
    if (isOpen) {
      loadDisplays();
    }
  }, [isOpen]);

  const loadDisplays = async () => {
    try {
      const response = await getAvailableDisplays();
      setDisplays(response.displays || []);
    } catch (error) {
      console.error('Failed to load displays:', error);
    }
  };

  const handlePublish = async () => {
    if (selectedDisplays.length === 0) {
      alert('Please select at least one display');
      return;
    }

    const publishOptions = {
      displayIds: selectedDisplays,
      format,
      quality,
      ...(Object.keys(variableData).length > 0 && { variableData }),
      ...(enableTakeover && {
        takeoverOptions: {
          priority: takeoverPriority,
          duration: takeoverDuration,
          message: takeoverMessage || undefined,
          restoreAfter,
        },
      }),
    };

    try {
      await startPublish(projectId, publishOptions);
    } catch (error) {
      console.error('Failed to start publish:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const renderProgressBar = () => {
    const percentage = getProgressPercentage();
    const stage = getProgressStage();
    const message = getProgressMessage();

    const stageColors = {
      created: 'bg-blue-500',
      generating: 'bg-yellow-500',
      generated: 'bg-green-500',
      uploading: 'bg-purple-500',
      takeover: 'bg-orange-500',
      completed: 'bg-green-600',
      failed: 'bg-red-500',
    };

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="capitalize">{stage.replace('_', ' ')}</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${stageColors[stage]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {message && (
          <p className="text-sm text-gray-600">{message}</p>
        )}
      </div>
    );
  };

  const renderTakeoverResults = () => {
    const takeoverResults = getTakeoverResults();
    if (takeoverResults.length === 0) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Takeover Results</h4>
        <div className="space-y-2">
          {takeoverResults.map((result, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span>{result.displayName || result.displayId}</span>
              <span className={`px-2 py-1 rounded ${
                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.success ? 'Success' : 'Failed'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Enhanced Publish to OptiSigns</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isPublishing}
          >
            ✕
          </button>
        </div>

        {/* Display Selection */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Select Displays</h3>
          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
            {displays.map((display) => (
              <label key={display.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedDisplays.includes(display.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDisplays([...selectedDisplays, display.id]);
                    } else {
                      setSelectedDisplays(selectedDisplays.filter(id => id !== display.id));
                    }
                  }}
                  disabled={isPublishing}
                  className="rounded"
                />
                <span className="flex-1">{display.name}</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  display.status === 'online' ? 'bg-green-100 text-green-800' :
                  display.status === 'offline' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {display.status}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Format & Quality Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              disabled={isPublishing}
              className="w-full p-2 border rounded"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="gif">GIF</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Quality</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as any)}
              disabled={isPublishing}
              className="w-full p-2 border rounded"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Takeover Options */}
        <div className="mb-6">
          <label className="flex items-center space-x-2 mb-3">
            <input
              type="checkbox"
              checked={enableTakeover}
              onChange={(e) => setEnableTakeover(e.target.checked)}
              disabled={isPublishing}
              className="rounded"
            />
            <span className="font-medium">Enable Takeover Mode</span>
          </label>

          {enableTakeover && (
            <div className="pl-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={takeoverPriority}
                    onChange={(e) => setTakeoverPriority(e.target.value as any)}
                    disabled={isPublishing}
                    className="w-full p-2 border rounded"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (seconds)</label>
                  <input
                    type="number"
                    value={takeoverDuration}
                    onChange={(e) => setTakeoverDuration(parseInt(e.target.value))}
                    disabled={isPublishing}
                    min="60"
                    max="3600"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message (optional)</label>
                <input
                  type="text"
                  value={takeoverMessage}
                  onChange={(e) => setTakeoverMessage(e.target.value)}
                  disabled={isPublishing}
                  placeholder="Emergency message..."
                  className="w-full p-2 border rounded"
                />
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={restoreAfter}
                  onChange={(e) => setRestoreAfter(e.target.checked)}
                  disabled={isPublishing}
                  className="rounded"
                />
                <span className="text-sm">Restore previous content after takeover</span>
              </label>
            </div>
          )}
        </div>

        {/* Variable Data */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowVariables(!showVariables)}
            disabled={isPublishing}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <span>{showVariables ? '▼' : '▶'}</span>
            <span>Variable Data (optional)</span>
          </button>

          {showVariables && (
            <div className="mt-3 p-4 border rounded">
              <textarea
                value={JSON.stringify(variableData, null, 2)}
                onChange={(e) => {
                  try {
                    setVariableData(JSON.parse(e.target.value));
                  } catch (error) {
                    // Invalid JSON, keep current state
                  }
                }}
                disabled={isPublishing}
                placeholder='{\n  "name": "John Doe",\n  "date": "2024-01-01"\n}'
                className="w-full h-32 p-2 font-mono text-sm border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter variable data as JSON to customize the content
              </p>
            </div>
          )}
        </div>

        {/* Progress Display */}
        {(isPublishing || progress) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Publishing Progress</h4>
            {renderProgressBar()}
            {renderTakeoverResults()}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Error</h4>
            <p className="text-red-600">{error.message}</p>
          </div>
        )}

        {/* Success Display */}
        {isCompleted() && result && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Success!</h4>
            <p className="text-green-600">
              Content published successfully to {selectedDisplays.length} display(s)
            </p>
            {result.export?.processingTimeMs && (
              <p className="text-sm text-green-600 mt-1">
                Processing time: {(result.export.processingTimeMs / 1000).toFixed(1)}s
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={isPublishing}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {isCompleted() || isFailed() ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || selectedDisplays.length === 0 || isCompleted()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}; 