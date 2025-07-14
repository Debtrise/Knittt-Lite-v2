'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

import { 
  Upload, Search, UserCircle, Mail, Trash2, Plus, 
  Download, Eye, Edit, AlertCircle, CheckCircle,
  Users, Image as ImageIcon, FileText, Video, FileSpreadsheet,
  Shield, History, BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { salesRepPhotos } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface SalesRepPhoto {
  id: string;
  repEmail: string;
  repName?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  photoUrl: string;
  url?: string; // New field from backend
  thumbnailUrl?: string;
  previewUrls?: {
    small?: string;   // Small preview URL
    medium?: string;  // Medium preview URL
    large?: string;   // Large preview URL
  };
  dimensions?: {
    width: number;
    height: number;
  };
  uploadedAt: string;
  updatedAt: string;
}

interface SalesRepPhotosPanelProps {
  onPhotoSelect?: (photo: SalesRepPhoto) => void;
  searchQuery?: string;
  compact?: boolean;
}

export function SalesRepPhotosPanel({ 
  onPhotoSelect, 
  searchQuery = '', 
  compact = false 
}: SalesRepPhotosPanelProps) {
  const [photos, setPhotos] = useState<SalesRepPhoto[]>([]);
  const [fallbackPhoto, setFallbackPhoto] = useState<SalesRepPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedPhoto, setSelectedPhoto] = useState<SalesRepPhoto | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [showCsvUploadDialog, setShowCsvUploadDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showEmailLookupDialog, setShowEmailLookupDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  
  // Upload states
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<any>(null);
  const [csvProgress, setCsvProgress] = useState<any>(null);
  const [videoResult, setVideoResult] = useState<any>(null);

  // Auth state
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  // Enhanced error handling function
  const handleApiError = (error: any, operation: string) => {
    console.error(`${operation} failed:`, error);
    
    if (error.message?.includes('Authentication required')) {
      toast.error('Please log in to continue');
      // Redirect to login or trigger auth modal
      return;
    }
    
    if (error.message?.includes('Access denied')) {
      toast.error('You do not have permission for this action');
      return;
    }
    
    if (error.response?.status === 401) {
      toast.error('Your session has expired. Please log in again.');
      useAuthStore.getState().logout();
      return;
    }
    
    if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission for this action.');
      return;
    }
    
    if (error.response?.status === 404) {
      toast.error('Resource not found');
      return;
    }
    
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
      return;
    }
    
    // Generic error handling
    const errorMessage = error.response?.data?.error || error.message || `${operation} failed`;
    toast.error(errorMessage);
  };

  // Load photos on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadPhotos();
      loadFallbackPhoto();
    }
  }, [isAuthenticated]);

  // Update search when prop changes
  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  const loadPhotos = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to view sales rep photos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await salesRepPhotos.getPhotos({
        search: searchTerm,
        limit: 100
      });
      // Backend returns 'assets' field
      setPhotos(response.data.assets || []);
    } catch (error) {
      handleApiError(error, 'Loading sales rep photos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFallbackPhoto = async () => {
    try {
      const response = await salesRepPhotos.getFallbackPhoto();
      setFallbackPhoto(response.data.photo);
    } catch (error) {
      // Fallback photo not set, which is fine
      console.log('No fallback photo set');
    }
  };

  const handleSearch = useCallback(async () => {
    await loadPhotos();
  }, [searchTerm, isAuthenticated]);

  const handleEmailLookup = async (email: string) => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const response = await salesRepPhotos.getPhotoByEmail(email);
      const photo = response.data.photo;
      
      if (photo) {
        setSelectedPhoto(photo);
        setShowPreviewDialog(true);
        toast.success('Photo found!');
      } else {
        toast.error('No photo found for this email address');
      }
    } catch (error: any) {
      handleApiError(error, 'Email lookup');
    }
  };

  const handleUploadSingle = async (file: File, repEmail: string, repName?: string, replace = false) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('repEmail', repEmail);
      if (repName) formData.append('repName', repName);
      if (replace) formData.append('replace', 'true');

      const response = await salesRepPhotos.uploadPhoto(formData);
      toast.success(response.data.message || 'Photo uploaded successfully');
      await loadPhotos();
      setShowUploadDialog(false);
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Photo already exists for this email. Enable "Replace existing" to overwrite.');
      } else {
        handleApiError(error, 'Photo upload');
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleBulkUpload = async (files: FileList, mappings: Array<{filename: string, email: string, name?: string}>) => {
    setBulkUploading(true);
    try {
      const formData = new FormData();
      
      // Add all files
      Array.from(files).forEach(file => {
        formData.append('photos', file);
      });
      
      // Add mappings
      formData.append('mappings', JSON.stringify(mappings));

      const response = await salesRepPhotos.bulkUpload(formData);
      
      setUploadProgress(response.data);
      toast.success(response.data.message || 'Bulk upload completed');
      await loadPhotos();
    } catch (error: any) {
      handleApiError(error, 'Bulk upload');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, repEmail: string) => {
    if (!confirm(`Delete photo for ${repEmail}?`)) return;
    
    try {
      await salesRepPhotos.deletePhoto(photoId);
      toast.success('Photo deleted successfully');
      await loadPhotos();
    } catch (error: any) {
      handleApiError(error, 'Photo deletion');
    }
  };

  const handleSetFallback = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await salesRepPhotos.setFallbackPhoto(formData);
      toast.success('Fallback photo set successfully');
      await loadFallbackPhoto();
    } catch (error: any) {
      handleApiError(error, 'Setting fallback photo');
    }
  };

  const handleCsvUpload = async (file: File, columnMapping: any) => {
    setCsvUploading(true);
    try {
      const formData = new FormData();
      formData.append('csv', file);
      formData.append('columnMapping', JSON.stringify(columnMapping));

      const response = await salesRepPhotos.bulkCsvUpload(formData);
      setCsvProgress(response.data);
      toast.success(response.data.message || 'CSV upload completed');
      await loadPhotos();
      setShowCsvUploadDialog(false);
    } catch (error: any) {
      handleApiError(error, 'CSV upload');
    } finally {
      setCsvUploading(false);
    }
  };

  const handleGenerateVideo = async (data: {
    repEmail: string;
    repName?: string;
    dealAmount?: number;
    companyName?: string;
  }) => {
    setGeneratingVideo(true);
    try {
      const response = await salesRepPhotos.generateVideo(data);
      setVideoResult(response.data);
      toast.success('Celebration video generated successfully!');
    } catch (error: any) {
      handleApiError(error, 'Video generation');
    } finally {
      setGeneratingVideo(false);
    }
  };

  // Load upload history (authenticated users only)
  const loadUploadHistory = async () => {
    try {
      const response = await salesRepPhotos.getUploadHistory({
        limit: 50
      });
      return response.data;
    } catch (error: any) {
      handleApiError(error, 'Loading upload history');
      return null;
    }
  };

  // Load usage statistics (admin only)
  const loadUsageStats = async () => {
    try {
      const response = await salesRepPhotos.getUsageStats({
        period: 'month'
      });
      return response.data;
    } catch (error: any) {
      handleApiError(error, 'Loading usage statistics');
      return null;
    }
  };

  // Helper function to get the appropriate thumbnail URL
  const getThumbnailUrl = (photo: SalesRepPhoto, size: 'small' | 'medium' | 'large' = 'small') => {
    // If URL is relative, make it absolute
    const makeAbsoluteUrl = (url: string | undefined) => {
      if (!url) return url;
      if (url.startsWith('http')) return url;
      return `http://34.122.156.88:3001${url}`;
    };

    // Try to get the specific preview size from new structure
    if (photo.previewUrls && typeof photo.previewUrls === 'object') {
      const previewUrl = photo.previewUrls[size];
      if (previewUrl) return makeAbsoluteUrl(previewUrl);
      
      // Fallback to other sizes if requested size is not available
      if (size === 'small') {
        return makeAbsoluteUrl(photo.previewUrls.medium || photo.previewUrls.large) || 
               makeAbsoluteUrl(photo.thumbnailUrl) || 
               makeAbsoluteUrl(photo.url) || 
               makeAbsoluteUrl(photo.photoUrl);
      } else if (size === 'medium') {
        return makeAbsoluteUrl(photo.previewUrls.large || photo.previewUrls.small) || 
               makeAbsoluteUrl(photo.thumbnailUrl) || 
               makeAbsoluteUrl(photo.url) || 
               makeAbsoluteUrl(photo.photoUrl);
      } else { // large
        return makeAbsoluteUrl(photo.previewUrls.medium || photo.previewUrls.small) || 
               makeAbsoluteUrl(photo.thumbnailUrl) || 
               makeAbsoluteUrl(photo.url) || 
               makeAbsoluteUrl(photo.photoUrl);
      }
    }
    
    // Fallback to legacy thumbnailUrl, new url field, or original photo
    return makeAbsoluteUrl(photo.thumbnailUrl) || 
           makeAbsoluteUrl(photo.url) || 
           makeAbsoluteUrl(photo.photoUrl);
  };

  const filteredPhotos = photos.filter(photo => 
    !searchTerm || 
    photo.repEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (photo.repName && photo.repName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Sales Rep Photos</h3>
          <Badge variant="secondary" className="text-xs">
            {photos.length}
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 h-8 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {filteredPhotos.map((photo) => (
            <Card 
              key={photo.id} 
              className="p-2 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onPhotoSelect?.(photo)}
            >
              <div className="aspect-square bg-gray-100 rounded mb-2 overflow-hidden">
                <img 
                  src={getThumbnailUrl(photo, 'small')} 
                  alt={photo.repName || photo.repEmail}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="text-xs">
                <p className="font-medium truncate">{photo.repName || 'No Name'}</p>
                <p className="text-gray-500 truncate">{photo.repEmail}</p>
              </div>
            </Card>
          ))}
        </div>

        {filteredPhotos.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <UserCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sales rep photos found</p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={() => setShowUploadDialog(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Photos
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Sales Rep Photos</h2>
          <Badge variant="secondary">{photos.length} photos</Badge>
          {user && (
            <Badge variant="outline" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              {user.role}
            </Badge>
          )}
        </div>
        <div className="flex space-x-2">
          {/* Upload History - All authenticated users */}
          {isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistoryDialog(true)}
              title="View Upload History"
            >
              <History className="w-4 h-4" />
            </Button>
          )}
          
          {/* Usage Statistics - Admin only */}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatsDialog(true)}
              title="View Usage Statistics"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          )}
          
          {/* Upload actions - All authenticated users */}
          {isAuthenticated && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkUploadDialog(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCsvUploadDialog(true)}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV Upload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVideoDialog(true)}
              >
                <Video className="w-4 h-4 mr-2" />
                Generate Video
              </Button>
              <Button
                size="sm"
                onClick={() => setShowUploadDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
            </>
          )}
          
          {/* Login prompt for unauthenticated users */}
          {!isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.error('Please log in to upload photos');
                // You could redirect to login here
                window.location.href = '/login';
              }}
            >
              <Shield className="w-4 h-4 mr-2" />
              Login Required
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEmailLookupDialog(true)}
          className="px-3"
        >
          <Mail className="w-4 h-4" />
        </Button>
      </div>

      {/* Fallback Photo Section */}
      {fallbackPhoto && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
              <img 
                src={getThumbnailUrl(fallbackPhoto, 'medium')} 
                alt="Fallback"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">Default Fallback Photo</h4>
              <p className="text-sm text-blue-700">Used when no specific rep photo exists</p>
            </div>
            {/* Edit fallback - Admin only */}
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      handleSetFallback(file);
                    }
                  };
                  input.click();
                }}
                title="Change Fallback Photo (Admin Only)"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      )}
      
      {/* No fallback photo set - Admin can set one */}
      {!fallbackPhoto && isAdmin && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-12 h-12 text-yellow-500" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900">No Fallback Photo Set</h4>
              <p className="text-sm text-yellow-700">Set a default photo for when no specific rep photo exists</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    handleSetFallback(file);
                  }
                };
                input.click();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Set Fallback
            </Button>
          </div>
        </Card>
      )}

      {/* Photos Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-gray-100 relative group">
              <img 
                src={getThumbnailUrl(photo, 'small')} 
                alt={photo.repName || photo.repEmail}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setShowPreviewDialog(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onPhotoSelect?.(photo)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setShowVideoDialog(true);
                    }}
                  >
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeletePhoto(photo.id, photo.repEmail)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-3">
              <h4 className="font-medium text-sm truncate">{photo.repName || 'No Name'}</h4>
              <p className="text-xs text-gray-500 truncate">{photo.repEmail}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {(photo.fileSize / 1024).toFixed(1)} KB
                </span>
                <Badge variant="outline" className="text-xs">
                  {photo.mimeType ? photo.mimeType.split('/')[1].toUpperCase() : 'IMG'}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredPhotos.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-500">
          <UserCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Sales Rep Photos</h3>
          <p className="text-sm mb-4">Upload photos to get started</p>
          <div className="flex justify-center space-x-2">
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Single Photo
            </Button>
            <Button variant="outline" onClick={() => setShowBulkUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <SingleUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={handleUploadSingle}
        uploading={uploadingPhoto}
      />

      {/* Bulk Upload Dialog */}
      <BulkUploadDialog
        isOpen={showBulkUploadDialog}
        onClose={() => setShowBulkUploadDialog(false)}
        onUpload={handleBulkUpload}
        uploading={bulkUploading}
        progress={uploadProgress}
      />

      {/* Preview Dialog */}
      <PhotoPreviewDialog
        isOpen={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        photo={selectedPhoto}
        getThumbnailUrl={getThumbnailUrl}
        onSelect={() => {
          if (selectedPhoto) {
            onPhotoSelect?.(selectedPhoto);
            setShowPreviewDialog(false);
          }
        }}
      />

      {/* CSV Upload Dialog */}
      <CsvUploadDialog
        isOpen={showCsvUploadDialog}
        onClose={() => setShowCsvUploadDialog(false)}
        onUpload={handleCsvUpload}
        uploading={csvUploading}
        progress={csvProgress}
      />

      {/* Video Generation Dialog */}
      <VideoGenerationDialog
        isOpen={showVideoDialog}
        onClose={() => setShowVideoDialog(false)}
        onGenerate={handleGenerateVideo}
        generating={generatingVideo}
        result={videoResult}
        selectedPhoto={selectedPhoto}
      />

      {/* Email Lookup Dialog */}
      <EmailLookupDialog
        isOpen={showEmailLookupDialog}
        onClose={() => setShowEmailLookupDialog(false)}
        onLookup={handleEmailLookup}
      />

      {/* Upload History Dialog */}
      <UploadHistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        loadHistory={loadUploadHistory}
      />

      {/* Usage Statistics Dialog */}
      <UsageStatsDialog
        isOpen={showStatsDialog}
        onClose={() => setShowStatsDialog(false)}
        loadStats={loadUsageStats}
      />
    </div>
  );
}

