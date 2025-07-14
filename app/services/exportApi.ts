const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';

export interface ContentExport {
  id: string;
  projectId: string;
  exportType: 'html' | 'image' | 'video' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filename: string;
  fileSize?: number;
  downloadUrl?: string;
  options: {
    format?: string;
    quality?: 'low' | 'medium' | 'high';
    dimensions?: { width: number; height: number };
    duration?: number; // for video exports
    includeAnimations?: boolean;
    backgroundColor?: string;
  };
  progress?: number;
  progressStage?: 'created' | 'generating' | 'generated' | 'uploading' | 'takeover' | 'completed';
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  // Enhanced fields for publish workflow
  optiSignsAssetId?: string;
  takeoverResults?: Array<{
    displayId: string;
    success: boolean;
    message?: string;
  }>;
  processingTimeMs?: number;
}

export interface OptiSignsStatus {
  projectId: string;
  status: 'not_published' | 'publishing' | 'published' | 'failed' | 'updating';
  displayIds: string[];
  publishedAt?: string;
  lastSyncAt?: string;
  errorMessage?: string;
  displays: Array<{
    id: string;
    name: string;
    status: 'online' | 'offline' | 'syncing' | 'error';
    isActive?: boolean;
    lastSeen?: string;
  }>;
}

export interface PublishOptions {
  displayIds: string[];
  format?: 'png' | 'jpg' | 'gif' | 'webp';
  quality?: 'low' | 'medium' | 'high';
  variableData?: Record<string, any>;
  takeoverOptions?: {
    priority?: 'EMERGENCY' | 'HIGH' | 'NORMAL';
    duration?: number; // in seconds
    message?: string;
    restoreAfter?: boolean;
  };
  // Legacy options for backward compatibility
  immediate?: boolean;
  scheduleAt?: string;
}

export interface PublishProgress {
  stage: 'created' | 'generating' | 'generated' | 'uploading' | 'takeover' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  timestamp: string;
  exportId?: string;
  optiSignsAssetId?: string;
  takeoverResults?: Array<{
    displayId: string;
    displayName?: string;
    success: boolean;
    message?: string;
  }>;
  errorDetails?: string;
  processingTimeMs?: number;
}

export interface ExportStatusResponse {
  export: ContentExport;
  progress: PublishProgress;
  success: boolean;
  message: string;
}

