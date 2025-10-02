import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic CRUD operations
const apiService = {
  // GET request
  get: async (endpoint, params = {}) => {
    try {
      const response = await api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error);
      throw error;
    }
  },

  // POST request
  post: async (endpoint, data = {}) => {
    try {
      const response = await api.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error posting data to ${endpoint}:`, error);
      throw error;
    }
  },

  // PUT request
  put: async (endpoint, data = {}) => {
    try {
      const response = await api.put(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating data at ${endpoint}:`, error);
      throw error;
    }
  },

  // DELETE request
  delete: async (endpoint) => {
    try {
      const response = await api.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error deleting data at ${endpoint}:`, error);
      throw error;
    }
  }
};

export default apiService;