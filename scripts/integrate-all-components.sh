#!/bin/bash

# Master script to integrate all components with microservices
# This script runs all three integration scripts in sequence

# Set the working directory to the project root
cd "$(dirname "$0")/.."
WORKING_DIR=$(pwd)

echo "Starting integration of all components with microservices..."
echo "Working directory: $WORKING_DIR"
echo

# Make all scripts executable
chmod +x ./scripts/integrate-service-discovery.sh
chmod +x ./scripts/integrate-circuit-breaker.sh
chmod +x ./scripts/integrate-message-queue.sh

# Step 1: Integrate Service Discovery
echo "Step 1: Integrating Service Discovery with all microservices..."
./scripts/integrate-service-discovery.sh
echo "Service Discovery integration completed!"
echo

# Step 2: Integrate Circuit Breaker
echo "Step 2: Integrating Circuit Breaker with all microservices..."
./scripts/integrate-circuit-breaker.sh
echo "Circuit Breaker integration completed!"
echo

# Step 3: Integrate Message Queue
echo "Step 3: Integrating Message Queue with all microservices..."
./scripts/integrate-message-queue.sh
echo "Message Queue integration completed!"
echo

echo "All components have been integrated with microservices!"
echo "Next steps:"
echo "1. Run 'npm install' in each service directory to install new dependencies"
echo "2. Test the integration by starting the services"
echo "3. Verify service registration in Consul"
echo "4. Test inter-service communication with circuit breaker"
echo "5. Test asynchronous communication with message queue"