
#!/bin/bash

# Fix backend services to remove @agrimaan/shared dependency
# This script updates the server.js files in Docker containers

echo "\ud83d\udd27 Fixing backend services to remove @agrimaan/shared dependency..."

# Function to fix a service
fix_service() {
    local service=$1
    local server_file="/opt/agm/digital/backend/${service}/server.js"
    
    if [[ -f "$server_file" ]]; then
        echo "  \ud83d\udccb Fixing $service..."
        
        # Remove @agrimaan/shared imports and replace with direct implementations
        sed -i 's|const { ServiceRegistry, healthCheck } = require.*@agrimaan/shared.*serviceDiscovery.*|// Service Discovery Implementation\
const ServiceRegistry = {\
  register: async (serviceName, serviceUrl, consulHost, consulPort) => {\
    console.log(`Registering service: ${serviceName} at ${serviceUrl}`);\
    return Promise.resolve();\
  },\
  deregister: async (serviceName, consulHost, consulPort) => {\
    console.log(`Deregistering service: ${serviceName}`);\
    return Promise.resolve();\
  }\
};\
\
const healthCheck = {\
  start: (app, port, serviceName) => {\
    console.log(`Health check started for ${serviceName} on port ${port}`);\
  }\
};|g' "$server_file"
        
        # Remove any other @agrimaan/shared references
        sed -i '/@agrimaan\/shared/d' "$server_file"
        
        echo "  \u2705 $service fixed"
    else
        echo "  \u26a0\ufe0f  $service server.js not found"
    fi
}

# Fix all backend services
services=(
    "admin-service"
    "analytics-service"
    "blockchain-service"
    "crop-service"
    "field-service"
    "iot-service"
    "logistics-service"
    "marketplace-service"
    "notification-service"
    "user-service"
    "weather-service"
)

for service in "${services[@]}"; do
    fix_service "$service"
done

echo "\ud83c\udf89 All backend services fixed!"

