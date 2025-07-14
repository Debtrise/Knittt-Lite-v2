'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Store,
  Search,
  Filter,
  ShoppingCart,
  Star,
  CheckCircle,
  MapPin,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  Package,
  Grid3X3,
  List,
  ChevronDown,
  X
} from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Slider } from '@/app/components/ui/slider';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { useAuthStore } from '@/app/store/authStore';
import marketplaceApi from '@/app/services/marketplaceApi';
import { Listing, MarketplaceStats, MarketplaceFilters } from '@/app/types/marketplace';

export default function MarketplacePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  // Data state
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  
  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseMethod, setPurchaseMethod] = useState('credit_card');
  
  // Filter state
  const [filters, setFilters] = useState<MarketplaceFilters>({
    search: '',
    category: '',
    priceMin: 0,
    priceMax: 200,
    leadQuality: '',
    deliveryMethod: '',
    sortBy: 'created',
    sortOrder: 'desc'
  });
  const [priceRange, setPriceRange] = useState([0, 200]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    loadData();
  }, [isAuthenticated, router, filters, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [listingsResponse, statsResponse] = await Promise.all([
        marketplaceApi.getListings({
          ...filters,
          priceMin: priceRange[0],
          priceMax: priceRange[1],
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage
        }),
        marketplaceApi.getStats()
      ]);
      
      setListings(listingsResponse.listings || []);
      setStats(statsResponse);
      setTotalPages(Math.ceil((listingsResponse.total || 0) / itemsPerPage));
      
    } catch (error) {
      console.error('Error loading marketplace data:', error);
      toast.error('Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof MarketplaceFilters, value: any) => {
    // Convert "all" values back to empty string for API
    const apiValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: apiValue }));
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (newRange: number[]) => {
    setPriceRange(newRange);
    // Debounce the API call
    setTimeout(() => {
      setFilters(prev => ({ ...prev, priceMin: newRange[0], priceMax: newRange[1] }));
      setCurrentPage(1);
    }, 500);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      priceMin: 0,
      priceMax: 200,
      leadQuality: '',
      deliveryMethod: '',
      sortBy: 'created',
      sortOrder: 'desc'
    });
    setPriceRange([0, 200]);
    setCurrentPage(1);
  };

  const handlePurchase = async () => {
    if (!selectedListing) return;
    
    try {
      setPurchasing(selectedListing.id);
      
      const response = await marketplaceApi.purchaseListing(selectedListing.id, {
        quantity: purchaseQuantity,
        paymentMethod: purchaseMethod
      });
      
      toast.success(`Successfully purchased ${purchaseQuantity} leads! ${response.message}`);
      setShowPurchaseDialog(false);
      setSelectedListing(null);
      setPurchaseQuantity(1);
      
      // Refresh listings to update available counts
      loadData();
      
    } catch (error: any) {
      console.error('Error purchasing leads:', error);
      toast.error(error.response?.data?.error || 'Failed to purchase leads');
    } finally {
      setPurchasing(null);
    }
  };

  const openPurchaseDialog = (listing: Listing) => {
    setSelectedListing(listing);
    setPurchaseQuantity(Math.min(10, listing.availableLeads)); // Default to 10 or available count
    setShowPurchaseDialog(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryIcon = (method: string) => {
    switch (method) {
      case 'csv': return '📊';
      case 'api': return '🔗';
      case 'email': return '📧';
      default: return '📦';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <div className="flex items-center gap-2 mb-4">
          {(user?.role === 'provider' || user?.role === 'seller') && (
            <Button variant="outline" onClick={() => router.push('/marketplace/sell')}>
              Go to Seller Dashboard
            </Button>
          )}
          {user && user.role !== 'admin' && user.role !== 'provider' && user.role !== 'seller' && (
            <Button variant="outline" onClick={() => router.push('/marketplace/sell')}>
              Become a Seller
            </Button>
          )}
        </div>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Store className="h-6 w-6" />
                Lead Marketplace
              </h1>
              <p className="text-gray-600 mt-1">
                Discover and purchase high-quality leads from verified providers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Providers</p>
                      <p className="text-xl font-bold">{stats.totalProviders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Active Listings</p>
                      <p className="text-xl font-bold">{stats.totalListings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Leads Sold</p>
                      <p className="text-xl font-bold">{stats.totalLeadsSold.toLocaleString()}</p>
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
                      <p className="text-xl font-bold">{formatPrice(stats.averagePrice)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search leads by name, description, or tags..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {stats?.topCategories.map((cat) => (
                    <SelectItem key={cat.category} value={cat.category}>
                      {cat.category} ({cat.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Newest First</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Price Range</Label>
                      <div className="px-2">
                        <Slider
                          value={priceRange}
                          onValueChange={handlePriceRangeChange}
                          max={200}
                          step={5}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{formatPrice(priceRange[0])}</span>
                          <span>{formatPrice(priceRange[1])}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Lead Quality</Label>
                      <Select value={filters.leadQuality || 'all'} onValueChange={(value) => handleFilterChange('leadQuality', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any Quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Quality</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Delivery Method</Label>
                      <Select value={filters.deliveryMethod || 'all'} onValueChange={(value) => handleFilterChange('deliveryMethod', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any Method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Method</SelectItem>
                          <SelectItem value="csv">CSV Download</SelectItem>
                          <SelectItem value="api">API Integration</SelectItem>
                          <SelectItem value="email">Email Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={resetFilters}>
                      Reset Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Listings Grid/List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {listings.map((listing) => (
                <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{listing.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {listing.description && listing.description.length > 100
                            ? `${listing.description.substring(0, 100)}...`
                            : listing.description
                          }
                        </CardDescription>
                      </div>
                      {listing.provider?.isVerified && (
                        <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {listing.provider?.name}
                      </Badge>
                      {listing.provider?.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600">{listing.provider.rating}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(listing.pricePerLead)}
                        </span>
                        <span className="text-sm text-gray-500">per lead</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{listing.availableLeads} available</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{getDeliveryIcon(listing.deliveryMethod)}</span>
                          <span className="capitalize">{listing.deliveryMethod}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {listing.category && (
                          <Badge variant="outline">{listing.category}</Badge>
                        )}
                        {listing.leadQuality && (
                          <Badge className={getQualityColor(listing.leadQuality)}>
                            {listing.leadQuality}
                          </Badge>
                        )}
                      </div>
                      
                      {listing.geography && listing.geography.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{listing.geography.join(', ')}</span>
                        </div>
                      )}
                      
                      {listing.tags && listing.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {listing.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {listing.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{listing.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <Button 
                        className="w-full" 
                        onClick={() => openPurchaseDialog(listing)}
                        disabled={listing.availableLeads === 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {listing.availableLeads === 0 ? 'Out of Stock' : 'Purchase Leads'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 py-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* Purchase Dialog */}
          <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Purchase Leads</DialogTitle>
                <DialogDescription>
                  {selectedListing?.name}
                </DialogDescription>
              </DialogHeader>
              
              {selectedListing && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Price per lead</span>
                      <span className="font-medium">{formatPrice(selectedListing.pricePerLead)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Available leads</span>
                      <span className="font-medium">{selectedListing.availableLeads}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Delivery method</span>
                      <span className="font-medium capitalize">{selectedListing.deliveryMethod}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedListing.availableLeads}
                      value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="payment">Payment Method</Label>
                    <Select value={purchaseMethod} onValueChange={setPurchaseMethod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span>{formatPrice(selectedListing.pricePerLead * purchaseQuantity)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handlePurchase} 
                  disabled={purchasing === selectedListing?.id}
                >
                  {purchasing === selectedListing?.id ? 'Processing...' : 'Purchase'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
} 