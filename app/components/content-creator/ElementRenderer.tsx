'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ContentElement } from '../../store/contentStore';
import { getCorsImageUrl } from '../../utils/imageProxy';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Image as ImageIcon,
  FileText,
  Square,
  Circle,
  Triangle,
  BarChart3,
  Clock,
  Cloud,
  Sparkles,
  QrCode,
  MousePointer,
  Minimize2,
  Maximize2,
  Calendar,
  MapPin,
  Mail,
  Phone,
  TrendingUp,
  BarChart,
  PieChart,
  Users
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';

// Helper function to generate animation classes
function getAnimationClasses(animations: Array<{
  type: string;
  duration?: number;
  delay?: number;
  trigger?: string;
  direction?: string;
  intensity?: number;
}>): string {
  if (!animations.length) return '';
  
  const classes: string[] = [];
  
  animations.forEach(animation => {
    switch (animation.type) {
      case 'fadeIn':
        classes.push('animate-fade-in');
        break;
      case 'fadeOut':
        classes.push('animate-fade-out');
        break;
      case 'slideIn':
        classes.push(`animate-slide-in-${animation.direction || 'left'}`);
        break;
      case 'slideOut':
        classes.push(`animate-slide-out-${animation.direction || 'right'}`);
        break;
      case 'zoomIn':
        classes.push('animate-zoom-in');
        break;
      case 'zoomOut':
        classes.push('animate-zoom-out');
        break;
      case 'bounce':
        classes.push('animate-bounce');
        break;
      case 'pulse':
        classes.push('animate-pulse');
        break;
      case 'shake':
        classes.push('animate-shake');
        break;
      case 'flip':
        classes.push('animate-flip');
        break;
      default:
        break;
    }
  });
  
  return classes.join(' ');
}

interface ElementRendererProps {
  element: ContentElement;
  isPreview?: boolean;
  contextData?: Record<string, any>;
}

