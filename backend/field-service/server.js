const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// const { ServiceRegistry, healthCheck } = require('@agrimaan/shared/service-discovery');
// const { createLogger } = require('@agrimaan/shared/logging');

const SERVICE_NAME = process.env.SERVICE_NAME || 'field-service';
// Using console.log for development instead of shared logger
const logger = {
  info: (msg, meta = {}) => console.log(`[${SERVICE_NAME}] ${msg}`, meta),
  error: (msg, meta = {}) => console.error(`[${SERVICE_NAME}] ${msg}`, meta),
  warn: (msg, meta = {}) => console.warn(`[${SERVICE_NAME}] ${msg}`, meta)
};

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
//app.use(healthCheck);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connection error:', { error: err.message }));

// Routes
app.use('/api/fields', require('./routes/fieldRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { error: err.stack });
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Field service running on port ${PORT}`);

  // ServiceRegistry disabled for development
  // const serviceRegistry = new ServiceRegistry({
  //   serviceName: SERVICE_NAME,
  //   servicePort: PORT,
  //   healthCheckUrl: '/health',
  // });

  // serviceRegistry.register()
  //   .then(() => {
  //     logger.info('Service registered with Consul');
  //     serviceRegistry.setupGracefulShutdown(server);
  //   })
  //   .catch(err => {
  //     logger.error('Failed to register service with Consul:', { error: err.message });
  //     process.exit(1);
  //   });
});

module.exports = app;