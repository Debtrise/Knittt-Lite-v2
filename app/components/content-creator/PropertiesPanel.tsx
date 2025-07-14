'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ContentElement, useContentStore } from '../../store/contentStore';
import { toast } from 'react-hot-toast';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Type, Palette, Move, Layers, Play, Settings, Eye, EyeOff,
  Lock, Unlock, Copy, Trash2, RotateCw, FlipHorizontal, AlignLeft,
  AlignCenter, AlignRight, Bold, Italic, Underline, Link,
  Image, Video, Square, Circle, Triangle, Star, Heart,
  Zap, Sparkles, Monitor, Smartphone, Tablet, ChevronDown,
  Upload
} from 'lucide-react';
import { AssetLibrary } from './AssetLibrary';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Switch } from '../ui/switch';
import { ColorPicker } from '../ui/color-picker';
import { getCorsImageUrl } from '../../utils/imageProxy';

interface PropertiesPanelProps {
  element: ContentElement | null;
  onUpdate: (elementId: string, updates: Partial<ContentElement>) => void;
}

// Font categories with their fonts
const fontCategories = {
  'Sans-Serif': [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: "'Roboto', sans-serif" },
    { name: 'Open Sans', value: "'Open Sans', sans-serif" },
    { name: 'Lato', value: "'Lato', sans-serif" },
    { name: 'Montserrat', value: "'Montserrat', sans-serif" },
    { name: 'Poppins', value: "'Poppins', sans-serif" },
    { name: 'Nunito', value: "'Nunito', sans-serif" },
    { name: 'Source Sans Pro', value: "'Source Sans Pro', sans-serif" },
    { name: 'Ubuntu', value: "'Ubuntu', sans-serif" },
    { name: 'Raleway', value: "'Raleway', sans-serif" },
    { name: 'Work Sans', value: "'Work Sans', sans-serif" },
    { name: 'Fira Sans', value: "'Fira Sans', sans-serif" },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Segoe UI', value: "'Segoe UI', sans-serif" },
    { name: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Gill Sans', value: "'Gill Sans', sans-serif" },
  ],
  'Serif': [
    { name: 'Playfair Display', value: "'Playfair Display', serif" },
    { name: 'Merriweather', value: "'Merriweather', serif" },
    { name: 'Lora', value: "'Lora', serif" },
    { name: 'Crimson Text', value: "'Crimson Text', serif" },
    { name: 'Libre Baskerville', value: "'Libre Baskerville', serif" },
    { name: 'EB Garamond', value: "'EB Garamond', serif" },
    { name: 'Cormorant Garamond', value: "'Cormorant Garamond', serif" },
    { name: 'Spectral', value: "'Spectral', serif" },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Times New Roman', value: "'Times New Roman', serif" },
    { name: 'Book Antiqua', value: "'Book Antiqua', serif" },
    { name: 'Palatino Linotype', value: "'Palatino Linotype', serif" },
  ],
  'Display': [
    { name: 'Oswald', value: "'Oswald', sans-serif" },
    { name: 'Bebas Neue', value: "'Bebas Neue', sans-serif" },
    { name: 'Anton', value: "'Anton', sans-serif" },
    { name: 'Fjalla One', value: "'Fjalla One', sans-serif" },
    { name: 'Righteous', value: "'Righteous', cursive" },
    { name: 'Lobster', value: "'Lobster', cursive" },
    { name: 'Dancing Script', value: "'Dancing Script', cursive" },
    { name: 'Pacifico', value: "'Pacifico', cursive" },
    { name: 'Bangers', value: "'Bangers', cursive" },
    { name: 'Fredoka One', value: "'Fredoka One', cursive" },
    { name: 'Permanent Marker', value: "'Permanent Marker', cursive" },
    { name: 'Creepster', value: "'Creepster', cursive" },
    { name: 'Orbitron', value: "'Orbitron', sans-serif" },
    { name: 'Audiowide', value: "'Audiowide', cursive" },
    { name: 'Bungee', value: "'Bungee', cursive" },
  ],
  'Monospace': [
    { name: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
    { name: 'Fira Code', value: "'Fira Code', monospace" },
    { name: 'Source Code Pro', value: "'Source Code Pro', monospace" },
    { name: 'Roboto Mono', value: "'Roboto Mono', monospace" },
    { name: 'Space Mono', value: "'Space Mono', monospace" },
    { name: 'Ubuntu Mono', value: "'Ubuntu Mono', monospace" },
    { name: 'Courier New', value: "'Courier New', monospace" },
    { name: 'Monaco', value: 'Monaco, monospace' },
    { name: 'Consolas', value: 'Consolas, monospace' },
  ],
  'Handwriting': [
    { name: 'Kaushan Script', value: "'Kaushan Script', cursive" },
    { name: 'Great Vibes', value: "'Great Vibes', cursive" },
    { name: 'Satisfy', value: "'Satisfy', cursive" },
    { name: 'Amatic SC', value: "'Amatic SC', cursive" },
    { name: 'Caveat', value: "'Caveat', cursive" },
    { name: 'Indie Flower', value: "'Indie Flower', cursive" },
    { name: 'Shadows Into Light', value: "'Shadows Into Light', cursive" },
    { name: 'Architects Daughter', value: "'Architects Daughter', cursive" },
    { name: 'Gloria Hallelujah', value: "'Gloria Hallelujah', cursive" },
  ],
  'Decorative': [
    { name: 'Cinzel', value: "'Cinzel', serif" },
    { name: 'Abril Fatface', value: "'Abril Fatface', cursive" },
    { name: 'Alfa Slab One', value: "'Alfa Slab One', cursive" },
    { name: 'Comfortaa', value: "'Comfortaa', cursive" },
    { name: 'Quicksand', value: "'Quicksand', sans-serif" },
    { name: 'Rubik', value: "'Rubik', sans-serif" },
    { name: 'Exo 2', value: "'Exo 2', sans-serif" },
    { name: 'Press Start 2P', value: "'Press Start 2P', cursive" },
  ],
};

// Font selector component with preview
function FontSelector({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getCurrentFontName = () => {
    for (const category of Object.values(fontCategories)) {
      const font = category.find(f => f.value === value);
      if (font) return font.name;
    }
    return 'Select Font';
  };

  const filteredFonts = Object.entries(fontCategories).reduce((acc, [category, fonts]) => {
    const filtered = fonts.filter(font => 
      font.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof fontCategories[keyof typeof fontCategories]>);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between mt-2"
        >
          <span style={{ fontFamily: value }}>{getCurrentFontName()}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Search fonts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {Object.entries(filteredFonts).map(([category, fonts]) => (
            <div key={category}>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                {category}
              </div>
              {fonts.map((font) => (
                <button
                  key={font.value}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                  onClick={() => {
                    onChange(font.value);
                    setIsOpen(false);
                  }}
                >
                  <span style={{ fontFamily: font.value }}>{font.name}</span>
                  <span 
                    className="text-sm text-gray-400 ml-2" 
                    style={{ fontFamily: font.value }}
                  >
                    Aa
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PropertiesPanel({ element, onUpdate }: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState('content');

  if (!element) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Settings className="w-8 h-8 opacity-50" />
        </div>
        <h3 className="font-medium mb-2">No Element Selected</h3>
        <p className="text-sm">Select an element to edit its properties</p>
        <div className="mt-4 text-xs space-y-1">
          <p>• Click on any element in the canvas</p>
          <p>• Or select from the layers panel</p>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property: string, value: any) => {
    console.log('handlePropertyChange called:', property, value, 'for element:', element.id);
    onUpdate(element.id, {
      properties: {
        ...element.properties,
        [property]: value
      }
    });
  };

  const handleStyleChange = (style: string, value: any) => {
    onUpdate(element.id, {
      styles: {
        ...element.styles,
        [style]: value
      }
    });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    onUpdate(element.id, {
      position: {
        ...element.position,
        [axis]: value
      }
    });
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    onUpdate(element.id, {
      size: {
        ...element.size,
        [dimension]: value
      }
    });
  };

  const handleOpacityChange = (value: number[]) => {
    onUpdate(element.id, { opacity: value[0] });
  };

  const getElementIcon = () => {
    const iconMap = {
      text: <Type className="w-4 h-4 text-blue-600" />,
      image: <Image className="w-4 h-4 text-green-600" />,
      video: <Video className="w-4 h-4 text-red-600" />,
      shape: <Square className="w-4 h-4 text-purple-600" />,
      button: <Square className="w-4 h-4 text-orange-600" />,
      confetti: <Sparkles className="w-4 h-4 text-yellow-600" />
    };
    return iconMap[element.elementType] || <Settings className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="space-y-4">
      {/* Element Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
            {getElementIcon()}
          </div>
          <div>
            <h3 className="font-semibold capitalize text-gray-900">{element.elementType}</h3>
            <p className="text-xs text-gray-500">ID: {element.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        <Button variant="outline" size="sm" className="flex flex-col items-center p-2">
          <Eye className="w-4 h-4 mb-1" />
          <span className="text-xs">Visible</span>
        </Button>
        <Button variant="outline" size="sm" className="flex flex-col items-center p-2">
          <Lock className="w-4 h-4 mb-1" />
          <span className="text-xs">Lock</span>
        </Button>
        <Button variant="outline" size="sm" className="flex flex-col items-center p-2">
          <Copy className="w-4 h-4 mb-1" />
          <span className="text-xs">Copy</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex flex-col items-center p-2"
          onClick={() => {
            toast.success('Layer controls in Layout tab below!');
            // Automatically switch to layout tab where layer controls are
            setActiveTab('layout');
          }}
        >
          <Layers className="w-4 h-4 mb-1" />
          <span className="text-xs">Layer</span>
        </Button>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content" className="text-xs">
            <Type className="w-3 h-3 mr-1" />
            Content
          </TabsTrigger>
          <TabsTrigger value="style" className="text-xs">
            <Palette className="w-3 h-3 mr-1" />
            Style
          </TabsTrigger>
          <TabsTrigger value="layout" className="text-xs">
            <Move className="w-3 h-3 mr-1" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="effects" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Effects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 mt-4">
          <ContentProperties element={element} onChange={handlePropertyChange} />
        </TabsContent>

        <TabsContent value="style" className="space-y-4 mt-4">
          <StyleProperties element={element} onChange={handleStyleChange} />
        </TabsContent>

        <TabsContent value="layout" className="space-y-4 mt-4">
          <LayoutProperties 
            element={element} 
            onPositionChange={handlePositionChange}
            onSizeChange={handleSizeChange}
          />
        </TabsContent>

        <TabsContent value="effects" className="space-y-4 mt-4">
          <EffectProperties element={element} onUpdate={onUpdate} onOpacityChange={handleOpacityChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContentProperties({ element, onChange }: { element: ContentElement; onChange: (property: string, value: any) => void }) {
  // Image component state (only used for image elements)
  const [imageUrl, setImageUrl] = useState(element.properties.src || '');
  const [isLoading, setIsLoading] = useState(false);
  // Add ref for text textarea
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  // Video library modal state
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);

  // Auto-focus the textarea when the element is a text element
  useEffect(() => {
    if ((element.properties.customElementType || element.elementType) === 'text' && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [element.id, element.elementType, element.properties.customElementType]);

  // Update imageUrl when element src changes externally
  React.useEffect(() => {
    if (element.elementType === 'image') {
      setImageUrl(element.properties.src || '');
    }
  }, [element.properties.src, element.elementType]);

  // Listen for video upload trigger events
  React.useEffect(() => {
    const handleVideoUploadTrigger = (event: CustomEvent) => {
      if (event.detail.elementId === element.id && element.elementType === 'video') {
        // Trigger the video upload input
        const videoUploadInput = document.getElementById('video-upload') as HTMLInputElement;
        if (videoUploadInput) {
          videoUploadInput.click();
        }
      }
    };

    window.addEventListener('trigger-video-upload', handleVideoUploadTrigger as EventListener);
    
    return () => {
      window.removeEventListener('trigger-video-upload', handleVideoUploadTrigger as EventListener);
    };
  }, [element.id, element.elementType]);

  const handleUrlSave = async () => {
    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl) return;
    
    setIsLoading(true);
    console.log('Attempting to save URL:', trimmedUrl);
    
    try {
      // Always save the URL first (for immediate feedback)
      onChange('src', trimmedUrl);
      console.log('URL saved to element properties');
      
      // Test if the URL can be loaded (but don't fail if it can't)
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const loadPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image load timeout'));
        }, 5000); // 5 second timeout
        
        img.onload = () => {
          clearTimeout(timeout);
          console.log('Image successfully loaded');
          resolve(img);
        };
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Image failed to load'));
        };
        img.src = trimmedUrl;
      });
      
      await loadPromise;
    } catch (error) {
      console.warn('Image validation failed, but URL was saved:', error.message);
      // URL is already saved, just log the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setImageUrl(result);
        onChange('src', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert('Video file is too large. Maximum size is 100MB.');
      return;
    }

    try {
      // Show loading state
      const loadingToast = toast.loading('Uploading video...');
      
      // Upload to content API
      const { uploadAsset } = useContentStore.getState();
      const asset = await uploadAsset(file, {
        name: file.name,
        tags: 'video,uploaded'
      });

      // Update the video element with the uploaded asset URL
      onChange('src', asset.publicUrl);
      
      toast.dismiss(loadingToast);
      toast.success('Video uploaded successfully!');
      
      // Clear the file input
      event.target.value = '';
      
    } catch (error) {
      console.error('Failed to upload video:', error);
      toast.error('Failed to upload video. Please try again.');
      
      // Fallback to local blob URL for immediate preview
      const url = URL.createObjectURL(file);
      onChange('src', url);
      toast.info('Using local preview (video will need to be re-uploaded on save)');
    }
  };

  // Check for custom element type first, then fall back to database element type
  const elementTypeToUse = element.properties.customElementType || element.elementType;
  
  switch (elementTypeToUse) {
    case 'sales_rep_photo':
      return (
        <div className="space-y-4">
          {/* Sales Rep Photo Header */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 text-purple-600 font-bold text-xs flex items-center justify-center rounded-full bg-purple-100">👤</div>
              <span className="text-sm font-medium text-purple-800">Sales Rep Photo Element</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              This element automatically displays the sales rep photo using the {'{rep_photo}'} variable
            </p>
          </div>

          {/* Variable Binding */}
          <div>
            <Label className="text-sm font-medium">Variable Binding</Label>
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <code className="text-sm bg-white px-2 py-1 rounded border font-mono">{'{rep_photo}'}</code>
                <span className="text-xs text-gray-600">This element binds to the rep_photo variable</span>
              </div>
            </div>
          </div>

          {/* Current Sales Rep Info */}
          {(element.properties.repEmail || element.properties.repName) && (
            <div>
              <Label className="text-sm font-medium">Current Sales Rep</Label>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="space-y-1">
                  {element.properties.repName && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Name:</span>
                      <span className="text-sm font-medium">{element.properties.repName}</span>
                    </div>
                  )}
                  {element.properties.repEmail && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Email:</span>
                      <span className="text-sm">{element.properties.repEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fallback Photo Settings */}
          <div>
            <Label htmlFor="fallbackUrl" className="text-sm font-medium">Fallback Photo URL</Label>
            <Input
              id="fallbackUrl"
              type="url"
              value={element.properties.fallbackUrl || ''}
              onChange={(e) => onChange('fallbackUrl', e.target.value)}
              placeholder="https://example.com/default-photo.jpg"
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used when no sales rep photo is found for the current rep
            </p>
          </div>

          {/* Frame Style */}
          <div>
            <Label className="text-sm font-medium">Frame Style</Label>
            <Select value={element.properties.frame || 'circle'} onValueChange={(value) => onChange('frame', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Frame</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="rounded">Rounded Square</SelectItem>
                <SelectItem value="classic">Classic Frame</SelectItem>
                <SelectItem value="modern">Modern Frame</SelectItem>
                <SelectItem value="shadow">Drop Shadow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Frame Customization */}
          {element.properties.frame && element.properties.frame !== 'none' && (
            <>
              <div>
                <Label htmlFor="frameColor" className="text-sm font-medium">Frame Color</Label>
                <div className="mt-2">
                  <ColorPicker
                    value={element.properties.frameColor || '#e2e8f0'}
                    onChange={(color) => onChange('frameColor', color)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="frameWidth" className="text-sm font-medium">
                  Frame Width: {element.properties.frameWidth || 4}px
                </Label>
                <Slider
                  value={[element.properties.frameWidth || 4]}
                  onValueChange={(value) => onChange('frameWidth', value[0])}
                  max={20}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>
            </>
          )}

          {/* Object Fit */}
          <div>
            <Label className="text-sm font-medium">Image Fit</Label>
            <Select value={element.properties.objectFit || 'cover'} onValueChange={(value) => onChange('objectFit', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover (Fill frame)</SelectItem>
                <SelectItem value="contain">Contain (Fit within frame)</SelectItem>
                <SelectItem value="fill">Fill (Stretch to fit)</SelectItem>
                <SelectItem value="none">None (Original size)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Photo Preview */}
          {(element.properties.imageUrl || element.properties.fallbackUrl) && (
            <div>
              <Label className="text-sm font-medium">Preview</Label>
              <div className="mt-2">
                <div 
                  className="w-24 h-24 bg-gray-100 border overflow-hidden mx-auto"
                  style={{
                    borderRadius: element.properties.frame === 'circle' ? '50%' : 
                                element.properties.frame === 'rounded' ? '8px' : '0px',
                    borderWidth: element.properties.frame !== 'none' ? `${element.properties.frameWidth || 4}px` : '0px',
                    borderColor: element.properties.frameColor || '#e2e8f0',
                    borderStyle: 'solid'
                  }}
                >
                  <img 
                    src={element.properties.imageUrl || element.properties.fallbackUrl} 
                    alt="Sales Rep Photo Preview" 
                    className="w-full h-full"
                    style={{ objectFit: element.properties.objectFit || 'cover' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">No Image</div>';
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  {element.properties.imageUrl ? 'Current rep photo' : 'Fallback photo'}
                </p>
              </div>
            </div>
          )}

          {/* Variable Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2">How it works:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• This element automatically shows the photo for the current sales rep</li>
              <li>• It uses the {'{rep_photo}'} variable to find the right photo</li>
              <li>• If no photo is found, it shows the fallback photo</li>
              <li>• You can customize the frame style and appearance</li>
            </ul>
          </div>
        </div>
      );

    case 'animation':
      // Handle animation elements that are actually text elements
      if (element.properties && 'text' in element.properties) {
        return (
          <div className="space-y-4">
            {/* Text Editing Mode Indicator */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Animated Text Element</span>
                <span className="text-xs text-blue-600">(Double-click text element to edit)</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="text" className="text-sm font-medium">Text Content</Label>
              <Textarea
                id="text"
                ref={textAreaRef}
                value={element.properties.text || ''}
                onChange={(e) => onChange('text', e.target.value)}
                placeholder="Enter text content..."
                className="mt-2 min-h-[80px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use variables like {'{lead.name}'}, {'{dealAmount}'}, {'{repName}'}, {'{repEmail}'} for dynamic content
              </p>
            </div>

            {/* Live Preview */}
            <div>
              <Label className="text-sm font-medium">Live Preview</Label>
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px]">
                <div 
                  className="w-full break-words"
                  style={{
                    textAlign: element.properties.textAlign || 'left',
                    fontSize: element.styles?.fontSize || '16px',
                    fontWeight: element.styles?.fontWeight || 'normal',
                    color: element.styles?.color || '#000000',
                    fontFamily: element.styles?.fontFamily || 'Inter, sans-serif',
                    lineHeight: element.styles?.lineHeight || '1.4',
                    ...element.styles
                  }}
                >
                  {element.properties.text || 'Your text here - click to edit'}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="textAlign" className="text-sm font-medium">Text Alignment</Label>
              <div className="flex space-x-1 mt-2">
                <Button
                  variant={element.properties.textAlign === 'left' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange('textAlign', 'left')}
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant={element.properties.textAlign === 'center' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange('textAlign', 'center')}
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button
                  variant={element.properties.textAlign === 'right' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onChange('textAlign', 'right')}
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Text Formatting</Label>
              <div className="flex space-x-1 mt-2">
                <Button variant="outline" size="sm">
                  <Bold className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Italic className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Underline className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Link className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      }
      // For non-text animation elements
      return (
        <div className="text-center py-8 text-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Animation element properties coming soon</p>
        </div>
      );

    case 'text':
      return (
        <div className="space-y-4">
          {/* Text Editing Mode Indicator */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Type className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Text Editing Mode</span>
              <span className="text-xs text-blue-600">(Double-click text element to edit)</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="text" className="text-sm font-medium">Text Content</Label>
            <Textarea
              id="text"
              ref={textAreaRef}
              value={element.properties.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
              placeholder="Enter text content..."
              className="mt-2 min-h-[80px]"
            />
            <p className="text-xs text-gray-500 mt-1">
                Use variables like {'{lead.name}'}, {'{dealAmount}'}, {'{repName}'}, {'{repEmail}'} for dynamic content
            </p>
          </div>

          {/* Live Preview */}
          <div>
            <Label className="text-sm font-medium">Live Preview</Label>
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px]">
              <div 
                className="w-full break-words"
                style={{
                  textAlign: element.properties.textAlign || 'left',
                  fontSize: element.styles?.fontSize || '16px',
                  fontWeight: element.styles?.fontWeight || 'normal',
                  color: element.styles?.color || '#000000',
                  fontFamily: element.styles?.fontFamily || 'Inter, sans-serif',
                  lineHeight: element.styles?.lineHeight || '1.4',
                  ...element.styles
                }}
              >
                {element.properties.text || 'Your text here - click to edit'}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="textAlign" className="text-sm font-medium">Text Alignment</Label>
            <div className="flex space-x-1 mt-2">
              <Button
                variant={element.properties.textAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('textAlign', 'left')}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={element.properties.textAlign === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('textAlign', 'center')}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant={element.properties.textAlign === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('textAlign', 'right')}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Text Formatting</Label>
            <div className="flex space-x-1 mt-2">
              <Button variant="outline" size="sm">
                <Bold className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Italic className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Underline className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Link className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="src" className="text-sm font-medium">Image Source</Label>
            <div className="mt-2 space-y-2">
              <div className="flex space-x-2">
            <Input
              id="src"
              type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://picsum.photos/400/300"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUrlSave();
                    }
                  }}
                />
                <Button 
                  onClick={handleUrlSave}
                  disabled={!imageUrl.trim() || isLoading}
                  size="sm"
                  className="px-3"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    'Load'
                  )}
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-xs text-gray-500 px-2">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="w-full"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              </div>
            </div>
            
            {element.properties.src && (
              <div className="mt-3">
                <div className="aspect-video bg-gray-100 rounded border overflow-hidden">
                  <img 
                    src={getCorsImageUrl(element.properties.src)} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onLoad={() => console.log('Preview image loaded successfully')}
                    onError={(e) => {
                      console.log('Preview image failed to load:', element.properties.src);
                      // Show a fallback or error state
                      e.currentTarget.style.display = 'none';
                    }}
                    crossOrigin={getCorsImageUrl(element.properties.src).startsWith('/api/proxy/image') ? undefined : 'anonymous'}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Preview • {element.properties.src.substring(0, 50)}...
                </p>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              💡 Try: https://picsum.photos/400/300 for a test image
            </p>
          </div>
          
          <div>
            <Label htmlFor="alt" className="text-sm font-medium">Alt Text</Label>
            <Input
              id="alt"
              value={element.properties.alt || ''}
              onChange={(e) => onChange('alt', e.target.value)}
              placeholder="Image description"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Frame Style</Label>
            <Select value={element.properties.frame || 'none'} onValueChange={(value) => onChange('frame', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Frame</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="vintage">Vintage</SelectItem>
                <SelectItem value="polaroid">Polaroid</SelectItem>
                <SelectItem value="ornate">Ornate</SelectItem>
                <SelectItem value="shadow">Shadow</SelectItem>
                <SelectItem value="floating">Floating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {element.properties.frame && element.properties.frame !== 'none' && (
            <>
              <div>
                <Label htmlFor="frameColor" className="text-sm font-medium">Frame Color</Label>
                <div className="mt-2">
                  <ColorPicker
                    value={element.properties.frameColor || '#000000'}
                    onChange={(color) => onChange('frameColor', color)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="frameWidth" className="text-sm font-medium">
                  Frame Width: {element.properties.frameWidth || 8}px
                </Label>
                <Slider
                  value={[element.properties.frameWidth || 8]}
                  onValueChange={(value) => onChange('frameWidth', value[0])}
                  max={20}
                  min={2}
                  step={1}
                  className="mt-2"
                />
              </div>
            </>
          )}

          <div>
            <Label className="text-sm font-medium">Object Fit</Label>
            <Select value={element.properties.objectFit || 'cover'} onValueChange={(value) => onChange('objectFit', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="fill">Fill</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="scale-down">Scale Down</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'video':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="src" className="text-sm font-medium">Video Source</Label>
            <Input
              id="src"
              type="url"
              value={element.properties.src || ''}
              onChange={(e) => onChange('src', e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="mt-2"
            />
          </div>
          
          <div>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
              id="video-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('video-upload')?.click()}
              className="w-full"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          </div>
          
          {element.properties.src && (
            <div className="mt-3">
              <div className="aspect-video bg-gray-100 rounded border overflow-hidden">
                <video 
                  src={element.properties.src}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                  onLoadStart={() => console.log('Video preview loading...')}
                  onLoadedMetadata={() => console.log('Video preview loaded successfully')}
                  onError={(e) => {
                    console.log('Video preview failed to load:', element.properties.src);
                    // Show a fallback or error state
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Preview • {element.properties.src.substring(0, 50)}...
              </p>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
            💡 Supports: MP4, WebM, OGV formats (Max 100MB)
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={element.properties.autoplay || false}
                onCheckedChange={(checked) => onChange('autoplay', checked)}
              />
              <Label className="text-sm">Autoplay</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={element.properties.loop || false}
                onCheckedChange={(checked) => onChange('loop', checked)}
              />
              <Label className="text-sm">Loop</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={element.properties.muted || false}
                onCheckedChange={(checked) => onChange('muted', checked)}
              />
              <Label className="text-sm">Muted</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={element.properties.controls !== false}
                onCheckedChange={(checked) => onChange('controls', checked)}
              />
              <Label className="text-sm">Controls</Label>
            </div>
          </div>
          
          <div>
            <Label htmlFor="poster" className="text-sm font-medium">Poster Image (Optional)</Label>
            <Input
              id="poster"
              type="url"
              value={element.properties.poster || ''}
              onChange={(e) => onChange('poster', e.target.value)}
              placeholder="https://example.com/poster.jpg"
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Thumbnail image shown before video plays
            </p>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Object Fit</Label>
            <Select value={element.properties.objectFit || 'contain'} onValueChange={(value) => onChange('objectFit', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contain">Contain (Fit entire video)</SelectItem>
                <SelectItem value="cover">Cover (Fill container)</SelectItem>
                <SelectItem value="fill">Fill (Stretch to fit)</SelectItem>
                <SelectItem value="none">None (Original size)</SelectItem>
                <SelectItem value="scale-down">Scale Down (Smaller of contain/none)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'video_player':
      return (
        <div className="space-y-6">
          {/* Basic Video Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Video Source</h3>
            
            <div>
              <Label htmlFor="src" className="text-sm font-medium">Video URL</Label>
              <Input
                id="src"
                type="url"
                value={element.properties.src || ''}
                onChange={(e) => onChange('src', e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="mt-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload-player"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('video-upload-player')?.click()}
                  className="flex-1"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowVideoLibrary(true)}
                  className="flex-1"
                  size="sm"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Choose from Library
                </Button>
              </div>
              
              {/* Video Library Modal */}
              {showVideoLibrary && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-lg font-semibold">Select Video from Library</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowVideoLibrary(false)}
                      >
                        ✕
                      </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="p-4 border-b bg-gray-50">
                        <p className="text-sm text-gray-600">
                          Select a video from your library. Only video files are shown.
                        </p>
                      </div>
                      <AssetLibrary
                        compact={false}
                        searchQuery=""
                        onAssetSelect={(asset: any) => {
                          if (asset.assetType === 'video') {
                            onChange('src', asset.publicUrl);
                            setShowVideoLibrary(false);
                            toast.success(`Selected video: ${asset.name}`);
                          } else {
                            toast.error('Please select a video file');
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {element.properties.src && (
              <div className="mt-3">
                <div className="aspect-video bg-gray-100 rounded border overflow-hidden">
                  <video 
                    src={element.properties.src}
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                    onLoadStart={() => console.log('Video preview loading...')}
                    onLoadedMetadata={() => console.log('Video preview loaded successfully')}
                    onError={(e) => {
                      console.log('Video preview failed to load:', element.properties.src);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Preview • {element.properties.src.substring(0, 50)}...
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="poster" className="text-sm font-medium">Poster Image (Optional)</Label>
              <Input
                id="poster"
                type="url"
                value={element.properties.poster || ''}
                onChange={(e) => onChange('poster', e.target.value)}
                placeholder="https://example.com/poster.jpg"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Thumbnail image shown before video plays
              </p>
            </div>
          </div>

          {/* Playback Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Playback Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.autoplay || false}
                  onCheckedChange={(checked) => onChange('autoplay', checked)}
                />
                <Label className="text-sm">Autoplay</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.loop || false}
                  onCheckedChange={(checked) => onChange('loop', checked)}
                />
                <Label className="text-sm">Loop</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.muted || false}
                  onCheckedChange={(checked) => onChange('muted', checked)}
                />
                <Label className="text-sm">Muted</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.controls !== false}
                  onCheckedChange={(checked) => onChange('controls', checked)}
                />
                <Label className="text-sm">Show Controls</Label>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Preload</Label>
              <Select value={element.properties.preload || 'metadata'} onValueChange={(value) => onChange('preload', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="metadata">Metadata</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Object Fit</Label>
              <Select value={element.properties.objectFit || 'contain'} onValueChange={(value) => onChange('objectFit', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contain">Contain (Fit entire video)</SelectItem>
                  <SelectItem value="cover">Cover (Fill container)</SelectItem>
                  <SelectItem value="fill">Fill (Stretch to fit)</SelectItem>
                  <SelectItem value="none">None (Original size)</SelectItem>
                  <SelectItem value="scale-down">Scale Down (Smaller of contain/none)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Aspect Ratio</Label>
              <Select value={element.properties.aspectRatio || '16:9'} onValueChange={(value) => onChange('aspectRatio', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                  <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                  <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="auto">Auto (Video native)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Control Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Control Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.showControlsOnHover !== false}
                  onCheckedChange={(checked) => onChange('showControlsOnHover', checked)}
                />
                <Label className="text-sm">Show on Hover</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.showTimeDisplay !== false}
                  onCheckedChange={(checked) => onChange('showTimeDisplay', checked)}
                />
                <Label className="text-sm">Time Display</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.showVolumeControl !== false}
                  onCheckedChange={(checked) => onChange('showVolumeControl', checked)}
                />
                <Label className="text-sm">Volume Control</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.showFullscreenButton !== false}
                  onCheckedChange={(checked) => onChange('showFullscreenButton', checked)}
                />
                <Label className="text-sm">Fullscreen Button</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.showProgressBar !== false}
                  onCheckedChange={(checked) => onChange('showProgressBar', checked)}
                />
                <Label className="text-sm">Progress Bar</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.enablePictureInPicture !== false}
                  onCheckedChange={(checked) => onChange('enablePictureInPicture', checked)}
                />
                <Label className="text-sm">Picture-in-Picture</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.enableKeyboardControls !== false}
                  onCheckedChange={(checked) => onChange('enableKeyboardControls', checked)}
                />
                <Label className="text-sm">Keyboard Controls</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.showVideoInfo || false}
                  onCheckedChange={(checked) => onChange('showVideoInfo', checked)}
                />
                <Label className="text-sm">Video Info</Label>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Advanced Settings</h3>
            
            <div>
              <Label className="text-sm font-medium">Custom Skin</Label>
              <Select value={element.properties.customSkin || 'default'} onValueChange={(value) => onChange('customSkin', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="theater">Theater</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Cross Origin</Label>
              <Select value={element.properties.crossOrigin || 'anonymous'} onValueChange={(value) => onChange('crossOrigin', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anonymous">Anonymous</SelectItem>
                  <SelectItem value="use-credentials">Use Credentials</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Skip Backward (seconds)</Label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={element.properties.skipBackwardSeconds || 10}
                  onChange={(e) => onChange('skipBackwardSeconds', parseInt(e.target.value) || 10)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">Skip Forward (seconds)</Label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={element.properties.skipForwardSeconds || 10}
                  onChange={(e) => onChange('skipForwardSeconds', parseInt(e.target.value) || 10)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.analyticsTracking || false}
                  onCheckedChange={(checked) => onChange('analyticsTracking', checked)}
                />
                <Label className="text-sm">Analytics Tracking</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={element.properties.customEvents || false}
                  onCheckedChange={(checked) => onChange('customEvents', checked)}
                />
                <Label className="text-sm">Custom Events</Label>
              </div>
            </div>
          </div>

          {/* Watermark Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Watermark</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={element.properties.watermark || false}
                onCheckedChange={(checked) => onChange('watermark', checked)}
              />
              <Label className="text-sm">Enable Watermark</Label>
            </div>
            
            {element.properties.watermark && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Watermark Text</Label>
                  <Input
                    value={element.properties.watermarkText || ''}
                    onChange={(e) => onChange('watermarkText', e.target.value)}
                    placeholder="Your Brand Name"
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Position</Label>
                  <Select value={element.properties.watermarkPosition || 'bottom-right'} onValueChange={(value) => onChange('watermarkPosition', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Opacity</Label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={element.properties.watermarkOpacity || 0.7}
                      onChange={(e) => onChange('watermarkOpacity', parseFloat(e.target.value) || 0.7)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Font Size</Label>
                    <Input
                      value={element.properties.watermarkFontSize || '12px'}
                      onChange={(e) => onChange('watermarkFontSize', e.target.value)}
                      placeholder="12px"
                      className="mt-2"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Color</Label>
                  <Input
                    type="color"
                    value={element.properties.watermarkColor || '#ffffff'}
                    onChange={(e) => onChange('watermarkColor', e.target.value)}
                    className="mt-2 w-full h-10"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              💡 Supports: MP4, WebM, OGV formats (Max 100MB)
            </p>
            <p className="text-xs text-gray-500 mt-1">
              🎮 Keyboard shortcuts: Space (play/pause), ←→ (seek), ↑↓ (volume), M (mute), F (fullscreen), I (PiP)
            </p>
          </div>
        </div>
      );

    case 'shape':
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Shape Type</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <Button
                variant={element.properties.shape === 'rectangle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('shape', 'rectangle')}
                className="flex flex-col items-center p-2"
              >
                <Square className="w-4 h-4 mb-1" />
                <span className="text-xs">Rect</span>
              </Button>
              <Button
                variant={element.properties.shape === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('shape', 'circle')}
                className="flex flex-col items-center p-2"
              >
                <Circle className="w-4 h-4 mb-1" />
                <span className="text-xs">Circle</span>
              </Button>
              <Button
                variant={element.properties.shape === 'triangle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('shape', 'triangle')}
                className="flex flex-col items-center p-2"
              >
                <Triangle className="w-4 h-4 mb-1" />
                <span className="text-xs">Triangle</span>
              </Button>
              <Button
                variant={element.properties.shape === 'star' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('shape', 'star')}
                className="flex flex-col items-center p-2"
              >
                <Star className="w-4 h-4 mb-1" />
                <span className="text-xs">Star</span>
              </Button>
            </div>
          </div>
        </div>
      );

    case 'button':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="text" className="text-sm font-medium">Button Text</Label>
            <Input
              id="text"
              value={element.properties.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
              placeholder="Button text"
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="href" className="text-sm font-medium">Link URL</Label>
            <Input
              id="href"
              type="url"
              value={element.properties.href || ''}
              onChange={(e) => onChange('href', e.target.value)}
              placeholder="https://example.com"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Target</Label>
            <Select value={element.properties.target || '_self'} onValueChange={(value) => onChange('target', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Same Window</SelectItem>
                <SelectItem value="_blank">New Window</SelectItem>
                <SelectItem value="_parent">Parent Frame</SelectItem>
                <SelectItem value="_top">Top Frame</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'standard_photo':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="imageUrl" className="text-sm font-medium">Image URL</Label>
            <div className="mt-2 space-y-2">
              <Input
                id="imageUrl"
                type="url"
                value={element.properties.imageUrl || ''}
                onChange={(e) => onChange('imageUrl', e.target.value)}
                placeholder="https://picsum.photos/400/300"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                💡 Try: https://picsum.photos/400/300 for a test image
              </p>
            </div>
            
            {element.properties.imageUrl && (
              <div className="mt-3">
                <div className="aspect-video bg-gray-100 rounded border overflow-hidden">
                  <img 
                    src={getCorsImageUrl(element.properties.imageUrl)} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onLoad={() => console.log('Standard photo preview loaded successfully')}
                    onError={(e) => {
                      console.log('Standard photo preview failed to load:', element.properties.imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    crossOrigin={getCorsImageUrl(element.properties.imageUrl).startsWith('/api/proxy/image') ? undefined : 'anonymous'}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Preview • {element.properties.imageUrl.substring(0, 50)}...
                </p>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="alt" className="text-sm font-medium">Alt Text</Label>
            <Input
              id="alt"
              value={element.properties.alt || ''}
              onChange={(e) => onChange('alt', e.target.value)}
              placeholder="Standard Photo"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Object Fit</Label>
            <Select value={element.properties.objectFit || 'cover'} onValueChange={(value) => onChange('objectFit', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="fill">Fill</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="scale-down">Scale Down</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Object Position</Label>
            <Select value={element.properties.objectPosition || 'center'} onValueChange={(value) => onChange('objectPosition', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="top left">Top Left</SelectItem>
                <SelectItem value="top right">Top Right</SelectItem>
                <SelectItem value="bottom left">Bottom Left</SelectItem>
                <SelectItem value="bottom right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Loading Strategy</Label>
            <Select value={element.properties.loading || 'lazy'} onValueChange={(value) => onChange('loading', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lazy">Lazy (Recommended)</SelectItem>
                <SelectItem value="eager">Eager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Cross Origin</Label>
            <Select value={element.properties.crossOrigin || 'anonymous'} onValueChange={(value) => onChange('crossOrigin', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anonymous">Anonymous</SelectItem>
                <SelectItem value="use-credentials">Use Credentials</SelectItem>
                <SelectItem value="null">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">States & Messages</Label>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={element.properties.showPlaceholder !== false}
                onCheckedChange={(checked) => onChange('showPlaceholder', checked)}
              />
              <Label className="text-sm">Show Placeholder</Label>
            </div>

            {element.properties.showPlaceholder !== false && (
              <div>
                <Label className="text-xs text-gray-500">Placeholder Text</Label>
                <Input
                  value={element.properties.placeholderText || 'Enter image URL...'}
                  onChange={(e) => onChange('placeholderText', e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                checked={element.properties.errorFallback !== false}
                onCheckedChange={(checked) => onChange('errorFallback', checked)}
              />
              <Label className="text-sm">Error Fallback</Label>
            </div>

            {element.properties.errorFallback !== false && (
              <div>
                <Label className="text-xs text-gray-500">Error Message</Label>
                <Input
                  value={element.properties.errorText || 'Image failed to load'}
                  onChange={(e) => onChange('errorText', e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                checked={element.properties.showLoadingState !== false}
                onCheckedChange={(checked) => onChange('showLoadingState', checked)}
              />
              <Label className="text-sm">Loading State</Label>
            </div>

            {element.properties.showLoadingState !== false && (
              <>
                <div>
                  <Label className="text-xs text-gray-500">Loading Message</Label>
                  <Input
                    value={element.properties.loadingText || 'Loading image...'}
                    onChange={(e) => onChange('loadingText', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    Loading Timeout: {element.properties.loadingTimeout || 10000}ms
                  </Label>
                  <Slider
                    value={[element.properties.loadingTimeout || 10000]}
                    onValueChange={(value) => onChange('loadingTimeout', value[0])}
                    max={30000}
                    min={1000}
                    step={1000}
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div className="text-center py-8 text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No content properties available for this element type</p>
        </div>
      );
  }
}

function StyleProperties({ element, onChange }: { element: ContentElement; onChange: (style: string, value: any) => void }) {
  // Check for text element types
  
  // Check for text element types (including animations with text)
  const isTextElement = element.elementType === 'text' || 
                       element.elementType === 'animation' ||
                       (element.properties && 'text' in element.properties);
                       
  console.log('StyleProperties - isTextElement:', isTextElement);

  return (
    <div className="space-y-4">
      {/* Typography Styles (for text elements) */}
      {isTextElement && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Font Size</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  type="number"
                  value={parseInt(element.styles?.fontSize || '16')}
                  onChange={(e) => onChange('fontSize', `${e.target.value}px`)}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">px</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Font Weight</Label>
              <Select value={element.styles?.fontWeight || '400'} onValueChange={(value) => onChange('fontWeight', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light</SelectItem>
                  <SelectItem value="400">Normal</SelectItem>
                  <SelectItem value="500">Medium</SelectItem>
                  <SelectItem value="600">Semi Bold</SelectItem>
                  <SelectItem value="700">Bold</SelectItem>
                  <SelectItem value="800">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Font Family</Label>
            <FontSelector
              value={element.styles?.fontFamily || 'Inter, sans-serif'}
              onChange={(value) => onChange('fontFamily', value)}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Line Height</Label>
            <Slider
              value={[parseFloat(element.styles?.lineHeight || '1.5')]}
              onValueChange={(value) => onChange('lineHeight', value[0].toString())}
              max={3}
              min={1}
              step={0.1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1.0</span>
              <span>{element.styles?.lineHeight || '1.5'}</span>
              <span>3.0</span>
            </div>
          </div>

          {/* Additional Typography Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Letter Spacing</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  type="number"
                  value={parseFloat(element.styles?.letterSpacing || '0')}
                  onChange={(e) => onChange('letterSpacing', `${e.target.value}px`)}
                  className="w-20"
                  step="0.1"
                />
                <span className="text-sm text-gray-500">px</span>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Text Transform</Label>
              <Select value={element.styles?.textTransform || 'none'} onValueChange={(value) => onChange('textTransform', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="uppercase">UPPERCASE</SelectItem>
                  <SelectItem value="lowercase">lowercase</SelectItem>
                  <SelectItem value="capitalize">Capitalize</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Text Decoration Options */}
          <div>
            <Label className="text-sm font-medium">Text Decoration</Label>
            <div className="flex space-x-2 mt-2">
              <Button
                variant={element.styles?.textDecoration === 'underline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('textDecoration', 
                  element.styles?.textDecoration === 'underline' ? 'none' : 'underline'
                )}
              >
                <Underline className="w-4 h-4" />
              </Button>
              <Button
                variant={element.styles?.fontStyle === 'italic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('fontStyle', 
                  element.styles?.fontStyle === 'italic' ? 'normal' : 'italic'
                )}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant={element.styles?.textDecoration === 'line-through' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('textDecoration', 
                  element.styles?.textDecoration === 'line-through' ? 'none' : 'line-through'
                )}
              >
                <span className="text-sm">S</span>
              </Button>
            </div>
          </div>

          {/* Text Shadow Options */}
          <div>
            <Label className="text-sm font-medium">Text Shadow</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                variant={element.styles?.textShadow === 'none' || !element.styles?.textShadow ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('textShadow', 'none')}
              >
                None
              </Button>
              <Button
                variant={element.styles?.textShadow === '1px 1px 2px rgba(0,0,0,0.3)' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('textShadow', '1px 1px 2px rgba(0,0,0,0.3)')}
              >
                Light
              </Button>
              <Button
                variant={element.styles?.textShadow === '2px 2px 4px rgba(0,0,0,0.5)' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('textShadow', '2px 2px 4px rgba(0,0,0,0.5)')}
              >
                Medium
              </Button>
              <Button
                variant={element.styles?.textShadow === '3px 3px 6px rgba(0,0,0,0.7)' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('textShadow', '3px 3px 6px rgba(0,0,0,0.7)')}
              >
                Strong
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Color Properties */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">
            {isTextElement ? 'Text Color' : 'Background Color'}
          </Label>
          <div className="flex items-center space-x-2 mt-2">
            <ColorPicker
              value={element.styles?.color || element.styles?.backgroundColor || '#000000'}
              onChange={(color) => onChange(isTextElement ? 'color' : 'backgroundColor', color)}
            />
            <Input
              value={element.styles?.color || element.styles?.backgroundColor || '#000000'}
              onChange={(e) => onChange(isTextElement ? 'color' : 'backgroundColor', e.target.value)}
              className="font-mono text-sm"
              placeholder="#000000"
            />
          </div>
        </div>
      </div>

      {/* Border & Radius */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Border Radius</Label>
          <div className="flex items-center space-x-2 mt-2">
            <Slider
              value={[parseInt(element.styles?.borderRadius || '0')]}
              onValueChange={(value) => onChange('borderRadius', `${value[0]}px`)}
              max={50}
              min={0}
              className="flex-1"
            />
            <span className="text-sm text-gray-500 w-12">{element.styles?.borderRadius || '0px'}</span>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Box Shadow</Label>
          <Select 
            value={element.styles?.boxShadow || 'none'} 
            onValueChange={(value) => onChange('boxShadow', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="0 1px 3px rgba(0, 0, 0, 0.1)">Small</SelectItem>
              <SelectItem value="0 4px 6px rgba(0, 0, 0, 0.1)">Medium</SelectItem>
              <SelectItem value="0 10px 15px rgba(0, 0, 0, 0.1)">Large</SelectItem>
              <SelectItem value="0 20px 25px rgba(0, 0, 0, 0.15)">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Responsive Preview */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <Label className="text-sm font-medium mb-2 block">Preview</Label>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Monitor className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Tablet className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function LayoutProperties({ 
  element, 
  onPositionChange, 
  onSizeChange 
}: { 
  element: ContentElement; 
  onPositionChange: (axis: 'x' | 'y', value: number) => void;
  onSizeChange: (dimension: 'width' | 'height', value: number) => void;
}) {
  const { elements, reorderElements, updateElementLocal, syncElementToBackend } = useContentStore();

  // Layer management functions
  const moveToFront = () => {
    const maxLayer = Math.max(...elements.map(el => el.layerOrder || 0));
    const newOrder = maxLayer + 1;
    updateElementLocal(element.id, { layerOrder: newOrder });
    syncElementToBackend(element.id);
    toast.success('Moved to front');
  };

  const moveToBack = () => {
    const minLayer = Math.min(...elements.map(el => el.layerOrder || 0));
    const newOrder = minLayer - 1;
    updateElementLocal(element.id, { layerOrder: newOrder });
    syncElementToBackend(element.id);
    toast.success('Moved to back');
  };

  const moveForward = () => {
    // Find the next layer up
    const currentLayer = element.layerOrder || 0;
    const higherElements = elements.filter(el => (el.layerOrder || 0) > currentLayer).sort((a, b) => (a.layerOrder || 0) - (b.layerOrder || 0));
    
    if (higherElements.length > 0) {
      const targetElement = higherElements[0];
      const targetLayer = targetElement.layerOrder || 0;
      
      // Swap the layers
      updateElementLocal(element.id, { layerOrder: targetLayer });
      updateElementLocal(targetElement.id, { layerOrder: currentLayer });
      
      syncElementToBackend(element.id);
      syncElementToBackend(targetElement.id);
      toast.success('Moved forward');
    } else {
      toast.success('Already at the front');
    }
  };

  const moveBackward = () => {
    // Find the next layer down
    const currentLayer = element.layerOrder || 0;
    const lowerElements = elements.filter(el => (el.layerOrder || 0) < currentLayer).sort((a, b) => (b.layerOrder || 0) - (a.layerOrder || 0));
    
    if (lowerElements.length > 0) {
      const targetElement = lowerElements[0];
      const targetLayer = targetElement.layerOrder || 0;
      
      // Swap the layers
      updateElementLocal(element.id, { layerOrder: targetLayer });
      updateElementLocal(targetElement.id, { layerOrder: currentLayer });
      
      syncElementToBackend(element.id);
      syncElementToBackend(targetElement.id);
      toast.success('Moved backward');
    } else {
      toast.success('Already at the back');
    }
  };

  const handleLayerOrderChange = (newOrder: number) => {
    updateElementLocal(element.id, { layerOrder: newOrder });
    syncElementToBackend(element.id);
  };

  // Get current layer position info
  const getCurrentLayerInfo = () => {
    const sortedElements = elements.sort((a, b) => (a.layerOrder || 0) - (b.layerOrder || 0));
    const currentIndex = sortedElements.findIndex(el => el.id === element.id);
    return {
      current: currentIndex + 1,
      total: elements.length,
      isFirst: currentIndex === 0,
      isLast: currentIndex === elements.length - 1
    };
  };

  const layerInfo = getCurrentLayerInfo();
  return (
    <div className="space-y-4">
      {/* Position */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Position</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="x" className="text-xs text-gray-500">X Position</Label>
            <Input
              id="x"
              type="number"
              value={element.position.x}
              onChange={(e) => onPositionChange('x', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="y" className="text-xs text-gray-500">Y Position</Label>
            <Input
              id="y"
              type="number"
              value={element.position.y}
              onChange={(e) => onPositionChange('y', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Size</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="width" className="text-xs text-gray-500">Width</Label>
            <Input
              id="width"
              type="number"
              value={element.size.width}
              onChange={(e) => onSizeChange('width', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="height" className="text-xs text-gray-500">Height</Label>
            <Input
              id="height"
              type="number"
              value={element.size.height}
              onChange={(e) => onSizeChange('height', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Link className="w-4 h-4 mr-1" />
            Lock Ratio
          </Button>
          <Button variant="outline" size="sm">
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
                                    <FlipHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced Layer Management */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Layer Management</Label>
        
        {/* Layer Position Info */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Position:</span>
            <span className="font-medium">{layerInfo.current} of {layerInfo.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(layerInfo.current / layerInfo.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Layer Order Input */}
        <div className="flex items-center space-x-2 mb-3">
          <Label className="text-xs text-gray-500 w-12">Order:</Label>
          <Input
            type="number"
            value={element.layerOrder || 0}
            onChange={(e) => handleLayerOrderChange(parseInt(e.target.value) || 0)}
            className="flex-1 h-8"
            min={0}
          />
        </div>

        {/* Quick Layer Actions */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={moveToFront}
            className="text-xs"
          >
            <Layers className="w-3 h-3 mr-1" />
            To Front
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={moveToBack}
            className="text-xs"
          >
            <Layers className="w-3 h-3 mr-1" />
            To Back
          </Button>
        </div>

        {/* Step Layer Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={moveForward}
            disabled={layerInfo.isLast}
            className="text-xs"
          >
            <ChevronDown className="w-3 h-3 mr-1 rotate-180" />
            Forward
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={moveBackward}
            disabled={layerInfo.isFirst}
            className="text-xs"
          >
            <ChevronDown className="w-3 h-3 mr-1" />
            Backward
          </Button>
        </div>
      </div>

      {/* Quick Layout Actions */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <Label className="text-sm font-medium mb-2 block">Quick Actions</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm">Center H</Button>
          <Button variant="outline" size="sm">Center V</Button>
          <Button variant="outline" size="sm">Align Left</Button>
          <Button variant="outline" size="sm">Align Right</Button>
        </div>
      </div>
    </div>
  );
}

function EffectProperties({ 
  element, 
  onUpdate, 
  onOpacityChange 
}: { 
  element: ContentElement; 
  onUpdate: (elementId: string, updates: Partial<ContentElement>) => void;
  onOpacityChange: (value: number[]) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Opacity */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Opacity</Label>
        <Slider
          value={[element.opacity || 1]}
          onValueChange={onOpacityChange}
          max={1}
          min={0}
          step={0.1}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>{Math.round((element.opacity || 1) * 100)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Animations */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Animations</Label>
        <div className="space-y-2">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Add animation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fadeIn">Fade In</SelectItem>
              <SelectItem value="slideIn">Slide In</SelectItem>
              <SelectItem value="zoomIn">Zoom In</SelectItem>
              <SelectItem value="bounceIn">Bounce In</SelectItem>
              <SelectItem value="rotateIn">Rotate In</SelectItem>
            </SelectContent>
          </Select>
          
          {element.animations && element.animations.length > 0 && (
            <div className="space-y-2">
              {element.animations.map((animation, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm capitalize">{animation.type}</span>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Filters</Label>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Blur</Label>
            <Slider
              value={[0]}
              max={10}
              min={0}
              step={0.5}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-xs text-gray-500">Brightness</Label>
            <Slider
              value={[100]}
              max={200}
              min={0}
              step={10}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-xs text-gray-500">Contrast</Label>
            <Slider
              value={[100]}
              max={200}
              min={0}
              step={10}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Hover Effects */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <Label className="text-sm font-medium mb-2 block">Hover Effects</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch />
            <Label className="text-sm">Scale on Hover</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch />
            <Label className="text-sm">Glow Effect</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch />
            <Label className="text-sm">Color Change</Label>
          </div>
        </div>
      </div>
    </div>
  );
} 