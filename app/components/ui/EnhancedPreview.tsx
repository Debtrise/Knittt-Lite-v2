'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './Input';
import { Textarea } from './textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card';
import { Slider } from './slider';
import { Switch } from './switch';
import { Badge } from './badge';
import { recordings } from '@/app/lib/api';
import { toast } from 'sonner';
import { 
  Play, 
  Pause, 
  Volume2, 
  Settings, 
  Zap, 
  Users, 
  Loader2,
  RefreshCw,
  Download
} from 'lucide-react';
import { 
  Voice, 
  VoiceSettings, 
  VoicePreset, 
  PreviewResponse, 
  BatchPreviewResponse 
} from '@/app/types/recordings';

interface EnhancedPreviewProps {
  text: string;
  onTextChange: (text: string) => void;
  selectedVoiceId: string;
  onVoiceChange: (voiceId: string) => void;
  onPreviewReady?: (previewData: PreviewResponse) => void;
}

export default function EnhancedPreview({
  text,
  onTextChange,
  selectedVoiceId,
  onVoiceChange,
  onPreviewReady
}: EnhancedPreviewProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicePresets, setVoicePresets] = useState<VoicePreset[]>([]);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0,
    useSpeakerBoost: true,
  });
  
  const [currentPreview, setCurrentPreview] = useState<PreviewResponse | null>(null);
  const [batchPreviews, setBatchPreviews] = useState<BatchPreviewResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [audioErrors, setAudioErrors] = useState<Set<string>>(new Set());
  const [isApiConfigured, setIsApiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    loadInitialData();
    checkApiConfiguration();
  }, []);

  const loadInitialData = async () => {
    try {
      const [voicesResponse, presetsResponse] = await Promise.all([
        // Use the recordings API instead of direct fetch
        recordings.getVoices().catch(error => {
          console.warn('Voices endpoint error:', error);
          return { data: [] };
        }),
        recordings.getVoicePresets().catch(error => {
          console.warn('Voice presets endpoint not available, using fallback data');
          // Provide fallback preset data
          return {
            data: [
              {
                name: "Default",
                description: "Balanced settings for general use",
                settings: { stability: 0.5, similarityBoost: 0.75, style: 0, useSpeakerBoost: true }
              },
              {
                name: "Very Stable",
                description: "Maximum consistency, minimal variation",
                settings: { stability: 0.9, similarityBoost: 0.8, style: 0, useSpeakerBoost: true }
              },
              {
                name: "More Variable",
                description: "More expressive with natural variation",
                settings: { stability: 0.3, similarityBoost: 0.6, style: 0.2, useSpeakerBoost: false }
              },
              {
                name: "Highly Expressive",
                description: "Maximum expressiveness and style",
                settings: { stability: 0.1, similarityBoost: 0.5, style: 0.8, useSpeakerBoost: false }
              }
            ]
          };
        }),
      ]);
      setVoices(voicesResponse.data || []);
      setVoicePresets(presetsResponse.data || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load voice data');
    }
  };

  const checkApiConfiguration = async () => {
    try {
      // Use the recordings API to check configuration
      const response = await recordings.getVoices();
      // If we get real voices (not just fallback), API is configured
      setIsApiConfigured(response.data?.length > 1);
    } catch (error) {
      setIsApiConfigured(false);
    }
  };

  const applyPreset = (presetName: string) => {
    const preset = voicePresets.find(p => p.name === presetName);
    if (preset) {
      setVoiceSettings(preset.settings);
      setSelectedPreset(presetName);
      toast.success(`Applied ${preset.name} preset`);
    }
  };

  const generatePreview = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text to preview');
      return;
    }

    if (!selectedVoiceId) {
      toast.error('Please select a voice');
      return;
    }

    try {
      setIsGenerating(true);
      console.log('Generating preview with:', {
        text: text.substring(0, 50) + '...',
        voiceId: selectedVoiceId,
        voiceSettings
      });

      const requestData = {
        text: text.trim(),
        voiceId: selectedVoiceId,
        voiceSettings,
      };

      console.log('Making preview request to /api/recordings/preview with:', requestData);

      const response = await recordings.preview(requestData);

      console.log('Preview response received:', response.data);
      
      // Fix the streamUrl to use the absolute API URL
      const previewData = {
        ...response.data,
        streamUrl: response.data.streamUrl.startsWith('/api/') 
          ? `http://34.122.156.88:3001${response.data.streamUrl}`
          : response.data.streamUrl
      };
      
      setCurrentPreview(previewData);
      onPreviewReady?.(previewData);
      toast.success(`🎵 Preview ready! (${previewData.characterCount} characters, ~$${(previewData.estimatedCost / 1000).toFixed(3)})`);
    } catch (error: any) {
      console.error('Preview generation failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Check if it's a backend endpoint not found error
      if (error.response?.status === 404) {
        // Create mock preview data for demonstration
        const mockPreview: PreviewResponse = {
          previewId: `preview_${Date.now()}_mock`,
          streamUrl: '#', // Use # to prevent actual loading
          characterCount: text.trim().length,
          estimatedCost: text.trim().length,
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          voiceId: selectedVoiceId || 'mock-voice',
          voiceSettings: voiceSettings,
        };
        
        setCurrentPreview(mockPreview);
        onPreviewReady?.(mockPreview);
        toast('ℹ️ Preview interface ready! (' + mockPreview.characterCount + ' characters) - Backend endpoints needed for audio');
      } else if (error.response?.status === 500 && error.response?.data?.error?.includes('API key not configured')) {
        toast.error('ElevenLabs API key not configured. Please configure it in the Settings page.');
      } else {
        toast.error(`Failed to generate preview: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBatchPreview = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text to preview');
      return;
    }

    if (voices.length < 2) {
      toast.error('Need at least 2 voices for comparison');
      return;
    }

    try {
      setIsBatchGenerating(true);
      const topVoices = voices.slice(0, 3).map(v => v.voiceId);
      
      const response = await recordings.batchPreview({
        text: text.trim(),
        voiceIds: topVoices,
        voiceSettings,
      });

      // Fix the streamUrls to use absolute API URLs
      const batchData = {
        ...response.data,
        previews: response.data.previews.map(preview => ({
          ...preview,
          streamUrl: preview.streamUrl.startsWith('/api/') 
            ? `http://34.122.156.88:3001${preview.streamUrl}`
            : preview.streamUrl
        }))
      };

      setBatchPreviews(batchData);
      toast.success(`Generated ${batchData.previews.length} voice comparisons (${batchData.totalCharacters} total characters)`);
    } catch (error: any) {
      console.error('Batch preview generation failed:', error);
      
      // Check if it's a backend endpoint not found error
      if (error.response?.status === 404) {
        // Create mock batch preview data for demonstration
        const topVoices = voices.slice(0, 3);
        const mockBatchPreview: BatchPreviewResponse = {
          previews: topVoices.map((voice, index) => ({
            previewId: `preview_${Date.now()}_${index}_mock`,
            voiceId: voice.voiceId,
            voiceName: voice.name,
            streamUrl: '#', // Use # to prevent actual loading
            characterCount: text.trim().length,
          })),
          totalCharacters: text.trim().length * topVoices.length,
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        };
        
        setBatchPreviews(mockBatchPreview);
        toast.info(`Voice comparison interface ready! (${mockBatchPreview.totalCharacters} total characters) - Backend endpoints needed for audio`);
      } else {
        toast.error('Failed to generate voice comparison');
      }
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const playPreview = async (previewId: string, streamUrl: string) => {
    if (playingPreview === previewId) {
      setPlayingPreview(null);
      return;
    }

    // Check if this is a mock URL
    if (streamUrl === '#') {
      // Simulate playback for demo purposes
      setPlayingPreview(previewId);
      toast('🎵 Demo playback - Audio will work when backend is implemented');
      
      // Auto-stop after 3 seconds to simulate playback
      setTimeout(() => {
        setPlayingPreview(null);
      }, 3000);
      return;
    }

    try {
      setPlayingPreview(previewId);
      
      // For authenticated streams, we need to fetch the audio data first
      if (streamUrl.includes('34.122.156.88:3001')) {
        const response = await recordings.streamPreview(previewId);
        const blob = new Blob([response.data], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setPlayingPreview(null);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setAudioErrors(prev => new Set([...prev, previewId]));
          toast.error('Failed to play preview');
          setPlayingPreview(null);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      } else {
        // For direct URLs, use the audio element directly
        const audio = new Audio(streamUrl);
        audio.onended = () => setPlayingPreview(null);
        audio.onerror = () => {
          setAudioErrors(prev => new Set([...prev, previewId]));
          toast.error('Failed to play preview - backend endpoint not available');
          setPlayingPreview(null);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Playback failed:', error);
      setAudioErrors(prev => new Set([...prev, previewId]));
      toast.error('Failed to play preview');
      setPlayingPreview(null);
    }
  };

  const downloadPreview = async (previewId: string, voiceName?: string) => {
    // Check if this is a mock preview
    if (previewId.includes('_mock')) {
      toast('ℹ️ Download requires backend implementation');
      return;
    }

    try {
      const response = await recordings.streamPreview(previewId);
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `preview_${voiceName || 'audio'}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download preview - backend endpoint not available');
    }
  };

  const characterCount = text.length;
  const estimatedCost = (characterCount * 0.001).toFixed(4);

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className={isApiConfigured ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {isApiConfigured ? (
                <Zap className="h-5 w-5 text-green-600" />
              ) : (
                <Settings className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              {isApiConfigured ? (
                <>
                  <h4 className="text-sm font-medium text-green-900">🎉 Eleven Labs API Connected!</h4>
                  <p className="text-sm text-green-700">
                    Real audio generation is active. All voice settings and previews will generate actual audio.
                  </p>
                </>
              ) : isApiConfigured === false ? (
                <>
                  <h4 className="text-sm font-medium text-blue-900">⚙️ ElevenLabs API Setup Required</h4>
                  <p className="text-sm text-blue-700">
                    Configure your ElevenLabs API key in the{' '}
                    <a href="/settings" className="underline font-medium hover:text-blue-800">
                      Settings page
                    </a>{' '}
                    to enable real audio generation. Demo mode is active with limited functionality.
                  </p>
                </>
              ) : (
                <>
                  <h4 className="text-sm font-medium text-blue-900">Loading Preview System...</h4>
                  <p className="text-sm text-blue-700">
                    Checking API configuration...
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Text Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Preview Text
          </CardTitle>
          <CardDescription>
            Enter the text you want to preview. Character count: {characterCount} (~${estimatedCost})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Enter your script text here..."
            rows={4}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Voice Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Voice Selection
          </CardTitle>
          {selectedVoiceId && (
            <CardDescription>
              Selected: {voices.find(v => v.voiceId === selectedVoiceId)?.name || 'Unknown Voice'}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Simple HTML select that will definitely work */}
          <select
            value={selectedVoiceId || ""}
            onChange={(e) => onVoiceChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a voice</option>
            {voices.map((voice, index) => (
              <option key={`voice-${voice.voiceId}-${index}`} value={voice.voiceId}>
                {voice.name}{voice.category ? ` (${voice.category})` : ''}
              </option>
            ))}
          </select>
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded">
              <div>Debug: Selected Voice ID: {selectedVoiceId || 'None'}</div>
              <div>Available Voices: {voices.length}</div>
              {selectedVoiceId && (
                <div>Selected Voice Name: {voices.find(v => v.voiceId === selectedVoiceId)?.name || 'Not found'}</div>
              )}
              <div>Voices loaded: {voices.map(v => v.name).join(', ')}</div>
              
              {/* Show first few voices with their actual structure */}
              <div className="mt-2">
                <div className="font-semibold">First 3 voices structure:</div>
                {voices.slice(0, 3).map((voice, i) => (
                  <div key={i} className="ml-2">
                    Voice {i + 1}: ID="{voice.voiceId}", Name="{voice.name}", Category="{voice.category || 'none'}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Voice Settings
            </div>
            <Switch
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
          </CardTitle>
          {showAdvanced && (
            <CardDescription>
              Fine-tune the voice characteristics for your preview
            </CardDescription>
          )}
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-6">
            {/* Presets */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {voicePresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant={selectedPreset === preset.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyPreset(preset.name)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stability */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Stability: {voiceSettings.stability.toFixed(2)}
              </label>
              <Slider
                value={[voiceSettings.stability]}
                onValueChange={([value]) => 
                  setVoiceSettings(prev => ({ ...prev, stability: value }))
                }
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Higher values make the voice more consistent but less expressive
              </p>
            </div>

            {/* Similarity Boost */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Similarity Boost: {voiceSettings.similarityBoost.toFixed(2)}
              </label>
              <Slider
                value={[voiceSettings.similarityBoost]}
                onValueChange={([value]) => 
                  setVoiceSettings(prev => ({ ...prev, similarityBoost: value }))
                }
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Enhances similarity to the original voice
              </p>
            </div>

            {/* Style */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Style: {voiceSettings.style.toFixed(2)}
              </label>
              <Slider
                value={[voiceSettings.style]}
                onValueChange={([value]) => 
                  setVoiceSettings(prev => ({ ...prev, style: value }))
                }
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Amplifies the style of the original speaker
              </p>
            </div>

            {/* Speaker Boost */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Speaker Boost</label>
                <p className="text-xs text-gray-500">
                  Boost similarity to the original speaker
                </p>
              </div>
              <Switch
                checked={voiceSettings.useSpeakerBoost}
                onCheckedChange={(checked) => 
                  setVoiceSettings(prev => ({ ...prev, useSpeakerBoost: checked }))
                }
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Preview Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={generatePreview}
              disabled={isGenerating || !text.trim()}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Preview
                </>
              )}
            </Button>
            
            <Button
              onClick={generateBatchPreview}
              disabled={isBatchGenerating || !text.trim()}
              variant="outline"
              className="flex-1"
            >
              {isBatchGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Compare Voices
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Single Preview Result */}
      {currentPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Ready</CardTitle>
            <CardDescription>
              Generated with {voices.find(v => v.voiceId === currentPreview.voiceId)?.name || 'Unknown Voice'}
              • {currentPreview.characterCount} characters 
              • Expires {new Date(currentPreview.expiresAt).toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => playPreview(currentPreview.previewId, currentPreview.streamUrl)}
                variant="outline"
              >
                {playingPreview === currentPreview.previewId ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              {/* Audio playback info */}
              <div className="flex-1 flex items-center justify-center p-4 bg-gray-100 rounded border">
                {playingPreview === currentPreview.previewId ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm text-blue-600 font-medium">
                      🎵 Playing audio...
                    </p>
                  </div>
                ) : currentPreview.streamUrl !== '#' ? (
                  <p className="text-sm text-gray-600">
                    🎵 Click the play button to stream audio
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    🎵 Audio preview will appear here when backend is implemented
                  </p>
                )}
              </div>
              
              <Button
                onClick={() => downloadPreview(currentPreview.previewId)}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Preview Results */}
      {batchPreviews && (
        <Card>
          <CardHeader>
            <CardTitle>Voice Comparison</CardTitle>
            <CardDescription>
              {batchPreviews.previews.length} voices • {batchPreviews.totalCharacters} total characters
              • Expires {new Date(batchPreviews.expiresAt).toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {batchPreviews.previews.map((preview) => (
              <div key={preview.previewId} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{preview.voiceName}</div>
                  <div className="text-sm text-gray-500">
                    {preview.characterCount} characters
                  </div>
                </div>
                
                <Button
                  onClick={() => playPreview(preview.previewId, preview.streamUrl)}
                  variant="outline"
                  size="sm"
                >
                  {playingPreview === preview.previewId ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                
                {/* Audio playback info */}
                <div className="w-48 flex items-center justify-center p-2 bg-gray-100 rounded border">
                  {playingPreview === preview.previewId ? (
                    <div className="flex items-center gap-1">
                      <div className="animate-pulse w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <p className="text-xs text-blue-600 font-medium">Playing...</p>
                    </div>
                  ) : preview.streamUrl !== '#' ? (
                    <p className="text-xs text-gray-600">Click play</p>
                  ) : (
                    <p className="text-xs text-gray-600">Backend needed</p>
                  )}
                </div>
                
                <Button
                  onClick={() => downloadPreview(preview.previewId, preview.voiceName)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={() => onVoiceChange(preview.voiceId)}
                  variant="outline"
                  size="sm"
                >
                  Select
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 