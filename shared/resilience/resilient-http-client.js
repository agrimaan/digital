/**
 * Resilient HTTP Client
 * 
 * This module provides a resilient HTTP client with circuit breaker, retry, and fallback mechanisms.
 */

const axios = require('axios');
const { CircuitBreaker, Retry, Bulkhead, decorators } = require('resilience4js');

class ResilientHttpClient {
  /**
   * Create a new ResilientHttpClient instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} [options.baseURL=''] - Base URL for requests
   * @param {number} [options.timeout=5000] - Request timeout in milliseconds
   * @param {number} [options.retries=3] - Number of retry attempts
   * @param {Object} [options.circuitBreakerOptions={}] - Circuit breaker options
   * @param {Object} [options.retryOptions={}] - Retry options
   * @param {Object} [options.bulkheadOptions={}] - Bulkhead options
   */
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 5000;
    this.retries = options.retries || 3;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout
    });
    
    // Create circuit breaker
    this.circuitBreaker = CircuitBreaker.of('http-client', {
      failureRateThreshold: options.circuitBreakerOptions?.failureRateThreshold || 50,
      waitDurationInOpenState: options.circuitBreakerOptions?.waitDurationInOpenState || 10000,
      slidingWindowSize: options.circuitBreakerOptions?.slidingWindowSize || 10,
      minimumNumberOfCalls: options.circuitBreakerOptions?.minimumNumberOfCalls || 5,
      permittedNumberOfCallsInHalfOpenState: options.circuitBreakerOptions?.permittedNumberOfCallsInHalfOpenState || 3,
      automaticTransitionFromOpenToHalfOpenEnabled: options.circuitBreakerOptions?.automaticTransitionFromOpenToHalfOpenEnabled !== false,
      ...options.circuitBreakerOptions
    });
    
    // Create retry
    this.retry = Retry.of('http-client', {
      maxAttempts: options.retryOptions?.maxAttempts || this.retries,
      waitDuration: options.retryOptions?.waitDuration || 1000,
      retryOnResult: options.retryOptions?.retryOnResult || (result => false),
      retryOnException: options.retryOptions?.retryOnException || (error => {
        // Retry on network errors and 5xx responses
        return !error.response || (error.response.status >= 500 && error.response.status < 600);
      }),
      ...options.retryOptions
    });
    
    // Create bulkhead
    this.bulkhead = Bulkhead.of('http-client', {
      maxConcurrentCalls: options.bulkheadOptions?.maxConcurrentCalls || 25,
      maxWaitDuration: options.bulkheadOptions?.maxWaitDuration || 0,
      ...options.bulkheadOptions
    });
    
    // Add listeners for circuit breaker events
    this.circuitBreaker.on('success', () => console.log('Circuit breaker: Request succeeded'));
    this.circuitBreaker.on('error', (error) => console.error('Circuit breaker: Request failed:', error));
    this.circuitBreaker.on('state_change', (state) => console.log(`Circuit breaker: State changed to ${state}`));
  }
  
  /**
   * Make a request with resilience patterns
   * 
   * @param {Object} config - Axios request config
   * @param {Function} [fallback] - Fallback function to call when all attempts fail
   * @returns {Promise<Object>} Response data
   */
  async request(config, fallback) {
    // Create decorated function with all resilience patterns
    const decoratedRequest = decorators.Decorators
      .ofPromise(async () => {
        try {
          const response = await this.client.request(config);
          return response.data;
        } catch (error) {
          if (error.response) {
            throw new Error(`Service returned error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
          } else if (error.request) {
            throw new Error('No response received from service');
          } else {
            throw new Error(`Request configuration error: ${error.message}`);
          }
        }
      })
      .withCircuitBreaker(this.circuitBreaker)
      .withRetry(this.retry)
      .withBulkhead(this.bulkhead)
      .build();
    
    try {
      return await decoratedRequest();
    } catch (error) {
      console.error(`Request failed after all attempts: ${error.message}`);
      
      // Use fallback if provided
      if (typeof fallback === 'function') {
        console.log('Using fallback function');
        return fallback(error);
      }
      
      throw error;
    }
  }
  
  /**
   * Make a GET request
   * 
   * @param {string} url - URL to request
   * @param {Object} [config={}] - Axios request config
   * @param {Function} [fallback] - Fallback function to call when all attempts fail
   * @returns {Promise<Object>} Response data
   */
  async get(url, config = {}, fallback) {
    return this.request({ ...config, method: 'GET', url }, fallback);
  }
  
  /**
   * Make a POST request
   * 
   * @param {string} url - URL to request
   * @param {Object} data - Data to send
   * @param {Object} [config={}] - Axios request config
   * @param {Function} [fallback] - Fallback function to call when all attempts fail
   * @returns {Promise<Object>} Response data
   */
  async post(url, data, config = {}, fallback) {
    return this.request({ ...config, method: 'POST', url, data }, fallback);
  }
  
  /**
   * Make a PUT request
   * 
   * @param {string} url - URL to request
   * @param {Object} data - Data to send
   * @param {Object} [config={}] - Axios request config
   * @param {Function} [fallback] - Fallback function to call when all attempts fail
   * @returns {Promise<Object>} Response data
   */
  async put(url, data, config = {}, fallback) {
    return this.request({ ...config, method: 'PUT', url, data }, fallback);
  }
  
  /**
   * Make a DELETE request
   * 
   * @param {string} url - URL to request
   * @param {Object} [config={}] - Axios request config
   * @param {Function} [fallback] - Fallback function to call when all attempts fail
   * @returns {Promise<Object>} Response data
   */
  async delete(url, config = {}, fallback) {
    return this.request({ ...config, method: 'DELETE', url }, fallback);
  }
}

module.exports = ResilientHttpClient;