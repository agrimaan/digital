// Admin Service API Integration
import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/api`;

// Get auth token from localStorage or Redux store
const getAuthToken = () => {
  const token = localStorage.getItem("token");
  return token ? `Bearer ${token}` : "";
};

// Create axios instance with auth header
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
adminApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Handle response errors
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Dashboard APIs
export const adminDashboardAPI = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await adminApi.get("/admin/stats");
      console.log('Dashboard stats response:', response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Return empty data structure instead of throwing to prevent dashboard from breaking
      return {
        success: false,
        data: {
          counts: { users: 0, fields: 0, crops: 0, sensors: 0, orders: 0, bulkUploads: 0 },
          usersByRole: {},
          recentUsers: [],
          recentOrders: []
        }
      };
    }
  },

  // Get recent users
  getRecentUsers: async (limit = 10) => {
    try {
      const response = await adminApi.get(`/admin/stats/users/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching recent users:", error);
      return { success: false, data: [] };
    }
  },

  // Get recent orders
  getRecentOrders: async (limit = 10) => {
    try {
      const response = await adminApi.get(`/admin/stats/orders/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      return { success: false, data: [] };
    }
  },

  // Get pending verifications
  getPendingVerifications: async () => {
    try {
      const response = await adminApi.get("/admin/stats/verification/pending");
      return response.data;
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      return { success: false, data: [] };
    }
  },

  // Get system health status
  getSystemHealth: async () => {
    try {
      const response = await adminApi.get("/admin/stats/system/health");
      return response.data;
    } catch (error) {
      console.error("Error fetching system health:", error);
      return {
        success: false,
        data: {
          status: 'unknown',
          services: {},
          timestamp: new Date()
        }
      };
    }
  },
};

export default {
  dashboard: adminDashboardAPI,
};