class ExportApiService {
  private getAuthHeaders() {
    const authStorage = localStorage.getItem('auth-storage');
    let token = null;
    
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage);
        token = authData.state?.token;
      } catch (error) {
        console.error('Failed to parse auth storage:', error);
      }
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      
      // Log additional context for debugging
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorData
      });
      
      throw new Error(errorMessage);
    }
    return response.json();
  }

  // Export Management APIs
  async createExport(projectId: string, exportType: ContentExport['exportType'], options: ContentExport['options']) {
    // Note: This endpoint doesn't exist in the documented API
    // The API only supports publishing to OptiSigns via /publish endpoint
    console.warn(`createExport endpoint not available in current API for project ${projectId}`);
    throw new Error('Export functionality not available. Use Publish to OptiSigns instead.');
  }

  async getProjectExports(projectId: string, params?: { exportType?: string; status?: string; page?: number; limit?: number }) {
    // Note: This endpoint doesn't exist in the documented API
    // Return empty exports list to avoid fetch errors
    console.warn(`getProjectExports endpoint not available in current API for project ${projectId}`);
    return {
      exports: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    };
  }

  async getExport(exportId: string) {
    // Note: This endpoint doesn't exist in the documented API
    console.warn(`getExport endpoint not available in current API for export ${exportId}`);
    throw new Error('Get export endpoint not available in current API');
  }

  async getExportStatus(exportId: string): Promise<ExportStatusResponse> {
    // This endpoint exists in the API documentation
    const response = await fetch(`${API_BASE_URL}/content/exports/${exportId}/status`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async downloadExport(exportId: string) {
    // Note: This endpoint doesn't exist in the documented API
    console.warn(`downloadExport endpoint not available in current API for export ${exportId}`);
    throw new Error('Download export endpoint not available in current API');
  }

  async deleteExport(exportId: string) {
    // Note: This endpoint doesn't exist in the documented API
    console.warn(`deleteExport endpoint not available in current API for export ${exportId}`);
    throw new Error('Delete export endpoint not available in current API');
  }

  async bulkExport(projectIds: string[], exportType: ContentExport['exportType'], options: ContentExport['options']) {
    const response = await fetch(`${API_BASE_URL}/content/projects/bulk-export`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ projectIds, exportType, options }),
    });
    return this.handleResponse(response);
  }

  // Enhanced OptiSigns Integration APIs
  async publishProject(projectId: string, options: PublishOptions): Promise<ExportStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/content/projects/${projectId}/publish`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        displayIds: options.displayIds,
        priority: options.priority,
        duration: options.duration,
        message: options.message,
        restoreAfter: options.restoreAfter
      }),
    });
    return this.handleResponse(response);
  }

  // Legacy method name for backward compatibility
  async publishToOptiSigns(projectId: string, options: PublishOptions): Promise<ExportStatusResponse> {
    return this.publishProject(projectId, options);
  }

  async publishToOptiSignsLegacy(projectId: string, displayIds: string[], options?: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/content/projects/${projectId}/publish`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ displayIds, ...options }),
    });
    await this.handleResponse(response);
  }

  async getOptiSignsStatus(projectId: string) {
    // This endpoint doesn't exist in the documented API
    // We'll return a default status
    return {
      projectId,
      status: 'not_published',
      displayIds: [],
      displays: []
    };
  }

  async unpublishFromOptiSigns(projectId: string, displayIds?: string[]) {
    // This endpoint doesn't exist in the documented API
    throw new Error('Unpublish endpoint not available in current API');
  }

  async syncOptiSignsStatus(projectId: string) {
    // This endpoint doesn't exist in the documented API
    throw new Error('Sync status endpoint not available in current API');
  }

  async getAvailableDisplays() {
    const response = await fetch(`${API_BASE_URL}/optisigns/displays?limit=500`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async refreshDeviceStatuses() {
    // This endpoint doesn't exist in the documented API
    throw new Error('Refresh device statuses endpoint not available in current API');
  }

  async getLiveDeviceStatus() {
    // This endpoint doesn't exist in the documented API
    throw new Error('Live device status endpoint not available in current API');
  }

  // Progress Tracking Utilities
  async pollExportProgress(exportId: string, onProgress?: (progress: PublishProgress) => void, maxPollTime: number = 300000): Promise<ExportStatusResponse> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const statusResponse = await this.getExportStatus(exportId);
          
          if (onProgress && statusResponse.progress) {
            onProgress(statusResponse.progress);
          }
          
          // Check if completed (success or failure)
          if (statusResponse.export.status === 'completed') {
            resolve(statusResponse);
            return;
          }
          
          if (statusResponse.export.status === 'failed') {
            reject(new Error(statusResponse.export.errorMessage || 'Export failed'));
            return;
          }
          
          // Check timeout
          if (Date.now() - startTime > maxPollTime) {
            reject(new Error('Export polling timeout'));
            return;
          }
          
          // Continue polling
          setTimeout(poll, pollInterval);
          
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }

  // Convenience method for publish with progress tracking
  async publishWithProgress(projectId: string, options: PublishOptions, onProgress?: (progress: PublishProgress) => void): Promise<ExportStatusResponse> {
    const result = await this.publishToOptiSigns(projectId, options);
    
    if (result.export?.id && onProgress) {
      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const status = await this.getExportStatus(result.export.id);
          onProgress(status.progress);
          
          if (status.export.status === 'completed' || status.export.status === 'failed') {
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('Error polling export status:', error);
          clearInterval(pollInterval);
        }
      }, 2000);
    }
    
    return result;
  }

  // Batch status checking for multiple exports
  async getMultipleExportStatus(exportIds: string[]): Promise<Record<string, ExportStatusResponse>> {
    const promises = exportIds.map(async (exportId) => {
      try {
        const status = await this.getExportStatus(exportId);
        return { exportId, status };
      } catch (error) {
        return { 
          exportId, 
          status: { 
            export: { status: 'failed', errorMessage: (error as Error).message } as ContentExport,
            progress: { stage: 'failed', progress: 0, message: 'Failed to get status', timestamp: new Date().toISOString() } as PublishProgress,
            success: false,
            message: (error as Error).message
          } as ExportStatusResponse
        };
      }
    });
    
    const results = await Promise.all(promises);
    return results.reduce((acc, { exportId, status }) => {
      acc[exportId] = status;
      return acc;
    }, {} as Record<string, ExportStatusResponse>);
  }
}

export const exportApi = new ExportApiService();
export default exportApi; 