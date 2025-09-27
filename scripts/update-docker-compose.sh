#!/bin/bash

# This script updates the docker-compose.yml file to include Consul service
# and adds the necessary environment variables to all services

# Backup the original docker-compose.yml file
cp docker-compose.yml docker-compose.yml.bak

# Add Consul service to docker-compose.yml
sed -i '/mqtt-broker:/i \
  # Consul Server for Service Discovery\
  consul-server:\
    build: ./consul-server\
    container_name: agrimaan-consul\
    restart: always\
    ports:\
      - "8500:8500"\
      - "8600:8600/udp"\
    volumes:\
      - consul_data:/consul/data\
    networks:\
      - agrimaan-network\
' docker-compose.yml

# Add consul_data volume
sed -i '/volumes:/a \
  consul_data:' docker-compose.yml

# Add Consul environment variables to all services
for service in user-service field-service iot-service crop-service marketplace-service logistics-service weather-service analytics-service notification-service blockchain-service admin-service api-gateway
do
  # Find the environment section for each service and add Consul variables
  sed -i "/environment:/a \
      - CONSUL_HOST=consul-server\
      - CONSUL_PORT=8500\
      - SERVICE_NAME=$service" docker-compose.yml
  
  # Add consul-server to depends_on for each service
  sed -i "/depends_on:/a \
      - consul-server" docker-compose.yml
done

echo "Docker Compose file updated with Consul service discovery configuration"