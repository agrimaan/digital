# Service Discovery Implementation for Agrimaan Platform

This document describes the service discovery implementation for the Agrimaan microservices platform using Consul.

## Overview

Service discovery is a critical component in a microservices architecture that allows services to find and communicate with each other without hardcoded endpoints. The Agrimaan platform uses Consul for service discovery, which provides:

- Service registration and discovery
- Health checking
- Key-value store
- Service mesh capabilities

## Components

### 1. Consul Server

The Consul server is the central registry for service discovery. It runs as a Docker container and is accessible to all services in the network.

- **Location**: `microservices/consul-server/`
- **Configuration**: `microservices/consul-server/config/consul-config.json`
- **UI**: Available at http://localhost:8500 when running

### 2. Service Registry

The Service Registry module is used by each service to register itself with Consul on startup and deregister on shutdown.

- **Location**: `microservices/shared/service-registry.js`
- **Usage**: Each service initializes the registry in its server.js file

### 3. Service Discovery Client

The Service Discovery client is used by services to discover other services through Consul.

- **Location**: `microservices/shared/service-discovery.js`
- **Usage**: Services use this client to find other services dynamically

### 4. Health Check Middleware

The Health Check middleware provides an Express middleware for implementing health check endpoints.

- **Location**: `microservices/shared/health-check.js`
- **Usage**: Each service implements a health check endpoint at `/health`

## Implementation Details

### Service Registration Process

1. Each service initializes the ServiceRegistry on startup
2. The service registers with Consul providing:
   - Service name
   - Service ID (unique identifier)
   - Host and port
   - Tags for categorization
   - Health check URL and interval
3. Consul begins monitoring the service's health
4. On shutdown, the service deregisters from Consul

### Service Discovery Process

1. A service needs to communicate with another service
2. It uses the ServiceDiscovery client to get the URL of the target service
3. The client queries Consul for available instances of the target service
4. Consul returns a list of healthy instances
5. The client selects an instance (using simple load balancing)
6. The service makes the request to the selected instance

### API Gateway Integration

The API Gateway has been updated to use service discovery for routing requests to the appropriate services:

1. Dynamic proxy middleware creates proxies based on service discovery
2. Requests are routed to the appropriate service based on the URL path
3. If a service is unavailable, the gateway returns a 503 Service Unavailable response

## Configuration

### Environment Variables

Each service requires the following environment variables:

- `CONSUL_HOST`: Hostname of the Consul server (default: consul-server)
- `CONSUL_PORT`: Port of the Consul server (default: 8500)
- `SERVICE_NAME`: Name of the service for registration

### Docker Compose

The docker-compose.yml file has been updated to include:

1. Consul server service
2. Consul data volume
3. Environment variables for all services
4. Dependencies on the Consul server

## Testing

A test script is provided to verify the service discovery implementation:

```bash
node microservices/test-service-discovery.js
```

This script tests:
1. Discovering services registered with Consul
2. Testing service URL retrieval
3. Testing service instances retrieval
4. Handling non-existent services

## Benefits

The service discovery implementation provides several benefits:

1. **Dynamic Service Location**: No hardcoded service URLs
2. **Load Balancing**: Requests are distributed across service instances
3. **Health Monitoring**: Unhealthy services are automatically removed from the registry
4. **Resilience**: Services can be added, removed, or scaled without configuration changes
5. **Observability**: The Consul UI provides visibility into the service registry

## Future Enhancements

1. **Service Mesh**: Implement Consul Connect for secure service-to-service communication
2. **Configuration Management**: Use Consul KV store for centralized configuration
3. **Multi-DC Support**: Extend to multiple data centers for geographic redundancy
4. **Access Control**: Implement ACLs for secure service registry access
5. **Custom Health Checks**: Add more sophisticated health checks for services