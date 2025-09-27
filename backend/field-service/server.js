const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
\n// Import service discovery components
const { ServiceRegistry, healthCheck } = require('@agrimaan/shared/service-discovery');

// Import routes
const fieldRoutes = require('./routes/fieldRoutes');
const soilRoutes = require('./routes/soilRoutes');
const boundaryRoutes = require('./routes/boundaryRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
\n// Add health check middleware
app.use(healthCheck({
  serviceName: 'field-service',
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
app.use('/api/fields', fieldRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/boundaries', boundaryRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'field-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Field service running on port ${PORT}`);

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
});

module.exports = app; // For testing purposes