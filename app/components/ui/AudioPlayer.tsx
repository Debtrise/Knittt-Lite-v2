'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { Play, Pause, Download, Volume2, VolumeX } from 'lucide-react';
import { recordings } from '@/app/lib/api';
import { toast } from 'sonner';
import { RecordingMetadata } from '@/app/types/recordings';

interface AudioPlayerProps {
  recordingId: string;
  recordingName: string;
  audioUrl?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export default function AudioPlayer({ 
  recordingId, 
  recordingName, 
  audioUrl, 
  onPlayStateChange 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<RecordingMetadata | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadMetadata();
  }, [recordingId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayStateChange?.(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onPlayStateChange]);

  const loadMetadata = async () => {
    // If we have an audioUrl, we can create basic metadata without API call
    if (audioUrl) {
      setMetadata({
        id: recordingId,
        isAvailable: true,
        characterCount: 0,
        canStream: false,
        hasLocalFile: true,
      });
      return;
    }

    // Only try to load from API if we don't have audioUrl
    try {
      const response = await recordings.getMetadata(recordingId);
      setMetadata(response.data);
    } catch (error) {
      console.warn(`Failed to load metadata for recording ${recordingId}:`, error);
      // Create fallback metadata - assume it might be streamable
      setMetadata({
        id: recordingId,
        isAvailable: false,
        characterCount: 0,
        canStream: true, // Optimistically assume streaming might work
        hasLocalFile: false,
      });
    }
  };

  const handlePlay = async () => {
    if (!audioRef.current) return;

    try {
      setIsLoading(true);

      // Determine audio source priority: stream > local file
      let audioSource = audioUrl;
      let usedStreaming = false;

      if (metadata?.canStream && !streamUrl) {
        try {
          const streamResponse = await recordings.stream(recordingId);
          const blob = new Blob([streamResponse.data], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          setStreamUrl(url);
          audioSource = url;
          usedStreaming = true;
          toast.success('Streaming audio from Eleven Labs');
        } catch (streamError) {
          console.error('Streaming failed, falling back to local file:', streamError);
          if (!audioUrl) {
            toast.error('No audio available for playback');
            return;
          }
          toast.info('Streaming unavailable, using local file');
        }
      }

      if (!audioSource) {
        toast.error('No audio source available');
        return;
      }

      if (audioRef.current.src !== audioSource) {
        audioRef.current.src = audioSource;
      }

      await audioRef.current.play();
      setIsPlaying(true);
      onPlayStateChange?.(true);

      // Track usage
      try {
        await recordings.trackUsage(recordingId, {
          usedIn: 'manual_call',
          entityType: 'recording_player',
          entityId: 0,
          playDuration: 0, // Will be updated when playback ends
          userAction: usedStreaming ? 'stream_play' : 'local_play',
        });
      } catch (trackingError) {
        console.warn('Failed to track usage:', trackingError);
      }
    } catch (error) {
      console.error('Playback failed:', error);
      toast.error('Failed to play audio');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = parseFloat(e.target.value);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    try {
      let downloadUrl = audioUrl;

      // If we have a stream URL, use that for download
      if (streamUrl) {
        downloadUrl = streamUrl;
      } else if (metadata?.canStream) {
        // Generate fresh stream for download
        const streamResponse = await recordings.stream(recordingId);
        const blob = new Blob([streamResponse.data], { type: 'audio/mpeg' });
        downloadUrl = URL.createObjectURL(blob);
      }

      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${recordingName}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error('No audio available for download');
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download audio');
    }
  };

  // Cleanup stream URL when component unmounts
  useEffect(() => {
    return () => {
      if (streamUrl) {
        URL.revokeObjectURL(streamUrl);
      }
    };
  }, [streamUrl]);

  const canPlay = metadata?.isAvailable || metadata?.canStream;

  return (
    <div className="flex items-center space-x-2 p-2 border rounded-lg bg-gray-50">
      <audio ref={audioRef} preload="none" />
      
      {/* Play/Pause Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={isPlaying ? handlePause : handlePlay}
        disabled={!canPlay || isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center space-x-2">
        <span className="text-xs text-gray-500 min-w-[35px]">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          disabled={!duration}
        />
        <span className="text-xs text-gray-500 min-w-[35px]">
          {formatTime(duration)}
        </span>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="p-1"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-16 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Download Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={!canPlay}
      >
        <Download className="w-4 h-4" />
      </Button>

      {/* Metadata Info */}
      {metadata && (
        <div className="text-xs text-gray-500 ml-2">
          {metadata.canStream && (
            <span className="bg-green-100 text-green-800 px-1 rounded mr-1">
              Stream
            </span>
          )}
          {metadata.hasLocalFile && (
            <span className="bg-blue-100 text-blue-800 px-1 rounded mr-1">
              Local
            </span>
          )}
          {metadata.characterCount > 0 && (
            <span>{metadata.characterCount} chars</span>
          )}
        </div>
      )}
    </div>
  );
} 