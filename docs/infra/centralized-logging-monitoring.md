# Centralized Logging and Monitoring for Agrimaan Platform

This document outlines the implementation plan for centralized logging and monitoring in the Agrimaan microservices architecture.

## Overview

Centralized logging and monitoring are essential for maintaining visibility and troubleshooting issues in a microservices architecture. This implementation will use the ELK Stack (Elasticsearch, Logstash, Kibana) for logging and Prometheus/Grafana for monitoring.

## Architecture

### Logging Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Microservice │     │ Microservice │     │ Microservice │     │ Microservice │
│    Logs      │     │    Logs      │     │    Logs      │     │    Logs      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           Filebeat/Fluentd                          │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │      Logstash     │
                         │  (Parse, Filter)  │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Elasticsearch   │
                         │  (Store, Index)   │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │      Kibana       │
                         │  (Visualization)  │
                         └───────────────────┘
```

### Monitoring Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Microservice │     │ Microservice │     │ Microservice │     │ Microservice │
│   Metrics    │     │   Metrics    │     │   Metrics    │     │   Metrics    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Prometheus Exporters                        │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │    Prometheus     │
                         │  (Collect, Store) │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │     Grafana       │
                         │  (Visualization)  │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  Alert Manager    │
                         │  (Notifications)  │
                         └───────────────────┘
```

## Implementation Plan

### 1. Centralized Logging with ELK Stack

#### 1.1 Set up Elasticsearch

1. Add Elasticsearch configuration to docker-compose.yml:

```yaml
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
    - elasticsearch-data:/usr/share/elasticsearch/data
  ports:
    - "9200:9200"
  networks:
    - agrimaan-network
```

#### 1.2 Set up Logstash

1. Create Logstash configuration:

```
# logstash/pipeline/logstash.conf
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
```

2. Add Logstash to docker-compose.yml:

```yaml
logstash:
  image: docker.elastic.co/logstash/logstash:7.17.0
  container_name: logstash
  volumes:
    - ./logstash/pipeline:/usr/share/logstash/pipeline
  ports:
    - "5044:5044"
  depends_on:
    - elasticsearch
  networks:
    - agrimaan-network
```

#### 1.3 Set up Kibana

1. Add Kibana to docker-compose.yml:

```yaml
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
```

#### 1.4 Set up Filebeat

1. Create Filebeat configuration:

```yaml
# filebeat/filebeat.yml
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
```

2. Add Filebeat to docker-compose.yml:

```yaml
filebeat:
  image: docker.elastic.co/beats/filebeat:7.17.0
  container_name: filebeat
  user: root
  volumes:
    - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
    - /var/lib/docker/containers:/var/lib/docker/containers:ro
    - /var/run/docker.sock:/var/run/docker.sock:ro
  depends_on:
    - logstash
  networks:
    - agrimaan-network
```

#### 1.5 Implement Structured Logging in Microservices

1. Create a shared logging module:

```javascript
// shared/logging/index.js
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
```

2. Update package.json in shared directory:

```json
{
  "dependencies": {
    "winston": "^3.8.2"
  }
}
```

3. Create a script to integrate logging into all microservices:

```bash
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
  cat > "$UTILS_DIR/logger.js" << EOL
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
EOL
  
  # Update server.js to use the logger
  echo "Updating server.js to use the logger..."
  
  # Create a backup of the original server.js
  cp $SERVICE_DIR/server.js $SERVICE_DIR/server.js.bak3
  
  # Replace console.log with logger
  sed -i 's/console\.log(/logger.info(/g' $SERVICE_DIR/server.js
  sed -i 's/console\.error(/logger.error(/g' $SERVICE_DIR/server.js
  
  # Add logger import at the top of the file
  sed -i '1i const logger = require(\'./utils/logger\');' $SERVICE_DIR/server.js
  
  echo "Structured logging integration completed for $SERVICE_NAME"
  echo "---------------------------------------------------"
done

echo "Structured logging integration completed for all services!"
```

### 2. Monitoring with Prometheus and Grafana

#### 2.1 Set up Prometheus

1. Create Prometheus configuration:

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'microservices'
    dns_sd_configs:
      - names:
          - 'tasks.user-service'
          - 'tasks.field-service'
          - 'tasks.iot-service'
          - 'tasks.crop-service'
          - 'tasks.marketplace-service'
          - 'tasks.logistics-service'
          - 'tasks.weather-service'
          - 'tasks.analytics-service'
          - 'tasks.notification-service'
          - 'tasks.blockchain-service'
          - 'tasks.admin-service'
        type: 'A'
        port: 3000
```

2. Add Prometheus to docker-compose.yml:

```yaml
prometheus:
  image: prom/prometheus:v2.37.0
  container_name: prometheus
  volumes:
    - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
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
```

#### 2.2 Set up Node Exporter

1. Add Node Exporter to docker-compose.yml:

```yaml
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
```

#### 2.3 Set up cAdvisor

1. Add cAdvisor to docker-compose.yml:

```yaml
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
```

#### 2.4 Set up Grafana

1. Add Grafana to docker-compose.yml:

```yaml
grafana:
  image: grafana/grafana:9.0.0
  container_name: grafana
  volumes:
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
```

#### 2.5 Implement Metrics Collection in Microservices

1. Create a shared metrics module:

```javascript
// shared/metrics/index.js
const promClient = require('prom-client');
const express = require('express');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

/**
 * Create metrics for a microservice
 * 
 * @param {Object} options - Metrics options
 * @param {string} options.serviceName - Name of the service
 * @returns {Object} Metrics object with counters, gauges, and histograms
 */
