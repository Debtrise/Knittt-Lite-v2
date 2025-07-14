'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useAuthStore } from '@/app/store/authStore';
import { useDevAuth } from '@/app/hooks/useDevAuth';
import api, { salesRepPhotos } from '@/app/lib/api';
import toast from 'react-hot-toast';
import { 
  Edit, Trash2, Plus, Search, Eye, EyeOff, ExternalLink, 
  Users, Camera, Upload, UserCircle, Mail, Image as ImageIcon,
  FileText, X, AlertCircle, CheckCircle, Shield, FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { AdminQuickLogin } from '@/app/components/AdminQuickLogin';

const ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Agent', value: 'agent' },
];

interface User {
  id: number;
  username: string;
  email: string;
  tenantId: string;
  role: 'admin' | 'agent';
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'agent';
}

interface SalesRepPhoto {
  id: string;
  repEmail: string;
  repName?: string;
  name?: string; // API returns 'name' field
  fileName?: string; // Keep for backward compatibility
  fileSize: number;
  mimeType?: string;
  photoUrl?: string; // Keep for backward compatibility
  url?: string; // API returns 'url' field
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
  updatedAt?: string;
}

export default function UserManagementPage() {
  const { user, isAuthenticated } = useAuthStore();
  useDevAuth(); // Enable development admin access
  const [activeTab, setActiveTab] = useState('users');
  
  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<UserFormData>({
    username: '',
    password: '',
    email: '',
    role: 'agent',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  
  // Pagination and search for users
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'admin' | 'agent' | ''>('');
  const [limit] = useState(10);

  // Photo management state
  const [photos, setPhotos] = useState<SalesRepPhoto[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoSearchTerm, setPhotoSearchTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<SalesRepPhoto | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [showCsvUploadDialog, setShowCsvUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<any>(null);
  const [csvProgress, setCsvProgress] = useState<any>(null);

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
  const [validationResults, setValidationResults] = useState<{
    errors: string[];
    warnings: string[];
    validRows: number;
    totalRows: number;
    isValid: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'photos') {
      loadPhotos();
    }
  }, [isAuthenticated, user, currentPage, searchTerm, roleFilter, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;

      const response = await api.users.list(params);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        // Simple array response
        setUsers(response.data);
        setTotalCount(response.data.length);
        setTotalPages(1);
      } else if (response.data.users) {
        // Paginated response
        setUsers(response.data.users || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalCount || 0);
      } else {
        // Fallback: treat entire response as users array
        setUsers([response.data]);
        setTotalCount(1);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
      toast.error(err?.response?.data?.error || 'Failed to load users');
      // Set empty state on error
      setUsers([]);
      setTotalCount(0);
      setTotalPages(1);
    }
    setLoading(false);
  };

  const loadPhotos = async () => {
    setPhotoLoading(true);
    try {
      const response = await salesRepPhotos.getPhotos({
        search: photoSearchTerm,
        limit: 100
      });
      
      console.log('Photos API response:', response); // Debug log
      
      // Backend returns 'assets' field
      const photos = response.data.assets || [];
      
      setPhotos(photos);
      console.log('Loaded photos:', photos.length); // Debug log
    } catch (error) {
      console.error('Failed to load sales rep photos:', error);
      toast.error('Failed to load sales rep photos');
      setPhotos([]);
    } finally {
      setPhotoLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      username: '',
      password: '',
      email: '',
      role: 'agent',
    });
    setEditingUser(null);
    setShowForm(false);
    setShowPassword(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.users.create({
        username: form.username,
        password: form.password,
        email: form.email,
        role: form.role,
      });
      
      // Handle different response formats
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success('User created successfully');
      }
      
      resetForm();
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to create user:', err);
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          'Failed to create user';
      toast.error(errorMessage);
    }
    setSaving(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setSaving(true);
    try {
      const updateData: any = {
        username: form.username,
        email: form.email,
        role: form.role,
      };
      
      // Only include password if it's provided
      if (form.password) {
        updateData.password = form.password;
      }

      const response = await api.users.update(editingUser.id.toString(), updateData);
      
      // Handle different response formats
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success('User updated successfully');
      }
      
      resetForm();
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to update user:', err);
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          'Failed to update user. This feature may not be fully implemented yet.';
      toast.error(errorMessage);
    }
    setSaving(false);
  };

  const handleEdit = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setForm({
      username: userToEdit.username,
      password: '', // Don't pre-fill password for security
      email: userToEdit.email,
      role: userToEdit.role,
    });
    setShowForm(true);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeleting(userId);
    try {
      const response = await api.users.delete(userId.toString());
      
      // Handle different response formats
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success('User deleted successfully');
      }
      
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          'Failed to delete user. This feature may not be fully implemented yet.';
      toast.error(errorMessage);
    }
    setDeleting(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setCurrentPage(1);
  };

  const handlePhotoSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPhotos();
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
      console.error('Upload failed:', error);
      if (error.response?.status === 409) {
        toast.error('Photo already exists for this email. Enable "Replace existing" to overwrite.');
      } else {
        toast.error(error.response?.data?.error || error.message || 'Upload failed');
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
      setShowBulkUploadDialog(false);
    } catch (error: any) {
      console.error('Bulk upload failed:', error);
      toast.error(error.response?.data?.error || 'Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleCsvUpload = async (file: File, columnMapping: any) => {
    setCsvUploading(true);
    try {
      // Create a new CSV with the correct column names
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
      
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1);
      
      // Find the column indices
      const nameIndex = headers.indexOf(columnMapping.name);
      const emailIndex = headers.indexOf(columnMapping.email);
      const photoUrlIndex = headers.indexOf(columnMapping.photoUrl);
      
      // Create new CSV with standard column names
      const newHeaders = ['name', 'email', 'photoUrl'];
      const newRows = rows.map(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        return [
          values[nameIndex] || '',
          values[emailIndex] || '',
          values[photoUrlIndex] || ''
        ].map(v => `"${v}"`).join(',');
      });
      
      const newCsvContent = [newHeaders.join(','), ...newRows].join('\n');
      const newCsvBlob = new Blob([newCsvContent], { type: 'text/csv' });
      const newCsvFile = new File([newCsvBlob], file.name, { type: 'text/csv' });

      const formData = new FormData();
      formData.append('csv', newCsvFile);

      const response = await salesRepPhotos.bulkCsvUpload(formData);
      setCsvProgress(response.data);
      toast.success(response.data.message || 'CSV upload completed');
      await loadPhotos();
      setShowCsvUploadDialog(false);
    } catch (error: any) {
      console.error('CSV upload failed:', error);
      toast.error(error.response?.data?.error || error.message || 'CSV upload failed');
    } finally {
      setCsvUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      await salesRepPhotos.deletePhoto(photoId);
      toast.success('Photo deleted successfully');
      await loadPhotos();
    } catch (error: any) {
      console.error('Failed to delete photo:', error);
      toast.error(error.response?.data?.error || 'Failed to delete photo');
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

  // Filter photos based on search
  const filteredPhotos = photos.filter(photo =>
    !photoSearchTerm || 
    photo.repEmail.toLowerCase().includes(photoSearchTerm.toLowerCase()) ||
    (photo.repName && photo.repName.toLowerCase().includes(photoSearchTerm.toLowerCase()))
  );

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="py-6 text-center text-gray-500">
          Access denied. Admin role required.
        </div>
        <AdminQuickLogin />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">User & Agent Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage users, roles, and agent photos within your organization
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Agent Photos</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">User Management</h2>
                <p className="text-sm text-gray-500">Create and manage user accounts</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link href="/settings/users/permissions">
                  <Button variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    Manage Permissions
                  </Button>
                </Link>
                <Button variant="default" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New User
              </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white shadow rounded-lg p-4">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search by username or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-40">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as 'admin' | 'agent' | '')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="default">Search</Button>
                  <Button type="button" variant="ghost" onClick={clearFilters}>Clear</Button>
                </div>
              </form>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingUser ? 'Edit User' : 'Create New User'}
                  </h3>
                  <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                </div>
                <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username *
                      </label>
                      <Input
                        value={form.username}
                        onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                        required
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                        required
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password {editingUser ? '(leave blank to keep current)' : '*'}
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                          required={!editingUser}
                          placeholder={editingUser ? 'Enter new password' : 'Enter password'}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {!editingUser && (
                        <p className="mt-1 text-xs text-gray-500">
                          Minimum 8 characters required
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'agent' }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
                        required
                      >
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="default" disabled={saving}>
                      {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Users ({totalCount})
                  </h3>
                  {(searchTerm || roleFilter) && (
                    <span className="text-sm text-gray-500">
                      Filtered results
                    </span>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-400">
                          Loading users...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-400">
                          {searchTerm || roleFilter ? 'No users found matching your criteria.' : 'No users found.'}
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <Link 
                                href={`/settings/users/${u.id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                              >
                                {u.username}
                              </Link>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              u.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <Link href={`/settings/users/${u.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(u)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {u.id !== user?.userId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(u.id)}
                                  disabled={deleting === u.id}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  {deleting === u.id ? (
                                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} users
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Agent Photo Management</h2>
                <p className="text-sm text-gray-500">Upload and manage agent photos for content creation</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowBulkUploadDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button variant="outline" onClick={() => setShowCsvUploadDialog(true)}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  CSV Upload
                </Button>
                <Button variant="default" onClick={() => setShowUploadDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Photo
                </Button>
              </div>
            </div>

            {/* Photo Search */}
            <div className="bg-white shadow rounded-lg p-4">
              <form onSubmit={handlePhotoSearch} className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search by agent email or name..."
                      value={photoSearchTerm}
                      onChange={(e) => setPhotoSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" variant="default">Search</Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setPhotoSearchTerm('');
                    loadPhotos();
                  }}
                >
                  Clear
                </Button>
              </form>
            </div>

            {/* Photos Grid */}
            <div className="bg-white shadow rounded-lg p-6">
              {photoLoading ? (
                <div className="text-center py-8 text-gray-400">
                  Loading agent photos...
                </div>
              ) : filteredPhotos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Agent Photos Displayed</h3>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm">This could be due to:</p>
                    <ul className="text-xs text-left max-w-md mx-auto space-y-1">
                      <li>• No photos uploaded yet</li>
                      <li>• Expired authentication token (try logging out and back in)</li>
                      <li>• Backend database filtering issues</li>
                    </ul>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <Button onClick={() => setShowUploadDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Single Photo
                    </Button>
                    <Button variant="outline" onClick={() => setShowBulkUploadDialog(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Upload
                    </Button>
                    <Button variant="outline" onClick={() => {
                      console.log('Forcing refresh...');
                      loadPhotos();
                    }}>
                      <Search className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredPhotos.map((photo) => (
                    <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                      <div 
                        className="aspect-square bg-gray-100 relative overflow-hidden"
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setShowPreviewDialog(true);
                        }}
                      >
                                                 {getThumbnailUrl(photo, 'small') ? (
                           <img 
                             src={getThumbnailUrl(photo, 'small')} 
                             alt={photo.repName || photo.repEmail || 'Agent photo'}
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                             loading="lazy"
                             onError={(e) => {
                               const target = e.target as HTMLImageElement;
                               target.style.display = 'none';
                               const parent = target.parentElement;
                               if (parent) {
                                 parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200"><svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>';
                               }
                             }}
                           />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center bg-gray-200">
                             <UserCircle className="w-12 h-12 text-gray-400" />
                           </div>
                         )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white rounded-full p-2 shadow-lg">
                              <Eye className="w-4 h-4 text-gray-700" />
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-white shadow-lg h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhoto(photo.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      
                                             <div className="p-3">
                         <h4 className="font-medium text-sm truncate">{photo.repName || 'No Name'}</h4>
                         <p className="text-xs text-gray-500 truncate">{photo.repEmail || 'No Email'}</p>
                                                 <div className="flex items-center justify-between mt-2">
                           <span className="text-xs text-gray-400">
                             {photo.fileSize ? (photo.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown size'}
                           </span>
                           <Badge variant="outline" className="text-xs">
                             {photo.mimeType ? photo.mimeType.split('/')[1]?.toUpperCase() || 'IMG' : 'IMG'}
                           </Badge>
                         </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Upload Dialogs */}
        <SingleUploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleUploadSingle}
          uploading={uploadingPhoto}
        />

        <BulkUploadDialog
          isOpen={showBulkUploadDialog}
          onClose={() => setShowBulkUploadDialog(false)}
          onUpload={handleBulkUpload}
          uploading={bulkUploading}
          progress={uploadProgress}
        />

        <CsvUploadDialog
          isOpen={showCsvUploadDialog}
          onClose={() => setShowCsvUploadDialog(false)}
          onUpload={handleCsvUpload}
          uploading={csvUploading}
          progress={csvProgress}
        />

        <PhotoPreviewDialog
          isOpen={showPreviewDialog}
          onClose={() => setShowPreviewDialog(false)}
          photo={selectedPhoto}
        />
      </div>
    </DashboardLayout>
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
            Upload Agent Photo
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
            <label className="text-sm font-medium">Agent Email *</label>
            <Input
              type="email"
              value={repEmail}
              onChange={(e) => setRepEmail(e.target.value)}
              placeholder="john@company.com"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Agent Name (optional)</label>
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
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="ghost" onClick={() => {
              onClose();
              reset();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={uploading || !file || !repEmail}>
              {uploading ? 'Uploading...' : 'Upload Photo'}
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
  onUpload: (files: FileList, mappings: Array<{filename: string, email: string, name?: string}>) => void;
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
    setMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, [field]: value } : mapping
    ));
  };

  const handleSubmit = () => {
    if (!files || files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    const validMappings = mappings.filter(m => m.email.trim() !== '');
    if (validMappings.length === 0) {
      toast.error('Please provide at least one email mapping');
      return;
    }

    onUpload(files, validMappings);
  };

  const reset = () => {
    setFiles(null);
    setMappings([]);
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
            <Upload className="w-5 h-5 mr-2" />
            Bulk Upload Agent Photos
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Photo Files</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="w-full mt-1 p-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Select multiple image files (max 50)
            </p>
          </div>

          {files && files.length > 0 && (
            <div>
              <label className="text-sm font-medium">Map Files to Agents</label>
              <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
                {mappings.map((mapping, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded">
                    <div>
                      <label className="text-xs text-gray-600">File</label>
                      <p className="text-sm font-medium truncate">{mapping.filename}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Email *</label>
                      <Input
                        type="email"
                        value={mapping.email}
                        onChange={(e) => updateMapping(index, 'email', e.target.value)}
                        placeholder="agent@company.com"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Name</label>
                      <Input
                        value={mapping.name || ''}
                        onChange={(e) => updateMapping(index, 'name', e.target.value)}
                        placeholder="Agent Name"
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {progress && (
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium text-sm mb-2">Upload Results</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Successful: {progress.summary?.successful || 0}
                </div>
                <div className="flex items-center text-red-600">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Failed: {progress.summary?.failed || 0}
                </div>
                <div className="flex items-center text-yellow-600">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Skipped: {progress.summary?.skipped || 0}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="ghost" onClick={() => {
              onClose();
              reset();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={uploading || !files || mappings.filter(m => m.email).length === 0}
            >
              {uploading ? 'Uploading...' : 'Upload Photos'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get the appropriate thumbnail URL
const getThumbnailUrlForDialog = (photo: SalesRepPhoto, size: 'small' | 'medium' | 'large' = 'small') => {
  // Try to get the specific preview size from new structure
  if (photo.previewUrls) {
    const previewUrl = photo.previewUrls[size];
    if (previewUrl) return previewUrl;
    
    // Fallback to other sizes if requested size is not available
    if (size === 'small') {
      return photo.previewUrls.medium || photo.previewUrls.large || photo.thumbnailUrl || photo.url || photo.photoUrl;
    } else if (size === 'medium') {
      return photo.previewUrls.large || photo.previewUrls.small || photo.thumbnailUrl || photo.url || photo.photoUrl;
    } else { // large
      return photo.previewUrls.medium || photo.previewUrls.small || photo.thumbnailUrl || photo.url || photo.photoUrl;
    }
  }
  
  // Fallback to legacy thumbnailUrl, new url field, or original photo
  return photo.thumbnailUrl || photo.url || photo.photoUrl;
};

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
  const [validationResults, setValidationResults] = useState<{
    errors: string[];
    warnings: string[];
    validRows: number;
    totalRows: number;
    isValid: boolean;
  } | null>(null);

  // Update validation when column mapping changes
  useEffect(() => {
    if (csvData && columnMapping.name && columnMapping.email && columnMapping.photoUrl) {
      const results = validateCsvData(csvData.rows, columnMapping, csvData.headers);
      setValidationResults(results);
      setIsValid(results.isValid);
    } else {
      setIsValid(false);
      setValidationResults(null);
    }
  }, [csvData, columnMapping.name, columnMapping.email, columnMapping.photoUrl]);

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
        
        // Auto-detect column mappings with more flexible matching
        const headersLower = headers.map(h => h.toLowerCase().replace(/[_\s-]/g, ''));
        const autoMapping = {
          name: headers[headersLower.findIndex(h => 
            h.includes('name') || h.includes('fullname') || h.includes('repname') || h === 'name'
          )] || null,
          email: headers[headersLower.findIndex(h => 
            h.includes('email') || h.includes('mail') || h === 'email'
          )] || null,
          photoUrl: headers[headersLower.findIndex(h => 
            h.includes('photourl') || h.includes('photo') || h.includes('image') || 
            h.includes('url') || h === 'photourl' || h === 'imageurl' || h === 'url'
          )] || null
        };
        
        setCsvData({
          headers,
          rows,
          preview: rows.slice(0, 5) // First 5 rows for preview
        });
        
        setColumnMapping(autoMapping);
        
        // Debug: log what was found
        console.log('CSV Headers found:', headers);
        console.log('Auto-detected mapping:', autoMapping);
        
        // Check if we have valid mappings
        const hasValidMapping = !!(autoMapping.name && autoMapping.email && autoMapping.photoUrl);
        
        // Perform frontend validation to catch issues early
        if (hasValidMapping) {
          const results = validateCsvData(rows, autoMapping, headers);
          console.log('Frontend validation results:', results);
          setValidationResults(results);
          
          if (results.errors.length > 0) {
            toast.error(`Found ${results.errors.length} validation errors. Check the preview table for details.`);
            setIsValid(false);
          } else {
            setIsValid(true);
            if (results.warnings.length > 0) {
              toast.warning(`Found ${results.warnings.length} warnings. Review before uploading.`);
            }
          }
        } else {
          setIsValid(false);
          setValidationResults(null);
          toast.error(`Auto-detection incomplete. Found headers: ${headers.join(', ')}`);
        }
        
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast.error(`Failed to parse CSV: ${error}`);
      } finally {
        setValidating(false);
      }
    }
  };

  // Frontend validation function that mirrors backend validation
  const validateCsvData = (rows: string[][], columnMapping: any, headers: string[]) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validRows = 0;

    const nameIndex = headers.indexOf(columnMapping.name!);
    const emailIndex = headers.indexOf(columnMapping.email!);
    const photoUrlIndex = headers.indexOf(columnMapping.photoUrl!);

    rows.forEach((row, index) => {
      const rowNum = index + 2; // +2 because index starts at 0 and we skip header
      const name = row[nameIndex] || '';
      const email = row[emailIndex] || '';
      const photoUrl = row[photoUrlIndex] || '';

      let hasRowErrors = false;

      // Validate email (required)
      if (!email || !email.trim()) {
        errors.push(`Row ${rowNum}: Email is required`);
        hasRowErrors = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.push(`Row ${rowNum}: Invalid email format: ${email}`);
        hasRowErrors = true;
      }

      // Validate photo URL (required and must be valid format)
      if (!photoUrl || !photoUrl.trim()) {
        errors.push(`Row ${rowNum}: Photo URL is required`);
        hasRowErrors = true;
      } else {
        const trimmedUrl = photoUrl.trim();
        const isValidUrl = trimmedUrl.startsWith('http://') || 
                          trimmedUrl.startsWith('https://') || 
                          trimmedUrl.startsWith('data:');
        
        if (!isValidUrl) {
          if (trimmedUrl.startsWith('ftp://')) {
            errors.push(`Row ${rowNum}: FTP URLs are not supported. Use HTTP/HTTPS: ${trimmedUrl}`);
          } else if (trimmedUrl.includes('://')) {
            errors.push(`Row ${rowNum}: Unsupported protocol. Use HTTP/HTTPS/data: ${trimmedUrl}`);
          } else if (trimmedUrl.includes('.')) {
            errors.push(`Row ${rowNum}: URL must include protocol (http:// or https://): ${trimmedUrl}`);
          } else {
            errors.push(`Row ${rowNum}: Invalid photo URL format. Must start with http://, https://, or data:: ${trimmedUrl}`);
          }
          hasRowErrors = true;
        }
      }

      // Validate name (warning if empty)
      if (!name || !name.trim()) {
        warnings.push(`Row ${rowNum}: Name is empty (will use email as display name)`);
      }

      if (!hasRowErrors) {
        validRows++;
      }
    });

    return {
      errors,
      warnings,
      validRows,
      totalRows: rows.length,
      isValid: errors.length === 0 && validRows > 0
    };
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
    setValidationResults(null);
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

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Photo URL Requirements
            </h4>
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>Valid formats:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><code className="bg-white px-1 rounded">https://example.com/photo.jpg</code></li>
                <li><code className="bg-white px-1 rounded">http://example.com/photo.png</code></li>
                <li><code className="bg-white px-1 rounded">data:image/jpeg;base64,...</code></li>
              </ul>
              <p><strong>Common issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Missing protocol: <code className="bg-white px-1 rounded">example.com/photo.jpg</code> ❌ → <code className="bg-white px-1 rounded">https://example.com/photo.jpg</code> ✅</li>
                <li>FTP URLs not supported: <code className="bg-white px-1 rounded">ftp://...</code> ❌</li>
                <li>Empty cells or spaces only ❌</li>
              </ul>
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
              
              {/* Validation Summary */}
              {validationResults && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Validation Summary
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="text-lg font-bold text-blue-700">{validationResults.totalRows}</div>
                      <div className="text-xs text-blue-600">Total Rows</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                      <div className="text-lg font-bold text-green-700">{validationResults.validRows}</div>
                      <div className="text-xs text-green-600">Valid Rows</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded border border-red-200">
                      <div className="text-lg font-bold text-red-700">{validationResults.errors.length}</div>
                      <div className="text-xs text-red-600">Errors</div>
                    </div>
                  </div>

                  {validationResults.errors.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Errors (must fix to proceed):
                      </h5>
                      <div className="text-xs text-red-600 bg-red-50 p-3 rounded max-h-32 overflow-y-auto border border-red-200">
                        {validationResults.errors.slice(0, 10).map((error, index) => (
                          <div key={index} className="mb-1">• {error}</div>
                        ))}
                        {validationResults.errors.length > 10 && (
                          <div className="mt-2 text-red-500 font-medium">
                            ... and {validationResults.errors.length - 10} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {validationResults.warnings.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-yellow-700 mb-2 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Warnings (recommended to review):
                      </h5>
                      <div className="text-xs text-yellow-600 bg-yellow-50 p-3 rounded max-h-20 overflow-y-auto border border-yellow-200">
                        {validationResults.warnings.slice(0, 5).map((warning, index) => (
                          <div key={index} className="mb-1">• {warning}</div>
                        ))}
                        {validationResults.warnings.length > 5 && (
                          <div className="mt-2 text-yellow-600 font-medium">
                            ... and {validationResults.warnings.length - 5} more warnings
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Row</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Photo URL</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.preview.map((row, index) => {
                      const nameIndex = csvData.headers.indexOf(columnMapping.name!);
                      const emailIndex = csvData.headers.indexOf(columnMapping.email!);
                      const photoUrlIndex = csvData.headers.indexOf(columnMapping.photoUrl!);
                      
                      const rowNum = index + 2; // +2 because index starts at 0 and we skip header
                      const name = row[nameIndex] || '';
                      const email = row[emailIndex] || '';
                      const photoUrl = row[photoUrlIndex] || '';
                      
                      // Validate this row
                      const warnings = [];
                      const errors = [];
                      
                      if (!name.trim()) {
                        warnings.push('Name is empty');
                      }
                      
                      if (!email.trim()) {
                        errors.push('Email is required');
                      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        errors.push('Invalid email format');
                      }
                      
                      if (!photoUrl.trim()) {
                        errors.push('Photo URL is required');
                      } else {
                        const trimmedUrl = photoUrl.trim();
                        if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('data:')) {
                          if (trimmedUrl.startsWith('ftp://')) {
                            errors.push('FTP URLs not supported');
                          } else if (trimmedUrl.includes('://')) {
                            errors.push('Unsupported protocol');
                          } else if (trimmedUrl.includes('.')) {
                            errors.push('Missing protocol (http://)');
                          } else {
                            errors.push('Invalid URL format');
                          }
                        }
                      }
                      
                      const hasErrors = errors.length > 0;
                      const hasWarnings = warnings.length > 0;
                      
                      return (
                        <tr key={index} className={`border-t ${hasErrors ? 'bg-red-50' : hasWarnings ? 'bg-yellow-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-3 py-2 text-gray-500">{rowNum}</td>
                          <td className="px-3 py-2">
                            {name || <span className="text-gray-400 italic">-</span>}
                          </td>
                          <td className="px-3 py-2">
                            <span className={!email ? 'text-red-500' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'text-red-500' : ''}>
                              {email || <span className="text-gray-400 italic">-</span>}
                            </span>
                          </td>
                          <td className="px-3 py-2 truncate max-w-32" title={photoUrl}>
                            {photoUrl ? (
                              <span className={`${hasErrors ? 'text-red-600' : 'text-blue-600'}`}>
                                {photoUrl.substring(0, 30)}...
                              </span>
                            ) : (
                              <span className="text-red-500 italic">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {hasErrors ? (
                              <div className="flex items-center space-x-1">
                                <AlertCircle className="w-3 h-3 text-red-500" />
                                <span className="text-red-600 text-xs">Error</span>
                              </div>
                            ) : hasWarnings ? (
                              <div className="flex items-center space-x-1">
                                <AlertCircle className="w-3 h-3 text-yellow-500" />
                                <span className="text-yellow-600 text-xs">Warning</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-green-600 text-xs">Valid</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Valid</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 text-yellow-500" />
                    <span>Warning (will process but may have issues)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span>Error (will fail to process)</span>
                  </div>
                </div>
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

// Photo Preview Dialog Component
function PhotoPreviewDialog({ 
  isOpen, 
  onClose, 
  photo 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  photo: SalesRepPhoto | null;
}) {
  if (!photo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Agent Photo Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
                     <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
             {getThumbnailUrlForDialog(photo, 'large') ? (
               <img 
                 src={getThumbnailUrlForDialog(photo, 'large')} 
                 alt={photo.repName || photo.repEmail || 'Agent photo'}
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   const target = e.target as HTMLImageElement;
                   target.style.display = 'none';
                   const parent = target.parentElement;
                   if (parent) {
                     parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200"><svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>';
                   }
                 }}
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-gray-200">
                 <UserCircle className="w-12 h-12 text-gray-400" />
               </div>
             )}
           </div>
          
          <div className="space-y-2">
                         <div className="flex items-center space-x-2">
               <Mail className="w-4 h-4 text-gray-500" />
               <span className="text-sm">{photo.repEmail || 'No Email'}</span>
             </div>
            {photo.repName && (
              <div className="flex items-center space-x-2">
                <UserCircle className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{photo.repName}</span>
              </div>
            )}
                         <div className="flex items-center space-x-2">
               <ImageIcon className="w-4 h-4 text-gray-500" />
               <span className="text-sm">
                 {photo.fileSize ? (photo.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown size'} • {photo.mimeType || 'Unknown type'}
               </span>
             </div>
                         <div className="flex items-center space-x-2">
               <FileText className="w-4 h-4 text-gray-500" />
               <span className="text-sm">
                 Uploaded {photo.uploadedAt ? new Date(photo.uploadedAt).toLocaleDateString() : 'Unknown date'}
               </span>
             </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 