export function ElementRenderer({ element, isPreview = false, contextData = {} }: ElementRendererProps) {
  // Apply animations if specified
  const animationClasses = getAnimationClasses(element.animations || []);
  
  const renderElement = () => {
    // Check for custom element type first
    const customType = element.properties?.customElementType;
    
    if (customType) {
      switch (customType) {
        // Text Elements
        case 'text':
        case 'gradient_text':
        case 'shadow_text':
        case 'outline_text':
          return <TextElement element={element} contextData={contextData} />;
        
        // Media Elements
        case 'standard_photo':
          return <StandardPhotoElement element={element} />;
        case 'sales_rep_photo':
          return <StandardPhotoElement element={element} />;
        case 'video_player':
          return <VideoPlayerElement element={element} />;
        
        // Form Elements
        case 'contact_form':
          return <ContactFormElement element={element} />;
        case 'survey_form':
          return <SurveyFormElement element={element} />;
        
        // Animation Elements
        case 'snow_animation':
          return <SnowAnimationElement element={element} />;
        case 'fireworks':
          return <FireworksElement element={element} />;
        case 'matrix_rain':
          return <MatrixRainElement element={element} />;
        case 'starfield':
          return <StarfieldElement element={element} />;
        case 'ocean_waves':
          return <OceanWavesElement element={element} />;
        case 'geometric_pulse':
          return <GeometricPulseElement element={element} />;
        case 'aurora_borealis':
          return <AuroraBorealisElement element={element} />;
        case 'bubble_float':
          return <BubbleFloatElement element={element} />;
        case 'lightning_storm':
          return <LightningStormElement element={element} />;
        case 'floating_hearts':
          return <FloatingHeartsElement element={element} />;
        case 'falling_leaves':
          return <FallingLeavesElement element={element} />;
        case 'neon_pulse':
          return <NeonPulseElement element={element} />;
        case 'raining_money':
          return <RainingMoneyElement element={element} />;
        case 'solar_flare':
          return <SolarFlareElement element={element} />;
        case 'rainbow_tunnel':
          return <RainbowTunnelElement element={element} />;
        case 'floating_balloons':
          return <FloatingBalloonsElement element={element} />;
        case 'pixel_sparks':
          return <PixelSparksElement element={element} />;
        case 'butterfly_swarm':
          return <ButterflySwarmElement element={element} />;
        
        // All other custom elements fall back to placeholders for now
        default:
          return (
            <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-sm font-medium capitalize">{customType.replace(/_/g, ' ')}</div>
                <div className="text-xs">Coming Soon</div>
              </div>
            </div>
          );
      }
    }
    
    // Fallback to standard element types
    switch (element.elementType) {
      case 'text':
        return <TextElement element={element} contextData={contextData} />;
      case 'image':
        return <ImageElement element={element} />;
      case 'video':
        return <VideoElement element={element} />;
      case 'standard_photo':
        return <StandardPhotoElement element={element} />;
      case 'animation':
        // Handle animation elements that are actually text elements
        if (element.properties && 'text' in element.properties) {
          return <TextElement element={element} contextData={contextData} />;
        }
        // For other animation elements without specific implementations
        return (
          <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-sm font-medium">Animation Element</div>
              <div className="text-xs">Coming Soon</div>
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-sm font-medium capitalize">{element.elementType}</div>
              <div className="text-xs">Element type not implemented</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`w-full h-full ${animationClasses}`}
      style={{
        opacity: element.opacity || 1,
        visibility: element.isVisible !== false ? 'visible' : 'hidden',
        ...element.styles
      }}
    >
      {renderElement()}
    </div>
  );
}

function TextElement({ element, contextData }: { element: ContentElement; contextData: Record<string, any> }) {
  const processText = useCallback((text: string) => {
    // Enhanced variable processing with context data
    return text.replace(/\{([^}]+)\}/g, (match, variable) => {
      // First check context data
      const contextValue = getNestedValue(contextData, variable);
      if (contextValue !== undefined) {
        return formatValue(contextValue, variable);
      }
      
      // Fallback to placeholder values
      const placeholder = getVariablePlaceholder(variable);
      return `[${placeholder}]`;
    });
  }, [contextData]);

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const formatValue = (value: any, variable: string) => {
    // Apply formatting based on variable type
    if (variable.includes('date')) {
      return new Date(value).toLocaleDateString();
    }
    if (variable.includes('time')) {
      return new Date(value).toLocaleTimeString();
    }
    if (variable.includes('phone')) {
      return formatPhoneNumber(value);
    }
    if (variable.includes('currency') || variable.includes('price') || variable === 'dealAmount') {
      return formatCurrency(value);
    }
    return String(value);
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getVariablePlaceholder = (variable: string) => {
    const placeholders: Record<string, string> = {
      'lead.name': 'John Doe',
      'lead.firstName': 'John',
      'lead.lastName': 'Doe',
      'lead.phone': '(555) 123-4567',
      'lead.email': 'john@example.com',
      'lead.company': 'ACME Corp',
      'dealAmount': '$25,000.00',
      'repName': 'Sarah Johnson',
      'repEmail': 'sarah.johnson@company.com',
      'current.date': new Date().toLocaleDateString(),
      'current.time': new Date().toLocaleTimeString(),
      'current.datetime': new Date().toLocaleString(),
      'company.name': 'Your Company',
      'company.phone': '(555) 000-0000',
      'company.address': '123 Main St, City, State',
      'call.status': 'Connected',
      'call.duration': '02:45',
      'system.version': 'v2.1.0',
      'tenant.name': 'Organization Name'
    };
    return placeholders[variable] || variable;
  };

  const textStyle = {
    textAlign: element.properties.textAlign || 'left',
    fontSize: element.styles?.fontSize || '16px',
    fontWeight: element.styles?.fontWeight || 'normal',
    color: element.styles?.color || '#000000',
    fontFamily: element.styles?.fontFamily || 'Inter, sans-serif',
    lineHeight: element.styles?.lineHeight || '1.4',
    letterSpacing: element.styles?.letterSpacing || 'normal',
    textDecoration: element.styles?.textDecoration || 'none',
    textTransform: element.styles?.textTransform || 'none',
    textShadow: element.styles?.textShadow,
    background: element.styles?.background,
    backgroundClip: element.styles?.backgroundClip,
    WebkitBackgroundClip: element.styles?.backgroundClip,
    WebkitTextFillColor: element.styles?.textFillColor,
    ...element.styles
  };

  return (
    <div
      className="w-full h-full flex items-center justify-start overflow-hidden"
      style={textStyle}
    >
      <div className="w-full break-words">
        {processText(element.properties.text || 'Your text here - click to edit')}
      </div>
    </div>
  );
}

function ImageElement({ element }: { element: ContentElement }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Debug: Log when image src changes
  useEffect(() => {
    console.log('ImageElement re-rendered with src:', element.properties?.src);
  }, [element.properties?.src]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
  };

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
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          // TODO: In a real implementation, this would upload the file and get a URL
          // For now, we'll use the data URL directly
          console.log('Image dropped:', imageFile.name);
          // This would need to be connected to the element update system
          // updateElement({ ...element, properties: { ...element.properties, src: result } });
        }
      };
      reader.readAsDataURL(imageFile);
    }
  };

  // Frame styles based on frame type
  const getFrameStyle = () => {
    const frameType = element.properties?.frame || 'none';
    const frameColor = element.properties?.frameColor || '#000000';
    const frameWidth = element.properties?.frameWidth || 8;
    
    const frameStyles: Record<string, any> = {
      none: {},
      classic: {
        border: `${frameWidth}px solid ${frameColor}`,
        borderRadius: '2px',
        boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.15)'
      },
      modern: {
        border: `${frameWidth}px solid ${frameColor}`,
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      },
      vintage: {
        border: `${frameWidth}px solid ${frameColor}`,
        borderRadius: '4px',
        boxShadow: 'inset 0 0 0 4px #8B4513, inset 0 0 0 8px #DAA520, 0 4px 12px rgba(0,0,0,0.25)',
        background: 'linear-gradient(45deg, #8B4513, #DAA520)'
      },
      polaroid: {
        backgroundColor: '#ffffff',
        padding: `${frameWidth * 2}px ${frameWidth * 2}px ${frameWidth * 4}px ${frameWidth * 2}px`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.1)',
        transform: 'rotate(-1deg)'
      },
      ornate: {
        border: `${frameWidth}px solid ${frameColor}`,
        borderRadius: '12px',
        background: `linear-gradient(45deg, ${frameColor}, ${frameColor}dd)`,
        padding: `${frameWidth}px`,
        boxShadow: 'inset 0 0 0 2px #FFD700, inset 0 0 0 4px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.2)'
      },
      shadow: {
        borderRadius: element.styles?.borderRadius || '8px',
        boxShadow: `0 ${frameWidth}px ${frameWidth * 2}px rgba(0,0,0,0.25), 0 ${frameWidth * 2}px ${frameWidth * 4}px rgba(0,0,0,0.15)`
      },
      floating: {
        borderRadius: element.styles?.borderRadius || '12px',
        boxShadow: `0 ${frameWidth * 2}px ${frameWidth * 6}px rgba(0,0,0,0.1), 0 ${frameWidth}px ${frameWidth * 3}px rgba(0,0,0,0.08)`,
        transform: 'translateY(-2px)'
      }
    };
    
    return frameStyles[frameType] || {};
  };

  const imageStyle = {
    objectFit: element.styles?.objectFit || 'cover',
    objectPosition: element.styles?.objectPosition || 'center',
    filter: element.styles?.filter,
    borderRadius: element.properties?.frame === 'polaroid' ? '0' : (element.styles?.borderRadius || '0'),
    transition: element.styles?.transition || 'all 0.3s ease',
    width: '100%',
    height: '100%',
    ...element.styles
  };

  const containerStyle = {
    ...getFrameStyle(),
    borderRadius: element.properties?.frame === 'polaroid' ? '2px' : 
                  element.properties?.frame === 'none' ? (element.styles?.borderRadius || '0') : undefined
  };

  // Check if URL is provided and valid
  const hasValidUrl = element.properties?.src && 
    (element.properties.src.startsWith('http://') || 
     element.properties.src.startsWith('https://') || 
     element.properties.src.startsWith('data:') ||
     element.properties.src.startsWith('blob:'));

  // Debug: Log validation
  console.log('Image validation - src:', element.properties?.src, 'hasValidUrl:', hasValidUrl);

  // Get CORS-free URL for the image
  const corsImageUrl = hasValidUrl ? getCorsImageUrl(element.properties.src) : '';

  return (
    <div 
      className={`w-full h-full relative overflow-hidden transition-all duration-200 ${
        isDragOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''
      }`} 
      style={containerStyle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {hasValidUrl ? (
        <>
          <img
            src={corsImageUrl}
            alt={element.properties.alt || 'Image'}
            className={`transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={imageStyle}
            onLoad={handleImageLoad}
            onError={() => setImageError(true)}
            loading="lazy"
            crossOrigin={corsImageUrl.startsWith('/api/proxy/image') ? undefined : 'anonymous'}
          />
          
          {/* Loading state */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                <div className="text-xs text-gray-500">Loading image...</div>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {imageError && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500">
                <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Failed to load image</p>
                <p className="text-xs opacity-75 mt-1 break-all max-w-full">
                  {element.properties.src.length > 50 
                    ? `${element.properties.src.substring(0, 50)}...` 
                    : element.properties.src}
                </p>
              </div>
            </div>
          )}
          
          {/* Image info overlay for editor */}
          {imageDimensions && imageLoaded && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity z-10">
              {imageDimensions.width} × {imageDimensions.height}
            </div>
          )}

          {/* Frame label for editor */}
          {element.properties?.frame && element.properties.frame !== 'none' && (
            <div className="absolute bottom-2 left-2 bg-blue-600 bg-opacity-90 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity z-10">
              {element.properties.frame.charAt(0).toUpperCase() + element.properties.frame.slice(1)} Frame
            </div>
          )}
        </>
      ) : (
        <div className={`w-full h-full border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
          isDragOver 
            ? 'bg-blue-50 border-blue-400 border-solid' 
            : 'bg-gray-100 border-gray-300 hover:bg-gray-50'
        }`}>
          <div className="text-center text-gray-500">
            <ImageIcon className={`w-8 h-8 mx-auto mb-2 transition-colors ${
              isDragOver ? 'text-blue-500' : 'text-gray-400'
            }`} />
            <p className={`text-sm transition-colors ${
              isDragOver ? 'text-blue-600 font-medium' : 'text-gray-600'
            }`}>
              {isDragOver ? 'Drop image here' : 'Add image URL or upload'}
            </p>
            <p className="text-xs opacity-75 mt-1">
              {isDragOver ? 'Release to upload' : 'Paste URL or drag & drop image'}
            </p>
            {element.properties?.frame && element.properties.frame !== 'none' && (
              <p className="text-xs text-blue-600 mt-2 font-medium">
                {element.properties.frame.charAt(0).toUpperCase() + element.properties.frame.slice(1)} frame ready
              </p>
      )}
    </div>
      </div>
      )}
    </div>
  );
}

function StandardPhotoElement({ element }: { element: ContentElement }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Extract properties from element with defaults
  const {
    imageUrl = '',
    alt = 'Standard Photo',
    objectFit = 'cover',
    objectPosition = 'center',
    loading = 'lazy',
    crossOrigin = 'anonymous',
    showPlaceholder = true,
    placeholderText = 'Enter image URL...',
    placeholderColor = '#f3f4f6',
    errorFallback = true,
    errorText = 'Image failed to load',
    errorColor = '#ef4444',
    showLoadingState = true,
    loadingText = 'Loading image...',
    loadingColor = '#6b7280',
    loadingTimeout: timeoutDuration = 10000
  } = element.properties || {};

  // Reset states when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      setImageError(false);
      setLoadingTimeout(false);
    }
  }, [imageUrl]);

  // Loading timeout
  useEffect(() => {
    if (imageUrl && !imageLoaded && !imageError) {
      const timer = setTimeout(() => {
        if (!imageLoaded) {
          setLoadingTimeout(true);
        }
      }, timeoutDuration);

      return () => clearTimeout(timer);
    }
  }, [imageUrl, imageLoaded, imageError, timeoutDuration]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ 
      width: img.naturalWidth, 
      height: img.naturalHeight 
    });
    setImageLoaded(true);
    setImageError(false);
    setLoadingTimeout(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    setLoadingTimeout(false);
  };

  // Validate URL format
  const hasValidUrl = imageUrl && 
    (imageUrl.startsWith('http://') || 
     imageUrl.startsWith('https://') || 
     imageUrl.startsWith('data:') ||
     imageUrl.startsWith('blob:'));

  const imageStyle = {
    objectFit: objectFit as any,
    objectPosition: objectPosition,
    width: '100%',
    height: '100%',
    display: 'block',
    transition: 'opacity 0.3s ease',
    opacity: imageLoaded ? 1 : 0,
    ...element.styles
  };

  const containerStyle = {
    width: '100%',
    height: '100%',
    position: 'relative' as const,
    overflow: 'hidden',
    backgroundColor: element.styles?.backgroundColor || '#f9fafb',
    borderRadius: element.styles?.borderRadius || '8px',
    border: element.styles?.border || '1px solid #e5e7eb',
    ...element.styles
  };

  // Show placeholder when no URL is provided
  if (!hasValidUrl && showPlaceholder) {
  return (
    <div 
        className="w-full h-full flex items-center justify-center border-2 border-dashed transition-colors hover:bg-gray-50"
              style={{
          backgroundColor: placeholderColor,
          borderColor: '#d1d5db',
          borderRadius: element.styles?.borderRadius || '8px'
        }}
      >
      <div className="text-center text-gray-500">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">{placeholderText}</p>
          <p className="text-xs opacity-75 mt-1">
            Paste URL or use properties panel
          </p>
      </div>
    </div>
  );
}

  // Show error state
  if (imageError && errorFallback) {
  return (
    <div 
        className="w-full h-full flex items-center justify-center border-2 border-dashed"
      style={{
          ...containerStyle,
          backgroundColor: '#fef2f2',
          borderColor: errorColor,
          color: errorColor
        }}
      >
        <div className="text-center">
          <ImageIcon className="w-8 h-8 mx-auto mb-2" style={{ color: errorColor }} />
          <p className="text-sm font-medium">{errorText}</p>
          <p className="text-xs opacity-75 mt-1 break-all max-w-full px-2">
            {imageUrl.length > 50 
              ? `${imageUrl.substring(0, 50)}...` 
              : imageUrl}
          </p>
          <button 
            className="text-xs mt-2 px-2 py-1 bg-red-100 hover:bg-red-200 rounded transition-colors"
            onClick={() => {
              setImageError(false);
              setImageLoaded(false);
              // Force reload by changing src
              const img = document.querySelector(`img[src="${imageUrl}"]`) as HTMLImageElement;
              if (img) {
                img.src = '';
                img.src = imageUrl;
              }
            }}
          >
            Retry
          </button>
    </div>
    </div>
  );
}

  // Get CORS-free URL for the image
  const corsImageUrl = hasValidUrl ? getCorsImageUrl(imageUrl) : '';

  return (
    <div style={containerStyle}>
      {hasValidUrl && (
        <>
          <img
            src={corsImageUrl}
            alt={alt}
            style={imageStyle}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading={loading as any}
            crossOrigin={corsImageUrl.startsWith('/api/proxy/image') ? undefined : (crossOrigin === 'null' ? undefined : crossOrigin as any)}
          />
          
          {/* Loading state */}
          {showLoadingState && !imageLoaded && !imageError && !loadingTimeout && (
            <div 
              className="absolute inset-0 flex items-center justify-center animate-pulse"
              style={{ backgroundColor: '#f9fafb' }}
            >
              <div className="text-center">
                <div 
                  className="w-8 h-8 mx-auto mb-2 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: loadingColor, borderTopColor: 'transparent' }}
                />
                <div 
                  className="text-xs font-medium"
                  style={{ color: loadingColor }}
                >
                  {loadingText}
        </div>
      </div>
    </div>
          )}

          {/* Timeout state */}
          {loadingTimeout && !imageLoaded && !imageError && (
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: '#fef3cd' }}
            >
              <div className="text-center text-yellow-800">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Loading timeout</p>
                <p className="text-xs opacity-75 mt-1">Image took too long to load</p>
                <button 
                  className="text-xs mt-2 px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded transition-colors"
                  onClick={() => {
                    setLoadingTimeout(false);
                    setImageError(false);
                    setImageLoaded(false);
                    // Force reload
                    const img = document.querySelector(`img[src="${imageUrl}"]`) as HTMLImageElement;
                    if (img) {
                      img.src = '';
                      img.src = imageUrl;
                    }
                  }}
                >
                  Retry
                </button>
        </div>
        </div>
          )}

          {/* Image info overlay for editor (only show when loaded) */}
          {imageDimensions && imageLoaded && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity z-10">
              {imageDimensions.width} × {imageDimensions.height}
      </div>
          )}
        </>
      )}
    </div>
  );
}

// Form Elements
function ContactFormElement({ element }: { element: ContentElement }) {
  return (
    <div className="w-full h-full bg-white rounded-lg p-4 border">
      <h3 className="text-lg font-medium mb-4">Contact Form</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <div className="w-full h-8 bg-gray-100 rounded border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="w-full h-8 bg-gray-100 rounded border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <div className="w-full h-16 bg-gray-100 rounded border" />
        </div>
        <div className="w-full h-8 bg-blue-500 rounded text-center text-white text-sm leading-8">
          Send Message
        </div>
      </div>
    </div>
  );
}

function SurveyFormElement({ element }: { element: ContentElement }) {
  return (
    <div className="w-full h-full bg-white rounded-lg p-4 border">
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '33%' }} />
        </div>
        <p className="text-xs text-gray-600 mt-1">Step 1 of 3</p>
      </div>
      <h3 className="text-lg font-medium mb-4">Survey Question</h3>
      <div className="space-y-2">
        <div className="flex items-center">
          <div className="w-4 h-4 border border-gray-300 rounded mr-2" />
          <span className="text-sm">Option A</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 border border-gray-300 rounded mr-2" />
          <span className="text-sm">Option B</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 border border-gray-300 rounded mr-2" />
          <span className="text-sm">Option C</span>
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <div className="w-16 h-8 bg-gray-300 rounded text-center text-xs leading-8">Back</div>
        <div className="w-16 h-8 bg-blue-500 rounded text-center text-white text-xs leading-8">Next</div>
      </div>
    </div>
  );
}

function RainingMoneyElement({ element }: { element: ContentElement }) {
  const [bills, setBills] = useState<Array<{
    id: number;
    type: string;
    x: number;
    y: number;
    rotation: number;
    speed: number;
    swayOffset: number;
    swayDirection: number;
    rotationSpeed: number;
    size: number;
    opacity: number;
    zIndex: number;
    sparkleOffset: number;
  }>>([]);
  const [sparkles, setSparkles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    life: number;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const billIdCounter = useRef(0);
  const sparkleIdCounter = useRef(0);

  // Get properties with defaults
  const {
    billCount = 40,
    billTypes = ['$1', '$5', '$10', '$20', '$50', '$100'],
    fallSpeed = { min: 1.5, max: 4 },
    swayAmount = 80,
    rotationSpeed = { min: 0.5, max: 2.5 },
    billSize = { min: 70, max: 140 },
    continuous = true,
    duration = null,
    currency = 'USD',
    fadeOut = true,
    sparkleEffect = true,
    colors = {
      '$1': '#22c55e',
      '$5': '#f59e0b', 
      '$10': '#eab308',
      '$20': '#06b6d4',
      '$50': '#ec4899',
      '$100': '#10b981'
    }
  } = element.properties || {};

  // Enhanced bill type generation with weighted distribution
  const generateBillType = () => {
    const weights = {
      '$1': 0.05,
      '$5': 0.10,
      '$10': 0.15,
      '$20': 0.20,
      '$50': 0.25,
      '$100': 0.25
    };
    
    const random = Math.random();
    let cumulative = 0;
    
    for (const [type, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random <= cumulative && billTypes.includes(type)) {
        return type;
      }
    }
    
    return billTypes[Math.floor(Math.random() * billTypes.length)];
  };

  const createBill = () => {
    const containerWidth = containerRef.current?.offsetWidth || 800;
    const containerHeight = containerRef.current?.offsetHeight || 600;
    
    return {
      id: billIdCounter.current++,
      type: generateBillType(),
      x: Math.random() * (containerWidth + 200) - 100, // Start slightly outside viewport
      y: -100, // Start above viewport
      rotation: Math.random() * 360,
      speed: fallSpeed.min + Math.random() * (fallSpeed.max - fallSpeed.min),
      swayOffset: Math.random() * Math.PI * 2,
      swayDirection: Math.random() < 0.5 ? -1 : 1,
      rotationSpeed: (Math.random() < 0.5 ? -1 : 1) * (rotationSpeed.min + Math.random() * (rotationSpeed.max - rotationSpeed.min)),
      size: billSize.min + Math.random() * (billSize.max - billSize.min),
      opacity: 1,
      zIndex: Math.floor(Math.random() * 100),
      sparkleOffset: Math.random() * Math.PI * 2
    };
  };

  const createSparkle = (x: number, y: number) => {
    return {
      id: sparkleIdCounter.current++,
      x: x + (Math.random() - 0.5) * 50,
      y: y + (Math.random() - 0.5) * 50,
      size: 2 + Math.random() * 4,
      opacity: 0.8 + Math.random() * 0.2,
      life: 1.0
    };
  };

  // Initialize bills
  useEffect(() => {
    if (!isActive) return;

    const initialBills = [];
    for (let i = 0; i < billCount; i++) {
      const bill = createBill();
      // Spread initial bills throughout the viewport
      bill.y = Math.random() * (containerRef.current?.offsetHeight || 600) - 200;
      initialBills.push(bill);
    }
    setBills(initialBills);
  }, [billCount, isActive]);

  // Animation loop
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      const containerHeight = containerRef.current?.offsetHeight || 600;
      const containerWidth = containerRef.current?.offsetWidth || 800;
      const currentTime = Date.now() * 0.001;
      
      setBills(prevBills => {
        let updatedBills = prevBills.map(bill => {
          // Enhanced physics simulation
          const swayIntensity = Math.sin(currentTime * 0.5 + bill.swayOffset) * 0.3 + 0.7;
          const turbulence = Math.sin(currentTime * 2 + bill.sparkleOffset) * 0.1;
          const newY = bill.y + bill.speed;
          const swayX = bill.x + 
            Math.sin(currentTime * 0.8 + bill.swayOffset) * bill.swayDirection * (swayAmount / 100) * swayIntensity +
            Math.cos(currentTime * 1.2 + bill.sparkleOffset) * turbulence * 20;
          const newRotation = bill.rotation + bill.rotationSpeed;
          
          let newOpacity = bill.opacity;
          if (fadeOut && newY > containerHeight * 0.85) {
            newOpacity = Math.max(0, 1 - (newY - containerHeight * 0.85) / (containerHeight * 0.15));
          }

          return {
            ...bill,
            x: swayX,
            y: newY,
            rotation: newRotation,
            opacity: newOpacity
          };
        });

        // Remove bills that have fallen off screen
        updatedBills = updatedBills.filter(bill => bill.y < containerHeight + 150);

        // Add new bills if continuous and we need more
        if (continuous && updatedBills.length < billCount) {
          const billsToAdd = Math.min(3, billCount - updatedBills.length); // Add max 3 at a time for performance
          for (let i = 0; i < billsToAdd; i++) {
            updatedBills.push(createBill());
          }
        }

        return updatedBills;
      });

      // Update sparkles if enabled
      if (sparkleEffect) {
        setSparkles(prevSparkles => {
          let updatedSparkles = prevSparkles.map(sparkle => ({
            ...sparkle,
            y: sparkle.y + 0.5,
            opacity: sparkle.opacity * 0.98,
            life: sparkle.life * 0.95
          })).filter(sparkle => sparkle.life > 0.1);

          // Add new sparkles occasionally
          if (Math.random() < 0.1 && updatedSparkles.length < 20) {
            const randomBill = bills[Math.floor(Math.random() * bills.length)];
            if (randomBill) {
              updatedSparkles.push(createSparkle(randomBill.x, randomBill.y));
            }
          }

          return updatedSparkles;
        });
      }

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, billCount, continuous, swayAmount, fadeOut, sparkleEffect]);

  // Stop animation after duration if specified
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const getBillStyle = (bill: any) => {
    const baseColor = colors[bill.type] || '#22c55e';
    const denomination = parseInt(bill.type.replace('$', ''));
    
    return {
      left: `${bill.x}px`,
      top: `${bill.y}px`,
      transform: `rotate(${bill.rotation}deg)`,
      opacity: bill.opacity,
      width: `${bill.size}px`,
      height: `${bill.size * 0.43}px`,
      zIndex: bill.zIndex,
      background: `linear-gradient(135deg, 
        ${baseColor}ee 0%, 
        ${baseColor} 25%, 
        ${baseColor}cc 50%, 
        ${baseColor} 75%, 
        ${baseColor}dd 100%)`,
      border: `2px solid ${baseColor}aa`,
      borderRadius: '6px',
      boxShadow: `
        0 4px 12px rgba(0,0,0,0.25),
        inset 0 1px 0 rgba(255,255,255,0.3),
        inset 0 -1px 0 rgba(0,0,0,0.2)
      `,
      position: 'absolute' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column' as const,
      overflow: 'hidden'
    };
  };

  const getBillContent = (bill: any) => {
    const denomination = parseInt(bill.type.replace('$', ''));
    const fontSize = bill.size * 0.12;
    
    return (
      <>
        {/* Decorative patterns */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.1) 2px,
              rgba(255,255,255,0.1) 4px
            )`
          }}
        />
        
        {/* Corner ornaments */}
        <div className="absolute top-1 left-1 w-2 h-2 border border-white border-opacity-30 rounded-full" />
        <div className="absolute top-1 right-1 w-2 h-2 border border-white border-opacity-30 rounded-full" />
        <div className="absolute bottom-1 left-1 w-2 h-2 border border-white border-opacity-30 rounded-full" />
        <div className="absolute bottom-1 right-1 w-2 h-2 border border-white border-opacity-30 rounded-full" />
        
        {/* Main content */}
        <div className="relative z-10 text-center">
          <div 
            className="font-bold text-white drop-shadow-lg"
            style={{ 
              fontSize: `${fontSize}px`,
              textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)'
            }}
          >
            {bill.type}
          </div>
          {denomination >= 20 && (
            <div 
              className="text-white font-semibold opacity-80"
              style={{ 
                fontSize: `${fontSize * 0.6}px`,
                textShadow: '1px 1px 2px rgba(0,0,0,0.6)'
              }}
            >
              USD
            </div>
          )}
        </div>
        
        {/* Holographic effect */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `conic-gradient(
              from ${bill.rotation}deg,
              transparent 0deg,
              rgba(255,255,255,0.3) 90deg,
              transparent 180deg,
              rgba(255,255,255,0.2) 270deg,
              transparent 360deg
            )`
          }}
        />
      </>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden pointer-events-none relative"
      style={{
        ...element.styles,
        position: 'relative',
        background: element.styles?.background || 'transparent'
      }}
    >
      {/* Bills */}
      {bills.map(bill => (
        <div
          key={bill.id}
          className="absolute transition-none select-none"
          style={getBillStyle(bill)}
        >
          {getBillContent(bill)}
        </div>
      ))}
      
      {/* Sparkles */}
      {sparkleEffect && sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="absolute pointer-events-none"
          style={{
            left: `${sparkle.x}px`,
            top: `${sparkle.y}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            opacity: sparkle.opacity,
            background: 'radial-gradient(circle, #ffd700 0%, #ffed4e 50%, transparent 100%)',
            borderRadius: '50%',
            animation: 'twinkle 0.8s ease-in-out infinite alternate',
            zIndex: 1000
          }}
        />
      ))}
      
      {/* Enhanced control overlay for editor */}
      <div className="absolute top-3 right-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 hover:opacity-100 transition-all duration-300 z-[1001] backdrop-blur-sm border border-gray-600">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-400">💰</span>
          <span>{bills.length} bills</span>
          <span className="text-gray-400">•</span>
          <span className={`font-semibold ${isActive ? 'text-green-400' : 'text-red-400'}`}>
            {isActive ? 'Active' : 'Stopped'}
          </span>
        </div>
        {sparkleEffect && (
          <div className="text-yellow-300 text-[10px] mt-1">
            ✨ {sparkles.length} sparkles
          </div>
        )}
      </div>
      
      {/* Add twinkle animation styles */}
      <style jsx>{`
        @keyframes twinkle {
          0% { transform: scale(0.8) rotate(0deg); }
          100% { transform: scale(1.2) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}

// Solar Flare Animation Component
function SolarFlareElement({ element }: { element: ContentElement }) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    angle: number;
    distance: number;
    speed: number;
    size: number;
    opacity: number;
    color: string;
  }>>([]);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    flareIntensity = 0.8,
    rotationSpeed = 1.5,
    particleCount = 200,
    color = '#ff6600',
    loop = true
  } = element.properties || {};

  useEffect(() => {
    // Initialize particles
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      angle: (i / particleCount) * Math.PI * 2,
      distance: Math.random() * 300 + 50,
      speed: Math.random() * 2 + 1,
      size: Math.random() * 8 + 2,
      opacity: Math.random() * 0.8 + 0.2,
      color: `hsl(${Math.random() * 60 + 10}, 100%, ${Math.random() * 30 + 50}%)`
    }));
    setParticles(newParticles);
  }, [particleCount]);

  useEffect(() => {
    if (!loop) return;

    const animate = () => {
      setRotation(prev => prev + rotationSpeed);
      setParticles(prev => prev.map(particle => ({
        ...particle,
        distance: particle.distance + particle.speed * flareIntensity,
        opacity: particle.distance > 400 ? 0.1 : particle.opacity
      })));
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [flareIntensity, rotationSpeed, loop]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={element.styles}
    >
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: `rotate(${particle.angle}rad) translateX(${particle.distance}px)`,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              filter: 'blur(0.5px)'
            }}
          />
        ))}
      </div>
      
      {/* Central core */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: '60px',
          height: '60px',
          background: `radial-gradient(circle, ${color}, transparent)`,
          boxShadow: `0 0 100px ${color}`,
          animation: 'pulse 2s infinite'
        }}
      />
      
      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
        ☀️ Solar Flare • {particles.length} particles
      </div>
    </div>
  );
}

