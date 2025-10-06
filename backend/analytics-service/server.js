const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Corrected import for ServiceRegistry and healthCheck
const { ServiceRegistry, healthCheck } = require('@agrimaan/shared/service-discovery');

// Corrected import for the createLogger function
const { createLogger } = require('@agrimaan/shared/logging');

// 1. Initialize the logger for this specific service
const logger = createLogger({ serviceName: process.env.SERVICE_NAME || 'analytics-service' });

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(cors());
app.use(express.json());

// 2. Configure morgan to use the winston logger's stream
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// 3. Use healthCheck middleware directly
// app.use(healthCheck); // Commented out - causing middleware error

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connection error:', { error: err.message }));

// --- Your Service-Specific Routes Would Go Here ---
// Example: app.use('/api/analytics', require('./routes/analyticsRoutes'));


// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { error: err.stack });
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Analytics service running on port ${PORT}`);

  // 4. Instantiate ServiceRegistry correctly
  const serviceRegistry = new ServiceRegistry({
    serviceName: process.env.SERVICE_NAME || 'analytics-service', // Corrected service name
    servicePort: PORT,
    healthCheckUrl: '/health',
  });

  serviceRegistry.register()
    .then(() => {
      logger.info('Service registered with Consul');
      // Setup graceful shutdown to deregister service
      serviceRegistry.setupGracefulShutdown(server);
    })
    .catch(err => {
      logger.error('Failed to register service with Consul:', { error: err.message });
      // Exit if registration fails, as the service cannot be discovered
      process.exit(1);
    });
});

module.exports = app; // For testing purposes