'use client';

import { useState, useEffect } from 'react';
import { recordings } from '@/app/lib/api';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Upload, Plus, Play, Settings, Zap } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import AudioPlayer from '@/app/components/ui/AudioPlayer';
import { Recording, Voice, PreviewResponse } from '@/app/types/recordings';
import EnhancedPreview from '@/app/components/ui/EnhancedPreview';

export default function RecordingsPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [recordingsList, setRecordingsList] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isApiConfigured, setIsApiConfigured] = useState<boolean | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'ivr' as const,
    scriptText: '',
    elevenLabsVoiceId: '',
  });

  useEffect(() => {
    loadData();
    checkApiConfiguration();
  }, []);

  const checkApiConfiguration = async () => {
    try {
      // First check if we have a valid API configuration from settings
      const configResponse = await recordings.getConfig();
      if (!configResponse.data?.apiKey) {
        setIsApiConfigured(false);
        return;
      }

      // Then test if the API key works by fetching voices
      const response = await recordings.getVoices();
      // If we get real voices (not just fallback), API is configured
      const voicesData = Array.isArray(response.data) ? response.data : [];
      setIsApiConfigured(voicesData.length > 0);
    } catch (error) {
      console.warn('API configuration check failed:', error);
      setIsApiConfigured(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check API configuration first
      await checkApiConfiguration();
      
      const [voicesResponse, recordingsResponse] = await Promise.all([
        recordings.getVoices().catch(error => {
          if (error.response?.status === 404 || error.response?.status === 401) {
            console.warn('Eleven Labs API not configured or unauthorized');
            return { data: [] };
          }
          throw error;
        }),
        recordings.list({ limit: 100 }),
      ]);
      
      setVoices(Array.isArray(voicesResponse.data) ? voicesResponse.data : []);
      // Fix: The API returns { data: [...], pagination: {...} }
      // We need to extract the recordings array from response.data.data
      const recordingsData = recordingsResponse.data?.data || recordingsResponse.data || [];
      setRecordingsList(Array.isArray(recordingsData) ? recordingsData : []);
    } catch (error) {
      console.error('Error loading recordings:', error);
      toast.error('Failed to load recordings data');
      setVoices([]);
      setRecordingsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAudio = async (recordingId: string) => {
    try {
      setGenerating(recordingId);
      const response = await recordings.generateAudio(recordingId);
      toast.success('Audio generated successfully');
      await loadData(); // Reload to get the new audio URL
    } catch (error) {
      toast.error('Failed to generate audio');
      console.error(error);
    } finally {
      setGenerating(null);
    }
  };

  const handlePlayStateChange = (recordingId: string, isPlaying: boolean) => {
    if (isPlaying) {
      setCurrentlyPlaying(recordingId);
    } else if (currentlyPlaying === recordingId) {
      setCurrentlyPlaying(null);
    }
  };

  const handlePreviewReady = (previewData: PreviewResponse) => {
    // Preview is ready - could show additional UI feedback here
    console.log('Preview ready:', previewData);
    toast.success('🎵 Preview generated! Click play to listen.');
  };

  const handleCreateRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.elevenLabsVoiceId) {
      toast.error('Please select a voice');
      return;
    }
    
    try {
      await recordings.create(formData);
      toast.success('Recording created successfully');
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        type: 'ivr',
        scriptText: '',
        elevenLabsVoiceId: '',
      });
      await loadData();
    } catch (error) {
      toast.error('Failed to create recording');
      console.error(error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData({
      name: '',
      description: '',
      type: 'ivr',
      scriptText: '',
      elevenLabsVoiceId: '',
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('name', file.name);
    formData.append('type', 'ivr');

    try {
      await recordings.uploadAudio(formData);
      toast.success('Audio uploaded successfully');
      await loadData();
    } catch (error) {
      toast.error('Failed to upload audio');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Recordings</h1>
            <p className="text-gray-600 mt-2">Create and manage your ElevenLabs text-to-speech recordings with real-time preview</p>
          </div>
          <div className="space-x-4">
            <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Recording
            </Button>
            <label htmlFor="file-upload">
              <Button variant="outline" asChild>
                <div>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Audio
                </div>
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {/* API Configuration Status */}
        {isApiConfigured !== null && (
          <Card className={`mb-6 ${isApiConfigured ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {isApiConfigured ? (
                    <Zap className="h-5 w-5 text-green-600" />
                  ) : (
                    <Settings className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div>
                  {isApiConfigured ? (
                    <>
                      <h4 className="text-sm font-medium text-green-900">🎉 ElevenLabs API Connected!</h4>
                      <p className="text-sm text-green-700">
                        Real audio generation is active. You can preview voices and generate high-quality audio.
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-medium text-amber-900">⚙️ ElevenLabs API Setup Required</h4>
                      <p className="text-sm text-amber-700">
                        Configure your ElevenLabs API key in the{' '}
                        <a href="/settings" className="underline font-medium hover:text-amber-800">
                          Settings page
                        </a>{' '}
                        to enable real audio generation. Demo mode is active with limited functionality.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Create New Recording
              </CardTitle>
              <CardDescription>
                Create a new text-to-speech recording using ElevenLabs. Preview your audio before saving!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRecording} className="space-y-6">
                {/* Preview Section - Make this prominent */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Zap className="w-5 h-5" />
                      🎵 Preview Your Audio
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Write your text, pick a voice, and hit preview to hear how it sounds before saving!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EnhancedPreview
                      text={formData.scriptText}
                      onTextChange={(text) => setFormData(prev => ({ ...prev, scriptText: text }))}
                      selectedVoiceId={formData.elevenLabsVoiceId}
                      onVoiceChange={(voiceId) => setFormData(prev => ({ ...prev, elevenLabsVoiceId: voiceId }))}
                      onPreviewReady={handlePreviewReady}
                    />
                  </CardContent>
                </Card>

                {/* Recording Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recording Details</CardTitle>
                    <CardDescription>
                      Set the name and details for your recording
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Name *</label>
                        <Input
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Welcome Message"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select
                          value={formData.type}
                          onValueChange={value => setFormData(prev => ({ ...prev, type: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ivr">IVR</SelectItem>
                            <SelectItem value="voicemail">Voicemail</SelectItem>
                            <SelectItem value="prompt">Prompt</SelectItem>
                            <SelectItem value="announcement">Announcement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={handleCloseForm}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!formData.name || !formData.scriptText || !formData.elevenLabsVoiceId}
                  >
                    Save Recording
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your Recordings</CardTitle>
            <CardDescription>
              Manage your text-to-speech recordings and audio files. Recordings can be streamed directly from Eleven Labs or played from local files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Voice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Audio Player</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordingsList.map((recording, index) => (
                  <TableRow key={`${recording.id}-${index}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{recording.name}</div>
                        {recording.description && (
                          <div className="text-sm text-gray-500">{recording.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{recording.type}</TableCell>
                    <TableCell>
                      {Array.isArray(voices) && voices.find(v => v.voiceId === recording.elevenLabsVoiceId)?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        recording.status === 'ready' 
                          ? 'bg-green-100 text-green-800' 
                          : recording.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {recording.status}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-[400px]">
                      <AudioPlayer
                        recordingId={recording.id}
                        recordingName={recording.name}
                        audioUrl={recording.audioUrl}
                        onPlayStateChange={(isPlaying) => handlePlayStateChange(recording.id, isPlaying)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {!recording.audioUrl && recording.status !== 'generating' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateAudio(recording.id)}
                            disabled={!!generating}
                          >
                            {generating === recording.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Generate'
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {recordingsList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No recordings found. Create your first recording to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 