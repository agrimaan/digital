#!/bin/bash

# Script to set up ELK Stack (Elasticsearch, Logstash, Kibana) for centralized logging

# Set the working directory to the project root
cd "$(dirname "$0")/.."
WORKING_DIR=$(pwd)

echo "Setting up ELK Stack for centralized logging..."
echo "Working directory: $WORKING_DIR"
echo

# Step 1: Create directories for ELK Stack configuration
echo "Creating directories for ELK Stack configuration..."
mkdir -p ./integration/elk/elasticsearch
mkdir -p ./integration/elk/logstash/pipeline
mkdir -p ./integration/elk/filebeat
echo "Directories created!"
echo

# Step 2: Create Elasticsearch configuration
echo "Creating Elasticsearch configuration..."
cat > ./integration/elk/elasticsearch/elasticsearch.yml << 'EOL'
---
## Default Elasticsearch configuration

cluster.name: "agrimaan-elasticsearch"
network.host: 0.0.0.0

# minimum_master_nodes need to be explicitly set when bound on a public IP
# set to 1 to allow single node clusters
discovery.zen.minimum_master_nodes: 1

## X-Pack settings
xpack.license.self_generated.type: basic
xpack.security.enabled: false
xpack.monitoring.collection.enabled: true
EOL
echo "Elasticsearch configuration created!"
echo

# Step 3: Create Logstash configuration
echo "Creating Logstash configuration..."
cat > ./integration/elk/logstash/pipeline/logstash.conf << 'EOL'
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] {
    mutate {
      add_field => { "service" => "%{[fields][service]}" }
    }
  }
  
  json {
    source => "message"
    skip_on_invalid_json => true
  }
  
  if "_jsonparsefailure" in [tags] {
    mutate {
      remove_tag => [ "_jsonparsefailure" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "agrimaan-logs-%{+YYYY.MM.dd}"
  }
}
EOL
echo "Logstash configuration created!"
echo

# Step 4: Create Filebeat configuration
echo "Creating Filebeat configuration..."
cat > ./integration/elk/filebeat/filebeat.yml << 'EOL'
filebeat.inputs:
- type: container
  paths:
    - /var/lib/docker/containers/*/*.log
  json.keys_under_root: true
  json.message_key: log
  processors:
    - add_docker_metadata:
        host: "unix:///var/run/docker.sock"

processors:
  - add_host_metadata: ~
  - add_cloud_metadata: ~
  - add_docker_metadata: ~

output.logstash:
  hosts: ["logstash:5044"]
EOL
echo "Filebeat configuration created!"
echo

# Step 5: Create shared logging module
echo "Creating shared logging module..."
mkdir -p ./shared/logging
cat > ./shared/logging/index.js << 'EOL'
/**
 * Shared Logging Module
 * 
 * This module provides a configured logger instance for microservices.
 */

const winston = require('winston');
const { format } = winston;

/**
 * Create a logger instance for a microservice
 * 
 * @param {Object} options - Logger options
 * @param {string} options.serviceName - Name of the service
 * @param {string} options.level - Log level (default: 'info')
 * @returns {winston.Logger} Logger instance
 */
function createLogger(options) {
  const { serviceName, level = 'info' } = options;
  
  return winston.createLogger({
    level,
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.metadata(),
      format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console({
        format: format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, service, metadata }) => {
            return `${timestamp} [${service}] ${level}: ${message} ${JSON.stringify(metadata)}`;
          })
        )
      })
    ]
  });
}

module.exports = {
  createLogger
};
EOL
echo "Shared logging module created!"
echo

# Step 6: Update shared package.json
echo "Updating shared package.json..."
if [ -f ./shared/package.json ]; then
  # Check if winston is already in dependencies
  if ! grep -q "winston" ./shared/package.json; then
    # Use sed to add the dependency before the last closing brace
    sed -i '/}$/i \  "winston": "^3.8.2",' ./shared/package.json
  fi
