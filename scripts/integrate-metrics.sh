#!/bin/bash

# Script to integrate metrics collection with all microservices

# Define the backend services directory
BACKEND_DIR="./backend"

# Loop through all backend services
for SERVICE_DIR in $BACKEND_DIR/*-service; do
  SERVICE_NAME=$(basename $SERVICE_DIR)
  echo "Integrating metrics collection with $SERVICE_NAME..."
  
  # Update package.json to include required dependencies
  echo "Updating package.json..."
  # Check if @agrimaan/shared is already in dependencies
  if ! grep -q "@agrimaan/shared" $SERVICE_DIR/package.json; then
    # Use sed to add the dependency before the first dependency
    sed -i '/"dependencies": {/a \    "@agrimaan/shared": "^1.0.0",' $SERVICE_DIR/package.json
  fi
  
  # Create a metrics.js file in the utils directory
  UTILS_DIR="$SERVICE_DIR/utils"
  if [ ! -d "$UTILS_DIR" ]; then
    mkdir -p "$UTILS_DIR"
  fi
  
  echo "Creating metrics.js..."
  cat > "$UTILS_DIR/metrics.js" << EOF
/**
 * Metrics Module
 * 
 * This module provides metrics collection for the service.
 */

const { createMetrics } = require('@agrimaan/shared/metrics');

const metrics = createMetrics({
  serviceName: '${SERVICE_NAME}'
});

module.exports = metrics;
EOF
  
  # Update server.js to use the metrics
  echo "Updating server.js to use metrics..."
  
  # Create a backup of the original server.js
  cp $SERVICE_DIR/server.js $SERVICE_DIR/server.js.bak_metrics
  
  # Add metrics import at the top of the file
  sed -i '1i const metrics = require(\'./utils/metrics\');' $SERVICE_DIR/server.js
  
  # Add metrics middleware after express initialization
  sed -i '/app.use(morgan/a app.use(metrics.httpMetricsMiddleware);' $SERVICE_DIR/server.js
  
  # Add metrics endpoint setup before routes
  ROUTES_LINE=$(grep -n "app.use(.api" $SERVICE_DIR/server.js | head -1 | cut -d':' -f1)
  if [ -n "$ROUTES_LINE" ]; then
    # Insert metrics routes setup before the first route
    sed -i "${ROUTES_LINE}i // Setup metrics routes\nmetrics.setupMetricsRoutes(app);\n" $SERVICE_DIR/server.js
  else
    echo "Could not find routes in server.js for $SERVICE_NAME"
  fi
  
  echo "Metrics collection integration completed for $SERVICE_NAME"
  echo "---------------------------------------------------"
done

echo "Metrics collection integration completed for all services!"
