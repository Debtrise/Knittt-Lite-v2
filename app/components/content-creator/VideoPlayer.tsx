'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, 
  SkipBack, SkipForward, Settings, RotateCcw, RotateCw,
  Download, PictureInPicture, Cast, MoreVertical
} from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';
import { toast } from 'react-hot-toast';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  playbackRate?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  volume?: number;
  showControlsOnHover?: boolean;
  showTimeDisplay?: boolean;
  showVolumeControl?: boolean;
  showFullscreenButton?: boolean;
  showProgressBar?: boolean;
  customSkin?: 'default' | 'minimal' | 'dark' | 'light' | 'theater';
  aspectRatio?: '16:9' | '4:3' | '21:9' | '1:1' | 'auto';
  maxWidth?: string;
  enableKeyboardControls?: boolean;
  crossOrigin?: string;
  enablePictureInPicture?: boolean;
  showVideoInfo?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onVolumeChange?: (volume: number) => void;
  onError?: (error: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function VideoPlayer({
  src,
  poster,
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  preload = 'metadata',
  playbackRate = 1,
  objectFit = 'contain',
  volume = 1,
  showControlsOnHover = true,
  showTimeDisplay = true,
  showVolumeControl = true,
  showFullscreenButton = true,
  showProgressBar = true,
  customSkin = 'default',
  aspectRatio = '16:9',
  maxWidth = '100%',
  enableKeyboardControls = true,
  crossOrigin = 'anonymous',
  enablePictureInPicture = true,
  showVideoInfo = false,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onVolumeChange,
  onError,
  className = '',
  style = {}
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [buffered, setBuffered] = useState<TimeRanges | null>(null);
  const [playbackRates] = useState([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]);
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(playbackRate);
  const [showSettings, setShowSettings] = useState(false);
  const [videoInfo, setVideoInfo] = useState<{
    width: number;
    height: number;
    duration: number;
    format: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const progressRef = useRef<HTMLDivElement>(null);

  // Validate video URL
  const hasValidUrl = src && 
    (src.startsWith('http://') || 
     src.startsWith('https://') || 
     src.startsWith('data:') ||
     src.startsWith('blob:'));

  // Auto-hide controls after mouse inactivity
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying && controls && showControlsOnHover) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, controls, showControlsOnHover]);

  // Video event handlers
  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoInfo({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
        duration: videoRef.current.duration,
        format: src.split('.').pop()?.toUpperCase() || 'Unknown'
      });
      setIsLoading(false);
      
      // Handle autoplay after metadata is loaded
      if (autoplay && videoRef.current) {
        handleAutoplay();
      }
    }
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleProgress = () => {
    if (videoRef.current) {
      setBuffered(videoRef.current.buffered);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    resetControlsTimeout();
    onPlay?.();
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    onPause?.();
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (!loop) {
      setCurrentTime(0);
    }
    onEnded?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setIsPlaying(false);
    onError?.('Failed to load video');
  };

  const handleVolumeChange = () => {
    if (videoRef.current) {
      const vol = videoRef.current.volume;
      setCurrentVolume(vol);
      setIsMuted(videoRef.current.muted);
      onVolumeChange?.(vol);
    }
  };

  // Control functions
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error('Playback failed:', error);
          toast.error('Failed to play video');
        });
      }
    }
  };

  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeControl = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setCurrentVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePictureInPicture = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (error) {
        console.error('Picture-in-Picture failed:', error);
        toast.error('Picture-in-Picture not supported');
      }
    }
  };

  // Enhanced autoplay handling
  const handleAutoplay = async () => {
    if (!videoRef.current || !autoplay) return;
    
    try {
      // First try to play normally
      await videoRef.current.play();
      console.log('Video autoplay successful');
    } catch (error) {
      console.warn('Video autoplay failed, trying with muted:', error);
      
      // If autoplay fails, try with muted
      try {
        videoRef.current.muted = true;
        setIsMuted(true);
        await videoRef.current.play();
        console.log('Video autoplay successful with muted');
        
        // Show a notification that video is muted due to autoplay policy
        if (!muted) {
          console.log('Video was muted due to browser autoplay policy. Click to unmute.');
        }
      } catch (mutedError) {
        console.error('Video autoplay failed even with muted:', mutedError);
        // Autoplay completely failed, user will need to manually start
      }
    }
  };

  const skipBackward = () => {
    handleSeek(Math.max(0, currentTime - 10));
  };

  const skipForward = () => {
    handleSeek(Math.min(duration, currentTime + 10));
  };

  const setPlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setCurrentPlaybackRate(rate);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = clickX / width;
      const newTime = percentage * duration;
      handleSeek(newTime);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (videoFile.size > maxSize) {
        toast.error('Video file is too large. Maximum size is 100MB.');
        return;
      }
      
      const url = URL.createObjectURL(videoFile);
      toast.success(`Video "${videoFile.name}" dropped! Use Properties panel to upload permanently.`);
      
      const event = new CustomEvent('video-dropped', {
        detail: { file: videoFile, url }
      });
      window.dispatchEvent(event);
    } else {
      toast.error('Please drop a valid video file (MP4, WebM, OGV)');
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasValidUrl || !enableKeyboardControls || !containerRef.current?.contains(document.activeElement)) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeControl(Math.min(1, currentVolume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeControl(Math.max(0, currentVolume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyI':
          e.preventDefault();
          togglePictureInPicture();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasValidUrl, enableKeyboardControls, currentTime, duration, currentVolume]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Format time display
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get skin styles
  const getSkinStyles = () => {
    const baseStyles = {
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#000000',
      position: 'relative' as const,
      ...style
    };

    switch (customSkin) {
      case 'minimal':
        return { ...baseStyles, backgroundColor: '#1a1a1a' };
      case 'dark':
        return { ...baseStyles, backgroundColor: '#000000' };
      case 'light':
        return { ...baseStyles, backgroundColor: '#f5f5f5' };
      case 'theater':
        return { ...baseStyles, backgroundColor: '#000000', borderRadius: '0px' };
      default:
        return baseStyles;
    }
  };

  const containerStyle = getSkinStyles();

  const videoStyle = {
    objectFit: objectFit as any,
    width: '100%',
    height: '100%',
    display: 'block'
  };

  if (!hasValidUrl) {
    return (
      <div 
        className={`w-full h-full border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
          isDragOver 
            ? 'bg-blue-50 border-blue-400 border-solid' 
            : 'bg-gray-100 border-gray-300 hover:bg-gray-50'
        } ${className}`}
        style={containerStyle}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center text-gray-500">
          <Play className={`w-8 h-8 mx-auto mb-2 transition-colors ${
            isDragOver ? 'text-blue-500' : 'text-gray-400'
          }`} />
          <p className={`text-sm transition-colors ${
            isDragOver ? 'text-blue-600 font-medium' : 'text-gray-600'
          }`}>
            {isDragOver ? 'Drop video here' : 'Add video URL or upload'}
          </p>
          <p className="text-xs opacity-75 mt-1">
            {isDragOver ? 'Release to upload' : 'Paste URL or drag & drop video'}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Supports MP4, WebM, OGV formats (Max 100MB)
          </p>
          
          <button
            className="mt-3 px-4 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            onClick={() => {
              const event = new CustomEvent('trigger-video-upload', {
                detail: { elementId: 'video-player' }
              });
              window.dispatchEvent(event);
            }}
          >
            Click to Upload Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full relative transition-all duration-200 ${
        isDragOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''
      } ${className}`}
      style={containerStyle}
      onMouseMove={resetControlsTimeout}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying && controls && showControlsOnHover) {
          setShowControls(false);
        }
      }}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoplay}
        loop={loop}
        muted={autoplay ? true : muted} // Force muted when autoplay is enabled
        playsInline // Required for mobile autoplay
        preload={preload}
        crossOrigin={crossOrigin}
        style={videoStyle}
        onLoadStart={handleLoadStart}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onVolumeChange={handleVolumeChange}
        onClick={togglePlayPause}
        className="cursor-pointer"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-8 h-8 mx-auto mb-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <div className="text-sm">Loading video...</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <Play className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm">Failed to load video</p>
            <p className="text-xs opacity-75 mt-1 break-all max-w-full">
              {src.length > 50 ? `${src.substring(0, 50)}...` : src}
            </p>
          </div>
        </div>
      )}

      {/* Video Controls */}
      {controls && hasValidUrl && !hasError && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 transition-all duration-300 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          {/* Progress Bar */}
          {showProgressBar && (
            <div className="mb-3">
              <div 
                ref={progressRef}
                className="relative h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer"
                onClick={handleProgressClick}
              >
                {/* Buffered progress */}
                {buffered && (
                  <div className="absolute top-0 left-0 h-full bg-white/20">
                    {Array.from({ length: buffered.length }, (_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 h-full bg-white/20"
                        style={{
                          left: `${(buffered.start(i) / duration) * 100}%`,
                          width: `${((buffered.end(i) - buffered.start(i)) / duration) * 100}%`
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Played progress */}
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-150"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
                
                {/* Progress handle */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg"
                  style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="w-8 h-8 p-0 text-white hover:text-blue-400 hover:bg-white/10"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={skipBackward}
                className="w-6 h-6 p-0 text-white hover:text-blue-400 hover:bg-white/10"
              >
                <SkipBack className="w-3 h-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={skipForward}
                className="w-6 h-6 p-0 text-white hover:text-blue-400 hover:bg-white/10"
              >
                <SkipForward className="w-3 h-3" />
              </Button>

              {showVolumeControl && (
                <div className="flex items-center space-x-2 group">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="w-6 h-6 p-0 text-white hover:text-blue-400 hover:bg-white/10"
                  >
                    {currentVolume === 0 || isMuted ? 
                      <VolumeX className="w-4 h-4" /> : 
                      <Volume2 className="w-4 h-4" />
                    }
                  </Button>
                  <Slider
                    value={[currentVolume]}
                    max={1}
                    step={0.1}
                    onValueChange={(value) => handleVolumeControl(value[0])}
                    className="w-16 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  />
                </div>
              )}

              {showTimeDisplay && (
                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {enablePictureInPicture && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePictureInPicture}
                  className="w-6 h-6 p-0 text-white hover:text-blue-400 hover:bg-white/10"
                >
                  <PictureInPicture className="w-4 h-4" />
                </Button>
              )}

              <DropdownMenu open={showSettings} onOpenChange={setShowSettings}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 text-white hover:text-blue-400 hover:bg-white/10"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Playback Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {playbackRates.map(rate => (
                    <DropdownMenuItem
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={currentPlaybackRate === rate ? 'bg-blue-50' : ''}
                    >
                      {rate}x Speed
                      {currentPlaybackRate === rate && <Badge className="ml-auto">Current</Badge>}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => videoRef.current?.load()}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reload Video
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {showFullscreenButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="w-6 h-6 p-0 text-white hover:text-blue-400 hover:bg-white/10"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Info Overlay */}
      {showVideoInfo && videoInfo && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity z-10">
          {videoInfo.width}×{videoInfo.height} • {formatTime(videoInfo.duration)} • {videoInfo.format}
        </div>
      )}

      {/* Click to Play Overlay */}
      {!isPlaying && !isLoading && !hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlayPause}
        >
          <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
} 