const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const ServiceRegistry = require('../shared/service-registry');
const createHealthCheck = require('../shared/health-check');
require('dotenv').config();
\n// Import service discovery components
const { ServiceRegistry, healthCheck } = require('@agrimaan/shared/service-discovery');

// Import routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
\n// Add health check middleware
app.use(healthCheck({
  serviceName: 'user-service',
  dependencies: {
    database: async () => {
      return mongoose.connection.readyState === 1;
    }
  }
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', createHealthCheck({
  serviceName: 'user-service',
  checkMongoDB: true
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
const server = const server = app.listen(PORT, async () => {
  console.log(`User service running on port ${PORT}`);

  // Register service with Consul
  const serviceRegistry = new ServiceRegistry({
    serviceName: '""$SERVICE_NAME""',
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
  
  // Register with Consul
  const registry = new ServiceRegistry({
    serviceName: process.env.SERVICE_NAME || 'user-service',
    servicePort: PORT,
    tags: ['api', 'user', 'auth'],
    healthCheckUrl: '/health'
  });
  
  try {
    await registry.register();
    console.log('Service registered with Consul');
    
    // Setup graceful shutdown
    registry.setupGracefulShutdown();
  } catch (error) {
    console.error('Failed to register with Consul:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app; // For testing purposes
