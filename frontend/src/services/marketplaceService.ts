import api from './api';

export interface PublishCropData {
  pricePerUnit: number;
  quantity: number;
  description?: string;
  images?: string[];
  isOrganic?: boolean;
  certifications?: string[];
}

export interface MarketplaceProduct {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: {
    value: number;
    currency: string;
    unit: string;
  };
  quantity: {
    available: number;
    unit: string;
    minimum: number;
  };
  images: string[];
  seller: string;
  location: {
    type: string;
    coordinates: number[];
    address: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
  };
  specifications: any;
  ratings: {
    average: number;
    count: number;
  };
  reviews: any[];
  isOrganic: boolean;
  certifications: string[];
  harvestDate?: Date;
  expiryDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class MarketplaceService {
  // Publish crop to marketplace
  async publishCrop(cropId: string, data: PublishCropData): Promise<any> {
    const response:any = await api.post(`/crops/${cropId}/publish`, data);
    return response.data;
  }

  // Get farmer's marketplace listings
  async getMyListings(): Promise<any> {
    const response:any = await api.get('/crops/marketplace/listings');
    return response.data;
  }

  // Unlist crop from marketplace
  async unlistCrop(cropId: string): Promise<any> {
    const response:any = await api.delete(`/crops/${cropId}/marketplace`);
    return response.data;
  }

  // Get all marketplace products
  async getProducts(filters?: {
    category?: string;
    isOrganic?: boolean;
    seller?: string;
    minPrice?: number;
    maxPrice?: number;
    showInactive?: boolean;
  }): Promise<{ data: MarketplaceProduct[] }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response:any = await api.get(`/marketplace/products?${params.toString()}`);
    return response.data;
  }

  // Get single product
  async getProduct(productId: string): Promise<{ data: MarketplaceProduct }> {
    const response:any = await api.get(`/marketplace/products/${productId}`);
    return response.data;
  }

  // Search products
  async searchProducts(query: string): Promise<{ data: MarketplaceProduct[] }> {
    const response:any = await api.get(`/marketplace/products/search/${query}`);
    return response.data;
  }

  // Get products by category
  async getProductsByCategory(category: string): Promise<{ data: MarketplaceProduct[] }> {
    const response:any = await api.get(`/marketplace/products/category/${category}`);
    return response.data;
  }

  // Get nearby products
  async getNearbyProducts(
    longitude: number,
    latitude: number,
    distance?: number
  ): Promise<{ data: MarketplaceProduct[] }> {
    const params = new URLSearchParams({
      longitude: String(longitude),
      latitude: String(latitude),
    });
    
    if (distance) {
      params.append('distance', String(distance));
    }

    const response:any = await api.get(`/marketplace/products/nearby?${params.toString()}`);
    return response.data;
  }

  // Add product review
  async addReview(
    productId: string,
    rating: number,
    comment: string
  ): Promise<any> {
    const response:any = await api.post(`/marketplace/products/${productId}/reviews`, {
      rating,
      comment,
    });
    return response.data;
  }
}

export default new MarketplaceService();