function createMetrics(options) {
  const { serviceName } = options;
  
  // Create HTTP request counter
  const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register]
  });
  
  // Create HTTP request duration histogram
  const httpRequestDurationMs = new promClient.Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    registers: [register]
  });
  
  // Create active connections gauge
  const activeConnections = new promClient.Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    registers: [register]
  });
  
  // Create service-specific metrics
  const serviceOperationsTotal = new promClient.Counter({
    name: `${serviceName.replace(/-/g, '_')}_operations_total`,
    help: `Total number of ${serviceName} operations`,
    labelNames: ['operation', 'status'],
    registers: [register]
  });
  
  // Create middleware for HTTP metrics
  const httpMetricsMiddleware = (req, res, next) => {
    const start = Date.now();
    
    // Increment active connections
    activeConnections.inc();
    
    // Record end time and metrics on response finish
    res.on('finish', () => {
      // Decrement active connections
      activeConnections.dec();
      
      // Get route path (normalize to avoid high cardinality)
      const route = req.route ? req.route.path : req.path;
      
      // Record metrics
      httpRequestsTotal.inc({
        method: req.method,
        route,
        status: res.statusCode
      });
      
      httpRequestDurationMs.observe(
        {
          method: req.method,
          route,
          status: res.statusCode
        },
        Date.now() - start
      );
    });
    
    next();
  };
  
  // Create metrics endpoint
  const metricsEndpoint = async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  };
  
  // Setup metrics routes
  const setupMetricsRoutes = (app) => {
    app.get('/metrics', metricsEndpoint);
  };
  
  return {
    httpRequestsTotal,
    httpRequestDurationMs,
    activeConnections,
    serviceOperationsTotal,
    httpMetricsMiddleware,
    metricsEndpoint,
    setupMetricsRoutes,
    register
  };
}

module.exports = {
  createMetrics
};
```

2. Update package.json in shared directory:

```json
{
  "dependencies": {
    "prom-client": "^14.1.0"
  }
}
```

3. Create a script to integrate metrics into all microservices:

```bash
#!/bin/bash

# Script to integrate metrics collection with all microservices

# Define the backend services directory
BACKEND_DIR="./backend"

# Loop through all backend services
for SERVICE_DIR in $BACKEND_DIR/*-service; do
  SERVICE_NAME=$(basename $SERVICE_DIR)
  echo "Integrating metrics collection with $SERVICE_NAME..."
  
  # Update package.json to include required dependencies
  echo "Updating package.json..."
  # Check if @agrimaan/shared is already in dependencies
  if ! grep -q "@agrimaan/shared" $SERVICE_DIR/package.json; then
    # Use sed to add the dependency before the first dependency
    sed -i '/"dependencies": {/a \    "@agrimaan/shared": "^1.0.0",' $SERVICE_DIR/package.json
  fi
  
  # Create a metrics.js file in the utils directory
  UTILS_DIR="$SERVICE_DIR/utils"
  if [ ! -d "$UTILS_DIR" ]; then
    mkdir -p "$UTILS_DIR"
  fi
  
  echo "Creating metrics.js..."
  cat > "$UTILS_DIR/metrics.js" << EOL
/**
 * Metrics Module
 * 
 * This module provides metrics collection for the service.
 */

const { createMetrics } = require('@agrimaan/shared/metrics');

const metrics = createMetrics({
  serviceName: '${SERVICE_NAME}'
});

module.exports = metrics;
EOL
  
  # Update server.js to use the metrics
  echo "Updating server.js to use metrics..."
  
  # Create a backup of the original server.js
  cp $SERVICE_DIR/server.js $SERVICE_DIR/server.js.bak4
  
  # Add metrics import at the top of the file
  sed -i '1i const metrics = require(\'./utils/metrics\');' $SERVICE_DIR/server.js
  
  # Add metrics middleware after express initialization
  sed -i '/app.use(morgan/a app.use(metrics.httpMetricsMiddleware);' $SERVICE_DIR/server.js
  
  # Add metrics endpoint setup before routes
  sed -i '/app.use(.api.users/i // Setup metrics routes\nmetrics.setupMetricsRoutes(app);' $SERVICE_DIR/server.js
  
  echo "Metrics collection integration completed for $SERVICE_NAME"
  echo "---------------------------------------------------"
done

echo "Metrics collection integration completed for all services!"
```

### 3. Update Docker Compose with Volumes

Add the following volumes to docker-compose.yml:

```yaml
volumes:
  elasticsearch-data:
  prometheus-data:
  grafana-data:
```

## Dashboards and Visualizations

### Kibana Dashboards

1. Create a dashboard for service logs
2. Create visualizations for:
   - Log levels by service
   - Error rates
   - Request rates
   - Response times
   - Service health status

### Grafana Dashboards

1. Create a system overview dashboard
2. Create service-specific dashboards
3. Create visualizations for:
   - CPU and memory usage
   - Request rates and latencies
   - Error rates
   - Database connections
   - Message queue metrics
   - Custom service metrics

## Alerting

### Prometheus Alerting Rules

1. Create alerting rules for:
   - High error rates
   - Service unavailability
   - High CPU/memory usage
   - Slow response times
   - Disk space issues

### Alert Manager Configuration

1. Configure Alert Manager to send notifications via:
   - Email
   - Slack
   - PagerDuty
   - SMS

## Implementation Steps

1. Create the necessary configuration files
2. Update docker-compose.yml with logging and monitoring services
3. Create shared logging and metrics modules
4. Integrate logging and metrics with all microservices
5. Create Kibana and Grafana dashboards
6. Configure alerting rules and notifications
7. Test the logging and monitoring system
8. Document the setup and usage

## Conclusion

This centralized logging and monitoring implementation will provide comprehensive visibility into the Agrimaan microservices architecture. It will enable efficient troubleshooting, performance monitoring, and proactive alerting to ensure the platform's reliability and performance.