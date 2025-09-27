#!/bin/bash

# Script to set up distributed tracing with Jaeger and OpenTelemetry

# Set the working directory to the project root
cd "$(dirname "$0")/.."
WORKING_DIR=$(pwd)

echo "Setting up distributed tracing with Jaeger and OpenTelemetry..."
echo "Working directory: $WORKING_DIR"
echo

# Step 1: Create directories for Jaeger configuration
echo "Creating directories for Jaeger configuration..."
mkdir -p ./integration/tracing/jaeger
echo "Directories created!"
echo

# Step 2: Create shared tracing module
echo "Creating shared tracing module..."
mkdir -p ./shared/tracing
cat > ./shared/tracing/index.js << 'EOL'
/**
 * Shared Tracing Module
 * 
 * This module provides distributed tracing functionality for microservices.
 */

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
EOL
echo "Shared tracing module created!"
echo

# Step 3: Update shared package.json
echo "Updating shared package.json..."
if [ -f ./shared/package.json ]; then
  # Check if OpenTelemetry dependencies are already in package.json
  if ! grep -q "@opentelemetry/sdk-node" ./shared/package.json; then
    # Use sed to add the dependencies before the last closing brace
    sed -i '/}$/i \  "@opentelemetry/api": "^1.4.0",\n  "@opentelemetry/auto-instrumentations-node": "^0.36.0",\n  "@opentelemetry/exporter-trace-otlp-proto": "^0.39.1",\n  "@opentelemetry/resources": "^1.13.0",\n  "@opentelemetry/sdk-node": "^0.39.1",\n  "@opentelemetry/sdk-trace-base": "^1.13.0",\n  "@opentelemetry/semantic-conventions": "^1.13.0",' ./shared/package.json
  fi
else
  # Create package.json if it doesn't exist
  cat > ./shared/package.json << 'EOL'
{
  "name": "@agrimaan/shared",
  "version": "1.0.0",
  "description": "Shared libraries for Agrimaan microservices",
  "main": "index.js",
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
EOL
fi
echo "Shared package.json updated!"
echo

# Step 4: Create script to integrate tracing with all microservices
echo "Creating script to integrate tracing with all microservices..."
cat > ./scripts/integrate-tracing.sh << 'EOL'
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
EOL
chmod +x ./scripts/integrate-tracing.sh
echo "Script to integrate tracing created!"
echo

# Step 5: Create Docker Compose file for Jaeger
echo "Creating Docker Compose file for Jaeger..."
cat > ./docker-compose.tracing.yml << 'EOL'
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
EOL
echo "Docker Compose file for Jaeger created!"
echo

# Step 6: Create a README file for distributed tracing
echo "Creating README file for distributed tracing..."
cat > ./integration/tracing/README.md << 'EOL'
# Distributed Tracing with Jaeger and OpenTelemetry

This directory contains configuration for distributed tracing in the Agrimaan microservices architecture.

## Overview

Distributed tracing is implemented using:
- **Jaeger**: For trace collection, storage, and visualization
- **OpenTelemetry**: For instrumentation and trace generation

## Usage

### Starting Jaeger

```bash
docker-compose -f docker-compose.yml -f docker-compose.tracing.yml up -d
```

### Accessing Jaeger UI

The Jaeger UI is available at http://localhost:16686

### Key Transactions to Trace

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

### Custom Views in Jaeger UI

For each key transaction, you can create custom views in Jaeger UI:

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

## Correlation IDs

All services are configured to use correlation IDs for request tracking. The correlation ID is:
- Generated for each incoming request if not present
- Propagated in the `x-correlation-id` header
- Available in the request object as `req.correlationId`
- Included in all spans for the request

## Troubleshooting

If traces are not appearing in Jaeger UI:

1. Check that the Jaeger service is running:
   ```bash
   docker ps | grep jaeger
   ```

2. Verify that the service is correctly configured with the Jaeger endpoint:
   ```bash
   grep JAEGER_ENDPOINT backend/*/service/.env
   ```

3. Check service logs for tracing errors:
   ```bash
   docker logs <service-container-name> | grep -i trace
   ```

4. Ensure that the OpenTelemetry SDK is initialized before any other code in the service.
EOL
echo "README file for distributed tracing created!"
echo

echo "Distributed tracing setup completed!"
echo
echo "Next steps:"
echo "1. Run './scripts/integrate-tracing.sh' to integrate tracing with all microservices"
echo "2. Run 'docker-compose -f docker-compose.yml -f docker-compose.tracing.yml up -d' to start Jaeger"
echo "3. Access Jaeger UI at http://localhost:16686 to view traces"
echo "4. Create custom views for key transactions"
echo