// Rainbow Tunnel Animation Component
function RainbowTunnelElement({ element }: { element: ContentElement }) {
  const [tunnelRings, setTunnelRings] = useState<Array<{
    id: number;
    radius: number;
    hue: number;
    opacity: number;
  }>>([]);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number>();

  const {
    tunnelDepth = 500,
    rotationSpeed = 2,
    colorCycleSpeed = 5,
    lineWidth = 4,
    perspective = 800
  } = element.properties || {};

  useEffect(() => {
    const rings = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      radius: i * 20 + 20,
      hue: (i * 20) % 360,
      opacity: Math.max(0.1, 1 - (i / 50))
    }));
    setTunnelRings(rings);
  }, []);

  useEffect(() => {
    const animate = () => {
      setRotation(prev => prev + rotationSpeed);
      setTunnelRings(prev => prev.map(ring => ({
        ...ring,
        hue: (ring.hue + colorCycleSpeed) % 360,
        radius: ring.radius > tunnelDepth ? 20 : ring.radius + 2
      })));
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [rotationSpeed, colorCycleSpeed, tunnelDepth]);

  return (
    <div 
      className="w-full h-full overflow-hidden relative flex items-center justify-center"
      style={{ ...element.styles, perspective: `${perspective}px` }}
    >
      <div 
        className="relative"
        style={{ transform: `rotateZ(${rotation}deg)` }}
      >
        {tunnelRings.map(ring => (
          <div
            key={ring.id}
            className="absolute rounded-full border-solid"
            style={{
              width: `${ring.radius}px`,
              height: `${ring.radius}px`,
              borderWidth: `${lineWidth}px`,
              borderColor: `hsl(${ring.hue}, 100%, 50%)`,
              opacity: ring.opacity,
              left: `${-ring.radius / 2}px`,
              top: `${-ring.radius / 2}px`,
              transform: `translateZ(${-ring.radius}px)`,
              boxShadow: `0 0 ${lineWidth * 2}px hsl(${ring.hue}, 100%, 50%)`
            }}
          />
        ))}
      </div>
      
      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
        🌈 Rainbow Tunnel • {tunnelRings.length} rings
      </div>
    </div>
  );
}

// Floating Balloons Animation Component
function FloatingBalloonsElement({ element }: { element: ContentElement }) {
  const [balloons, setBalloons] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    swayOffset: number;
    riseSpeed: number;
    swaySpeed: number;
  }>>([]);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    balloonCount = 25,
    riseSpeed = { min: 1, max: 3 },
    swayAmount = 40,
    colors = ['#ff0000', '#ffcc00', '#00ccff', '#66ff66'],
    popOnClick = false
  } = element.properties || {};

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const newBalloons = Array.from({ length: balloonCount }, (_, i) => ({
      id: i,
      x: Math.random() * container.clientWidth,
      y: container.clientHeight + Math.random() * 200,
      size: Math.random() * 40 + 30,
      color: colors[Math.floor(Math.random() * colors.length)],
      swayOffset: Math.random() * Math.PI * 2,
      riseSpeed: Math.random() * (riseSpeed.max - riseSpeed.min) + riseSpeed.min,
      swaySpeed: Math.random() * 0.02 + 0.01
    }));
    setBalloons(newBalloons);
  }, [balloonCount, colors, riseSpeed]);

  useEffect(() => {
    const animate = () => {
      setBalloons(prev => prev.map(balloon => {
        const newY = balloon.y - balloon.riseSpeed;
        const newSwayOffset = balloon.swayOffset + balloon.swaySpeed;
        const swayX = balloon.x + Math.sin(newSwayOffset) * swayAmount;
        
        return {
          ...balloon,
          y: newY < -100 ? (containerRef.current?.clientHeight || 600) + 100 : newY,
          x: swayX,
          swayOffset: newSwayOffset
        };
      }));
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [swayAmount]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={element.styles}
    >
      {balloons.map(balloon => (
        <div key={balloon.id} className="absolute">
          {/* Balloon */}
          <div
            className="rounded-full"
            style={{
              left: `${balloon.x}px`,
              top: `${balloon.y}px`,
              width: `${balloon.size}px`,
              height: `${balloon.size * 1.2}px`,
              backgroundColor: balloon.color,
              boxShadow: `inset -${balloon.size * 0.1}px -${balloon.size * 0.1}px ${balloon.size * 0.2}px rgba(0,0,0,0.2), 0 0 ${balloon.size * 0.3}px rgba(255,255,255,0.3)`,
              transform: 'translateX(-50%)'
            }}
          />
          {/* String */}
          <div
            className="absolute bg-gray-400"
            style={{
              left: `${balloon.x}px`,
              top: `${balloon.y + balloon.size * 1.2}px`,
              width: '1px',
              height: `${balloon.size * 0.8}px`,
              transform: 'translateX(-50%)'
            }}
          />
        </div>
      ))}
      
      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
        🎈 {balloons.length} balloons floating
      </div>
    </div>
  );
}

// Pixel Sparks Animation Component
function PixelSparksElement({ element }: { element: ContentElement }) {
  const [sparks, setSparks] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
  }>>([]);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    sparkCount = 150,
    decayRate = 0.9,
    gravity = 0.5,
    spread = 60,
    colors = ['#ffffff', '#ffe600', '#ff0080']
  } = element.properties || {};

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;
    
    const newSparks = Array.from({ length: sparkCount }, (_, i) => {
      const angle = (Math.random() - 0.5) * spread * (Math.PI / 180);
      const speed = Math.random() * 8 + 2;
      
      return {
        id: i,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 3,
        life: 255,
        maxLife: 255,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2
      };
    });
    setSparks(newSparks);
  }, [sparkCount, spread, colors]);

  useEffect(() => {
    const animate = () => {
      setSparks(prev => prev.map(spark => ({
        ...spark,
        x: spark.x + spark.vx,
        y: spark.y + spark.vy,
        vy: spark.vy + gravity,
        life: spark.life * decayRate
      })).filter(spark => spark.life > 1));
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gravity, decayRate]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={element.styles}
    >
      {sparks.map(spark => (
        <div
          key={spark.id}
          className="absolute"
          style={{
            left: `${spark.x}px`,
            top: `${spark.y}px`,
            width: `${spark.size}px`,
            height: `${spark.size}px`,
            backgroundColor: spark.color,
            opacity: spark.life / spark.maxLife,
            transform: 'translate(-50%, -50%)',
            imageRendering: 'pixelated'
          }}
        />
      ))}
      
      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
        ✨ {sparks.length} pixel sparks
      </div>
    </div>
  );
}

