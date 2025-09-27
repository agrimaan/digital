/**
 * Test Resilience Patterns
 * 
 * This script tests the resilience patterns implemented in the shared utilities.
 */

const { 
  CircuitBreaker, 
  ResilientHttpClient, 
  retry, 
  withFallback, 
  defaultValueFallback,
  withTimeout,
  Bulkhead
} = require('../shared/resilience');

// Mock service for testing
const mockService = {
  // Simulates a service call with configurable failure rate
  async call(options = {}) {
    const failureRate = options.failureRate || 0;
    const delay = options.delay || 0;
    const timeout = options.timeout || 1000;
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Check if call should timeout
    if (delay > timeout) {
      throw new Error('Request timed out');
    }
    
    // Simulate random failure based on failure rate
    if (Math.random() < failureRate) {
      throw new Error('Service call failed');
    }
    
    // Return success response
    return { success: true, data: 'Service response' };
  }
};

// Test circuit breaker
async function testCircuitBreaker() {
  console.log('\n=== Testing Circuit Breaker ===');
  
  const breaker = new CircuitBreaker('test-service', {
    failureThreshold: 50,
    resetTimeout: 2000,
    rollingCountTimeout: 5000,
    rollingCountBuckets: 5,
    minimumRequests: 3
  });
  
  // Listen for circuit state changes
  breaker.on('state_change', (state) => {
    console.log(`Circuit state changed to: ${state}`);
  });
  
  // Test with high failure rate to trip circuit
  console.log('Making requests with 80% failure rate...');
  for (let i = 0; i < 10; i++) {
    try {
      await breaker.execute(() => mockService.call({ failureRate: 0.8 }));
      console.log(`Request ${i + 1}: Success`);
    } catch (error) {
      console.log(`Request ${i + 1}: Failed - ${error.message}`);
    }
  }
  
  // Wait for circuit to potentially transition to half-open
  console.log('\nWaiting for reset timeout...');
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // Test after reset timeout
  console.log('\nMaking requests after reset timeout with 0% failure rate...');
  for (let i = 0; i < 5; i++) {
    try {
      await breaker.execute(() => mockService.call({ failureRate: 0 }));
      console.log(`Request ${i + 1}: Success`);
    } catch (error) {
      console.log(`Request ${i + 1}: Failed - ${error.message}`);
    }
  }
}

// Test retry mechanism
async function testRetry() {
  console.log('\n=== Testing Retry Mechanism ===');
  
  // Test with decreasing failure rate
  console.log('Testing retry with decreasing failure rate:');
  try {
    let attempt = 0;
    const result = await retry(
      async () => {
        attempt++;
        // First attempt: 100% failure, second: 50% failure, third: 0% failure
        const failureRate = attempt === 1 ? 1 : attempt === 2 ? 0.5 : 0;
        console.log(`Attempt ${attempt} with ${failureRate * 100}% failure rate`);
        return mockService.call({ failureRate });
      },
      {
        retries: 3,
        delay: 500,
        backoffFactor: 2
      }
    );
    
    console.log('Retry succeeded:', result);
  } catch (error) {
    console.log('Retry failed after all attempts:', error.message);
  }
  
  // Test with persistent failure
  console.log('\nTesting retry with persistent failure:');
  try {
    const result = await retry(
      async () => {
        console.log('Attempting call with 100% failure rate');
        return mockService.call({ failureRate: 1 });
      },
      {
        retries: 2,
        delay: 500,
        backoffFactor: 2
      }
    );
    
    console.log('Retry succeeded (should not happen):', result);
  } catch (error) {
    console.log('Retry failed after all attempts (expected):', error.message);
  }
}

