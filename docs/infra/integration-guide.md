# Agrimaan Platform Integration Guide

This guide explains how to integrate the core components of the Agrimaan microservices architecture with individual services.

## Overview

The Agrimaan platform uses three key integration components:

1. **Service Discovery** - Using Consul for service registration and discovery
2. **Circuit Breaker Pattern** - Using Resilience4j for fault tolerance
3. **Message Queue** - Using RabbitMQ for asynchronous communication

This guide provides instructions on how to integrate these components with all microservices.

## Prerequisites

Before running the integration scripts, ensure you have:

1. All microservices code in the `backend` directory
2. Shared libraries in the `shared` directory
3. Docker and Docker Compose installed
4. Node.js and npm installed

## Integration Scripts

We provide four scripts to help with the integration:

1. `integrate-service-discovery.sh` - Integrates Consul service discovery with all microservices
2. `integrate-circuit-breaker.sh` - Integrates circuit breaker pattern with all microservices
3. `integrate-message-queue.sh` - Integrates RabbitMQ message queue with all microservices
4. `integrate-all-components.sh` - Master script that runs all three scripts in sequence

### Running the Integration Scripts

To integrate all components at once, run:

```bash
cd agrimaan-microservices-complete
./scripts/integrate-all-components.sh
```

To run individual integration scripts:

```bash
# For service discovery only
./scripts/integrate-service-discovery.sh

# For circuit breaker only
./scripts/integrate-circuit-breaker.sh

# For message queue only
./scripts/integrate-message-queue.sh
```

## What the Scripts Do

### Service Discovery Integration

The `integrate-service-discovery.sh` script:

1. Updates each service's `.env` file to include Consul configuration
2. Updates `package.json` to include required dependencies
3. Modifies `server.js` to:
   - Import service discovery components
   - Add health check middleware
   - Register the service with Consul on startup
   - Setup graceful shutdown to deregister the service

### Circuit Breaker Integration

The `integrate-circuit-breaker.sh` script:

1. Creates a `clients` directory in each service
2. Updates `package.json` to include required dependencies
3. Creates service client files for commonly used services:
   - `user-service-client.js` - Client for user service
   - `field-service-client.js` - Client for field service
4. Creates an `index.js` file to export all clients

### Message Queue Integration

The `integrate-message-queue.sh` script:

1. Creates an `events` directory with `publishers` and `subscribers` subdirectories
2. Updates `package.json` to include required dependencies
3. Updates `.env` file to include RabbitMQ configuration
4. Creates service-specific event publishers and subscribers
5. Updates `server.js` to initialize event subscribers on startup

## Post-Integration Steps

After running the integration scripts:

1. Install dependencies in each service:

```bash
cd backend/user-service
npm install
```

2. Start the services:

```bash
cd agrimaan-microservices-complete
docker-compose up -d
```

3. Verify service registration in Consul:
   - Open http://localhost:8500 in your browser
   - Check that all services are registered and healthy

4. Test inter-service communication with circuit breaker:
   - Use the service clients to make requests between services
   - Test fault tolerance by stopping a service and observing fallback behavior

5. Test asynchronous communication with message queue:
   - Trigger events in one service and observe the subscribers in other services
   - Check RabbitMQ management console at http://localhost:15672

## Troubleshooting

### Service Discovery Issues

- Check that Consul is running: `docker-compose ps consul-server`
- Verify service registration: `curl http://localhost:8500/v1/catalog/services`
- Check service health: `curl http://localhost:8500/v1/health/service/[service-name]`

### Circuit Breaker Issues

- Test resilient HTTP client: `node shared/resilience/test-circuit-breaker.js`
- Check circuit breaker configuration in service clients

### Message Queue Issues

- Check that RabbitMQ is running: `docker-compose ps rabbitmq`
- Verify exchanges and queues: `curl -u guest:guest http://localhost:15672/api/exchanges`
- Test messaging: `node shared/messaging/test-messaging.js`

## Next Steps

After integrating these components, consider implementing:

1. **Centralized Logging** - Using ELK Stack (Elasticsearch, Logstash, Kibana)
2. **Distributed Tracing** - Using Jaeger or Zipkin
3. **Monitoring** - Using Prometheus and Grafana