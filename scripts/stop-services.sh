#!/bin/bash

# Stop all microservices using Docker Compose
echo "Stopping Agrimaan microservices..."
docker-compose down

echo "All services stopped."