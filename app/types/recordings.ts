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
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
}

export interface PreviewResponse {
  previewId: string;
  streamUrl: string;
  characterCount: number;
  estimatedCost: number;
  expiresAt: string;
  voiceId: string;
  voiceSettings: VoiceSettings;
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
  description: string;
  type: 'ivr' | 'voicemail' | 'prompt' | 'announcement';
  scriptText: string;
  elevenLabsVoiceId: string;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  audioUrl?: string;
  metadata?: RecordingMetadata;
  createdAt: string;
  updatedAt: string;
  // FreePBX fields
  freepbxStatus?: 'not_configured' | 'pending' | 'uploaded' | 'failed';
  freepbxRecordingId?: string;
  freepbxUploadedAt?: string;
  freepbxError?: string;
  freepbxAutoUpload?: boolean;
}

export interface Voice {
  voiceId: string;
  name: string;
  category: string;
  description?: string;
  previewUrl?: string;
  labels?: {
    age?: string;
    accent?: string;
    gender?: string;
    language?: string;
    use_case?: string;
    descriptive?: string;
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