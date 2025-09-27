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
