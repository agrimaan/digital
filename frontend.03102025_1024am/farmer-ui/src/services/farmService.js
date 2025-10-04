import apiService from './api';

const BASE_PATH = '/farms';

const farmService = {
  // Get all farms for the current user
  getFarms: async () => {
    return await apiService.get(BASE_PATH);
  },

  // Get a specific farm by ID
  getFarm: async (farmId) => {
    return await apiService.get(`${BASE_PATH}/${farmId}`);
  },

  // Create a new farm
  createFarm: async (farmData) => {
    return await apiService.post(BASE_PATH, farmData);
  },

  // Update an existing farm
  updateFarm: async (farmId, farmData) => {
    return await apiService.put(`${BASE_PATH}/${farmId}`, farmData);
  },

  // Delete a farm
  deleteFarm: async (farmId) => {
    return await apiService.delete(`${BASE_PATH}/${farmId}`);
  },

  // Get farm statistics
  getFarmStats: async (farmId) => {
    return await apiService.get(`${BASE_PATH}/${farmId}/stats`);
  },

  // Get farm fields
  getFarmFields: async (farmId) => {
    return await apiService.get(`${BASE_PATH}/${farmId}/fields`);
  },

  // Get farm crops
  getFarmCrops: async (farmId) => {
    return await apiService.get(`${BASE_PATH}/${farmId}/crops`);
  }
};

export default farmService;