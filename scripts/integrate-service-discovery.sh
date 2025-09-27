#!/bin/bash

# Script to integrate service discovery with all backend microservices
# This script updates server.js and package.json files for each service

# Define the backend services directory
BACKEND_DIR="./backend"

# Loop through all backend services
for SERVICE_DIR in $BACKEND_DIR/*-service; do
  SERVICE_NAME=$(basename $SERVICE_DIR)
  echo "Integrating service discovery with $SERVICE_NAME..."
  
  # Get the port number from the .env file
  PORT=$(grep "PORT=" $SERVICE_DIR/.env | cut -d'=' -f2)
  if [ -z "$PORT" ]; then
    # Default port based on service name if not found in .env
    case $SERVICE_NAME in
      "user-service") PORT=3002 ;;
      "field-service") PORT=3003 ;;
      "iot-service") PORT=3004 ;;
      "crop-service") PORT=3005 ;;
      "marketplace-service") PORT=3006 ;;
      "logistics-service") PORT=3007 ;;
      "weather-service") PORT=3008 ;;
      "analytics-service") PORT=3009 ;;
      "notification-service") PORT=3010 ;;
      "blockchain-service") PORT=3011 ;;
      "admin-service") PORT=3012 ;;
      *) PORT=3000 ;;
    esac
    echo "PORT not found in .env, using default: $PORT"
  fi
  
  # Update the .env file to include Consul configuration
  if ! grep -q "CONSUL_HOST" $SERVICE_DIR/.env; then
    echo "Updating .env file..."
    echo "CONSUL_HOST=consul-server" >> $SERVICE_DIR/.env
    echo "CONSUL_PORT=8500" >> $SERVICE_DIR/.env
  fi
  
  # Update package.json to include required dependencies
  echo "Updating package.json..."
  # Check if @agrimaan/shared is already in dependencies
  if ! grep -q "@agrimaan/shared" $SERVICE_DIR/package.json; then
    # Use sed to add the dependency before the first dependency
    sed -i '/"dependencies": {/a \    "@agrimaan/shared": "^1.0.0",' $SERVICE_DIR/package.json
  fi
  
  # Check if consul is already in dependencies
  if ! grep -q "consul" $SERVICE_DIR/package.json; then
    # Use sed to add the dependency before the first dependency
    sed -i '/"dependencies": {/a \    "consul": "^1.2.0",' $SERVICE_DIR/package.json
  fi
  
  # Update server.js to include service discovery
  echo "Updating server.js..."
  
  # Create a backup of the original server.js
  cp $SERVICE_DIR/server.js $SERVICE_DIR/server.js.bak
  
  # Add service discovery imports
  sed -i '/require(.dotenv.).config();/a \\\n// Import service discovery components\nconst { ServiceRegistry, healthCheck } = require('"'"'@agrimaan/shared/service-discovery'"'"');' $SERVICE_DIR/server.js
  
  # Add health check middleware
  sed -i '/app.use(morgan(.dev.));/a \\\n// Add health check middleware\napp.use(healthCheck({\n  serviceName: '"'"''"$SERVICE_NAME"''"'"',\n  dependencies: {\n    database: async () => {\n      return mongoose.connection.readyState === 1;\n    }\n  }\n}));' $SERVICE_DIR/server.js
  
  # Update the server start code to register with Consul
  # First, find the line with app.listen
  LISTEN_LINE=$(grep -n "app.listen" $SERVICE_DIR/server.js | cut -d':' -f1)
  
  if [ -n "$LISTEN_LINE" ]; then
    # Replace the app.listen line and add service registration
    sed -i "${LISTEN_LINE}s/app.listen/const server = app.listen/" $SERVICE_DIR/server.js
    
    # Add service registration code after the console.log line
    CONSOLE_LOG_LINE=$((LISTEN_LINE + 1))
    sed -i "${CONSOLE_LOG_LINE}a \\\n  // Register service with Consul\n  const serviceRegistry = new ServiceRegistry({\n    serviceName: '"'"''"$SERVICE_NAME"''"'"',\n    servicePort: PORT,\n    tags: ['api'],\n    healthCheckUrl: '/health',\n    healthCheckInterval: '15s'\n  });\n  \n  serviceRegistry.register()\n    .then(() => {\n      console.log('Service registered with Consul');\n      // Setup graceful shutdown to deregister service\n      serviceRegistry.setupGracefulShutdown(server);\n    })\n    .catch(err => {\n      console.error('Failed to register service with Consul:', err);\n    });" $SERVICE_DIR/server.js
  else
    echo "Could not find app.listen line in server.js for $SERVICE_NAME"
  fi
  
  echo "Service discovery integration completed for $SERVICE_NAME"
  echo "---------------------------------------------------"
done

echo "Service discovery integration completed for all services!"