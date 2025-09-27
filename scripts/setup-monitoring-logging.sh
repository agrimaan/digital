#!/bin/bash

# Master script to set up both ELK Stack and Prometheus/Grafana

# Set the working directory to the project root
cd "$(dirname "$0")/.."
WORKING_DIR=$(pwd)

echo "Setting up centralized logging and monitoring for Agrimaan platform..."
echo "Working directory: $WORKING_DIR"
echo

# Make all scripts executable
chmod +x ./scripts/setup-elk-stack.sh
chmod +x ./scripts/setup-prometheus-grafana.sh
chmod +x ./scripts/integrate-structured-logging.sh
chmod +x ./scripts/integrate-metrics.sh

# Step 1: Set up ELK Stack
echo "Step 1: Setting up ELK Stack..."
./scripts/setup-elk-stack.sh
echo "ELK Stack setup completed!"
echo

# Step 2: Set up Prometheus and Grafana
echo "Step 2: Setting up Prometheus and Grafana..."
./scripts/setup-prometheus-grafana.sh
echo "Prometheus and Grafana setup completed!"
echo

# Step 3: Integrate structured logging with all microservices
echo "Step 3: Integrating structured logging with all microservices..."
./scripts/integrate-structured-logging.sh
echo "Structured logging integration completed!"
echo

# Step 4: Integrate metrics collection with all microservices
echo "Step 4: Integrating metrics collection with all microservices..."
./scripts/integrate-metrics.sh
echo "Metrics collection integration completed!"
echo

# Step 5: Create a combined docker-compose file
echo "Step 5: Creating combined docker-compose file..."
cat > ./docker-compose.observability.yml << 'EOL'
version: '3.8'

services:
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

volumes:
  elasticsearch-data:
  prometheus-data:
  grafana-data:

networks:
  agrimaan-network:
    external: true
EOL
echo "Combined docker-compose file created!"
echo

echo "Centralized logging and monitoring setup completed!"
echo
echo "Next steps:"
echo "1. Start the observability stack:"
echo "   docker-compose -f docker-compose.yml -f docker-compose.observability.yml up -d"
echo "2. Access Kibana at http://localhost:5601 to view logs and create dashboards"
echo "3. Access Prometheus at http://localhost:9090 to query metrics"
echo "4. Access Grafana at http://localhost:3000 to view dashboards (default credentials: admin/admin)"
echo
echo "Note: Make sure to update the network configuration in docker-compose.observability.yml"
echo "if your microservices are using a different network name than 'agrimaan-network'."