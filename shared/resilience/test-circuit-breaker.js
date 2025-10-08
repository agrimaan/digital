/**
 * Test script for circuit breaker
 * 
 * This script tests the circuit breaker functionality.
 */

const ResilientHttpClient = require('./resilient-http-client');
const ServiceDiscovery = require('../service-discovery/service-discovery');
const UserServiceClient = require('./user-service-client');
const { retry } = require('./retry-util');

// Mock service for testing
const mockServer = {
  failureCount: 0,
  maxFailures: 5,
  
  // Simulate a request that fails after a certain number of calls
  async request() {
    if (this.failureCount < this.maxFailures) {
      this.failureCount++;
      throw new Error(`Service unavailable (${this.failureCount}/${this.maxFailures})`);
    }
    
    return { success: true, message: 'Service is now available' };
  },
  
  // Reset the failure count
  reset() {
    this.failureCount = 0;
  }
};

// Test direct usage of ResilientHttpClient
async function testResilientHttpClient() {
  console.log('Testing ResilientHttpClient...');
  
  const client = new ResilientHttpClient({
    retries: 3,
    circuitBreakerOptions: {
      failureRateThreshold: 50,
      waitDurationInOpenState: 2000, // Short duration for testing
      slidingWindowSize: 5
    }
  });
  
  // Create a decorated function that uses the mock server
  const makeRequest = async () => {
    try {
      return await client.request({
        method: 'GET',
        url: '/test'
      }, () => {
        return { fallback: true, message: 'Using fallback response' };
      });
    } catch (error) {
      console.error(`Request failed: ${error.message}`);
      throw error;
    }
  };
  
  // Test circuit breaker state transitions
  console.log('\n1. Testing circuit breaker state transitions:');
  
  // First set of requests - should fail and open the circuit
  console.log('\nFirst set of requests (should fail and open circuit):');
  for (let i = 0; i < 5; i++) {
    try {
      const result = await makeRequest();
      console.log(`Request ${i + 1} result:`, result);
    } catch (error) {
      console.log(`Request ${i + 1} error: ${error.message}`);
    }
  }
  
  // Wait for circuit to transition to half-open
  console.log('\nWaiting for circuit to transition to half-open...');
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // Reset mock server to start succeeding
  mockServer.reset();
  
  // Second set of requests - should succeed and close the circuit
  console.log('\nSecond set of requests (should succeed and close circuit):');
  for (let i = 0; i < 3; i++) {
    try {
      const result = await makeRequest();
      console.log(`Request ${i + 1} result:`, result);
    } catch (error) {
      console.log(`Request ${i + 1} error: ${error.message}`);
    }
  }
}

// Test UserServiceClient with service discovery
async function testUserServiceClient() {
  console.log('\n2. Testing UserServiceClient:');
  
  try {
    const userClient = new UserServiceClient();
    
    // This will fail because the service is not registered with Consul
    // But it should use the fallback
    const user = await userClient.getUserById('123');
    console.log('User result:', user);
  } catch (error) {
    console.error('UserServiceClient test failed:', error.message);
  }
}

// Test retry utility
async function testRetryUtility() {
  console.log('\n3. Testing retry utility:');
  
  // Reset mock server
  mockServer.reset();
  mockServer.maxFailures = 2;
  
  try {
    const result = await retry(async () => {
      return await mockServer.request();
    }, {
      retries: 3,
      delay: 500,
      backoffFactor: 2
    });
    
    console.log('Retry result:', result);
  } catch (error) {
    console.error('Retry test failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  try {
    await testResilientHttpClient();
    await testUserServiceClient();
    await testRetryUtility();
    
    console.log('\nAll tests completed');
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

runTests();