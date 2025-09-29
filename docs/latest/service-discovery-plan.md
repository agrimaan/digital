# Service Discovery Implementation Plan for Agrimaan Platform

## Overview
Service discovery is a critical component in a microservices architecture that allows services to find and communicate with each other without hardcoded endpoints. This plan outlines the steps to implement service discovery for the Agrimaan platform.

## 1. Service Discovery Solution Selection

### Options Analysis
1. **Consul**
   - Pros: Feature-rich, includes health checking, KV store, service mesh capabilities
   - Cons: More complex setup, higher resource usage
   - Best for: Larger deployments with complex service discovery needs

2. **Eureka**
   - Pros: Simple to set up, well-integrated with Spring Cloud
   - Cons: Less feature-rich than Consul, primarily for JVM-based services
   - Best for: Java/Spring-based microservices

3. **etcd**
   - Pros: Lightweight, distributed key-value store, used by Kubernetes
   - Cons: Requires additional components for full service discovery
   - Best for: Kubernetes-based deployments

4. **ZooKeeper**
   - Pros: Mature, reliable, used by many large-scale systems
   - Cons: More complex, primarily designed for different use case
   - Best for: Systems already using ZooKeeper for other purposes

### Recommended Solution
For the Agrimaan platform, **Consul** is recommended due to:
- Support for non-JVM services (our services are Node.js based)
- Built-in health checking capabilities
- Service mesh features for future expansion
- Good Docker/Kubernetes integration
- Active community and development

## 2. Implementation Steps

### 2.1 Set Up Consul Server
1. Create a new directory for Consul configuration:
```bash
mkdir -p microservices/consul-server
```

2. Create a Dockerfile for Consul:
```dockerfile
FROM consul:1.14

COPY ./config/consul-config.json /consul/config/consul-config.json

EXPOSE 8500 8600
```

3. Create configuration file:
```json
{
  "server": true,
  "bootstrap_expect": 1,
  "data_dir": "/consul/data",
  "client_addr": "0.0.0.0",
  "ui_config": {
    "enabled": true
  },
  "service": {
    "name": "consul-server",
    "tags": ["agrimaan"]
  }
}
```

4. Add Consul to docker-compose.yml:
```yaml
consul-server:
  build: ./consul-server
  container_name: agrimaan-consul
  restart: always
  ports:
    - "8500:8500"
    - "8600:8600/udp"
  volumes:
    - consul_data:/consul/data
  networks:
    - agrimaan-network
```

### 2.2 Integrate Consul with Node.js Services

1. Install required packages in each service:
```bash
npm install consul node-consul-config
```

2. Create a service registration module (service-registry.js) for each service:
```javascript
const Consul = require('consul');
const os = require('os');

class ServiceRegistry {
  constructor(options) {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'consul-server',
      port: process.env.CONSUL_PORT || '8500'
    });
    
    this.serviceName = options.serviceName;
    this.serviceId = `${this.serviceName}-${os.hostname()}-${options.servicePort}`;
    this.servicePort = options.servicePort;
    this.tags = options.tags || [];
    this.healthCheckUrl = options.healthCheckUrl || `/health`;
    this.healthCheckInterval = options.healthCheckInterval || '15s';
  }

  register() {
    const serviceDefinition = {
      id: this.serviceId,
      name: this.serviceName,
      address: os.hostname(),
      port: parseInt(this.servicePort),
      tags: this.tags,
      check: {
        http: `http://${os.hostname()}:${this.servicePort}${this.healthCheckUrl}`,
        interval: this.healthCheckInterval,
        timeout: '5s'
      }
    };

    return new Promise((resolve, reject) => {
      this.consul.agent.service.register(serviceDefinition, (err) => {
        if (err) {
          return reject(err);
        }
        console.log(`Service registered: ${this.serviceId}`);
        resolve();
      });
    });
  }

  deregister() {
    return new Promise((resolve, reject) => {
      this.consul.agent.service.deregister(this.serviceId, (err) => {
        if (err) {
          return reject(err);
        }
        console.log(`Service deregistered: ${this.serviceId}`);
        resolve();
      });
    });
  }
}

module.exports = ServiceRegistry;
```

3. Implement service discovery client (service-discovery.js):
```javascript
const Consul = require('consul');

