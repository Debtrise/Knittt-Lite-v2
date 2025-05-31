'use client';

import { useState, useEffect } from 'react';
import { transferGroups } from '@/app/lib/api';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Phone, Settings } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';

interface TransferNumber {
  id: string;
  phoneNumber: string;
  name: string;
  priority?: number;
  weight?: number;
  isActive: boolean;
  businessHours?: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
  metadata?: Record<string, any>;
}

interface TransferGroup {
  id: string;
  name: string;
  description: string;
  brand: string | null;
  ingroup: string | null;
  type: 'roundrobin' | 'simultaneous' | 'priority' | 'percentage';
  isActive: boolean;
  settings: {
    ringTimeout: number;
    voicemailEnabled: boolean;
    callRecording: boolean;
  };
  numbers: TransferNumber[];
}

export default function TransferGroupsPage() {
  const [groups, setGroups] = useState<TransferGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showNumberForm, setShowNumberForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TransferGroup | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    brand: string;
    ingroup: string;
    type: TransferGroup['type'];
    isActive: boolean;
    settings: {
      ringTimeout: number;
      voicemailEnabled: boolean;
      callRecording: boolean;
    };
  }>(
    {
      name: '',
      description: '',
      brand: '',
      ingroup: '',
      type: 'roundrobin',
      isActive: true,
      settings: {
        ringTimeout: 30,
        voicemailEnabled: false,
        callRecording: true,
      },
    }
  );
  const [numberFormData, setNumberFormData] = useState({
    phoneNumber: '',
    name: '',
    priority: 1,
    weight: 1,
    isActive: true,
    businessHours: {},
    metadata: {},
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await transferGroups.list({ limit: 100 });
      const groupsData = response.data.groups || [];
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error) {
      toast.error('Failed to load transfer groups');
      console.error(error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure brand and ingroup are strings, not null
      const submitData = {
        ...formData,
        brand: formData.brand || 'default',  // Use 'default' if empty
        ingroup: formData.ingroup || 'default',  // Use 'default' if empty
      };

      if (selectedGroup) {
        await transferGroups.update(selectedGroup.id, submitData);
        toast.success('Transfer group updated successfully');
      } else {
        await transferGroups.create(submitData);
        toast.success('Transfer group created successfully');
      }
      setShowForm(false);
      setSelectedGroup(null);
      setFormData({
        name: '',
        description: '',
        brand: '',
        ingroup: '',
        type: 'roundrobin',
        isActive: true,
        settings: {
          ringTimeout: 30,
          voicemailEnabled: false,
          callRecording: true,
        },
      });
      await loadGroups();
    } catch (error) {
      toast.error(selectedGroup ? 'Failed to update transfer group' : 'Failed to create transfer group');
      console.error(error);
    }
  };

  const handleNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) {
      toast.error('No transfer group selected');
      return;
    }

    try {
      // Validate phone number format
      const phoneNumber = numberFormData.phoneNumber.trim();
      if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
        toast.error('Please enter a valid phone number');
        return;
      }

      await transferGroups.addNumber(selectedGroup.id, {
        ...numberFormData,
        phoneNumber,
      });
      toast.success('Transfer number added successfully');
      setShowNumberForm(false);
      setNumberFormData({
        phoneNumber: '',
        name: '',
        priority: 1,
        weight: 1,
        isActive: true,
        businessHours: {},
        metadata: {},
      });
      await loadGroups();
    } catch (error) {
      toast.error('Failed to add transfer number');
      console.error(error);
    }
  };

  const handleEdit = (group: TransferGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      brand: group.brand || '',
      ingroup: group.ingroup || '',
      type: group.type,
      isActive: group.isActive,
      settings: group.settings,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transfer group?')) return;
    try {
      await transferGroups.delete(id);
      toast.success('Transfer group deleted successfully');
      await loadGroups();
    } catch (error) {
      toast.error('Failed to delete transfer group');
      console.error(error);
    }
  };

  const handleAddNumber = (group: TransferGroup) => {
    setSelectedGroup(group);
    setShowNumberForm(true);
  };

  const handleDeleteNumber = async (groupId: string, numberId: string) => {
    if (!confirm('Are you sure you want to remove this number?')) return;
    try {
      await transferGroups.removeNumber(groupId, numberId);
      toast.success('Transfer number removed successfully');
      await loadGroups();
    } catch (error) {
      toast.error('Failed to remove transfer number');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Transfer Groups</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            New Transfer Group
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{selectedGroup ? 'Edit Transfer Group' : 'Create Transfer Group'}</CardTitle>
              <CardDescription>
                Configure a transfer group with brand and ingroup settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>Name</label>
                    <Input
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={value => setFormData(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="roundrobin">Round Robin</SelectItem>
                        <SelectItem value="simultaneous">Simultaneous</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>Brand (optional)</label>
                    <Input
                      value={formData.brand}
                      onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Leave empty for all brands"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Ingroup (optional)</label>
                    <Input
                      value={formData.ingroup}
                      onChange={e => setFormData(prev => ({ ...prev, ingroup: e.target.value }))}
                      placeholder="Leave empty for all ingroups"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label>Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label>Ring Timeout (seconds)</label>
                    <Input
                      type="number"
                      value={formData.settings.ringTimeout}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, ringTimeout: parseInt(e.target.value) }
                      }))}
                      min={1}
                      max={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Voicemail</label>
                    <Select
                      value={formData.settings.voicemailEnabled ? 'true' : 'false'}
                      onValueChange={value => setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, voicemailEnabled: value === 'true' }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label>Call Recording</label>
                    <Select
                      value={formData.settings.callRecording ? 'true' : 'false'}
                      onValueChange={value => setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, callRecording: value === 'true' }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false);
                    setSelectedGroup(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedGroup ? 'Update' : 'Create'} Transfer Group
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {showNumberForm && selectedGroup && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add Transfer Number</CardTitle>
              <CardDescription>
                Add a new number to the transfer group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNumberSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>Phone Number</label>
                    <Input
                      value={numberFormData.phoneNumber}
                      onChange={e => setNumberFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      required
                      placeholder="+1XXXXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Name</label>
                    <Input
                      value={numberFormData.name}
                      onChange={e => setNumberFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>Priority</label>
                    <Input
                      type="number"
                      value={numberFormData.priority}
                      onChange={e => setNumberFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Weight</label>
                    <Input
                      type="number"
                      value={numberFormData.weight}
                      onChange={e => setNumberFormData(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                      min={1}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowNumberForm(false);
                    setSelectedGroup(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Number
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Transfer Groups</CardTitle>
            <CardDescription>
              Manage your transfer groups and their associated phone numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Ingroup</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Numbers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(groups) && groups.length > 0 ? (
                  groups.map(group => (
                    <TableRow key={group.id}>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>{group.brand || 'All'}</TableCell>
                      <TableCell>{group.ingroup || 'All'}</TableCell>
                      <TableCell className="capitalize">{group.type}</TableCell>
                      <TableCell>{group.numbers?.length || 0}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          group.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {group.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(group)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddNumber(group)}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(group.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No transfer groups found. Create your first transfer group to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 