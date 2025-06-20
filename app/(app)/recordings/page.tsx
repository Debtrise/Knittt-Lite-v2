'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Loader2, Plus, Play, Pause, Volume2, VolumeX, RefreshCw, Upload, FileText, Trash2, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { recordingsService } from '@/app/services/recordingsService';
import { PreviewAudioPlayer } from '@/app/components/ui/PreviewAudioPlayer';
import { formatDistanceToNow } from 'date-fns';
import DashboardLayout from '@/app/components/layout/Dashboard';

interface Recording {
  id: string;
  name: string;
  description?: string;
  type: 'tts' | 'upload' | 'template';
  text?: string;
  fileUrl?: string;
  fileSize?: number;
  generatedAt?: string;
  isActive: boolean;
  asteriskStatus: 'deployed' | 'not_deployed' | 'error';
  asteriskPath?: string;
  deployedAt?: string;
  elevenLabsVoiceId?: string;
}

export default function RecordingsPage() {
  const router = useRouter();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState<Record<string, boolean>>({});
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState<Record<string, boolean>>({});
  const [expandedRecordings, setExpandedRecordings] = useState<Record<string, boolean>>({});
  const [availableVoices, setAvailableVoices] = useState<Record<string, any>>({});

  const fetchRecordings = async () => {
    try {
      setIsLoading(true);
      const response = await recordingsService.listRecordings();
      
      // First set the recordings without status
      setRecordings(response.recordings.map(recording => ({
        ...recording,
        asteriskStatus: 'not_deployed' as const,
        asteriskPath: ''
      })));

      // Only check status for recordings that have files (no point checking if no audio file exists)
      const recordingsWithFiles = response.recordings.filter(r => r.fileUrl && r.fileUrl.trim() !== '');
      
      // Then fetch status for recordings with files, with better batching
      for (let i = 0; i < recordingsWithFiles.length; i += 3) {
        const batch = recordingsWithFiles.slice(i, i + 3);
        
        // Process batch in parallel
        await Promise.allSettled(batch.map(async (recording) => {
          try {
            const asteriskStatus = await recordingsService.getAsteriskStatus(recording.id);
            setRecordings(prev => prev.map(r => 
              r.id === recording.id 
                ? { 
                    ...r, 
                    asteriskStatus: asteriskStatus.status, 
                    asteriskPath: asteriskStatus.asteriskPath,
                    deployedAt: asteriskStatus.deployedAt 
                  }
                : r
            ));
          } catch (error: any) {
            // 404 means the recording hasn't been deployed yet - this is expected
            if (error.response?.status === 404) {
              setRecordings(prev => prev.map(r => 
                r.id === recording.id 
                  ? { ...r, asteriskStatus: 'not_deployed' as const }
                  : r
              ));
            } else {
              console.error(`Failed to get Asterisk status for recording ${recording.id}:`, error);
              // For other errors, keep as not_deployed to avoid confusion
            }
          }
        }));
        
        // Small delay between batches to avoid overwhelming the server
        if (i + 3 < recordingsWithFiles.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
      toast.error('Failed to load recordings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVoices = async () => {
    try {
      const response = await recordingsService.getAvailableVoices();
      const voicesMap = response.voices.reduce((acc: any, voice: any) => {
        acc[voice.voice_id] = voice;
        return acc;
      }, {});
      setAvailableVoices(voicesMap);
    } catch (error) {
      console.error('Failed to fetch voices:', error);
    }
  };

  useEffect(() => {
    fetchRecordings();
    fetchVoices();
  }, []);

  const handleDeploy = async (recordingId: string) => {
    try {
      setIsDeploying(prev => ({ ...prev, [recordingId]: true }));
      await recordingsService.deployToAsterisk(recordingId);
      toast.success('Recording finalized successfully');
      
      // Wait a moment for the deployment to complete on the server
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh the status
      try {
        const status = await recordingsService.getAsteriskStatus(recordingId);
        setRecordings(prev => prev.map(r => 
          r.id === recordingId 
            ? { 
                ...r, 
                asteriskStatus: status.status, 
                asteriskPath: status.asteriskPath,
                deployedAt: status.deployedAt 
              }
            : r
        ));
      } catch (statusError: any) {
        console.error('Failed to refresh status after deployment:', statusError);
        // If status check fails, assume deployment was successful
        setRecordings(prev => prev.map(r => 
          r.id === recordingId 
            ? { 
                ...r, 
                asteriskStatus: 'deployed' as const,
                deployedAt: new Date().toISOString()
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Failed to deploy recording:', error);
      toast.error('Failed to finalize recording');
    } finally {
      setIsDeploying(prev => ({ ...prev, [recordingId]: false }));
    }
  };

  const handleGenerateAudio = async (recordingId: string) => {
    try {
      setIsGenerating(prev => ({ ...prev, [recordingId]: true }));
      await recordingsService.generateRecordingAudio(recordingId);
      toast.success('Audio generated successfully');
      
      // Auto-deploy to PBX after successful generation
      try {
        setIsDeploying(prev => ({ ...prev, [recordingId]: true }));
        await recordingsService.deployToAsterisk(recordingId);
        toast.success('Recording is ready for use');
        
        // Wait a moment for the deployment to complete on the server
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh the status
        try {
          const status = await recordingsService.getAsteriskStatus(recordingId);
          setRecordings(prev => prev.map(r => 
            r.id === recordingId 
              ? { 
                  ...r, 
                  asteriskStatus: status.status, 
                  asteriskPath: status.asteriskPath,
                  deployedAt: status.deployedAt 
                }
              : r
          ));
        } catch (statusError: any) {
          console.error('Failed to refresh status after deployment:', statusError);
          // If status check fails, assume deployment was successful
          setRecordings(prev => prev.map(r => 
            r.id === recordingId 
              ? { 
                  ...r, 
                  asteriskStatus: 'deployed' as const,
                  deployedAt: new Date().toISOString()
                }
              : r
          ));
        }
      } catch (deployError) {
        console.error('Failed to auto-deploy to PBX:', deployError);
        toast.error('Audio generated but failed to finalize. Click "Finalize Recording" to complete.');
      } finally {
        setIsDeploying(prev => ({ ...prev, [recordingId]: false }));
      }
      
      // Refresh the recording to get updated file info
      const updatedRecording = await recordingsService.getRecording(recordingId);
      setRecordings(prev => prev.map(r => 
        r.id === recordingId ? { ...r, ...updatedRecording } : r
      ));
    } catch (error) {
      console.error('Failed to generate audio:', error);
      toast.error('Failed to generate audio');
    } finally {
      setIsGenerating(prev => ({ ...prev, [recordingId]: false }));
    }
  };

  const handleDelete = async (recordingId: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;
    
    try {
      setIsDeleting(prev => ({ ...prev, [recordingId]: true }));
      await recordingsService.deleteRecording(recordingId);
      toast.success('Recording deleted successfully');
      setRecordings(prev => prev.filter(r => r.id !== recordingId));
    } catch (error) {
      console.error('Failed to delete recording:', error);
      toast.error('Failed to delete recording');
    } finally {
      setIsDeleting(prev => ({ ...prev, [recordingId]: false }));
    }
  };

  const handleRefreshStatus = async (recordingId: string) => {
    try {
      setIsRefreshing(prev => ({ ...prev, [recordingId]: true }));
      const status = await recordingsService.getAsteriskStatus(recordingId);
      setRecordings(prev => prev.map(r => 
        r.id === recordingId 
          ? { 
              ...r, 
              asteriskStatus: status.status, 
              asteriskPath: status.asteriskPath,
              deployedAt: status.deployedAt 
            }
          : r
      ));
      toast.success('Status refreshed');
    } catch (error: any) {
      // 404 means the recording hasn't been deployed yet - this is expected
      if (error.response?.status === 404) {
        setRecordings(prev => prev.map(r => 
          r.id === recordingId 
            ? { ...r, asteriskStatus: 'not_deployed' as const }
            : r
        ));
        toast.success('Status refreshed - processing');
      } else {
        console.error('Failed to refresh status:', error);
        toast.error('Failed to refresh status');
      }
    } finally {
      setIsRefreshing(prev => ({ ...prev, [recordingId]: false }));
    }
  };

  const toggleRecordingDetails = (recordingId: string) => {
    setExpandedRecordings(prev => ({
      ...prev,
      [recordingId]: !prev[recordingId]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 text-green-800';
      case 'not_deployed':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'Ready';
      case 'not_deployed':
        return 'Processing';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Recordings</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/recordings/create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Recording
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recordings.map((recording) => (
            <Card key={recording.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold truncate">
                    {recording.name}
                  </CardTitle>
                  <Badge variant={recording.isActive ? "default" : "secondary"}>
                    {recording.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {recording.description && (
                  <p className="text-sm text-gray-500 mt-1">{recording.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(recording.asteriskStatus)}>
                      {getStatusText(recording.asteriskStatus)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRefreshStatus(recording.id)}
                      disabled={isRefreshing[recording.id]}
                    >
                      {isRefreshing[recording.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {recording.fileUrl && (
                    <PreviewAudioPlayer url={recording.fileUrl} />
                  )}

                  <div className="flex flex-wrap gap-2">
                    {recording.type === 'tts' && !recording.fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateAudio(recording.id)}
                        disabled={isGenerating[recording.id] || isDeploying[recording.id]}
                        className="flex items-center gap-2"
                      >
                        {isGenerating[recording.id] || isDeploying[recording.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        {isGenerating[recording.id] ? 'Generating...' : isDeploying[recording.id] ? 'Deploying...' : 'Generate Audio'}
                      </Button>
                    )}

                    {recording.type === 'tts' && recording.fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateAudio(recording.id)}
                        disabled={isGenerating[recording.id] || isDeploying[recording.id]}
                        className="flex items-center gap-2"
                      >
                        {isGenerating[recording.id] || isDeploying[recording.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        {isGenerating[recording.id] ? 'Regenerating...' : isDeploying[recording.id] ? 'Deploying...' : 'Regenerate Audio'}
                      </Button>
                    )}

                    {recording.fileUrl && recording.asteriskStatus !== 'deployed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeploy(recording.id)}
                        disabled={isDeploying[recording.id] || isGenerating[recording.id]}
                        className="flex items-center gap-2"
                      >
                        {isDeploying[recording.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Finalize Recording
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRecordingDetails(recording.id)}
                      className="flex items-center gap-2"
                    >
                      {expandedRecordings[recording.id] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      {expandedRecordings[recording.id] ? 'Hide Details' : 'Show Details'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(recording.id)}
                      disabled={isDeleting[recording.id]}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      {isDeleting[recording.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </Button>
                  </div>

                  {expandedRecordings[recording.id] && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Recording Text:</h4>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                          {recording.text || 'No text available'}
                        </p>
                      </div>
                      
                      {recording.type === 'tts' && recording.elevenLabsVoiceId && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Voice:</h4>
                          <p className="text-sm text-gray-600">
                            {availableVoices[recording.elevenLabsVoiceId]?.name || 'Unknown Voice'}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Type:</h4>
                          <Badge variant="outline">{recording.type.toUpperCase()}</Badge>
                        </div>
                        
                        {recording.fileSize && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">File Size:</h4>
                            <p className="text-sm text-gray-600">{(recording.fileSize / 1024).toFixed(1)} KB</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {recording.generatedAt && (
                    <p className="text-xs text-gray-500">
                      Generated {formatDistanceToNow(new Date(recording.generatedAt))} ago
                    </p>
                  )}

                  {recording.deployedAt && recording.asteriskStatus === 'deployed' && (
                    <p className="text-xs text-green-600">
                      Ready {formatDistanceToNow(new Date(recording.deployedAt))} ago
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
} 