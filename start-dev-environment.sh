#!/bin/bash

# Agrimaan Digital Development Environment Startup Script
echo "🚀 Starting Agrimaan Digital Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    else
        return 0
    fi
}

# Function to start a service in background
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    local start_command=${4:-"npm start"}
    
    echo -e "${BLUE}📦 Starting $service_name on port $port...${NC}"
    
    if check_port $port; then
        cd "$service_path"
        $start_command > "../../../logs/${service_name}.log" 2>&1 &
        local pid=$!
        echo $pid > "../../../logs/${service_name}.pid"
        echo -e "${GREEN}✅ $service_name started (PID: $pid)${NC}"
        cd - > /dev/null
        sleep 1
    else
        echo -e "${RED}❌ Cannot start $service_name - port $port is in use${NC}"
    fi
}

# Create logs directory
mkdir -p logs

echo -e "${BLUE}🔧 Setting up Agrimaan Digital Platform...${NC}"

# Start API Gateway first
echo -e "${BLUE}🌐 Starting API Gateway...${NC}"
start_service "API-Gateway" "infrastructure/api-gateway" 8080

# Wait for API Gateway to start
sleep 3

# Start Backend Services
echo -e "${BLUE}🔧 Starting Backend Services...${NC}"

start_service "User-Service" "backend/user-service" 3002
start_service "Field-Service" "backend/field-service" 3003
start_service "Crop-Service" "backend/crop-service" 3005

# Wait for services to initialize
sleep 5

# Start Frontend
echo -e "${BLUE}🎨 Starting Frontend Application...${NC}"
if check_port 5006; then
    cd frontend
    npm start > "../logs/frontend.log" 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > "../logs/frontend.pid"
    echo -e "${GREEN}✅ Frontend started (PID: $frontend_pid)${NC}"
    cd - > /dev/null
else
    echo -e "${RED}❌ Cannot start Frontend - port 5006 is in use${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Agrimaan Digital Development Environment Started!${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
echo -e "   • ${GREEN}API Gateway:${NC}  http://localhost:8080"
echo -e "   • ${GREEN}Frontend:${NC}     http://localhost:5006"
echo -e "   • ${GREEN}User Service:${NC} http://localhost:3002"
echo -e "   • ${GREEN}Field Service:${NC} http://localhost:3003"
echo -e "   • ${GREEN}Crop Service:${NC} http://localhost:3005"
echo ""
echo -e "${BLUE}📝 Logs are available in the 'logs' directory${NC}"
echo -e "${BLUE}🛑 To stop all services, run: ./stop-dev-environment.sh${NC}"
echo ""
echo -e "${YELLOW}⏳ Services are starting up... Please wait 30-60 seconds before accessing the application${NC}"

# Health check function
check_health() {
    echo -e "${BLUE}🔍 Checking service health...${NC}"
    
    # Check API Gateway
    if curl -s http://localhost:8080/health > /dev/null; then
        echo -e "${GREEN}✅ API Gateway is healthy${NC}"
    else
        echo -e "${RED}❌ API Gateway is not responding${NC}"
    fi
    
    # Check Frontend
    if curl -s http://localhost:5006 > /dev/null; then
        echo -e "${GREEN}✅ Frontend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend may still be starting up${NC}"
    fi
}

# Wait a bit and then check health
sleep 10
check_health