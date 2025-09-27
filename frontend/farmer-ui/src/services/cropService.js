import apiService from './api';

const BASE_PATH = '/crops';

const cropService = {
  // Get all crops for the current user
  getCrops: async () => {
    return await apiService.get(BASE_PATH);
  },

  // Get a specific crop by ID
  getCrop: async (cropId) => {
    return await apiService.get(`${BASE_PATH}/${cropId}`);
  },

  // Create a new crop
  createCrop: async (cropData) => {
    return await apiService.post(BASE_PATH, cropData);
  },

  // Update an existing crop
  updateCrop: async (cropId, cropData) => {
    return await apiService.put(`${BASE_PATH}/${cropId}`, cropData);
  },

  // Delete a crop
  deleteCrop: async (cropId) => {
    return await apiService.delete(`${BASE_PATH}/${cropId}`);
  },

  // Get crop health data
  getCropHealth: async (cropId) => {
    return await apiService.get(`${BASE_PATH}/${cropId}/health`);
  },

  // Get crop yield predictions
  getCropYieldPrediction: async (cropId) => {
    return await apiService.get(`${BASE_PATH}/${cropId}/yield-prediction`);
  },

  // Get crop market prices
  getCropMarketPrices: async (cropType) => {
    return await apiService.get(`${BASE_PATH}/market-prices`, { type: cropType });
  },

  // Report crop disease
  reportCropDisease: async (cropId, diseaseData) => {
    return await apiService.post(`${BASE_PATH}/${cropId}/disease-report`, diseaseData);
  }
};

export default cropService;