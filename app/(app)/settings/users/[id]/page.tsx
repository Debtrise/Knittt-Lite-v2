'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { useAuthStore } from '@/app/store/authStore';
import api from '@/app/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Save, X, User, Mail, Calendar, Shield, Eye, EyeOff } from 'lucide-react';

interface UserDetails {
  id: number;
  username: string;
  email: string;
  tenantId: string;
  role: 'admin' | 'agent';
  createdAt: string;
  updatedAt: string;
  Tenant?: {
    id: string;
    name: string;
  };
}

interface EditFormData {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'agent';
}

const ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Agent', value: 'agent' },
];

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [editForm, setEditForm] = useState<EditFormData>({
    username: '',
    email: '',
    password: '',
    role: 'agent',
  });

  const userId = params.id as string;

  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'admin') {
      router.push('/settings/users');
      return;
    }
    fetchUserDetails();
  }, [isAuthenticated, currentUser, userId, router]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const response = await api.users.get(userId);
      const userData = response.data;
      setUserDetails(userData);
      setEditForm({
        username: userData.username,
        email: userData.email,
        password: '',
        role: userData.role,
      });
    } catch (err: any) {
      console.error('Failed to load user details:', err);
      toast.error(err?.response?.data?.error || 'Failed to load user details');
      router.push('/settings/users');
    }
    setLoading(false);
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    if (userDetails) {
      setEditForm({
        username: userDetails.username,
        email: userDetails.email,
        password: '',
        role: userDetails.role,
      });
    }
    setEditing(false);
    setShowPassword(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails) return;

    setSaving(true);
    try {
      const updateData: any = {
        username: editForm.username,
        email: editForm.email,
        role: editForm.role,
      };

      // Only include password if it's provided
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      const response = await api.users.update(userId, updateData);
      
      // Handle different response formats
      if (response.data.user) {
        setUserDetails(response.data.user);
      } else {
        // Update local state if no user object returned
        setUserDetails(prev => prev ? {
          ...prev,
          username: editForm.username,
          email: editForm.email,
          role: editForm.role,
          updatedAt: new Date().toISOString()
        } : null);
      }
      
      setEditing(false);
      setShowPassword(false);
      
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success('User updated successfully');
      }
    } catch (err: any) {
      console.error('Failed to update user:', err);
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          'Failed to update user. This feature may not be fully implemented yet.';
      toast.error(errorMessage);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!userDetails) return;
    
    if (userDetails.id === currentUser?.userId) {
      toast.error('You cannot delete your own account');
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${userDetails.username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.users.delete(userId);
      
      if (response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.success('User deleted successfully');
      }
      
      router.push('/settings/users');
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          'Failed to delete user. This feature may not be fully implemented yet.';
      toast.error(errorMessage);
    }
  };

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="py-6 text-center text-gray-500">
          Access denied. Admin role required.
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!userDetails) {
    return (
      <DashboardLayout>
        <div className="py-6 text-center text-gray-500">
          User not found.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/settings/users')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Users
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">User Details</h1>
              <p className="mt-1 text-sm text-gray-500">
                View and manage user information
              </p>
            </div>
            <div className="flex gap-2">
              {!editing ? (
                <>
                  <Button variant="brand" onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit User
                  </Button>
                  {userDetails.id !== currentUser?.userId && (
                    <Button variant="destructive" onClick={handleDelete}>
                      Delete User
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleCancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button variant="brand" onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">User Information</h2>
              </div>
              <div className="p-6">
                {editing ? (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username *
                        </label>
                        <Input
                          value={editForm.username}
                          onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
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
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password (leave blank to keep current)
                        </label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={editForm.password}
                            onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Enter new password"
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
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role *
                        </label>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'agent' }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
                          required
                        >
                          {ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Username</p>
                          <p className="text-lg text-gray-900">{userDetails.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="text-lg text-gray-900">{userDetails.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Role</p>
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            userDetails.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {userDetails.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Member Since</p>
                          <p className="text-lg text-gray-900">
                            {new Date(userDetails.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    {userDetails.Tenant && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Organization</p>
                            <p className="text-lg text-gray-900">{userDetails.Tenant.name}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Stats/Activity */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Account Status</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Status</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">
                    {new Date(userDetails.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">User ID</p>
                  <p className="text-sm text-gray-900 font-mono">{userDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tenant ID</p>
                  <p className="text-sm text-gray-900 font-mono">{userDetails.tenantId}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    // TODO: Implement reset password functionality
                    toast('Reset password functionality coming soon');
                  }}
                >
                  Reset Password
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    // TODO: Implement view activity functionality
                    toast('View activity functionality coming soon');
                  }}
                >
                  View Activity Log
                </Button>
                {userDetails.id !== currentUser?.userId && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleDelete}
                  >
                    Delete User
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 