else
  # Create package.json if it doesn't exist
  cat > ./shared/package.json << 'EOL'
{
  "name": "@agrimaan/shared",
  "version": "1.0.0",
  "description": "Shared libraries for Agrimaan microservices",
  "main": "index.js",
  "dependencies": {
    "winston": "^3.8.2"
  }
}
EOL
fi
echo "Shared package.json updated!"
echo

# Step 7: Create script to integrate structured logging with all microservices
echo "Creating script to integrate structured logging with all microservices..."
cat > ./scripts/integrate-structured-logging.sh << 'EOL'
#!/bin/bash

# Script to integrate structured logging with all microservices

# Define the backend services directory
BACKEND_DIR="./backend"

# Loop through all backend services
for SERVICE_DIR in $BACKEND_DIR/*-service; do
  SERVICE_NAME=$(basename $SERVICE_DIR)
  echo "Integrating structured logging with $SERVICE_NAME..."
  
  # Update package.json to include required dependencies
  echo "Updating package.json..."
  # Check if @agrimaan/shared is already in dependencies
  if ! grep -q "@agrimaan/shared" $SERVICE_DIR/package.json; then
    # Use sed to add the dependency before the first dependency
    sed -i '/"dependencies": {/a \    "@agrimaan/shared": "^1.0.0",' $SERVICE_DIR/package.json
  fi
  
  # Create a logger.js file in the utils directory
  UTILS_DIR="$SERVICE_DIR/utils"
  if [ ! -d "$UTILS_DIR" ]; then
    mkdir -p "$UTILS_DIR"
  fi
  
  echo "Creating logger.js..."
  cat > "$UTILS_DIR/logger.js" << EOF
/**
 * Logger Module
 * 
 * This module provides a configured logger instance for the service.
 */

const { createLogger } = require('@agrimaan/shared/logging');

const logger = createLogger({
  serviceName: '${SERVICE_NAME}',
  level: process.env.LOG_LEVEL || 'info'
});

module.exports = logger;
EOF
  
  # Update server.js to use the logger
  echo "Updating server.js to use the logger..."
  
  # Create a backup of the original server.js
  cp $SERVICE_DIR/server.js $SERVICE_DIR/server.js.bak_logging
  
  # Add logger import at the top of the file
  sed -i '1i const logger = require(\'./utils/logger\');' $SERVICE_DIR/server.js
  
  # Replace console.log with logger.info
  sed -i 's/console\.log(/logger.info(/g' $SERVICE_DIR/server.js
  
  # Replace console.error with logger.error
  sed -i 's/console\.error(/logger.error(/g' $SERVICE_DIR/server.js
  
  # Update .env file to include LOG_LEVEL
  if ! grep -q "LOG_LEVEL" $SERVICE_DIR/.env; then
    echo "LOG_LEVEL=info" >> $SERVICE_DIR/.env
  fi
  
  echo "Structured logging integration completed for $SERVICE_NAME"
  echo "---------------------------------------------------"
done

echo "Structured logging integration completed for all services!"
EOL
chmod +x ./scripts/integrate-structured-logging.sh
echo "Script to integrate structured logging created!"
echo

# Step 8: Update docker-compose.yml with ELK Stack services
echo "Updating docker-compose.yml with ELK Stack services..."
cat > ./docker-compose.elk.yml << 'EOL'
version: '3.8'

services:
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

volumes:
  elasticsearch-data:

networks:
  agrimaan-network:
    external: true
EOL
echo "Docker Compose file for ELK Stack created!"
echo

echo "ELK Stack setup completed!"
echo
echo "Next steps:"
echo "1. Run './scripts/integrate-structured-logging.sh' to integrate structured logging with all microservices"
echo "2. Run 'docker-compose -f docker-compose.yml -f docker-compose.elk.yml up -d' to start the ELK Stack services"
echo "3. Access Kibana at http://localhost:5601 to view logs and create dashboards"
echo