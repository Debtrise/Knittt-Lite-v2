'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Upload, Play, Pause, AlertTriangle, Check, ArrowLeft, Plus, X, FileText } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/select';
import { Tabs } from '@/app/components/ui/tabs';
import { AudioPlayer } from '@/app/components/ui/AudioPlayer';
import { recordingsService } from '@/app/services/recordingsService';
import { Voice, RecordingCreateRequest } from '@/app/types/recordings';
import { toast } from 'react-hot-toast';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Slider } from '@/app/components/ui/slider';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Loader2, Volume2, Save } from 'lucide-react';
import { PreviewAudioPlayer } from '@/app/components/ui/PreviewAudioPlayer';
import DashboardLayout from '@/app/components/layout/Dashboard';

export default function CreateRecordingPage() {
  const router = useRouter();
  const [type, setType] = useState<'tts' | 'upload' | 'template'>('tts');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [previewGenerated, setPreviewGenerated] = useState(false);

  useEffect(() => {
    if (type === 'tts' || type === 'template') {
      fetchAvailableVoices();
    }
  }, [type]);

  // Reset preview when text or voice changes
  useEffect(() => {
    setPreviewGenerated(false);
    setPreviewAudioUrl(null);
  }, [text, selectedVoice?.voice_id, voiceSettings.stability, voiceSettings.similarity_boost]);

  const fetchAvailableVoices = async () => {
    try {
      setIsLoadingVoices(true);
      const response = await recordingsService.getAvailableVoices();
      
      if (!response.voices || response.voices.length === 0) {
        throw new Error('No voices available');
      }

      setAvailableVoices(response.voices);
      
      // Set default voice if none selected
      if (!selectedVoice) {
        const defaultVoice = response.voices.find(v => v.voice_id === response.defaultVoiceId) || response.voices[0];
        setSelectedVoice(defaultVoice);
      }
      
      // Get voice settings
      if (selectedVoice) {
        try {
          const config = await recordingsService.getElevenLabsConfig();
          setVoiceSettings(config.voiceSettings);
        } catch (error) {
          console.error('Error fetching voice settings:', error);
          // Set default settings
          setVoiceSettings({
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching voices:', err);
      toast.error(err.message || 'Failed to load available voices');
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const handlePreviewVoice = async () => {
    if (!text || !selectedVoice) {
      toast.error('Please enter text and select a voice');
      return;
    }

    try {
      setIsGeneratingPreview(true);
      console.log('Sending preview request:', {
        text,
        voiceId: selectedVoice.voice_id
      });
      
      const response = await recordingsService.previewTextToSpeech({
        text,
        voiceId: selectedVoice.voice_id
      });

      console.log('Preview response:', response);

      if (!response.success) {
        throw new Error(response.message || 'Failed to generate preview');
      }

      // The audioUrl from the API is already a full URL
      setPreviewAudioUrl(response.audioUrl);
      setPreviewGenerated(true);
      toast.success('Preview generated successfully');
    } catch (error) {
      console.error('Preview failed:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      toast.error(error instanceof Error ? error.message : 'Failed to generate preview');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleSavePreview = async () => {
    if (!name.trim() || !text.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedVoice) {
      toast.error('Please select a voice');
      return;
    }

    try {
      setIsLoading(true);

      const recordingData: RecordingCreateRequest = {
        name: name.trim(),
        description: description.trim(),
        text: text.trim(),
        type: 'tts',
        elevenLabsVoiceId: selectedVoice.voice_id,
        voiceSettings,
        isActive: true
      };

      // Create the recording
      const newRecording = await recordingsService.createRecording(recordingData);
      toast.success('Recording created successfully');

      // Generate audio immediately
      try {
        setIsGeneratingAudio(true);
        await recordingsService.generateRecordingAudio(newRecording.id);
        toast.success('Audio generated successfully');

        // Auto-deploy to PBX after successful generation
        try {
          setIsDeploying(true);
          await recordingsService.deployToAsterisk(newRecording.id);
          toast.success('Recording is ready for use');
          
          // Redirect to recordings page to see the deployed recording
          router.push('/recordings');
        } catch (deployError) {
          console.error('Failed to deploy to PBX:', deployError);
          toast.error('Audio generated but failed to finalize. You can complete this from the recordings page.');
          // Still redirect since the recording was created and audio generated
          router.push('/recordings');
        } finally {
          setIsDeploying(false);
        }
      } catch (audioError) {
        console.error('Failed to generate audio:', audioError);
        toast.error('Recording created but failed to generate audio. You can generate audio manually from the recordings page.');
        // Still redirect since the recording was created
        router.push('/recordings');
      } finally {
        setIsGeneratingAudio(false);
      }
    } catch (error) {
      console.error('Failed to create recording:', error);
      toast.error('Failed to create recording');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVoiceSettings = async () => {
    if (!selectedVoice || !voiceSettings) return;

    try {
      setIsSavingSettings(true);
      const result = await recordingsService.updateElevenLabsConfig({
        voiceSettings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarity_boost
        }
      });
      
      toast.success('Voice settings updated successfully');
    } catch (err: any) {
      console.error('Error updating voice settings:', err);
      toast.error('Failed to update voice settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create Recording</h1>
          <Button onClick={() => router.back()}>Back</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recording Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter recording name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter recording description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text">Text</Label>
                  <Textarea
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text to convert to speech"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={previewGenerated ? handleSavePreview : handlePreviewVoice}
                    disabled={isGeneratingPreview || !text.trim() || !selectedVoice || isLoading}
                  >
                    {isGeneratingPreview ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Preview...
                      </>
                    ) : previewGenerated ? (
                      <>
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {isGeneratingAudio ? 'Generating Audio...' : isDeploying ? 'Finalizing...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Save & Deploy
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Preview Voice
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/recordings')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>

                {previewAudioUrl && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Preview</h3>
                    <PreviewAudioPlayer url={previewAudioUrl} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Voice Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Voice</Label>
                  <Select
                    value={selectedVoice?.voice_id}
                    onValueChange={(value) => {
                      const voice = availableVoices.find(v => v.voice_id === value);
                      setSelectedVoice(voice || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVoices.map((voice) => (
                        <SelectItem key={voice.voice_id} value={voice.voice_id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedVoice && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Voice Settings</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="stability" className="text-sm">Stability</Label>
                          <span className="text-sm text-muted-foreground">{voiceSettings.stability}</span>
                        </div>
                        <Slider
                          id="stability"
                          value={[voiceSettings.stability]}
                          min={0}
                          max={1}
                          step={0.01}
                          onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, stability: value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="similarity" className="text-sm">Similarity Boost</Label>
                          <span className="text-sm text-muted-foreground">{voiceSettings.similarity_boost}</span>
                        </div>
                        <Slider
                          id="similarity"
                          value={[voiceSettings.similarity_boost]}
                          min={0}
                          max={1}
                          step={0.01}
                          onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, similarity_boost: value }))}
                        />
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleSaveVoiceSettings}
                      disabled={isSavingSettings}
                    >
                      {isSavingSettings ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Voice Settings'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 