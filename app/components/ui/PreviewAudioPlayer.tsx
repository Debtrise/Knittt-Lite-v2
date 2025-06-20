'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Loader2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PreviewAudioPlayerProps {
  url: string;
  autoPlay?: boolean;
}

export function PreviewAudioPlayer({ url, autoPlay = false }: PreviewAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousVolume = useRef(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
      if (autoPlay) {
        audio.play().catch(err => {
          console.error('Auto-play failed:', err);
          // Don't show error to user for auto-play failures
        });
      }
    };

    const handleError = (e: any) => {
      console.error('Audio error:', e);
      setIsLoading(false);
      setError('Failed to load audio. Please try again.');
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // Construct the proper audio URL
    try {
      setIsLoading(true);
      setError(null);
      
      // If the URL starts with /, it's a relative URL from the API server
      let audioUrl = url;
      if (url.startsWith('/')) {
        audioUrl = `http://34.122.156.88:3001${url}`;
      } else if (!url.startsWith('http')) {
        // If it's not absolute and doesn't start with /, assume it's relative to current origin
        audioUrl = `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
      }
      
      console.log('Loading audio from:', audioUrl);
      audio.src = audioUrl;
      audio.load();
    } catch (err) {
      console.error('Failed to load audio:', err);
      setError('Failed to load audio');
      setIsLoading(false);
    }

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url, autoPlay]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        await audio.pause();
      } else {
        await audio.play();
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError('Failed to play audio');
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = previousVolume.current;
      setVolume(previousVolume.current);
    } else {
      previousVolume.current = audio.volume;
      audio.volume = 0;
      setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <audio ref={audioRef} crossOrigin="anonymous" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      <div className="flex items-center gap-2 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          disabled={isLoading}
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
          value={volume}
          onChange={handleVolumeChange}
          className="w-24"
          disabled={isLoading}
        />
      </div>
    </div>
  );
} 