// Test fallback mechanism
async function testFallback() {
  console.log('\n=== Testing Fallback Mechanism ===');
  
  // Test with failing primary and successful fallback
  console.log('Testing fallback with failing primary:');
  try {
    const result = await withFallback(
      // Primary function - always fails
      async () => {
        console.log('Executing primary function (will fail)');
        return mockService.call({ failureRate: 1 });
      },
      // Fallback function - returns default value
      (error) => {
        console.log(`Primary function failed: ${error.message}`);
        console.log('Executing fallback function');
        return { success: true, data: 'Fallback response', _fallback: true };
      }
    );
    
    console.log('Operation succeeded with fallback:', result);
  } catch (error) {
    console.log('Operation failed (should not happen):', error.message);
  }
  
  // Test with successful primary
  console.log('\nTesting fallback with successful primary:');
  try {
    const result = await withFallback(
      // Primary function - succeeds
      async () => {
        console.log('Executing primary function (will succeed)');
        return mockService.call({ failureRate: 0 });
      },
      // Fallback function - should not be called
      (error) => {
        console.log(`Primary function failed: ${error.message}`);
        console.log('Executing fallback function');
        return { success: true, data: 'Fallback response', _fallback: true };
      }
    );
    
    console.log('Operation succeeded with primary:', result);
  } catch (error) {
    console.log('Operation failed (should not happen):', error.message);
  }
  
  // Test with default value fallback
  console.log('\nTesting default value fallback:');
  try {
    const result = await withFallback(
      // Primary function - always fails
      async () => {
        console.log('Executing primary function (will fail)');
        return mockService.call({ failureRate: 1 });
      },
      // Default value fallback
      defaultValueFallback({ success: true, data: 'Default value', _default: true })
    );
    
    console.log('Operation succeeded with default value:', result);
  } catch (error) {
    console.log('Operation failed (should not happen):', error.message);
  }
}

// Test timeout mechanism
async function testTimeout() {
  console.log('\n=== Testing Timeout Mechanism ===');
  
  // Test with operation that completes within timeout
  console.log('Testing operation that completes within timeout:');
  try {
    const result = await withTimeout(
      async () => {
        console.log('Executing operation with 500ms delay (timeout: 1000ms)');
        return mockService.call({ delay: 500 });
      },
      1000,
      { errorMessage: 'Custom timeout error' }
    );
    
    console.log('Operation succeeded:', result);
  } catch (error) {
    console.log('Operation failed (should not happen):', error.message);
  }
  
  // Test with operation that exceeds timeout
  console.log('\nTesting operation that exceeds timeout:');
  try {
    const result = await withTimeout(
      async () => {
        console.log('Executing operation with 1500ms delay (timeout: 1000ms)');
        return mockService.call({ delay: 1500 });
      },
      1000,
      { errorMessage: 'Custom timeout error' }
    );
    
    console.log('Operation succeeded (should not happen):', result);
  } catch (error) {
    console.log('Operation failed with timeout (expected):', error.message);
  }
}

// Test bulkhead pattern
async function testBulkhead() {
  console.log('\n=== Testing Bulkhead Pattern ===');
  
  // Create bulkhead with max 2 concurrent executions
  const bulkhead = new Bulkhead('test-service', {
    maxConcurrent: 2,
    maxQueue: 3,
    timeout: 2000
  });
  
  // Execute multiple operations concurrently
  console.log('Executing 5 operations with bulkhead (max 2 concurrent, max 3 queued):');
  
  const operations = [];
  for (let i = 0; i < 5; i++) {
    operations.push((async () => {
      try {
        console.log(`Operation ${i + 1}: Starting`);
        const result = await bulkhead.execute(async () => {
          // Each operation takes 1 second
          await new Promise(resolve => setTimeout(resolve, 1000));
          return { success: true, operation: i + 1 };
        });
        console.log(`Operation ${i + 1}: Completed successfully`);
        return result;
      } catch (error) {
        console.log(`Operation ${i + 1}: Failed - ${error.message}`);
        return { success: false, error: error.message };
      }
    })());
  }
  
  // Wait for all operations to complete
  const results = await Promise.all(operations);
  
  // Try one more operation that should be rejected (bulkhead full)
  try {
    console.log('\nTrying one more operation (should be rejected):');
    await bulkhead.execute(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    });
    console.log('Operation succeeded (should not happen)');
  } catch (error) {
    console.log('Operation rejected (expected):', error.message);
  }
  
  // Get bulkhead metrics
  const metrics = bulkhead.getMetrics();
  console.log('\nBulkhead metrics:', metrics);
}

// Run all tests
async function runTests() {
  try {
    await testCircuitBreaker();
    await testRetry();
    await testFallback();
    await testTimeout();
    await testBulkhead();
    
    console.log('\n=== All tests completed ===');
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the tests
runTests();