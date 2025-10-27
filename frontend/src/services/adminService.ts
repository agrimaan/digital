// Admin Service API Integration
import axios from "axios";
import { getSensors } from "features/sensors/sensorSlice";
import { get } from "http";
//import { API_BASE_URL } from "../config/apiConfig";
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';


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
      const response = await adminApi.get('/admin/stats');
      console.log('response.data:', response.data);
      return response.data;

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  //Get user count
  getUsersByRole: async () => {
    try {
      const response = await adminApi.get('/admin/stats/users');
      return response.data.cou;
    } catch (error) {
      console.error('Error fetching user count:', error);
      throw error;
    }
    },
    //get Field Count
    getFields: async () => {
      try {
        const response = await adminApi.get('/admin/stats/fields');
        return response.data;
      } catch (error) {
        console.error('Error fetching field count:', error);
        throw error;
      }
    },
    //Get Crop Count
    getCrops: async () => {
      try {
        const response = await adminApi.get('/admin/stats/crops');
        return response.data;
        } catch (error) {
        console.error('Error fetching crop count:', error);
        throw error;
      }
    },
    //Get Sensor Count
    getSensors: async () => {
      try {
        const response = await adminApi.get('/admin/stats/sensors');
         return response.data;
        } catch (error) {
          console.error("Error fetching sensor count:", error);
          throw error;
        }
      },
    // Get order count
    getOrders: async () => {
      try {
        const response = await adminApi.get('/admin/stats/orders');
        return response.data;
      } catch (error) {
        console.error("Error fetching order count:", error);
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

  // Get system health status
  getSystemHealth: async () => {
    try {
      const response = await adminApi.get("/admin/stats/system/health");
      return response.data;
    } catch (error) {
      console.error("Error fetching system health:", error);
      throw error;
    }
  },


  // Get pending verifications
  getPendingVerifications: async () => {
    try {
      const response = await adminApi.get("/admin/verification/pending");
      return response.data;
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      throw error;
    }
  },

  //Get Bulk Upload Count
  getBulkUploadCount: async () => { 
    try {
      const response = await adminApi.get('/admin/stats/bulk-upload');
      return response.data;
    } catch (error) {
      console.error('Error fetching bulk upload count:', error);
      throw error;
    }
  }
};

export default {
  dashboard: adminDashboardAPI,
};
