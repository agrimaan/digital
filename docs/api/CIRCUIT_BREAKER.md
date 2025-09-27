# Circuit Breaker Implementation for Agrimaan Platform

This document describes the circuit breaker implementation for the Agrimaan microservices platform, which enhances resilience and fault tolerance in inter-service communication.

## Overview

The circuit breaker pattern prevents cascading failures in distributed systems by failing fast when a service is unavailable. It works like an electrical circuit breaker:

1. **Closed State**: In normal operation, requests flow through the circuit breaker to the service.
2. **Open State**: When failures exceed a threshold, the circuit breaker "trips" and immediately fails requests without calling the service.
3. **Half-Open State**: After a timeout period, the circuit breaker allows a limited number of test requests to determine if the service has recovered.

## Components

### 1. Circuit Breaker

The core circuit breaker implementation that tracks service health and manages state transitions.

- **Location**: `microservices/shared/resilience/circuit-breaker.js`
- **Features**:
  - Configurable failure threshold
  - Rolling window metrics
  - State management (CLOSED, OPEN, HALF-OPEN)
  - Event emission for state changes
  - Automatic recovery testing

### 2. Resilient HTTP Client

A resilient HTTP client that integrates the circuit breaker pattern with service discovery.

- **Location**: `microservices/shared/resilience/resilient-http-client.js`
- **Features**:
  - Circuit breaker integration
  - Error handling and categorization
  - Correlation ID propagation
  - Configurable timeouts

### 3. Service Clients

Service-specific clients that use the resilient HTTP client and add additional resilience patterns.

- **Location**: `microservices/shared/service-clients/`
- **Features**:
  - Service discovery integration
  - Retry mechanisms
  - Fallback strategies
  - Caching for resilience

### 4. Additional Resilience Patterns

Complementary patterns that work alongside circuit breakers:

- **Retry**: Automatically retry failed requests with exponential backoff
- **Fallback**: Provide alternative responses when a service call fails
- **Timeout**: Prevent long-running operations from blocking the system
- **Bulkhead**: Isolate failures and limit concurrent requests

## Implementation Details

### Circuit Breaker Configuration

The circuit breaker can be configured with the following options:

```javascript
const breaker = new CircuitBreaker('service-name', {
  failureThreshold: 50,      // 50% failure rate triggers open circuit
  resetTimeout: 10000,       // 10 seconds in open state before trying half-open
  rollingCountTimeout: 10000, // 10 second rolling window
  rollingCountBuckets: 10,   // 10 buckets of 1 second each
  minimumRequests: 5         // Minimum requests before tripping circuit
});
```

### Metrics Collection

The circuit breaker collects metrics in a rolling window:

1. Requests are tracked in time-based buckets
2. Buckets are created and discarded as time passes
3. Failure rate is calculated across all buckets
4. Circuit state changes are based on the calculated failure rate

### State Transitions

The circuit breaker transitions between states based on the following rules:

1. **CLOSED to OPEN**: When failure rate exceeds the threshold
2. **OPEN to HALF-OPEN**: After the reset timeout expires
3. **HALF-OPEN to CLOSED**: When a test request succeeds
4. **HALF-OPEN to OPEN**: When a test request fails

### Integration with Service Discovery

The circuit breaker is integrated with service discovery to provide resilient service-to-service communication:

1. Service discovery finds available service instances
2. Resilient HTTP client uses circuit breaker to protect calls
3. Service clients add retry and fallback mechanisms
4. Correlation IDs are propagated for request tracing

## Usage Examples

### Basic Circuit Breaker

```javascript
const { CircuitBreaker } = require('../shared/resilience');

// Create a circuit breaker
const breaker = new CircuitBreaker('user-service', {
  failureThreshold: 50,
  resetTimeout: 10000
});

// Execute a function with circuit breaker protection
try {
  const result = await breaker.execute(async () => {
    // Call external service
    const response = await axios.get('https://api.example.com/users');
    return response.data;
  });
  
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
}

// Listen for circuit state changes
breaker.on('state_change', (state) => {
  console.log(`Circuit state changed to: ${state}`);
});
```

### Resilient HTTP Client

```javascript
const { ResilientHttpClient } = require('../shared/resilience');

// Create a resilient HTTP client
const client = new ResilientHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  circuitBreakerOptions: {
    failureThreshold: 50,
    resetTimeout: 10000
  }
});

// Make requests
try {
  const users = await client.get('/users');
  console.log('Users:', users);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Service Client with Circuit Breaker

```javascript
const { UserServiceClient } = require('../shared/service-clients');

// Create a user service client
const userClient = new UserServiceClient();

// Get a user by ID with circuit breaker protection
try {
  const user = await userClient.getUserById('123');
  console.log('User:', user);
} catch (error) {
  console.error('Error getting user:', error.message);
}
```

## Benefits

The circuit breaker implementation provides several benefits:

1. **Fail Fast**: Prevents cascading failures by failing fast when a service is unavailable
2. **Resource Protection**: Reduces load on struggling services, giving them time to recover
3. **Self-Healing**: Automatically tests service availability and resumes normal operation
4. **Observability**: Provides metrics and events for monitoring service health
5. **Resilience**: Combines with retry, fallback, and timeout patterns for comprehensive resilience

## Monitoring and Observability

The circuit breaker implementation provides several monitoring capabilities:

1. **State Change Events**: Listen for circuit state changes
2. **Metrics**: Access success and failure counts
3. **Health Checks**: Integrate with service health checks
4. **Logging**: Detailed logging of circuit breaker operations

## Best Practices

1. **Configure Appropriately**: Set failure thresholds and timeouts based on service characteristics
2. **Combine with Retry**: Use retry for transient failures before tripping the circuit
3. **Provide Fallbacks**: Always have fallback mechanisms for critical operations
4. **Monitor Circuit State**: Track circuit breaker states for early detection of service issues
5. **Test Failure Scenarios**: Regularly test that circuit breakers work as expected

## Future Enhancements

1. **Hystrix Dashboard Integration**: Add support for Hystrix-compatible metrics
2. **Adaptive Thresholds**: Dynamically adjust thresholds based on traffic patterns
3. **Circuit Breaker Registry**: Centralized management of circuit breakers
4. **Custom Failure Criteria**: Allow custom logic for determining what constitutes a failure
5. **Persistent Metrics**: Store metrics across service restarts