// Single Upload Dialog Component
function SingleUploadDialog({ 
  isOpen, 
  onClose, 
  onUpload, 
  uploading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onUpload: (file: File, email: string, name?: string, replace?: boolean) => void;
  uploading: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [repEmail, setRepEmail] = useState('');
  const [repName, setRepName] = useState('');
  const [replace, setReplace] = useState(false);

  const handleSubmit = () => {
    if (!file || !repEmail) {
      toast.error('Please select a file and enter an email');
      return;
    }

    onUpload(file, repEmail, repName || undefined, replace);
  };

  const reset = () => {
    setFile(null);
    setRepEmail('');
    setRepName('');
    setReplace(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        reset();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload Sales Rep Photo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Photo File</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full mt-1 p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Sales Rep Email *</label>
            <Input
              type="email"
              value={repEmail}
              onChange={(e) => setRepEmail(e.target.value)}
              placeholder="john@company.com"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Sales Rep Name (optional)</label>
            <Input
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              placeholder="John Doe"
              className="mt-1"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="replace"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
            />
            <label htmlFor="replace" className="text-sm">
              Replace existing photo if it exists
            </label>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!file || !repEmail || uploading}
              className="flex-1"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Bulk Upload Dialog Component
function BulkUploadDialog({ 
  isOpen, 
  onClose, 
  onUpload, 
  uploading, 
  progress 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onUpload: (files: FileList, mappings: any[]) => void;
  uploading: boolean;
  progress: any;
}) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [mappings, setMappings] = useState<Array<{filename: string, email: string, name?: string}>>([]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    setFiles(selectedFiles);
    
    if (selectedFiles) {
      const newMappings = Array.from(selectedFiles).map(file => ({
        filename: file.name,
        email: '',
        name: ''
      }));
      setMappings(newMappings);
    }
  };

  const updateMapping = (index: number, field: 'email' | 'name', value: string) => {
    const newMappings = [...mappings];
    newMappings[index][field] = value;
    setMappings(newMappings);
  };

  const handleSubmit = () => {
    if (!files || mappings.some(m => !m.email)) {
      toast.error('Please select files and provide email for each');
      return;
    }

    onUpload(files, mappings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Bulk Upload Sales Rep Photos
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Photos (max 50)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="w-full mt-1 p-2 border rounded"
            />
          </div>
          
          {mappings.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Map Photos to Sales Reps</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mappings.map((mapping, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium w-32 truncate">
                      {mapping.filename}
                    </span>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={mapping.email}
                      onChange={(e) => updateMapping(index, 'email', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Name (optional)"
                      value={mapping.name}
                      onChange={(e) => updateMapping(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {progress && (
            <div className="space-y-2">
              <h4 className="font-medium">Upload Results</h4>
              <div className="text-sm space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Successful: {progress.summary.successful}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Failed: {progress.summary.failed}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span>Skipped: {progress.summary.skipped}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {progress ? 'Close' : 'Cancel'}
            </Button>
            {!progress && (
              <Button 
                onClick={handleSubmit} 
                disabled={!files || mappings.some(m => !m.email) || uploading}
                className="flex-1"
              >
                {uploading ? 'Uploading...' : 'Upload All'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Photo Preview Dialog Component
function PhotoPreviewDialog({ 
  isOpen, 
  onClose, 
  photo, 
  getThumbnailUrl,
  onSelect 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  photo: SalesRepPhoto | null;
  getThumbnailUrl: (photo: SalesRepPhoto, size?: 'small' | 'medium' | 'large') => string;
  onSelect: () => void;
}) {
  if (!photo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Sales Rep Photo Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={getThumbnailUrl(photo, 'large')} 
              alt={photo.repName || photo.repEmail}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{photo.repEmail}</span>
            </div>
            {photo.repName && (
              <div className="flex items-center space-x-2">
                <UserCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{photo.repName}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{(photo.fileSize / 1024).toFixed(1)} KB{photo.mimeType ? ` • ${photo.mimeType}` : ''}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Uploaded {new Date(photo.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={onSelect} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Use in Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// CSV Upload Dialog Component
function CsvUploadDialog({
  isOpen,
  onClose,
  onUpload,
  uploading,
  progress
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, columnMapping: any) => void;
  uploading: boolean;
  progress: any;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<{
    headers: string[];
    rows: string[][];
    preview: string[][];
  } | null>(null);
  const [columnMapping, setColumnMapping] = useState<{
    name: string | null;
    email: string | null;
    photoUrl: string | null;
  }>({
    name: null,
    email: null,
    photoUrl: null
  });
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Update validation when column mapping changes
  useEffect(() => {
    if (csvData && columnMapping.name && columnMapping.email && columnMapping.photoUrl) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [csvData, columnMapping]);

  const handleFileChange = async (selectedFile: File | null) => {
    setFile(selectedFile);
    setCsvData(null);
    setColumnMapping({ name: null, email: null, photoUrl: null });
    setIsValid(false);
    
    if (selectedFile) {
      setValidating(true);
      
      try {
        const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(selectedFile);
        });
        
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
          throw new Error('CSV file is empty');
        }
        
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => 
          line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        );
        
        // Auto-detect column mappings
        const headersLower = headers.map(h => h.toLowerCase());
        const autoMapping = {
          name: headers[headersLower.findIndex(h => 
            h.includes('name') || h.includes('fullname') || h.includes('rep_name')
          )] || null,
          email: headers[headersLower.findIndex(h => 
            h.includes('email') || h.includes('mail')
          )] || null,
          photoUrl: headers[headersLower.findIndex(h => 
            h.includes('url') || h.includes('photo') || h.includes('image')
          )] || null
        };
        
        setCsvData({
          headers,
          rows,
          preview: rows.slice(0, 5) // First 5 rows for preview
        });
        
        setColumnMapping(autoMapping);
        
        // Check if we have valid mappings
        const hasValidMapping = autoMapping.name && autoMapping.email && autoMapping.photoUrl;
        setIsValid(hasValidMapping);
        
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast.error(`Failed to parse CSV: ${error}`);
      } finally {
        setValidating(false);
      }
    }
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    if (!isValid || !columnMapping.name || !columnMapping.email || !columnMapping.photoUrl) {
      toast.error('Please map all required columns (Name, Email, Photo URL)');
      return;
    }

    if (!csvData || csvData.rows.length === 0) {
      toast.error('No data rows found in CSV file');
        return;
    }

    onUpload(file, columnMapping);
  };

  const reset = () => {
    setFile(null);
    setCsvData(null);
    setColumnMapping({ name: null, email: null, photoUrl: null });
    setIsValid(false);
    setValidating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        reset();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            CSV Upload - Create Users & Fetch Photos
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <UserCircle className="w-4 h-4 mr-2" />
              What this does
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              This will automatically <strong>create user accounts</strong> and <strong>download photos</strong> from the provided URLs for each sales representative.
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-blue-100">
                <strong className="text-blue-900">name</strong><br/>
                <span className="text-gray-600">Full name of sales rep</span>
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <strong className="text-blue-900">email</strong><br/>
                <span className="text-gray-600">Email address (will be username)</span>
              </div>
              <div className="bg-white p-2 rounded border border-blue-100">
                <strong className="text-blue-900">photoUrl</strong><br/>
                <span className="text-gray-600">Direct link to photo (jpg, png)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={validating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Select a CSV file with sales rep data. Headers will be auto-detected.
            </p>
            
            {validating && (
              <div className="flex items-center space-x-2 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700">Parsing CSV file...</span>
              </div>
            )}
          </div>

          {csvData && (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">CSV Parsed Successfully</span>
                </div>
                <div className="text-xs text-green-700">
                  Found {csvData.headers.length} columns and {csvData.rows.length} data rows
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3">Map CSV Columns</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Name Column *</label>
                    <select
                      value={columnMapping.name || ''}
                      onChange={(e) => setColumnMapping({...columnMapping, name: e.target.value || null})}
                      className="w-full mt-1 p-2 border rounded text-sm"
                    >
                      <option value="">Select column...</option>
                      {csvData.headers.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700">Email Column *</label>
                    <select
                      value={columnMapping.email || ''}
                      onChange={(e) => setColumnMapping({...columnMapping, email: e.target.value || null})}
                      className="w-full mt-1 p-2 border rounded text-sm"
                    >
                      <option value="">Select column...</option>
                      {csvData.headers.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700">Photo URL Column *</label>
                    <select
                      value={columnMapping.photoUrl || ''}
                      onChange={(e) => setColumnMapping({...columnMapping, photoUrl: e.target.value || null})}
                      className="w-full mt-1 p-2 border rounded text-sm"
                    >
                      <option value="">Select column...</option>
                      {csvData.headers.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {isValid && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-xs text-blue-700 font-medium">✓ All required columns mapped</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {csvData && isValid && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Preview (first 5 rows)
              </h4>
              <div className="border rounded-lg overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Photo URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.preview.map((row, index) => {
                      const nameIndex = csvData.headers.indexOf(columnMapping.name!);
                      const emailIndex = csvData.headers.indexOf(columnMapping.email!);
                      const photoUrlIndex = csvData.headers.indexOf(columnMapping.photoUrl!);
                      
                      return (
                      <tr key={index} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-3 py-2">{row[nameIndex] || '-'}</td>
                          <td className="px-3 py-2">{row[emailIndex] || '-'}</td>
                          <td className="px-3 py-2 truncate max-w-32" title={row[photoUrlIndex]}>
                            {row[photoUrlIndex] ? (
                              <span className="text-blue-600">{row[photoUrlIndex].substring(0, 30)}...</span>
                          ) : '-'}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {progress && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Processing Results
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                  <div className="text-lg font-bold text-green-700">{progress.summary?.successful || 0}</div>
                  <div className="text-xs text-green-600">Users Created</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded border border-red-200">
                  <div className="text-lg font-bold text-red-700">{progress.summary?.failed || 0}</div>
                  <div className="text-xs text-red-600">Failed</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded border border-yellow-200">
                  <div className="text-lg font-bold text-yellow-700">{progress.summary?.skipped || 0}</div>
                  <div className="text-xs text-yellow-600">Skipped</div>
                </div>
              </div>
              
              {progress.failed && progress.failed.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-red-700 mb-2">Failed entries:</h5>
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded max-h-20 overflow-y-auto border border-red-200">
                    {progress.failed.map((error: any, index: number) => (
                      <div key={index}>• {error.email}: {error.error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {progress ? 'Close' : 'Cancel'}
            </Button>
            {!progress && (
              <Button 
                onClick={handleSubmit} 
                disabled={!file || uploading || validating || !isValid}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Users...
                  </div>
                ) : validating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Create Users & Fetch Photos
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Video Generation Dialog Component
function VideoGenerationDialog({
  isOpen,
  onClose,
  onGenerate,
  generating,
  result,
  selectedPhoto
}: {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: {
    repEmail: string;
    repName?: string;
    dealAmount?: number;
    companyName?: string;
  }) => void;
  generating: boolean;
  result: any;
  selectedPhoto: SalesRepPhoto | null;
}) {
  const [repEmail, setRepEmail] = useState('');
  const [repName, setRepName] = useState('');
  const [dealAmount, setDealAmount] = useState<number | ''>('');
  const [companyName, setCompanyName] = useState('');

  // Pre-fill form when a photo is selected
  useEffect(() => {
    if (selectedPhoto) {
      setRepEmail(selectedPhoto.repEmail);
      setRepName(selectedPhoto.repName || '');
    }
  }, [selectedPhoto]);

  const handleSubmit = () => {
    if (!repEmail) {
      toast.error('Please enter a sales rep email');
      return;
    }

    onGenerate({
      repEmail,
      repName: repName || undefined,
      dealAmount: dealAmount ? Number(dealAmount) : undefined,
      companyName: companyName || undefined
    });
  };

  const reset = () => {
    setRepEmail('');
    setRepName('');
    setDealAmount('');
    setCompanyName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        reset();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Video className="w-5 h-5 mr-2" />
            Generate Celebration Video
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Sales Rep Email *</label>
            <Input
              type="email"
              value={repEmail}
              onChange={(e) => setRepEmail(e.target.value)}
              placeholder="john@company.com"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Sales Rep Name</label>
            <Input
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              placeholder="John Doe"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Deal Amount</label>
            <Input
              type="number"
              value={dealAmount}
              onChange={(e) => setDealAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="50000"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Company Name</label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
              className="mt-1"
            />
          </div>
          
          {result && (
            <div className="space-y-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800">Video Generated!</h4>
              {result.videoUrl && (
                <div className="space-y-2">
                  <p className="text-sm text-green-700">Video is ready for download:</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(result.videoUrl, '_blank')}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Video
                  </Button>
                </div>
              )}
              {result.processingTimeMs && (
                <p className="text-sm text-green-600">
                  Generated in {(result.processingTimeMs / 1000).toFixed(1)}s
                </p>
              )}
            </div>
          )}
          
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {result ? 'Close' : 'Cancel'}
            </Button>
            {!result && (
              <Button 
                onClick={handleSubmit} 
                disabled={!repEmail || generating}
                className="flex-1"
              >
                {generating ? 'Generating...' : 'Generate Video'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Email Lookup Dialog Component
function EmailLookupDialog({
  isOpen,
  onClose,
  onLookup
}: {
  isOpen: boolean;
  onClose: () => void;
  onLookup: (email: string) => void;
}) {
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    onLookup(email);
    setEmail('');
    onClose();
  };

  const reset = () => {
    setEmail('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        reset();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Find Photo by Email
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Sales Rep Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              className="mt-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!email}
              className="flex-1"
            >
              <Search className="w-4 h-4 mr-2" />
              Find Photo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Upload History Dialog Component
function UploadHistoryDialog({
  isOpen,
  onClose,
  loadHistory
}: {
  isOpen: boolean;
  onClose: () => void;
  loadHistory: () => Promise<any>;
}) {
  const [history, setHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadHistory().then((data) => {
        setHistory(data);
        setIsLoading(false);
      });
    }
  }, [isOpen, loadHistory]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setHistory(null);
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            Upload History
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : history ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.uploads?.map((upload: any, index: number) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        upload.result === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{upload.repEmail}</p>
                        <p className="text-xs text-gray-500">{upload.repName || 'No name'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={upload.result === 'success' ? 'default' : 'destructive'} className="text-xs">
                        {upload.action}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(upload.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {upload.details && (
                    <p className="text-xs text-gray-600 mt-2">{upload.details}</p>
                  )}
                </Card>
              ))}
              
              {(!history.uploads || history.uploads.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upload history found</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Failed to load upload history</p>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Usage Statistics Dialog Component (Admin Only)
function UsageStatsDialog({
  isOpen,
  onClose,
  loadStats
}: {
  isOpen: boolean;
  onClose: () => void;
  loadStats: () => Promise<any>;
}) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadStats().then((data) => {
        setStats(data);
        setIsLoading(false);
      });
    }
  }, [isOpen, loadStats]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setStats(null);
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Usage Statistics
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : stats ? (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <h3 className="text-2xl font-bold text-blue-600">{stats.stats?.totalPhotos || 0}</h3>
                  <p className="text-sm text-gray-600">Total Photos</p>
                </Card>
                <Card className="p-4 text-center">
                  <h3 className="text-2xl font-bold text-green-600">{stats.stats?.totalViews || 0}</h3>
                  <p className="text-sm text-gray-600">Total Views</p>
                </Card>
                <Card className="p-4 text-center">
                  <h3 className="text-2xl font-bold text-purple-600">{stats.stats?.totalDownloads || 0}</h3>
                  <p className="text-sm text-gray-600">Total Downloads</p>
                </Card>
                <Card className="p-4 text-center">
                  <h3 className="text-2xl font-bold text-orange-600">
                    {stats.stats?.usageByFeature?.contentCreator || 0}
                  </h3>
                  <p className="text-sm text-gray-600">Content Creator</p>
                </Card>
              </div>

              {/* Most Viewed Photos */}
              {stats.stats?.mostViewedPhotos && stats.stats.mostViewedPhotos.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-medium mb-3">Most Viewed Photos</h3>
                  <div className="space-y-2">
                    {stats.stats.mostViewedPhotos.slice(0, 5).map((photo: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{photo.repName || 'No name'}</p>
                          <p className="text-xs text-gray-500">{photo.repEmail}</p>
                        </div>
                        <Badge variant="outline">{photo.views} views</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Usage by Feature */}
              {stats.stats?.usageByFeature && (
                <Card className="p-4">
                  <h3 className="font-medium mb-3">Usage by Feature</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Content Creator</span>
                        <span className="text-sm font-medium">{stats.stats.usageByFeature.contentCreator}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Celebration Videos</span>
                        <span className="text-sm font-medium">{stats.stats.usageByFeature.celebrationVideos}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Email Signatures</span>
                        <span className="text-sm font-medium">{stats.stats.usageByFeature.emailSignatures}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Other</span>
                        <span className="text-sm font-medium">{stats.stats.usageByFeature.other}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Failed to load usage statistics</p>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 