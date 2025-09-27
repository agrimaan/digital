#!/bin/bash

# Master script to execute all integration steps for the Agrimaan platform

# Set the working directory to the project root
cd "$(dirname "$0")/.."
WORKING_DIR=$(pwd)

echo "====================================================================="
echo "Agrimaan Platform - Complete Integration Execution"
echo "====================================================================="
echo "Working directory: $WORKING_DIR"
echo

# Make all scripts executable
chmod +x ./scripts/*.sh

# Function to prompt for confirmation
confirm() {
    read -p "$1 [y/N] " response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Step 1: Component Integration
echo "====================================================================="
echo "STEP 1: COMPONENT INTEGRATION"
echo "====================================================================="
if confirm "Do you want to integrate Service Discovery, Circuit Breaker, and Message Queue with all microservices?"; then
    echo "Executing component integration..."
    ./scripts/integrate-all-components.sh
    echo "Component integration completed!"
else
    echo "Skipping component integration."
fi
echo

# Step 2: Centralized Logging and Monitoring
echo "====================================================================="
echo "STEP 2: CENTRALIZED LOGGING AND MONITORING"
echo "====================================================================="
if confirm "Do you want to set up centralized logging and monitoring (ELK Stack, Prometheus, Grafana)?"; then
    echo "Setting up centralized logging and monitoring..."
    ./scripts/setup-monitoring-logging.sh
    echo "Centralized logging and monitoring setup completed!"
else
    echo "Skipping centralized logging and monitoring setup."
fi
echo

# Step 3: Distributed Tracing
echo "====================================================================="
echo "STEP 3: DISTRIBUTED TRACING"
echo "====================================================================="
if confirm "Do you want to set up distributed tracing with Jaeger and OpenTelemetry?"; then
    echo "Setting up distributed tracing..."
    ./scripts/setup-distributed-tracing.sh
    echo "Distributed tracing setup completed!"
else
    echo "Skipping distributed tracing setup."
fi
echo

# Step 4: Start Services
echo "====================================================================="
echo "STEP 4: START SERVICES"
echo "====================================================================="
if confirm "Do you want to start all services with Docker Compose?"; then
    echo "Starting all services..."
    
    # Create a combined docker-compose file
    cat > ./docker-compose.complete.yml << 'EOL'
version: '3.8'

# This file combines all docker-compose configurations
# It includes:
# 1. Base microservices
# 2. ELK Stack for logging
# 3. Prometheus and Grafana for monitoring
# 4. Jaeger for distributed tracing

services:
  # Include services from other docker-compose files
  # Base services are included from docker-compose.yml
  
  # ELK Stack
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - ./integration/elk/elasticsearch/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml:ro
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    networks:
      - agrimaan-network

  logstash:
    image: docker.elastic.co/logstash/logstash:7.17.0
    container_name: logstash
    volumes:
      - ./integration/elk/logstash/pipeline:/usr/share/logstash/pipeline:ro
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch
    networks:
      - agrimaan-network

  kibana:
    image: docker.elastic.co/kibana/kibana:7.17.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    networks:
      - agrimaan-network

  filebeat:
    image: docker.elastic.co/beats/filebeat:7.17.0
    container_name: filebeat
    user: root
    volumes:
      - ./integration/elk/filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - logstash
    networks:
      - agrimaan-network

  # Prometheus and Grafana
  prometheus:
    image: prom/prometheus:v2.37.0
    container_name: prometheus
    volumes:
      - ./integration/monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    ports:
      - "9090:9090"
    networks:
      - agrimaan-network

  node-exporter:
    image: prom/node-exporter:v1.3.1
    container_name: node-exporter
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    networks:
      - agrimaan-network

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.45.0
    container_name: cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    ports:
      - "8080:8080"
    networks:
      - agrimaan-network

  grafana:
    image: grafana/grafana:9.0.0
    container_name: grafana
    volumes:
      - ./integration/monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./integration/monitoring/grafana/dashboards:/var/lib/grafana/dashboards:ro
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
    networks:
      - agrimaan-network

  # Jaeger for distributed tracing
  jaeger:
    image: jaegertracing/all-in-one:1.36
    container_name: jaeger
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "5775:5775/udp"
      - "6831:6831/udp"
      - "6832:6832/udp"
      - "5778:5778"
      - "16686:16686"
      - "14250:14250"
      - "14268:14268"
      - "14269:14269"
      - "4317:4317"
      - "4318:4318"
      - "9411:9411"
    networks:
      - agrimaan-network

volumes:
  elasticsearch-data:
  prometheus-data:
  grafana-data:

networks:
  agrimaan-network:
    name: agrimaan-network
EOL
    
    # Start services
    docker-compose -f docker-compose.yml -f docker-compose.complete.yml up -d
    echo "All services started!"
else
    echo "Skipping service startup."
fi
echo

# Step 5: Verify Integration
echo "====================================================================="
echo "STEP 5: VERIFY INTEGRATION"
echo "====================================================================="
echo "Integration verification:"
echo
echo "1. Service Discovery (Consul):"
echo "   - Access Consul UI: http://localhost:8500"
echo "   - Verify that all services are registered and healthy"
echo
echo "2. Circuit Breaker:"
echo "   - Test service-to-service communication with circuit breaker"
echo "   - Example: curl http://localhost:3002/api/users/1"
echo
echo "3. Message Queue:"
echo "   - Access RabbitMQ Management UI: http://localhost:15672 (guest/guest)"
echo "   - Verify exchanges and queues are created"
echo
echo "4. Centralized Logging:"
echo "   - Access Kibana: http://localhost:5601"
echo "   - Create index pattern: agrimaan-logs-*"
echo "   - View logs in Discover tab"
echo
echo "5. Monitoring:"
echo "   - Access Prometheus: http://localhost:9090"
echo "   - Access Grafana: http://localhost:3000 (admin/admin)"
echo "   - View microservices dashboard"
echo
echo "6. Distributed Tracing:"
echo "   - Access Jaeger UI: http://localhost:16686"
echo "   - View traces for services"
echo

echo "====================================================================="
echo "INTEGRATION COMPLETE!"
echo "====================================================================="
echo "The Agrimaan platform has been successfully integrated with:"
echo "- Service Discovery (Consul)"
echo "- Circuit Breaker Pattern (Resilience4j)"
echo "- Message Queue (RabbitMQ)"
echo "- Centralized Logging (ELK Stack)"
echo "- Monitoring (Prometheus and Grafana)"
echo "- Distributed Tracing (Jaeger and OpenTelemetry)"
echo
echo "For more information, refer to the documentation in the docs directory."
echo "====================================================================="