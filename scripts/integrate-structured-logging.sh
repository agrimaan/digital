#!/bin/bash

# Script to integrate structured logging with all microservices

# Define the backend services directory
BACKEND_DIR="./backend"

# Loop through all backend services
for SERVICE_DIR in $BACKEND_DIR/*-service; do
  SERVICE_NAME=$(basename $SERVICE_DIR)
  echo "Integrating structured logging with $SERVICE_NAME..."
  
  # Update package.json to include required dependencies
  echo "Updating package.json..."
  # Check if @agrimaan/shared is already in dependencies
  if ! grep -q "@agrimaan/shared" $SERVICE_DIR/package.json; then
    # Use sed to add the dependency before the first dependency
    sed -i '/"dependencies": {/a \    "@agrimaan/shared": "^1.0.0",' $SERVICE_DIR/package.json
  fi
  
  # Create a logger.js file in the utils directory
  UTILS_DIR="$SERVICE_DIR/utils"
  if [ ! -d "$UTILS_DIR" ]; then
    mkdir -p "$UTILS_DIR"
  fi
  
  echo "Creating logger.js..."
  cat > "$UTILS_DIR/logger.js" << EOF
/**
 * Logger Module
 * 
 * This module provides a configured logger instance for the service.
 */

const { createLogger } = require('@agrimaan/shared/logging');

const logger = createLogger({
  serviceName: '${SERVICE_NAME}',
  level: process.env.LOG_LEVEL || 'info'
});

module.exports = logger;
EOF
  
  # Update server.js to use the logger
  echo "Updating server.js to use the logger..."
  
  # Create a backup of the original server.js
  cp $SERVICE_DIR/server.js $SERVICE_DIR/server.js.bak_logging
  
  # Add logger import at the top of the file
  sed -i '1i const logger = require(\'./utils/logger\');' $SERVICE_DIR/server.js
  
  # Replace console.log with logger.info
  sed -i 's/console\.log(/logger.info(/g' $SERVICE_DIR/server.js
  
  # Replace console.error with logger.error
  sed -i 's/console\.error(/logger.error(/g' $SERVICE_DIR/server.js
  
  # Update .env file to include LOG_LEVEL
  if ! grep -q "LOG_LEVEL" $SERVICE_DIR/.env; then
    echo "LOG_LEVEL=info" >> $SERVICE_DIR/.env
  fi
  
  echo "Structured logging integration completed for $SERVICE_NAME"
  echo "---------------------------------------------------"
done

echo "Structured logging integration completed for all services!"
