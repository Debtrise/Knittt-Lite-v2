'use client';

import React from 'react';
import { Button } from '../ui/button';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, Target } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number, shouldCenter?: boolean) => void;
  onFitToScreen: () => void;
  onResetView: () => void;
  onCenterCanvas?: () => void;
}

export function ZoomControls({ zoom, onZoomChange, onFitToScreen, onResetView, onCenterCanvas }: ZoomControlsProps) {
  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];
  
  const handleZoomIn = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= zoom);
    const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
    onZoomChange(zoomLevels[nextIndex], true); // Center after zoom
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= zoom);
    const prevIndex = Math.max(currentIndex - 1, 0);
    onZoomChange(zoomLevels[prevIndex], true); // Center after zoom
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomOut}
        disabled={zoom <= 0.25}
        className="h-8 w-8 p-0"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      
      <div className="text-sm font-mono font-medium min-w-[50px] text-center px-2">
        {Math.round(zoom * 100)}%
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomIn}
        disabled={zoom >= 3}
        className="h-8 w-8 p-0"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      
      <div className="w-px h-6 bg-gray-200" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onFitToScreen}
        title="Fit to screen"
        className="h-8 w-8 p-0"
      >
        <Maximize className="w-4 h-4" />
      </Button>
      
      {onCenterCanvas && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCenterCanvas}
          title="Center canvas"
          className="h-8 w-8 p-0"
        >
          <Target className="w-4 h-4" />
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onResetView}
        title="Reset view"
        className="h-8 w-8 p-0"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
} 