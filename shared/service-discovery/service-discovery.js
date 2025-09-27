/**
 * Service Discovery Module
 * 
 * This module provides functionality for discovering services registered with Consul.
 * It handles service lookup, caching, and failover logic.
 */

const Consul = require('consul');

class ServiceDiscovery {
  /**
   * Create a new ServiceDiscovery instance
   * 
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.cacheTimeout=10000] - Cache timeout in milliseconds
   */
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
   * 
   * @param {string} serviceName - Name of the service to discover
   * @returns {Promise<string>} A promise that resolves to the service URL
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
        
        // Simple load balancing - random selection from healthy instances
        const healthyServices = result.filter(service => 
          service.Checks && service.Checks.every(check => check.Status === 'passing')
        );
        
        if (healthyServices.length === 0) {
          console.error(`No healthy instances of ${serviceName} found`);
          return reject(new Error(`No healthy instances of ${serviceName} found`));
        }
        
        const service = healthyServices[Math.floor(Math.random() * healthyServices.length)];
        const url = `http://${service.ServiceAddress || service.Address}:${service.ServicePort}`;
        
        // Update cache
        this.cache[serviceName] = {
          url,
          timestamp: now
        };
        
        resolve(url);
      });
    });
  }

  /**
   * Get all instances of a service
   * 
   * @param {string} serviceName - Name of the service to discover
   * @returns {Promise<Array>} A promise that resolves to an array of service instances
   */
  async getServiceInstances(serviceName) {
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
        
        resolve(result);
      });
    });
  }

  /**
   * Clear the service discovery cache
   * 
   * @param {string} [serviceName] - Optional service name to clear from cache
   */
  clearCache(serviceName) {
    if (serviceName) {
      delete this.cache[serviceName];
    } else {
      this.cache = {};
    }
  }
}

module.exports = ServiceDiscovery;