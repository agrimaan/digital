import apiService from './api';

const BASE_PATH = '/weather';

const weatherService = {
  // Get current weather for a location
  getCurrentWeather: async (latitude, longitude) => {
    return await apiService.get(`${BASE_PATH}/current`, { 
      latitude, 
      longitude 
    });
  },

  // Get weather forecast for a location
  getWeatherForecast: async (latitude, longitude, days = 7) => {
    return await apiService.get(`${BASE_PATH}/forecast`, { 
      latitude, 
      longitude, 
      days 
    });
  },

  // Get historical weather data
  getHistoricalWeather: async (latitude, longitude, startDate, endDate) => {
    return await apiService.get(`${BASE_PATH}/historical`, { 
      latitude, 
      longitude, 
      startDate, 
      endDate 
    });
  },

  // Get weather alerts for a location
  getWeatherAlerts: async (latitude, longitude) => {
    return await apiService.get(`${BASE_PATH}/alerts`, { 
      latitude, 
      longitude 
    });
  },

  // Get seasonal forecast
  getSeasonalForecast: async (latitude, longitude) => {
    return await apiService.get(`${BASE_PATH}/seasonal-forecast`, { 
      latitude, 
      longitude 
    });
  },

  // Subscribe to weather alerts
  subscribeToAlerts: async (farmId, alertTypes) => {
    return await apiService.post(`${BASE_PATH}/subscribe`, { 
      farmId, 
      alertTypes 
    });
  },

  // Unsubscribe from weather alerts
  unsubscribeFromAlerts: async (subscriptionId) => {
    return await apiService.delete(`${BASE_PATH}/subscribe/${subscriptionId}`);
  }
};

export default weatherService;