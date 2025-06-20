'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { PreviewAudioPlayer } from '@/app/components/ui/PreviewAudioPlayer';
import { toast } from 'react-hot-toast';
import { recordingsService } from '@/app/services/recordingsService';
import type { Recording, VoiceSettings, Voice } from '@/app/types/recordings';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Trash2, Download, Upload, RefreshCw, Volume2, Settings, ArrowLeft, FileAudio } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/app/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Slider } from '@/app/components/ui/slider';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Textarea } from '@/app/components/ui/textarea';
import { Save } from 'lucide-react';

export default function RecordingDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  useEffect(() => {
    fetchRecording();
    fetchAvailableVoices();
  }, [params.id]);

  const fetchRecording = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recordingsService.getRecording(params.id as string);
      setRecording(data);
      
      if (data.elevenLabsVoiceId) {
        // Find the voice settings for this voice
        const voice = availableVoices.find(v => v.voice_id === data.elevenLabsVoiceId);
        if (voice) {
          setSelectedVoice(voice);
          setVoiceSettings({
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching recording:', err);
      setError(err.message || 'Failed to load recording');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableVoices = async () => {
    try {
      setIsLoadingVoices(true);
      const response = await recordingsService.getAvailableVoices();
      setAvailableVoices(response.voices);
    } catch (err: any) {
      console.error('Error fetching voices:', err);
      toast.error(err.message || 'Failed to load available voices');
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!recording) return;

    try {
      setIsGenerating(true);
      const result = await recordingsService.generateAudio(recording.id);
      toast.success('Audio generated successfully');
      fetchRecording();
    } catch (err: any) {
      console.error('Error generating audio:', err);
      toast.error('Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadAudio = async (file: File) => {
    if (!recording) return;

    try {
      setIsUploading(true);
      const result = await recordingsService.uploadAudio(recording.id, file);
      toast.success('Audio uploaded successfully');
      fetchRecording();
    } catch (err: any) {
      console.error('Error uploading audio:', err);
      toast.error('Failed to upload audio');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRecording = async () => {
    if (!recording) return;

    try {
      setIsDeleting(true);
      await recordingsService.deleteRecording(recording.id);
      toast.success('Recording deleted successfully');
      router.push('/recordings');
    } catch (err: any) {
      console.error('Error deleting recording:', err);
      toast.error('Failed to delete recording');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveVoiceSettings = async () => {
    if (!recording || !voiceSettings || !recording.elevenLabsVoiceId) return;

    try {
      setIsSavingSettings(true);
      const result = await recordingsService.updateVoiceSettings(recording.elevenLabsVoiceId, voiceSettings);
      if (result.success) {
        toast.success('Voice settings updated successfully');
        setShowVoiceSettings(false);
      } else {
        toast.error(result.message || 'Failed to update voice settings');
      }
    } catch (err: any) {
      console.error('Error updating voice settings:', err);
      toast.error('Failed to update voice settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePreviewVoice = async () => {
    if (!selectedVoice || !previewText) return;

    try {
      setIsGeneratingPreview(true);
      const response = await recordingsService.previewTextToSpeech({
        text: previewText,
        voiceId: selectedVoice.voice_id
      });
      setPreviewAudioUrl(response.audioUrl);
    } catch (err: any) {
      console.error('Error generating preview:', err);
      toast.error(err.message || 'Failed to generate voice preview');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Recording not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{recording.name}</h1>
          <p className="text-gray-500">{recording.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/recordings')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recording Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <p className="text-sm text-gray-500">{recording.type}</p>
              </div>
              <div>
                <Label>Status</Label>
                <p className="text-sm text-gray-500">{recording.status}</p>
              </div>
              <div>
                <Label>Created</Label>
                <p className="text-sm text-gray-500">
                  {new Date(recording.createdAt).toLocaleString()}
                </p>
              </div>
              {recording.tags && recording.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {recording.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audio</CardTitle>
          </CardHeader>
          <CardContent>
            {recording.fileUrl ? (
              <div className="space-y-4">
                <PreviewAudioPlayer url={recording.fileUrl} />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`http://34.122.156.88:3001${recording.fileUrl}`, '_blank')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recording.type === 'tts' ? (
                  <Button
                    onClick={handleGenerateAudio}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileAudio className="mr-2 h-4 w-4" />
                    )}
                    Generate Audio
                  </Button>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Upload an audio file
                    </p>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadAudio(file);
                      }}
                      className="hidden"
                      id="audio-upload"
                    />
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => document.getElementById('audio-upload')?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {recording.type === 'tts' && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Voice Settings</CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowVoiceSettings(true)}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Configure
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {voiceSettings && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Stability</Label>
                  <p className="text-sm text-gray-500">
                    {voiceSettings.stability}
                  </p>
                </div>
                <div>
                  <Label>Similarity Boost</Label>
                  <p className="text-sm text-gray-500">
                    {voiceSettings.similarity_boost}
                  </p>
                </div>
                <div>
                  <Label>Style</Label>
                  <p className="text-sm text-gray-500">
                    {voiceSettings.style}
                  </p>
                </div>
                <div>
                  <Label>Speaker Boost</Label>
                  <p className="text-sm text-gray-500">
                    {voiceSettings.use_speaker_boost ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recording</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this recording? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRecording}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Settings Dialog */}
      <Dialog open={showVoiceSettings} onOpenChange={setShowVoiceSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Settings</DialogTitle>
            <DialogDescription>
              Configure the voice settings for this recording
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Voice</Label>
              <Select
                value={selectedVoice?.voice_id}
                onValueChange={(value) => {
                  const voice = availableVoices.find(v => v.voice_id === value);
                  setSelectedVoice(voice || null);
                }}
                disabled={isLoadingVoices}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.voice_id} value={voice.voice_id}>
                      {voice.name} - {voice.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {voiceSettings && (
              <>
                <div>
                  <Label>Stability</Label>
                  <Slider
                    value={[voiceSettings.stability]}
                    onValueChange={([value]) =>
                      setVoiceSettings({ ...voiceSettings, stability: value })
                    }
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>

                <div>
                  <Label>Similarity Boost</Label>
                  <Slider
                    value={[voiceSettings.similarity_boost]}
                    onValueChange={([value]) =>
                      setVoiceSettings({ ...voiceSettings, similarity_boost: value })
                    }
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>

                <div>
                  <Label>Style</Label>
                  <Slider
                    value={[voiceSettings.style]}
                    onValueChange={([value]) =>
                      setVoiceSettings({ ...voiceSettings, style: value })
                    }
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="speaker-boost"
                    checked={voiceSettings.use_speaker_boost}
                    onCheckedChange={(checked) =>
                      setVoiceSettings({
                        ...voiceSettings,
                        use_speaker_boost: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="speaker-boost">Use Speaker Boost</Label>
                </div>
              </>
            )}

            <div>
              <Label>Preview Text</Label>
              <Textarea
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Enter text to preview..."
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowVoiceSettings(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePreviewVoice}
                disabled={!selectedVoice || !previewText || isGeneratingPreview}
              >
                {isGeneratingPreview ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4 mr-2" />
                )}
                Preview
              </Button>
              <Button
                onClick={handleSaveVoiceSettings}
                disabled={isSavingSettings}
              >
                {isSavingSettings ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>

            {previewAudioUrl && (
              <div className="mt-4">
                <Label>Preview Audio</Label>
                <PreviewAudioPlayer url={previewAudioUrl} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 