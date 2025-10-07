#!/bin/bash

# Agrimaan Digital Development Environment Stop Script
echo "🛑 Stopping Agrimaan Digital Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}🔴 Stopping $service_name (PID: $pid)...${NC}"
            kill "$pid"
            rm "$pid_file"
            echo -e "${GREEN}✅ $service_name stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $service_name was not running${NC}"
            rm "$pid_file"
        fi
    else
        echo -e "${YELLOW}⚠️  No PID file found for $service_name${NC}"
    fi
}

# Stop all services
stop_service "frontend"
stop_service "API-Gateway"
stop_service "User-Service"
stop_service "Field-Service"
stop_service "Crop-Service"

# Kill any remaining node processes on our ports
echo -e "${YELLOW}🧹 Cleaning up any remaining processes...${NC}"
pkill -f "node.*5006" 2>/dev/null || true
pkill -f "node.*8080" 2>/dev/null || true
pkill -f "node.*3002" 2>/dev/null || true
pkill -f "node.*3003" 2>/dev/null || true
pkill -f "node.*3005" 2>/dev/null || true

echo -e "${GREEN}✅ All services stopped${NC}"