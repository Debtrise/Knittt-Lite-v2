'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { 
  Grid3X3, 
  Ruler, 
  Palette, 
  Monitor,
  Smartphone,
  Tablet,
  Settings,
  Magnet,
  Target,
  Video,
  Image,
  Layers
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface CanvasToolbarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: (show: boolean) => void;
  showRulers: boolean;
  onToggleRulers: (show: boolean) => void;
  canvasSize: { width: number; height: number };
  onCanvasSizeChange: (size: { width: number; height: number }) => void;
  canvasBackground: any;
  onCanvasBackgroundChange: (background: any) => void;
  snapEnabled?: boolean;
  onToggleSnap?: (enabled: boolean) => void;
}

export function CanvasToolbar({
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
  showRulers,
  onToggleRulers,
  canvasSize,
  onCanvasSizeChange,
  canvasBackground,
  onCanvasBackgroundChange,
  snapEnabled = true,
  onToggleSnap
}: CanvasToolbarProps) {
  const [showSizePresets, setShowSizePresets] = useState(false);
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);

  const sizePresets = [
    { name: 'Desktop HD', width: 1920, height: 1080, icon: Monitor },
    { name: 'Desktop 4K', width: 3840, height: 2160, icon: Monitor },
    { name: 'Tablet', width: 1024, height: 768, icon: Tablet },
    { name: 'Mobile', width: 375, height: 667, icon: Smartphone },
    { name: 'Square', width: 1080, height: 1080, icon: Grid3X3 },
  ];

  return (
    <div className="bg-white px-4 py-2.5 flex items-center justify-between">
      {/* Left Section - View Controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant={showGrid ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onToggleGrid(!showGrid)}
          className="h-8"
          title="Toggle grid (G)"
        >
          <Grid3X3 className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Grid</span>
        </Button>
        
        {/* Smart Snap Controls */}
        {onToggleSnap && (
          <Button
            variant={snapEnabled ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onToggleSnap(!snapEnabled)}
            className={`h-8 ${snapEnabled ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}`}
            title="Smart snap guides (S)"
          >
            <Magnet className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Snap</span>
            {snapEnabled && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </Button>
        )}
        
        {/* Smart Alignment Indicator */}
        {snapEnabled && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700 border border-blue-200">
            <Target className="w-3 h-3" />
            <span className="hidden md:inline">Smart guides active</span>
          </div>
        )}
        
        {/* Rulers button hidden - functionality disabled */}
        {false && (
        <Button
          variant={showRulers ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onToggleRulers(!showRulers)}
          className="h-8"
        >
          <Ruler className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Rulers</span>
        </Button>
        )}
      </div>

      {/* Center Section - Canvas Size */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSizePresets(!showSizePresets)}
            className="h-8 text-sm font-mono"
            title="Canvas dimensions"
          >
            {canvasSize.width} × {canvasSize.height}
          </Button>
          
          {showSizePresets && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
              <div className="p-2 space-y-1">
                <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Preset Sizes
                </div>
                {sizePresets.map((preset) => {
                  const Icon = preset.icon;
                  const isActive = canvasSize.width === preset.width && canvasSize.height === preset.height;
                  return (
                    <button
                      key={preset.name}
                      className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors ${
                        isActive ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                      onClick={() => {
                        onCanvasSizeChange({ width: preset.width, height: preset.height });
                        setShowSizePresets(false);
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{preset.name}</span>
                      <span className="text-gray-500 text-xs">{preset.width}×{preset.height}</span>
                      {isActive && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </button>
                  );
                })}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Custom Size
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-2">
                    <Input
                      type="number"
                      placeholder="Width"
                      value={canvasSize.width}
                      onChange={(e) => onCanvasSizeChange({
                        ...canvasSize,
                        width: parseInt(e.target.value) || canvasSize.width
                      })}
                      className="w-20 h-8 text-sm"
                      min="100"
                      max="10000"
                    />
                    <span className="text-gray-500">×</span>
                    <Input
                      type="number"
                      placeholder="Height"
                      value={canvasSize.height}
                      onChange={(e) => onCanvasSizeChange({
                        ...canvasSize,
                        height: parseInt(e.target.value) || canvasSize.height
                      })}
                      className="w-20 h-8 text-sm"
                      min="100"
                      max="10000"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Background Controls */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Button
            ref={setButtonRef}
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('Background menu button clicked, current state:', showBackgroundMenu);
              setShowBackgroundMenu(!showBackgroundMenu);
            }}
            className="h-8"
            title="Change background"
          >
            {canvasBackground.type === 'solid' && <Palette className="w-4 h-4 mr-1.5" />}
            {canvasBackground.type === 'gradient' && <Layers className="w-4 h-4 mr-1.5" />}
            {canvasBackground.type === 'image' && <Image className="w-4 h-4 mr-1.5" />}
            {canvasBackground.type === 'video' && <Video className="w-4 h-4 mr-1.5" />}
            <span className="hidden sm:inline capitalize">{canvasBackground.type}</span>
          </Button>

          {showBackgroundMenu && buttonRef && createPortal(
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-[500]" 
                onClick={() => setShowBackgroundMenu(false)}
              />
              {/* Dropdown */}
              <div 
                className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[600] min-w-[280px]"
                style={{
                  top: `${buttonRef.getBoundingClientRect().bottom + 8}px`,
                  right: `${window.innerWidth - buttonRef.getBoundingClientRect().right}px`
                }}
              >
                <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Canvas Background</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBackgroundMenu(false)}
                    className="w-6 h-6 p-0"
                  >
                    ×
                  </Button>
                </div>

                {/* Background Type Selector */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    className={`flex flex-col items-center space-y-1 p-2 rounded text-xs transition-colors cursor-pointer ${
                      canvasBackground.type === 'solid' 
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                        : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => {
                      console.log('Solid background button clicked');
                      onCanvasBackgroundChange({
                        type: 'solid',
                        color: '#ffffff'
                      });
                      setShowBackgroundMenu(false);
                    }}
                  >
                    <Palette className="w-4 h-4" />
                    <span>Solid</span>
                  </button>

                  <button
                    className={`flex flex-col items-center space-y-1 p-2 rounded text-xs transition-colors cursor-pointer ${
                      canvasBackground.type === 'gradient' 
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                        : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => {
                      onCanvasBackgroundChange({
                        type: 'gradient',
                        gradient: 'linear-gradient(45deg, #f0f0f0, #ffffff)'
                      });
                      setShowBackgroundMenu(false);
                    }}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Gradient</span>
                  </button>

                  <button
                    className={`flex flex-col items-center space-y-1 p-2 rounded text-xs transition-colors cursor-pointer ${
                      canvasBackground.type === 'image' 
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                        : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => {
                      onCanvasBackgroundChange({
                        type: 'image',
                        imageUrl: ''
                      });
                      setShowBackgroundMenu(false);
                    }}
                  >
                    <Image className="w-4 h-4" />
                    <span>Image</span>
                  </button>

                  <button
                    className={`flex flex-col items-center space-y-1 p-2 rounded text-xs transition-colors cursor-pointer ${
                      canvasBackground.type === 'video' 
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                        : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => {
                      console.log('Setting video background');
                      onCanvasBackgroundChange({
                        type: 'video',
                        url: ''
                      });
                      setShowBackgroundMenu(false);
                    }}
                  >
                    <Video className="w-4 h-4" />
                    <span>Video</span>
                  </button>
                </div>

                {/* Background-specific controls */}
                {canvasBackground.type === 'solid' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">Background Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={canvasBackground.color || '#ffffff'}
                        onChange={(e) => {
                          console.log('Color changed to:', e.target.value);
                          onCanvasBackgroundChange({
                            ...canvasBackground,
                            color: e.target.value
                          });
                        }}
                        className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={canvasBackground.color || '#ffffff'}
                        onChange={(e) => onCanvasBackgroundChange({
                          ...canvasBackground,
                          color: e.target.value
                        })}
                        className="h-8 flex-1 font-mono text-sm"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                )}

                {canvasBackground.type === 'gradient' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">Gradient CSS</label>
                    <Input
                      type="text"
                      value={canvasBackground.gradient || ''}
                      onChange={(e) => onCanvasBackgroundChange({
                        ...canvasBackground,
                        gradient: e.target.value
                      })}
                      className="h-8 font-mono text-sm"
                      placeholder="linear-gradient(45deg, #f0f0f0, #ffffff)"
                    />
                  </div>
                )}

                {canvasBackground.type === 'image' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">Image URL</label>
                    <Input
                      type="url"
                      value={canvasBackground.imageUrl || ''}
                      onChange={(e) => onCanvasBackgroundChange({
                        ...canvasBackground,
                        imageUrl: e.target.value
                      })}
                      className="h-8 text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                )}

                {canvasBackground.type === 'video' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">Video URL</label>
                    <Input
                      type="url"
                      value={canvasBackground.url || ''}
                      onChange={(e) => onCanvasBackgroundChange({
                        ...canvasBackground,
                        url: e.target.value
                      })}
                      className="h-8 text-sm"
                      placeholder="https://example.com/video.mp4"
                    />
                    <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                      <strong>Video backgrounds:</strong> The video will loop muted behind all elements during export. Use MP4 format for best compatibility.
                    </div>
                  </div>
                )}
              </div>
            </div>
            </>,
            document.body
          )}
        </div>
        
        {/* Snap Tolerance Indicator (for advanced users) */}
        {snapEnabled && (
          <div className="hidden lg:flex items-center text-xs text-gray-500">
            <span>8px tolerance</span>
          </div>
        )}
      </div>
    </div>
  );
} 