import api from './api';

export interface Inquiry {
  _id: string;
  listing: string;
  buyer: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  farmer: string;
  farmerName?: string;
  cropName: string;
  variety?: string;
  message: string;
  interestedQuantity?: number;
  quantityUnit?: string;
  status: 'pending' | 'responded' | 'closed';
  response?: {
    message: string;
    respondedAt: string;
    respondedBy: string;
  };
  isRead: boolean;
  isResponseRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInquiryData {
  listing: string;
  farmer: string;
  farmerName?: string;
  cropName: string;
  variety?: string;
  message: string;
  interestedQuantity?: number;
  quantityUnit?: string;
  buyerPhone?: string;
}

export interface InquiryStats {
  total: number;
  pending: number;
  responded: number;
  unread?: number;
  unreadResponses?: number;
}

class InquiryService {
  private baseURL = '/api/marketplace/inquiries';

  /**
   * Create inquiry (Buyer)
   */
  async createInquiry(inquiryData: CreateInquiryData): Promise<{ success: boolean; data: Inquiry }> {
    const response = await api.post(this.baseURL, inquiryData) as any;
    return response;
  }

  /**
   * Get buyer's inquiries
   */
  async getBuyerInquiries(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: { inquiries: Inquiry[]; pagination: any } }> {
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
   * Get farmer's inquiries
   */
  async getFarmerInquiries(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: { inquiries: Inquiry[]; pagination: any } }> {
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const queryString = queryParams.toString();
    const url = queryString ? `${this.baseURL}/farmer?${queryString}` : `${this.baseURL}/farmer`;
    
    const response = await api.get(url) as any;
    return response;
  }

  /**
   * Get single inquiry
   */
  async getInquiry(inquiryId: string): Promise<{ success: boolean; data: Inquiry }> {
    const response = await api.get(`${this.baseURL}/${inquiryId}`) as any;
    return response;
  }

  /**
   * Respond to inquiry (Farmer)
   */
  async respondToInquiry(inquiryId: string, message: string): Promise<{ success: boolean; data: Inquiry }> {
    const response = await api.post(`${this.baseURL}/${inquiryId}/respond`, { message }) as any;
    return response;
  }

  /**
   * Mark inquiry as read (Farmer)
   */
  async markAsRead(inquiryId: string): Promise<{ success: boolean; data: Inquiry }> {
    const response = await api.put(`${this.baseURL}/${inquiryId}/read`) as any;
    return response;
  }

  /**
   * Get buyer inquiry statistics
   */
  async getBuyerStats(): Promise<{ success: boolean; data: InquiryStats }> {
    const response = await api.get(`${this.baseURL}/buyer/stats`) as any;
    return response;
  }

  /**
   * Get farmer inquiry statistics
   */
  async getFarmerStats(): Promise<{ success: boolean; data: InquiryStats }> {
    const response = await api.get(`${this.baseURL}/farmer/stats`) as any;
    return response;
  }

  /**
   * Close inquiry
   */
  async closeInquiry(inquiryId: string): Promise<{ success: boolean; data: Inquiry }> {
    const response = await api.put(`${this.baseURL}/${inquiryId}/close`) as any;
    return response;
  }
}

export default new InquiryService();