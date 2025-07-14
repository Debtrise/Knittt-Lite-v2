'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { useContentStore } from '../../store/contentStore';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/badge';
import { 
  Upload, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Play, 
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Trash2,
  Download,
  Eye,
  Tag
} from 'lucide-react';

interface AssetLibraryProps {
  compact?: boolean;
  onAssetSelect?: (asset: any) => void;
  searchQuery?: string;
}

export function AssetLibrary({ compact = false, onAssetSelect, searchQuery = '' }: AssetLibraryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const {
    assets,
    isLoading,
    loadAssets,
    uploadAsset,
    deleteAsset
  } = useContentStore();

  // Function to generate thumbnail from video URL
  const generateVideoThumbnail = useCallback((videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      
      video.onloadedmetadata = () => {
        // Seek to 1 second or 10% of video duration, whichever is smaller
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      };
      
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Cannot get canvas context'));
            return;
          }
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to blob and create URL
          canvas.toBlob((blob) => {
            if (blob) {
              const thumbnailUrl = URL.createObjectURL(blob);
              resolve(thumbnailUrl);
            } else {
              reject(new Error('Failed to generate thumbnail blob'));
            }
          }, 'image/jpeg', 0.8);
        } catch (error) {
          reject(error);
        }
      };
      
      video.onerror = () => {
        reject(new Error('Video failed to load'));
      };
      
      video.ontimeout = () => {
        reject(new Error('Video thumbnail generation timeout'));
      };
      
      // Set a timeout for the whole process
      setTimeout(() => {
        reject(new Error('Thumbnail generation timeout'));
      }, 10000);
      
      video.src = videoUrl;
      video.load();
    });
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const filteredAssets = assets.filter(asset => {
    const effectiveSearch = searchQuery || searchTerm;
    const matchesSearch = asset.name.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesType = selectedType === 'all' || asset.assetType === selectedType;
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => asset.tags.includes(tag));
    
    return matchesSearch && matchesType && matchesTags;
  });

  const handleFileUpload = useCallback(async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await uploadAsset(file, {
          tags: selectedTags.join(',')
        });
      } catch (error) {
        console.error('Failed to upload file:', file.name, error);
      }
    }
  }, [uploadAsset, selectedTags]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const assetTypes = ['all', 'image', 'video', 'audio', 'document'];
  const allTags = [...new Set(assets.flatMap(asset => asset.tags))];

  return (
    <div className={`flex flex-col h-full ${compact ? 'space-y-2' : 'space-y-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Asset Library</h3>
        {!compact && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {!compact && (
          <>
            {/* Type Filter */}
            <div className="flex flex-wrap gap-2">
              {assetTypes.map(type => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="capitalize"
                >
                  {type === 'all' ? 'All' : type}
                </Button>
              ))}
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop files here, or{' '}
          <label className="text-blue-600 cursor-pointer hover:underline">
            browse
            <input
              type="file"
              multiple
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
          </label>
        </p>
        <p className="text-xs text-gray-500">
          Supports: Images, Videos, Audio, Documents (Max 50MB)
        </p>
      </div>

      {/* Assets Grid/List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No assets found</p>
            <p className="text-sm">Upload some files to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-3 md:grid-cols-4'}`}>
            {filteredAssets.map(asset => (
              <AssetCard
                key={asset.id}
                asset={asset}
                compact={compact}
                onSelect={onAssetSelect}
                onDelete={() => deleteAsset(asset.id)}
                generateVideoThumbnail={generateVideoThumbnail}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map(asset => (
              <AssetListItem
                key={asset.id}
                asset={asset}
                onSelect={onAssetSelect}
                onDelete={() => deleteAsset(asset.id)}
                generateVideoThumbnail={generateVideoThumbnail}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface AssetCardProps {
  asset: any;
  compact?: boolean;
  onSelect?: (asset: any) => void;
  onDelete: () => void;
  generateVideoThumbnail: (videoUrl: string) => Promise<string>;
}

function AssetCard({ asset, compact = false, onSelect, onDelete, generateVideoThumbnail }: AssetCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [thumbnailGenerating, setThumbnailGenerating] = useState(false);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'asset',
    item: () => {
      setDragStarted(true);
      return { 
        assetType: asset.assetType, 
        assetUrl: asset.publicUrl,
        assetName: asset.name,
        assetId: asset.id,
        asset: asset
      };
    },
    end: () => {
      // Small delay to distinguish between click and drag
      setTimeout(() => {
        setDragStarted(false);
      }, 10);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Generate thumbnail for video assets if not available
  useEffect(() => {
    if (asset.assetType === 'video' && !asset.thumbnailUrl && !generatedThumbnail && !thumbnailGenerating) {
      setThumbnailGenerating(true);
      generateVideoThumbnail(asset.publicUrl)
        .then((thumbnailUrl) => {
          setGeneratedThumbnail(thumbnailUrl);
        })
        .catch((error) => {
          console.warn('Failed to generate video thumbnail:', error);
        })
        .finally(() => {
          setThumbnailGenerating(false);
        });
    }
  }, [asset.assetType, asset.thumbnailUrl, asset.publicUrl, generatedThumbnail, thumbnailGenerating, generateVideoThumbnail]);

  // Cleanup generated thumbnail URL on unmount
  useEffect(() => {
    return () => {
      if (generatedThumbnail && generatedThumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(generatedThumbnail);
      }
    };
  }, [generatedThumbnail]);

  const handleClick = () => {
    // Prevent click if drag was initiated
    if (!dragStarted && !isDragging && onSelect) {
      onSelect(asset);
    }
  };

  const renderPreviewContent = () => {
    switch (asset.assetType) {
      case 'image':
        return (
          <div className="flex items-center justify-center max-h-[70vh]">
            <img
              src={asset.publicUrl}
              alt={asset.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="flex items-center justify-center max-h-[70vh]">
            <video
              src={asset.publicUrl}
              controls
              className="max-w-full max-h-full rounded-lg shadow-lg"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'audio':
        return (
          <div className="flex items-center justify-center max-h-[70vh] p-8">
            <div className="bg-gray-100 rounded-lg p-8 w-full max-w-md">
              <div className="text-center mb-4">
                <Music className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">{asset.name}</h3>
              </div>
              <audio
                src={asset.publicUrl}
                controls
                className="w-full"
                preload="metadata"
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center max-h-[70vh] p-8">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{asset.name}</h3>
              <p className="text-gray-600 mb-4">Preview not available for this file type</p>
              <Button
                onClick={() => window.open(asset.publicUrl, '_blank')}
                className="mr-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Card 
      ref={drag}
      className={`group cursor-move hover:shadow-md transition-all duration-200 overflow-hidden ${
        isDragging ? 'opacity-50 border-blue-400 scale-105' : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={handleClick}
    >
      <div className="aspect-square relative">
        {asset.assetType === 'image' ? (
          <img
            src={asset.thumbnailUrl || asset.publicUrl}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : asset.assetType === 'video' ? (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
            {/* Show thumbnail if available (backend or generated) */}
            {(asset.thumbnailUrl || generatedThumbnail) ? (
              <img
                src={asset.thumbnailUrl || generatedThumbnail!}
                alt={asset.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : null}
            
            {/* Overlay layer with play button */}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              {thumbnailGenerating ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2" />
                  <span className="text-white text-xs">Generating thumbnail...</span>
                </div>
              ) : (
                <Play className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            {getAssetIcon(asset.assetType)}
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Drag indicator */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
            {isDragging ? 'Dragging...' : 'Drag to canvas'}
          </div>
        </div>

        {/* Processing Status */}
        {asset.processingStatus === 'processing' && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        )}
      </div>

      {!compact && (
        <div className="p-3">
          <p className="text-sm font-medium truncate" title={asset.name}>
            {asset.name}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>{formatFileSize(asset.fileSize)}</span>
            <span>{asset.assetType}</span>
          </div>
          {asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {asset.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {asset.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{asset.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                {getAssetIcon(asset.assetType)}
                <div>
                  <h3 className="text-lg font-semibold">{asset.name}</h3>
                  <p className="text-sm text-gray-500">
                    {asset.assetType} • {formatFileSize(asset.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(asset.publicUrl, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {renderPreviewContent()}
            </div>
            {asset.tags.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function AssetListItem({ asset, onSelect, onDelete, generateVideoThumbnail }: { asset: any; onSelect?: (asset: any) => void; onDelete: () => void; generateVideoThumbnail: (videoUrl: string) => Promise<string> }) {
  const [showPreview, setShowPreview] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [thumbnailGenerating, setThumbnailGenerating] = useState(false);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'asset',
    item: () => {
      setDragStarted(true);
      return { 
        assetType: asset.assetType, 
        assetUrl: asset.publicUrl,
        assetName: asset.name,
        assetId: asset.id,
        asset: asset
      };
    },
    end: () => {
      setTimeout(() => {
        setDragStarted(false);
      }, 10);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Generate thumbnail for video assets if not available
  useEffect(() => {
    if (asset.assetType === 'video' && !asset.thumbnailUrl && !generatedThumbnail && !thumbnailGenerating) {
      setThumbnailGenerating(true);
      generateVideoThumbnail(asset.publicUrl)
        .then((thumbnailUrl) => {
          setGeneratedThumbnail(thumbnailUrl);
        })
        .catch((error) => {
          console.warn('Failed to generate video thumbnail:', error);
        })
        .finally(() => {
          setThumbnailGenerating(false);
        });
    }
  }, [asset.assetType, asset.thumbnailUrl, asset.publicUrl, generatedThumbnail, thumbnailGenerating, generateVideoThumbnail]);

  // Cleanup generated thumbnail URL on unmount
  useEffect(() => {
    return () => {
      if (generatedThumbnail && generatedThumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(generatedThumbnail);
      }
    };
  }, [generatedThumbnail]);

  const renderPreviewContent = () => {
    switch (asset.assetType) {
      case 'image':
        return (
          <div className="flex items-center justify-center max-h-[70vh]">
            <img
              src={asset.publicUrl}
              alt={asset.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="flex items-center justify-center max-h-[70vh]">
            <video
              src={asset.publicUrl}
              controls
              className="max-w-full max-h-full rounded-lg shadow-lg"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'audio':
        return (
          <div className="flex items-center justify-center max-h-[70vh] p-8">
            <div className="bg-gray-100 rounded-lg p-8 w-full max-w-md">
              <div className="text-center mb-4">
                <Music className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">{asset.name}</h3>
              </div>
              <audio
                src={asset.publicUrl}
                controls
                className="w-full"
                preload="metadata"
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center max-h-[70vh] p-8">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{asset.name}</h3>
              <p className="text-gray-600 mb-4">Preview not available for this file type</p>
              <Button
                onClick={() => window.open(asset.publicUrl, '_blank')}
                className="mr-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Card 
        ref={drag}
        className={`group p-3 cursor-move hover:shadow-sm transition-all duration-200 relative ${
          isDragging ? 'opacity-50 border-blue-400 scale-105' : 'border-gray-200 hover:border-blue-300'
        }`} 
        onClick={() => !dragStarted && !isDragging && onSelect?.(asset)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            {asset.assetType === 'image' ? (
              <img
                src={asset.thumbnailUrl || asset.publicUrl}
                alt={asset.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : asset.assetType === 'video' ? (
              <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Show thumbnail if available (backend or generated) */}
                {(asset.thumbnailUrl || generatedThumbnail) ? (
                  <img
                    src={asset.thumbnailUrl || generatedThumbnail!}
                    alt={asset.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : null}
                
                {/* Overlay layer with play button or loading */}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
                  {thumbnailGenerating ? (
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                  ) : (
                    <Play className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
            ) : (
              getAssetIcon(asset.assetType)
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{asset.name}</p>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{asset.assetType}</span>
              <span>•</span>
              <span>{formatFileSize(asset.fileSize)}</span>
              <span>•</span>
              <span>{asset.usageCount} uses</span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); window.open(asset.publicUrl, '_blank'); }}>
              <Download className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Drag indicator for list view */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-medium shadow-lg">
            {isDragging ? 'Dragging...' : 'Drag'}
          </div>
        </div>
      </Card>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                {getAssetIcon(asset.assetType)}
                <div>
                  <h3 className="text-lg font-semibold">{asset.name}</h3>
                  <p className="text-sm text-gray-500">
                    {asset.assetType} • {formatFileSize(asset.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(asset.publicUrl, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {renderPreviewContent()}
            </div>
            {asset.tags.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function getAssetIcon(assetType: string) {
  switch (assetType) {
    case 'image':
      return <ImageIcon className="w-6 h-6 text-green-600" />;
    case 'video':
      return <Video className="w-6 h-6 text-red-600" />;
    case 'audio':
      return <Music className="w-6 h-6 text-purple-600" />;
    default:
      return <FileText className="w-6 h-6 text-gray-600" />;
  }
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 