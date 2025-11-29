
import axios from 'axios';
import api from './api';

// Types
export interface MarketplaceListing {
  _id: string;
  farmer: string;
  crop: {
    _id: string;
    name: string;
    variety: string;
    currentStage: string;
  };
  title: string;
  description: string;
  quantity: {
    available: number;
    reserved: number;
    unit: string;
    minimum?: number;
  };
  pricing: {
    pricePerUnit: number;
    currency: string;
    negotiable: boolean;
    bulkDiscounts?: Array<{
      minQuantity: number;
      discountPercentage: number;
    }>;
  };
  harvestInfo: {
    expectedDate: string;
    actualDate?: string;
    method?: string;
  };
  qualityAttributes: {
    grade: string;
    isOrganic: boolean;
    certifications: string[];
    appearance?: string;
    taste?: string;
    shelfLife?: number;
  };
  farmLocation: {
    type: string;
    coordinates: number[];
    address?: {
      village?: string;
      district?: string;
      state?: string;
      pincode?: string;
    };
  };
  images: string[];
  status: 'active' | 'inactive' | 'sold' | 'expired';
  statistics: {
    views: number;
    inquiries: number;
    orders: number;
  };
  expiresAt?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListingFilters {
  crop?: string;
  isOrganic?: boolean;
  minPrice?: number;
  maxPrice?: number;
  grade?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface NearbyFilters {
  latitude: number;
  longitude: number;
  maxDistance?: number;
  limit?: number;
}

export interface InquiryData {
  message: string;
  contactPhone?: string;
  contactEmail?: string;
  interestedQuantity?: number;
}

export interface MarketplaceStatistics {
  totalListings: number;
  activeListings: number;
  totalCrops: number;
  averagePrice: number;
  organicListings: number;
}
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

class BuyerMarketplaceService {
  private baseURL = `${API_BASE_URL}/api/crops/buyer/marketplace`;


  /**
   * Get all marketplace listings with optional filters
   */
  async getListings(filters?: ListingFilters): Promise<{ success: boolean; data: MarketplaceListing[]; pagination?: any }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `${this.baseURL}/listings?${queryString}` : `${this.baseURL}/listings`;
    
    const response: any = await axios.get(url);
    console.log("getListings response:", response);
    return response.data;
  }

  /**
   * Get a single listing by ID
   */
  async getListing(id: string): Promise<{ success: boolean; data: MarketplaceListing }> {
    const response: any = await axios.get(`${this.baseURL}/listings/${id}`);
    return response;
  }

  /**
   * Get nearby listings based on location
   */
  async getNearbyListings(filters: NearbyFilters): Promise<{ success: boolean; data: MarketplaceListing[] }> {
    const params = new URLSearchParams({
      latitude: String(filters.latitude),
      longitude: String(filters.longitude),
    });

    if (filters.maxDistance) {
      params.append('maxDistance', String(filters.maxDistance));
    }
    if (filters.limit) {
      params.append('limit', String(filters.limit));
    }

    const response: any = await axios.get(`${this.baseURL}/listings/nearby?${params.toString()}`);
    return response;
  }

  /**
   * Get listings by crop name
   */
  async getListingsByCrop(cropName: string): Promise<{ success: boolean; data: MarketplaceListing[] }> {
    const response: any = await axios(`${this.baseURL}/listings/crop/${encodeURIComponent(cropName)}`);
    return response;
  }

  /**
   * Get organic listings only
   */
  async getOrganicListings(params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: MarketplaceListing[] }> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const queryString = queryParams.toString();
    const url = queryString ? `${this.baseURL}/listings/organic?${queryString}` : `${this.baseURL}/listings/organic`;
    
    const response: any = await axios.get(url);
    return response;
  }

  /**
   * Get featured listings
   */
  async getFeaturedListings(limit?: number): Promise<{ success: boolean; data: MarketplaceListing[] }> {
    const url = limit ? `${this.baseURL}/listings/featured?limit=${limit}` : `${this.baseURL}/listings/featured`;
    const response: any = await axios.get(url);
    return response;
  }

  /**
   * Get available crop types
   */
  async getAvailableCrops(): Promise<{ success: boolean; data: string[] }> {
    const response: any = await axios.get(`${this.baseURL}/crops`);
    return response;
  }

  /**
   * Get available varieties for a crop
   */
  async getVarieties(cropName?: string): Promise<{ success: boolean; data: any[] }> {
    const url = cropName 
      ? `${this.baseURL}/varieties?crop=${encodeURIComponent(cropName)}`
      : `${this.baseURL}/varieties`;
    const response: any = await axios.get(url);
    return response;
  }

  /**
   * Get marketplace statistics
   */
  async getStatistics(): Promise<{ success: boolean; data: MarketplaceStatistics }> {
    const response: any = await axios.get(`${this.baseURL}/statistics`);
    return response;
  }

  /**
   * Record an inquiry for a listing
   */
  async recordInquiry(listingId: string, data: InquiryData): Promise<{ success: boolean; message: string }> {
    const response: any = await axios.post(`${this.baseURL}/listings/${listingId}/inquiry`, data);
    return response;
  }

  /**
   * Search listings by text
   */
  async searchListings(query: string, filters?: ListingFilters): Promise<{ success: boolean; data: MarketplaceListing[] }> {
    const params = new URLSearchParams({ search: query });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'search') {
          params.append(key, String(value));
        }
      });
    }

    const response: any = await api.get(`${this.baseURL}/listings?${params.toString()}`);
    return response;
  }
}

export const buyerMarketplaceService = new BuyerMarketplaceService();
export default buyerMarketplaceService;
