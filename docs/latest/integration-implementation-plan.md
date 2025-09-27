# Agrimaan Platform Integration Implementation Plan

This document outlines the detailed implementation plan for completing the remaining integration tasks for the Agrimaan microservices platform. Based on the analysis of the current project state, we'll focus on implementing service discovery, enhancing inter-service communication, and completing the remaining integration tasks.

## 1. Implementation Timeline

| Phase | Focus Area | Duration | Dependencies |
|-------|------------|----------|--------------|
| Phase 1 | Service Discovery Implementation | 1 week | None |
| Phase 2 | Inter-Service Communication Enhancement | 1 week | Service Discovery |
| Phase 3 | API Gateway Enhancement | 1 week | Service Discovery |
| Phase 4 | Testing and Documentation | 1 week | All previous phases |

## 2. Phase 1: Service Discovery Implementation (Week 1)

### Day 1-2: Setup and Configuration

#### Tasks:
1. Set up Consul server
   - Create consul-server directory and configuration
   - Create Dockerfile for Consul
   - Add Consul to docker-compose.yml
   - Configure Consul UI and API access

2. Create service registration module
   - Develop reusable service-registry.js module
   - Implement registration and deregistration methods
   - Add health check functionality
   - Create configuration options

#### Implementation Details:
```bash
# Create consul directory structure
mkdir -p microservices/consul-server/config

# Create Consul configuration
cat > microservices/consul-server/config/consul-config.json << EOF
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
EOF

# Create Dockerfile for Consul
cat > microservices/consul-server/Dockerfile << EOF
FROM consul:1.14

COPY ./config/consul-config.json /consul/config/consul-config.json

EXPOSE 8500 8600
EOF

# Update docker-compose.yml to include Consul
# This will be done by modifying the existing docker-compose.yml file
```

### Day 3-4: Service Integration

#### Tasks:
1. Create service discovery client
   - Develop service-discovery.js module
   - Implement service lookup functionality
   - Add caching for performance
   - Create retry and failover logic

2. Update one service as proof of concept
   - Integrate service registry in user-service
   - Add health check endpoint
   - Test registration and discovery
   - Document the integration process

#### Implementation Details:
```javascript
// service-registry.js
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

```javascript
// service-discovery.js
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

### Day 5: Testing and Documentation

#### Tasks:
1. Create test scripts for service discovery
   - Test service registration
   - Test service discovery
   - Test failover scenarios
   - Verify health checking

2. Document service discovery implementation
   - Create implementation guide
   - Document configuration options
   - Provide example usage
   - Create troubleshooting guide

#### Implementation Details:
```javascript
// test-service-discovery.js
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

## 3. Phase 2: Inter-Service Communication Enhancement (Week 2)

### Day 1-2: Resilience Patterns

#### Tasks:
1. Implement circuit breaker pattern
   - Create resilient-http-client.js module
   - Configure circuit breaker parameters
   - Add monitoring and logging
   - Test with simulated failures

2. Add retry mechanisms
   - Create retry utility
   - Configure retry parameters
   - Integrate with service clients
   - Test with temporary failures

#### Implementation Details:
```javascript
// resilient-http-client.js
const axios = require('axios');
const { circuitBreaker } = require('resilience4js');

class ResilientHttpClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 5000;
    this.retries = options.retries || 3;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout
    });
    
    // Create circuit breaker
    this.breaker = circuitBreaker.of('service-call', {
      failureRateThreshold: 50,
      waitDurationInOpenState: 10000,
      slidingWindowSize: 10,
      minimumNumberOfCalls: 5,
      permittedNumberOfCallsInHalfOpenState: 3,
      automaticTransitionFromOpenToHalfOpenEnabled: true
    });
    
    // Add listeners for circuit breaker events
    this.breaker.on('success', () => console.log('Request succeeded'));
    this.breaker.on('error', (error) => console.error('Request failed:', error));
    this.breaker.on('state_change', (state) => console.log(`Circuit state changed to: ${state}`));
  }
  
  async request(config) {
    const decoratedRequest = this.breaker.decorateFunction(async () => {
      try {
        const response = await this.client.request(config);
        return response.data;
      } catch (error) {
        if (error.response) {
          throw new Error(`Service returned error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
        } else if (error.request) {
          throw new Error('No response received from service');
        } else {
          throw new Error(`Request configuration error: ${error.message}`);
        }
      }
    });
    
    return decoratedRequest();
  }
  
  async get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  }
  
  async post(url, data, config = {}) {
    return this.request({ ...config, method: 'POST', url, data });
  }
  
  async put(url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data });
  }
  
  async delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  }
}

module.exports = ResilientHttpClient;
```

```javascript
// retry-util.js
async function retry(fn, options = {}) {
  const maxRetries = options.retries || 3;
  const delay = options.delay || 1000;
  const backoffFactor = options.backoffFactor || 2;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      lastError = error;
      
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(backoffFactor, attempt - 1);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

module.exports = { retry };
```

### Day 3-4: Message Queue Integration

#### Tasks:
1. Set up RabbitMQ
   - Add RabbitMQ to docker-compose.yml
   - Configure persistence and management UI
   - Set up exchanges and queues
   - Test basic messaging

2. Create messaging infrastructure
   - Develop message broker client
   - Create event publisher and subscriber
   - Implement event schemas and validation
   - Test with sample events

#### Implementation Details:
```javascript
// message-broker.js
const amqp = require('amqplib');

class MessageBroker {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.url = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
  }
  
  async connect() {
    if (this.connection) return;
    
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      // Handle connection close
      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.connection = null;
        this.channel = null;
        
        // Attempt to reconnect after delay
        setTimeout(() => this.connect(), 5000);
      });
      
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      // Retry connection after delay
      setTimeout(() => this.connect(), 5000);
    }
  }
  
  async createQueue(queue, options = {}) {
    if (!this.channel) await this.connect();
    return this.channel.assertQueue(queue, {
      durable: true,
      ...options
    });
  }
  
  async createExchange(exchange, type = 'topic', options = {}) {
    if (!this.channel) await this.connect();
    return this.channel.assertExchange(exchange, type, {
      durable: true,
      ...options
    });
  }
  
  async bindQueue(queue, exchange, routingKey) {
    if (!this.channel) await this.connect();
    return this.channel.bindQueue(queue, exchange, routingKey);
  }
  
  async publish(exchange, routingKey, message, options = {}) {
    if (!this.channel) await this.connect();
    
    const buffer = Buffer.from(JSON.stringify(message));
    
    return this.channel.publish(exchange, routingKey, buffer, {
      persistent: true,
      ...options,
      headers: {
        'x-correlation-id': global.requestContext?.correlationId || 'system-generated',
        ...options.headers
      }
    });
  }
  
  async sendToQueue(queue, message, options = {}) {
    if (!this.channel) await this.connect();
    
    const buffer = Buffer.from(JSON.stringify(message));
    
    return this.channel.sendToQueue(queue, buffer, {
      persistent: true,
      ...options,
      headers: {
        'x-correlation-id': global.requestContext?.correlationId || 'system-generated',
        ...options.headers
      }
    });
  }
  
  async consume(queue, callback, options = {}) {
    if (!this.channel) await this.connect();
    
    return this.channel.consume(queue, (msg) => {
      if (!msg) return;
      
      const content = JSON.parse(msg.content.toString());
      const correlationId = msg.properties.headers['x-correlation-id'];
      
      // Create a context with the correlation ID
      const context = { correlationId };
      
      // Execute callback with context
      Promise.resolve().then(() => {
        global.requestContext = context;
        return callback(content, msg);
      })
      .then(() => {
        this.channel.ack(msg);
      })
      .catch((err) => {
        console.error(`Error processing message: ${err.message}`);
        
        // Reject the message and requeue if specified
        const requeue = options.requeue !== false;
        this.channel.nack(msg, false, requeue);
      });
    }, options);
  }
  
  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.channel = null;
    this.connection = null;
  }
}

module.exports = new MessageBroker();
```

### Day 5: Request Tracing

#### Tasks:
1. Implement correlation ID middleware
   - Create correlation ID generation
   - Add middleware to all services
   - Propagate IDs between services
   - Test with multi-service requests

2. Enhance logging with correlation IDs
   - Update logging format
   - Add request context
   - Include correlation IDs in logs
   - Test with sample requests

#### Implementation Details:
```javascript
// correlation-id-middleware.js
const { v4: uuidv4 } = require('uuid');

function correlationIdMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
}

module.exports = correlationIdMiddleware;
```

```javascript
// request-context-middleware.js
const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

function requestContextMiddleware(req, res, next) {
  const context = {
    correlationId: req.correlationId,
    startTime: Date.now(),
    userId: req.user ? req.user.id : null
  };
  
  asyncLocalStorage.run(context, () => {
    global.requestContext = context;
    next();
  });
}

module.exports = { requestContextMiddleware, asyncLocalStorage };
```

## 4. Phase 3: API Gateway Enhancement (Week 3)

### Day 1-2: Dynamic Routing

#### Tasks:
1. Update API Gateway for service discovery
   - Integrate service discovery client
   - Create dynamic proxy middleware
   - Update route configuration
   - Test with multiple services

2. Add request validation
   - Create validation middleware
   - Define validation schemas
   - Add validation to routes
   - Test with valid and invalid requests

#### Implementation Details:
```javascript
// dynamic-proxy-middleware.js
const { createProxyMiddleware } = require('http-proxy-middleware');
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

module.exports = createDynamicProxy;
```

### Day 3-4: API Documentation and Monitoring

#### Tasks:
1. Add API documentation
   - Set up Swagger/OpenAPI
   - Document all endpoints
   - Add example requests and responses
   - Create interactive documentation UI

2. Implement request logging and monitoring
   - Create logging middleware
   - Add performance metrics
   - Set up monitoring endpoints
   - Test with sample traffic

#### Implementation Details:
```javascript
// swagger-config.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agrimaan API',
      version: '1.0.0',
      description: 'API documentation for the Agrimaan platform',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs),
};
```

```javascript
// logging-middleware.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: process.env.SERVICE_NAME || 'api-gateway' },
  transports: [
    new winston.transports.Console()
  ]
});

function requestLoggingMiddleware(req, res, next) {
  const start = Date.now();
  
  // Log request
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    correlationId: req.correlationId,
    userId: req.user?.id
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const logMethod = res.statusCode >= 400 ? 'error' : 'info';
    
    logger[logMethod]('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      correlationId: req.correlationId,
      userId: req.user?.id
    });
  });
  
  next();
}

module.exports = { logger, requestLoggingMiddleware };
```

### Day 5: Caching and Rate Limiting

#### Tasks:
1. Implement caching
   - Set up Redis for caching
   - Create cache middleware
   - Configure cache policies
   - Test with repeated requests

2. Enhance rate limiting
   - Create user-based rate limiting
   - Add IP-based rate limiting
   - Configure rate limit policies
   - Test with high-frequency requests

#### Implementation Details:
```javascript
// cache-middleware.js
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379
});

function cacheMiddleware(duration) {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Create a cache key based on the URL and any query parameters
    const cacheKey = `cache:${req.originalUrl}`;
    
    try {
      // Check if the response is cached
      const cachedResponse = await redis.get(cacheKey);
      
      if (cachedResponse) {
        // Return the cached response
        const response = JSON.parse(cachedResponse);
        res.set('X-Cache', 'HIT');
        return res.status(response.status).json(response.body);
      }
      
      // If not cached, capture the response
      const originalSend = res.send;
      res.send = function(body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const response = {
            status: res.statusCode,
            body: JSON.parse(body)
          };
          
          // Store in cache with expiration
          redis.set(cacheKey, JSON.stringify(response), 'EX', duration);
        }
        
        res.set('X-Cache', 'MISS');
        return originalSend.call(this, body);
      };
      
      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
}

module.exports = cacheMiddleware;
```

```javascript
// rate-limit-middleware.js
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379
});

function rateLimitMiddleware(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100, // limit each IP to 100 requests per windowMs
    keyGenerator = (req) => req.ip, // default to IP-based limiting
    message = 'Too many requests, please try again later.'
  } = options;
  
  return async (req, res, next) => {
    const key = `ratelimit:${keyGenerator(req)}`;
    
    try {
      // Get current count
      const current = await redis.get(key);
      
      // If key doesn't exist, create it with count 1 and expiration
      if (!current) {
        await redis.set(key, 1, 'PX', windowMs);
        
        // Set headers
        res.set('X-RateLimit-Limit', max);
        res.set('X-RateLimit-Remaining', max - 1);
        
        return next();
      }
      
      // Increment count
      const count = await redis.incr(key);
      
      // Set headers
      res.set('X-RateLimit-Limit', max);
      res.set('X-RateLimit-Remaining', Math.max(0, max - count));
      
      // If count exceeds limit, return 429
      if (count > max) {
        return res.status(429).json({ message });
      }
      
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next();
    }
  };
}

module.exports = rateLimitMiddleware;
```

## 5. Phase 4: Testing and Documentation (Week 4)

### Day 1-2: Integration Testing

#### Tasks:
1. Create integration test suite
   - Set up test environment
   - Create test data
   - Write service integration tests
   - Test end-to-end flows

2. Implement contract testing
   - Set up Pact for contract testing
   - Define service contracts
   - Create consumer tests
   - Create provider tests

#### Implementation Details:
```javascript
// integration-test.js
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');

describe('Service Integration Tests', () => {
  let mongoServer;
  let token;
  
  beforeAll(async () => {
    // Set up MongoDB memory server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    
    // Create test user and get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    token = response.body.token;
  });
  
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  describe('User-Field Service Integration', () => {
    it('should create a field for a user', async () => {
      // Create a field
      const fieldResponse = await request(app)
        .post('/api/fields')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Field',
          location: {
            type: 'Point',
            coordinates: [73.123, 19.456]
          },
          area: 5.5,
          soilType: 'Clay'
        });
      
      expect(fieldResponse.status).toBe(201);
      expect(fieldResponse.body).toHaveProperty('_id');
      
      const fieldId = fieldResponse.body._id;
      
      // Get user with fields
      const userResponse = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(userResponse.status).toBe(200);
      expect(userResponse.body.fields).toContain(fieldId);
    });
  });
});
```

### Day 3-4: Performance Testing and Monitoring

#### Tasks:
1. Set up performance testing
   - Create load test scripts
   - Configure test scenarios
   - Run baseline performance tests
   - Analyze and optimize performance

2. Implement monitoring and observability
   - Set up centralized logging
   - Configure metrics collection
   - Create monitoring dashboards
   - Set up alerts

#### Implementation Details:
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

// Simulate user behavior
export default function() {
  // Login
  const loginRes = http.post(`${__ENV.API_URL}/api/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => JSON.parse(r.body).token !== undefined,
  });
  
  const token = JSON.parse(loginRes.body).token;
  
  sleep(1);
  
  // Get fields
  const fieldsRes = http.get(`${__ENV.API_URL}/api/fields`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  check(fieldsRes, {
    'fields retrieved': (r) => r.status === 200,
    'fields is array': (r) => Array.isArray(JSON.parse(r.body)),
  });
  
  sleep(2);
}
```

### Day 5: Documentation and Finalization

#### Tasks:
1. Create comprehensive documentation
   - Document architecture
   - Document API endpoints
   - Create setup and deployment guides
   - Write troubleshooting guides

2. Finalize and review
   - Review all implementations
   - Run final tests
   - Update docker-compose.yml
   - Create deployment scripts

#### Implementation Details:
```markdown
# Agrimaan Platform Architecture Documentation

## Overview
The Agrimaan platform is a microservices-based agricultural management system designed to connect farmers, buyers, logistics providers, investors, and agronomists. The platform consists of 11 backend microservices and 6 frontend microservices, each responsible for specific business capabilities.

## Architecture Diagram
[Include architecture diagram here]

## Service Discovery
The platform uses Consul for service discovery, allowing services to find and communicate with each other without hardcoded endpoints.

### How It Works
1. Each service registers with Consul on startup
2. Services query Consul to find other services
3. Health checks ensure only healthy services are used
4. Load balancing is handled by the service discovery client

### Configuration
Services require the following environment variables:
- `CONSUL_HOST`: Hostname of the Consul server (default: consul-server)
- `CONSUL_PORT`: Port of the Consul server (default: 8500)

## Inter-Service Communication
Services communicate using both synchronous REST calls and asynchronous messaging.

### Synchronous Communication
- Uses HTTP/REST with JSON payloads
- Implements circuit breaker pattern for resilience
- Includes retry mechanisms for transient failures
- Propagates correlation IDs for request tracing

### Asynchronous Communication
- Uses RabbitMQ for reliable messaging
- Implements publish-subscribe pattern for events
- Uses message queues for task distribution
- Ensures at-least-once delivery semantics

## API Gateway
The API Gateway serves as the entry point for all client requests, routing them to the appropriate microservices.

### Features
- Dynamic service discovery integration
- Authentication and authorization
- Request validation
- Rate limiting
- Caching
- Request logging and monitoring
- API documentation

## Deployment
The platform is deployed using Docker and Docker Compose, with Kubernetes support for production environments.

### Prerequisites
- Docker and Docker Compose
- Node.js 16+
- MongoDB
- RabbitMQ
- Consul

### Deployment Steps
1. Clone the repository
2. Configure environment variables
3. Run `docker-compose up -d`
4. Access the API Gateway at http://localhost:3000
5. Access the Consul UI at http://localhost:8500

## Troubleshooting
Common issues and their solutions:

### Service Registration Failures
- Check Consul server is running
- Verify network connectivity between services and Consul
- Check service configuration

### Inter-Service Communication Failures
- Check service health in Consul
- Verify network connectivity between services
- Check circuit breaker status
- Review service logs for errors

### Message Queue Issues
- Verify RabbitMQ is running
- Check queue and exchange configurations
- Review message processing logs
- Check for queue backlog
```

## 6. Docker Compose Updates

To support the new integration features, the docker-compose.yml file needs to be updated with the following services:

```yaml
# Add to docker-compose.yml

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

rabbitmq:
  image: rabbitmq:3-management
  container_name: agrimaan-rabbitmq
  restart: always
  ports:
    - "5672:5672"
    - "15672:15672"
  environment:
    - RABBITMQ_DEFAULT_USER=agrimaan
    - RABBITMQ_DEFAULT_PASS=agrimaan123
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq
  networks:
    - agrimaan-network

redis:
  image: redis:6
  container_name: agrimaan-redis
  restart: always
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  networks:
    - agrimaan-network

# Add to volumes section
volumes:
  consul_data:
  rabbitmq_data:
  redis_data:
```

## 7. Environment Updates

Each service's environment configuration needs to be updated to include the new integration components:

```
# Add to each service's .env file

# Service Discovery
CONSUL_HOST=consul-server
CONSUL_PORT=8500
SERVICE_NAME=service-name
SERVICE_PORT=port-number

# Message Queue
RABBITMQ_URL=amqp://agrimaan:agrimaan123@rabbitmq:5672

# Caching
REDIS_HOST=redis
REDIS_PORT=6379

# Logging
LOG_LEVEL=info
```

## 8. Conclusion

This implementation plan provides a detailed roadmap for completing the remaining integration tasks for the Agrimaan microservices platform. By following this plan, the team will implement service discovery, enhance inter-service communication, improve the API gateway, and ensure comprehensive testing and documentation. The result will be a robust, resilient, and well-documented microservices architecture ready for production deployment.