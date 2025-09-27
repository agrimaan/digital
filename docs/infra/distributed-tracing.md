# Distributed Tracing Implementation for Agrimaan Platform

This document outlines the implementation plan for distributed tracing in the Agrimaan microservices architecture using Jaeger and OpenTelemetry.

## Overview

Distributed tracing is essential for understanding request flows across multiple microservices. It helps identify performance bottlenecks, troubleshoot issues, and visualize service dependencies. This implementation will use Jaeger as the tracing backend and OpenTelemetry for instrumentation.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Microservice │     │ Microservice │     │ Microservice │     │ Microservice │
│   (Traces)   │     │   (Traces)   │     │   (Traces)   │     │   (Traces)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     OpenTelemetry SDK                               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
                     ┌───────────────────┐
                     │  Jaeger Collector │
                     │  (Collect, Store) │
                     └─────────┬─────────┘
                               │
                               ▼
                     ┌───────────────────┐
                     │   Jaeger Storage  │
                     │  (Elasticsearch)  │
                     └─────────┬─────────┘
                               │
                               ▼
                     ┌───────────────────┐
                     │    Jaeger UI      │
                     │  (Visualization)  │
                     └───────────────────┘
```

## Implementation Plan

### 1. Set up Jaeger Backend

#### 1.1 Add Jaeger configuration to docker-compose.yml

```yaml
jaeger:
  image: jaegertracing/all-in-one:1.36
  container_name: jaeger
  environment:
    - COLLECTOR_ZIPKIN_HOST_PORT=:9411
    - COLLECTOR_OTLP_ENABLED=true
  ports:
    - "5775:5775/udp"
    - "6831:6831/udp"
    - "6832:6832/udp"
    - "5778:5778"
    - "16686:16686"
    - "14250:14250"
    - "14268:14268"
    - "14269:14269"
    - "4317:4317"
    - "4318:4318"
    - "9411:9411"
  networks:
    - agrimaan-network
```

### 2. Create Shared Tracing Module

#### 2.1 Create OpenTelemetry integration

```javascript
// shared/tracing/index.js
const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');

/**
 * Initialize OpenTelemetry tracing for a microservice
 * 
 * @param {Object} options - Tracing options
 * @param {string} options.serviceName - Name of the service
 * @param {string} options.jaegerEndpoint - Jaeger collector endpoint (default: 'http://jaeger:4318/v1/traces')
 * @returns {opentelemetry.NodeSDK} OpenTelemetry SDK instance
 */
function initTracing(options) {
  const { serviceName, jaegerEndpoint = 'http://jaeger:4318/v1/traces' } = options;
  
  const traceExporter = new OTLPTraceExporter({
    url: jaegerEndpoint,
  });
  
  const sdk = new opentelemetry.NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    spanProcessor: new BatchSpanProcessor(traceExporter),
    instrumentations: [getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-mongodb': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-mongoose': {
        enabled: true,
      },
    })],
  });
  
  // Initialize the SDK
  sdk.start();
  
  // Gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
  
  return sdk;
}

/**
 * Create a middleware for adding correlation IDs to requests
 * 
 * @returns {Function} Express middleware function
 */
function correlationIdMiddleware() {
  return (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
  };
}

/**
 * Generate a unique correlation ID
 * 
 * @returns {string} Correlation ID
 */
function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  initTracing,
  correlationIdMiddleware,
};
```

#### 2.2 Update package.json in shared directory

```json
{
  "dependencies": {
    "@opentelemetry/api": "^1.4.0",
    "@opentelemetry/auto-instrumentations-node": "^0.36.0",
    "@opentelemetry/exporter-trace-otlp-proto": "^0.39.1",
    "@opentelemetry/resources": "^1.13.0",
    "@opentelemetry/sdk-node": "^0.39.1",
    "@opentelemetry/sdk-trace-base": "^1.13.0",
    "@opentelemetry/semantic-conventions": "^1.13.0"
  }
}
```

### 3. Create Script to Integrate Tracing with Microservices

```bash
#!/bin/bash

# Script to integrate distributed tracing with all microservices

# Define the backend services directory
BACKEND_DIR="./backend"

