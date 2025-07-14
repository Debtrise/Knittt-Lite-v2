'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { useAuthStore } from '@/app/store/authStore';
import { useDevAuth } from '@/app/hooks/useDevAuth';
import api from '@/app/lib/api';
import toast from 'react-hot-toast';
import { 
  Shield, Users, Search, Edit, Save, X, Check, AlertTriangle,
  Settings, Database, Phone, MessageSquare, Mail, FileText,
  BarChart3, Webhook, Calendar, Camera, Store, Activity,
  Lock, Unlock, ChevronDown, ChevronRight
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'agent';
  tenantId: string;
  permissions?: UserPermissions;
}

interface UserPermissions {
  // System Administration
  system: {
    viewSettings: boolean;
    manageUsers: boolean;
    manageRoles: boolean;
    viewSystemLogs: boolean;
    manageIntegrations: boolean;
  };
  
  // Lead Management
  leads: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    import: boolean;
    assignToCampaigns: boolean;
  };
  
  // Call Management
  calls: {
    view: boolean;
    initiate: boolean;
    viewRecordings: boolean;
    downloadRecordings: boolean;
    manageDIDs: boolean;
    manageDialplans: boolean;
  };
  
  // SMS & Messaging
  messaging: {
    sendSMS: boolean;
    viewConversations: boolean;
    manageTemplates: boolean;
    manageCampaigns: boolean;
    viewAnalytics: boolean;
  };
  
  // Journey Builder
  journeys: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    publish: boolean;
    viewAnalytics: boolean;
  };
  
  // Reporting & Analytics
  reports: {
    viewDashboard: boolean;
    createReports: boolean;
    exportReports: boolean;
    scheduleReports: boolean;
    viewSystemMetrics: boolean;
  };
  
  // Content Creation
  content: {
    viewTemplates: boolean;
    createTemplates: boolean;
    editTemplates: boolean;
    deleteTemplates: boolean;
    manageAssets: boolean;
    publishContent: boolean;
  };
  
  // Marketplace
  marketplace: {
    viewListings: boolean;
    purchaseLeads: boolean;
    sellLeads: boolean;
    manageOrders: boolean;
    viewAnalytics: boolean;
  };
  
  // Webhooks & Integrations
  webhooks: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    test: boolean;
    viewLogs: boolean;
  };
}