// Butterfly Swarm Animation Component
function ButterflySwarmElement({ element }: { element: ContentElement }) {
  const [butterflies, setButterflies] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    wingPhase: number;
    size: number;
    color: string;
    targetX: number;
    targetY: number;
  }>>([]);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    butterflyCount = 20,
    speedRange = { min: 1, max: 4 },
    sizeRange = { min: 30, max: 60 },
    wingFlapSpeed = 2,
    colors = ['#ff8a00', '#ff008a', '#00c0ff', '#8aff00']
  } = element.properties || {};

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const newButterflies = Array.from({ length: butterflyCount }, (_, i) => ({
      id: i,
      x: Math.random() * container.clientWidth,
      y: Math.random() * container.clientHeight,
      vx: 0,
      vy: 0,
      wingPhase: Math.random() * Math.PI * 2,
      size: Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min,
      color: colors[Math.floor(Math.random() * colors.length)],
      targetX: Math.random() * container.clientWidth,
      targetY: Math.random() * container.clientHeight
    }));
    setButterflies(newButterflies);
  }, [butterflyCount, sizeRange, colors]);

  useEffect(() => {
    const animate = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      
      setButterflies(prev => prev.map(butterfly => {
        // Update target occasionally
        let newTargetX = butterfly.targetX;
        let newTargetY = butterfly.targetY;
        
        if (Math.random() < 0.01) {
          newTargetX = Math.random() * container.clientWidth;
          newTargetY = Math.random() * container.clientHeight;
        }
        
        // Move towards target
        const dx = newTargetX - butterfly.x;
        const dy = newTargetY - butterfly.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const speed = Math.random() * (speedRange.max - speedRange.min) + speedRange.min;
        const newVx = distance > 0 ? (dx / distance) * speed : 0;
        const newVy = distance > 0 ? (dy / distance) * speed : 0;
        
        return {
          ...butterfly,
          x: Math.max(0, Math.min(container.clientWidth, butterfly.x + newVx)),
          y: Math.max(0, Math.min(container.clientHeight, butterfly.y + newVy)),
          vx: newVx,
          vy: newVy,
          wingPhase: butterfly.wingPhase + wingFlapSpeed * 0.1,
          targetX: newTargetX,
          targetY: newTargetY
        };
      }));
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speedRange, wingFlapSpeed]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={element.styles}
    >
      {butterflies.map(butterfly => (
        <div
          key={butterfly.id}
          className="absolute"
          style={{
            left: `${butterfly.x}px`,
            top: `${butterfly.y}px`,
            transform: 'translate(-50%, -50%)',
            fontSize: `${butterfly.size}px`,
            color: butterfly.color,
            filter: `hue-rotate(${Math.sin(butterfly.wingPhase) * 30}deg)`,
            animation: `flutter ${1 / wingFlapSpeed}s infinite ease-in-out`
          }}
        >
          🦋
        </div>
      ))}
      
      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
        🦋 {butterflies.length} butterflies
      </div>
    </div>
  );
}