# Loop through all backend services
for SERVICE_DIR in $BACKEND_DIR/*-service; do
  SERVICE_NAME=$(basename $SERVICE_DIR)
  echo "Integrating distributed tracing with $SERVICE_NAME..."
  
  # Update package.json to include required dependencies
  echo "Updating package.json..."
  # Check if @agrimaan/shared is already in dependencies
  if ! grep -q "@agrimaan/shared" $SERVICE_DIR/package.json; then
    # Use sed to add the dependency before the first dependency
    sed -i '/"dependencies": {/a \    "@agrimaan/shared": "^1.0.0",' $SERVICE_DIR/package.json
  fi
  
  # Create a tracing.js file in the utils directory
  UTILS_DIR="$SERVICE_DIR/utils"
  if [ ! -d "$UTILS_DIR" ]; then
    mkdir -p "$UTILS_DIR"
  fi
  
  echo "Creating tracing.js..."
  cat > "$UTILS_DIR/tracing.js" << EOF
/**
 * Tracing Module
 * 
 * This module initializes distributed tracing for the service.
 */

const { initTracing, correlationIdMiddleware } = require('@agrimaan/shared/tracing');

// Initialize tracing
const sdk = initTracing({
  serviceName: '${SERVICE_NAME}',
  jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:4318/v1/traces'
});

module.exports = {
  sdk,
  correlationIdMiddleware
};
EOF
  
  # Update server.js to use tracing
  echo "Updating server.js to use tracing..."
  
  # Create a backup of the original server.js
  cp $SERVICE_DIR/server.js $SERVICE_DIR/server.js.bak_tracing
  
  # Add tracing import at the top of the file
  sed -i '1i // Initialize tracing first\nconst { correlationIdMiddleware } = require(\'./utils/tracing\');' $SERVICE_DIR/server.js
  
  # Add correlation ID middleware after express initialization
  sed -i '/app.use(express.json());/a app.use(correlationIdMiddleware());' $SERVICE_DIR/server.js
  
  # Update .env file to include JAEGER_ENDPOINT
  if ! grep -q "JAEGER_ENDPOINT" $SERVICE_DIR/.env; then
    echo "JAEGER_ENDPOINT=http://jaeger:4318/v1/traces" >> $SERVICE_DIR/.env
  fi
  
  echo "Distributed tracing integration completed for $SERVICE_NAME"
  echo "---------------------------------------------------"
done

echo "Distributed tracing integration completed for all services!"
```

### 4. Set up Jaeger UI

Jaeger UI will be automatically available at http://localhost:16686 when the Jaeger container is running.

### 5. Update Docker Compose with Jaeger

```yaml
version: '3.8'

services:
  jaeger:
    image: jaegertracing/all-in-one:1.36
    container_name: jaeger
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "5775:5775/udp"
      - "6831:6831/udp"
      - "6832:6832/udp"
      - "5778:5778"
      - "16686:16686"
      - "14250:14250"
      - "14268:14268"
      - "14269:14269"
      - "4317:4317"
      - "4318:4318"
      - "9411:9411"
    networks:
      - agrimaan-network

networks:
  agrimaan-network:
    external: true
```

## Key Transactions to Trace

1. **User Authentication Flow**
   - Login request
   - Token validation
   - User profile retrieval

2. **Field Management Flow**
   - Field creation
   - Field data retrieval
   - Field updates

3. **Marketplace Transactions**
   - Product listing
   - Purchase flow
   - Payment processing

4. **IoT Data Flow**
   - Sensor data ingestion
   - Data processing
   - Alert generation

5. **Weather Data Integration**
   - Weather data retrieval
   - Field-specific weather forecasting
   - Weather alert generation

## Custom Views in Jaeger UI

For each key transaction, create custom views in Jaeger UI:

1. **User Authentication View**
   - Filter by service: user-service
   - Filter by operation: login, validateToken, getUserProfile

2. **Field Management View**
   - Filter by service: field-service
   - Filter by operation: createField, getField, updateField

3. **Marketplace View**
   - Filter by service: marketplace-service
   - Filter by operation: listProduct, purchaseProduct, processPayment

4. **IoT Data View**
   - Filter by service: iot-service
   - Filter by operation: ingestData, processData, generateAlert

5. **Weather Data View**
   - Filter by service: weather-service
   - Filter by operation: getWeatherData, getForecast, generateAlert

## Implementation Steps

1. Create the necessary configuration files
2. Update docker-compose.yml with Jaeger service
3. Create shared tracing module
4. Integrate tracing with all microservices
5. Test the distributed tracing system
6. Create custom views for key transactions
7. Document the setup and usage

## Conclusion

This distributed tracing implementation will provide comprehensive visibility into request flows across the Agrimaan microservices architecture. It will enable efficient troubleshooting, performance optimization, and understanding of service dependencies.