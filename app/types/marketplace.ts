// Marketplace Types
export interface Provider {
  id: number;
  name: string;
  description: string;
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  rating?: number;
  totalSales?: number;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Listing {
  id: number;
  providerId: number;
  provider?: Provider;
  name: string;
  description?: string;
  pricePerLead: number;
  deliveryMethod: 'csv' | 'api' | 'email';
  availableLeads: number;
  category?: string;
  tags?: string[];
  geography?: string[];
  leadQuality?: 'basic' | 'premium' | 'enterprise';
  dataFields?: string[];
  sampleData?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  listingId: number;
  listing?: Listing;
  buyerId: number;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  deliveryData?: any;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

export interface CreateProviderRequest {
  name: string;
  description: string;
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
}

export interface CreateListingRequest {
  providerId: number;
  name: string;
  description?: string;
  pricePerLead: number;
  deliveryMethod: 'csv' | 'api' | 'email';
  availableLeads: number;
  category?: string;
  tags?: string[];
  geography?: string[];
  leadQuality?: 'basic' | 'premium' | 'enterprise';
  dataFields?: string[];
}

export interface PurchaseRequest {
  quantity: number;
  paymentMethod?: string;
}

export interface MarketplaceStats {
  totalProviders: number;
  totalListings: number;
  totalOrders: number;
  totalLeadsSold: number;
  averagePrice: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
}

export interface MarketplaceFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  leadQuality?: string;
  geography?: string[];
  deliveryMethod?: string;
  search?: string;
  sortBy?: 'price' | 'rating' | 'created' | 'popularity';
  sortOrder?: 'asc' | 'desc';
} 