// Video Element Component
function VideoElement({ element }: { element: ContentElement }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Extract properties with defaults
  const {
    src = '',
    autoplay = false,
    loop = false,
    muted = false,
    controls = true,
    poster = '',
    preload = 'metadata',
    playbackRate = 1,
    objectFit = 'contain'
  } = element.properties || {};

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
    if (isPlaying && controls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, controls]);

  // Video event handlers
  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
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
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    resetControlsTimeout();
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (!loop) {
      setCurrentTime(0);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setIsPlaying(false);
  };

  const handleVolumeChange = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
    }
  };

  // Control functions
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
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
      setVolume(newVolume);
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
      // Check file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (videoFile.size > maxSize) {
        alert('Video file is too large. Maximum size is 100MB.');
        return;
      }
      
      // Create a temporary blob URL for immediate preview
      const url = URL.createObjectURL(videoFile);
      
      // Show a toast notification
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.success(`Video "${videoFile.name}" dropped! Use the Properties panel to upload permanently.`);
      }
      
      // In a real implementation, you would call the update function here
      // For now, we'll just log it and show a message
      console.log('Video file dropped:', videoFile.name, url);
      
      // You can also trigger a custom event to notify the parent component
      const event = new CustomEvent('video-dropped', {
        detail: { file: videoFile, url }
      });
      window.dispatchEvent(event);
    } else {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Please drop a valid video file (MP4, WebM, OGV)');
      }
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasValidUrl || !containerRef.current?.contains(document.activeElement)) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(Math.min(duration, currentTime + 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeControl(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeControl(Math.max(0, volume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasValidUrl, currentTime, duration, volume]);

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
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const containerStyle = {
    borderRadius: element.styles?.borderRadius || '8px',
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative' as const,
    ...element.styles
  };

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
        }`}
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
          
          {/* Click to upload button */}
          <button
            className="mt-3 px-4 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            onClick={() => {
              // Trigger the file input in the properties panel
              const event = new CustomEvent('trigger-video-upload', {
                detail: { elementId: element.id }
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
      }`}
      style={containerStyle}
      onMouseMove={resetControlsTimeout}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying && controls) {
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
        style={videoStyle}
        onLoadStart={handleLoadStart}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
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
          <div className="mb-3">
            <div className="relative h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-150"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlayPause}
                className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <div className="flex items-center space-x-2 group">
                <button
                  onClick={toggleMute}
                  className="w-6 h-6 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
                >
                  {volume === 0 || videoRef.current?.muted ? 
                    <VolumeX className="w-4 h-4" /> : 
                    <Volume2 className="w-4 h-4" />
                  }
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={(e) => handleVolumeControl(parseFloat(e.target.value))}
                  className="w-16 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              </div>

              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleFullscreen}
                className="w-6 h-6 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Info Overlay for Editor */}
      {duration > 0 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity z-10">
          {formatTime(duration)} • {videoRef.current?.videoWidth}×{videoRef.current?.videoHeight}
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

      {/* Autoplay Muted Indicator */}
      {autoplay && isPlaying && videoRef.current?.muted && !muted && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
          <VolumeX className="w-3 h-3" />
          <span>Auto-muted for autoplay</span>
        </div>
      )}
    </div>
  );
} 

// Snow Animation Element
function SnowAnimationElement({ element }: { element: ContentElement }) {
  const [snowflakes, setSnowflakes] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    drift: number;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    snowflakeCount = 100,
    fallSpeed = { min: 1, max: 3 },
    snowflakeSize = { min: 5, max: 15 },
    windEffect = true,
    accumulation = false
  } = element.properties || {};

  useEffect(() => {
    if (!isActive) return;

    const initialSnowflakes = Array.from({ length: snowflakeCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -50,
      size: Math.random() * (snowflakeSize.max - snowflakeSize.min) + snowflakeSize.min,
      speed: Math.random() * (fallSpeed.max - fallSpeed.min) + fallSpeed.min,
      opacity: Math.random() * 0.6 + 0.4,
      drift: windEffect ? (Math.random() - 0.5) * 2 : 0,
    }));

    setSnowflakes(initialSnowflakes);

    const animate = () => {
      setSnowflakes(prev => prev.map(flake => {
        let newY = flake.y + flake.speed;
        let newX = flake.x + flake.drift * 0.5;

        if (newY > 100) {
          newY = -10;
          newX = Math.random() * 100;
        }

        if (newX > 100) newX = 0;
        if (newX < 0) newX = 100;

        return { ...flake, x: newX, y: newY };
      }));

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, snowflakeCount, fallSpeed, snowflakeSize, windEffect]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #87ceeb 0%, #f0f8ff 100%)', ...element.styles }}
    >
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: `${flake.x}%`,
            top: `${flake.y}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            boxShadow: '0 0 6px rgba(255,255,255,0.8)',
          }}
        />
      ))}
      
      {/* Snow overlay texture */}
      <div className="absolute inset-0 opacity-10 bg-noise pointer-events-none" />
    </div>
  );
}

// Fireworks Element
function FireworksElement({ element }: { element: ContentElement }) {
  const [fireworks, setFireworks] = useState<Array<{
    id: number;
    x: number;
    y: number;
    particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      life: number;
      decay: number;
    }>;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();
  const lastLaunchRef = useRef<number>(0);

  const {
    launchInterval = 1000,
    explosionSize = 100,
    colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
    soundEnabled = false,
    autoPlay = true,
    duration = 10000
  } = element.properties || {};

  useEffect(() => {
    if (!isActive || !autoPlay) return;

    const createFirework = () => {
      const x = Math.random() * 80 + 10; // Keep away from edges
      const y = Math.random() * 60 + 20;
      const particleCount = 30 + Math.random() * 20;
      const color = colors[Math.floor(Math.random() * colors.length)];

      const particles = Array.from({ length: particleCount }, () => ({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: Math.random() > 0.7 ? '#ffffff' : color,
        size: Math.random() * 4 + 2,
        life: 1,
        decay: Math.random() * 0.02 + 0.01,
      }));

      return {
        id: Date.now() + Math.random(),
        x,
        y,
        particles,
      };
    };

    const animate = (currentTime: number) => {
      // Launch new firework
      if (currentTime - lastLaunchRef.current > launchInterval) {
        setFireworks(prev => [...prev, createFirework()]);
        lastLaunchRef.current = currentTime;
      }

      // Update particles
      setFireworks(prev => prev.map(firework => ({
        ...firework,
        particles: firework.particles.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // gravity
          life: particle.life - particle.decay,
        })).filter(particle => particle.life > 0)
      })).filter(firework => firework.particles.length > 0));

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, autoPlay, launchInterval, colors]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black" style={element.styles}>
      {fireworks.map(firework => 
        firework.particles.map((particle, i) => (
          <div
            key={`${firework.id}-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.life,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        ))
      )}
    </div>
  );
}

