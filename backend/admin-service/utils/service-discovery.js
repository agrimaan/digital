
/**
 * Independent Service Discovery for Admin Service
 * 
 * This module provides service discovery functionality without depending on the shared project.
 * It uses Consul for service lookup with caching and failover logic.
 */

const Consul = require('consul');

class IndependentServiceDiscovery {
  constructor(options = {}) {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'consul-server',
      port: process.env.CONSUL_PORT || '8500'
    });
    
    this.cache = {};
    this.cacheTimeout = options.cacheTimeout || 10000; // 10 seconds
  }

  /**
   * Get the URL for a service
   */
  async getServiceUrl(serviceName) {
    // Check cache first
    const now = Date.now();
    if (this.cache[serviceName] && this.cache[serviceName].timestamp > now - this.cacheTimeout) {
      return this.cache[serviceName].url;
    }

    // Try Consul first, then fallback to environment variables
    try {
      return await this.getServiceUrlFromConsul(serviceName);
    } catch (consulError) {
      console.warn(`Consul unavailable for ${serviceName}, using fallback URL`);
      return this.getFallbackServiceUrl(serviceName);
    }
  }

  /**
   * Get service URL from Consul
   */
  async getServiceUrlFromConsul(serviceName) {
    return new Promise((resolve, reject) => {
      this.consul.catalog.service.nodes(serviceName, (err, result) => {
        if (err) {
          console.error(`Service discovery error for ${serviceName}: ${err.message}`);
          return reject(err);
        }
        
        if (!result || result.length === 0) {
          console.error(`Service ${serviceName} not found in Consul`);
          return reject(new Error(`Service ${serviceName} not found`));
        }

        // Select a random healthy service instance (load balancing)
        const healthyServices = result.filter(service => service.Checks && 
          service.Checks.every(check => check.Status === 'passing'));
        
        if (healthyServices.length === 0) {
          console.warn(`No healthy instances found for ${serviceName}, using any available`);
        }

        const selectedService = healthyServices.length > 0 
          ? healthyServices[Math.floor(Math.random() * healthyServices.length)]
          : result[Math.floor(Math.random() * result.length)];

        const serviceUrl = `http://${selectedService.ServiceAddress || selectedService.Address}:${selectedService.ServicePort}`;
        
        // Cache the result
        const now = Date.now();
        this.cache[serviceName] = {
          url: serviceUrl,
          timestamp: now
        };

        resolve(serviceUrl);
      });
    });
  }

  /**
   * Get fallback service URL from environment variables
   */
  getFallbackServiceUrl(serviceName) {
    const fallbackUrls = {
      'user-service': process.env.USER_SERVICE_URL || 'http://localhost:3002',
      'field-service': process.env.FIELD_SERVICE_URL || 'http://localhost:3003',
      'iot-service': process.env.IOT_SERVICE_URL || 'http://localhost:3004',
      'crop-service': process.env.CROP_SERVICE_URL || 'http://localhost:3005',
      'marketplace-service': process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3006',
      'logistics-service': process.env.LOGISTICS_SERVICE_URL || 'http://localhost:3007',
      'weather-service': process.env.WEATHER_SERVICE_URL || 'http://localhost:3008',
      'analytics-service': process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009',
      'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3010',
      'blockchain-service': process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3011',
      'admin-service': process.env.ADMIN_SERVICE_URL || 'http://localhost:3012',
      'reference-data-service': process.env.REFERENCE_SERVICE_URL || 'http://localhost:3013',
      'resource-service': process.env.RESOURCE_SERVICE_URL || 'http://localhost:3014'
    };

    const url = fallbackUrls[serviceName];
    if (!url) {
      throw new Error(`No fallback URL configured for service: ${serviceName}`);
    }

    console.log(`Using fallback URL for ${serviceName}: ${url}`);
    
    // Cache the fallback URL
    const now = Date.now();
    this.cache[serviceName] = {
      url: url,
      timestamp: now
    };

    return url;
  }

  /**
   * Get all healthy instances of a service
   */
  async getServiceInstances(serviceName) {
    return new Promise((resolve, reject) => {
      this.consul.catalog.service.nodes(serviceName, (err, result) => {
        if (err) {
          console.error(`Service discovery error for ${serviceName}: ${err.message}`);
          return reject(err);
        }
        
        if (!result || result.length === 0) {
          return resolve([]);
        }

        const instances = result.map(service => ({
          id: service.ID,
          name: service.ServiceName,
          address: service.ServiceAddress || service.Address,
          port: service.ServicePort,
          tags: service.ServiceTags || [],
          healthy: service.Checks ? service.Checks.every(check => check.Status === 'passing') : true,
          url: `http://${service.ServiceAddress || service.Address}:${service.ServicePort}`
        }));

        resolve(instances);
      });
    });
  }

  /**
   * Check if a service is healthy
   */
  async isServiceHealthy(serviceName) {
    try {
      const instances = await this.getServiceInstances(serviceName);
      return instances.some(instance => instance.healthy);
    } catch (error) {
      console.error(`Health check failed for ${serviceName}:`, error.message);
      return false;
    }
  }

  /**
   * Clear cache for a specific service
   */
  clearCache(serviceName) {
    if (serviceName) {
      delete this.cache[serviceName];
    } else {
      this.cache = {};
    }
  }

  /**
   * Get service URL with fallback
   */
  async getServiceUrlWithFallback(primaryService, fallbackService) {
    try {
      return await this.getServiceUrl(primaryService);
    } catch (error) {
      console.warn(`Primary service ${primaryService} unavailable, trying fallback ${fallbackService}`);
      
      if (fallbackService) {
        try {
          return await this.getServiceUrl(fallbackService);
        } catch (fallbackError) {
          throw new Error(`Both primary (${primaryService}) and fallback (${fallbackService}) services are unavailable`);
        }
      }
      
      throw error;
    }
  }
}

module.exports = IndependentServiceDiscovery;
