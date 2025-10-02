const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
// Import service discovery components

// Import routes
const notificationRoutes = require('./routes/notificationRoutes');
const templateRoutes = require('./routes/templateRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const channelRoutes = require('./routes/channelRoutes');

// Import utilities
const logger = require('./utils/logger');
const { notFoundHandler } = require('./utils/errorHandler');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3010;

// Security middleware
app.use(helmet());


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: logger.stream }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('MongoDB connected successfully');
})
.catch(err => {
  logger.error(`MongoDB connection error: ${err.message}`);
  process.exit(1);
});

// Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/channels', channelRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    service: 'notification-service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Agrimaan Notification Service',
    version: '1.0.0',
    endpoints: [
      '/api/notifications',
      '/api/templates',
      '/api/preferences',
      '/api/channels',
      '/health'
    ]
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error(`Error: ${message}`, { 
    url: req.originalUrl,
    method: req.method,
    statusCode,
    stack: err.stack
  });
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Notification service running on port ${PORT}`);

  // Register service with Consul
  const serviceRegistry = new ServiceRegistry({
    serviceName: process.env.SERVICE_NAME || 'notification-service',
    servicePort: PORT,
    tags: ['api'],
    healthCheckUrl: '/health',
    healthCheckInterval: '15s'
  });
  
  serviceRegistry.register()
    .then(() => {
      console.log('Service registered with Consul');
      // Setup graceful shutdown to deregister service
      serviceRegistry.setupGracefulShutdown(server);
    })
    .catch(err => {
      console.error('Failed to register service with Consul:', err);
    });
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  
  // Exit with failure
  process.exit(1);
});

module.exports = app; // For testing purposes