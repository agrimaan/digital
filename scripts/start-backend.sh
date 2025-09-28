#!/bin/bash

# --- Configuration ---
SERVICES_DIR_NAME="backend"
# Use the complete docker-compose file that defines ALL services
DOCKER_COMPOSE_FILE="docker-compose.complete.yml" 
# Infrastructure services to start first
INFRA_SERVICES=("mongodb" "consul-server" "rabbitmq") 

# Define the startup order for your application microservices
APP_SERVICES_ORDER=(
    "user-service" "field-service" "crop-service" "iot-service" 
    "marketplace-service" "logistics-service" "weather-service" 
    "analytics-service" "notification-service" "blockchain-service" 
    "investor-service" "buyer-service" "ai-service" 
    "communication-service" "admin-service" 
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
COMPOSE_FILE_PATH="$PROJECT_ROOT/$DOCKER_COMPOSE_FILE"

# --- Main Script ---
echo -e "${CYAN}Using docker-compose file: $DOCKER_COMPOSE_FILE${NC}"

# 1. Verify npm install has been run from the root
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo -e "${RED}ERROR: Root node_modules not found!${NC}"
    echo -e "${YELLOW}Please run 'npm install' in the main project directory ('/opt/agm/digital/') before starting services.${NC}"
    exit 1
fi

# 2. Start Infrastructure Services (DB, Consul, etc.)
echo -e "${CYAN}--- Starting Infrastructure services... ---${NC}"
(cd "$PROJECT_ROOT" && docker-compose -f "$COMPOSE_FILE_PATH" up -d ${INFRA_SERVICES[@]})
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start infrastructure services. Please check your Docker setup and '$DOCKER_COMPOSE_FILE'.${NC}"
    exit 1
fi
echo -e "${GREEN}Infrastructure services started. Waiting 10 seconds for initialization...${NC}\n"
sleep 10

# 3. Start Application Services Sequentially
echo -e "${CYAN}--- Starting Application Microservices in Sequence... ---${NC}"
for service in "${APP_SERVICES_ORDER[@]}"; do
    SERVICE_PATH="$SERVICES_PATH/$service"
    if [ -d "$SERVICE_PATH" ]; then
        echo -e "${YELLOW}Launching $service...${NC}"
        (cd "$SERVICE_PATH" && npm run dev &)
        sleep 2 # Stagger the startup
    else
        echo -e "${RED}Warning: Directory for '$service' not found. Skipping.${NC}"
    fi
done

echo ""
echo "--------------------------------------------------"
echo -e "${GREEN}All backend services have been launched in the background.${NC}"
echo "You can now start any frontend UI project individually by navigating to its folder and running 'npm start'."
echo -e "To stop everything, run ${YELLOW}'docker-compose -f $DOCKER_COMPOSE_FILE down'${NC} in the root directory."
echo "--------------------------------------------------"

# Wait for all background processes to finish
wait