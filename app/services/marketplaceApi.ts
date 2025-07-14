import api, { marketplace } from '@/app/lib/api';
import {
  Provider,
  Listing,
  Order,
  CreateProviderRequest,
  CreateListingRequest,
  PurchaseRequest,
  MarketplaceStats,
  MarketplaceFilters
} from '@/app/types/marketplace';

class MarketplaceApiService {
  // Provider endpoints
  async getProviders(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const response = await marketplace.getProviders(params);
    return response.data;
  }

  async createProvider(data: CreateProviderRequest) {
    const response = await marketplace.createProvider(data);
    return response.data;
  }

  // Listings endpoints
  async getListings(filters?: MarketplaceFilters & {
    limit?: number;
    offset?: number;
  }) {
    const response = await marketplace.getListings(filters);
    return response.data;
  }

  async createListing(data: CreateListingRequest) {
    const response = await marketplace.createListing(data);
    return response.data;
  }

  async purchaseListing(listingId: number, data: PurchaseRequest) {
    const response = await marketplace.purchaseListing(listingId, data);
    return response.data;
  }

  // Orders endpoints
  async getOrders(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const response = await marketplace.getOrders(params);
    return response.data;
  }

  // Stats endpoint
  async getStats() {
    const response = await marketplace.getStats();
    return response.data;
  }

  // Utility methods
  async searchListings(query: string, filters?: Partial<MarketplaceFilters>) {
    return this.getListings({
      search: query,
      ...filters
    });
  }

  async getListingsByCategory(category: string, filters?: Partial<MarketplaceFilters>) {
    return this.getListings({
      category,
      ...filters
    });
  }

  async getListingsByPriceRange(minPrice: number, maxPrice: number, filters?: Partial<MarketplaceFilters>) {
    return this.getListings({
      priceMin: minPrice,
      priceMax: maxPrice,
      ...filters
    });
  }
}

export const marketplaceApi = new MarketplaceApiService();
export default marketplaceApi; 