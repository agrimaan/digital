
import api from './api';

export interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  totalPrice: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  contactName: string;
  contactPhone: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  buyer: string;
  seller: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  paymentDetails?: {
    transactionId?: string;
    paymentDate?: string;
    receiptUrl?: string;
  };
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  shipment?: {
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
  };
  notes?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    comment?: string;
    updatedBy?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  items: Array<{
    product: string;
    name: string;
    quantity: number;
    unit: string;
    price: number;
    totalPrice: number;
  }>;
  seller: string;
  paymentMethod: string;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  notes?: string;
}

class OrderService {
  private baseURL = '/api/marketplace/orders';

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderData): Promise<{ success: boolean; data: Order }> {
    const response = await api.post(this.baseURL, orderData) as any;
    return response;
  }

  /**
   * Get buyer's orders
   */
  async getBuyerOrders(params?: { 
    status?: string; 
    page?: number; 
    limit?: number 
  }): Promise<{ success: boolean; data: Order[] }> {
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const queryString = queryParams.toString();
    const url = queryString ? `${this.baseURL}/buyer?${queryString}` : `${this.baseURL}/buyer`;
    
    const response = await api.get(url) as any;
    return response;
  }

  /**
   * Get single order by ID
   */
  async getOrder(orderId: string): Promise<{ success: boolean; data: Order }> {
    const response = await api.get(`${this.baseURL}/${orderId}`) as any;
    return response;
  }

  /**
   * Get seller's orders (for farmers)
   */
  async getSellerOrders(params?: { 
    status?: string; 
    page?: number; 
    limit?: number 
  }): Promise<{ success: boolean; data: Order[] }> {
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const queryString = queryParams.toString();
    const url = queryString ? `${this.baseURL}/seller?${queryString}` : `${this.baseURL}/seller`;
    
    const response = await api.get(url) as any;
    return response;
  }

  /**
   * Update order status (admin/seller only)
   */
  async updateOrderStatus(
    orderId: string, 
    status: string, 
    comment?: string
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.put(`${this.baseURL}/${orderId}/status`, { status, comment }) as any;
    return response;
  }

  /**
   * Update payment status (admin only)
   */
  async updatePaymentStatus(
    orderId: string, 
    paymentStatus: string,
    paymentDetails?: any
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.put(`${this.baseURL}/${orderId}/payment`, { 
      paymentStatus, 
      paymentDetails 
    }) as any;
    return response;
  }

  /**
   * Update shipment details (admin/seller only)
   */
  async updateShipmentDetails(
    orderId: string, 
    shipmentData: {
      carrier?: string;
      trackingNumber?: string;
      estimatedDelivery?: string;
      actualDelivery?: string;
    }
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.put(`${this.baseURL}/${orderId}/shipment`, shipmentData) as any;
    return response;
  }
}

export default new OrderService();