// Matrix Rain Element
function MatrixRainElement({ element }: { element: ContentElement }) {
  const [columns, setColumns] = useState<Array<{
    id: number;
    x: number;
    characters: Array<{
      char: string;
      y: number;
      opacity: number;
      isLeading: boolean;
    }>;
    speed: number;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    dropSpeed = { min: 5, max: 15 },
    dropFrequency = 0.95,
    characters = '01',
    useKatakana = true,
    fontSize = 16,
    columnGap = 20,
    fadeLength = 8,
    glowEffect = true,
    color = '#00ff00'
  } = element.properties || {};

  const matrixChars = useKatakana 
    ? 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789'
    : characters;

  useEffect(() => {
    if (!containerRef.current || !isActive) return;

    const containerWidth = containerRef.current.offsetWidth;
    const numColumns = Math.floor(containerWidth / columnGap);

    const initialColumns = Array.from({ length: numColumns }, (_, i) => ({
      id: i,
      x: i * columnGap,
      characters: [],
      speed: Math.random() * (dropSpeed.max - dropSpeed.min) + dropSpeed.min,
    }));

    setColumns(initialColumns);

    const animate = () => {
      setColumns(prev => prev.map(column => {
        let newCharacters = [...column.characters];

        // Add new character at top
        if (Math.random() > dropFrequency) {
          newCharacters.unshift({
            char: matrixChars[Math.floor(Math.random() * matrixChars.length)],
            y: 0,
            opacity: 1,
            isLeading: true,
          });
        }

        // Update positions and opacity
        newCharacters = newCharacters.map((char, index) => ({
          ...char,
          y: char.y + column.speed,
          opacity: index === 0 ? 1 : Math.max(0, 1 - (index / fadeLength)),
          isLeading: index === 0,
        })).filter(char => char.y < containerRef.current!.offsetHeight + fontSize);

        return { ...column, characters: newCharacters };
      }));

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, dropSpeed, dropFrequency, matrixChars, fadeLength]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-black"
      style={{ fontFamily: 'monospace', fontSize: `${fontSize}px`, ...element.styles }}
    >
      {columns.map(column => 
        column.characters.map((char, i) => (
          <div
            key={`${column.id}-${i}`}
            className="absolute pointer-events-none"
            style={{
              left: `${column.x}px`,
              top: `${char.y}px`,
              color: char.isLeading ? '#ffffff' : color,
              opacity: char.opacity,
              textShadow: glowEffect ? `0 0 ${fontSize/2}px ${color}` : 'none',
              fontWeight: char.isLeading ? 'bold' : 'normal',
            }}
          >
            {char.char}
          </div>
        ))
      )}
    </div>
  );
}

// Starfield Element
function StarfieldElement({ element }: { element: ContentElement }) {
  const [stars, setStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    z: number;
    size: number;
    brightness: number;
    twinkle: number;
    color: string;
  }>>([]);
  const [shootingStars, setShootingStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    trail: Array<{ x: number; y: number; opacity: number }>;
    life: number;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();

  const {
    starCount = 200,
    starSpeed = { min: 0.5, max: 3 },
    starSize = { min: 1, max: 3 },
    twinkle = true,
    shootingStars: hasShootingStars = true,
    shootingStarFrequency = 0.01,
    direction = 'forward',
    colorVariation = true,
    baseColors = ['#ffffff', '#ffffd0', '#ffffe0', '#e0e0ff']
  } = element.properties || {};

  useEffect(() => {
    if (!isActive) return;

    const initialStars = Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 100,
      size: Math.random() * (starSize.max - starSize.min) + starSize.min,
      brightness: Math.random() * 0.5 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
      color: colorVariation ? baseColors[Math.floor(Math.random() * baseColors.length)] : '#ffffff',
    }));

    setStars(initialStars);

    const animate = () => {
      // Update stars
      setStars(prev => prev.map(star => {
        let newZ = direction === 'forward' ? star.z + starSpeed.min : star.z - starSpeed.min;
        let newX = star.x;
        let newY = star.y;

        if (newZ >= 100) {
          newZ = 0;
          newX = Math.random() * 100;
          newY = Math.random() * 100;
        } else if (newZ <= 0) {
          newZ = 100;
          newX = Math.random() * 100;
          newY = Math.random() * 100;
        }

        return {
          ...star,
          x: newX,
          y: newY,
          z: newZ,
          twinkle: star.twinkle + 0.1,
        };
      }));

      // Create shooting stars
      if (hasShootingStars && Math.random() < shootingStarFrequency) {
        const newShootingStar = {
          id: Date.now() + Math.random(),
          x: Math.random() * 100,
          y: Math.random() * 50,
          vx: Math.random() * 4 + 2,
          vy: Math.random() * 2 + 1,
          trail: [],
          life: 1,
        };
        setShootingStars(prev => [...prev, newShootingStar]);
      }

      // Update shooting stars
      setShootingStars(prev => prev.map(star => {
        const newTrail = [{ x: star.x, y: star.y, opacity: star.life }, ...star.trail.slice(0, 10)];
        return {
          ...star,
          x: star.x + star.vx,
          y: star.y + star.vy,
          trail: newTrail.map((point, i) => ({ ...point, opacity: point.opacity * (1 - i * 0.1) })),
          life: star.life - 0.02,
        };
      }).filter(star => star.life > 0 && star.x < 110 && star.y < 110));

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, starCount, starSpeed, hasShootingStars, direction]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black" style={element.styles}>
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size * (1 + star.z / 100)}px`,
            height: `${star.size * (1 + star.z / 100)}px`,
            backgroundColor: star.color,
            opacity: star.brightness * (twinkle ? (Math.sin(star.twinkle) * 0.3 + 0.7) : 1),
            boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
          }}
        />
      ))}
      
      {shootingStars.map(star => (
        <div key={star.id}>
          {star.trail.map((point, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                opacity: point.opacity,
                boxShadow: '0 0 4px #ffffff',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Ocean Waves Element
function OceanWavesElement({ element }: { element: ContentElement }) {
  const [waves, setWaves] = useState<Array<{
    id: number;
    amplitude: number;
    frequency: number;
    phase: number;
    speed: number;
    color: string;
  }>>([]);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);

  const {
    waveCount = 3,
    waveSpeed = 2,
    waveHeight = 100,
    waveComplexity = 3,
    foamEffect = true,
    reflections = true,
    particleSpray = true,
    colors = {
      deep: '#003366',
      shallow: '#0066cc',
      foam: '#ffffff'
    }
  } = element.properties || {};

  useEffect(() => {
    if (!isActive) return;

    const initialWaves = Array.from({ length: waveCount }, (_, i) => ({
      id: i,
      amplitude: waveHeight * (0.5 + Math.random() * 0.5),
      frequency: 0.02 + i * 0.005,
      phase: Math.random() * Math.PI * 2,
      speed: waveSpeed * (0.8 + Math.random() * 0.4),
      color: i === 0 ? colors.deep : i === 1 ? colors.shallow : colors.foam,
    }));

    setWaves(initialWaves);

    const animate = () => {
      timeRef.current += 0.016; // ~60fps

      // Update wave phases
      setWaves(prev => prev.map(wave => ({
        ...wave,
        phase: wave.phase + wave.speed * 0.01,
      })));

      // Create foam particles
      if (foamEffect && Math.random() < 0.3) {
        const newParticle = {
          id: Date.now() + Math.random(),
          x: Math.random() * 100,
          y: 60 + Math.random() * 20,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 3,
          life: 1,
          size: Math.random() * 6 + 2,
        };
        setParticles(prev => [...prev, newParticle]);
      }

      // Update particles
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.1, // gravity
        life: particle.life - 0.02,
      })).filter(particle => particle.life > 0 && particle.y < 100));

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
     }, [isActive, waveCount, waveSpeed, waveHeight, foamEffect, colors]);

  return (
    <div className="w-full h-full relative overflow-hidden" style={element.styles}>
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#87ceeb" />
            <stop offset="50%" stopColor={colors.shallow} />
            <stop offset="100%" stopColor={colors.deep} />
          </linearGradient>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#oceanGradient)" />
        
        {waves.map((wave, index) => {
          const pathData = Array.from({ length: 100 }, (_, i) => {
            const x = i;
            const y = 70 - wave.amplitude * 0.3 * Math.sin(wave.frequency * x + wave.phase) / 10;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ') + ' L 100 100 L 0 100 Z';

          return (
            <path
              key={wave.id}
              d={pathData}
              fill={wave.color}
              opacity={index === 0 ? 0.8 : 0.6 - index * 0.2}
              style={{
                filter: foamEffect && index === waveCount - 1 ? 'blur(1px)' : 'none',
              }}
            />
          );
        })}
      </svg>

      {/* Foam particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.life,
          }}
        />
      ))}
    </div>
  );
}

// Geometric Pulse Element
function GeometricPulseElement({ element }: { element: ContentElement }) {
  const [shapes, setShapes] = useState<Array<{
    id: number;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
    color: string;
    pulsePhase: number;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();

  const {
    shapeType = 'hexagon',
    gridSize = 50,
    pulseSpeed = 2,
    pulseDelay = 0.1,
    rotateShapes = true,
    colorShift = true,
    strokeWidth = 2,
    fillOpacity = 0.1,
    colors = ['#3b82f6', '#8b5cf6', '#ec4899']
  } = element.properties || {};

  useEffect(() => {
    if (!isActive) return;

    const cols = Math.ceil(100 / gridSize);
    const rows = Math.ceil(100 / gridSize);
    
    const initialShapes = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        initialShapes.push({
          id: row * cols + col,
          x: col * gridSize + gridSize / 2,
          y: row * gridSize + gridSize / 2,
          scale: 0.5,
          rotation: 0,
          opacity: 0.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          pulsePhase: (row + col) * pulseDelay,
        });
      }
    }

    setShapes(initialShapes);

    const animate = () => {
      setShapes(prev => prev.map(shape => {
        const pulse = Math.sin(Date.now() * 0.001 * pulseSpeed + shape.pulsePhase);
        const newScale = 0.3 + (pulse + 1) * 0.4;
        const newRotation = rotateShapes ? shape.rotation + 1 : 0;
        const colorIndex = colorShift ? 
          Math.floor((Date.now() * 0.001 + shape.pulsePhase) * 0.5) % colors.length :
          colors.indexOf(shape.color);

        return {
          ...shape,
          scale: newScale,
          rotation: newRotation,
          opacity: 0.3 + (pulse + 1) * 0.3,
          color: colorShift ? colors[colorIndex] : shape.color,
        };
      }));

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
     }, [isActive, gridSize, pulseSpeed, rotateShapes, colorShift, colors, pulseDelay]);

  const getShapePath = (type: string, size: number) => {
    switch (type) {
      case 'hexagon':
        const points = Array.from({ length: 6 }, (_, i) => {
          const angle = (i * Math.PI) / 3;
          const x = Math.cos(angle) * size;
          const y = Math.sin(angle) * size;
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ') + ' Z';
        return points;
      case 'triangle':
        return `M 0 ${-size} L ${size * 0.866} ${size * 0.5} L ${-size * 0.866} ${size * 0.5} Z`;
      case 'square':
        return `M ${-size} ${-size} L ${size} ${-size} L ${size} ${size} L ${-size} ${size} Z`;
      default:
        return `M 0 0 m ${-size} 0 a ${size} ${size} 0 1 0 ${size * 2} 0 a ${size} ${size} 0 1 0 ${-size * 2} 0`;
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black" style={element.styles}>
      <svg className="absolute inset-0 w-full h-full">
        {shapes.map(shape => (
          <g
            key={shape.id}
            transform={`translate(${shape.x}%, ${shape.y}%) scale(${shape.scale}) rotate(${shape.rotation})`}
          >
            <path
              d={getShapePath(shapeType, 15)}
              fill={shape.color}
              fillOpacity={fillOpacity}
              stroke={shape.color}
              strokeWidth={strokeWidth}
              opacity={shape.opacity}
              style={{
                filter: `drop-shadow(0 0 10px ${shape.color})`,
              }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

// Aurora Borealis Element
function AuroraBorealisElement({ element }: { element: ContentElement }) {
  const [waves, setWaves] = useState<Array<{
    id: number;
    amplitude: number;
    frequency: number;
    phase: number;
    speed: number;
    color: string;
    opacity: number;
    height: number;
  }>>([]);
  const [stars, setStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    twinkle: number;
    brightness: number;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();

  const {
    waveCount = 4,
    waveSpeed = 0.5,
    intensity = 0.7,
    shimmer = true,
    stars: showStars = true,
    colors = ['#00ff00', '#00ffff', '#ff00ff', '#ffff00'],
    blendMode = 'screen'
  } = element.properties || {};

  useEffect(() => {
    if (!isActive) return;

    const initialWaves = Array.from({ length: waveCount }, (_, i) => ({
      id: i,
      amplitude: 20 + Math.random() * 30,
      frequency: 0.01 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
      speed: waveSpeed * (0.5 + Math.random()),
      color: colors[i % colors.length],
      opacity: intensity * (0.3 + Math.random() * 0.4),
      height: 30 + i * 15,
    }));

    setWaves(initialWaves);

    if (showStars) {
      const initialStars = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 60,
        twinkle: Math.random() * Math.PI * 2,
        brightness: Math.random() * 0.8 + 0.2,
      }));
      setStars(initialStars);
    }

    const animate = () => {
      setWaves(prev => prev.map(wave => ({
        ...wave,
        phase: wave.phase + wave.speed * 0.02,
        opacity: shimmer ? 
          wave.opacity * (0.7 + 0.3 * Math.sin(Date.now() * 0.001 + wave.phase)) :
          wave.opacity,
      })));

      if (showStars) {
        setStars(prev => prev.map(star => ({
          ...star,
          twinkle: star.twinkle + 0.05,
        })));
      }

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
     }, [isActive, waveCount, waveSpeed, intensity, shimmer, showStars, colors, blendMode]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black" style={element.styles}>
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          {waves.map(wave => (
            <linearGradient key={`gradient-${wave.id}`} id={`aurora-gradient-${wave.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={wave.color} stopOpacity="0" />
              <stop offset="50%" stopColor={wave.color} stopOpacity={wave.opacity} />
              <stop offset="100%" stopColor={wave.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {waves.map(wave => {
          const pathData = Array.from({ length: 200 }, (_, i) => {
            const x = i * 0.5;
            const y1 = wave.height + wave.amplitude * Math.sin(wave.frequency * x + wave.phase);
            const y2 = y1 + 20 + Math.random() * 10;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y1}`;
          }).join(' ') + ` L 100 0 L 0 0 Z`;

          return (
            <path
              key={wave.id}
              d={pathData}
              fill={`url(#aurora-gradient-${wave.id})`}
              style={{ mixBlendMode: blendMode as any }}
            />
          );
        })}
      </svg>

      {/* Stars */}
      {showStars && stars.map(star => (
        <div
          key={star.id}
          className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            opacity: star.brightness * (0.5 + 0.5 * Math.sin(star.twinkle)),
            boxShadow: '0 0 2px #ffffff',
          }}
        />
      ))}
    </div>
  );
}

