
import api from './api';

export interface CartItem {
  _id?: string;
  listing: string;
  cropName: string;
  variety: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  seller: string;
  sellerName?: string;
  images?: string[];
  farmLocation?: {

    cordinates?: number[];
    address?: {
      village?: string;
      district?: string;
      state?: string;
      pincode?: string;
    }

  };
  addedAt?: string;
}

export interface Cart {
  _id: string;
  buyer: string;
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartData {
  listing: string;
  cropName: string;
  description?: string;
  variety: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  seller: string;
  sellerName?: string;
  images?: string[];
  farmLocation?: {
    cordinates?: number[];
    address?: {
      city?: string;
      state?: string; 
  }
};
qualityAttributes?: {
        grade?: string;
        isOrganic?: boolean;
        certifications?: string[];
        appearance?: string;
        taste?: string;
        shelfLife?: number;
      };
}

class CartService {
  private baseURL = '/api/marketplace/cart';

  /**
   * Get buyer's cart
   */
  async getCart(): Promise<{ success: boolean; data: Cart }> {
    const response = await api.get(this.baseURL) as any;
    return response;
  }

  /**
   * Get cart item count
   */
  async getCartCount(): Promise<{ success: boolean; data: { count: number } }> {
    const response = await api.get(`${this.baseURL}/count`) as any;
    return response;
  }

  /**
   * Add item to cart
   */
  async addToCart(itemData: AddToCartData): Promise<{ success: boolean; data: Cart }> {
    console.log('Adding to cart:', itemData);
    const response = await api.post(`${this.baseURL}/items`, itemData) as any;
    return response;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(listingId: string, quantity: number): Promise<{ success: boolean; data: Cart }> {
    const response = await api.put(`${this.baseURL}/items/${listingId}`, { quantity }) as any;
    return response;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(listingId: string): Promise<{ success: boolean; data: Cart }> {
    const response = await api.delete(`${this.baseURL}/items/${listingId}`) as any;
    return response;
  }

  /**
   * Clear cart
   */
  async clearCart(): Promise<{ success: boolean; data: Cart }> {
    const response = await api.delete(this.baseURL) as any;
    return response;
  }
}

export default new CartService();
