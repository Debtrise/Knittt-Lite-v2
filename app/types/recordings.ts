export interface RecordingMetadata {
  id: string;
  name?: string;
  duration?: number;
  isAvailable: boolean;
  characterCount: number;
  canStream: boolean;
  hasLocalFile: boolean;
  fileSize?: number;
  lastGenerated?: string;
  voiceId?: string;
  voiceSettings?: VoiceSettings;
  scriptText?: string;
  templateVariables?: Record<string, any>;
  elevenLabsUsage?: {
    charactersUsed: number;
    estimatedCost: number;
  };
  streamingInfo?: {
    supportsStreaming: boolean;
    requiresRegeneration: boolean;
    lastStreamedAt?: string;
  };
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export interface PreviewResponse {
  success: boolean;
  audioUrl: string;
  voiceId: string;
  text: string;
  charactersUsed: number;
  message: string;
}

export interface BatchPreviewResponse {
  previews: Array<{
    previewId: string;
    voiceId: string;
    voiceName: string;
    streamUrl: string;
    characterCount: number;
  }>;
  totalCharacters: number;
  expiresAt: string;
}

export interface VoicePreset {
  name: string;
  description: string;
  settings: VoiceSettings;
}

export interface StreamingResponse {
  audioData: Blob;
  contentType: string;
  duration?: number;
  characterCount: number;
  cacheControl: string;
}

export interface Recording {
  id: string;
  name: string;
  description?: string;
  type: 'tts' | 'upload' | 'template';
  text?: string;
  voiceId?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  generatedAt?: string;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    originalFileName?: string;
    uploadedBy?: string;
    uploadSource?: string;
  };
}

export interface Voice {
  voice_id: string;
  name: string;
  category: 'premade' | 'professional';
  description: string;
  preview_url: string;
  labels: {
    accent?: string;
    descriptive?: string;
    age?: string;
    gender?: string;
    language?: string;
    use_case?: string;
  };
}

export interface ElevenLabsUsage {
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
  allowed_to_extend_character_limit: boolean;
  next_character_count_reset_unix: number;
  voice_limit: number;
  max_voice_add_edits: number;
  voice_add_edit_counter: number;
  professional_voice_limit: number;
  can_extend_voice_limit: boolean;
  can_use_instant_voice_cloning: boolean;
  can_use_professional_voice_cloning: boolean;
  currency: string;
  status: string;
}

export interface ElevenLabsConfig {
  tenantId: string;
  apiKey: string;
  defaultVoiceId: string;
  monthlyCharacterLimit: number;
  charactersUsedThisMonth: number;
  lastResetDate: string;
  voiceSettings: VoiceSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FreePBXRecording {
  id: string;
  name: string;
  description?: string;
  filename: string;
  duration?: number;
  freepbxId: string;
  originalName: string;
}

export interface RecordingAnalytics {
  totalPlays: number;
  uniqueLeads: number;
  averagePlayDuration: number;
  completionRate: number;
  usageByDate: Array<{
    date: string;
    plays: number;
    uniqueLeads: number;
    averageDuration: number;
    completionRate: number;
  }>;
}

export interface RecordingUsage {
  id: number;
  recordingId: number;
  tenantId: string;
  usedAt: string;
  context: string;
  callId?: string;
  leadId?: number;
  userId?: number;
  userAgent?: string;
  ip?: string;
  duration?: number;
  completed: boolean;
  metadata?: Record<string, any>;
}

export interface RecordingsListResponse {
  recordings: Recording[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface RecordingCreateRequest {
  name: string;
  description: string;
  text: string;
  type: 'tts';
  elevenLabsVoiceId: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface RecordingUpdateRequest {
  name?: string;
  description?: string;
  text?: string;
  elevenLabsVoiceId?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface FreePBXStatus {
  online: boolean;
  serverUrl: string;
  serverIp: string;
  lastChecked: string;
  responseTime: number;
}

export interface VoiceSettingsInfo {
  settings: {
    stability: {
      description: string;
      range: [number, number];
      default: number;
      current: number;
    };
    similarity_boost: {
      description: string;
      range: [number, number];
      default: number;
      current: number;
    };
    style: {
      description: string;
      range: [number, number];
      default: number;
      current: number;
    };
    use_speaker_boost: {
      description: string;
      type: 'boolean';
      default: boolean;
      current: boolean;
    };
  };
}

export interface VoicePreviewResponse {
  success: boolean;
  streamUrl: string;
  voiceId: string;
  charactersUsed: number;
  message: string;
}

export interface VoiceTestResponse {
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
}

export interface VoiceUsageStats {
  period: string;
  charactersUsed: number;
  charactersLimit: number;
  charactersRemaining: number;
  usagePercentage: number;
  resetDate: string;
  daysUntilReset: number;
  dailyAverage: number;
  projectedMonthlyUsage: number;
  willExceedLimit: boolean;
  usage: Array<{
    date: string;
    characters: number;
    recordings: number;
    previews: number;
  }>;
}

export interface GenerationHistory {
  history: Array<{
    id: number;
    recordingId?: number;
    recordingName?: string;
    text: string;
    voiceId: string;
    voiceName: string;
    charactersUsed: number;
    generatedAt: string;
    type: 'recording' | 'preview';
  }>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface AsteriskRecording {
  filename: string;
  size: string;
  lastModified: string;
  fullPath: string;
}

export interface BulkActionResult {
  action: 'deploy-to-asterisk' | 'generate-audio' | 'delete';
  totalRecordings: number;
  successful: number;
  failed: number;
  results: Array<{
    recordingId: string;
    success: boolean;
    message: string;
    error?: string;
  }>;
  errors: Array<{
    recordingId: string;
    error: string;
  }>;
} 