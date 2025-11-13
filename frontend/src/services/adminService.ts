
// Admin Service API Integration - Using BFF
import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/api/admin/`;

// Get auth token from localStorage or Redux store
const getAuthToken = () => {
  const token = localStorage.getItem("token");
  return token ? `Bearer ${token}` : "";
};

// Create axios instance with auth header
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
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
      // Handle unauthorized access+
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Dashboard APIs - Using BFF endpoints
export const adminDashboardAPI = {
  // Get complete dashboard data
  getDashboard: async () => {
    try {
      const response = await adminApi.get("/dashboard");
      console.log('Complete dashboard data:', response.data);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      throw error;
    }
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await adminApi.get("/dashboard/stats");
      console.log('Dashboard stats:', response.data);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  // Get recent users
  getRecentUsers: async (limit = 10) => {
    try {
      const response = await adminApi.get(`/dashboard/users/recent?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching recent users:", error);
      throw error;
    }
  },

  // Get recent orders
  getRecentOrders: async (limit = 10) => {
    try {
      const response = await adminApi.get(`/dashboard/orders/recent?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      throw error;
    }
  },

  // Get pending verifications
  getPendingVerifications: async () => {
    try {
      const response = await adminApi.get("/dashboard/verification/pending");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      throw error;
    }
  },

  // Get system health status
  getSystemHealth: async () => {
    try {
      const response = await adminApi.get("/dashboard/system/health");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching system health:", error);
      throw error;
    }
  },

  // Get all resources
  getResources: async () => {
    try {
      const response = await adminApi.get("/dashboard/resources");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching resources:", error);
      throw error;
    }
  },

  // Get all land tokens
  getLandTokens: async () => {
    try {
      const response = await adminApi.get("/dashboard/land-tokens");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching land tokens:", error);
      throw error;
    }
  },

  // Get all bulk uploads
  getBulkUploads: async () => {
    try {
      const response = await adminApi.get("/dashboard/bulk-uploads");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching bulk uploads:", error);
      throw error;
    }
  },
};

// Resource Management APIs
export const adminResourceAPI = {
  // Get all resources
  getResources: async () => {
    try {
      const response = await adminApi.get("/resources");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching resources:", error);
      throw error;
    }
  },

  // Get resource by ID
  getResourceById: async (id: string) => {
    try {
      const response = await adminApi.get(`/resources/${id}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching resource:", error);
      throw error;
    }
  },

  // Create resource
  createResource: async (data: any) => {
    try {
      const response = await adminApi.post("/resources", data);
      return response.data.data;
    } catch (error) {
      console.error("Error creating resource:", error);
      throw error;
    }
  },

  // Update resource
  updateResource: async (id: string, data: any) => {
    try {
      const response = await adminApi.put(`/resources/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error("Error updating resource:", error);
      throw error;
    }
  },

  // Delete resource
  deleteResource: async (id: string) => {
    try {
      const response = await adminApi.delete(`/resources/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting resource:", error);
      throw error;
    }
  },
};

export default {
  dashboard: adminDashboardAPI,
  resources: adminResourceAPI,
};
