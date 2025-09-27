#!/bin/bash

# --- Configuration ---
SERVICES_DIR_NAME="backend"
INFRA_SERVICES=("mongo" "consul-server") # Services managed by docker-compose

# Define the startup order for your application microservices
# Services with fewer dependencies should come first.
APP_SERVICES_ORDER=(
    "user-service"
    "field-service"
    "crop-service"
    "iot-service"
    "marketplace-service"
    "logistics-service"
    "weather-service"
    "analytics-service"
    "notification-service"
    "blockchain-service"
    "ai-service"
    "communication-service"
    "admin-service" 
)

# --- Color Definitions ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# Get the project root directory
PROJECT_ROOT=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )/.." &> /dev/null && pwd )
SERVICES_PATH="$PROJECT_ROOT/$SERVICES_DIR_NAME"

# --- Function to start a single Node.js service ---
start_node_service() {
    local SERVICE_NAME=$1
    local SERVICE_PATH="$SERVICES_PATH/$SERVICE_NAME"

    echo -e "${YELLOW}--- Starting $SERVICE_NAME ---${NC}"

    if [ ! -d "$SERVICE_PATH" ]; then
        echo -e "${RED}Error: Directory '$SERVICE_PATH' not found. Skipping.${NC}\n"
        return
    fi
    
    if [ ! -f "$SERVICE_PATH/package.json" ]; then
        echo -e "${RED}Error: package.json not found in '$SERVICE_NAME'. Skipping.${NC}\n"
        return
    fi

    # Check for node_modules and run install if needed
    if [ ! -d "$SERVICE_PATH/node_modules" ]; then
        echo "Dependencies missing for $SERVICE_NAME. Running 'npm install'..."
        (cd "$SERVICE_PATH" && npm install)
    fi

    echo "Launching $SERVICE_NAME in the background..."
    (cd "$SERVICE_PATH" && npm run dev &)
    echo -e "${GREEN}$SERVICE_NAME has been launched.${NC}\n"
}

# --- Main Script ---

# 1. Start Infrastructure Services (DB, Consul)
echo -e "${CYAN}--- Starting Infrastructure (MongoDB & Consul)... ---${NC}"
(cd "$PROJECT_ROOT" && docker-compose up -d ${INFRA_SERVICES[@]})
echo -e "${GREEN}Infrastructure services started. Waiting 10 seconds for them to initialize...${NC}\n"
sleep 10

# 2. Start Application Services Sequentially
echo -e "${CYAN}--- Starting Application Microservices in Sequence... ---${NC}"
for service in "${APP_SERVICES_ORDER[@]}"; do
    start_node_service "$service"
    # Wait a couple of seconds between starting each service to allow for initialization
    sleep 2
done

echo "--------------------------------------------------"
echo -e "${GREEN}All backend services have been launched in the background.${NC}"
echo ""
echo "You can now navigate to any of the frontend UI directories and run 'npm start' to launch them individually."
echo ""
echo "To stop all services, you can run 'docker-compose down' and manually stop the Node.js processes, or simply close this terminal."
echo "--------------------------------------------------"

# Wait for all background processes to finish (i.e., forever until you press Ctrl+C)
wait
