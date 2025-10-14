
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

    return new Promise((resolve, reject) => {
      this.consul.catalog.service.nodes(serviceName, (err, result) => {
        if (err) {
          console.error(`Service discovery error for ${serviceName}: ${err.message}`);
          return reject(err);
        }
        
        if (!result || result.length === 0) {
          console.error(`Service ${serviceName} not found`);
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
        this.cache[serviceName] = {
          url: serviceUrl,
          timestamp: now
        };

        resolve(serviceUrl);
      });
    });
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
