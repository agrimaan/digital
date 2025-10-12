const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const { ServiceRegistry, healthCheck } = require('@agrimaan/shared/service-discovery');
const { createLogger } = require('@agrimaan/shared/logging');

const SERVICE_NAME = process.env.SERVICE_NAME || 'marketplace-service';
const logger = createLogger({ serviceName: SERVICE_NAME });

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
// app.use(healthCheck); // Commented out - causing middleware error

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connection error:', { error: err.message }));

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: SERVICE_NAME || 'marketplace-service',
    timestamp: new Date().toISOString()
  });
});
app.use('/api/marketplace/products', require('./routes/productRoutes'));
app.use('/api/marketplace/orders', require('./routes/orderRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { error: err.stack });
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Marketplace service running on port ${PORT}`);

  const serviceRegistry = new ServiceRegistry({
    serviceName: SERVICE_NAME,
    servicePort: PORT,
    healthCheckUrl: '/health',
  });

  serviceRegistry.register()
    .then(() => {
      logger.info('Service registered with Consul');
      serviceRegistry.setupGracefulShutdown(server);
    })
    .catch(err => {
      logger.error('Failed to register service with Consul:', { error: err.message });
      process.exit(1);
    });
});

module.exports = app;