/**
 * Service Registry Module
 * 
 * This module provides functionality for registering and deregistering services with Consul.
 * It handles service registration, health checks, and deregistration on shutdown.
 */

const Consul = require('consul');
const os = require('os');

class ServiceRegistry {
  /**
   * Create a new ServiceRegistry instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.serviceName - Name of the service
   * @param {number} options.servicePort - Port the service is running on
   * @param {string[]} [options.tags=[]] - Tags for the service
   * @param {string} [options.healthCheckUrl='/health'] - URL for health check endpoint
   * @param {string} [options.healthCheckInterval='15s'] - Interval for health checks
   */
  constructor(options) {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'consul-server',
      port: process.env.CONSUL_PORT || '8500'
    });
    
    this.serviceName = options.serviceName;
    this.serviceId = `${this.serviceName}-${os.hostname()}-${options.servicePort}`;
    this.servicePort = options.servicePort;
    this.tags = options.tags || [];
    this.healthCheckUrl = options.healthCheckUrl || `/health`;
    this.healthCheckInterval = options.healthCheckInterval || '15s';
  }

  /**
   * Register the service with Consul
   * 
   * @returns {Promise<void>} A promise that resolves when registration is complete
   */
  register() {
    const serviceDefinition = {
      id: this.serviceId,
      name: this.serviceName,
      address: os.hostname(),
      port: parseInt(this.servicePort),
      tags: this.tags,
      check: {
        http: `http://${os.hostname()}:${this.servicePort}${this.healthCheckUrl}`,
        interval: this.healthCheckInterval,
        timeout: '5s'
      }
    };

    return new Promise((resolve, reject) => {
      this.consul.agent.service.register(serviceDefinition, (err) => {
        if (err) {
          console.error(`Failed to register service: ${err.message}`);
          return reject(err);
        }
        console.log(`Service registered: ${this.serviceId}`);
        resolve();
      });
    });
  }

  /**
   * Deregister the service from Consul
   * 
   * @returns {Promise<void>} A promise that resolves when deregistration is complete
   */
  deregister() {
    return new Promise((resolve, reject) => {
      this.consul.agent.service.deregister(this.serviceId, (err) => {
        if (err) {
          console.error(`Failed to deregister service: ${err.message}`);
          return reject(err);
        }
        console.log(`Service deregistered: ${this.serviceId}`);
        resolve();
      });
    });
  }

  /**
   * Setup graceful shutdown to deregister service
   * 
   * @param {Object} server - HTTP server instance
   */
  setupGracefulShutdown(server) {
    // Handle process termination and gracefully deregister service
    const gracefulShutdown = async () => {
      console.log('Received shutdown signal, deregistering service...');
      
      try {
        await this.deregister();
        console.log('Service deregistered successfully');
      } catch (error) {
        console.error('Error deregistering service:', error);
      }
      
      // Close server
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
      
      // Force exit after timeout
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }
}

module.exports = ServiceRegistry
