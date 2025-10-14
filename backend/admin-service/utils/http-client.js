
/**
 * Independent HTTP Client for Admin Service
 * 
 * This module provides a resilient HTTP client that doesn't depend on the shared project.
 * It includes circuit breaker and retry mechanisms for improved reliability.
 */

const axios = require('axios');
const CircuitBreaker = require('opossum');

class IndependentHttpClient {
  constructor(options = {}) {
    this.serviceName = options.serviceName;
    this.circuitBreakerOptions = {
      timeout: 3000, // 3 seconds
      errorThresholdPercentage: 50, // 50% failure rate
      resetTimeout: 30000, // 30 seconds
      ...options.circuitBreakerOptions
    };
    
    this.retryOptions = {
      maxRetryAttempts: 3,
      retryDelay: 1000,
      ...options.retryOptions
    };

    this.serviceDiscovery = options.serviceDiscovery;
    this.circuitBreakers = new Map();
  }

  /**
   * Get or create a circuit breaker for a service
   */
  getCircuitBreaker(serviceName) {
    if (this.circuitBreakers.has(serviceName)) {
      return this.circuitBreakers.get(serviceName);
    }

    const requestFunction = async (config) => {
      // Discover service location
      const serviceUrl = await this.serviceDiscovery.getServiceUrl(serviceName);
      
      // Create axios instance with service URL
      const client = axios.create({
        baseURL: serviceUrl,
        timeout: this.circuitBreakerOptions.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        }
      });

      // Make the HTTP request
      return client(config);
    };

    const breaker = new CircuitBreaker(requestFunction, this.circuitBreakerOptions);

    // Add event listeners
    breaker.on('open', () => console.log(`Circuit for ${serviceName} is now OPEN.`));
    breaker.on('close', () => console.log(`Circuit for ${serviceName} is now CLOSED.`));
    breaker.on('halfOpen', () => console.log(`Circuit for ${serviceName} is now HALF-OPEN.`));

    this.circuitBreakers.set(serviceName, breaker);
    return breaker;
  }

  /**
   * Make an HTTP request with retry logic
   */
  async requestWithRetry(serviceName, config) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryOptions.maxRetryAttempts; attempt++) {
      try {
        const breaker = this.getCircuitBreaker(serviceName);
        const response = await breaker.fire(config);
        return response;
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed for ${serviceName}:`, error.message);
        
        if (attempt < this.retryOptions.maxRetryAttempts) {
          // Wait before retry
          await this.delay(this.retryOptions.retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get(url, config = {}) {
    return this.requestWithRetry(this.serviceName, {
      method: 'GET',
      url,
      ...config
    });
  }

  /**
   * POST request
   */
  async post(url, data, config = {}) {
    return this.requestWithRetry(this.serviceName, {
      method: 'POST',
      url,
      data,
      ...config
    });
  }

  /**
   * PUT request
   */
  async put(url, data, config = {}) {
    return this.requestWithRetry(this.serviceName, {
      method: 'PUT',
      url,
      data,
      ...config
    });
  }

  /**
   * DELETE request
   */
  async delete(url, config = {}) {
    return this.requestWithRetry(this.serviceName, {
      method: 'DELETE',
      url,
      ...config
    });
  }
}

module.exports = IndependentHttpClient;