const PERMISSION_GROUPS = [
  {
    key: 'system',
    name: 'System Administration',
    icon: <Settings className="w-5 h-5" />,
    color: 'bg-red-500',
    permissions: [
      { key: 'viewSettings', name: 'View System Settings' },
      { key: 'manageUsers', name: 'Manage Users' },
      { key: 'manageRoles', name: 'Manage Roles & Permissions' },
      { key: 'viewSystemLogs', name: 'View System Logs' },
      { key: 'manageIntegrations', name: 'Manage Integrations' },
    ]
  },
  {
    key: 'leads',
    name: 'Lead Management',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-blue-500',
    permissions: [
      { key: 'view', name: 'View Leads' },
      { key: 'create', name: 'Create Leads' },
      { key: 'edit', name: 'Edit Leads' },
      { key: 'delete', name: 'Delete Leads' },
      { key: 'export', name: 'Export Leads' },
      { key: 'import', name: 'Import Leads' },
      { key: 'assignToCampaigns', name: 'Assign to Campaigns' },
    ]
  },
  {
    key: 'calls',
    name: 'Call Management',
    icon: <Phone className="w-5 h-5" />,
    color: 'bg-green-500',
    permissions: [
      { key: 'view', name: 'View Call History' },
      { key: 'initiate', name: 'Initiate Calls' },
      { key: 'viewRecordings', name: 'View Recordings' },
      { key: 'downloadRecordings', name: 'Download Recordings' },
      { key: 'manageDIDs', name: 'Manage DIDs' },
      { key: 'manageDialplans', name: 'Manage Dialplans' },
    ]
  },
  {
    key: 'messaging',
    name: 'SMS & Messaging',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'bg-purple-500',
    permissions: [
      { key: 'sendSMS', name: 'Send SMS Messages' },
      { key: 'viewConversations', name: 'View Conversations' },
      { key: 'manageTemplates', name: 'Manage SMS Templates' },
      { key: 'manageCampaigns', name: 'Manage SMS Campaigns' },
      { key: 'viewAnalytics', name: 'View SMS Analytics' },
    ]
  },
  {
    key: 'journeys',
    name: 'Journey Builder',
    icon: <Activity className="w-5 h-5" />,
    color: 'bg-indigo-500',
    permissions: [
      { key: 'view', name: 'View Journeys' },
      { key: 'create', name: 'Create Journeys' },
      { key: 'edit', name: 'Edit Journeys' },
      { key: 'delete', name: 'Delete Journeys' },
      { key: 'publish', name: 'Publish Journeys' },
      { key: 'viewAnalytics', name: 'View Journey Analytics' },
    ]
  },
  {
    key: 'reports',
    name: 'Reporting & Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'bg-yellow-500',
    permissions: [
      { key: 'viewDashboard', name: 'View Dashboard' },
      { key: 'createReports', name: 'Create Reports' },
      { key: 'exportReports', name: 'Export Reports' },
      { key: 'scheduleReports', name: 'Schedule Reports' },
      { key: 'viewSystemMetrics', name: 'View System Metrics' },
    ]
  },
  {
    key: 'content',
    name: 'Content Creation',
    icon: <Camera className="w-5 h-5" />,
    color: 'bg-pink-500',
    permissions: [
      { key: 'viewTemplates', name: 'View Templates' },
      { key: 'createTemplates', name: 'Create Templates' },
      { key: 'editTemplates', name: 'Edit Templates' },
      { key: 'deleteTemplates', name: 'Delete Templates' },
      { key: 'manageAssets', name: 'Manage Assets' },
      { key: 'publishContent', name: 'Publish Content' },
    ]
  },
  {
    key: 'marketplace',
    name: 'Marketplace',
    icon: <Store className="w-5 h-5" />,
    color: 'bg-orange-500',
    permissions: [
      { key: 'viewListings', name: 'View Listings' },
      { key: 'purchaseLeads', name: 'Purchase Leads' },
      { key: 'sellLeads', name: 'Sell Leads' },
      { key: 'manageOrders', name: 'Manage Orders' },
      { key: 'viewAnalytics', name: 'View Marketplace Analytics' },
    ]
  },
  {
    key: 'webhooks',
    name: 'Webhooks & Integrations',
    icon: <Webhook className="w-5 h-5" />,
    color: 'bg-teal-500',
    permissions: [
      { key: 'view', name: 'View Webhooks' },
      { key: 'create', name: 'Create Webhooks' },
      { key: 'edit', name: 'Edit Webhooks' },
      { key: 'delete', name: 'Delete Webhooks' },
      { key: 'test', name: 'Test Webhooks' },
      { key: 'viewLogs', name: 'View Webhook Logs' },
    ]
  },
];

// Default permissions for roles
const DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    system: { viewSettings: true, manageUsers: true, manageRoles: true, viewSystemLogs: true, manageIntegrations: true },
    leads: { view: true, create: true, edit: true, delete: true, export: true, import: true, assignToCampaigns: true },
    calls: { view: true, initiate: true, viewRecordings: true, downloadRecordings: true, manageDIDs: true, manageDialplans: true },
    messaging: { sendSMS: true, viewConversations: true, manageTemplates: true, manageCampaigns: true, viewAnalytics: true },
    journeys: { view: true, create: true, edit: true, delete: true, publish: true, viewAnalytics: true },
    reports: { viewDashboard: true, createReports: true, exportReports: true, scheduleReports: true, viewSystemMetrics: true },
    content: { viewTemplates: true, createTemplates: true, editTemplates: true, deleteTemplates: true, manageAssets: true, publishContent: true },
    marketplace: { viewListings: true, purchaseLeads: true, sellLeads: true, manageOrders: true, viewAnalytics: true },
    webhooks: { view: true, create: true, edit: true, delete: true, test: true, viewLogs: true },
  },
  agent: {
    system: { viewSettings: false, manageUsers: false, manageRoles: false, viewSystemLogs: false, manageIntegrations: false },
    leads: { view: true, create: true, edit: true, delete: false, export: true, import: false, assignToCampaigns: false },
    calls: { view: true, initiate: true, viewRecordings: true, downloadRecordings: false, manageDIDs: false, manageDialplans: false },
    messaging: { sendSMS: true, viewConversations: true, manageTemplates: false, manageCampaigns: false, viewAnalytics: false },
    journeys: { view: true, create: false, edit: false, delete: false, publish: false, viewAnalytics: true },
    reports: { viewDashboard: true, createReports: false, exportReports: true, scheduleReports: false, viewSystemMetrics: false },
    content: { viewTemplates: true, createTemplates: false, editTemplates: false, deleteTemplates: false, manageAssets: false, publishContent: false },
    marketplace: { viewListings: true, purchaseLeads: false, sellLeads: false, manageOrders: false, viewAnalytics: false },
    webhooks: { view: false, create: false, edit: false, delete: false, test: false, viewLogs: false },
  },
};

