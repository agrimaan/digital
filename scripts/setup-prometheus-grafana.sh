#!/bin/bash

# Script to set up Prometheus and Grafana for monitoring

# Set the working directory to the project root
cd "$(dirname "$0")/.."
WORKING_DIR=$(pwd)

echo "Setting up Prometheus and Grafana for monitoring..."
echo "Working directory: $WORKING_DIR"
echo

# Step 1: Create directories for Prometheus and Grafana configuration
echo "Creating directories for Prometheus and Grafana configuration..."
mkdir -p ./integration/monitoring/prometheus
mkdir -p ./integration/monitoring/grafana/provisioning/datasources
mkdir -p ./integration/monitoring/grafana/provisioning/dashboards
echo "Directories created!"
echo

# Step 2: Create Prometheus configuration
echo "Creating Prometheus configuration..."
cat > ./integration/monitoring/prometheus/prometheus.yml << 'EOL'
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
EOL
echo "Prometheus configuration created!"
echo

# Step 3: Create Grafana datasource configuration
echo "Creating Grafana datasource configuration..."
cat > ./integration/monitoring/grafana/provisioning/datasources/datasource.yml << 'EOL'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
EOL
echo "Grafana datasource configuration created!"
echo

# Step 4: Create Grafana dashboard configuration
echo "Creating Grafana dashboard configuration..."
cat > ./integration/monitoring/grafana/provisioning/dashboards/dashboard.yml << 'EOL'
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /var/lib/grafana/dashboards
EOL
echo "Grafana dashboard configuration created!"
echo

# Step 5: Create shared metrics module
echo "Creating shared metrics module..."
mkdir -p ./shared/metrics
cat > ./shared/metrics/index.js << 'EOL'
/**
 * Shared Metrics Module
 * 
 * This module provides metrics collection for microservices.
 */

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
EOL
echo "Shared metrics module created!"
echo

# Step 6: Update shared package.json
echo "Updating shared package.json..."
if [ -f ./shared/package.json ]; then
  # Check if prom-client is already in dependencies
  if ! grep -q "prom-client" ./shared/package.json; then
    # Use sed to add the dependency before the last closing brace
    sed -i '/}$/i \  "prom-client": "^14.1.0",' ./shared/package.json
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
    "prom-client": "^14.1.0"
  }
}
EOL
fi
echo "Shared package.json updated!"
echo

# Step 7: Create script to integrate metrics with all microservices
echo "Creating script to integrate metrics with all microservices..."
cat > ./scripts/integrate-metrics.sh << 'EOL'
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
  cat > "$UTILS_DIR/metrics.js" << EOF
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
EOF
  
  # Update server.js to use the metrics
  echo "Updating server.js to use metrics..."
  
  # Create a backup of the original server.js
  cp $SERVICE_DIR/server.js $SERVICE_DIR/server.js.bak_metrics
  
  # Add metrics import at the top of the file
  sed -i '1i const metrics = require(\'./utils/metrics\');' $SERVICE_DIR/server.js
  
  # Add metrics middleware after express initialization
  sed -i '/app.use(morgan/a app.use(metrics.httpMetricsMiddleware);' $SERVICE_DIR/server.js
  
  # Add metrics endpoint setup before routes
  ROUTES_LINE=$(grep -n "app.use(.api" $SERVICE_DIR/server.js | head -1 | cut -d':' -f1)
  if [ -n "$ROUTES_LINE" ]; then
    # Insert metrics routes setup before the first route
    sed -i "${ROUTES_LINE}i // Setup metrics routes\nmetrics.setupMetricsRoutes(app);\n" $SERVICE_DIR/server.js
  else
    echo "Could not find routes in server.js for $SERVICE_NAME"
  fi
  
  echo "Metrics collection integration completed for $SERVICE_NAME"
  echo "---------------------------------------------------"
done

echo "Metrics collection integration completed for all services!"
EOL
chmod +x ./scripts/integrate-metrics.sh
echo "Script to integrate metrics created!"
echo

# Step 8: Update docker-compose.yml with Prometheus and Grafana services
echo "Creating Docker Compose file for Prometheus and Grafana..."
cat > ./docker-compose.monitoring.yml << 'EOL'
version: '3.8'

services:
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
  prometheus-data:
  grafana-data:

networks:
  agrimaan-network:
    external: true
EOL
echo "Docker Compose file for Prometheus and Grafana created!"
echo

# Step 9: Create a sample Grafana dashboard
echo "Creating a sample Grafana dashboard..."
mkdir -p ./integration/monitoring/grafana/dashboards
cat > ./integration/monitoring/grafana/dashboards/microservices-dashboard.json << 'EOL'
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 1,
  "links": [],
  "panels": [
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 2,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.7",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "sum(rate(http_requests_total[1m])) by (instance)",
          "interval": "",
          "legendFormat": "{{instance}}",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "HTTP Request Rate",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "short",
          "label": "Requests / Second",
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    },
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 4,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.7",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_ms_bucket[5m])) by (le, instance))",
          "interval": "",
          "legendFormat": "{{instance}}",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "HTTP Request Duration (95th Percentile)",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "ms",
          "label": "Duration",
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    },
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 8
      },
      "hiddenSeries": false,
      "id": 6,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.7",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "sum(active_connections) by (instance)",
          "interval": "",
          "legendFormat": "{{instance}}",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Active Connections",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "short",
          "label": "Connections",
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    },
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 8
      },
      "hiddenSeries": false,
      "id": 8,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.7",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{status=~&quot;5..&quot;}[1m])) by (instance) / sum(rate(http_requests_total[1m])) by (instance)",
          "interval": "",
          "legendFormat": "{{instance}}",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Error Rate",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "percentunit",
          "label": "Error Rate",
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    }
  ],
  "schemaVersion": 26,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "Microservices Dashboard",
  "uid": "microservices",
  "version": 1
}
EOL
echo "Sample Grafana dashboard created!"
echo

echo "Prometheus and Grafana setup completed!"
echo
echo "Next steps:"
echo "1. Run './scripts/integrate-metrics.sh' to integrate metrics collection with all microservices"
echo "2. Run 'docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d' to start the Prometheus and Grafana services"
echo "3. Access Prometheus at http://localhost:9090 to query metrics"
echo "4. Access Grafana at http://localhost:3000 to view dashboards (default credentials: admin/admin)"
echo