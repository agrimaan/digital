

const ResilientHttpClient = require('./resilient-http-client');
const ServiceDiscovery = require('../service-discovery/service-discovery');

class SensorServiceClient {
  constructor() {
    this.serviceDiscovery = new ServiceDiscovery();
    this.httpClient = new ResilientHttpClient({
      serviceName: 'iot-service',
      circuitBreakerOptions: {
        failureRateThreshold: 50,
        waitDurationInOpenState: 10000,
        slidingWindowSize: 10
      },
      retryOptions: {
        maxRetryAttempts: 3,
        retryDelay: 1000
      }
    });
  }

  async getSensorStats() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('iot-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/sensor-stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensor stats:', error.message);
      return {
        totalSensors: 0,
        activeSensors: 0,
        sensorsByType: {},
        sensorsByStatus: {}
      };
    }
  }

  async getAllSensors() {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('iot-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/admin/sensors`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all sensors:', error.message);
      return [];
    }
  }

  async getSensorById(sensorId) {
    try {
      const serviceUrl = await this.serviceDiscovery.getServiceUrl('iot-service');
      const response = await this.httpClient.get(`${serviceUrl}/api/sensors/${sensorId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get sensor ${sensorId}:`, error.message);
      throw error;
    }
  }
}

module.exports = new SensorServiceClient();
