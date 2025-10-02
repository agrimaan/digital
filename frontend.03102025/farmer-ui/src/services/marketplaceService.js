import apiService from './api';

const BASE_PATH = '/marketplace';

const marketplaceService = {
  // Get all listings
  getListings: async (filters = {}) => {
    return await apiService.get(`${BASE_PATH}/listings`, filters);
  },

  // Get a specific listing by ID
  getListing: async (listingId) => {
    return await apiService.get(`${BASE_PATH}/listings/${listingId}`);
  },

  // Create a new listing
  createListing: async (listingData) => {
    return await apiService.post(`${BASE_PATH}/listings`, listingData);
  },

  // Update an existing listing
  updateListing: async (listingId, listingData) => {
    return await apiService.put(`${BASE_PATH}/listings/${listingId}`, listingData);
  },

  // Delete a listing
  deleteListing: async (listingId) => {
    return await apiService.delete(`${BASE_PATH}/listings/${listingId}`);
  },

  // Get user's active listings
  getMyListings: async () => {
    return await apiService.get(`${BASE_PATH}/my-listings`);
  },

  // Get user's orders (purchases)
  getMyOrders: async () => {
    return await apiService.get(`${BASE_PATH}/my-orders`);
  },

  // Get user's sales
  getMySales: async () => {
    return await apiService.get(`${BASE_PATH}/my-sales`);
  },

  // Place an order
  placeOrder: async (listingId, orderData) => {
    return await apiService.post(`${BASE_PATH}/listings/${listingId}/order`, orderData);
  },

  // Cancel an order
  cancelOrder: async (orderId) => {
    return await apiService.put(`${BASE_PATH}/orders/${orderId}/cancel`);
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    return await apiService.put(`${BASE_PATH}/orders/${orderId}/status`, { status });
  },

  // Get market trends and analytics
  getMarketTrends: async (productType) => {
    return await apiService.get(`${BASE_PATH}/trends`, { productType });
  }
};

export default marketplaceService;