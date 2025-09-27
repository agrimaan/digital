
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}\ud83d\ude80 Starting Agrimaan Backend Services${NC}"

# Check if MongoDB is running
echo -e "${YELLOW}\ud83d\udd0d Checking MongoDB...${NC}"
if pgrep -x "mongod" > /dev/null
then
    echo -e "${GREEN}\u2705 MongoDB is running${NC}"
else
    echo -e "${RED}\u274c MongoDB is not running. Please start MongoDB first${NC}"
    exit 1
fi

# Function to start a service
start_service() {
    local service_name=$1
    local port=$2
    local directory=$3
    
    echo -e "${YELLOW}\ud83d\udd04 Starting $service_name on port $port...${NC}"
    
    if [ -d "$directory" ]; then
        cd "$directory"
        
        # Check if package.json exists
        if [ ! -f "package.json" ]; then
            echo -e "${RED}\u274c package.json not found in $directory${NC}"
            return 1
        fi
        
        # Install dependencies if node_modules doesn't exist
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}\ud83d\udce6 Installing dependencies for $service_name...${NC}"
            npm install --quiet
        fi
        
        # Start the service
        nohup npm start > "$service_name.log" 2>&1 &
        echo $! > "$service_name.pid"
        
        # Wait a bit for service to start
        sleep 2
        
        # Check if service is running
        if pgrep -f "$service_name" > /dev/null; then
            echo -e "${GREEN}\u2705 $service_name started successfully on port $port${NC}"
        else
            echo -e "${RED}\u274c Failed to start $service_name${NC}"
            return 1
        fi
        
        cd ..
    else
        echo -e "${RED}\u274c Directory $directory not found${NC}"
        return 1
    fi
}

# Create logs directory
mkdir -p logs

# Start services
start_service "user-service" "3002" "backend/user-service"
start_service "crop-service" "3003" "backend/crop-service"
start_service "weather-service" "3005" "backend/weather-service"
start_service "field-service" "3004" "backend/field-service"
start_service "marketplace-service" "3006" "backend/marketplace-service"
start_service "logistics-service" "3007" "backend/logistics-service"
start_service "iot-service" "3008" "backend/iot-service"
start_service "analytics-service" "3009" "backend/analytics-service"
start_service "admin-service" "3010" "backend/admin-service"

echo -e "${GREEN}\ud83c\udf89 All services started successfully!${NC}"
echo -e "${YELLOW}\ud83d\udcca Service Status:${NC}"
echo "User Service: http://localhost:3002"
echo "Crop Service: http://localhost:3003"
echo "Field Service: http://localhost:3004"
echo "Weather Service: http://localhost:3005"
echo "Marketplace Service: http://localhost:3006"
echo "Logistics Service: http://localhost:3007"
echo "IoT Service: http://localhost:3008"
echo "Analytics Service: http://localhost:3009"
echo "Admin Service: http://localhost:3010"

echo -e "${YELLOW}\ud83d\udd0d Check service logs:${NC}"
echo "tail -f logs/*.log"

# Function to stop all services
stop_services() {
    echo -e "${YELLOW}\ud83d\uded1 Stopping all services...${NC}"
    
    for service in user-service crop-service weather-service field-service marketplace-service logistics-service iot-service analytics-service admin-service; do
        if [ -f "$service.pid" ]; then
            kill $(cat "$service.pid") 2>/dev/null
            rm -f "$service.pid"
            echo -e "${GREEN}\u2705 Stopped $service${NC}"
        fi
    done
    
    echo -e "${GREEN}\u2705 All services stopped${NC}"
}

# Trap SIGINT to stop services when script is interrupted
trap stop_services SIGINT

echo -e "${GREEN}\u2728 Services are running. Press Ctrl+C to stop all services.${NC}"

# Keep script running
while true; do
    sleep 1
done
