'use client';

import React, { useState, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Type, Image, Video, Square, Play, QrCode, BarChart3, Timer, Cloud, Sparkles,
  MousePointer, Calendar, MapPin, Star, Heart, MessageCircle, Phone, Mail,
  TrendingUp, PieChart, Zap, Music, Camera, Globe, Shield, Award,
  Search, Filter, Grid3X3, List, Bookmark, Tag, Layers, Plus
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface ElementPanelProps {
  onElementDrop: (elementType: string, position: { x: number; y: number }) => void;
  searchQuery?: string;
}

interface ElementConfig {
  type: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  category: string;
  tags: string[];
  isPro?: boolean;
  isNew?: boolean;
}

interface DraggableElementProps extends ElementConfig {
  onDrop: (elementType: string, position: { x: number; y: number }) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (elementType: string) => void;
}

function DraggableElement({ type, icon, label, description, category, tags, isPro, isNew, onDrop, isFavorite, onToggleFavorite }: DraggableElementProps) {
  const [dragStarted, setDragStarted] = useState(false);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'element',
    item: () => {
      setDragStarted(true);
      return { elementType: type };
    },
    end: (item, monitor) => {
      // Small delay to distinguish between click and drag
      setTimeout(() => {
        if (!monitor.didDrop() && dragStarted) {
          // If not dropped on a drop target, create at default position
          onDrop(type, { x: 400, y: 300 });
        }
        setDragStarted(false);
      }, 10);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if drag was initiated
    if (!dragStarted && !isDragging) {
    onDrop(type, { x: 400, y: 300 });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
    <Card
      ref={drag}
            className={`p-2 cursor-move hover:shadow-md transition-all duration-200 border group ${
              isDragging ? 'opacity-50 border-blue-400 scale-105' : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-2">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="scale-75">
          {icon}
                </div>
        </div>
        <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
          <p className="text-xs font-medium text-gray-900 truncate">{label}</p>
                  {isNew && <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-1 py-0 h-4">New</Badge>}
                  {isPro && <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs px-1 py-0 h-4">Pro</Badge>}
                </div>
          <p className="text-xs text-gray-500 truncate leading-tight">{description}</p>
        </div>
              <div className="flex-shrink-0 flex items-center space-x-1">
                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-5 h-5 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(type);
                    }}
                  >
                    <Star className={`w-3 h-3 ${isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                  </Button>
                )}
                <Plus className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
      </div>
    </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{label}</p>
            <p className="text-sm text-gray-600">{description}</p>
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ElementPanel({ onElementDrop, searchQuery = '' }: ElementPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [localSearch, setLocalSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('content-creator-favorites');
      return saved ? JSON.parse(saved) : ['text', 'image', 'button'];
    }
    return ['text', 'image', 'button'];
  });
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('content-creator-recent');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isCreatingElement, setIsCreatingElement] = useState(false);

  const elements: ElementConfig[] = [
    // Text Elements
    {
      type: 'text',
      icon: <Type className="w-5 h-5 text-gray-700" />,
      label: 'Text',
      description: 'Simple text element with basic formatting',
      category: 'text',
      tags: ['text', 'basic', 'content', 'simple']
    },
    {
      type: 'gradient_text',
      icon: <Type className="w-5 h-5 text-blue-600" />,
      label: 'Gradient Text',
      description: 'Text with beautiful gradient colors',
      category: 'text',
      tags: ['text', 'gradient', 'colorful', 'modern'],
      isNew: true
    },
    {
      type: 'shadow_text',
      icon: <Type className="w-5 h-5 text-purple-600" />,
      label: 'Shadow Text',
      description: 'Text with drop shadow effects',
      category: 'text',
      tags: ['text', 'shadow', 'depth', 'effect']
    },
    {
      type: 'outline_text',
      icon: <Type className="w-5 h-5 text-orange-600" />,
      label: 'Outline Text',
      description: 'Text with customizable outline stroke',
      category: 'text',
      tags: ['text', 'outline', 'stroke', 'border']
    },
    
    // Interactive Elements
    {
      type: 'button',
      icon: <Square className="w-5 h-5 text-orange-600" />,
      label: 'Button',
      description: 'Clickable button with custom actions',
      category: 'interactive',
      tags: ['button', 'click', 'action', 'interactive']
    },
    {
      type: 'image_hotspot',
      icon: <MousePointer className="w-5 h-5 text-red-600" />,
      label: 'Image Hotspot',
      description: 'Interactive image with clickable hotspots',
      category: 'interactive',
      tags: ['image', 'hotspot', 'interactive', 'click'],
      isPro: true
    },
    {
      type: 'accordion',
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      label: 'Accordion',
      description: 'Expandable content sections',
      category: 'interactive',
      tags: ['accordion', 'collapsible', 'sections', 'organize']
    },
    {
      type: 'tabs',
      icon: <Grid3X3 className="w-5 h-5 text-purple-600" />,
      label: 'Tabs',
      description: 'Tabbed content navigation',
      category: 'interactive',
      tags: ['tabs', 'navigation', 'content', 'organize']
    },

    // Chart Elements
    {
      type: 'pie_chart',
      icon: <PieChart className="w-5 h-5 text-green-600" />,
      label: 'Pie Chart',
      description: 'Interactive pie chart with labels and legend',
      category: 'charts',
      tags: ['chart', 'data', 'visualization', 'pie']
    },
    {
      type: 'bar_chart',
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
      label: 'Bar Chart',
      description: 'Vertical or horizontal bar charts',
      category: 'charts',
      tags: ['chart', 'data', 'bars', 'statistics']
    },
    {
      type: 'line_chart',
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
      label: 'Line Chart',
      description: 'Line charts for trends and time series',
      category: 'charts',
      tags: ['chart', 'line', 'trend', 'time-series']
    },

    // Media Elements
    {
      type: 'image',
      icon: <Image className="w-5 h-5 text-green-600" />,
      label: 'Image',
      description: 'Single image with frame options and URL support',
      category: 'media',
      tags: ['image', 'photo', 'picture', 'frame', 'basic']
    },
    {
      type: 'standard_photo',
      icon: <Camera className="w-5 h-5 text-blue-600" />,
      label: 'Standard Photo',
      description: 'Advanced photo element with URL loading, error handling, and states',
      category: 'media',
      tags: ['photo', 'image', 'url', 'loading', 'advanced', 'api'],
      isNew: true
    },
    {
      type: 'sales_rep_photo',
      icon: <div className="w-5 h-5 text-purple-600 font-bold text-xs flex items-center justify-center rounded-full bg-purple-100">👤</div>,
      label: 'Sales Rep Photo',
      description: 'Photo element that binds to {rep_photo} variable for dynamic content',
      category: 'media',
      tags: ['sales rep', 'photo', 'variable', 'rep_photo', 'dynamic', 'binding'],
      isNew: true
    },
    {
      type: 'video',
      icon: <Play className="w-5 h-5 text-red-600" />,
      label: 'Video',
      description: 'Video player with controls, autoplay, and fullscreen support',
      category: 'media',
      tags: ['video', 'player', 'controls', 'media', 'mp4', 'streaming'],
      isNew: true
    },
    {
      type: 'video_player',
      icon: <div className="w-5 h-5 text-blue-600 font-bold text-xs flex items-center justify-center rounded-full bg-blue-100">🎬</div>,
      label: 'Video Player',
      description: 'Advanced video player with custom controls, themes, and enhanced features',
      category: 'media',
      tags: ['video', 'player', 'advanced', 'controls', 'themes', 'playback', 'enhanced'],
      isNew: true,
      isPro: true
    },
    {
      type: 'image_carousel',
      icon: <Image className="w-5 h-5 text-blue-600" />,
      label: 'Image Carousel',
      description: 'Auto-playing image slideshow with controls',
      category: 'media',
      tags: ['carousel', 'slideshow', 'images', 'gallery']
    },
    {
      type: 'audio_player',
      icon: <Music className="w-5 h-5 text-purple-600" />,
      label: 'Audio Player',
      description: 'Advanced audio player with visualizer',
      category: 'media',
      tags: ['audio', 'music', 'player', 'visualizer'],
      isPro: true
    },

    // Effects Elements
    {
      type: 'snow_animation',
      icon: <Sparkles className="w-5 h-5 text-blue-400" />,
      label: 'Snow Animation',
      description: 'Beautiful falling snow effect',
      category: 'effects',
      tags: ['snow', 'animation', 'weather', 'particles']
    },
    {
      type: 'fireworks',
      icon: <Zap className="w-5 h-5 text-red-600" />,
      label: 'Fireworks',
      description: 'Celebration fireworks animation',
      category: 'effects',
      tags: ['fireworks', 'celebration', 'animation', 'particles'],
      isPro: true
    },
    {
      type: 'matrix_rain',
      icon: <div className="w-5 h-5 bg-green-500 text-black text-xs font-mono flex items-center justify-center">01</div>,
      label: 'Matrix Rain',
      description: 'Digital rain effect like the Matrix movie',
      category: 'effects',
      tags: ['matrix', 'rain', 'digital', 'animation', 'fullpage'],
      isNew: true
    },
    {
      type: 'starfield',
      icon: <Star className="w-5 h-5 text-yellow-400" />,
      label: 'Starfield',
      description: 'Animated starfield with depth effect',
      category: 'effects',
      tags: ['stars', 'space', 'animation', 'fullpage', 'background']
    },
    {
      type: 'ocean_waves',
      icon: <div className="w-5 h-5 text-blue-500">🌊</div>,
      label: 'Ocean Waves',
      description: 'Animated ocean waves with foam effect',
      category: 'effects',
      tags: ['ocean', 'waves', 'water', 'animation', 'fullpage'],
      isPro: true
    },
    {
      type: 'geometric_pulse',
      icon: <Grid3X3 className="w-5 h-5 text-purple-500" />,
      label: 'Geometric Pulse',
      description: 'Pulsing geometric patterns',
      category: 'effects',
      tags: ['geometric', 'pulse', 'patterns', 'animation', 'fullpage']
    },
    {
      type: 'aurora_borealis',
      icon: <div className="w-5 h-5 text-green-400">🌌</div>,
      label: 'Aurora Borealis',
      description: 'Northern lights animation effect',
      category: 'effects',
      tags: ['aurora', 'northern lights', 'animation', 'fullpage', 'sky'],
      isPro: true
    },
    {
      type: 'bubble_float',
      icon: <div className="w-5 h-5 text-blue-300">🫧</div>,
      label: 'Bubble Float',
      description: 'Floating bubbles with physics',
      category: 'effects',
      tags: ['bubbles', 'float', 'animation', 'fullpage', 'fun']
    },
    {
      type: 'lightning_storm',
      icon: <Zap className="w-5 h-5 text-yellow-300" />,
      label: 'Lightning Storm',
      description: 'Animated lightning strikes',
      category: 'effects',
      tags: ['lightning', 'storm', 'thunder', 'animation', 'fullpage'],
      isPro: true
    },
    {
      type: 'floating_hearts',
      icon: <Heart className="w-5 h-5 text-pink-500" />,
      label: 'Floating Hearts',
      description: 'Romantic floating hearts animation',
      category: 'effects',
      tags: ['hearts', 'love', 'romance', 'animation', 'fullpage']
    },
    {
      type: 'falling_leaves',
      icon: <div className="w-5 h-5 text-orange-500">🍂</div>,
      label: 'Falling Leaves',
      description: 'Autumn leaves falling animation',
      category: 'effects',
      tags: ['leaves', 'autumn', 'fall', 'animation', 'fullpage']
    },
    {
      type: 'neon_pulse',
      icon: <Zap className="w-5 h-5 text-cyan-400" />,
      label: 'Neon Pulse',
      description: 'Pulsing neon light effects',
      category: 'effects',
      tags: ['neon', 'pulse', 'glow', 'animation', 'fullpage']
    },
    {
      type: 'raining_money',
      icon: <div className="w-5 h-5 text-green-600">💸</div>,
      label: 'Raining Money',
      description: 'Money bills falling like rain animation',
      category: 'effects',
      tags: ['money', 'rain', 'bills', 'animation', 'fullpage', 'celebration'],
      isNew: true
    },
    {
      type: 'solar_flare',
      icon: <div className="w-5 h-5 text-orange-500">☀️</div>,
      label: 'Solar Flare',
      description: 'Intense swirling solar flare effect',
      category: 'effects',
      tags: ['solar', 'flare', 'sun', 'animation', 'fullpage'],
      isPro: true
    },
    {
      type: 'rainbow_tunnel',
      icon: <div className="w-5 h-5 text-purple-500">🌈</div>,
      label: 'Rainbow Tunnel',
      description: 'Vibrant tunnel with cycling rainbow colors',
      category: 'effects',
      tags: ['rainbow', 'tunnel', 'animation', 'colorful', 'fullpage']
    },
    {
      type: 'floating_balloons',
      icon: <div className="w-5 h-5 text-red-500">🎈</div>,
      label: 'Floating Balloons',
      description: 'Balloons gently floating upwards',
      category: 'effects',
      tags: ['balloons', 'celebration', 'animation', 'fullpage']
    },
    {
      type: 'pixel_sparks',
      icon: <div className="w-5 h-5 text-yellow-400">✨</div>,
      label: 'Pixel Sparks',
      description: 'Retro pixelated spark explosion',
      category: 'effects',
      tags: ['pixel', 'sparks', 'retro', 'animation', 'fullpage']
    },
    {
      type: 'butterfly_swarm',
      icon: <div className="w-5 h-5 text-purple-400">🦋</div>,
      label: 'Butterfly Swarm',
      description: 'Graceful butterflies fluttering around',
      category: 'effects',
      tags: ['butterfly', 'nature', 'animation', 'fullpage']
    },

    // Form Elements
    {
      type: 'contact_form',
      icon: <MessageCircle className="w-5 h-5 text-green-600" />,
      label: 'Contact Form',
      description: 'Customizable contact form with validation',
      category: 'forms',
      tags: ['form', 'contact', 'input', 'validation']
    },
    {
      type: 'survey_form',
      icon: <BarChart3 className="w-5 h-5 text-indigo-600" />,
      label: 'Survey Form',
      description: 'Multi-step survey with progress tracking',
      category: 'forms',
      tags: ['survey', 'form', 'multi-step', 'progress'],
      isPro: true
    }
  ];

  const categories = [
    { id: 'favorites', label: 'Favorites', icon: <Star className="w-4 h-4" />, count: favorites.length },
    { id: 'recent', label: 'Recent', icon: <Timer className="w-4 h-4" />, count: recentlyUsed.length },
    { id: 'all', label: 'All', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
    { id: 'interactive', label: 'Interactive', icon: <MousePointer className="w-4 h-4" /> },
    { id: 'charts', label: 'Charts', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'media', label: 'Media', icon: <Image className="w-4 h-4" /> },
    { id: 'effects', label: 'Effects', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'forms', label: 'Forms', icon: <MessageCircle className="w-4 h-4" /> }
  ];

  // Enhanced element handling with favorites and recent
  const handleElementDrop = useCallback((elementType: string, position: { x: number; y: number }) => {
    // Prevent duplicate creation
    if (isCreatingElement) {
      console.log('Element creation already in progress, skipping duplicate');
      return;
    }
    
    setIsCreatingElement(true);
    
    try {
    // Add to recently used
    const newRecent = [elementType, ...recentlyUsed.filter(item => item !== elementType)].slice(0, 5);
    setRecentlyUsed(newRecent);
    localStorage.setItem('content-creator-recent', JSON.stringify(newRecent));
    
    onElementDrop(elementType, position);
    } finally {
      // Reset the flag after a short delay to prevent rapid successive calls
      setTimeout(() => {
        setIsCreatingElement(false);
      }, 500);
    }
  }, [onElementDrop, recentlyUsed, isCreatingElement]);

  const toggleFavorite = (elementType: string) => {
    const newFavorites = favorites.includes(elementType)
      ? favorites.filter(item => item !== elementType)
      : [...favorites, elementType];
    
    setFavorites(newFavorites);
    localStorage.setItem('content-creator-favorites', JSON.stringify(newFavorites));
  };

  const searchTerm = searchQuery || localSearch;
  
  // Get favorites and recent elements first
  const favoriteElements = elements.filter(el => favorites.includes(el.type));
  const recentElements = elements.filter(el => recentlyUsed.includes(el.type))
    .sort((a, b) => recentlyUsed.indexOf(a.type) - recentlyUsed.indexOf(b.type));
  
  // Get elements based on selected category
  let categoryElements = elements;
  if (selectedCategory === 'favorites') {
    categoryElements = favoriteElements;
  } else if (selectedCategory === 'recent') {
    categoryElements = recentElements;
  } else if (selectedCategory !== 'all') {
    categoryElements = elements.filter(element => element.category === selectedCategory);
  }

  const filteredElements = categoryElements.filter(element => {
    const matchesSearch = !searchTerm || 
      element.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div className="h-full flex flex-col space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-base font-semibold text-gray-900">Elements</h3>
        <div className="flex items-center space-x-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-7 w-7 p-0"
          >
            <Grid3X3 className="w-3 h-3" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-7 w-7 p-0"
          >
            <List className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* Search */}
      {!searchQuery && (
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
          <Input
            placeholder="Search elements..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 text-sm h-8"
          />
        </div>
      )}

      {/* Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-4 gap-1 mb-2 flex-shrink-0">
          {categories.slice(0, 12).map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex flex-col items-center space-y-0.5 h-auto p-1.5"
            >
              <div className="flex items-center space-x-0.5">
                <div className="scale-75">
                {category.icon}
                </div>
                {category.count !== undefined && category.count > 0 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-3 min-w-3 text-xs">
                    {category.count}
                  </Badge>
                )}
              </div>
              <span className="text-xs leading-tight">{category.label}</span>
            </Button>
        ))}
      </div>

        {/* Elements Grid/List - Scrollable Area */}
        <div className={`flex-1 overflow-y-auto pr-2 ${viewMode === 'grid' ? 'space-y-1' : 'space-y-0.5'}`}>
          {filteredElements.length > 0 ? (
            <>
              {selectedCategory === 'favorites' && favorites.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No favorite elements yet</p>
                  <p className="text-xs">Click the star icon to add favorites</p>
                </div>
              )}
              {selectedCategory === 'recent' && recentlyUsed.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Timer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recently used elements</p>
                  <p className="text-xs">Start adding elements to see them here</p>
                </div>
              )}
              {filteredElements.map((element) => (
                <DraggableElement
                  key={element.type}
                  {...element}
                  onDrop={handleElementDrop}
                  isFavorite={favorites.includes(element.type)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No elements found</p>
              <p className="text-xs">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>

        {/* Element Count - Fixed at bottom */}
        <div className="text-center flex-shrink-0 mt-2 pb-1">
        <Badge variant="outline" className="text-xs">
          {filteredElements.length} of {elements.length} elements
        </Badge>
      </div>
      </Tabs>
    </div>
  );
} 