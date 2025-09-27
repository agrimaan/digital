/**
 * Retry Utility
 * 
 * This module provides utility functions for retrying operations with exponential backoff.
 */

/**
 * Retry a function with exponential backoff
 * 
 * @param {Function} fn - Function to retry
 * @param {Object} [options={}] - Retry options
 * @param {number} [options.retries=3] - Maximum number of retry attempts
 * @param {number} [options.delay=1000] - Initial delay in milliseconds
 * @param {number} [options.backoffFactor=2] - Factor to multiply delay by for each retry
 * @param {number} [options.maxDelay=30000] - Maximum delay in milliseconds
 * @param {Function} [options.shouldRetry] - Function to determine if retry should be attempted
 * @returns {Promise<any>} Result of the function
 */
async function retry(fn, options = {}) {
  const maxRetries = options.retries || 3;
  const initialDelay = options.delay || 1000;
  const backoffFactor = options.backoffFactor || 2;
  const maxDelay = options.maxDelay || 30000;
  const shouldRetry = options.shouldRetry || (() => true);
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt > maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
      
      console.log(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Create a retryable version of a function
 * 
 * @param {Function} fn - Function to make retryable
 * @param {Object} [options={}] - Retry options
 * @returns {Function} Retryable function
 */
function retryable(fn, options = {}) {
  return (...args) => retry(() => fn(...args), options);
}

module.exports = { retry, retryable };