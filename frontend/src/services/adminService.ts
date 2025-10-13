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
      const response = await adminApi.get("/admin/dashboard/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  // Get recent users
  getRecentUsers: async (limit = 10) => {
    try {
      const response = await adminApi.get(`/users/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching recent users:", error);
      throw error;
    }
  },

  // Get recent orders
  getRecentOrders: async (limit = 10) => {
    try {
      const response = await adminApi.get(`/marketplace/orders/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      throw error;
    }
  },

  // Get pending verifications
  getPendingVerifications: async () => {
    try {
      const response = await adminApi.get("/admin/dashboard/verification/pending");
      return response.data;
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      throw error;
    }
  },

  // Get system health status
  getSystemHealth: async () => {
    try {
      const response = await adminApi.get("/admin/dashboard/system/health");
      return response.data;
    } catch (error) {
      console.error("Error fetching system health:", error);
      throw error;
    }
  },
};

export default {
  dashboard: adminDashboardAPI,
};
