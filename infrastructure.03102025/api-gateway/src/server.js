const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { v4: uuidv4 } = require('uuid');
const routes = require('./routes');
require('dotenv').config();

// Import service registry
//const ServiceRegistry = require('../../../shared/service-discovery/service-registry');
const { ServiceRegistry } = require('@agrimaan/shared').serviceDiscovery

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 150 * 60 * 1000, // 150 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all requests
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// Apply routes
routes(app);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  
  // Register service with Consul
  const serviceRegistry = new ServiceRegistry({
    serviceName: 'api-gateway',
    servicePort: PORT,
    tags: ['gateway', 'api'],
    healthCheckUrl: '/health'
  });
  
  serviceRegistry.register()
    .then(() => {
      console.log('API Gateway registered with Consul');
      
      // Setup graceful shutdown
      serviceRegistry.setupGracefulShutdown(server);
    })
    .catch(err => {
      console.error('Failed to register with Consul:', err);
    });
});

// Add correlation ID middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
});

module.exports = app; // For testing purposes