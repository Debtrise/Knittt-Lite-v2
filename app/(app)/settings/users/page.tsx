'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { useAuthStore } from '@/app/store/authStore';
import api from '@/app/lib/api';
import toast from 'react-hot-toast';
import { Edit, Trash2, Plus, Search, Eye, EyeOff, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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

export default function UserManagementPage() {
  const { user, isAuthenticated } = useAuthStore();
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
  
  // Pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'admin' | 'agent' | ''>('');
  const [limit] = useState(10);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    fetchUsers();
  }, [isAuthenticated, user, currentPage, searchTerm, roleFilter]);

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

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="py-6 text-center text-gray-500">
          Access denied. Admin role required.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6 max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage users and their roles within your organization
            </p>
          </div>
          <Button variant="brand" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New User
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
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
              <Button type="submit" variant="brand">Search</Button>
              <Button type="button" variant="ghost" onClick={clearFilters}>Clear</Button>
            </div>
          </form>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
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
                <Button type="submit" variant="brand" disabled={saving}>
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
      </div>
    </DashboardLayout>
  );
} 