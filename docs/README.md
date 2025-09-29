# Service Discovery for Agrimaan Platform

This directory contains the service discovery implementation for the Agrimaan platform. It provides components for service registration, discovery, and health checking.

## Components

### 1. Service Registry

The `ServiceRegistry` class provides functionality for registering and deregistering services with Consul. It handles service registration, health checks, and graceful shutdown.

```javascript
const ServiceRegistry = require('./service-registry');

// Create a service registry instance
const serviceRegistry = new ServiceRegistry({
  serviceName: 'my-service',
  servicePort: 3000,
  tags: ['api', 'v1'],
  healthCheckUrl: '/health',
  healthCheckInterval: '15s'
});

// Register the service with Consul
await serviceRegistry.register();

// Setup graceful shutdown
serviceRegistry.setupGracefulShutdown(server);
```

### 2. Service Discovery

The `ServiceDiscovery` class provides functionality for discovering services registered with Consul. It handles service lookup, caching, and failover logic.

```javascript
const ServiceDiscovery = require('./service-discovery');

// Create a service discovery instance
const discovery = new ServiceDiscovery({
  cacheTimeout: 10000 // 10 seconds
});

// Get the URL for a service
const serviceUrl = await discovery.getServiceUrl('user-service');

// Get all instances of a service
const serviceInstances = await discovery.getServiceInstances('user-service');

// Clear the service discovery cache
discovery.clearCache();
```

### 3. Dynamic Proxy Middleware

The `createDynamicProxy` function creates a dynamic proxy middleware for a service using service discovery. It handles routing requests to the appropriate service instance.

```javascript
const createDynamicProxy = require('./dynamic-proxy-middleware');

// Create a dynamic proxy middleware
app.use('/api/users', createDynamicProxy('user-service', '/api/users'));
```

### 4. Health Check Middleware

The `healthCheck` module provides middleware for creating standardized health check endpoints for all services.

```javascript
const { createHealthCheck, createDatabaseCheck, createServiceCheck } = require('./health-check-middleware');

// Create a database health check
const dbCheck = createDatabaseCheck(mongoose, 'MongoDB');

// Create a service dependency health check
const userServiceCheck = createServiceCheck('user-service', userServiceUrl, axios);

// Create a health check middleware
app.get('/health', createHealthCheck({
  serviceName: 'my-service',
  checks: [dbCheck, userServiceCheck]
}));
```

## Configuration

The service discovery components can be configured using environment variables:

- `CONSUL_HOST`: Hostname of the Consul server (default: consul-server)
- `CONSUL_PORT`: Port of the Consul server (default: 8500)

## Usage

### 1. Service Registration

Each service should register with Consul on startup:

```javascript
const express = require('express');
const ServiceRegistry = require('../../shared/service-discovery/service-registry');

const app = express();
const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Service running on port ${PORT}`);
  
  // Register service with Consul
  const serviceRegistry = new ServiceRegistry({
    serviceName: 'my-service',
    servicePort: PORT,
    tags: ['api', 'v1'],
    healthCheckUrl: '/health'
  });
  
  serviceRegistry.register()
    .then(() => {
      console.log('Service registered with Consul');
      
      // Setup graceful shutdown
      serviceRegistry.setupGracefulShutdown(server);
    })
    .catch(err => {
      console.error('Failed to register with Consul:', err);
    });
});
```

### 2. Health Check Endpoint

Each service should provide a health check endpoint:

```javascript
const { createHealthCheck } = require('../../shared/service-discovery/health-check-middleware');

// Health check endpoint
app.get('/health', createHealthCheck({
  serviceName: 'my-service',
  checks: []
}));
```

### 3. Service Discovery

Services can discover other services using the `ServiceDiscovery` class:

```javascript
const ServiceDiscovery = require('../../shared/service-discovery/service-discovery');
const axios = require('axios');

// Create a service discovery instance
const discovery = new ServiceDiscovery();

// Get the URL for a service
const userServiceUrl = await discovery.getServiceUrl('user-service');

// Make a request to the service
const response = await axios.get(`${userServiceUrl}/api/users`);
```

### 4. Dynamic Proxy Middleware

The API Gateway can use the dynamic proxy middleware to route requests to services:

```javascript
const createDynamicProxy = require('../../shared/service-discovery/dynamic-proxy-middleware');

// User Service Routes
app.use('/api/auth', createDynamicProxy('user-service', '/api/auth'));
app.use('/api/users', createDynamicProxy('user-service', '/api/users'));
```

## Testing

You can test the service discovery functionality using the provided test script:

```bash
node test-service-discovery.js
```

## Troubleshooting

### Service Registration Failures

- Check that Consul server is running
- Verify network connectivity between services and Consul
- Check service configuration

### Service Discovery Failures

- Check that the service is registered with Consul
- Verify that the service is healthy
- Check the service name and tags
