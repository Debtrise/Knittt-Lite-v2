import axios, { AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';
import api, { auth } from './api';
import { 
  Recording, 
  RecordingsListResponse, 
  RecordingCreateRequest,
  RecordingUpdateRequest,
  ElevenLabsConfig,
  RecordingAnalytics,
  RecordingUsage,
  Voice,
  PreviewResponse,
  VoicePreviewResponse,
  VoiceUsageStats,
  AsteriskRecording,
  BulkActionResult
} from '../types/recordings';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';

const apiInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
apiInstance.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  if (!token) {
    // If no token exists, try to login as admin
    try {
      const response = await auth.adminLogin();
      const { token: newToken, user } = response.data.data;
      useAuthStore.getState().setAuth(newToken, user);
      config.headers.Authorization = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Failed to authenticate as admin:', error);
    }
  } else {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
apiInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export class RecordingsService {
  // Core Recording Operations
  async listRecordings(params?: {
    page?: number;
    limit?: number;
    type?: 'tts' | 'upload' | 'template';
    isActive?: boolean;
  }): Promise<RecordingsListResponse> {
    const response = await apiInstance.get('/recordings', { params });
    return response.data;
  }

  async getRecording(id: string): Promise<Recording> {
    const response = await apiInstance.get(`/recordings/${id}`);
    return response.data;
  }

  async createRecording(data: RecordingCreateRequest): Promise<Recording> {
    const response = await apiInstance.post('/recordings', data);
    return response.data;
  }

  async updateRecording(id: string, data: RecordingUpdateRequest): Promise<Recording> {
    const response = await apiInstance.put(`/recordings/${id}`, data);
    return response.data;
  }

  async deleteRecording(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiInstance.delete(`/recordings/${id}`);
    return response.data;
  }

  // Audio Generation & Files
  async generateRecordingAudio(recordingId: string): Promise<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    generatedAt: string;
    message: string;
  }> {
    const response = await apiInstance.post(`/recordings/${recordingId}/generate`);
    return response.data;
  }

  async uploadAudioFile(recordingId: string, audioFile: File): Promise<{
    success: boolean;
    message: string;
    recording: {
      id: string;
      fileName: string;
      fileSize: number;
      generatedAt: string;
    };
  }> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    const response = await apiInstance.post(`/recordings/${recordingId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getAudioFile(recordingId: string): Promise<Blob> {
    const response = await apiInstance.get(`/recordings/${recordingId}/audio`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async previewTextToSpeech(data: {
    text: string;
    voiceId?: string;
  }): Promise<PreviewResponse> {
    try {
      console.log('Making preview request to:', '/recordings/config/elevenlabs/test-voice');
      console.log('Request data:', data);
      
      const response = await apiInstance.post('/recordings/config/elevenlabs/test-voice', {
        voiceId: data.voiceId,
        text: data.text
      });

      console.log('Raw API response:', response.data);

      // Ensure we have the required fields
      if (!response.data.audioUrl) {
        throw new Error('No audio URL in response');
      }

      // Construct the full URL if it's not already absolute
      const audioUrl = response.data.audioUrl.startsWith('http') 
        ? response.data.audioUrl 
        : `${API_URL.replace('/api', '')}${response.data.audioUrl}`;

      return {
        success: true,
        audioUrl,
        voiceId: response.data.voiceId || data.voiceId,
        text: response.data.text || data.text,
        charactersUsed: response.data.charactersUsed || 0,
        message: response.data.message || 'Preview generated successfully'
      };
    } catch (error) {
      console.error('Preview request failed:', error);
      if (axios.isAxiosError(error)) {
        console.error('API error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  }

  // Asterisk Integration
  async getAsteriskStatus(recordingId: string): Promise<{
    asteriskPath: string;
    fullPath: string;
    deployedAt: string;
    status: 'deployed' | 'not_deployed' | 'error';
  }> {
    const response = await apiInstance.get(`/api/recordings/${recordingId}/asterisk-path`);
    return response.data;
  }

  async listAsteriskRecordings(): Promise<{
    recordings: Array<{
      filename: string;
      size: string;
      lastModified: string;
      fullPath: string;
    }>;
  }> {
    const response = await apiInstance.get('/recordings/asterisk/list');
    return response.data;
  }

  async testAsteriskConnection(): Promise<{
    success: boolean;
    message: string;
    host: string;
    output: string;
  }> {
    const response = await apiInstance.post('/recordings/test-asterisk-ssh');
    return response.data;
  }

  async deployToAsterisk(recordingId: string): Promise<{
    success: boolean;
    asteriskPath: string;
    remoteFilePath: string;
    deployedAt: string;
    fileInfo: string;
    message: string;
  }> {
    const response = await apiInstance.post(`/recordings/${recordingId}/deploy-to-asterisk`);
    return response.data;
  }

  // Bulk Operations
  async bulkAction(action: 'deploy-to-asterisk' | 'generate-audio' | 'delete', data: {
    recordingIds: string[];
    options?: {
      force?: boolean;
    };
  }): Promise<BulkActionResult> {
    const response = await apiInstance.post(`/recordings/bulk/${action}`, data);
    return response.data;
  }

  // Eleven Labs Configuration
  async getElevenLabsConfig(): Promise<ElevenLabsConfig> {
    const response = await apiInstance.get('/recordings/config/elevenlabs');
    return response.data;
  }

  async updateElevenLabsConfig(config: {
    apiKey?: string;
    defaultVoiceId?: string;
    monthlyCharacterLimit?: number;
    voiceSettings?: {
      stability: number;
      similarity_boost: number;
    };
  }): Promise<ElevenLabsConfig> {
    const response = await apiInstance.put('/recordings/config/elevenlabs', config);
    return response.data;
  }

  async testElevenLabsConnection(apiKey?: string): Promise<{
    success: boolean;
    message: string;
    apiKeyValid: boolean;
    subscriptionActive: boolean;
    characterQuota: {
      remaining: number;
      total: number;
    };
    voicesAvailable: number;
    responseTime: number;
  }> {
    const response = await apiInstance.post('/recordings/config/elevenlabs/test-connection', { apiKey });
    return response.data;
  }

  async getAvailableVoices(): Promise<{
    voices: Voice[];
    totalCount: number;
    defaultVoiceId: string;
  }> {
    const response = await apiInstance.get('/recordings/config/elevenlabs/voices');
    return response.data;
  }

  async testVoice(data: {
    voiceId: string;
    text: string;
  }): Promise<{
    success: boolean;
    audioUrl: string;
    voiceId: string;
    text: string;
    charactersUsed: number;
    message: string;
  }> {
    const response = await apiInstance.post('/recordings/config/elevenlabs/test-voice', data);
    return response.data;
  }

  async getUsageStats(period: 'today' | 'week' | 'month' = 'month'): Promise<VoiceUsageStats> {
    const response = await apiInstance.get(`/recordings/config/elevenlabs/usage?period=${period}`);
    return response.data;
  }

  // Analytics & Usage Tracking
  async getRecordingAnalytics(recordingId: string, params: {
    startDate: string;
    endDate: string;
  }): Promise<RecordingAnalytics> {
    const response = await apiInstance.get(`/recordings/${recordingId}/analytics`, { params });
    return response.data;
  }

  async trackUsage(recordingId: string, data: {
    context: string;
    callId?: string;
    leadId?: string;
    duration?: number;
    completed?: boolean;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiInstance.post(`/recordings/${recordingId}/track-usage`, data);
    return response.data;
  }
}

// Export an instance of the service
export const recordingsService = new RecordingsService();