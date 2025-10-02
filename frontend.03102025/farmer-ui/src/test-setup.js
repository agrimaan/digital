// Test setup file for end-to-end testing

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock API responses
const mockApiResponses = {
  login: {
    success: {
      token: 'mock-jwt-token',
      user: {
        id: '1',
        firstName: 'Test',
        lastName: 'Farmer',
        email: 'farmer@agrimaan.com',
        role: 'farmer'
      }
    },
    error: {
      message: 'Invalid credentials'
    }
  },
  farms: [
    {
      id: '1',
      name: 'Green Valley Farm',
      size: 25,
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'Delhi, India'
      },
      crops: ['wheat', 'rice', 'corn']
    },
    {
      id: '2',
      name: 'Sunshine Fields',
      size: 15,
      location: {
        latitude: 19.0760,
        longitude: 72.8777,
        address: 'Mumbai, India'
      },
      crops: ['cotton', 'sugarcane']
    }
  ],
  crops: [
    {
      id: '1',
      name: 'Wheat',
      farmId: '1',
      plantedDate: '2025-03-15',
      expectedHarvestDate: '2025-07-15',
      area: 10,
      currentYield: 35,
      expectedYield: 40,
      health: 'good'
    },
    {
      id: '2',
      name: 'Rice',
      farmId: '1',
      plantedDate: '2025-04-01',
      expectedHarvestDate: '2025-08-01',
      area: 8,
      currentYield: 28,
      expectedYield: 32,
      health: 'excellent'
    },
    {
      id: '3',
      name: 'Cotton',
      farmId: '2',
      plantedDate: '2025-02-20',
      expectedHarvestDate: '2025-06-20',
      area: 15,
      currentYield: 42,
      expectedYield: 45,
      health: 'fair'
    }
  ],
  weather: {
    location: 'Delhi, India',
    temperature: 32,
    condition: 'Sunny',
    humidity: 65,
    windSpeed: 12,
    forecast: [
      { date: '2025-09-27', high: 33, low: 24, condition: 'Sunny' },
      { date: '2025-09-28', high: 34, low: 25, condition: 'Partly Cloudy' },
      { date: '2025-09-29', high: 30, low: 23, condition: 'Rain' }
    ]
  },
  marketTrends: [
    { date: '2025-09-20', wheat: 2200, rice: 3100, corn: 1800 },
    { date: '2025-09-21', wheat: 2250, rice: 3050, corn: 1850 },
    { date: '2025-09-22', wheat: 2300, rice: 3000, corn: 1900 },
    { date: '2025-09-23', wheat: 2280, rice: 3020, corn: 1920 },
    { date: '2025-09-24', wheat: 2320, rice: 3080, corn: 1890 },
    { date: '2025-09-25', wheat: 2350, rice: 3100, corn: 1870 },
    { date: '2025-09-26', wheat: 2400, rice: 3150, corn: 1900 }
  ]
};

// Export mock data for tests
export { mockApiResponses };