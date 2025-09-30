const axios = require('axios');
const CircuitBreaker = require('opossum');
const { serviceDiscovery } = require('../service-discovery');

/**
 * Creates a resilient HTTP client with a circuit breaker for a specific service.
 *
 * @param {string} serviceName - The name of the service to connect to (e.g., 'user-service').
 * @param {object} options - Opossum circuit breaker options.
 */
function createResilientClient(serviceName, options = {}) {
  // Default options for the circuit breaker
  const defaultOptions = {
    timeout: 3000, // If the function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
    resetTimeout: 30000, // After 30 seconds, half-open the circuit and try again
    ...options,
  };

  // The main function that will be wrapped by the circuit breaker
  const requestFunction = async (config) => {
    // 1. Discover the service location from the registry (e.g., Consul)
    const service = await serviceDiscovery.getService(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' not found in registry.`);
    }

    const baseURL = `http://${service.address}:${service.port}`;
    const client = axios.create({ baseURL });

    // 2. Make the actual HTTP request
    return client(config);
  };

  // 3. Create a new circuit breaker instance wrapping the request function
  const breaker = new CircuitBreaker(requestFunction, defaultOptions);

  // Optional: Add event listeners to monitor the circuit's state
  breaker.on('open', () => console.log(`Circuit for ${serviceName} is now OPEN.`));
  breaker.on('close', () => console.log(`Circuit for ${serviceName} is now CLOSED.`));
  breaker.on('fallback', () => console.warn(`Circuit for ${serviceName} is OPEN. Executing fallback.`));

  // 4. Return a simple interface to make requests through the circuit breaker
  return {
    get: (url, config = {}) => breaker.fire({ ...config, method: 'get', url }),
    post: (url, data, config = {}) => breaker.fire({ ...config, method: 'post', url, data }),
    put: (url, data, config = {}) => breaker.fire({ ...config, method: 'put', url, data }),
    delete: (url, config = {}) => breaker.fire({ ...config, method: 'delete', url }),
  };
}

module.exports = {
  createResilientClient,
};