// Bubble Float Element
function BubbleFloatElement({ element }: { element: ContentElement }) {
  const [bubbles, setBubbles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    wobble: number;
    wobblePhase: number;
    opacity: number;
    shimmer: number;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();

  const {
    bubbleCount = 30,
    sizeRange = { min: 20, max: 80 },
    riseSpeed = { min: 1, max: 3 },
    wobbleAmount = 20,
    popOnClick = true,
    generateNew = true,
    opacity = 0.3,
    shimmer = true,
    colors = ['#ffffff', '#e0f2ff', '#c7e9ff']
  } = element.properties || {};

  useEffect(() => {
    if (!isActive) return;

    const initialBubbles = Array.from({ length: bubbleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 100 + Math.random() * 50,
      size: Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min,
      speed: Math.random() * (riseSpeed.max - riseSpeed.min) + riseSpeed.min,
      wobble: Math.random() * wobbleAmount,
      wobblePhase: Math.random() * Math.PI * 2,
      opacity: opacity * (0.5 + Math.random() * 0.5),
      shimmer: Math.random() * Math.PI * 2,
    }));

    setBubbles(initialBubbles);

    const animate = () => {
      setBubbles(prev => prev.map(bubble => {
        let newY = bubble.y - bubble.speed;
        let newX = bubble.x + Math.sin(bubble.wobblePhase) * bubble.wobble * 0.02;

        // Reset bubble when it reaches top
        if (newY < -bubble.size) {
          if (generateNew) {
            newY = 100 + Math.random() * 20;
            newX = Math.random() * 100;
          } else {
            return null;
          }
        }

        return {
          ...bubble,
          x: newX,
          y: newY,
          wobblePhase: bubble.wobblePhase + 0.05,
          shimmer: bubble.shimmer + 0.1,
        };
      }).filter(Boolean) as any);

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
     }, [isActive, bubbleCount, sizeRange, riseSpeed, wobbleAmount, generateNew, opacity, shimmer, colors]);

  const handleBubbleClick = (bubbleId: number) => {
    if (popOnClick) {
      setBubbles(prev => prev.filter(bubble => bubble.id !== bubbleId));
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden" style={element.styles}>
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute rounded-full pointer-events-auto cursor-pointer"
          style={{
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            background: shimmer ? 
              `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), ${colors[Math.floor(Math.random() * colors.length)]}, transparent)` :
              `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), ${colors[0]})`,
            opacity: bubble.opacity,
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 0 20px rgba(255,255,255,0.2)',
            transform: `scale(${1 + 0.1 * Math.sin(bubble.shimmer)})`,
          }}
          onClick={() => handleBubbleClick(bubble.id)}
        />
      ))}
    </div>
  );
}

// Lightning Storm Element
function LightningStormElement({ element }: { element: ContentElement }) {
  const [lightningBolts, setLightningBolts] = useState<Array<{
    id: number;
    segments: Array<{ x: number; y: number }>;
    opacity: number;
    life: number;
    branches: Array<{ x: number; y: number }>;
  }>>([]);
  const [flash, setFlash] = useState(false);
  const [rainDrops, setRainDrops] = useState<Array<{
    id: number;
    x: number;
    y: number;
    speed: number;
    length: number;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();
  const lastStrikeRef = useRef<number>(0);

  const {
    strikeFrequency = 3,
    branchComplexity = 4,
    glowIntensity = 2,
    thunderSound = false,
    rainEffect = true,
    flashDuration = 200,
    colors = {
      lightning: '#ffffff',
      glow: '#9999ff',
      sky: '#1a1a2e'
    }
  } = element.properties || {};

  const generateLightning = () => {
    const startX = Math.random() * 100;
    const startY = 0;
    const endX = startX + (Math.random() - 0.5) * 40;
    const endY = 100;

    const segments = [];
    const numSegments = 20;
    
    for (let i = 0; i <= numSegments; i++) {
      const progress = i / numSegments;
      const x = startX + (endX - startX) * progress + (Math.random() - 0.5) * 10;
      const y = startY + (endY - startY) * progress;
      segments.push({ x, y });
    }

    const branches = [];
    for (let i = 0; i < branchComplexity; i++) {
      const branchStart = segments[Math.floor(Math.random() * segments.length)];
      const branchLength = Math.random() * 30 + 10;
      const branchAngle = (Math.random() - 0.5) * Math.PI;
      
      branches.push({
        x: branchStart.x + Math.cos(branchAngle) * branchLength,
        y: branchStart.y + Math.sin(branchAngle) * branchLength,
      });
    }

    return {
      id: Date.now() + Math.random(),
      segments,
      opacity: 1,
      life: 1,
      branches,
    };
  };

  useEffect(() => {
    if (!isActive) return;

    if (rainEffect) {
      const initialRain = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: Math.random() * 3 + 2,
        length: Math.random() * 10 + 5,
      }));
      setRainDrops(initialRain);
    }

    const animate = (currentTime: number) => {
      // Generate lightning
      if (currentTime - lastStrikeRef.current > 1000 / strikeFrequency * 1000) {
        setLightningBolts(prev => [...prev, generateLightning()]);
        setFlash(true);
        setTimeout(() => setFlash(false), flashDuration);
        lastStrikeRef.current = currentTime;
      }

      // Update lightning
      setLightningBolts(prev => prev.map(bolt => ({
        ...bolt,
        opacity: bolt.opacity * 0.9,
        life: bolt.life - 0.05,
      })).filter(bolt => bolt.life > 0));

      // Update rain
      if (rainEffect) {
        setRainDrops(prev => prev.map(drop => ({
          ...drop,
          y: drop.y + drop.speed,
          x: drop.x + 0.5, // slight wind effect
        })).map(drop => drop.y > 100 ? { ...drop, y: -10, x: Math.random() * 100 } : drop));
      }

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
     }, [isActive, strikeFrequency, branchComplexity, rainEffect, flashDuration, colors]);

  return (
    <div 
      className={`w-full h-full relative overflow-hidden transition-all duration-200 ${
        flash ? 'bg-white' : ''
      }`} 
      style={{ backgroundColor: flash ? '#ffffff' : colors.sky, ...element.styles }}
    >
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="lightningGlow">
            <feGaussianBlur stdDeviation={glowIntensity} result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {lightningBolts.map(bolt => (
          <g key={bolt.id} opacity={bolt.opacity}>
            {/* Main bolt */}
            <polyline
              points={bolt.segments.map(seg => `${seg.x},${seg.y}`).join(' ')}
              fill="none"
              stroke={colors.lightning}
              strokeWidth="3"
              filter="url(#lightningGlow)"
            />
            <polyline
              points={bolt.segments.map(seg => `${seg.x},${seg.y}`).join(' ')}
              fill="none"
              stroke={colors.glow}
              strokeWidth="6"
              opacity="0.5"
            />
            
            {/* Branches */}
            {bolt.branches.map((branch, i) => (
              <line
                key={i}
                x1={bolt.segments[Math.floor(bolt.segments.length / 2)].x}
                y1={bolt.segments[Math.floor(bolt.segments.length / 2)].y}
                x2={branch.x}
                y2={branch.y}
                stroke={colors.lightning}
                strokeWidth="2"
                opacity="0.7"
                filter="url(#lightningGlow)"
              />
            ))}
          </g>
        ))}
      </svg>

      {/* Rain effect */}
      {rainEffect && rainDrops.map(drop => (
        <div
          key={drop.id}
          className="absolute bg-blue-200 opacity-30 pointer-events-none"
          style={{
            left: `${drop.x}%`,
            top: `${drop.y}%`,
            width: '1px',
            height: `${drop.length}px`,
            transform: 'rotate(15deg)',
          }}
        />
      ))}
    </div>
  );
}

