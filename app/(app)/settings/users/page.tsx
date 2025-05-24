'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { useAuthStore } from '@/app/store/authStore';
import api from '@/app/lib/api';
import toast from 'react-hot-toast';

const ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Agent', value: 'agent' },
];

export default function UserManagementPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    role: 'agent',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    fetchUsers();
  }, [isAuthenticated, user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Replace with real API call if available
      const res = await api.tenants.get(user.tenantId);
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.auth.register({
        ...form,
        tenantId: user.tenantId,
      });
      toast.success('User created');
      setShowForm(false);
      setForm({ username: '', password: '', email: '', role: 'agent' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create user');
    }
    setSaving(false);
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="py-6 text-center text-gray-500">Access denied.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6 max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <Button variant="primary" onClick={() => setShowForm(true)}>New User</Button>
        </div>
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white shadow rounded-lg p-6 mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="border rounded px-3 py-2 w-full">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Create User'}</Button>
            </div>
          </form>
        )}
        <div className="bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={3} className="text-center py-8 text-gray-400">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-gray-400">No users found.</td></tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{u.role}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
} 