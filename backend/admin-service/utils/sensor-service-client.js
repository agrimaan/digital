
/**
 * Independent Sensor Service Client for Admin Service
 * 
 * This module provides a resilient client for interacting with the iot-service
 * without depending on the shared project.
 */

const IndependentHttpClient = require('./http-client');
const IndependentServiceDiscovery = require('./service-discovery');

class IndependentSensorServiceClient {
  constructor() {
    this.serviceDiscovery = new IndependentServiceDiscovery();
    this.httpClient = new IndependentHttpClient({
      serviceName: 'iot-service',
      circuitBreakerOptions: {
        failureRateThreshold: 50,
        waitDurationInOpenState: 10000,
        slidingWindowSize: 10
      },
      retryOptions: {
        maxRetryAttempts: 3,
        retryDelay: 1000
      },
      serviceDiscovery: this.serviceDiscovery
    });
  }

  /**
   * Get sensor by ID
   */
  async getSensorById(sensorId) {
    try {
      const response = await this.httpClient.get(`/api/sensors/${sensorId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get sensor ${sensorId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all sensors
   */
  async getAllSensors() {
    try {
      const response = await this.httpClient.get('/api/sensors');
      return response.data;
    } catch (error) {
      console.error('Failed to get all sensors:', error.message);
      throw error;
    }
  }

  /**
   * Create sensor
   */
  async createSensor(sensorData) {
    try {
      const response = await this.httpClient.post('/api/sensors', sensorData);
      return response.data;
    } catch (error) {
      console.error('Failed to create sensor:', error.message);
      throw error;
    }
  }

  /**
   * Update sensor
   */
  async updateSensor(sensorId, sensorData) {
    try {
      const response = await this.httpClient.put(`/api/sensors/${sensorId}`, sensorData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update sensor ${sensorId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete sensor
   */
  async deleteSensor(sensorId) {
    try {
      const response = await this.httpClient.delete(`/api/sensors/${sensorId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete sensor ${sensorId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get sensors by type
   */
  async getSensorsByType(type) {
    try {
      const response = await this.httpClient.get(`/api/sensors/type/${type}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get sensors by type ${type}:`, error.message);
      throw error;
    }
  }

  /**
   * Get sensors by location
   */
  async getSensorsByLocation(location) {
    try {
      const response = await this.httpClient.get(`/api/sensors/location/${encodeURIComponent(location)}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get sensors by location ${location}:`, error.message);
      throw error;
    }
  }

  /**
   * Get sensor readings
   */
  async getSensorReadings(sensorId, limit = 100) {
    try {
      const response = await this.httpClient.get(`/api/sensors/${sensorId}/readings`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get sensor readings for ${sensorId}:`, error.message);
      throw error;
    }
  }

  /**
   * Search sensors
   */
  async searchSensors(query) {
    try {
      const response = await this.httpClient.get('/api/sensors/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to search sensors with query ${query}:`, error.message);
      throw error;
    }
  }
}

module.exports = IndependentSensorServiceClient;
