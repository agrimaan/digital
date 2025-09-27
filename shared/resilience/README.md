# Resilience Patterns for Agrimaan Platform

This directory contains the resilience pattern implementations for the Agrimaan platform. It provides components for circuit breaking, retrying, and fallback mechanisms to enhance the resilience of service-to-service communication.

## Components

### 1. Resilient HTTP Client

The `ResilientHttpClient` class provides a resilient HTTP client with circuit breaker, retry, and bulkhead patterns. It handles service failures gracefully and provides fallback mechanisms.

```javascript
const ResilientHttpClient = require('./resilient-http-client');

// Create a resilient HTTP client
const client = new ResilientHttpClient({
  baseURL: 'http://example.com',
  timeout: 5000,
  retries: 3,
  circuitBreakerOptions: {
    failureRateThreshold: 50,
    waitDurationInOpenState: 10000,
    slidingWindowSize: 10
  }
});

// Make a request with fallback
const result = await client.get('/api/users', {}, (error) => {
  // Fallback implementation
  return { users: [], fallback: true };
});
```

### 2. Retry Utility

The `retry-util` module provides utility functions for retrying operations with exponential backoff.

```javascript
const { retry, retryable } = require('./retry-util');

// Retry a function
const result = await retry(async () => {
  // Function that might fail
  return await someAsyncOperation();
}, {
  retries: 3,
  delay: 1000,
  backoffFactor: 2
});

// Create a retryable function
const retryableFunction = retryable(someAsyncOperation, {
  retries: 3,
  delay: 1000,
  backoffFactor: 2
});

const result = await retryableFunction();
```

### 3. Service Clients

The service client modules provide resilient clients for specific services. They handle service discovery, circuit breaking, and fallback mechanisms.

```javascript
const UserServiceClient = require('./user-service-client');

// Create a user service client
const userClient = new UserServiceClient();

// Get a user by ID (with fallback)
const user = await userClient.getUserById('123');
```

## Circuit Breaker Pattern

The circuit breaker pattern is used to prevent cascading failures in distributed systems. It works by monitoring the health of service calls and automatically failing fast when a service is unhealthy.

### States

1. **CLOSED**: In this state, requests are allowed to pass through to the service. If the failure rate exceeds a threshold, the circuit transitions to the OPEN state.

2. **OPEN**: In this state, requests are immediately rejected without calling the service. After a specified wait duration, the circuit transitions to the HALF_OPEN state.

3. **HALF_OPEN**: In this state, a limited number of requests are allowed to pass through to test if the service has recovered. If these requests succeed, the circuit transitions back to the CLOSED state. If they fail, it goes back to the OPEN state.

### Configuration Options

- `failureRateThreshold`: The failure rate threshold in percentage above which the circuit should trip open (default: 50)
- `waitDurationInOpenState`: The time in milliseconds to wait before transitioning from OPEN to HALF_OPEN (default: 10000)
- `slidingWindowSize`: The number of calls to consider for the failure rate calculation (default: 10)
- `minimumNumberOfCalls`: The minimum number of calls required before calculating the failure rate (default: 5)
- `permittedNumberOfCallsInHalfOpenState`: The number of calls allowed in the HALF_OPEN state (default: 3)
- `automaticTransitionFromOpenToHalfOpenEnabled`: Whether to automatically transition from OPEN to HALF_OPEN (default: true)

## Retry Pattern

The retry pattern is used to handle transient failures by automatically retrying failed operations. It uses exponential backoff to avoid overwhelming the service.

### Configuration Options

- `retries`: The maximum number of retry attempts (default: 3)
- `delay`: The initial delay in milliseconds (default: 1000)
- `backoffFactor`: The factor to multiply delay by for each retry (default: 2)
- `maxDelay`: The maximum delay in milliseconds (default: 30000)
- `shouldRetry`: A function to determine if retry should be attempted (default: always retry)

## Bulkhead Pattern

The bulkhead pattern is used to isolate failures by limiting the number of concurrent calls to a service. It prevents a single service from consuming all resources.

### Configuration Options

- `maxConcurrentCalls`: The maximum number of concurrent calls allowed (default: 25)
- `maxWaitDuration`: The maximum time in milliseconds to wait for a permit (default: 0)

## Usage

### 1. Direct Usage of ResilientHttpClient

```javascript
const ResilientHttpClient = require('./resilient-http-client');

const client = new ResilientHttpClient({
  baseURL: 'http://example.com',
  timeout: 5000,
  retries: 3
});

// Make a GET request
const users = await client.get('/api/users');

// Make a POST request with fallback
const result = await client.post('/api/users', userData, {}, (error) => {
  console.log(`Fallback for createUser: ${error.message}`);
  return { success: false, fallback: true };
});
```

### 2. Using Service Clients

```javascript
const UserServiceClient = require('./user-service-client');
const FieldServiceClient = require('./field-service-client');

// Create service clients
const userClient = new UserServiceClient();
const fieldClient = new FieldServiceClient();

// Get a user by ID
const user = await userClient.getUserById('123');

// Get fields for a user
const fields = await fieldClient.getFieldsByUserId('123');
```

### 3. Using Retry Utility

```javascript
const { retry } = require('./retry-util');

// Retry a function
const result = await retry(async () => {
  return await someAsyncOperation();
}, {
  retries: 3,
  delay: 1000,
  backoffFactor: 2,
  shouldRetry: (error) => error.code === 'ETIMEDOUT'
});
```

## Testing

You can test the resilience patterns using the provided test script:

```bash
node test-circuit-breaker.js
```

## Troubleshooting

### Circuit Breaker Issues

- Check the circuit breaker state using the event listeners
- Verify that the failure threshold is appropriate for your service
- Ensure that the wait duration is long enough for the service to recover

### Retry Issues

- Check that the retry count is appropriate for your service
- Verify that the delay and backoff factor are suitable for your use case
- Ensure that the shouldRetry function is correctly identifying retryable errors

### Service Client Issues

- Check that the service is registered with Consul
- Verify that the service is healthy
- Ensure that the fallback implementations are appropriate for your use case