class ServiceDiscovery {
  constructor() {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'consul-server',
      port: process.env.CONSUL_PORT || '8500'
    });
    this.cache = {};
    this.cacheTimeout = 10000; // 10 seconds
  }

  async getServiceUrl(serviceName) {
    // Check cache first
    const now = Date.now();
    if (this.cache[serviceName] && this.cache[serviceName].timestamp > now - this.cacheTimeout) {
      return this.cache[serviceName].url;
    }

    return new Promise((resolve, reject) => {
      this.consul.catalog.service.nodes(serviceName, (err, result) => {
        if (err) {
          return reject(err);
        }
        
        if (!result || result.length === 0) {
          return reject(new Error(`Service ${serviceName} not found`));
        }
        
        // Simple load balancing - random selection
        const service = result[Math.floor(Math.random() * result.length)];
        const url = `http://${service.ServiceAddress}:${service.ServicePort}`;
        
        // Update cache
        this.cache[serviceName] = {
          url,
          timestamp: now
        };
        
        resolve(url);
      });
    });
  }
}

module.exports = ServiceDiscovery;
```

### 2.3 Integrate with API Gateway

1. Update API Gateway to use service discovery:
```javascript
const ServiceDiscovery = require('./service-discovery');
const discovery = new ServiceDiscovery();

// Example of dynamic proxy middleware
const createDynamicProxy = (serviceName, pathPrefix) => {
  return async (req, res, next) => {
    try {
      const serviceUrl = await discovery.getServiceUrl(serviceName);
      const proxy = createProxyMiddleware({
        target: serviceUrl,
        changeOrigin: true,
        pathRewrite: {
          [`^${pathPrefix}`]: ''
        },
        onError: handleProxyError
      });
      
      return proxy(req, res, next);
    } catch (error) {
      console.error(`Service discovery error for ${serviceName}:`, error);
      return res.status(503).json({
        message: 'Service unavailable',
        error: 'The requested service is currently unavailable. Please try again later.'
      });
    }
  };
};

// Example usage in routes.js
app.use('/api/users', createDynamicProxy('user-service', '/api/users'));
```

### 2.4 Update Service Startup Scripts

1. Modify each service's server.js to register with Consul:
```javascript
const ServiceRegistry = require('./service-registry');

// Initialize Express app and other configurations...

const PORT = process.env.PORT || 3002;
const app = express();

// Configure middleware, routes, etc.

// Start server and register with Consul
app.listen(PORT, async () => {
  console.log(`Service running on port ${PORT}`);
  
  const registry = new ServiceRegistry({
    serviceName: 'user-service',
    servicePort: PORT,
    tags: ['api', 'user', 'auth'],
    healthCheckUrl: '/health'
  });
  
  try {
    await registry.register();
    console.log('Service registered with Consul');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await registry.deregister();
        console.log('Service deregistered from Consul');
        process.exit(0);
      } catch (error) {
        console.error('Error deregistering service:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error registering service with Consul:', error);
  }
});
```

### 2.5 Add Health Check Endpoints

1. Implement a health check endpoint in each service:
```javascript
app.get('/health', (req, res) => {
  // Check database connection
  const dbHealthy = checkDatabaseConnection();
  
  // Check other dependencies
  const dependenciesHealthy = checkDependencies();
  
  if (dbHealthy && dependenciesHealthy) {
    return res.status(200).json({
      status: 'UP',
      service: 'user-service',
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(503).json({
    status: 'DOWN',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    details: {
      database: dbHealthy ? 'UP' : 'DOWN',
      dependencies: dependenciesHealthy ? 'UP' : 'DOWN'
    }
  });
});
```

## 3. Update Docker Compose Configuration

1. Update environment variables in docker-compose.yml for all services:
```yaml
environment:
  - CONSUL_HOST=localhost
  - CONSUL_PORT=8500
```

2. Add volume for Consul data:
```yaml
volumes:
  consul_data:
```

## 4. Testing Service Discovery

1. Create a test script to verify service discovery:
```javascript
const ServiceDiscovery = require('./service-discovery');

async function testServiceDiscovery() {
  const discovery = new ServiceDiscovery();
  
  try {
    // Test discovering user service
    const userServiceUrl = await discovery.getServiceUrl('user-service');
    console.log('User Service URL:', userServiceUrl);
    
    // Test discovering field service
    const fieldServiceUrl = await discovery.getServiceUrl('field-service');
    console.log('Field Service URL:', fieldServiceUrl);
    
    // Test non-existent service
    try {
      const nonExistentUrl = await discovery.getServiceUrl('non-existent-service');
      console.log('Non-existent Service URL (should not reach here):', nonExistentUrl);
    } catch (error) {
      console.log('Expected error for non-existent service:', error.message);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testServiceDiscovery();
```

## 5. Monitoring and Dashboard

1. Access the Consul UI dashboard at http://localhost:8500
2. Monitor service health and availability
3. Use the KV store for configuration if needed

## 6. Future Enhancements

1. Implement service mesh capabilities with Consul Connect
2. Add automatic failover for critical services
3. Implement distributed configuration management
4. Add service segmentation for enhanced security