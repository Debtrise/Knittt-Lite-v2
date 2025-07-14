'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  Star,
  Award
} from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { useAuthStore } from '@/app/store/authStore';
import marketplaceApi from '@/app/services/marketplaceApi';
import { Provider, Listing, CreateListingRequest } from '@/app/types/marketplace';

export default function ProvidersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  // Mock provider data - in real implementation, this would come from user session
  const [currentProvider] = useState<Provider>({
    id: 1,
    name: "Solar Leads Pro",
    description: "Premium solar installation leads with high conversion rates",
    contact: {
      email: "contact@solarleadspro.com",
      phone: "+1-555-0123",
      website: "https://solarleadspro.com"
    },
    rating: 4.8,
    totalSales: 15420,
    isVerified: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-12-20T15:30:00Z"
  });
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [formData, setFormData] = useState<CreateListingRequest>({
    providerId: currentProvider.id,
    name: '',
    description: '',
    pricePerLead: 0,
    deliveryMethod: 'csv',
    availableLeads: 0,
    category: '',
    tags: [],
    geography: [],
    leadQuality: 'basic',
    dataFields: []
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    loadListings();
  }, [isAuthenticated, router]);

  const loadListings = async () => {
    try {
      setLoading(true);
      
      const response = await marketplaceApi.getListings({
        // In real implementation, filter by current provider
        limit: 100
      });
      
      // Filter to only show current provider's listings
      const providerListings = (response.listings || []).filter(
        listing => listing.providerId === currentProvider.id
      );
      
      setListings(providerListings);
      
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async () => {
    try {
      await marketplaceApi.createListing(formData);
      toast.success('Listing created successfully');
      setShowCreateDialog(false);
      resetForm();
      loadListings();
    } catch (error: any) {
      console.error('Error creating listing:', error);
      toast.error(error.response?.data?.error || 'Failed to create listing');
    }
  };

  const handleEditListing = (listing: Listing) => {
    setSelectedListing(listing);
    setFormData({
      providerId: listing.providerId,
      name: listing.name,
      description: listing.description || '',
      pricePerLead: listing.pricePerLead,
      deliveryMethod: listing.deliveryMethod,
      availableLeads: listing.availableLeads,
      category: listing.category || '',
      tags: listing.tags || [],
      geography: listing.geography || [],
      leadQuality: listing.leadQuality || 'basic',
      dataFields: listing.dataFields || []
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      providerId: currentProvider.id,
      name: '',
      description: '',
      pricePerLead: 0,
      deliveryMethod: 'csv',
      availableLeads: 0,
      category: '',
      tags: [],
      geography: [],
      leadQuality: 'basic',
      dataFields: []
    });
    setSelectedListing(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate stats from listings
  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.isActive).length;
  const totalLeadsAvailable = listings.reduce((sum, l) => sum + l.availableLeads, 0);
  const averagePrice = listings.length > 0 
    ? listings.reduce((sum, l) => sum + l.pricePerLead, 0) / listings.length 
    : 0;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Provider Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your lead listings and track performance
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Button>
        </div>

        {/* Provider Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{currentProvider.name}</h2>
                  {currentProvider.isVerified && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  <Badge variant="secondary" className="ml-auto">
                    Provider ID: {currentProvider.id}
                  </Badge>
                </div>
                <p className="text-gray-600 mt-1">{currentProvider.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>{currentProvider.rating} rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>{currentProvider.totalSales?.toLocaleString()} total sales</span>
                  </div>
                  <div>
                    <span>Joined {formatDate(currentProvider.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Listings</p>
                  <p className="text-xl font-bold">{totalListings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Listings</p>
                  <p className="text-xl font-bold">{activeListings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Available Leads</p>
                  <p className="text-xl font-bold">{totalLeadsAvailable.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg. Price</p>
                  <p className="text-xl font-bold">{formatPrice(averagePrice)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Listings</CardTitle>
            <CardDescription>
              Manage and track performance of your lead listings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                <p className="text-gray-500 mb-4">Create your first listing to start selling leads</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Listing
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{listing.name}</p>
                          <p className="text-sm text-gray-500">
                            {listing.deliveryMethod.toUpperCase()} delivery
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {listing.category && (
                          <Badge variant="outline">{listing.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(listing.pricePerLead)}
                      </TableCell>
                      <TableCell>{listing.availableLeads}</TableCell>
                      <TableCell>
                        {listing.leadQuality && (
                          <Badge className={getQualityColor(listing.leadQuality)}>
                            {listing.leadQuality}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={listing.isActive ? 'default' : 'secondary'}>
                          {listing.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(listing.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/marketplace?search=${encodeURIComponent(listing.name)}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View in Marketplace
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditListing(listing)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Listing
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Listing
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Listing Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Listing</DialogTitle>
              <DialogDescription>
                Add a new lead listing to the marketplace
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Listing Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Premium Solar Leads - California"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Solar">Solar</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Roofing">Roofing</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="B2B Software">B2B Software</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="pricePerLead">Price per Lead</Label>
                <Input
                  id="pricePerLead"
                  type="number"
                  value={formData.pricePerLead}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerLead: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="availableLeads">Available Leads</Label>
                <Input
                  id="availableLeads"
                  type="number"
                  value={formData.availableLeads}
                  onChange={(e) => setFormData(prev => ({ ...prev, availableLeads: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="leadQuality">Lead Quality</Label>
                <Select value={formData.leadQuality} onValueChange={(value: any) => setFormData(prev => ({ ...prev, leadQuality: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="deliveryMethod">Delivery Method</Label>
                <Select value={formData.deliveryMethod} onValueChange={(value: any) => setFormData(prev => ({ ...prev, deliveryMethod: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV Download</SelectItem>
                    <SelectItem value="api">API Integration</SelectItem>
                    <SelectItem value="email">Email Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your leads, target demographics, and data quality..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateListing}>
                Create Listing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 