'use client';

import { useState, useEffect } from 'react';
import { recordings, freepbx } from '@/app/lib/api';
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
import { Loader2, Upload, Plus, Play, Settings, Zap, Server, Clock, CheckCircle, XCircle, AlertCircle, Mic } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import AudioPlayer from '@/app/components/ui/AudioPlayer';
import { Recording, Voice, PreviewResponse } from '@/app/types/recordings';
import EnhancedPreview from '@/app/components/ui/EnhancedPreview';

export default function RecordingsPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [recordingsList, setRecordingsList] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [uploadingToFreePBX, setUploadingToFreePBX] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isApiConfigured, setIsApiConfigured] = useState<boolean | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'ivr' as const,
    scriptText: '',
    elevenLabsVoiceId: '',
  });
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    type: 'ivr' as const,
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

  const handleUploadToFreePBX = async (recordingId: string) => {
    try {
      setUploadingToFreePBX(recordingId);
      
      // Find the recording for better error messages
      const recording = recordingsList.find(r => r.id === recordingId);
      const recordingName = recording?.name || `Recording ${recordingId}`;
      
      const response = await freepbx.uploadRecording(recordingId);
      
      // Check if upload was actually successful
      if (response.data?.freepbxStatus === 'uploaded') {
        toast.success(`🎉 "${recordingName}" uploaded to FreePBX successfully!`);
      } else if (response.data?.freepbxStatus === 'failed') {
        const errorMsg = response.data?.freepbxError || 'Upload failed';
        toast.error(`❌ Upload failed: ${errorMsg}`);
      } else {
        toast.success(`📤 Upload initiated for "${recordingName}"`);
      }
      
      await loadData(); // Reload to get the updated FreePBX status
    } catch (error: any) {
      // More detailed error handling based on our testing
      let errorMessage = 'Failed to upload to FreePBX';
      
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        if (apiError.includes('Not Authenticated')) {
          errorMessage = '🔐 FreePBX authentication failed. Please check your credentials in Settings.';
        } else if (apiError.includes('Network') || apiError.includes('Connection')) {
          errorMessage = '🌐 Network error. Please check your FreePBX server connection.';
        } else {
          errorMessage = `❌ ${apiError}`;
        }
      } else if (error.response?.status === 401) {
        errorMessage = '🔐 Authentication failed. Please check your FreePBX credentials.';
      } else if (error.response?.status === 404) {
        errorMessage = '🔍 Recording not found or FreePBX endpoint unavailable.';
      } else if (error.response?.status >= 500) {
        errorMessage = '🛠️ Server error. Please try again later.';
      }
      
      toast.error(errorMessage);
      console.error('FreePBX upload error:', error);
    } finally {
      setUploadingToFreePBX(null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 50MB');
      return;
    }

    setSelectedFile(file);
    setUploadFormData({
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      description: `Uploaded audio file: ${file.name}`,
      type: 'ivr',
    });
    setShowUploadForm(true);
    
    // Reset the input
    e.target.value = '';
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('No file selected');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('audio', selectedFile);
    formData.append('name', uploadFormData.name);
    formData.append('description', uploadFormData.description);
    formData.append('type', uploadFormData.type);

    try {
      await recordings.uploadAudio(formData);
      toast.success(`🎵 Audio file "${selectedFile.name}" uploaded successfully! Ready for FreePBX upload.`);
      await loadData();
      handleCloseUploadForm();
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload audio file';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseUploadForm = () => {
    setShowUploadForm(false);
    setSelectedFile(null);
    setUploadFormData({
      name: '',
      description: '',
      type: 'ivr',
    });
  };

  // Quick upload function for the button (bypasses the form)
  const handleQuickFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 50MB');
      return;
    }

    setUploading(true);

    const uploadFormData = new FormData();
    uploadFormData.append('audio', file);
    uploadFormData.append('name', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
    uploadFormData.append('description', `Uploaded audio file: ${file.name}`);
    uploadFormData.append('type', 'ivr');

    try {
      await recordings.uploadAudio(uploadFormData);
      toast.success(`Audio file "${file.name}" uploaded successfully`);
      await loadData();
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload audio file';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  // Helper function to render FreePBX status
  const renderFreePBXStatus = (recording: Recording) => {
    const status = recording.freepbxStatus || 'not_configured';
    
    switch (status) {
      case 'uploaded':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">✅ Uploaded</span>
            </div>
            {recording.freepbxUploadedAt && (
              <span className="text-xs text-green-600">
                {new Date(recording.freepbxUploadedAt).toLocaleString()}
              </span>
            )}
          </div>
        );
      case 'pending':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />
              <span className="text-xs text-yellow-700 font-medium">⏳ Uploading...</span>
            </div>
            <span className="text-xs text-yellow-600">Please wait</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-700 font-medium">❌ Failed</span>
            </div>
            {recording.freepbxError && (
              <span className="text-xs text-red-600 max-w-[120px] truncate" title={recording.freepbxError}>
                {recording.freepbxError}
              </span>
            )}
            <span className="text-xs text-gray-500">Click retry to try again</span>
          </div>
        );
      default:
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">⚠️ Not uploaded</span>
            </div>
            <span className="text-xs text-blue-600">Ready to upload</span>
          </div>
        );
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
            
            {/* FreePBX Status Indicator */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">FreePBX: Ready for uploads</span>
              </div>
              <span className="text-xs text-gray-400">•</span>
              <div className="flex items-center gap-1">
                <Server className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">Backend: Connected</span>
              </div>
            </div>
          </div>
          <div className="space-x-4">
            <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Recording
            </Button>
            <label htmlFor="file-upload">
              <Button variant="outline" disabled={uploading}>
                <div>
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload Audio'}
                </div>
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleQuickFileUpload}
                disabled={uploading}
              />
            </label>
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('detailed-file-upload')?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload with Details
            </Button>
            <input
              id="detailed-file-upload"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
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

        {showUploadForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Audio File
              </CardTitle>
              <CardDescription>
                Configure the details for your uploaded audio file: {selectedFile?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadSubmit} className="space-y-6">
                {/* File Info */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900">{selectedFile?.name}</h4>
                        <p className="text-sm text-blue-700">
                          Size: {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0} MB
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recording Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recording Details</CardTitle>
                    <CardDescription>
                      Set the name and details for your uploaded recording
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Name *</label>
                        <Input
                          value={uploadFormData.name}
                          onChange={e => setUploadFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Welcome Message"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select
                          value={uploadFormData.type}
                          onValueChange={value => setUploadFormData(prev => ({ ...prev, type: value as any }))}
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
                        value={uploadFormData.description}
                        onChange={e => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={handleCloseUploadForm}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!uploadFormData.name || uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Recording
                      </>
                    )}
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
                  <TableHead>FreePBX</TableHead>
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
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {renderFreePBXStatus(recording)}
                        {recording.freepbxRecordingId && (
                          <span className="text-xs text-gray-500">
                            ID: {recording.freepbxRecordingId}
                          </span>
                        )}
                      </div>
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
                        {(recording.audioUrl || recording.status === 'ready') && 
                         (!recording.freepbxStatus || recording.freepbxStatus === 'not_configured' || recording.freepbxStatus === 'failed') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUploadToFreePBX(recording.id)}
                            disabled={!!uploadingToFreePBX}
                            className={recording.freepbxStatus === 'failed' 
                              ? "text-orange-600 border-orange-300 hover:bg-orange-50" 
                              : "text-blue-600 border-blue-300 hover:bg-blue-50"}
                          >
                            {uploadingToFreePBX === recording.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Uploading...
                              </>
                            ) : recording.freepbxStatus === 'failed' ? (
                              <>
                                <Server className="w-4 h-4 mr-1" />
                                Retry Upload
                              </>
                            ) : (
                              <>
                                <Server className="w-4 h-4 mr-1" />
                                Upload to FreePBX
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {recordingsList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-gray-400">
                          <Mic className="w-12 h-12 mx-auto mb-4" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings yet</h3>
                          <p className="text-gray-500 mb-4">
                            Upload audio files or create new text-to-speech recordings to get started
                          </p>
                          <div className="flex justify-center gap-3">
                            <Button 
                              onClick={() => setShowForm(true)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Create Recording
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => document.getElementById('file-upload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Audio
                            </Button>
                          </div>
                        </div>
                      </div>
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