// Floating Hearts Element
function FloatingHeartsElement({ element }: { element: ContentElement }) {
  const [hearts, setHearts] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    sway: number;
    swayPhase: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    pulse: number;
    color: string;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();

  const {
    heartCount = 20,
    sizeRange = { min: 20, max: 60 },
    floatSpeed = { min: 1, max: 3 },
    swayAmount = 30,
    rotationSpeed = 1,
    fadeInOut = true,
    pulseEffect = true,
    colors = ['#ff1744', '#ff4569', '#ff6b96', '#ff8fab']
  } = element.properties || {};

  useEffect(() => {
    if (!isActive) return;

    const initialHearts = Array.from({ length: heartCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 100 + Math.random() * 50,
      size: Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min,
      speed: Math.random() * (floatSpeed.max - floatSpeed.min) + floatSpeed.min,
      sway: Math.random() * swayAmount,
      swayPhase: Math.random() * Math.PI * 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * rotationSpeed * 2,
      opacity: fadeInOut ? 0 : 0.8,
      pulse: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setHearts(initialHearts);

    const animate = () => {
      setHearts(prev => prev.map(heart => {
        let newY = heart.y - heart.speed;
        let newX = heart.x + Math.sin(heart.swayPhase) * heart.sway * 0.02;
        let newOpacity = heart.opacity;

        // Reset heart when it reaches top
        if (newY < -heart.size) {
          newY = 100 + Math.random() * 20;
          newX = Math.random() * 100;
          newOpacity = fadeInOut ? 0 : 0.8;
        }

        // Fade in/out effect
        if (fadeInOut) {
          if (newY > 80) {
            newOpacity = Math.min(1, newOpacity + 0.02);
          } else if (newY < 20) {
            newOpacity = Math.max(0, newOpacity - 0.02);
          }
        }

        return {
          ...heart,
          x: newX,
          y: newY,
          opacity: newOpacity,
          swayPhase: heart.swayPhase + 0.05,
          rotation: heart.rotation + heart.rotationSpeed,
          pulse: heart.pulse + 0.1,
        };
      }));

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
     }, [isActive, heartCount, sizeRange, floatSpeed, swayAmount, fadeInOut, colors, rotationSpeed, pulseEffect]);

  return (
    <div className="w-full h-full relative overflow-hidden" style={element.styles}>
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute pointer-events-none"
          style={{
            left: `${heart.x}%`,
            top: `${heart.y}%`,
            width: `${heart.size}px`,
            height: `${heart.size}px`,
            opacity: heart.opacity,
            transform: `rotate(${heart.rotation}deg) scale(${pulseEffect ? 1 + 0.2 * Math.sin(heart.pulse) : 1})`,
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 24 24" fill={heart.color}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      ))}
    </div>
  );
}

// Falling Leaves Element
function FallingLeavesElement({ element }: { element: ContentElement }) {
  const [leaves, setLeaves] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    sway: number;
    swayPhase: number;
    rotation: number;
    rotationSpeed: number;
    leafType: string;
    color: string;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();

  const {
    leafCount = 30,
    leafTypes = ['maple', 'oak', 'birch'],
    fallSpeed = { min: 1, max: 3 },
    swayAmount = 50,
    rotationSpeed = { min: 0.5, max: 2 },
    sizeRange = { min: 30, max: 80 },
    colors = ['#ff6b35', '#f7931e', '#ff0000', '#8b0000', '#ffd700']
  } = element.properties || {};

  useEffect(() => {
    if (!isActive) return;

    const initialLeaves = Array.from({ length: leafCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -50,
      size: Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min,
      speed: Math.random() * (fallSpeed.max - fallSpeed.min) + fallSpeed.min,
      sway: Math.random() * swayAmount,
      swayPhase: Math.random() * Math.PI * 2,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * (rotationSpeed.max - rotationSpeed.min) + rotationSpeed.min,
      leafType: leafTypes[Math.floor(Math.random() * leafTypes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setLeaves(initialLeaves);

    const animate = () => {
      setLeaves(prev => prev.map(leaf => {
        let newY = leaf.y + leaf.speed;
        let newX = leaf.x + Math.sin(leaf.swayPhase) * leaf.sway * 0.02;

        // Reset leaf when it reaches bottom
        if (newY > 100) {
          newY = Math.random() * -20;
          newX = Math.random() * 100;
        }

        return {
          ...leaf,
          x: newX,
          y: newY,
          swayPhase: leaf.swayPhase + 0.05,
          rotation: leaf.rotation + leaf.rotationSpeed,
        };
      }));

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, leafCount, leafTypes, fallSpeed, swayAmount, colors]);

  const getLeafPath = (type: string) => {
    switch (type) {
      case 'maple':
        return "M12 2 L8 6 L4 4 L6 8 L2 12 L6 16 L4 20 L8 18 L12 22 L16 18 L20 20 L18 16 L22 12 L18 8 L20 4 L16 6 Z";
      case 'oak':
        return "M12 2 Q8 4 6 8 Q4 12 6 16 Q8 20 12 22 Q16 20 18 16 Q20 12 18 8 Q16 4 12 2 Z";
      case 'birch':
        return "M12 2 L10 6 L8 10 L10 14 L12 18 L14 14 L16 10 L14 6 Z";
      default:
        return "M12 2 L8 6 L4 4 L6 8 L2 12 L6 16 L4 20 L8 18 L12 22 L16 18 L20 20 L18 16 L22 12 L18 8 L20 4 L16 6 Z";
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden" style={element.styles}>
      {leaves.map(leaf => (
        <div
          key={leaf.id}
          className="absolute pointer-events-none"
          style={{
            left: `${leaf.x}%`,
            top: `${leaf.y}%`,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            transform: `rotate(${leaf.rotation}deg)`,
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 24 24" fill={leaf.color}>
            <path d={getLeafPath(leaf.leafType)} />
          </svg>
        </div>
      ))}
    </div>
  );
}

// Neon Pulse Element
function NeonPulseElement({ element }: { element: ContentElement }) {
  const [gridLines, setGridLines] = useState<Array<{
    id: number;
    type: 'horizontal' | 'vertical';
    position: number;
    intensity: number;
    pulse: number;
    color: string;
    glowPhase: number;
  }>>([]);
  const [pulseRings, setPulseRings] = useState<Array<{
    id: number;
    x: number;
    y: number;
    radius: number;
    opacity: number;
    color: string;
  }>>([]);
  const [isActive, setIsActive] = useState(true);
  const animationRef = useRef<number>();

  const {
    gridPattern = 'lines',
    pulseSpeed = 2,
    pulseIntensity = 0.8,
    glowRadius = 20,
    lineWidth = 2,
    flickerEffect = true,
    traceAnimation = true,
    colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0099']
  } = element.properties || {};

  useEffect(() => {
    if (!isActive) return;

    // Initialize grid lines
    const lines = [];
    for (let i = 0; i < 10; i++) {
      lines.push({
        id: i,
        type: 'horizontal' as const,
        position: i * 10,
        intensity: Math.random() * pulseIntensity,
        pulse: Math.random() * Math.PI * 2,
        color: colors[i % colors.length],
        glowPhase: Math.random() * Math.PI * 2,
      });
    }
    for (let i = 0; i < 10; i++) {
      lines.push({
        id: i + 10,
        type: 'vertical' as const,
        position: i * 10,
        intensity: Math.random() * pulseIntensity,
        pulse: Math.random() * Math.PI * 2,
        color: colors[i % colors.length],
        glowPhase: Math.random() * Math.PI * 2,
      });
    }
    setGridLines(lines);

    const animate = () => {
      // Update grid lines
      setGridLines(prev => prev.map(line => ({
        ...line,
        pulse: line.pulse + pulseSpeed * 0.02,
        glowPhase: line.glowPhase + 0.1,
        intensity: flickerEffect ? 
          line.intensity * (0.7 + 0.3 * Math.sin(line.pulse)) :
          line.intensity,
      })));

      // Create pulse rings occasionally
      if (Math.random() < 0.02) {
        const newRing = {
          id: Date.now() + Math.random(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          radius: 0,
          opacity: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        };
        setPulseRings(prev => [...prev, newRing]);
      }

      // Update pulse rings
      setPulseRings(prev => prev.map(ring => ({
        ...ring,
        radius: ring.radius + 2,
        opacity: Math.max(0, ring.opacity - 0.02),
      })).filter(ring => ring.opacity > 0));

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, pulseSpeed, pulseIntensity, flickerEffect, colors]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black" style={element.styles}>
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          {colors.map((color, i) => (
            <filter key={i} id={`neonGlow-${i}`}>
              <feGaussianBlur stdDeviation={glowRadius} result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          ))}
        </defs>

        {/* Grid lines */}
        {gridLines.map(line => {
          const colorIndex = colors.indexOf(line.color);
          const opacity = line.intensity * (0.5 + 0.5 * Math.sin(line.pulse));
          
          return line.type === 'horizontal' ? (
            <line
              key={line.id}
              x1="0%"
              y1={`${line.position}%`}
              x2="100%"
              y2={`${line.position}%`}
              stroke={line.color}
              strokeWidth={lineWidth}
              opacity={opacity}
              filter={`url(#neonGlow-${colorIndex})`}
            />
          ) : (
            <line
              key={line.id}
              x1={`${line.position}%`}
              y1="0%"
              x2={`${line.position}%`}
              y2="100%"
              stroke={line.color}
              strokeWidth={lineWidth}
              opacity={opacity}
              filter={`url(#neonGlow-${colorIndex})`}
            />
          );
        })}

        {/* Pulse rings */}
        {pulseRings.map(ring => (
          <circle
            key={ring.id}
            cx={`${ring.x}%`}
            cy={`${ring.y}%`}
            r={ring.radius}
            fill="none"
            stroke={ring.color}
            strokeWidth="2"
            opacity={ring.opacity}
            filter={`url(#neonGlow-${colors.indexOf(ring.color)})`}
          />
        ))}
      </svg>
    </div>
  );
}

// Video Player Element
function VideoPlayerElement({ element }: { element: ContentElement }) {
  const {
    src = '',
    poster = '',
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
    skipBackwardSeconds = 10,
    skipForwardSeconds = 10,
    bufferingIndicator = true,
    qualitySelector = false,
    subtitleSupport = false,
    chapterMarkers = false,
    customControls = true,
    theme = 'default',
    controlBarPosition = 'bottom',
    showPlaybackRate = true,
    showQualitySelector = false,
    showSubtitleSelector = false,
    showChapterSelector = false,
    showDownloadButton = false,
    showShareButton = false,
    showCastButton = false,
    showTheaterMode = false,
    showMiniPlayer = false,
    showPlaylistControls = false,
    autoHideControls = true,
    controlsTimeout = 3000,
    hoverToShowControls = true,
    clickToPlay = true,
    doubleClickToFullscreen = true,
    keyboardShortcuts = true,
    mobileOptimized = true,
    responsiveDesign = true,
    accessibilityFeatures = true,
    analyticsTracking = false,
    customEvents = false,
    watermark = false,
    watermarkText = '',
    watermarkPosition = 'bottom-right',
    watermarkOpacity = 0.7,
    watermarkFontSize = '12px',
    watermarkColor = '#ffffff'
  } = element.properties || {};

  return (
    <div className="w-full h-full" style={element.styles}>
      <VideoPlayer
        src={src}
        poster={poster}
        autoplay={autoplay}
        loop={loop}
        muted={muted}
        controls={controls}
        preload={preload}
        playbackRate={playbackRate}
        objectFit={objectFit}
        volume={volume}
        showControlsOnHover={showControlsOnHover}
        showTimeDisplay={showTimeDisplay}
        showVolumeControl={showVolumeControl}
        showFullscreenButton={showFullscreenButton}
        showProgressBar={showProgressBar}
        customSkin={customSkin}
        aspectRatio={aspectRatio}
        maxWidth={maxWidth}
        enableKeyboardControls={enableKeyboardControls}
        crossOrigin={crossOrigin}
        enablePictureInPicture={enablePictureInPicture}
        showVideoInfo={showVideoInfo}
        onPlay={() => {
          // Analytics tracking
          if (analyticsTracking) {
            console.log('Video played:', src);
          }
          // Custom events
          if (customEvents) {
            const event = new CustomEvent('video-player-play', {
              detail: { elementId: element.id, src }
            });
            window.dispatchEvent(event);
          }
        }}
        onPause={() => {
          if (analyticsTracking) {
            console.log('Video paused:', src);
          }
          if (customEvents) {
            const event = new CustomEvent('video-player-pause', {
              detail: { elementId: element.id, src }
            });
            window.dispatchEvent(event);
          }
        }}
        onEnded={() => {
          if (analyticsTracking) {
            console.log('Video ended:', src);
          }
          if (customEvents) {
            const event = new CustomEvent('video-player-ended', {
              detail: { elementId: element.id, src }
            });
            window.dispatchEvent(event);
          }
        }}
        onTimeUpdate={(currentTime) => {
          if (analyticsTracking) {
            console.log('Video time update:', currentTime);
          }
        }}
        onVolumeChange={(volume) => {
          if (analyticsTracking) {
            console.log('Video volume change:', volume);
          }
        }}
        onError={(error) => {
          console.error('Video player error:', error);
          if (customEvents) {
            const event = new CustomEvent('video-player-error', {
              detail: { elementId: element.id, src, error }
            });
            window.dispatchEvent(event);
          }
        }}
        className="w-full h-full"
        style={element.styles}
      />
      
      {/* Watermark */}
      {watermark && watermarkText && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            [watermarkPosition.includes('bottom') ? 'bottom' : 'top']: '10px',
            [watermarkPosition.includes('right') ? 'right' : 'left']: '10px',
            opacity: watermarkOpacity,
            fontSize: watermarkFontSize,
            color: watermarkColor,
            fontFamily: 'Arial, sans-serif',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          {watermarkText}
        </div>
      )}
    </div>
  );
}

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