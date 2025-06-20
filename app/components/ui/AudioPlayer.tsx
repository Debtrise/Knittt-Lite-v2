'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Slider } from '@/app/components/ui/slider';
import { Play, Pause, Download, Volume2, VolumeX } from 'lucide-react';
import { recordings } from '@/app/lib/api';
import { toast } from 'sonner';
import { RecordingMetadata } from '@/app/types/recordings';

interface AudioPlayerProps {
  src: string;
  recordingId: string;
  recordingName: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  recordingId,
  recordingName,
  autoPlay = false,
  onEnded,
  onPlay,
  onPause,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<RecordingMetadata | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const loadMetadata = useCallback(async () => {
    if (!audioRef.current || !src) return;
    
    try {
      await audioRef.current.load();
      setDuration(audioRef.current.duration);
    } catch (error) {
      console.error('Error loading audio metadata:', error);
    }
  }, [src]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      setError('Failed to load audio');
      setIsLoading(false);
      toast.error('Failed to load audio');
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as any);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as any);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [onEnded]);

  useEffect(() => {
    if (audioRef.current && autoPlay && src) {
      audioRef.current.play().catch(console.error);
    }
  }, [src, autoPlay]);

  const handlePlay = async () => {
    if (!audioRef.current) return;

    try {
      setIsLoading(true);
      setError(null);
      await audioRef.current.play();
      setIsPlaying(true);
      onPlay?.();
    } catch (error) {
      console.error('Playback failed:', error);
      setError('Failed to play audio');
      toast.error('Failed to play audio');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPause?.();
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = value[0];
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = src;
      link.download = `${recordingName}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download audio');
    }
  };

  const canPlay = metadata?.isAvailable || metadata?.canStream;

  if (!canPlay) return null;

  return (
    <div className="flex flex-col gap-2 p-4 bg-background rounded-lg border">
      <audio 
        ref={audioRef} 
        src={src}
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={isPlaying ? handlePause : handlePlay}
          disabled={isLoading || !!error}
        >
          {isLoading ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1">
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            disabled={isLoading || !!error}
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            disabled={isLoading || !!error}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-24"
            disabled={isLoading || !!error}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isLoading || !!error}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-500 mt-2">
          {error}
        </div>
      )}

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
}; 