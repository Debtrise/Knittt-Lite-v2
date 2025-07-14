import { useState, useCallback, useRef, useEffect } from 'react';
import { useContentStore } from '../store/contentStore';
import { PublishOptions, PublishProgress, ExportStatusResponse } from '../services/exportApi';

interface UsePublishWorkflowOptions {
  onProgress?: (progress: PublishProgress) => void;
  onComplete?: (result: ExportStatusResponse) => void;
  onError?: (error: Error) => void;
  autoStart?: boolean;
}

interface PublishWorkflowState {
  isPublishing: boolean;
  progress: PublishProgress | null;
  result: ExportStatusResponse | null;
  error: Error | null;
  exportId: string | null;
}

export const usePublishWorkflow = (options: UsePublishWorkflowOptions = {}) => {
  const { publishWithProgress, getExportStatus } = useContentStore();
  const [state, setState] = useState<PublishWorkflowState>({
    isPublishing: false,
    progress: null,
    result: null,
    error: null,
    exportId: null,
  });

  const progressCallbackRef = useRef(options.onProgress);
  const completeCallbackRef = useRef(options.onComplete);
  const errorCallbackRef = useRef(options.onError);

  // Update refs when callbacks change
  useEffect(() => {
    progressCallbackRef.current = options.onProgress;
    completeCallbackRef.current = options.onComplete;
    errorCallbackRef.current = options.onError;
  }, [options.onProgress, options.onComplete, options.onError]);

  const startPublish = useCallback(async (projectId: string, publishOptions: PublishOptions) => {
    setState(prev => ({
      ...prev,
      isPublishing: true,
      error: null,
      result: null,
      progress: {
        stage: 'created',
        progress: 0,
        message: 'Starting publish workflow...',
        timestamp: new Date().toISOString(),
      },
    }));

    try {
      const result = await publishWithProgress(
        projectId,
        publishOptions,
        (progress) => {
          setState(prev => ({ ...prev, progress, exportId: progress.exportId || prev.exportId }));
          progressCallbackRef.current?.(progress);
        }
      );

      setState(prev => ({
        ...prev,
        isPublishing: false,
        result,
        progress: result.progress,
      }));

      completeCallbackRef.current?.(result);
      return result;
    } catch (error) {
      const err = error as Error;
      setState(prev => ({
        ...prev,
        isPublishing: false,
        error: err,
        progress: {
          stage: 'failed',
          progress: 0,
          message: err.message,
          timestamp: new Date().toISOString(),
          errorDetails: err.message,
        },
      }));

      errorCallbackRef.current?.(err);
      throw error;
    }
  }, [publishWithProgress]);

  const checkStatus = useCallback(async (exportId: string) => {
    if (!exportId) return null;

    try {
      const status = await getExportStatus(exportId);
      setState(prev => ({
        ...prev,
        progress: status.progress,
        result: status,
      }));
      return status;
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err }));
      throw error;
    }
  }, [getExportStatus]);

  const reset = useCallback(() => {
    setState({
      isPublishing: false,
      progress: null,
      result: null,
      error: null,
      exportId: null,
    });
  }, []);

  // Helper functions for common publish scenarios
  const publishToDisplays = useCallback(async (
    projectId: string,
    displayIds: string[],
    format: 'png' | 'jpg' | 'gif' | 'webp' = 'png',
    quality: 'low' | 'medium' | 'high' = 'high'
  ) => {
    return startPublish(projectId, {
      displayIds,
      format,
      quality,
    });
  }, [startPublish]);

  const publishWithTakeover = useCallback(async (
    projectId: string,
    displayIds: string[],
    takeoverOptions: {
      priority?: 'EMERGENCY' | 'HIGH' | 'NORMAL';
      duration?: number;
      message?: string;
      restoreAfter?: boolean;
    },
    format: 'png' | 'jpg' | 'gif' | 'webp' = 'png',
    quality: 'low' | 'medium' | 'high' = 'high'
  ) => {
    return startPublish(projectId, {
      displayIds,
      format,
      quality,
      takeoverOptions,
    });
  }, [startPublish]);

  const publishWithVariables = useCallback(async (
    projectId: string,
    displayIds: string[],
    variableData: Record<string, any>,
    format: 'png' | 'jpg' | 'gif' | 'webp' = 'png',
    quality: 'low' | 'medium' | 'high' = 'high'
  ) => {
    return startPublish(projectId, {
      displayIds,
      format,
      quality,
      variableData,
    });
  }, [startPublish]);

  // Progress helpers
  const getProgressPercentage = useCallback(() => {
    return state.progress?.progress ?? 0;
  }, [state.progress]);

  const getProgressMessage = useCallback(() => {
    return state.progress?.message ?? '';
  }, [state.progress]);

  const getProgressStage = useCallback(() => {
    return state.progress?.stage ?? 'created';
  }, [state.progress]);

  const isCompleted = useCallback(() => {
    return state.progress?.stage === 'completed';
  }, [state.progress]);

  const isFailed = useCallback(() => {
    return state.progress?.stage === 'failed';
  }, [state.progress]);

  const getTakeoverResults = useCallback(() => {
    return state.progress?.takeoverResults ?? [];
  }, [state.progress]);

  return {
    // State
    ...state,
    
    // Actions
    startPublish,
    checkStatus,
    reset,
    
    // Convenience methods
    publishToDisplays,
    publishWithTakeover,
    publishWithVariables,
    
    // Progress helpers
    getProgressPercentage,
    getProgressMessage,
    getProgressStage,
    isCompleted,
    isFailed,
    getTakeoverResults,
  };
};

// Type exports for consumers
export type { PublishOptions, PublishProgress, ExportStatusResponse };
export type { UsePublishWorkflowOptions, PublishWorkflowState }; 