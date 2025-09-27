#!/bin/bash

# Start all microservices using Docker Compose
echo "Starting Agrimaan microservices..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check service health
echo "Checking service health..."
curl -s http://localhost:3000/health | grep -q "UP" && echo "API Gateway: UP" || echo "API Gateway: DOWN"
curl -s http://localhost:3002/health | grep -q "UP" && echo "User Service: UP" || echo "User Service: DOWN"
curl -s http://localhost:3003/health | grep -q "UP" && echo "Field Service: UP" || echo "Field Service: DOWN"
curl -s http://localhost:3004/health | grep -q "UP" && echo "IoT Service: UP" || echo "IoT Service: DOWN"

echo "Services started. Access the API Gateway at http://localhost:3000"
echo "Frontend services:"
echo "- Farmer: http://localhost:5001"
echo "- Buyer: http://localhost:5002"
echo "- Logistics: http://localhost:5003"
echo "- Investor: http://localhost:5004"
echo "- Agronomist: http://localhost:5005"
echo "- Admin: http://localhost:5006"