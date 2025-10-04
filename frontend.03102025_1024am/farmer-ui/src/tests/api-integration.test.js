import apiService from '../services/api';
import farmService from '../services/farmService';
import cropService from '../services/cropService';
import weatherService from '../services/weatherService';
import marketplaceService from '../services/marketplaceService';
import { mockApiResponses } from '../test-setup';

// Mock axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      get: jest.fn((url, config) => {
        // Mock different API responses based on URL
        if (url.includes('/farms')) {
          return Promise.resolve({ data: mockApiResponses.farms });
        } else if (url.includes('/crops')) {
          return Promise.resolve({ data: mockApiResponses.crops });
        } else if (url.includes('/weather')) {
          return Promise.resolve({ data: mockApiResponses.weather });
        } else if (url.includes('/marketplace')) {
          return Promise.resolve({ data: mockApiResponses.marketTrends });
        }
        return Promise.reject(new Error('Not found'));
      }),
      post: jest.fn((url, data) => {
        if (url.includes('/auth/login')) {
          return Promise.resolve({ data: mockApiResponses.login.success });
        } else if (url.includes('/farms')) {
          return Promise.resolve({ 
            data: { 
              id: '3', 
              name: data.name, 
              size: data.size,
              location: data.location
            } 
          });
        }
        return Promise.reject(new Error('Not found'));
      }),
      put: jest.fn(() => Promise.resolve({ data: { success: true } })),
      delete: jest.fn(() => Promise.resolve({ data: { success: true } })),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      },
      defaults: {
        headers: {
          common: {}
        }
      }
    }))
  };
});

describe('API Integration', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  });

  describe('API Service', () => {
    test('adds auth token to requests when available', async () => {
      const mockGet = require('axios').create().get;
      await apiService.get('/test');
      
      expect(localStorage.getItem).toHaveBeenCalledWith('token');
      expect(mockGet).toHaveBeenCalled();
    });

    test('handles API errors correctly', async () => {
      const mockGet = require('axios').create().get;
      mockGet.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Server error' } } });
      
      await expect(apiService.get('/error-endpoint')).rejects.toThrow();
    });

    test('redirects to login on 401 unauthorized', async () => {
      const mockGet = require('axios').create().get;
      mockGet.mockRejectedValueOnce({ response: { status: 401 } });
      
      // Mock window.location
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' };
      
      await expect(apiService.get('/protected')).rejects.toThrow();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(window.location.href).toBe('/login');
      
      // Restore window.location
      window.location = originalLocation;
    });
  });

  describe('Farm Service', () => {
    test('fetches farms correctly', async () => {
      const farms = await farmService.getFarms();
      expect(farms).toEqual(mockApiResponses.farms);
    });

    test('creates a new farm', async () => {
      const newFarm = {
        name: 'Test Farm',
        size: 30,
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Bangalore, India'
        }
      };
      
      const result = await farmService.createFarm(newFarm);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(newFarm.name);
    });

    test('updates a farm', async () => {
      const farmId = '1';
      const updateData = { name: 'Updated Farm Name' };
      
      const result = await farmService.updateFarm(farmId, updateData);
      expect(result).toHaveProperty('success', true);
    });

    test('deletes a farm', async () => {
      const farmId = '1';
      const result = await farmService.deleteFarm(farmId);
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('Crop Service', () => {
    test('fetches crops correctly', async () => {
      const crops = await cropService.getCrops();
      expect(crops).toEqual(mockApiResponses.crops);
    });
  });

  describe('Weather Service', () => {
    test('fetches current weather correctly', async () => {
      const weather = await weatherService.getCurrentWeather(28.6139, 77.2090);
      expect(weather).toEqual(mockApiResponses.weather);
    });
  });

  describe('Marketplace Service', () => {
    test('fetches market trends correctly', async () => {
      const trends = await marketplaceService.getMarketTrends();
      expect(trends).toEqual(mockApiResponses.marketTrends);
    });
  });
});