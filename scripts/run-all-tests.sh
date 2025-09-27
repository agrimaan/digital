#!/bin/bash

# Run tests for all microservices
echo "Running tests for all microservices..."

# Array of service directories
services=(
  "user-service"
  "field-service"
  "iot-service"
  "crop-service"
  "marketplace-service"
  "logistics-service"
  "weather-service"
  "analytics-service"
  "notification-service"
  "blockchain-service"
  "admin-service"
  "api-gateway"
)

# Track overall success
overall_success=true

# Run tests for each service
for service in "${services[@]}"; do
  echo "----------------------------------------"
  echo "Testing $service..."
  echo "----------------------------------------"
  
  # Check if service directory exists
  if [ -d "$service" ]; then
    cd "$service"
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
      # Install dependencies if node_modules doesn't exist
      if [ ! -d "node_modules" ]; then
        echo "Installing dependencies for $service..."
        npm install
      fi
      
      # Run tests
      echo "Running tests for $service..."
      if npm test; then
        echo "$service tests: PASSED"
      else
        echo "$service tests: FAILED"
        overall_success=false
      fi
    else
      echo "No package.json found in $service, skipping tests."
    fi
    
    cd ..
  else
    echo "Service directory $service not found, skipping tests."
  fi
done

echo "----------------------------------------"
echo "All tests completed."

# Report overall status
if [ "$overall_success" = true ]; then
  echo "All tests passed successfully!"
  exit 0
else
  echo "Some tests failed. Please check the logs above for details."
  exit 1
fi