// Utility functions to convert between flat and nested permission formats
const flattenPermissions = (permissions: UserPermissions): Record<string, boolean> => {
  const flatPermissions: Record<string, boolean> = {};
  
  Object.entries(permissions).forEach(([groupKey, groupPerms]) => {
    Object.entries(groupPerms).forEach(([permKey, value]) => {
      const flatKey = `${groupKey}_${permKey}`;
      flatPermissions[flatKey] = value as boolean;
    });
  });
  
  return flatPermissions;
};

const unflattenPermissions = (flatPermissions: Record<string, boolean>): UserPermissions => {
  const permissions: any = {};
  
  // Initialize with default structure
  PERMISSION_GROUPS.forEach(group => {
    permissions[group.key] = {};
    group.permissions.forEach(perm => {
      permissions[group.key][perm.key] = false;
    });
  });
  
  // Fill in actual values from flat permissions
  Object.entries(flatPermissions).forEach(([flatKey, value]) => {
    const [groupKey, permKey] = flatKey.split('_');
    if (permissions[groupKey] && permKey) {
      permissions[groupKey][permKey] = value;
    }
  });
  
  return permissions as UserPermissions;
};

export default function UserPermissionsPage() {
  const { user, isAuthenticated } = useAuthStore();
  useDevAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<UserPermissions | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['leads', 'calls']));

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    fetchUsers();
  }, [isAuthenticated, user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.users.list({ limit: 100 });
      const userData = Array.isArray(response.data) ? response.data : response.data.users || [];
      
      const usersWithPermissions = userData.map((u: any) => {
        let permissions: UserPermissions;
        
        if (u.permissions && typeof u.permissions === 'object') {
          // Check if permissions are flat (from API) or nested (default)
          const hasNestedStructure = Object.values(u.permissions).some(val => typeof val === 'object');
          
          if (hasNestedStructure) {
            // Already in nested format
            permissions = u.permissions as UserPermissions;
          } else {
            // Flat format from API, convert to nested
            permissions = unflattenPermissions(u.permissions);
          }
        } else {
          // No permissions, use defaults
          permissions = DEFAULT_PERMISSIONS[u.role] || DEFAULT_PERMISSIONS.agent;
        }
        
        return {
          ...u,
          permissions
        };
      });
      
      setUsers(usersWithPermissions);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setEditingPermissions(user.permissions || DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.agent);
  };

  const handlePermissionChange = (groupKey: string, permissionKey: string, value: boolean) => {
    if (!editingPermissions) return;
    
    setEditingPermissions(prev => ({
      ...prev!,
      [groupKey]: {
        ...prev![groupKey as keyof UserPermissions],
        [permissionKey]: value
      }
    }));
  };

  const handleGroupToggle = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || !editingPermissions) return;
    
    setSaving(true);
    try {
      // Flatten the permissions structure for the API
      const flatPermissions = flattenPermissions(editingPermissions);
      
      // Log the permissions being sent to API for debugging
      console.log('Saving permissions for user:', selectedUser.username);
      console.log('Nested permissions:', editingPermissions);
      console.log('Flat permissions for API:', flatPermissions);
      
      // Call the actual API endpoint
      const response = await api.users.updateRolePermissions(selectedUser.id.toString(), {
        role: selectedUser.role,
        permissions: flatPermissions
      });
      
      // Update local state with the response data
      const updatedUser = { ...selectedUser, permissions: editingPermissions };
      const updatedUsers = users.map(u => 
        u.id === selectedUser.id ? updatedUser : u
      );
      
      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
      
      toast.success('Permissions updated successfully');
    } catch (error: any) {
      console.error('Failed to save permissions:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          'Failed to save permissions';
      toast.error(errorMessage);
    }
    setSaving(false);
  };

  const handleResetToDefaults = () => {
    if (!selectedUser) return;
    
    const defaultPerms = DEFAULT_PERMISSIONS[selectedUser.role] || DEFAULT_PERMISSIONS.agent;
    setEditingPermissions(defaultPerms);
  };

  const filteredUsers = users.filter(user =>
    !searchTerm || 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const countPermissions = (permissions: UserPermissions) => {
    let granted = 0;
    let total = 0;
    
    PERMISSION_GROUPS.forEach(group => {
      group.permissions.forEach(perm => {
        total++;
        if (permissions[group.key as keyof UserPermissions]?.[perm.key]) {
          granted++;
        }
      });
    });
    
    return { granted, total };
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="py-6 text-center text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Access Denied</h3>
          <p>Admin role required to manage user permissions.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Shield className="w-6 h-6 mr-3 text-blue-600" />
            User Permissions
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage detailed permissions for users across all system features
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-gray-500">
                    Loading users...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No users found
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const permCount = countPermissions(u.permissions || DEFAULT_PERMISSIONS.agent);
                    const isSelected = selectedUser?.id === u.id;
                    
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleUserSelect(u)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{u.username}</h4>
                            <p className="text-sm text-gray-500">{u.email}</p>
                            <div className="flex items-center mt-1 space-x-2">
                              <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className="text-xs">
                                {u.role}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {permCount.granted}/{permCount.total} permissions
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="ml-2">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Permissions Editor */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <Card>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">
                        Permissions for {selectedUser.username}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Manage access rights and capabilities
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editingPermissions) {
                            const payload = {
                              role: selectedUser?.role,
                              permissions: flattenPermissions(editingPermissions)
                            };
                            console.log('API Payload:', payload);
                            alert('API payload logged to console. Check developer tools.');
                          }
                        }}
                        disabled={saving}
                      >
                        View API Payload
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetToDefaults}
                        disabled={saving}
                      >
                        Reset to Defaults
                      </Button>
                      <Button
                        onClick={handleSavePermissions}
                        disabled={saving}
                        className="min-w-[100px]"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {PERMISSION_GROUPS.map((group) => {
                      const isExpanded = expandedGroups.has(group.key);
                      const groupPermissions = editingPermissions?.[group.key as keyof UserPermissions];
                      const enabledCount = group.permissions.filter(perm => 
                        groupPermissions?.[perm.key]
                      ).length;

                      return (
                        <div key={group.key} className="border border-gray-200 rounded-lg">
                          <div
                            onClick={() => handleGroupToggle(group.key)}
                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-lg ${group.color} flex items-center justify-center text-white mr-3`}>
                                  {group.icon}
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                                  <p className="text-sm text-gray-500">
                                    {enabledCount}/{group.permissions.length} permissions enabled
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                {enabledCount > 0 && (
                                  <Badge variant="outline" className="mr-2 text-xs">
                                    {enabledCount} enabled
                                  </Badge>
                                )}
                                {isExpanded ? (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                {group.permissions.map((permission) => {
                                  const isEnabled = groupPermissions?.[permission.key] || false;
                                  
                                  return (
                                    <div
                                      key={permission.key}
                                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div className="flex items-center">
                                        <div className={`w-4 h-4 rounded mr-3 flex items-center justify-center ${
                                          isEnabled ? 'bg-green-500 text-white' : 'bg-gray-300'
                                        }`}>
                                          {isEnabled ? (
                                            <Check className="w-3 h-3" />
                                          ) : (
                                            <X className="w-3 h-3 text-gray-500" />
                                          )}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                          {permission.name}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handlePermissionChange(group.key, permission.key, !isEnabled)}
                                        className={`w-12 h-6 rounded-full transition-colors flex items-center ${
                                          isEnabled ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                          isEnabled ? 'translate-x-7' : 'translate-x-1'
                                        }`} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-12 text-center">
                  <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a User
                  </h3>
                  <p className="text-gray-500">
                    Choose a user from the list to view and edit their permissions
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 