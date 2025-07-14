'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ShoppingCart,
  Star,
  CheckCircle,
  MapPin,
  Users,
  DollarSign,
  Package,
  Award,
  Store
} from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/Input';
import { useAuthStore } from '@/app/store/authStore';
import marketplaceApi from '@/app/services/marketplaceApi';
import { Listing, Provider } from '@/app/types/marketplace';

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const [listing, setListing] = useState<Listing | null>(null);
  const [related, setRelated] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseMethod, setPurchaseMethod] = useState('credit_card');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadListing();
  }, [isAuthenticated, params, router]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const id = Number(params.id);
      const response = await marketplaceApi.getListings({ limit: 100 });
      const found = (response.listings || []).find((l: Listing) => l.id === id);
      setListing(found || null);
      // Related: same provider, different id
      setRelated((response.listings || []).filter((l: Listing) => found && l.providerId === found.providerId && l.id !== found.id));
    } catch (error) {
      toast.error('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!listing) return;
    try {
      setPurchasing(true);
      await marketplaceApi.purchaseListing(listing.id, {
        quantity: purchaseQuantity,
        paymentMethod: purchaseMethod
      });
      toast.success(`Successfully purchased ${purchaseQuantity} leads!`);
      setShowPurchaseDialog(false);
      setPurchaseQuantity(1);
      loadListing();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to purchase leads');
    } finally {
      setPurchasing(false);
    }
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

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" onClick={() => router.push('/marketplace')}>
            Back to Marketplace
          </Button>
          {(user?.role === 'provider' || user?.role === 'seller') && (
            <Button variant="outline" onClick={() => router.push('/marketplace/sell')}>
              Go to Seller Dashboard
            </Button>
          )}
        </div>
        {loading || !listing ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading listing...</p>
          </div>
        ) : (
          <>
            {/* Listing Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      {listing.name}
                      {listing.leadQuality && (
                        <Badge className={getQualityColor(listing.leadQuality)}>
                          {listing.leadQuality}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2 text-lg">
                      {listing.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-3xl font-bold text-green-600">{formatPrice(listing.pricePerLead)}</span>
                    <span className="text-sm text-gray-500">per lead</span>
                    <Button onClick={() => setShowPurchaseDialog(true)} disabled={listing.availableLeads === 0}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700 font-medium">{listing.availableLeads} available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700 font-medium">Category:</span>
                      <span>{listing.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                      <span className="text-gray-700 font-medium">Delivery:</span>
                      <span className="capitalize">{listing.deliveryMethod}</span>
                    </div>
                    {listing.geography && listing.geography.length > 0 && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        <span className="text-gray-700 font-medium">Geography:</span>
                        <span>{listing.geography.join(', ')}</span>
                      </div>
                    )}
                    {listing.tags && listing.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-700 font-medium">Tags:</span>
                        {listing.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Provider Info */}
                  <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">Provider:</span>
                      <span>{listing.provider?.name}</span>
                      {listing.provider?.isVerified && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {listing.provider?.rating && (
                        <span className="flex items-center gap-1 ml-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600">{listing.provider.rating}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{listing.provider?.description}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{listing.provider?.contact.email}</span>
                      {listing.provider?.contact.phone && <span>| {listing.provider.contact.phone}</span>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/marketplace/providers/${listing.providerId}`)}>
                      View Provider
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Dialog */}
            <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Purchase Leads</DialogTitle>
                  <DialogDescription>
                    Select quantity and payment method to purchase leads from this listing.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <Input
                      type="number"
                      min={1}
                      max={listing.availableLeads}
                      value={purchaseQuantity}
                      onChange={e => setPurchaseQuantity(Math.max(1, Math.min(listing.availableLeads, parseInt(e.target.value) || 1)))}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {listing.availableLeads} leads available
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Method</label>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={purchaseMethod}
                      onChange={e => setPurchaseMethod(e.target.value)}
                    >
                      <option value="credit_card">Credit Card</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-bold text-lg">Total:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatPrice(listing.pricePerLead * purchaseQuantity)}
                    </span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handlePurchase} disabled={purchasing}>
                    {purchasing ? 'Processing...' : 'Purchase'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Related Listings */}
            {related.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">More from this provider</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {related.map((rel) => (
                    <Card key={rel.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/marketplace/listings/${rel.id}`)}>
                      <CardHeader>
                        <CardTitle className="text-lg">{rel.name}</CardTitle>
                        <CardDescription>{rel.description?.slice(0, 80)}{rel.description && rel.description.length > 80 ? '...' : ''}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-bold">{formatPrice(rel.pricePerLead)}</span>
                          <span className="text-xs text-gray-500">per lead</span>
                          <Badge className={getQualityColor(rel.leadQuality)}>{rel.leadQuality}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Users className="h-4 w-4" />
                          {rel.availableLeads} available
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
