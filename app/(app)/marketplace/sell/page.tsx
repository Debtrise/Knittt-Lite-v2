'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Store,
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Star,
  Award,
  Calendar,
  BarChart3
} from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useAuthStore } from '@/app/store/authStore';
import marketplaceApi from '@/app/services/marketplaceApi';
import { Provider, Listing, CreateListingRequest } from '@/app/types/marketplace';

export default function SellPage() {
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

  const handleDeleteListing = async (listingId: number) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      // In real implementation, this would call a delete API
      toast.success('Listing deleted successfully');
      loadListings();
    } catch (error) {
      toast.error('Failed to delete listing');
    }
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
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" onClick={() => router.push('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="h-6 w-6" />
              Seller Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your listings and track sales performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/marketplace')}>
              View Marketplace
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </Button>
          </div>
        </div>

        {/* Provider Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {currentProvider.name.charAt(0)}
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {currentProvider.name}
                    {currentProvider.isVerified && (
                      <Award className="h-5 w-5 text-green-600" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {currentProvider.description}
                  </CardDescription>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span>{currentProvider.rating}/5</span>
                    </div>
                    <div>Total Sales: {formatPrice(currentProvider.totalSales || 0)}</div>
                    <div>Member since {formatDate(currentProvider.createdAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
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
                <TrendingUp className="h-5 w-5 text-green-600" />
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

        {/* Listings Management */}
        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Listings</CardTitle>
                <CardDescription>
                  Manage your lead listings and track their performance
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                      Create Listing
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Listing</TableHead>
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
                              <p className="text-sm text-gray-500">{listing.category}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(listing.pricePerLead)}
                          </TableCell>
                          <TableCell>
                            {listing.availableLeads.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getQualityColor(listing.leadQuality)}>
                              {listing.leadQuality}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={listing.isActive ? "default" : "secondary"}>
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
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => router.push(`/marketplace/listings/${listing.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditListing(listing)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteListing(listing.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
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
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sales Analytics
                </CardTitle>
                <CardDescription>
                  Track your sales performance and listing metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Analytics dashboard coming soon...</p>
                  <p className="text-sm mt-2">Track views, conversions, and revenue trends</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Listing Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Listing</DialogTitle>
              <DialogDescription>
                Add a new lead listing to the marketplace
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Listing Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Premium Solar Leads"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Solar">Solar</SelectItem>
                      <SelectItem value="HVAC">HVAC</SelectItem>
                      <SelectItem value="Insurance">Insurance</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Home Improvement">Home Improvement</SelectItem>
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
                  placeholder="Describe your leads..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price per Lead</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.pricePerLead}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricePerLead: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="leads">Available Leads</Label>
                  <Input
                    id="leads"
                    type="number"
                    value={formData.availableLeads}
                    onChange={(e) => setFormData(prev => ({ ...prev, availableLeads: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="quality">Lead Quality</Label>
                  <Select value={formData.leadQuality} onValueChange={(value: any) => setFormData(prev => ({ ...prev, leadQuality: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="delivery">Delivery Method</Label>
                <Select value={formData.deliveryMethod} onValueChange={(value: any) => setFormData(prev => ({ ...prev, deliveryMethod: value }))}>
                  <SelectTrigger>
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