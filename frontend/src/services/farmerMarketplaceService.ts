import axios from "axios";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

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
  quality: {
    grade: string;
    isOrganic: boolean;
    certifications: string[];
    appearance?: string;
    taste?: string;
    shelfLife?: number;
    healthStatus?: string;
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

export interface CreateListingData {
  cropId: string;
  title: string;
  description: string;
  quantity: {
    available: number;
    unit: string;
    minimum?: number;
  };
  pricing: {
    pricePerUnit: number;
    currency?: string;
    negotiable?: boolean;
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
    isOrganic?: boolean;
    certifications?: string[];
    appearance?: string;
    taste?: string;
    shelfLife?: number;
    healthStatus?: string;
  };
  images?: string[];
  expiresAt?: string;
  isPrivate?: boolean;
}

export interface UpdateListingData {
  title?: string;
  description?: string;
  quantity?: {
    available?: number;
    unit?: string;
    minimum?: number;
  };
  pricing?: {
    pricePerUnit?: number;
    currency?: string;
    negotiable?: boolean;
    bulkDiscounts?: Array<{
      minQuantity: number;
      discountPercentage: number;
    }>;
  };
  harvestInfo?: {
    expectedDate?: string;
    actualDate?: string;
    method?: string;
  };
  qualityAttributes?: {
    grade?: string;
    isOrganic?: boolean;
    certifications?: string[];
    appearance?: string;
    taste?: string;
    shelfLife?: number;
    healthStatus?: string;
  };
  images?: string[];
  expiresAt?: string;
  isPrivate?: boolean;
}

export interface ReadyCrop {
  _id: string;
  name: string;
  variety: string;
  currentStage: string;
  expectedYield: number;
  yieldUnit: string;
  plantingDate: string;
  expectedHarvestDate: string;
}

export interface MarketplaceStatistics {
  totalListings: number;
  activeListings: number;
  inactiveListings: number;
  soldListings: number;
  expiredListings: number;
  totalViews: number;
  totalInquiries: number;
  totalOrders: number;
  averagePrice: number;
  totalQuantityListed: number;
  totalQuantitySold: number;
}








class FarmerMarketplaceService  
{  
  private baseURL = `${API_BASE_URL}/api/crops/farmer/marketplace`;
  

  /**
   * Create a new marketplace listing
   */
  async createListing(data: CreateListingData): Promise<{ success: boolean; data: MarketplaceListing }> {
    console.log("data within createListing:", data);
    console.log("baseURL within createListing:", this.baseURL);
    const response:any = await axios.post(`${this.baseURL}/listings`, data);
    return response.data;
  }

  /**
   * Get all listings for the authenticated farmer
   */
  async getMyListings(params?: {
  status?: string;
  page?: number;
  limit?: number;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      count: number;
      listings: MarketplaceListing[];
    };
  }>  {
    const response:any = await axios.get(`${this.baseURL}/listings`);
    return response.data;
  }

  /**
   * Get a single listing by ID
   */
  async getListing(id: string): Promise<{ success: boolean; data: MarketplaceListing }> {
    const response:any = await axios.get(`${this.baseURL}/listings/${id}`);
    return response.data;
  }

  /**
   * Update a listing
   */
  async updateListing(
    id: string,
    data: UpdateListingData
  ): Promise<{ success: boolean; data: MarketplaceListing }> {
    const response:any = await axios.put(`${this.baseURL}/listings/${id}`, data);
    return response.data;
  }

  /**
   * Deactivate a listing
   */
  async deactivateListing(id: string): Promise<{ success: boolean; message: string }> {
    const response:any = await axios.delete(`${this.baseURL}/listings/${id}`);
    return response.data;
  }

  /**
   * Reactivate a listing
   */
  async reactivateListing(id: string): Promise<{ success: boolean; data: MarketplaceListing }> {
    const response:any = await axios.post(`${this.baseURL}/listings/${id}/reactivate`);
    return response.data;
  }

  /**
   * Get ready-to-harvest crops
   */
  async getReadyCrops(): Promise<{
    success: boolean;
    message: string;
    data: {
      count: number;
      crops: ReadyCrop[];
    };
  }> {
    const response:any = await axios.get(`${this.baseURL}/ready-crops`);
    return response.data;
  }
    
  /**
   * Get marketplace statistics
   */
  async getStatistics(): Promise<{ success: boolean; data: MarketplaceStatistics }> {
    const response:any = await axios.get(`${this.baseURL}/statistics`);
    return response.data;
  }
}

export const farmerMarketplaceService = new FarmerMarketplaceService();
export default farmerMarketplaceService;